/**
 * HAIRBYBELLES — booking request notifier + approval workflow.
 *
 * This file is not run by the Next.js app. It is the source of truth for what
 * gets pasted into Google Apps Script.
 *
 * WHAT THIS DOES
 *  1. A request comes in from the site's reservation form (doPost). It's
 *     logged to a Sheet, the studio is notified (with a note on whether that
 *     date already has something on the calendar), and the client gets an
 *     automatic "we got your request" email — something that didn't exist
 *     before this version.
 *  2. The studio's notification has an Approve / Decline link built in. Both
 *     open a small confirmation page first and only act on a second click —
 *     see the comment on doGet for why that extra step is load-bearing, not
 *     decoration.
 *  3. Approving creates a calendar block automatically and emails the client
 *     the deposit instructions. The studio also gets a short follow-up email
 *     with a "mark as paid" link, ready for whenever the deposit actually
 *     shows up in Zelle/Cash App/Apple Pay — nothing about that arrival can
 *     be checked automatically, so that click is the one genuinely manual
 *     step in the whole flow.
 *
 * SETUP
 *  1. Create the script either way — from inside a Google Sheet
 *     (Extensions > Apps Script) or standalone at script.google.com. If it is
 *     standalone, the script creates its own log spreadsheet on the first
 *     request and puts it in the same account's Drive.
 *  2. Delete the placeholder code and paste this in.
 *  3. IMPORTANT: create this script while logged into the SAME Google account
 *     as OWNER_EMAIL below. Calendar blocking uses whichever account is
 *     running the script — if that's a different account, bookings get
 *     blocked on a calendar nobody is looking at.
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

function doPost(e) {
  var data = (e && e.parameter) || {};
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

  // The client used to get nothing at all. Now they get an immediate,
  // automatic acknowledgment — not a confirmed booking yet, just proof the
  // request landed.
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
    ? "New booking request — " + who + " · " + data.service
    : "New booking request — " + who;
}

/* ================================================================== */
/* Action links — approve / mark paid / decline                        */
/* ================================================================== */

