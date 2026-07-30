/**
 * HAIRBYBELLES — booking request notifier + approval workflow.
 *
 * This file is not run by the Next.js app. It is the source of truth for what
 * gets pasted into Google Apps Script.
 *
 * WHAT THIS DOES
 *  1. A request arrives from the site's reservation form, carrying a date and
 *     a start time. It is logged to a Sheet, the client gets an immediate
 *     acknowledgement, and the studio gets a notification listing everything
 *     else already on the calendar that day.
 *  2. That notification carries one link, which opens the booking for review:
 *     full details, then Approve or Decline. See the comment on doGet for why
 *     the buttons there submit a POST rather than being links in the email.
 *  3. Approving puts a real timed block on the calendar and emails the client
 *     the deposit details. The studio then gets a short follow-up with the
 *     same review link, so the deposit can be marked received whenever it
 *     turns up in Zelle, Cash App or Apple Pay.
 *
 * THE ONE MANUAL STEP, AND WHY IT CANNOT GO AWAY
 *  None of Zelle, Cash App or Apple Pay exposes an API, so no software can
 *  detect that a deposit arrived. Marking it received is therefore a human
 *  looking at a phone. Everything either side of that is automatic. Removing
 *  it would mean taking deposits by card instead.
 *
 * SETUP
 *  1. Create the script either way, from inside a Google Sheet
 *     (Extensions > Apps Script) or standalone at script.google.com. If it is
 *     standalone, the script creates its own log spreadsheet on the first
 *     request and puts it in the same account's Drive.
 *  2. Delete the placeholder code and paste this in.
 *  3. IMPORTANT: create this script while logged into the SAME Google account
 *     as OWNER_EMAIL below. Calendar blocking uses whichever account runs the
 *     script, so if that is a different account, bookings land on a calendar
 *     nobody is looking at.
 *  4. Save, then Deploy > New deployment.
 *  5. Click the gear beside "Select type" and choose Web app.
 *       Execute as:      Me
 *       Who has access:  Anyone
 *  6. Deploy, then authorise. Google shows an "unverified app" warning because
 *     the script is your own and unpublished — choose Advanced, then
 *     "Go to ... (unsafe)", then Allow. That is expected here.
 *  7. Copy the deployment URL ending in /exec and set it as
 *     NEXT_PUBLIC_GAS_WEB_APP_URL in Vercel (Settings > Environment
 *     Variables), then redeploy the site.
 *
 * IF YOU EVER EDIT THIS SCRIPT
 *  Deploy > Manage deployments > pencil icon > Version: New version > Deploy.
 *  Without that step the old code keeps serving and nothing appears to change.
 */

var OWNER_EMAIL = "Adedijikikelomo@gmail.com";
var STUDIO_NAME = "HAIRBYBELLES";

// The studio is in Garland, Texas. Never derive this from the script's own
// account locale, which is set elsewhere and put West Africa Time in front of
// Texas clients.
var STUDIO_TIMEZONE = "America/Chicago";

var DEPOSIT_AMOUNT = 30;
var ZELLE_HANDLE = "(832) 207-6324";
var CASHAPP_HANDLE = "$Thebellesempire";
var APPLE_PAY_HANDLE = "@Hairbybelles_16";

/**
 * Column order is load-bearing: rows are written as a positional array and
 * read back by looking the header name up in this list. "Start time" is
 * therefore appended at the end rather than slotted in next to "Preferred
 * date", where it reads more naturally. Inserting it mid-list would shift
 * Status and Token one column to the right for every row already in the sheet,
 * so every pending booking would suddenly read its token out of the wrong
 * cell. Appending leaves existing rows correct, with an empty time.
 */
var SHEET_HEADERS = [
  "Received",
  "Name",
  "Email",
  "Phone",
  "Service",
  "Preferred date",
  "Notes",
  "Status",
  "Token",
  "Start time",
];

var STATUS_PENDING = "Pending";
var STATUS_APPROVED = "Approved — awaiting deposit";
var STATUS_CONFIRMED = "Confirmed";
var STATUS_DECLINED = "Declined";

// Brand palette, matching the site.
var INK_PLUM = "#1E1220";
var BONE = "#FBF3F0";
var BLUSH = "#F7E4EA";
var MAGENTA = "#B3125F";
var ROSE_POP = "#FF9DBD";
var GOLD = "#C9A24B";
var RULE = "#EADFE2";
var MUTED = "#8A7176";

/* ================================================================== */
/* Form submission                                                     */
/* ================================================================== */

