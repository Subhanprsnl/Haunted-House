/*
 * Darren Dzienciol's Haunted Hotel: plays the animated flyer.
 *
 * Two cuts: `signs` (the default: the hotel with its signs dark, lighting up one by one) and
 * `fade` (add `?cut=fade`: the night comes up out of the dark, then the signs fade in).
 * Each is an intro, played once, and a loop that waits primed under it and takes over when the
 * intro ends, repeating with the video element's own `loop` (no seek, so no hitch in Safari).
 * Each film is HEVC, then AV1, then H.264: the browser plays the first it can.
 * If the film cannot run (reduced motion, Low Power Mode, a decode error, a stall), the page shows
 * the finished invitation as a still and the RSVP at once.
 */

// Where the RSVP sign sends guests: the event's official RSVP page.
const RSVP_URL = '#';

const A = 'assets';
const PORTRAIT = '(max-aspect-ratio: 1/1)';
const STALL_MS = 4000;
const LAG_S = 1.5;

/** Seconds each cut's intro runs (frames 126 and 204 at 24 fps). */
const LOOP_AT = { signs: 5.25, fade: 8.5 };

function encodes(stem, h, phone) {
  return [
    { src: `${A}/${stem}-hevc.${h.hevc}.mp4`, type: `video/mp4; codecs="hvc1.1.6.${phone ? 'L150' : 'L120'}.B0"` },
    { src: `${A}/${stem}-av.${h.av}.mp4`, type: `video/mp4; codecs="av01.0.${phone ? '12M' : '08M'}.08"` },
    { src: `${A}/${stem}-avc.${h.avc}.mp4`, type: 'video/mp4; codecs="avc1.640033"', last: true },
  ];
}

const FILMS = {
  signs: {
    phone: {
      poster: `${A}/phone-poster.17c6c4233d0e.webp`,
      still: `${A}/phone-still.56083cea5267.webp`,
      intro: encodes('phone-intro', { hevc: '181c397338f9', av: '46780a5c6ab2', avc: '78206b2cfb7f' }, true),
      loop: encodes('phone-loop', { hevc: '2fa196227110', av: 'cf459a821f18', avc: '5a08132d5a27' }, true),
    },
    web: {
      poster: `${A}/web-poster.eb9c12c27e29.webp`,
      still: `${A}/web-still.4c14703c84c0.webp`,
      intro: encodes('web-intro', { hevc: 'e44a23cd9644', av: 'bc95a60d25bd', avc: 'a3da0e473a4e' }, false),
      loop: encodes('web-loop', { hevc: 'edc16a4bf2c4', av: '77b8b1afa23e', avc: 'eae56ac00e68' }, false),
    },
  },
  fade: {
    phone: {
      poster: `${A}/fade-phone-poster.75d52131faa9.webp`,
      still: `${A}/fade-phone-still.a3709a2b9431.webp`,
      intro: encodes('fade-phone-intro', { hevc: '012afdeb11f9', av: 'a883fdcc3c86', avc: '9622c10ebc99' }, true),
      loop: encodes('fade-phone-loop', { hevc: '5091a3e9c901', av: '1d1b5fd3ae9d', avc: '7a0dbaf14cda' }, true),
    },
    web: {
      poster: `${A}/fade-web-poster.ac967f3c1985.webp`,
      still: `${A}/fade-web-still.396cd83e7827.webp`,
      intro: encodes('fade-web-intro', { hevc: '4f47338e914d', av: '623a2dcc6930', avc: '2534135f0dda' }, false),
      loop: encodes('fade-web-loop', { hevc: 'b14131b92fc8', av: '5d61b6dbe9ab', avc: 'f305b7e55ff7' }, false),
    },
  },
};

const cut = new URLSearchParams(location.search).get('cut') === 'fade' ? 'fade' : 'signs';
document.body.dataset.cut = cut;

