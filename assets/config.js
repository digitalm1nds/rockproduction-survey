/* ==========================================================
   Event Attendee Survey — settings
   ========================================================== */
window.SURVEY_CONFIG = {

  // Paste your Google Apps Script web app link between the quotes.
  // It looks like: https://script.google.com/macros/s/AKfy.../exec
  // (README.md, step 2, shows where to get it.)
  endpoint: '',

  // Language the survey opens in: 'ar' (Arabic) or 'en' (English).
  // Guests can switch at the top of the survey; their choice is remembered.
  defaultLanguage: 'ar',

  // true  = each phone can answer once (best for a QR code on the tables).
  // false = kiosk mode for one shared tablet: "Thank you" shows a "Next guest" button.
  onePerDevice: true

};
