# Darren Dzienciol's Haunted Hotel

A static, single-page animated flyer: no build step, no dependencies.

- `index.html`, `styles.css`, `app.js`: the page and its player.
- `assets/`: the film (an intro and a seamless loop per screen shape, each as HEVC, AV1 and
  H.264), its posters and stills, the blurred fill behind it, and the RSVP sign's font
  (Young Serif, SIL Open Font License).

Two cuts: the default fades the night in out of the dark and then the signs; add `?cut=signs`
for the one that opens on the hotel and lights its signs one by one.

## Before you deploy

Set where the RSVP sign goes: `RSVP_URL` at the top of `app.js` (the event's RSVP page).

## Deploy

Any static host serves it as is:

- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main`, `/ (root)`. For a custom
  domain, add it under Pages and point a CNAME record at `<user>.github.io`.
- **Vercel / Netlify:** import the repo, no framework, no build command, output directory `/`.

Every asset name carries its content hash, so the host can cache `assets/` forever.
