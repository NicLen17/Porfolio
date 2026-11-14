import { plasmaReveal, type PlasmaHandle } from './plasma';

/**
 * Hero intro in three acts: the keys fall onto the board and come into focus
 * blank (pure CSS, already running before this script loads), one pulse runs
 * through them from the centre, and the name condenses out of light there. Any scroll, key press or tap
 * skips to the end. Afterwards the lanes of the board drift and a click on
 * any key sends a pulse through the rest.
 */
const root = document.documentElement;
const hero = document.querySelector<HTMLElement>('.hero');
const nameEl = hero?.querySelector<HTMLElement>('.hero__name');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const PHASES = ['intro', 'intro-short', 'intro--dark', 'intro--reveal', 'intro--css', 'name-on', 'intro-lock'];
const SKIP_KEYS = new Set(['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown', 'End', 'Tab']);

let timers: number[] = [];
let plasma: PlasmaHandle | null = null;
let running = false;

const later = (fn: () => void, ms: number) => {
  timers.push(window.setTimeout(fn, ms));
};

function finish() {
  if (!running) return;
  running = false;
  timers.forEach(clearTimeout);
  timers = [];
  plasma?.cancel();
  plasma = null;
  root.classList.remove(...PHASES);
  root.classList.add('intro-done', 'intro-settle');
  setTimeout(() => root.classList.remove('intro-settle'), 2800);
  try {
    sessionStorage.setItem('fr-intro', '1');
  } catch {
    /* private mode: the intro simply plays again next time */
  }
  removeEventListener('wheel', finish);
  removeEventListener('touchmove', finish);
  removeEventListener('keydown', onKey);
  removeEventListener('scroll', onScroll);
  drift();
  helloCv();
}

function onKey(event: KeyboardEvent) {
  if (SKIP_KEYS.has(event.key)) finish();
}

/** A reload that restores a scrolled position must not be trapped behind the intro. */
function onScroll() {
  if (scrollY > 40) finish();
}

function listenForSkip() {
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('wheel', finish, { passive: true });
  addEventListener('touchmove', finish, { passive: true });
  addEventListener('keydown', onKey);
}

/** A canvas only ever holds one WebGL context, so each run gets a new canvas. */
function freshCanvas() {
  const old = hero!.querySelector<HTMLCanvasElement>('.hero__fx')!;
  const next = document.createElement('canvas');
  next.className = 'hero__fx';
  next.setAttribute('aria-hidden', 'true');
  old.replaceWith(next);
  return next;
}

async function reveal() {
  if (!running || !hero || !nameEl) return;
  // The texture is drawn with the display font, so wait for it (briefly).
  await Promise.race([document.fonts.load('800 80px "Archivo Variable"'), new Promise((r) => setTimeout(r, 900))]);
  if (!running) return;

  const canvas = freshCanvas();
  root.classList.add('intro--reveal');
  drift(); // the lanes start with the name, before the pictures return
  try {
    plasma = plasmaReveal(hero, canvas, nameEl, 820, () => root.classList.add('name-on'));
  } catch {
    plasma = null;
  }
  if (plasma) {
    later(finish, 2800); // never wait on the GPU longer than the animation takes
    const ok = await plasma.done;
    if (ok || !running) return finish();
    plasma = null;
  }
  // No WebGL, or the context was lost: the same idea in plain CSS.
  canvas.style.display = 'none';
  root.classList.add('intro--css', 'name-on');
  later(finish, 1350);
}

function playFull() {
  running = true;
  if (scrollY > 40) return finish();
  root.classList.add('intro-lock');
  listenForSkip();

  const last = hero?.querySelector<HTMLElement>('.tile[data-last]');
  let darkened = false;
  const darken = () => {
    if (darkened || !running) return;
    darkened = true;
    // A beat to take in the finished board before the lights go out.
    later(() => {
      root.classList.add('intro--dark');
      later(reveal, 140);
    }, 220);
  };
  const onEnd = (event: AnimationEvent) => {
    if (event.animationName !== 'tile-focus') return;
    last?.removeEventListener('animationend', onEnd);
    darken();
  };
  last?.addEventListener('animationend', onEnd);
  later(darken, 2900); // in case the animation event never arrives
}

function playShort() {
  running = true;
  later(finish, 1000);
}

function replay() {
  if (running) return;
  root.classList.remove('intro-done');
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  void hero?.offsetWidth; // restart the CSS animations
  root.classList.add('intro');
  playFull();
}

/* Résumé tab ----------------------------------------------------------- */

const cv = hero?.querySelector<HTMLElement>('[data-cv]');
const cvTab = cv?.querySelector<HTMLButtonElement>('button');

/** Slides out to say hello, then tucks back to a tab that stays clickable. */
function helloCv() {
  if (!cv || calm) return;
  setTimeout(() => {
    cv.classList.add('is-open');
    setTimeout(() => cv.classList.remove('is-open'), 2600);
  }, 700);
}