/**
 * Handles every click coming from the action links in the studio's emails.
 *
 * Anti-prefetch guard, and why it matters: some email clients (Outlook Safe
 * Links, several corporate scanners) automatically visit links inside an
 * email to scan them for safety — before a human ever clicks anything. If
 * these links mutated a booking on a bare GET, a security scanner opening
 * the studio's email could silently approve or decline a real booking with
 * nobody touching anything. So nothing here ever changes state on the first
 * load — it renders a small confirmation page, and only a second explicit
 * click (a real link with &confirm=1) performs the actual action. A
 * prefetcher loads the page; it does not click the button on it.
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action;
  var token = params.token;
  var confirmed = params.confirm === "1";

  if (!action || !token) {
    return htmlPage("Nothing to do here", "<p>This link is missing information.</p>");
  }

  var row = findRowByToken(token);
  if (!row) {
    return htmlPage(
      "Link not recognized",
      "<p>This link doesn&rsquo;t match a known request. It may have already been used, or the row was edited in the sheet.</p>"
    );
  }

  var name = rowValue(row, "Name") || "this client";
  var service = rowValue(row, "Service") || "";
  var date = rowValue(row, "Preferred date") || "";
  var email = rowValue(row, "Email") || "";
  var currentStatus = rowValue(row, "Status") || STATUS_PENDING;
  var token2 = rowValue(row, "Token");

  if (action === "approve") {
    return handleApprove(row, token2, name, service, date, email, currentStatus, confirmed);
  }
  if (action === "paid") {
    return handleMarkPaid(row, token2, name, date, email, currentStatus, confirmed);
  }
  if (action === "decline") {
    return handleDecline(row, token2, name, email, currentStatus, confirmed);
  }

  return htmlPage("Unknown action", "<p>That isn&rsquo;t something this link knows how to do.</p>");
}

function handleApprove(row, token, name, service, date, email, currentStatus, confirmed) {
  if (currentStatus !== STATUS_PENDING) {
    return htmlPage(
      "Already handled",
      "<p>" + esc(name) + "&rsquo;s request is already marked <strong>" +
        esc(currentStatus) + "</strong>. Nothing changed.</p>"
    );
  }

  if (!confirmed) {
    return confirmationPage(
      "Approve this booking?",
      esc(name) + (service ? ", " + esc(service) : "") + (date ? ", " + esc(formatDateOnly(date)) : ""),
      "This blocks " + esc(date ? formatDateOnly(date) : "the requested date") +
        " on your calendar and emails " + esc(name) + " the $" + DEPOSIT_AMOUNT + " deposit instructions.",
      buildActionUrl("approve", token)
    );
  }

  try {
    var eventDate = parseDateOnly(date);
    if (eventDate) {
      CalendarApp.getDefaultCalendar().createAllDayEvent(
        "BOOKED — " + name + (service ? " — " + service : ""),
        eventDate
      );
    }
  } catch (err) {
    console.error("Could not create the calendar event: " + err);
  }

  setRowStatus(row.rowIndex, STATUS_APPROVED);

  if (email) {
    MailApp.sendEmail({
      to: email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "Your appointment is approved, just the deposit left",
      body: buildDepositPlainBody(name, date, service),
      htmlBody: buildDepositHtmlBody(name, date, service),
    });
  }

  // A short receipt back to the studio with the "mark as paid" link ready
  // for whenever the deposit actually lands — no need to dig up the
  // original request email days later.
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    name: STUDIO_NAME + " website",
    subject: "Approved — " + name + (service ? " · " + service : ""),
    body:
      "You approved " + name + "'s request for " + (date ? formatDateOnly(date) : "their date") +
      ". They've been emailed the deposit instructions.\n\n" +
      "Once you see the $" + DEPOSIT_AMOUNT + " land, click this to send their final confirmation:\n" +
      buildActionUrl("paid", token),
    htmlBody: buildOwnerReceiptHtml(name, service, date, token),
  });

  return htmlPage(
    "Approved",
    "<p>" + esc(name) + " has been emailed the deposit instructions, and " +
      esc(date ? formatDateOnly(date) : "the date") +
      " is now blocked on your calendar. Check your inbox for a follow-up with a button for once the deposit lands.</p>"
  );
}

function handleMarkPaid(row, token, name, date, email, currentStatus, confirmed) {
  if (currentStatus === STATUS_CONFIRMED) {
    return htmlPage("Already confirmed", "<p>" + esc(name) + "&rsquo;s booking is already confirmed.</p>");
  }
  if (currentStatus !== STATUS_APPROVED) {
    return htmlPage(
      "Not ready yet",
      "<p>This request is currently <strong>" + esc(currentStatus) +
        "</strong>, not awaiting a deposit. If that looks wrong, check the sheet.</p>"
    );
  }

  if (!confirmed) {
    return confirmationPage(
      "Mark this deposit as received?",
      esc(name) + (date ? " — " + esc(formatDateOnly(date)) : ""),
      "This sends " + esc(name) + " their final confirmation for " +
        esc(date ? formatDateOnly(date) : "their appointment") + ".",
      buildActionUrl("paid", token)
    );
  }

  setRowStatus(row.rowIndex, STATUS_CONFIRMED);

  if (email) {
    MailApp.sendEmail({
      to: email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "Your appointment is confirmed",
      body: buildConfirmedPlainBody(name, date),
      htmlBody: buildConfirmedHtmlBody(name, date),
    });
  }

  return htmlPage("Confirmed", "<p>" + esc(name) + " has been sent their final confirmation.</p>");
}

function handleDecline(row, token, name, email, currentStatus, confirmed) {
  if (currentStatus === STATUS_DECLINED) {
    return htmlPage("Already declined", "<p>This request was already declined.</p>");
  }

  if (!confirmed) {
    return confirmationPage(
      "Decline this booking?",
      esc(name),
      "This sends " + esc(name) + " a polite note that the date doesn&rsquo;t work.",
      buildActionUrl("decline", token)
    );
  }

  setRowStatus(row.rowIndex, STATUS_DECLINED);

  if (email) {
    MailApp.sendEmail({
      to: email,
      replyTo: OWNER_EMAIL,
      name: STUDIO_NAME,
      subject: "About your booking request",
      body: buildDeclinedPlainBody(name),
      htmlBody: buildDeclinedHtmlBody(name),
    });
  }

  return htmlPage("Declined", "<p>" + esc(name) + " has been sent a note that the date doesn&rsquo;t work.</p>");
}

function buildActionUrl(action, token) {
  return ScriptApp.getService().getUrl() +
    "?action=" + encodeURIComponent(action) +
    "&token=" + encodeURIComponent(token);
}

/* ================================================================== */
/* Calendar                                                             */
/* ================================================================== */