/**
 * Two very different things arrive here: a booking request from the website
 * form, and an approve/decline/mark-paid button pressed on the review page.
 * They are told apart by the presence of an action, since only the review page
 * sends one.
 */
function doPost(e) {
  var params = (e && e.parameter) || {};

  if (params.action) {
    if (!params.token) {
      return htmlPage(
        "Nothing to act on",
        "<p>That request was missing its booking reference.</p>"
      );
    }
    var actionRow = findRowByToken(params.token);
    if (!actionRow) {
      return htmlPage(
        "Link not recognised",
        "<p>This link does not match a booking we have on file.</p>"
      );
    }
    return handleAction(params.action, readBooking(actionRow));
  }

  return handleFormSubmission(params);
}

function handleFormSubmission(data) {
  var received = new Date();
  var token = Utilities.getUuid();

  try {
    logToSheet(received, data, token);
  } catch (err) {
    console.error("Could not write to the request log: " + err);
  }

  var calendarNote = "";
  try {
    calendarNote = describeCalendarConflict(data.date);
  } catch (err) {
    console.error("Could not check the calendar: " + err);
  }

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    // Replying to the notification replies straight to the client.
    replyTo: data.email || OWNER_EMAIL,
    name: STUDIO_NAME + " website",
    subject: buildSubject(data),
    body: buildOwnerPlainBody(received, data, calendarNote, token),
    htmlBody: buildOwnerHtmlBody(received, data, calendarNote, token),
  });

  // The client used to get nothing at all. This is not a confirmed booking
  // yet, only proof the request arrived.
  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "We have your booking request",
      body: buildAckPlainBody(data),
      htmlBody: buildAckHtmlBody(data),
    });
  }

  return ContentService.createTextOutput("OK");
}

function buildSubject(data) {
  var who = data.name || "Someone";
  return data.service
    ? "New booking request: " + who + ", " + data.service
    : "New booking request: " + who;
}

/* ================================================================== */
/* Reviewing and actioning a booking                                   */
/* ================================================================== */

/**
 * Every click from the studio's email lands here, and nothing on this path
 * ever changes a booking.
 *
 * That restraint is deliberate. Some mail clients, Outlook Safe Links and
 * several corporate scanners among them, fetch the links inside a message
 * before any human opens it. A GET that mutated state would let one of those
 * scanners approve or decline a real booking on its own. So a GET only ever
 * renders the booking for review, and the buttons on that page submit a POST,
 * which scanners do not do.
 *
 * The upside is that the old two-step "are you sure" page is gone. That step
 * only existed to protect a mutating GET, so moving the mutation to POST
 * removes the reason for it: one click in the inbox, one click to act.
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var token = params.token;

  if (!token) {
    return htmlPage(
      "Nothing to review",
      "<p>This link is missing its booking reference.</p>"
    );
  }

  var row = findRowByToken(token);
  if (!row) {
    return htmlPage(
      "Link not recognised",
      "<p>This link does not match a booking we have on file. It may have been " +
        "removed from the sheet, or the link may have been cut short by your " +
        "email program.</p>"
    );
  }

  return managePage(readBooking(row));
}

/**
 * Everything about one booking, read in a single pass. Handlers took eight
 * positional arguments before this, which made adding the start time an
 * exercise in counting commas.
 */
function readBooking(row) {
  return {
    rowIndex: row.rowIndex,
    name: rowValue(row, "Name") || "this client",
    service: rowValue(row, "Service") || "",
    date: rowValue(row, "Preferred date") || "",
    time: rowValue(row, "Start time") || "",
    email: rowValue(row, "Email") || "",
    phone: rowValue(row, "Phone") || "",
    notes: rowValue(row, "Notes") || "",
    status: rowValue(row, "Status") || STATUS_PENDING,
    token: rowValue(row, "Token"),
  };
}

/** Routes an action submitted from the review page. */
function handleAction(action, booking) {
  if (action === "approve") return handleApprove(booking);
  if (action === "paid") return handleMarkPaid(booking);
  if (action === "decline") return handleDecline(booking);
  return htmlPage(
    "Unknown action",
    "<p>That is not something this page knows how to do.</p>"
  );
}

