/*
 * HAIRBYBELLES booking workflow. Paste this file into Google Apps Script.
 * The calendar check, accept/decline emails, calendar event and sheet log are
 * automatic; manually marking a received deposit is the only owner action.
 *
 * Deploy as a Web app: Execute as Me; Who has access Anyone. After edits:
 * Save > Deploy > Manage deployments > pencil > New version > Deploy.
 * The script must run under the same Google account that owns the calendar.
 */

var OWNER_EMAIL = "Adedijikikelomo@gmail.com";
var STUDIO_NAME = "HAIRBYBELLES";

// Garland, Texas: Central Time, including daylight-saving changes.
var STUDIO_TIMEZONE = "America/Chicago";

var DEPOSIT_AMOUNT = 30;
var ZELLE_HANDLE = "(832) 207-6324";
var CASHAPP_HANDLE = "$Thebellesempire";
var APPLE_PAY_HANDLE = "@Hairbybelles_16";

// Keep this order: existing sheet rows are read by these column positions.
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
// Supports existing deposit links created before automatic booking.
var STATUS_LEGACY_APPROVED = "Approved — awaiting deposit";
var STATUS_CONFIRMED = "Confirmed";
var STATUS_DECLINED = "Declined";

var INK_PLUM = "#1E1220";
var BONE = "#FBF3F0";
var BLUSH = "#F7E4EA";
var MAGENTA = "#B3125F";
var ROSE_POP = "#FF9DBD";
var GOLD = "#C9A24B";
var RULE = "#EADFE2";
var MUTED = "#8A7176";

// Run once from the Apps Script editor to grant the services used by bookings.
function authorizeBookingServices() {
  CalendarApp.getDefaultCalendar().getName();
  MailApp.getRemainingDailyQuota();
  getLogSheet().getSheetId();
}

// Booking acceptance and decline happen in this request, never manually.
function doPost(e) {
  var params = requestParams(e);

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

// Read both forms Apps Script provides for URL-encoded web-app requests.
// Some requests arrive with an empty e.parameter even though the raw POST body
// contains the booking details.
function requestParams(e) {
  var params = {};
  var parameter = (e && e.parameter) || {};
  var key;

  for (key in parameter) {
    if (Object.prototype.hasOwnProperty.call(parameter, key)) {
      params[key] = parameter[key];
    }
  }

  var rawBody = e && e.postData && e.postData.contents;
  if (!rawBody) return params;

  var pairs = rawBody.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (!pair[0]) continue;
    var name = decodeFormValue(pair.shift());
    var value = decodeFormValue(pair.join("="));
    params[name] = value;
  }

  return params;
}

function decodeFormValue(value) {
  return decodeURIComponent(String(value || "").replace(/\+/g, " "));
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
      // Log before Calendar so a Calendar failure is visible in the sheet.
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
    var message = String(err && err.message ? err.message : err);
    console.error("Could not process booking: " + message);
    // The site keeps this private from clients, but Vercel records it so the
    // actual integration failure can be diagnosed without guessing.
    return ContentService.createTextOutput("BOOKING_ERROR: " + message);
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput("OK");
}

// GET only shows a booking; the deposit change requires a POST to avoid
// automatic email-link scanners confirming a booking by accident.
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

function buildReviewUrl(token) {
  return webAppUrl() + "?token=" + encodeURIComponent(token);
}

function webAppUrl() {
  return ScriptApp.getService().getUrl();
}

// The event reserves the longest possible appointment window.
var SHORTEST_SERVICE_HOURS = 4;
var LONGEST_SERVICE_HOURS = 6;
var OPENING_HOUR = 7;
var CLOSING_HOUR = 19;

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

function formatWhen(dateValue, timeValue) {
  var date = formatDateOnly(dateValue);
  var time = formatTimeOnly(timeValue);
  if (date && time) return date + " at " + time;
  return date || time || "";
}

function toStartDate(dateValue, timeValue) {
  var dateParts = datePartsFor(dateValue);
  if (!dateParts) return null;
  var parts = String(timeValue || "").split(":");
  var hour = parseInt(parts[0], 10);
  var minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  // Interpret the chosen wall time in Central Time, not the script timezone.
  var wallTime = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute);
  var offset = timezoneOffsetMinutes(new Date(wallTime));
  return new Date(wallTime - offset * 60 * 1000);
}

// The caller holds the lock until the matching calendar event is created.
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

// A chosen date is a calendar date, so do not timezone-convert it.
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

// Standalone scripts create and remember their own booking log spreadsheet.
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

  // Store the date as text so Sheets cannot shift it by timezone.
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

// Open Apps Script links in the full tab, outside its sandboxed frame.
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

function htmlPage(title, bodyHtml) {
  var styledBody =
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:' +
    INK_PLUM + ';">' + bodyHtml + "</div>";
  return HtmlService.createHtmlOutput(wrapEmailShell("", title, "", styledBody));
}

// POST prevents mail-link scanners from changing a booking.
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
