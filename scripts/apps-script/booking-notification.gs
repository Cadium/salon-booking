/**
 * HAIRBYBELLES — automatic calendar booking and deposit workflow.
 *
 * This file is not run by the Next.js app. It is the source of truth for what
 * gets pasted into Google Apps Script.
 *
 * WHAT THIS DOES
 *  1. A request arrives from the site's reservation form with a date and
 *     start time. While a script lock is held, it checks the studio calendar
 *     for an overlapping appointment.
 *  2. A free slot is accepted immediately: it is logged, blocked on the
 *     calendar, and the client receives deposit instructions. A conflicting
 *     slot is logged as declined and the client receives a clear invitation
 *     to choose another time or date.
 *  3. The studio receives an informational email either way. For accepted
 *     bookings, that email includes the one remaining action: mark the
 *     deposit received after it appears in Zelle, Cash App, or Apple Pay.
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

var STATUS_ACCEPTED = "Accepted — awaiting deposit";
var STATUS_PROCESSING = "Processing";
// Kept only so bookings accepted by the previous deployment can still have
// their deposits marked received from their existing email links.
var STATUS_LEGACY_APPROVED = "Approved — awaiting deposit";
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
 * Booking requests arrive from the website form. The only action page command
 * is marking a deposit received; accepting or declining is never manual.
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

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    console.error("Could not acquire the booking lock.");
    return ContentService.createTextOutput("Unable to process booking");
  }

  try {
    var result = reserveCalendarSlot(data);
    var booking;

    if (result.isAvailable) {
      // Persist the in-flight state before writing to Calendar. If Calendar
      // rejects the event, the sheet makes that exception visible instead of
      // falsely claiming that a client was accepted.
      booking = logToSheet(received, data, token, STATUS_PROCESSING);
      createCalendarEvent(booking, result.start, result.end);
      setRowStatus(booking.rowIndex, STATUS_ACCEPTED);
      booking.status = STATUS_ACCEPTED;
      notifyAcceptedBooking(booking);
    } else {
      booking = logToSheet(received, data, token, STATUS_DECLINED);
      notifyDeclinedBooking(booking);
    }
  } catch (err) {
    console.error("Could not process booking: " + err);
    return ContentService.createTextOutput("Unable to process booking");
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput("OK");
}

/* ================================================================== */
/* Recording a received deposit                                        */
/* ================================================================== */