function handleApprove(booking) {
  if (booking.status !== STATUS_PENDING) {
    return alreadyHandledPage(booking);
  }

  // A real timed block rather than an all-day banner, now that a start time is
  // collected. It runs the full six hours because that is the longest a set
  // takes, and an over-long block is harmless here: capacity is not rationed,
  // so this shapes her own view of the day rather than gating other bookings.
  try {
    var start = toStartDate(booking.date, booking.time);
    var title = "Booked: " + booking.name + (booking.service ? ", " + booking.service : "");
    var calendar = CalendarApp.getDefaultCalendar();

    if (start) {
      var end = new Date(start.getTime());
      end.setHours(end.getHours() + LONGEST_SERVICE_HOURS);
      calendar.createEvent(title, start, end, {
        description:
          booking.name + " booked " + (booking.service || "an appointment") +
          " through the website. Allow " + SHORTEST_SERVICE_HOURS + " to " +
          LONGEST_SERVICE_HOURS + " hours depending on length." +
          (booking.email ? "\n\nContact: " + booking.email : "") +
          (booking.phone ? "\nPhone: " + booking.phone : ""),
      });
    } else {
      var dayOnly = parseDateOnly(booking.date);
      if (dayOnly) calendar.createAllDayEvent(title, dayOnly);
    }
  } catch (err) {
    console.error("Could not create the calendar event: " + err);
  }

  setRowStatus(booking.rowIndex, STATUS_APPROVED);

  if (booking.email) {
    MailApp.sendEmail({
      to: booking.email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "Your appointment is approved, just the deposit left",
      body: buildDepositPlainBody(booking),
      htmlBody: buildDepositHtmlBody(booking),
    });
  }

  // A short receipt back to the studio carrying the review link, so the deposit
  // can be marked off days later without digging out the original request.
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    name: STUDIO_NAME + " website",
    subject: "Approved: " + booking.name + (booking.service ? ", " + booking.service : ""),
    body: buildOwnerReceiptPlain(booking),
    htmlBody: buildOwnerReceiptHtml(booking),
  });

  return resultPage(
    "Approved",
    esc(booking.name) + " has been emailed the deposit instructions, and " +
      esc(formatWhen(booking.date, booking.time) || "the date") +
      " is now on your calendar. When the deposit arrives, open the booking " +
      "again from the follow-up email to mark it received.",
    booking
  );
}

function handleMarkPaid(booking) {
  if (booking.status === STATUS_CONFIRMED) {
    return resultPage(
      "Already confirmed",
      esc(booking.name) + " has already had their confirmation, so nothing changed.",
      booking
    );
  }
  if (booking.status !== STATUS_APPROVED) {
    return resultPage(
      "Not ready for that yet",
      "This booking is currently marked <strong>" + esc(booking.status) +
        "</strong>, so there is no deposit outstanding on it. Approve it first " +
        "if that is what you meant to do.",
      booking
    );
  }

  setRowStatus(booking.rowIndex, STATUS_CONFIRMED);

  if (booking.email) {
    MailApp.sendEmail({
      to: booking.email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "Your appointment is confirmed",
      body: buildConfirmedPlainBody(booking),
      htmlBody: buildConfirmedHtmlBody(booking),
    });
  }

  return resultPage(
    "Confirmed",
    esc(booking.name) + " has been sent their confirmation for " +
      esc(formatWhen(booking.date, booking.time) || "their appointment") + ".",
    booking
  );
}

function handleDecline(booking) {
  if (booking.status === STATUS_DECLINED) {
    return resultPage(
      "Already declined",
      "This booking was already declined, so nothing changed.",
      booking
    );
  }
  if (booking.status === STATUS_CONFIRMED) {
    return resultPage(
      "This one is already confirmed",
      esc(booking.name) + " has paid a deposit and been told the appointment is " +
        "going ahead, so declining it here would leave them with two " +
        "contradictory emails. Contact them directly instead.",
      booking
    );
  }

  setRowStatus(booking.rowIndex, STATUS_DECLINED);

  if (booking.email) {
    MailApp.sendEmail({
      to: booking.email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "About your booking request",
      body: buildDeclinedPlainBody(booking),
      htmlBody: buildDeclinedHtmlBody(booking),
    });
  }

  return resultPage(
    "Declined",
    esc(booking.name) + " has been told that date is not available, and invited " +
      "to suggest another.",
    booking
  );
}

function alreadyHandledPage(booking) {
  return resultPage(
    "Already handled",
    esc(booking.name) + "&rsquo;s booking is already marked <strong>" +
      esc(booking.status) + "</strong>, so nothing changed.",
    booking
  );
}

/** The review link that goes in the studio's emails. */
function buildReviewUrl(token) {
  return webAppUrl() + "?token=" + encodeURIComponent(token);
}

function webAppUrl() {
  return ScriptApp.getService().getUrl();
}

/* ================================================================== */
/* Calendar                                                             */
/* ================================================================== */

/** The studio's working window, mirrored from lib/availability.ts. */
var SHORTEST_SERVICE_HOURS = 4;
var LONGEST_SERVICE_HOURS = 6;