function describeCalendarConflict(dateStr) {
  var date = parseDateOnly(dateStr);
  if (!date) return "";

  var events = CalendarApp.getDefaultCalendar().getEventsForDay(date);
  if (events.length === 0) {
    return "This date is currently open on your calendar.";
  }
  var count = events.length;
  return "Heads up — you already have " + count + " " +
    (count === 1 ? "thing" : "things") + " on your calendar this date.";
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

/** The "are you sure?" page every action link shows before it does anything. */
function confirmationPage(title, subject, explanation, confirmUrl) {
  var body =
    '<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:16px;color:' +
    INK_PLUM + ';">' + subject + "</p>" +
    '<p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:' +
    MUTED + ';">' + explanation + "</p>" +
    button(confirmUrl + "&confirm=1", "Yes, continue", "primary");
  return HtmlService.createHtmlOutput(wrapEmailShell("", title, "", body));
}

/* ================================================================== */
/* Owner notification (new request)                                    */
/* ================================================================== */

function buildOwnerHtmlBody(received, data, calendarNote, token) {
  var rows =
    detailRow("Email", data.email ? link("mailto:" + data.email, data.email, MAGENTA) : "") +
    detailRow(
      "Phone",
      data.phone ? link("tel:" + String(data.phone).replace(/\s+/g, ""), data.phone, MAGENTA) : ""
    ) +
    detailRow("Service", esc(data.service)) +
    detailRow("Preferred date", esc(data.date ? formatDateOnly(data.date) : ""));

  var notes = data.notes
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="margin-top:24px;background:' + BLUSH + ';border-radius:2px;">' +
      '<tr><td style="padding:20px 22px;">' +
      '<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;' +
      "letter-spacing:1.2px;text-transform:uppercase;color:" + MAGENTA + ';">Anything we should know</p>' +
      '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:' +
      INK_PLUM + ';">' + esc(data.notes).replace(/\n/g, "<br>") + "</p></td></tr></table>"
    : "";

  var calendarBlock = calendarNote
    ? '<p style="margin:20px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:' +
      MUTED + ';">' + esc(calendarNote) + "</p>"
    : "";

  var actions =
    '<div style="margin-top:28px;">' +
    button(buildActionUrl("approve", token), "Approve", "primary") +
    '<span style="display:inline-block;width:12px;"></span>' +
    button(buildActionUrl("decline", token), "Decline", "outline") +
    "</div>";

  var replyNote = data.email
    ? '<p style="margin:20px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:' +
      MUTED + ';">Hit reply and it goes straight to ' +
      esc(String(data.name || "them").replace(/\.\s*$/, "")) + ".</p>"
    : "";

  var body =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + "</table>" +
    notes + calendarBlock + actions + replyNote;

  return wrapEmailShell(
    "New booking request",
    data.name || "New request",
    timestamp(received),
    body,
    "Sent from the " + STUDIO_NAME + " booking form. A copy is saved in your requests sheet."
  );
}

function buildOwnerPlainBody(received, data, calendarNote, token) {
  var lines = [
    "New booking request",
    timestamp(received),
    "",
    "Name: " + (data.name || "—"),
    "Email: " + (data.email || "—"),
    "Phone: " + (data.phone || "—"),
    "Service: " + (data.service || "—"),
    "Preferred date: " + (data.date ? formatDateOnly(data.date) : "—"),
  ];

  if (data.notes) lines.push("", "Notes:", data.notes);
  if (calendarNote) lines.push("", calendarNote);

  lines.push(
    "",
    "Approve: " + buildActionUrl("approve", token),
    "Decline: " + buildActionUrl("decline", token)
  );

  return lines.join("\n");
}

/* ================================================================== */
/* Client-facing emails                                                */
/* ================================================================== */

function buildAckHtmlBody(data) {
  var what =
    (data.service ? "<strong>" + esc(data.service) + "</strong>" : "your appointment") +
    (data.date ? " on <strong>" + esc(formatDateOnly(data.date)) + "</strong>" : "");

  var body =
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">Thank you for reaching out. We have your request for ' + what +
    ", and we will get back to you within one business day to confirm it.</p>";

  return wrapEmailShell("Request received", "Thank you, " + (data.name || "there"), "", body);
}

function buildAckPlainBody(data) {
  var what =
    (data.service || "your appointment") +
    (data.date ? " on " + formatDateOnly(data.date) : "");

  return (
    "Thank you for reaching out. We have your request for " + what +
    ", and we will get back to you within one business day to confirm it."
  );
}

function buildDepositHtmlBody(name, date, service) {
  var payments =
    '<ul style="margin:0;padding-left:18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;' +
    "line-height:1.9;color:" + INK_PLUM + ';">' +
    "<li><strong>Zelle:</strong> " + esc(ZELLE_HANDLE) + "</li>" +
    "<li><strong>Cash App:</strong> " + esc(CASHAPP_HANDLE) + "</li>" +
    "<li><strong>Apple Pay:</strong> " + esc(APPLE_PAY_HANDLE) + "</li>" +
    "</ul>";

  var body =
    '<p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">Good news, your appointment for <strong>' +
    esc(service || "your style") + "</strong> on <strong>" +
    esc(date ? formatDateOnly(date) : "your chosen date") + "</strong> has been approved.</p>" +
    '<p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">All that is left is the $' + DEPOSIT_AMOUNT +
    " deposit, which holds your spot and comes off your total on the day. You can send it whichever way is easiest for you:</p>" +
    payments +
    '<p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' + MUTED +
    ';">Once you have sent it, reply to this email so we know to expect you.</p>';

  return wrapEmailShell("Approved", "You are booked in, " + name, "", body);
}

function buildDepositPlainBody(name, date, service) {
  return [
    "Good news, your appointment for " + (service || "your style") +
      " on " + (date ? formatDateOnly(date) : "your chosen date") + " has been approved.",
    "",
    "All that is left is the $" + DEPOSIT_AMOUNT +
      " deposit, which holds your spot and comes off your total on the day.",
    "You can send it whichever way is easiest for you:",
    "",
    "Zelle: " + ZELLE_HANDLE,
    "Cash App: " + CASHAPP_HANDLE,
    "Apple Pay: " + APPLE_PAY_HANDLE,
    "",
    "Once you have sent it, reply to this email so we know to expect you.",
  ].join("\n");
}

function buildConfirmedHtmlBody(name, date) {
  var body =
    '<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">We have received your deposit, so your appointment on <strong>' +
    esc(date ? formatDateOnly(date) : "your chosen date") +
    "</strong> is fully confirmed. We are looking forward to seeing you.</p>" +
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Before you come, please arrive with clean, dry and detangled hair unless a wash is ' +
    "included in your service, and do try to arrive on time so we can give you the full appointment.</p>";

  return wrapEmailShell("Confirmed", "You are all set, " + name, "", body);
}

function buildConfirmedPlainBody(name, date) {
  return [
    "We have received your deposit, so your appointment on " +
      (date ? formatDateOnly(date) : "your chosen date") +
      " is fully confirmed. We are looking forward to seeing you.",
    "",
    "Before you come, please arrive with clean, dry and detangled hair unless a wash is included " +
      "in your service, and do try to arrive on time so we can give you the full appointment.",
  ].join("\n");
}

function buildDeclinedHtmlBody(name) {
  var body =
    '<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">Thank you for thinking of us. Unfortunately we are not able to take that date, ' +
    "so we cannot confirm this appointment.</p>" +
    '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">If you are still interested, reply with another date that suits you and we will ' +
    "check what we have available.</p>";

  return wrapEmailShell("About your request", "Sorry about this, " + name, "", body);
}

function buildDeclinedPlainBody(name) {
  return [
    "Thank you for thinking of us. Unfortunately we are not able to take that date, " +
      "so we cannot confirm this appointment.",
    "",
    "If you are still interested, reply with another date that suits you and we will " +
      "check what we have available.",
  ].join("\n");
}

/* ================================================================== */
/* Owner receipt (sent right after approving)                          */
/* ================================================================== */

function buildOwnerReceiptHtml(name, service, date, token) {
  var body =
    '<p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:' +
    INK_PLUM + ';">' + esc(name) + " has been emailed the $" + DEPOSIT_AMOUNT + " deposit instructions for " +
    esc(date ? formatDateOnly(date) : "their date") + (service ? " (" + esc(service) + ")" : "") + ".</p>" +
    '<p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:' +
    MUTED + ';">Once you see the $' + DEPOSIT_AMOUNT + " land in Zelle, Cash App, or Apple Pay, click below:</p>" +
    button(buildActionUrl("paid", token), "Mark deposit as received", "primary");

  return wrapEmailShell("Booking approved", "Waiting on the deposit", "", body);
}