/**
 * Every click from the studio's email lands here, and nothing on this path
 * ever changes a booking.
 *
 * That restraint is deliberate. Some mail clients, Outlook Safe Links and
 * several corporate scanners among them, fetch the links inside a message
 * before any human opens it. A GET that mutated state would let one of those
 * scanners mark a real deposit as received on their own. So a GET only ever
 * renders the booking details, and the deposit button submits a POST.
 *
 * Calendar acceptance and decline never pass through this page at all: they
 * happen automatically as part of the original booking submission.
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
    status: rowValue(row, "Status") || "",
    token: rowValue(row, "Token"),
  };
}

/** Routes the one remaining manual action: confirming a received deposit. */
function handleAction(action, booking) {
  if (action === "paid") return handleMarkPaid(booking);
  return htmlPage(
    "Unknown action",
    "<p>That is not something this page knows how to do.</p>"
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
  if (booking.status !== STATUS_ACCEPTED && booking.status !== STATUS_LEGACY_APPROVED) {
    return resultPage(
      "Not ready for that yet",
      "This booking is currently marked <strong>" + esc(booking.status) +
        "</strong>, so there is no deposit outstanding on it.",
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

/** The longest block reserved for a booking, mirrored from the site copy. */
var SHORTEST_SERVICE_HOURS = 4;
var LONGEST_SERVICE_HOURS = 6;
var OPENING_HOUR = 7;
var CLOSING_HOUR = 19;

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

/** Combines the date and "HH:MM" into an instant in the studio's timezone. */
function toStartDate(dateValue, timeValue) {
  var dateParts = datePartsFor(dateValue);
  if (!dateParts) return null;
  var parts = String(timeValue || "").split(":");
  var hour = parseInt(parts[0], 10);
  var minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  // Date constructors use the Apps Script project's timezone, which may be
  // different from the calendar's timezone. Interpret the submitted wall time
  // in America/Chicago explicitly so a server timezone can never move a Texas
  // appointment onto a different hour or day.
  var wallTime = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute);
  var offset = timezoneOffsetMinutes(new Date(wallTime));
  return new Date(wallTime - offset * 60 * 1000);
}

/**
 * Returns the time window and availability for a request. The caller holds the
 * script lock while this runs and while it creates the event, preventing two
 * simultaneous requests from both seeing the same slot as free.
 */
function reserveCalendarSlot(data) {
  var start = toStartDate(data.date, data.time);
  if (!start || !isBookableStartTime(data.time)) {
    throw new Error("Booking request did not include a valid date and start time.");
  }

  var end = new Date(start.getTime() + LONGEST_SERVICE_HOURS * 60 * 60 * 1000);
  var events = CalendarApp.getDefaultCalendar().getEvents(start, end);
  return { isAvailable: events.length === 0, start: start, end: end };
}

function isBookableStartTime(timeValue) {
  if (!/^\d{2}:(00|30)$/.test(String(timeValue || ""))) return false;
  var parts = String(timeValue).split(":");
  var hour = parseInt(parts[0], 10);
  var minute = parseInt(parts[1], 10);
  var totalMinutes = hour * 60 + minute;
  return (
    !isNaN(hour) && !isNaN(minute) &&
    totalMinutes >= OPENING_HOUR * 60 && totalMinutes <= CLOSING_HOUR * 60 &&
    (minute === 0 || minute === 30)
  );
}

function createCalendarEvent(booking, start, end) {
  var title = "Booked: " + booking.name +
    (booking.service ? ", " + booking.service : "");

  CalendarApp.getDefaultCalendar().createEvent(title, start, end, {
    description:
      booking.name + " booked " + (booking.service || "an appointment") +
      " through the website. Allow " + SHORTEST_SERVICE_HOURS + " to " +
      LONGEST_SERVICE_HOURS + " hours depending on length." +
      (booking.email ? "\n\nContact: " + booking.email : "") +
      (booking.phone ? "\nPhone: " + booking.phone : ""),
  });
}

function timezoneOffsetMinutes(date) {
  var value = Utilities.formatDate(date, STUDIO_TIMEZONE, "Z");
  var sign = value.charAt(0) === "-" ? -1 : 1;
  var hours = parseInt(value.slice(1, 3), 10);
  var minutes = parseInt(value.slice(3, 5), 10);
  return sign * (hours * 60 + minutes);
}

function datePartsFor(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    if (isNaN(value.getTime())) return null;
    return {
      year: parseInt(Utilities.formatDate(value, STUDIO_TIMEZONE, "yyyy"), 10),
      month: parseInt(Utilities.formatDate(value, STUDIO_TIMEZONE, "M"), 10),
      day: parseInt(Utilities.formatDate(value, STUDIO_TIMEZONE, "d"), 10),
    };
  }

  var parts = String(value || "").split("-");
  if (parts.length !== 3) return null;
  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var day = parseInt(parts[2], 10);
  if (!year || !month || !day) return null;
  var candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }
  return { year: year, month: month, day: day };
}

/**
 * Accepts either the YYYY-MM-DD string the site's date picker sends, or a real
 * Date. Both occur: doPost sees the raw string straight off the form, but
 * Older rows may still contain a Date because they were written before the
 * date column was explicitly stored as text.
 */
function parseDateOnly(value) {
  var parts = datePartsFor(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day);
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

function logToSheet(received, data, token, status) {
  var sheet = getLogSheet();
  ensureHeaderRow(sheet);
  var rowIndex = sheet.getLastRow() + 1;
  var dateCell = sheet.getRange(
    rowIndex,
    SHEET_HEADERS.indexOf("Preferred date") + 1
  );

  // Keeping the submitted date as text prevents Sheets from interpreting it in
  // the script's own timezone before a later email or calendar operation reads
  // it back out.
  dateCell.setNumberFormat("@");
  sheet.getRange(rowIndex, 1, 1, SHEET_HEADERS.length).setValues([[
    received,
    data.name || "",
    data.email || "",
    data.phone || "",
    data.service || "",
    String(data.date || ""),
    data.notes || "",
    status,
    token,
    data.time || "",
  ]]);

  return {
    rowIndex: rowIndex,
    name: data.name || "this client",
    service: data.service || "",
    date: String(data.date || ""),
    time: data.time || "",
    email: data.email || "",
    phone: data.phone || "",
    notes: data.notes || "",
    status: status,
    token: token,
  };
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

/** The page the studio opens only to record a received deposit. */
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
  if (booking.status === STATUS_ACCEPTED || booking.status === STATUS_LEGACY_APPROVED) {
    actions =
      '<p style="margin:26px 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
      MUTED + ';">waiting on the $' + DEPOSIT_AMOUNT +
      " deposit. once you can see it in zelle, cash app or apple pay, mark it " +
      "received and " + esc(booking.name) + " gets their confirmation.</p>" +
      actionForm(booking.token, "paid", "deposit received", "primary");
  } else {
    actions =
      '<p style="margin:26px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
      MUTED + ';">nothing is outstanding on this booking.</p>';
  }

  var body =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    rows + "</table>" + actions;

  return HtmlService.createHtmlOutput(
    wrapEmailShell("Booking details", booking.name, "", body)
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
/* Owner notifications                                                   */
/* ================================================================== */

function notifyAcceptedBooking(booking) {
  if (booking.email) {
    MailApp.sendEmail({
      to: booking.email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "Your appointment is booked — deposit details inside",
      body: buildDepositPlainBody(booking),
      htmlBody: buildDepositHtmlBody(booking),
    });
  }

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    replyTo: booking.email || OWNER_EMAIL,
    name: STUDIO_NAME + " website",
    subject: "Booked automatically: " + booking.name +
      (booking.service ? ", " + booking.service : ""),
    body: buildOwnerAcceptedPlainBody(booking),
    htmlBody: buildOwnerAcceptedHtmlBody(booking),
  });
}

function notifyDeclinedBooking(booking) {
  if (booking.email) {
    MailApp.sendEmail({
      to: booking.email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "That appointment time is unavailable",
      body: buildDeclinedPlainBody(booking),
      htmlBody: buildDeclinedHtmlBody(booking),
    });
  }

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    replyTo: booking.email || OWNER_EMAIL,
    name: STUDIO_NAME + " website",
    subject: "Unavailable slot: " + booking.name +
      (booking.service ? ", " + booking.service : ""),
    body: buildOwnerDeclinedPlainBody(booking),
    htmlBody: buildOwnerDeclinedHtmlBody(booking),
  });
}

