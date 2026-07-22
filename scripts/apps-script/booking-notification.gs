// HAIRBYBELLES — reservation form notifier.
//
// This file is not run by the Next.js app; it's the source of truth for what
// gets pasted into Google Apps Script. Deploy steps:
//   1. Open (or create) a Google Sheet to log requests into.
//   2. Extensions > Apps Script, delete the default content, paste this file in.
//   3. Replace OWNER_EMAIL below with the real inbox that should get requests.
//   4. Deploy > New deployment > type "Web app" > Execute as: Me > Who has
//      access: Anyone. Authorize when prompted.
//   5. Copy the resulting /exec URL into NEXT_PUBLIC_GAS_WEB_APP_URL
//      (in .env.local for local dev, and in Vercel's project env vars for prod).

var OWNER_EMAIL = "REPLACE_WITH_OWNER_EMAIL@gmail.com";

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = e.parameter;

  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.phone,
    data.service,
    data.location,
    data.date,
    data.notes,
  ]);

  var body =
    "New request from the HAIRBYBELLES site:\n\n" +
    "Name: " + data.name + "\n" +
    "Email: " + data.email + "\n" +
    "Phone: " + data.phone + "\n" +
    "Service: " + data.service + "\n" +
    "Location: " + data.location + "\n" +
    "Preferred date: " + data.date + "\n" +
    "Notes: " + data.notes;

  MailApp.sendEmail(OWNER_EMAIL, "New booking request — " + data.name, body);

  return ContentService.createTextOutput("OK");
}
