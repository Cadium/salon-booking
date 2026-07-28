/**
 * HAIRBYBELLES — booking request notifier.
 *
 * This file is not run by the Next.js app. It is the source of truth for what
 * gets pasted into Google Apps Script, which logs each request to a Google
 * Sheet and emails a styled copy to the studio.
 *
 * SETUP
 *  1. Open a new Google Sheet (sheets.new). This sheet becomes the request log.
 *  2. Extensions > Apps Script. Delete the placeholder code, paste this in.
 *  3. Change OWNER_EMAIL below to the inbox that should receive requests.
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

var OWNER_EMAIL = "REPLACE_WITH_YOUR_EMAIL@gmail.com";
var STUDIO_NAME = "HAIRBYBELLES";

var SHEET_HEADERS = [
  "Received",
  "Name",
  "Email",
  "Phone",
  "Service",
  "Location",
  "Preferred date",
  "Notes",
];

// Brand palette, matching the site.
var INK_PLUM = "#1E1220";
var BONE = "#FBF3F0";
var BLUSH = "#F7E4EA";
var MAGENTA = "#B3125F";
var ROSE_POP = "#FF9DBD";
var GOLD = "#C9A24B";
var RULE = "#EADFE2";
var MUTED = "#8A7176";

function doPost(e) {
  var data = (e && e.parameter) || {};
  var received = new Date();

  logToSheet(received, data);

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    // Replying to the notification replies straight to the client.
    replyTo: data.email || OWNER_EMAIL,
    name: STUDIO_NAME + " website",
    subject: buildSubject(data),
    body: buildPlainBody(received, data),
    htmlBody: buildHtmlBody(received, data),
  });

  return ContentService.createTextOutput("OK");
}

function buildSubject(data) {
  var who = data.name || "Someone";
  return data.service
    ? "New booking request — " + who + " · " + data.service
    : "New booking request — " + who;
}

function logToSheet(received, data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet
      .getRange(1, 1, 1, SHEET_HEADERS.length)
      .setFontWeight("bold")
      .setBackground(BLUSH);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    received,
    data.name || "",
    data.email || "",
    data.phone || "",
    data.service || "",
    data.location || "",
    data.date || "",
    data.notes || "",
  ]);
}

/* ---------- email ---------- */