/** "09:30" to a readable "9:30 AM". Falls back to whatever it was given. */
function formatTimeOnly(value) {
  if (!value) return "";
  var parts = String(value).split(":");
  if (parts.length < 2) return String(value);
  var hour = parseInt(parts[0], 10);
  var minute = parts[1].slice(0, 2);
  if (isNaN(hour)) return String(value);
  var period = hour < 12 ? "AM" : "PM";
  var hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return hour12 + ":" + minute + " " + period;
}

/** A date and a start time as one phrase, skipping whichever is missing. */
function formatWhen(dateValue, timeValue) {
  var date = formatDateOnly(dateValue);
  var time = formatTimeOnly(timeValue);
  if (date && time) return date + " at " + time;
  return date || time || "";
}

/** Combines the date and "HH:MM" into a real start instant, or null. */
function toStartDate(dateValue, timeValue) {
  var date = parseDateOnly(dateValue);
  if (!date) return null;
  var parts = String(timeValue || "").split(":");
  var hour = parseInt(parts[0], 10);
  var minute = parseInt(parts[1], 10);
  if (isNaN(hour)) return null;
  date.setHours(hour, isNaN(minute) ? 0 : minute, 0, 0);
  return date;
}

/**
 * Tells the studio what else is already on the requested date, with times, so
 * she can judge it at a glance. Deliberately informational: she works with a
 * team and takes several clients at once, so nothing here blocks a booking.
 */
function describeCalendarConflict(dateStr) {
  var date = parseDateOnly(dateStr);
  if (!date) return "";

  var events = CalendarApp.getDefaultCalendar().getEventsForDay(date);
  if (events.length === 0) {
    return "Nothing else is on your calendar that day.";
  }

  var described = [];
  for (var i = 0; i < events.length; i++) {
    var title = events[i].getTitle ? events[i].getTitle() : "";
    var start = events[i].getStartTime ? events[i].getStartTime() : null;
    var when = start
      ? Utilities.formatDate(start, STUDIO_TIMEZONE, "h:mm a")
      : "";
    described.push(when ? when + " " + title : title);
  }

  return (
    "Already on your calendar that day: " + described.join(", ") + "."
  );
}

/**
 * Accepts either the YYYY-MM-DD string the site's date picker sends, or a real
 * Date. Both occur: doPost sees the raw string straight off the form, but
 * Sheets silently converts that string into a date value on write, so anything
 * read back out of the log arrives here as a Date instead. Handling only the
 * string is what leaked a raw "Fri Jul 31 2026 00:00:00 GMT+0100" into the
 * approval emails.
 */
function parseDateOnly(value) {
  if (!value) return null;

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return isNaN(value.getTime())
      ? null
      : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  var parts = String(value).split("-");
  if (parts.length !== 3) return null;
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  var d = parseInt(parts[2], 10);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

var WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
var MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * A preferred date is a calendar date, not an instant, so it must never be
 * converted between timezones. Running "31 July, midnight" through a zone
 * conversion can shift it onto the 30th, which is worse than the original bug.
 * Building the label straight off the date's own parts keeps 31 July as
 * 31 July for everyone. Contrast timestamp(), which formats a real instant and
 * therefore does want the studio's zone.
 */
function formatDateOnly(value) {
  var date = parseDateOnly(value);
  if (!date) return "";
  return (
    WEEKDAY_NAMES[date.getDay()] + ", " +
    MONTH_NAMES[date.getMonth()] + " " +
    date.getDate() + ", " +
    date.getFullYear()
  );
}

/* ================================================================== */
/* Sheet                                                                */
/* ================================================================== */

/**
 * Finds the sheet to log into, whichever way the script was set up.
 *
 *  - Script created from inside a Sheet (Extensions > Apps Script): uses it.
 *  - Standalone script (script.google.com): creates its own log spreadsheet
 *    the first time and remembers it, so no manual linking is needed.
 *
 * getActiveSpreadsheet() returns null for standalone scripts, which is what
 * made the whole notification fail before this fallback existed.
 */
function getLogSheet() {
  var bound = SpreadsheetApp.getActiveSpreadsheet();
  if (bound) return bound.getSheets()[0];

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty("LOG_SPREADSHEET_ID");

  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId).getSheets()[0];
    } catch (err) {
      console.warn("Saved log spreadsheet unavailable, creating a new one.");
    }
  }

  var created = SpreadsheetApp.create(STUDIO_NAME + " — booking requests");
  props.setProperty("LOG_SPREADSHEET_ID", created.getId());
  console.info("Created request log: " + created.getUrl());
  return created.getSheets()[0];
}

function ensureHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet
      .getRange(1, 1, 1, SHEET_HEADERS.length)
      .setFontWeight("bold")
      .setBackground(BLUSH);
    sheet.setFrozenRows(1);
  }
}

function logToSheet(received, data, token) {
  var sheet = getLogSheet();
  ensureHeaderRow(sheet);

  sheet.appendRow([
    received,
    data.name || "",
    data.email || "",
    data.phone || "",
    data.service || "",
    data.date || "",
    data.notes || "",
    STATUS_PENDING,
    token,
    data.time || "",
  ]);
}

/** Scans the log for a row whose Token column matches. Existing rows from
 * before this version have no token and are simply never found — they stay
 * actionable only by hand, same as before. */
function findRowByToken(token) {
  var sheet = getLogSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var values = sheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
  var tokenCol = SHEET_HEADERS.indexOf("Token");

  for (var i = 0; i < values.length; i++) {
    if (values[i][tokenCol] === token) {
      return { rowIndex: i + 2, values: values[i] };
    }
  }
  return null;
}

function rowValue(row, headerName) {
  return row.values[SHEET_HEADERS.indexOf(headerName)];
}

function setRowStatus(rowIndex, status) {
  var sheet = getLogSheet();
  var statusCol = SHEET_HEADERS.indexOf("Status") + 1;
  sheet.getRange(rowIndex, statusCol).setValue(status);
}

/* ================================================================== */
/* Shared email/page shell                                             */
/* ================================================================== */

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function link(href, text, color) {
  return (
    '<a href="' + esc(href) + '" style="color:' + color +
    ';text-decoration:none;border-bottom:1px solid ' + RULE + ';">' +
    esc(text) + "</a>"
  );
}

/**
 * target="_top" is required, not cosmetic. Apps Script renders these pages
 * inside a sandboxed iframe, so a link without it navigates the iframe to
 * script.google.com, which Google refuses to be framed in. The click then
 * fails with "refused to connect" even though the action itself ran.
 */
function button(href, text, variant) {
  var isPrimary = variant !== "outline";
  var bg = isPrimary ? MAGENTA : "transparent";
  var fg = isPrimary ? BONE : INK_PLUM;
  var border = isPrimary ? MAGENTA : INK_PLUM;
  return (
    '<a href="' + esc(href) + '" target="_top" style="display:inline-block;background:' + bg +
    ";color:" + fg + ";border:1px solid " + border +
    ';padding:12px 22px;border-radius:2px;text-decoration:none;' +
    'font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;">' +
    esc(text) + "</a>"
  );
}

/** One label/value row. Rows with no value are dropped entirely. */
function detailRow(label, valueHtml) {
  if (!valueHtml) return "";
  return (
    '<tr>' +
    '<td style="padding:14px 16px 14px 0;border-bottom:1px solid ' + RULE +
    ';font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.4;' +
    "letter-spacing:1.2px;text-transform:uppercase;color:" + MUTED +
    ';width:132px;vertical-align:top;">' + esc(label) + "</td>" +
    '<td style="padding:14px 0;border-bottom:1px solid ' + RULE +
    ';font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:' +
    INK_PLUM + ';">' + valueHtml + "</td>" +
    "</tr>"
  );
}

function timestamp(received) {
  return Utilities.formatDate(received, STUDIO_TIMEZONE, "EEEE, MMMM d 'at' h:mm a");
}

/**
 * Wraps any body HTML in the shared wordmark header / gold hairline / footer
 * chrome — used for every email and every action-link page, so the branding
 * only needs to be built once.
 */