const stage = document.getElementById('stage');
const plate = document.getElementById('plate');
const platePhone = document.getElementById('plate-phone');
const cta = document.getElementById('cta');
const rsvp = document.getElementById('rsvp');
rsvp.href = RSVP_URL;
if (cut === 'fade') showPlates('poster');

const portrait = matchMedia(PORTRAIT);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

let still = false;
let teardown = () => {};

function reveal() {
  cta.dataset.show = 'true';
  cta.inert = false;
}

function showPlates(kind) {
  plate.src = FILMS[cut].web[kind];
  platePhone.srcset = FILMS[cut].phone[kind];
}

/** The film cannot run: the finished invitation, and the RSVP at once. */
function giveUp() {
  if (still) return;
  still = true;
  teardown();
  showPlates('still');
  reveal();
}

function video(sources, extra) {
  const v = document.createElement('video');
  v.className = `film ${extra}`;
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.disablePictureInPicture = true;
  v.disableRemotePlayback = true;
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  for (const s of sources) {
    const source = document.createElement('source');
    source.src = s.src;
    source.type = s.type;
    if (s.last) source.addEventListener('error', giveUp);
    v.appendChild(source);
  }
  v.addEventListener('error', giveUp);
  return v;
}

function play() {
  teardown();
  if (still) return;
  const art = FILMS[cut][portrait.matches ? 'phone' : 'web'];
  const loopAt = LOOP_AT[cut];
  delete stage.dataset.looping;

  const first = video(art.intro, 'film--intro');
  first.poster = art.poster;
  const next = video(art.loop, 'film--loop');
  next.loop = true;
  stage.append(first, next);
  first.play().catch(giveUp);

  let handed = false;
  // Prime the loop on its first frame while the intro plays: iOS loads nothing for a video that
  // has never played, so play it for a moment and park it at the start.
  first.addEventListener(
    'playing',
    () => {
      next
        .play()
        .then(() => {
          if (handed) return;
          next.pause();
          next.currentTime = 0;
        })
        .catch(() => {});
    },
    { once: true },
  );

  // The hand-over: the intro holds its last frame until the loop's first is painted.
  const looping = () => {
    stage.dataset.looping = 'true';
    reveal();
  };
  first.addEventListener('ended', () => {
    handed = true;
    next.currentTime = 0;
    next.play().catch(giveUp);
    if (typeof next.requestVideoFrameCallback === 'function') next.requestVideoFrameCallback(looping);
    else next.addEventListener('playing', looping, { once: true });
  });

  // A watchdog on what is painted, not what the clock says. Played time only.
  const watchesFrames = typeof first.requestVideoFrameCallback === 'function';
  let painted = -1;
  const onFrame = (_now, meta) => {
    painted = meta.mediaTime;
    first.requestVideoFrameCallback(onFrame);
  };
  if (watchesFrames) first.requestVideoFrameCallback(onFrame);
  let running = 0;
  const watchdog = setInterval(() => {
    if (handed || first.paused || document.hidden) return;
    running += 500;
    const stuck = watchesFrames
      ? (running >= STALL_MS && painted < 0) || first.currentTime - Math.max(painted, 0) > LAG_S
      : running >= STALL_MS && first.currentTime === 0;
    if (stuck || running >= loopAt * 1000 + STALL_MS) giveUp();
  }, 500);

  // A hidden tab pauses the film; it picks up where it was.
  const onVisibility = () => {
    const active = stage.dataset.looping ? next : first;
    if (document.hidden) active.pause();
    else if (!active.ended) active.play().catch(() => {});
  };
  document.addEventListener('visibilitychange', onVisibility);

  teardown = () => {
    clearInterval(watchdog);
    document.removeEventListener('visibilitychange', onVisibility);
    first.remove();
    next.remove();
    teardown = () => {};
  };
}

if (reduced.matches) {
  giveUp();
} else {
  play();
  // A new screen shape is a new film: it plays from the start.
  portrait.addEventListener('change', play);
}
