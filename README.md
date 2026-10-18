# Darren Dzienciol's Haunted Hotel

A static, single-page animated flyer with an RSVP popup: no build step, no dependencies.

- `index.html`, `styles.css`, `app.js`: the page, the popup and the player.
- `assets/`: the film (an intro and a seamless loop per screen shape, each as HEVC, AV1 and
  H.264), its posters and stills, the blurred fill behind it, and the RSVP sign's font
  (Young Serif, SIL Open Font License).

Two cuts: the default fades the night in out of the dark and then the signs; add `?cut=signs`
for the one that opens on the hotel and lights its signs one by one.

## The RSVP popup

Phone number (with an optional "text me when new events drop" box), then first name, last name
and email, then "You're on the list". Each RSVP is sent as a form POST to `RSVP_ENDPOINT` at the
top of `app.js`, with these fields:

| Field | Example |
|---|---|
| `submittedAt` | `2026-10-18T12:44:30.687Z` |
| `firstName`, `lastName`, `email` | `Ada`, `Lovelace`, `ada@example.com` |
| `phone` | `+12025550199` (country code + number) |
| `country` | `US` |
| `textMeAboutNewEvents` | `yes` / `no` |
| `version` | `fade` / `signs` |

Until `RSVP_ENDPOINT` is set, the popup says "RSVPs aren't open yet" instead of pretending to
save. Nothing sends the address automatically: the popup tells guests it will be texted to them,
so text it to the list yourself before the night.

### Option A: a Google Sheet (free)

1. Make a new Google Sheet. Extensions → Apps Script, and replace the code with:

   ```js
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     const cols = ['submittedAt', 'firstName', 'lastName', 'email', 'phone', 'country',
                   'textMeAboutNewEvents', 'version'];
     if (sheet.getLastRow() === 0) sheet.appendRow(cols);
     sheet.appendRow(cols.map(c => e.parameter[c] || ''));
     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

2. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Deploy, allow it.
3. Copy the web app URL (`https://script.google.com/macros/s/…/exec`) into `RSVP_ENDPOINT`.

### Option B: Formspree

Make a form at formspree.io, and put its endpoint (`https://formspree.io/f/<id>`) in
`RSVP_ENDPOINT`. RSVPs arrive by email and in its dashboard (the free plan has a monthly cap).

## Deploy

Any static host serves it as is:

- **Vercel / Netlify:** import the repo, no framework, no build command, output directory `/`.
  Add your domain in the project's settings.
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main`, `/ (root)` (a private repo
  needs a paid plan).

Every asset name carries its content hash, so the host can cache `assets/` forever.