function bookingDetailRows(booking) {
  return (
    detailRow("Appointment", esc(formatWhen(booking.date, booking.time))) +
    detailRow("Service", esc(booking.service)) +
    detailRow("Email", booking.email ? link("mailto:" + booking.email, booking.email, MAGENTA) : "") +
    detailRow(
      "Phone",
      booking.phone
        ? link("tel:" + String(booking.phone).replace(/\s+/g, ""), booking.phone, MAGENTA)
        : ""
    )
  );
}

function bookingNotes(booking) {
  return booking.notes
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="margin-top:24px;background:' + BLUSH + ';border-radius:2px;">' +
      '<tr><td style="padding:20px 22px;">' +
      '<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;' +
      "letter-spacing:1.2px;text-transform:uppercase;color:" + MAGENTA + ';">From the client</p>' +
      '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:' +
      INK_PLUM + ';">' + esc(booking.notes).replace(/\n/g, "<br>") + "</p></td></tr></table>"
    : "";
}

function buildOwnerAcceptedHtmlBody(booking) {
  var body =
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">This time was free, so it has been added to your calendar and ' +
    esc(booking.name) + " has been sent the $" + DEPOSIT_AMOUNT +
    " deposit instructions.</p>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">' +
    bookingDetailRows(booking) + "</table>" + bookingNotes(booking) +
    '<p style="margin:22px 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">When the deposit appears in Zelle, Cash App, or Apple Pay, open this booking and mark it received.</p>' +
    button(buildReviewUrl(booking.token), "Open booking", "primary");
  return wrapEmailShell(
    "Booked automatically",
    booking.name,
    formatWhen(booking.date, booking.time),
    body,
    "A copy is saved in your booking requests sheet."
  );
}

