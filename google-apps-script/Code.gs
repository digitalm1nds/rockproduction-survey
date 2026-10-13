/**
 * Event Attendee Survey — Google Sheets receiver
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet,
 * run setup() once, then deploy as a Web app (see README.md).
 */

// Keys must match the value="" of the options in index.html.
const RATING = {
  excellent: ['Excellent', 'ممتازة', 5],
  very_good: ['Very Good', 'جيدة جداً', 4],
  good:      ['Good', 'جيدة', 3],
  fair:      ['Fair', 'مقبولة', 2],
  poor:      ['Poor', 'ضعيفة', 1]
};

const IMPROVE = {
  organization:   ['Event Organization', 'تنظيم الفعالية'],
  venue:          ['Venue Facilities & Comfort', 'مرافق المكان والراحة'],
  sound_lighting: ['Sound & Lighting', 'الصوت والإضاءة'],
  program:        ['Event Program & Entertainment', 'برنامج الفعالية والترفيه'],
  food:           ['Food & Beverage Options', 'خيارات المأكولات والمشروبات'],
  nothing:        ['Nothing – Everything Was Great', 'لا شيء، كل شيء كان رائعاً']
};

const RESPONSES = 'Responses';
const SUMMARY = 'Summary';
const TIMEZONE = 'Asia/Beirut';
const HEADERS = ['Submitted at', 'Overall experience', 'Score (1-5)', 'Improve first', 'التجربة', 'التحسين', 'Language'];

/* ---------- Receives each answer from the website ---------- */
function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden field only bots fill in: say ok, save nothing.
  if (p.website) return json_({ ok: true });

  const rating = RATING[p.rating];
  const improve = IMPROVE[p.improve];
  if (!rating || !improve) {
    return json_({ ok: false, error: 'Please answer both questions' });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const language = p.lang === 'en' ? 'English' : 'Arabic';
    responsesSheet_().appendRow([new Date(), rating[0], rating[2], improve[0], rating[1], improve[1], language]);
  } catch (err) {
    return json_({ ok: false, error: 'Could not save, try again' });
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

/* Opening the web app link in a browser shows this — handy to check it works. */
function doGet() {
  return json_({ ok: true, message: 'Survey receiver is running.' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function responsesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(RESPONSES);
  if (!sh) {
    sh = ss.insertSheet(RESPONSES, 0);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.setColumnWidth(1, 150);
    sh.setColumnWidths(2, 6, 190);
  }
  return sh;
}

/* ---------- Run once: builds the Responses and Summary tabs ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TIMEZONE);
  responsesSheet_();

  let sh = ss.getSheetByName(SUMMARY);
  if (sh) {
    sh.getCharts().forEach(function (c) { sh.removeChart(c); });
    sh.clear();
  } else {
    sh = ss.insertSheet(SUMMARY, 1);
  }

  const R = RESPONSES;
  sh.getRange('A1').setValue('Event Attendee Survey — live summary').setFontSize(14).setFontWeight('bold');

  // Headline numbers
  sh.getRange('A3:A5').setValues([['Answers'], ['Average rating (out of 5)'], ['Said everything was great']]);
  sh.getRange('B3:B5').setFormulas([
    ['=COUNTA(' + R + '!A2:A)'],
    ['=IFERROR(ROUND(AVERAGE(' + R + '!C2:C),1),"–")'],
    ['=IFERROR(COUNTIF(' + R + '!D2:D,A20)/B3,0)']
  ]);
  sh.getRange('B5').setNumberFormat('0%');
  sh.getRange('B3:B5').setFontWeight('bold').setHorizontalAlignment('left');

  // Question 1 table (rows 7–12)
  const q1 = [['Overall experience', 'التجربة']];
  Object.keys(RATING).forEach(function (k, i) {
    const row = 8 + i;
    q1.push([RATING[k][0], RATING[k][1]]);
    sh.getRange(row, 3, 1, 2).setFormulas([['=COUNTIF(' + R + '!$B$2:$B,A' + row + ')', '=IFERROR(C' + row + '/$B$3,0)']]);
  });
  sh.getRange(7, 1, q1.length, 2).setValues(q1);
  sh.getRange('C7:D7').setValues([['Answers', 'Share']]);

  // Question 2 table (rows 14–20)
  const q2 = [['Improve first', 'التحسين']];
  Object.keys(IMPROVE).forEach(function (k, i) {
    const row = 15 + i;
    q2.push([IMPROVE[k][0], IMPROVE[k][1]]);
    sh.getRange(row, 3, 1, 2).setFormulas([['=COUNTIF(' + R + '!$D$2:$D,A' + row + ')', '=IFERROR(C' + row + '/$B$3,0)']]);
  });
  sh.getRange(14, 1, q2.length, 2).setValues(q2);
  sh.getRange('C14:D14').setValues([['Answers', 'Share']]);

  sh.getRangeList(['A7:D7', 'A14:D14']).setFontWeight('bold').setBackground('#E0182D').setFontColor('#FFFFFF');
  sh.getRangeList(['D8:D12', 'D15:D20']).setNumberFormat('0%');
  sh.setColumnWidth(1, 240);
  sh.setColumnWidth(2, 200);

  // Charts
  sh.insertChart(sh.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange('A7:A12'))
    .addRange(sh.getRange('C7:C12'))
    .setNumHeaders(1)
    .setPosition(2, 6, 0, 0)
    .setOption('title', 'Overall experience')
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#E0182D'])
    .setOption('width', 520).setOption('height', 260)
    .build());

  sh.insertChart(sh.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange('A14:A20'))
    .addRange(sh.getRange('C14:C20'))
    .setNumHeaders(1)
    .setPosition(16, 6, 0, 0)
    .setOption('title', 'What to improve first')
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#8C1322'])
    .setOption('width', 520).setOption('height', 300)
    .build());

  // Tidy up the empty default tab if it's still there
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(blank);

  ss.setActiveSheet(sh);
}