function wrapEmailShell(eyebrow, heading, subheading, bodyHtml, footerText) {
  return (
    '<!doctype html><html><body style="margin:0;padding:0;background:' + BLUSH + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="background:' + BLUSH + ';padding:32px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" ' +
    'style="width:600px;max-width:100%;background:' + BONE + ';border-radius:2px;overflow:hidden;">' +
    '<tr><td style="background:' + INK_PLUM + ';padding:22px 28px;">' +
    '<span style="font-family:Georgia,\'Times New Roman\',serif;font-weight:700;' +
    "font-size:20px;letter-spacing:.5px;color:" + BONE + ';">HAIR</span>' +
    '<span style="font-family:Georgia,serif;font-style:italic;font-size:14px;' +
    "color:" + ROSE_POP + ';padding:0 3px;">by</span>' +
    '<span style="font-family:Georgia,serif;font-weight:700;font-size:20px;' +
    "letter-spacing:.5px;color:" + ROSE_POP + ';">BELLES</span>' +
    "</td></tr>" +
    '<tr><td style="height:2px;background:' + GOLD + ';line-height:2px;font-size:0;">&nbsp;</td></tr>' +
    '<tr><td style="padding:32px 28px 36px;">' +
    (eyebrow
      ? '<p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;' +
        "letter-spacing:1.4px;text-transform:uppercase;color:" + MAGENTA + ';">' + esc(eyebrow) + "</p>"
      : "") +
    (heading
      ? '<h1 style="margin:0 0 4px;font-family:Georgia,\'Times New Roman\',serif;' +
        "font-weight:400;font-size:28px;line-height:1.2;color:" + INK_PLUM + ';">' + esc(heading) + "</h1>"
      : "") +
    (subheading
      ? '<p style="margin:0 0 26px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:' +
        MUTED + ';">' + esc(subheading) + "</p>"
      : '<div style="margin-top:10px;"></div>') +
    bodyHtml +
    "</td></tr>" +
    '<tr><td style="padding:18px 28px;background:' + BONE + ";border-top:1px solid " + RULE +
    ";font-family:Helvetica,Arial,sans-serif;font-size:12px;color:" + MUTED + ';">' +
    esc(footerText || STUDIO_NAME) +
    "</td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

/** A plain informational page — used for action results and edge cases. */
function htmlPage(title, bodyHtml) {
  var styledBody =
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:' +
    INK_PLUM + ';">' + bodyHtml + "</div>";
  return HtmlService.createHtmlOutput(wrapEmailShell("", title, "", styledBody));
}

/**
 * A submit button inside a POST form. The mutation lives behind POST so that
 * link-scanning mail clients cannot trigger it, which is what allowed the old
 * two-step confirmation page to be removed.
 */
function actionForm(token, action, label, variant) {
  var isPrimary = variant !== "outline";
  var bg = isPrimary ? MAGENTA : "transparent";
  var fg = isPrimary ? BONE : INK_PLUM;
  var border = isPrimary ? MAGENTA : INK_PLUM;

  return (
    '<form method="post" action="' + esc(webAppUrl()) +
    '" target="_top" style="display:inline-block;margin:0 10px 10px 0;">' +
    '<input type="hidden" name="action" value="' + esc(action) + '">' +
    '<input type="hidden" name="token" value="' + esc(token) + '">' +
    '<button type="submit" style="cursor:pointer;background:' + bg + ";color:" + fg +
    ";border:1px solid " + border + ';padding:13px 24px;border-radius:2px;' +
    'font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;' +
    'letter-spacing:.02em;">' + esc(label) + "</button></form>"
  );
}

/** The page the studio lands on from the email: full detail, then one action. */
function managePage(booking) {
  var rows =
    detailRow("Appointment", esc(formatWhen(booking.date, booking.time))) +
    detailRow("Service", esc(booking.service)) +
    detailRow(
      "Email",
      booking.email ? link("mailto:" + booking.email, booking.email, MAGENTA) : ""
    ) +
    detailRow(
      "Phone",
      booking.phone
        ? link("tel:" + String(booking.phone).replace(/\s+/g, ""), booking.phone, MAGENTA)
        : ""
    ) +
    detailRow("Notes", booking.notes ? esc(booking.notes) : "") +
    detailRow("Status", esc(booking.status));

  var actions = "";
  if (booking.status === STATUS_PENDING) {
    actions =
      '<p style="margin:26px 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
      MUTED + ';">Approving puts this on your calendar and emails ' + esc(booking.name) +
      " the $" + DEPOSIT_AMOUNT + " deposit details. Declining lets them know the " +
      "date is not available.</p>" +
      actionForm(booking.token, "approve", "Approve booking", "primary") +
      actionForm(booking.token, "decline", "Decline", "outline");
  } else if (booking.status === STATUS_APPROVED) {
    actions =
      '<p style="margin:26px 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
      MUTED + ';">Waiting on the $' + DEPOSIT_AMOUNT +
      " deposit. Once you can see it in Zelle, Cash App or Apple Pay, mark it " +
      "received and " + esc(booking.name) + " gets their confirmation.</p>" +
      actionForm(booking.token, "paid", "Deposit received", "primary");
  } else {
    actions =
      '<p style="margin:26px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
      MUTED + ';">Nothing is outstanding on this booking.</p>';
  }

  var body =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    rows + "</table>" + actions;

  return HtmlService.createHtmlOutput(
    wrapEmailShell("Booking review", booking.name, "", body)
  ).setTitle(STUDIO_NAME + " booking");
}

/** Shown after an action runs, with a way back to the booking. */
function resultPage(title, messageHtml, booking) {
  var body =
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">' + messageHtml + "</p>" +
    '<p style="margin:24px 0 0;">' +
    link(buildReviewUrl(booking.token), "View this booking again", MAGENTA) +
    "</p>";

  return HtmlService.createHtmlOutput(
    wrapEmailShell("", title, "", body)
  ).setTitle(STUDIO_NAME + " booking");
}

/* ================================================================== */
/* Owner notification (new request)                                    */
/* ================================================================== */

function buildOwnerHtmlBody(received, data, calendarNote, token) {
  var rows =
    detailRow("Appointment", esc(formatWhen(data.date, data.time))) +
    detailRow("Service", esc(data.service)) +
    detailRow("Email", data.email ? link("mailto:" + data.email, data.email, MAGENTA) : "") +
    detailRow(
      "Phone",
      data.phone ? link("tel:" + String(data.phone).replace(/\s+/g, ""), data.phone, MAGENTA) : ""
    );

  var notes = data.notes
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="margin-top:24px;background:' + BLUSH + ';border-radius:2px;">' +
      '<tr><td style="padding:20px 22px;">' +
      '<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;' +
      "letter-spacing:1.2px;text-transform:uppercase;color:" + MAGENTA + ';">From the client</p>' +
      '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:' +
      INK_PLUM + ';">' + esc(data.notes).replace(/\n/g, "<br>") + "</p></td></tr></table>"
    : "";

  var calendarBlock = calendarNote
    ? '<p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
      MUTED + ';">' + esc(calendarNote) + "</p>"
    : "";

  var action =
    '<div style="margin-top:28px;">' +
    button(buildReviewUrl(token), "Review this booking", "primary") +
    "</div>" +
    '<p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:' +
    MUTED + ';">Approve or decline it from there. You can also just hit reply, ' +
    "which goes straight to the client.</p>";

  var body =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + "</table>" +
    notes + calendarBlock + action;

  return wrapEmailShell(
    "New booking request",
    data.name || "New request",
    "Received " + timestamp(received),
    body,
    "Sent by the " + STUDIO_NAME + " booking form. A copy is saved in your requests sheet."
  );
}

function buildOwnerPlainBody(received, data, calendarNote, token) {
  var lines = [
    "New booking request",
    "Received " + timestamp(received),
    "",
    "Name: " + (data.name || "not given"),
    "Appointment: " + (formatWhen(data.date, data.time) || "not given"),
    "Service: " + (data.service || "not given"),
    "Email: " + (data.email || "not given"),
    "Phone: " + (data.phone || "not given"),
  ];

  if (data.notes) lines.push("", "From the client:", data.notes);
  if (calendarNote) lines.push("", calendarNote);

  lines.push("", "Review this booking: " + buildReviewUrl(token));

  return lines.join("\n");
}

function buildAckHtmlBody(data) {
  var body =
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">Thank you for reaching out. We have your request for <strong>' +
    esc(data.service || "an appointment") + "</strong> on <strong>" +
    esc(formatWhen(data.date, data.time) || "the date you chose") +
    "</strong>, and we will get back to you within one business day to confirm it.</p>" +
    '<p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Most styles take ' + SHORTEST_SERVICE_HOURS + " to " + LONGEST_SERVICE_HOURS +
    " hours depending on the length you are going for, so do plan for a long, " +
    "comfortable sitting.</p>";

  return wrapEmailShell("Request received", "Thank you, " + (data.name || "there"), "", body);
}

function buildAckPlainBody(data) {
  return [
    "Thank you for reaching out. We have your request for " +
      (data.service || "an appointment") + " on " +
      (formatWhen(data.date, data.time) || "the date you chose") +
      ", and we will get back to you within one business day to confirm it.",
    "",
    "Most styles take " + SHORTEST_SERVICE_HOURS + " to " + LONGEST_SERVICE_HOURS +
      " hours depending on the length you are going for, so do plan for a long, " +
      "comfortable sitting.",
  ].join("\n");
}

function paymentOptionsHtml() {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="margin:4px 0 0;background:' + BLUSH + ';border-radius:2px;">' +
    '<tr><td style="padding:20px 22px;font-family:Helvetica,Arial,sans-serif;' +
    "font-size:15px;line-height:1.9;color:" + INK_PLUM + ';">' +
    "<strong>Zelle</strong>&nbsp;&nbsp;" + esc(ZELLE_HANDLE) + "<br>" +
    "<strong>Cash App</strong>&nbsp;&nbsp;" + esc(CASHAPP_HANDLE) + "<br>" +
    "<strong>Apple Pay</strong>&nbsp;&nbsp;" + esc(APPLE_PAY_HANDLE) +
    "</td></tr></table>"
  );
}

function buildDepositHtmlBody(booking) {
  var body =
    '<p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">Good news. Your appointment for <strong>' +
    esc(booking.service || "your style") + "</strong> on <strong>" +
    esc(formatWhen(booking.date, booking.time) || "your chosen date") +
    "</strong> has been approved.</p>" +
    '<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">All that is left is the $' + DEPOSIT_AMOUNT +
    " deposit, which holds your spot and comes off your total on the day. " +
    "Send it whichever way is easiest for you.</p>" +
    paymentOptionsHtml() +
    '<p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Once you have sent it, reply to this email so we know to expect you.</p>';

  return wrapEmailShell("Approved", "You are booked in, " + booking.name, "", body);
}

function buildDepositPlainBody(booking) {
  return [
    "Good news. Your appointment for " + (booking.service || "your style") + " on " +
      (formatWhen(booking.date, booking.time) || "your chosen date") + " has been approved.",
    "",
    "All that is left is the $" + DEPOSIT_AMOUNT +
      " deposit, which holds your spot and comes off your total on the day. " +
      "Send it whichever way is easiest for you.",
    "",
    "Zelle: " + ZELLE_HANDLE,
    "Cash App: " + CASHAPP_HANDLE,
    "Apple Pay: " + APPLE_PAY_HANDLE,
    "",
    "Once you have sent it, reply to this email so we know to expect you.",
  ].join("\n");
}

function buildConfirmedHtmlBody(booking) {
  var body =
    '<p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">We have received your deposit, so <strong>' +
    esc(formatWhen(booking.date, booking.time) || "your appointment") +
    "</strong> is fully confirmed. We are looking forward to seeing you.</p>" +
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Please come with clean, dry and detangled hair unless a wash is ' +
    "included in your service, and try to arrive on time so you get the full " +
    "appointment. Set aside " + SHORTEST_SERVICE_HOURS + " to " + LONGEST_SERVICE_HOURS +
    " hours depending on your length.</p>";

  return wrapEmailShell("Confirmed", "You are all set, " + booking.name, "", body);
}

function buildConfirmedPlainBody(booking) {
  return [
    "We have received your deposit, so " +
      (formatWhen(booking.date, booking.time) || "your appointment") +
      " is fully confirmed. We are looking forward to seeing you.",
    "",
    "Please come with clean, dry and detangled hair unless a wash is included in " +
      "your service, and try to arrive on time so you get the full appointment. " +
      "Set aside " + SHORTEST_SERVICE_HOURS + " to " + LONGEST_SERVICE_HOURS +
      " hours depending on your length.",
  ].join("\n");
}

function buildDeclinedHtmlBody(booking) {
  var body =
    '<p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">Thank you for thinking of us. Unfortunately we are not able to ' +
    "take " + esc(formatWhen(booking.date, booking.time) || "that date") +
    ", so we cannot confirm this appointment.</p>" +
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">If you are still interested, reply with another date that suits ' +
    "you and we will check what we have available.</p>";

  return wrapEmailShell("About your request", "Sorry about this, " + booking.name, "", body);
}

function buildDeclinedPlainBody(booking) {
  return [
    "Thank you for thinking of us. Unfortunately we are not able to take " +
      (formatWhen(booking.date, booking.time) || "that date") +
      ", so we cannot confirm this appointment.",
    "",
    "If you are still interested, reply with another date that suits you and we " +
      "will check what we have available.",
  ].join("\n");
}

function buildOwnerReceiptHtml(booking) {
  var body =
    '<p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">' + esc(booking.name) + " has been emailed the $" + DEPOSIT_AMOUNT +
    " deposit details for " + esc(formatWhen(booking.date, booking.time) || "their date") +
    ", and it is now on your calendar.</p>" +
    '<p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">When the deposit shows up in Zelle, Cash App or Apple Pay, open ' +
    "the booking and mark it received. That sends the final confirmation.</p>" +
    button(buildReviewUrl(booking.token), "Open this booking", "primary");

  return wrapEmailShell("Booking approved", "Waiting on the deposit", "", body);
}

function buildOwnerReceiptPlain(booking) {
  return [
    booking.name + " has been emailed the $" + DEPOSIT_AMOUNT + " deposit details for " +
      (formatWhen(booking.date, booking.time) || "their date") +
      ", and it is now on your calendar.",
    "",
    "When the deposit shows up in Zelle, Cash App or Apple Pay, open the booking " +
      "and mark it received. That sends the final confirmation.",
    "",
    buildReviewUrl(booking.token),
  ].join("\n");
}