function buildOwnerAcceptedPlainBody(booking) {
  var lines = [
    "Booked automatically",
    "",
    "The time was free, so it has been added to your calendar and the client has been sent deposit instructions.",
    "",
    "Name: " + booking.name,
    "Appointment: " + (formatWhen(booking.date, booking.time) || "not given"),
    "Service: " + (booking.service || "not given"),
    "Email: " + (booking.email || "not given"),
    "Phone: " + (booking.phone || "not given"),
  ];

  if (booking.notes) lines.push("", "From the client:", booking.notes);
  lines.push("", "When the deposit arrives, mark it received here:", buildReviewUrl(booking.token));

  return lines.join("\n");
}

function buildOwnerDeclinedHtmlBody(booking) {
  var body =
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">This requested time overlaps an appointment already on your calendar, so ' +
    esc(booking.name) + " has been told to choose another time or date.</p>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">' +
    bookingDetailRows(booking) + "</table>" + bookingNotes(booking);
  return wrapEmailShell(
    "Slot unavailable",
    booking.name,
    formatWhen(booking.date, booking.time),
    body,
    "A copy is saved in your booking requests sheet."
  );
}

function buildOwnerDeclinedPlainBody(booking) {
  var lines = [
    "Slot unavailable",
    "",
    "This requested time overlaps an appointment already on your calendar. The client has been told to choose another time or date.",
    "",
    "Name: " + booking.name,
    "Appointment: " + (formatWhen(booking.date, booking.time) || "not given"),
    "Service: " + (booking.service || "not given"),
    "Email: " + (booking.email || "not given"),
    "Phone: " + (booking.phone || "not given"),
  ];

  if (booking.notes) lines.push("", "From the client:", booking.notes);

  return lines.join("\n");
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
    "</strong> is booked.</p>" +
    '<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">All that is left is the $' + DEPOSIT_AMOUNT +
    " deposit, which holds your spot and comes off your total on the day. " +
    "Send it whichever way is easiest for you.</p>" +
    paymentOptionsHtml() +
    '<p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Once you have sent it, reply to this email so we know to expect you.</p>';

  return wrapEmailShell("Appointment booked", "You are booked in, " + booking.name, "", body);
}

function buildDepositPlainBody(booking) {
  return [
    "Good news. Your appointment for " + (booking.service || "your style") + " on " +
      (formatWhen(booking.date, booking.time) || "your chosen date") + " is booked.",
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
    INK_PLUM + ';">The time you selected — <strong>' +
    esc(formatWhen(booking.date, booking.time) || "your requested appointment") +
    "</strong> — overlaps an appointment already on our calendar, so it is not available.</p>" +
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Please reply with another time on that date, or another date that works for you, and we will be happy to check it.</p>';

  return wrapEmailShell("Time unavailable", "Sorry, " + booking.name, "", body);
}

function buildDeclinedPlainBody(booking) {
  return [
    "The time you selected — " +
      (formatWhen(booking.date, booking.time) || "your requested appointment") +
      " — overlaps an appointment already on our calendar, so it is not available.",
    "",
    "Please reply with another time on that date, or another date that works for you, and we will be happy to check it.",
  ].join("\n");
}