cvTab?.addEventListener('click', () => {
  const open = cv!.classList.toggle('is-open');
  cvTab.setAttribute('aria-expanded', String(open));
});

/* Lanes ---------------------------------------------------------------- */

let live = false;
let drifting = false;

const lanes = Array.from(hero?.querySelectorAll<HTMLElement>('.lane') ?? []).map((el, i) => ({
  el,
  dir: Number(el.dataset.lane),
  speed: 0.065 + ((i * 37) % 5) * 0.016, // tiles per second
  off: -0.5,
}));

const canDrift = () => live && !document.hidden && (root.classList.contains('intro-done') || root.classList.contains('intro--reveal'));

/**
 * The board moves in two alternating ways. First every lane slides along its
 * own axis, neighbours in opposite directions. Then they ease to a stop and the
 * whole board travels across the lanes instead, from the bottom left of the
 * screen to the top right. Whatever leaves one side (a key, or a whole lane)
 * is moved to the other, so nothing runs out and nothing is duplicated.
 */
const ALONG = 13; // seconds sliding along the lanes
const ACROSS = 11; // seconds travelling across them
const EASE = 1.6; // seconds to speed up or slow down
const CLIMB = 0.085; // lanes per second while travelling across
let clock = 0;
let rise = 0;

/** 0 to 1 and back: how fast a movement runs `t` seconds into a stretch of `length`. */
const swell = (t: number, length: number) => {
  const x = Math.min(1, Math.max(0, Math.min(t, length - t) / EASE));
  return x * x * (3 - 2 * x);
};

function drift() {
  if (drifting || calm || !lanes.length || !canDrift()) return;
  drifting = true;
  const grid = lanes[0].el.parentElement!;
  let before = performance.now();
  let size = lanes[0].el.firstElementChild!.clientWidth;
  let width = innerWidth;

  const tick = (now: number) => {
    if (!canDrift()) {
      drifting = false;
      return;
    }
    if (innerWidth !== width) {
      width = innerWidth;
      size = lanes[0].el.firstElementChild!.clientWidth;
    }
    const dt = Math.min(0.05, (now - before) / 1000);
    before = now;
    clock = (clock + dt) % (ALONG + ACROSS);
    const along = clock < ALONG ? swell(clock, ALONG) : 0;
    const across = clock < ALONG ? 0 : swell(clock - ALONG, ACROSS);

    // Across: towards the top right of the screen is "up" the list of lanes.
    rise -= CLIMB * across * dt;
    if (rise < -0.5) {
      rise += 1;
      grid.append(grid.firstElementChild!);
    }
    for (const lane of lanes) {
      lane.off += lane.dir * lane.speed * along * dt;
      if (lane.off <= -1) {
        lane.off += 1;
        lane.el.append(lane.el.firstElementChild!);
      } else if (lane.off >= 0) {
        lane.off -= 1;
        lane.el.prepend(lane.el.lastElementChild!);
      }
      lane.el.style.transform = `translate3d(${(lane.off * size).toFixed(2)}px,${(rise * size).toFixed(2)}px,0)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** The pulse: every key dips and flashes, later the further it is from the click. */
function ping(origin: HTMLElement) {
  if (!hero || calm) return;
  const from = origin.getBoundingClientRect();
  const ox = from.left + from.width / 2;
  const oy = from.top + from.height / 2;
  const tiles = Array.from(hero.querySelectorAll<HTMLElement>('.tile'));
  const delays = tiles.map((tile) => {
    const box = tile.getBoundingClientRect();
    // The board is foreshortened vertically, so vertical distance counts for more.
    return Math.hypot(box.left + box.width / 2 - ox, (box.top + box.height / 2 - oy) * 1.7) * 0.85;
  });
  tiles.forEach((tile) => tile.classList.remove('is-ping'));
  void hero.offsetWidth;
  tiles.forEach((tile, i) => {
    tile.style.setProperty('--pd', `${Math.round(delays[i])}ms`);
    tile.classList.add('is-ping');
  });
}

if (hero) {
  if (root.classList.contains('intro')) playFull();
  else if (root.classList.contains('intro-short')) playShort();

  hero.querySelector('[data-intro-skip]')?.addEventListener('click', finish);
  hero.querySelector('[data-intro-replay]')?.addEventListener('click', replay);

  hero.querySelector('.tiles')?.addEventListener('click', (event) => {
    const tile = (event.target as Element).closest<HTMLElement>('.tile');
    if (tile && root.classList.contains('intro-done')) ping(tile);
  });

  // The lanes only move while the hero is on screen and the tab is visible.
  new IntersectionObserver(([entry]) => {
    live = entry.isIntersecting;
    drift();
  }).observe(hero);
  document.addEventListener('visibilitychange', drift);
}