function timestamp(received) {
  return Utilities.formatDate(
    received,
    Session.getScriptTimeZone(),
    "EEEE d MMMM, h:mm a"
  );
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** One label/value row. Rows with no value are dropped entirely. */
function detailRow(label, valueHtml) {
  if (!valueHtml) return "";
  return (
    '<tr>' +
    '<td style="padding:14px 16px 14px 0;border-bottom:1px solid ' +
    RULE +
    ';font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.4;' +
    "letter-spacing:1.2px;text-transform:uppercase;color:" +
    MUTED +
    ';width:132px;vertical-align:top;">' +
    esc(label) +
    "</td>" +
    '<td style="padding:14px 0;border-bottom:1px solid ' +
    RULE +
    ';font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:' +
    INK_PLUM +
    ';">' +
    valueHtml +
    "</td>" +
    "</tr>"
  );
}

function link(href, text, color) {
  return (
    '<a href="' +
    esc(href) +
    '" style="color:' +
    color +
    ';text-decoration:none;border-bottom:1px solid ' +
    RULE +
    ';">' +
    esc(text) +
    "</a>"
  );
}

function buildHtmlBody(received, data) {
  var rows =
    detailRow(
      "Email",
      data.email ? link("mailto:" + data.email, data.email, MAGENTA) : ""
    ) +
    detailRow(
      "Phone",
      data.phone
        ? link("tel:" + String(data.phone).replace(/\s+/g, ""), data.phone, MAGENTA)
        : ""
    ) +
    detailRow("Service", esc(data.service)) +
    detailRow("Location", esc(data.location)) +
    detailRow("Preferred date", esc(data.date));

  var notes = data.notes
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="margin-top:28px;background:' +
      BLUSH +
      ';border-radius:2px;"><tr><td style="padding:20px 22px;">' +
      '<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;' +
      "letter-spacing:1.2px;text-transform:uppercase;color:" +
      MAGENTA +
      ';">Anything we should know</p>' +
      '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;' +
      "line-height:1.6;color:" +
      INK_PLUM +
      ';">' +
      esc(data.notes).replace(/\n/g, "<br>") +
      "</p></td></tr></table>"
    : "";

  var replyNote = data.email
    ? '<p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;' +
      "line-height:1.6;color:" +
      MUTED +
      ';">Hit reply and it goes straight to ' +
      // trailing full stop trimmed so initials like "Tolu A." don't double up
      esc(String(data.name || "them").replace(/\.\s*$/, "")) +
      ".</p>"
    : "";

  return (
    '<!doctype html><html><body style="margin:0;padding:0;background:' +
    BLUSH +
    ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="background:' +
    BLUSH +
    ';padding:32px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" ' +
    'style="width:600px;max-width:100%;background:' +
    BONE +
    ';border-radius:2px;overflow:hidden;">' +
    // header
    '<tr><td style="background:' +
    INK_PLUM +
    ';padding:22px 28px;">' +
    '<span style="font-family:Georgia,\'Times New Roman\',serif;font-weight:700;' +
    "font-size:20px;letter-spacing:.5px;color:" +
    BONE +
    ';">HAIR</span>' +
    '<span style="font-family:Georgia,serif;font-style:italic;font-size:14px;' +
    "color:" +
    ROSE_POP +
    ';padding:0 3px;">by</span>' +
    '<span style="font-family:Georgia,serif;font-weight:700;font-size:20px;' +
    "letter-spacing:.5px;color:" +
    ROSE_POP +
    ';">BELLES</span>' +
    "</td></tr>" +
    // gold hairline
    '<tr><td style="height:2px;background:' +
    GOLD +
    ';line-height:2px;font-size:0;">&nbsp;</td></tr>' +
    // body
    '<tr><td style="padding:32px 28px 36px;">' +
    '<p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;' +
    "letter-spacing:1.4px;text-transform:uppercase;color:" +
    MAGENTA +
    ';">New booking request</p>' +
    '<h1 style="margin:0 0 4px;font-family:Georgia,\'Times New Roman\',serif;' +
    "font-weight:400;font-size:30px;line-height:1.2;color:" +
    INK_PLUM +
    ';">' +
    esc(data.name || "New request") +
    "</h1>" +
    '<p style="margin:0 0 26px;font-family:Helvetica,Arial,sans-serif;font-size:13px;' +
    "color:" +
    MUTED +
    ';">' +
    esc(timestamp(received)) +
    "</p>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    rows +
    "</table>" +
    notes +
    replyNote +
    "</td></tr>" +
    // footer — keeps the card's own ground so the bottom edge stays defined
    // against the blush page behind it
    '<tr><td style="padding:18px 28px;background:' +
    BONE +
    ";border-top:1px solid " +
    RULE +
    ";font-family:Helvetica,Arial,sans-serif;font-size:12px;color:" +
    MUTED +
    ';">Sent from the ' +
    esc(STUDIO_NAME) +
    " booking form. A copy is saved in your requests sheet." +
    "</td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

/** Plain-text fallback for clients that will not render HTML. */
function buildPlainBody(received, data) {
  var lines = [
    "New booking request",
    timestamp(received),
    "",
    "Name: " + (data.name || "—"),
    "Email: " + (data.email || "—"),
    "Phone: " + (data.phone || "—"),
    "Service: " + (data.service || "—"),
    "Location: " + (data.location || "—"),
    "Preferred date: " + (data.date || "—"),
  ];

  if (data.notes) {
    lines.push("", "Notes:", data.notes);
  }

  return lines.join("\n");
}
