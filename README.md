# Event Attendee Survey | استبيان الحضور

A bilingual (English / Arabic) survey website that runs on GitHub Pages. Answers are saved to a Google Sheet in your Google Drive, which also has a live summary tab with charts.

## Files

| File | What it does |
|---|---|
| `index.html` | The survey page — all the question text is here |
| `assets/config.js` | Settings: your Google Sheet link, the opening language, one-answer-per-phone |
| `assets/survey.css`, `assets/survey.js` | Design and interactions |
| `assets/banner.jpg` | Your event banner (already included) |
| `google-apps-script/Code.gs` | The small script that receives answers inside your Google Sheet. **Not used by the website** — you paste it into Google |

## Step 1 — Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) and name the sheet, for example "Event survey answers".
2. Open **Extensions → Apps Script**.
3. Delete what's in the editor, paste the whole of `google-apps-script/Code.gs`, and click **Save**.
4. In the toolbar, choose the `setup` function and click **Run**. Google asks you to authorize it — choose your account, then **Advanced → Go to (project name)** → **Allow**. (Google shows this warning for every personal script.)
5. Back in the sheet you'll now see two tabs: **Responses** and **Summary**.

## Step 2 — Get the link for the website

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy**.
4. Copy the **Web app URL** (it ends in `/exec`).
5. Open `assets/config.js` and paste it between the quotes of `endpoint`.

To check it works, open the URL in your browser. You should see `{"ok":true,"message":"Survey receiver is running."}`.

> If you change `Code.gs` later, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL.

## Step 3 — Put it on GitHub Pages

1. Create a new repository on GitHub and upload everything in this folder (except you can leave out `google-apps-script` if you prefer).
2. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
3. After a minute your survey is live at `https://<your-username>.github.io/<repository-name>/`. Turn that link into a QR code for the tables.

## Adding your banner

Your banner is already in `assets/banner.jpg`. To use a different one for another event, replace that file with a wide 3:1 image (for example 2400×800). If the file is missing, a dashed placeholder shows where it goes.

## Seeing the results

Open your Google Sheet:
- **Summary** — total answers, average rating, the share who said everything was great, and a bar chart for each question. It updates by itself as answers come in.
- **Responses** — every answer with its time, in English and Arabic, plus which language the guest used. Use **File → Download** for Excel or CSV.

The sheet is private to you. Guests can only send answers; they can't see them.

## Settings in assets/config.js

- `defaultLanguage: 'ar'` — the survey opens in Arabic; use `'en'` to open in English. Guests can switch with the عربي / English button at the top of the survey, and their choice is remembered.
- `onePerDevice: true` — each phone answers once (best for a QR code).
- `onePerDevice: false` — kiosk mode for one shared tablet: the thank-you screen shows a "Next guest" button.

## Testing

- Until you add the link in `config.js`, a pink notice at the top says answers aren't being saved. You can click through the survey freely.
- After answering once on your own phone, open the survey link with `#reset` at the end (for example `…github.io/survey/#reset`) to answer again.
- Delete your test rows from the **Responses** tab before the event.

## Changing the questions

The text lives in `index.html`. If you change or add an answer option, its `value="..."` must match a key in `RATING` or `IMPROVE` at the top of `Code.gs`. Then run `setup` again to rebuild the Summary tab and redeploy as a new version.
