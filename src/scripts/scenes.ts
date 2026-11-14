import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Product scenes. Loaded on demand (see page.ts) so the animation library
 * never weighs on the first paint.
 *
 * - Volley Manager: once the title has been read, a match ball the size of
 *   the screen rolls from left to right with the scroll and wipes the page
 *   into the product. Scrolling on moves through three screens (live
 *   scouting, match dashboard, voice scouting).
 * - ExpoLogic: the fair map builds from the entrance upwards and the
 *   two-click reservation plays out with the scroll, then the organizer
 *   dashboard and the map builder follow.
 *
 * Everything here runs one way. Scrolling forward plays it; scrolling back
 * finds it already played and the carousel on the last screen reached. The
 * scroll already spent is taken out of the section whenever the page comes to
 * rest, so the way back up is a few lines long, not the whole scene again.
 * A screen picked by hand (its number, the arrows, or the screen itself)
 * comes into focus without scrolling and plays its film by itself.
 */

const clamp = gsap.utils.clamp;
const PINNED = '(min-width: 1000px) and (min-height: 700px)';

/** Centre of `el` in `frame`'s own (untransformed) pixels, even while the frame is scaled. */
function centre(el: Element, frame: HTMLElement) {
  const a = el.getBoundingClientRect();
  const b = frame.getBoundingClientRect();
  const k = b.width ? frame.offsetWidth / b.width : 1;
  return { x: (a.left - b.left + a.width / 2) * k, y: (a.top - b.top + a.height / 2) * k };
}

/**
 * Giving scroll back. Each pinned scene registers a function that says how
 * many viewport-heights of its scroll are already used up. Whenever the page
 * has been still for a moment, every scene is shortened by that much and the
 * page is moved up by the same amount in the same frame: the pinned pictures
 * do not depend on those stretches any more, so nothing on screen changes.
 * All scenes are settled together, with one measurement pass and one refresh.
 */
type Settle = () => { root: HTMLElement; cut: number; apply: () => void } | null;
const settlers = new Set<Settle>();
let restTimer = 0;
function settle() {
  const jobs = [...settlers].map((ask) => ask()).filter((job) => job !== null);
  if (!jobs.length) return;
  // Measure everything before changing anything.
  const shift = jobs.reduce((sum, job) => {
    const into = -job.root.getBoundingClientRect().top;
    return sum + (into > 0 ? Math.min(into, (job.cut * innerHeight) / 100) : 0);
  }, 0);
  jobs.forEach((job) => job.apply());
  if (shift > 0) scrollTo({ top: scrollY - shift, behavior: 'instant' });
  ScrollTrigger.refresh();
}
function onRest(ask: Settle) {
  if (!settlers.size) {
    addEventListener(
      'scroll',
      () => {
        clearTimeout(restTimer);
        restTimer = window.setTimeout(settle, 180);
      },
      { passive: true },
    );
  }
  settlers.add(ask);
  return () => void settlers.delete(ask);
}

/**
 * A mock screen's CSS film, driven by hand. Each mock names the stretch of its
 * loop that is the build-up (`data-film="from,to"`, as fractions); `p` (0 to 1)
 * is how far through that stretch the reader has scrolled. It only ever moves
 * forward and stays on its last frame. Short ambient loops inside the mock (a
 * voice meter, a pulsing light) are left running.
 */
function film(mock: HTMLElement | null) {
  const [from, to] = (mock?.dataset.film ?? '0,0.9').split(',').map(Number);
  const head = { p: 0 };
  let far = -1;
  let auto: gsap.core.Tween | null = null;
  const show = (p: number) => {
    if (!mock) return;
    const parts = mock.getAnimations({ subtree: true });
    const span = (part: Animation) => Number(part.effect?.getComputedTiming().duration) || 0;
    const length = Math.max(0, ...parts.map(span));
    parts.forEach((part) => {
      if (span(part) < length - 1) return;
      part.pause();
      part.currentTime = (from + (to - from) * p) * length;
    });
  };
  return {
    to(p: number) {
      if (auto || p <= far) return;
      far = p;
      show(far);
    },
    /** Plays the whole build-up by itself, from the start: for a screen opened by hand. */
    play() {
      auto?.kill();
      far = 1;
      head.p = 0;
      auto = gsap.to(head, { p: 1, duration: 2.8, ease: 'power1.inOut', onUpdate: () => show(head.p), onComplete: () => void (auto = null) });
    },
    /** Hands the film back to its own CSS loop. */
    free() {
      auto?.kill();
      auto = null;
      if (!mock) return;
      far = -1;
      mock.style.display = 'none';
      void mock.offsetWidth;
      mock.style.display = '';
    },
  };
}

/* Reels ---------------------------------------------------------------- */

/**
 * The vertical carousel of a pinned product: one screen in focus, its
 * neighbours waiting above and below. The scene decides which one is active
 * (from the scroll) and what "go to screen n" means (a scroll position).
 */
function makeReel(root: HTMLElement) {
  const slides = Array.from(root.querySelectorAll<HTMLElement>('.reel__slide'));
  const copies = Array.from(root.querySelectorAll<HTMLElement>('.reel-copy__item'));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-reel-go]'));
  const prev = root.querySelector<HTMLButtonElement>('[data-reel-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-reel-next]')!;
  let active = -1;
  let go: (i: number) => void = () => {};
  let changed: (i: number) => void = () => {};
  const jump = (i: number) => go(clamp(0, slides.length - 1, i));

  prev.addEventListener('click', () => jump(active - 1));
  next.addEventListener('click', () => jump(active + 1));
  dots.forEach((dot, n) => dot.addEventListener('click', () => jump(n)));
  // A waiting screen is a button too: click it to bring it into focus.
  slides.forEach((slide, n) => slide.addEventListener('click', () => active >= 0 && n !== active && jump(n)));

  return {
    get active() {
      return active;
    },
    set(i: number) {
      if (i === active) return;
      active = i;
      slides.forEach((slide, n) => {
        slide.classList.toggle('is-on', n === i);
        slide.classList.toggle('is-prev', n === i - 1);
        slide.classList.toggle('is-next', n === i + 1);
        slide.classList.toggle('is-up', n < i - 1);
      });
      copies.forEach((copy, n) => copy.classList.toggle('is-on', n === i));
      dots.forEach((dot, n) => (n === i ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current')));
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
      changed(i);
    },
    clear() {
      active = -1;
      [...slides, ...copies].forEach((el) => el.classList.remove('is-on', 'is-prev', 'is-next', 'is-up'));
    },
    onGo(fn: (i: number) => void) {
      go = fn;
    },
    onChange(fn: (i: number) => void) {
      changed = fn;
    },
  };
}

/* Volley Manager ------------------------------------------------------ */

const PLAYS = [
  { player: 7, skill: 2, shot: 0, zone: 1, line: 0 },
  { player: 9, skill: 0, shot: 1, zone: 5, line: 1 },
  { player: 4, skill: 2, shot: 2, zone: 6, line: 0 },
];

/** The scripted coach: player, keypad, trajectory, point. One play on screen at a time. */
function volleyDemo(root: HTMLElement) {
  const ui = root.querySelector<HTMLElement>('.vm__ui')!;
  const svg = ui.querySelector<SVGSVGElement>('.vm__court')!;
  const touch = ui.querySelector<HTMLElement>('.vm__touch')!;
  const pad = ui.querySelector<HTMLElement>('.vm__pad')!;
  const hint = ui.querySelector<HTMLElement>('[data-hint]')!;
  const hintN = hint.querySelector('b')!;
  const hintText = hint.querySelector('span')!;
  const hints: string[] = JSON.parse(hint.dataset.steps!);
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.vm__steps li'));
  const scoreEl = ui.querySelector<HTMLElement>('[data-score]')!;
  const logScore = ui.querySelector<HTMLElement>('[data-log-score]')!;
  const logText = ui.querySelector<HTMLElement>('[data-log-text]')!;
  const target = ui.querySelector<SVGElement>('.vm__target')!;
  const lines: string[] = JSON.parse(logText.dataset.lines!);
  const meta: string[] = JSON.parse(logText.dataset.meta!);
  const rival = 9;
  const drawn = ui.querySelectorAll('.vm__heat rect, .vm__heat text, .vm__shots g, .vm__ring, .vm__target');

  const setStep = (n: number) => {
    steps.forEach((li, i) => li.classList.toggle('is-on', i === n));
    if (n < 0) return;
    hintN.textContent = n < 3 ? String(n + 1) : '✓';
    hintText.textContent = hints[n];
    hint.classList.toggle('is-done', n === 3);
  };

  const clearKeys = () => {
    pad.classList.remove('is-armed');
    pad.querySelectorAll('.is-hit, .is-on').forEach((el) => el.classList.remove('is-hit', 'is-on'));
  };

  const reset = () => {
    gsap.set(drawn, { opacity: 0 });
    // Each trajectory is one dash as long as the path, pushed fully out of view.
    ui.querySelectorAll<SVGPathElement>('.vm__shots path').forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
    gsap.set([touch, hint], { opacity: 0 });
    gsap.set(touch, { scale: 1 });
    scoreEl.textContent = '12';
    logScore.textContent = `12-${rival}`;
    logText.textContent = '';
    setStep(-1);
    clearKeys();
  };

  return () => {
    reset();
    const frame = ui.getBoundingClientRect();
    const k = frame.width ? ui.offsetWidth / frame.width : 1;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, paused: true });
    const press = (to: number) => tl.to(touch, { scale: to, duration: 0.1, ease: 'power1.inOut' });
    const tap = () => press(0.68).to(touch, { scale: 1, duration: 0.14, ease: 'power1.out' });

    tl.call(reset);

    PLAYS.forEach((play, n) => {
      const player = ui.querySelector(`[data-player="${play.player}"]`)!;
      const ring = player.querySelector('.vm__ring')!;
      const skill = pad.querySelector<HTMLElement>(`[data-skill="${play.skill}"]`)!;
      const key = pad.querySelector<HTMLElement>(`[data-key="${play.skill}#"]`)!;
      const group = ui.querySelector(`[data-shot="${play.shot}"]`)!;
      const line = group.querySelector<SVGPathElement>('path')!;
      const dot = group.querySelector('.vm__to')!;
      const cell = ui.querySelector(`.vm__heat [data-zone="${play.zone}"]`)!;
      const from = centre(player, ui);
      const at = centre(key, ui);
      const points = 13 + n;

      // The finger follows the real curve, so it never drifts off the line it is drawing.
      const matrix = svg.getScreenCTM()!;
      const length = line.getTotalLength();
      const curve = Array.from({ length: 25 }, (_, i) => {
        const p = line.getPointAtLength((length * i) / 24).matrixTransform(matrix);
        return { x: (p.x - frame.left) * k, y: (p.y - frame.top) * k };
      });
      const drag = { t: 0 };
      const follow = () => {
        const f = drag.t * 24;
        const i = Math.min(23, Math.floor(f));
        const a = curve[i];
        const b = curve[i + 1];
        gsap.set(touch, { x: a.x + (b.x - a.x) * (f - i), y: a.y + (b.y - a.y) * (f - i) });
        // The line is uncovered exactly as far as the finger has travelled.
        line.style.strokeDashoffset = `${length * (1 - drag.t)}`;
      };

      // 1. Tap the player.
      tl.call(setStep, [0])
        .to(hint, { opacity: 1, duration: 0.2 })
        .to(touch, { x: from.x, y: from.y, opacity: 1, duration: 0.65, ease: 'power2.inOut' }, '<');
      tap().to(ring, { opacity: 1, duration: 0.15 }, '<');

      // 2. Grade the action on the keypad.
      tl.call(
        () => {
          setStep(1);
          pad.classList.add('is-armed');
          skill.classList.add('is-on');
        },
        undefined,
        '+=0.35',
      ).to(touch, { x: at.x, y: at.y, duration: 0.65, ease: 'power2.inOut' });
      tap().call(() => key.classList.add('is-hit'), undefined, '<');

      // 3. Drag from the player to where the ball landed.
      tl.call(setStep, [2], '+=0.35')
        .to(target, { opacity: 1, duration: 0.25 })
        .to(touch, { x: from.x, y: from.y, duration: 0.5, ease: 'power2.inOut' }, '<');
      press(0.75)
        .set(group, { opacity: 1 })
        .set(dot, { opacity: 0 })
        .fromTo(drag, { t: 0 }, { t: 1, duration: 0.8, ease: 'power1.inOut', onUpdate: follow, immediateRender: false })
        .set(dot, { opacity: 1 })
        .fromTo(dot, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false })
        .to(touch, { scale: 1, duration: 0.15 }, '<')
        .to(target, { opacity: 0, duration: 0.25 }, '<')
        .to(cell.querySelector('rect'), { opacity: 0.6, duration: 0.3 }, '<')
        .to(cell.querySelector('text'), { opacity: 1, duration: 0.3 }, '<');

      // Result: the point is on the scoreboard and in the log.
      tl.call(() => {
        setStep(3);
        scoreEl.textContent = String(points);
        logScore.textContent = `${points}-${rival}`;
        logText.textContent = `# ${lines[play.line]} · #${play.player} (${meta[play.line]})`;
      })
        .fromTo(scoreEl, { scale: 1.8, color: '#34d399' }, { scale: 1, color: '#ffffff', duration: 0.5, ease: 'back.out(2)', immediateRender: false })
        .fromTo(logText, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, '<')
        .to(touch, { opacity: 0, duration: 0.25 }, '<')
        // Clear the play before the next one starts: never two attacks at once.
        .to([group, ring], { opacity: 0, duration: 0.35 }, '+=1.1')
        .to(hint, { opacity: 0, duration: 0.25 }, '<')
        .call(clearKeys)
        .call(() => {
          line.style.strokeDashoffset = `${length}`;
        });
    });

    return tl;
  };
}

/** The ball crossing: `p` runs 0 to 1 while it rolls from off-screen left to off-screen right. */
function ballGate(root: HTMLElement) {
  const pin = root.querySelector<HTMLElement>('.vm__gate-pin')!;
  const cover = root.querySelector<HTMLElement>('.vm__cover')!;
  const ball = root.querySelector<HTMLElement>('.vm__ball')!;
  const spin = ball.querySelector<SVGElement>('.vm__ball-spin')!;

  const draw = (p: number) => {
    const width = pin.clientWidth;
    const size = ball.offsetWidth;
    const x = -size * 0.56 + (width + size * 1.12) * p;
    const on = p > 0 && p < 1;
    ball.style.visibility = on ? 'visible' : 'hidden';
    cover.style.visibility = p >= 1 ? 'hidden' : 'visible';
    if (!on) {
      cover.style.clipPath = 'none';
      return;
    }
    ball.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px,0,0)`;
    // Rolling without slipping: one turn per circumference travelled.
    spin.style.transform = `rotate(${((x / (Math.PI * size)) * 360).toFixed(2)}deg)`;
    cover.style.clipPath = `inset(0 0 0 ${Math.max(0, x).toFixed(1)}px)`;
  };

  const clear = () => {
    [cover, ball, spin].forEach((el) => el.removeAttribute('style'));
  };

  return { draw, clear };
}

function initVolley(mm: gsap.MatchMedia) {
  const root = document.querySelector<HTMLElement>('.vm');
  if (!root) return;
  const ui = root.querySelector<HTMLElement>('.vm__ui')!;
  const gate = ballGate(root);
  const reel = makeReel(root);

  // The demo works in pixels, so it is rebuilt whenever the screen changes size.
  const build = volleyDemo(root);
  let demo: gsap.core.Timeline | null = null;
  let seen = false;
  let pinned = false;
  let uncovered = false;
  let width = 0;
  // It only runs while its screen is the one in focus and actually visible.
  const wanted = () => seen && (!pinned || (uncovered && reel.active === 0));
  const sync = () => (wanted() ? demo?.play() : demo?.pause());
  const rebuild = () => {
    if (ui.clientWidth === width) return;
    width = ui.clientWidth;
    demo?.kill();
    demo = build();
    sync();
  };
  new ResizeObserver(rebuild).observe(ui);
  new IntersectionObserver(
    ([entry]) => {
      seen = entry.isIntersecting;
      sync();
    },
    { threshold: 0.25 },
  ).observe(ui);
  reel.onChange((i) => {
    if (i === 0 && wanted()) demo?.restart();
    else sync();
  });

  // Scroll budget of the pinned scene, in viewport heights: the lead (the
  // title alone until READ, then the ball) and one stretch per screen.
  const LEAD = 162;
  const READ = 38;
  const SPAN = [140, 124, 114];
  const KEEP = 10;
  const MARKS = [LEAD, LEAD + SPAN[0], LEAD + SPAN[0] + SPAN[1]];
  const WHOLE = MARKS[2] + SPAN[2];
  const films = [1, 2].map((n) => film(root.querySelector<HTMLElement>(`.reel__slide[data-slide="${n}"] [data-demo]`)));
  let opened = false;
  // The furthest point reached, and how much scroll has been taken out from the top.
  let reached = 0;
  let gone = 0;

  // Desktop: the section pins. First the title, alone; then the ball uncovers
  // the product; then the scroll walks through its three screens.
  mm.add(PINNED, () => {
    root.classList.add('is-scene');
    pinned = true;
    const left = () => WHOLE - gone;
    const size = () => {
      root.style.height = `${left() + 100}vh`;
    };
    size();
    films.forEach((item) => item.to(0));

    // The screen in focus: the furthest one the scroll reached, unless one was picked by hand.
    let picked: number | null = null;
    const byScroll = () => (reached < MARKS[1] ? 0 : reached < MARKS[2] ? 1 : 2);
    const show = () => reel.set(picked ?? byScroll());
    show();

    const state = { p: 0 };
    const far = { v: opened ? 1 : 0 };
    let auto: gsap.core.Tween | null = null;
    const paint = () => {
      gate.draw(far.v);
      // The coach starts from the first play the moment the screen is uncovered,
      // and the figures count up again now that they can be seen.
      if (far.v > 0.7 !== uncovered) {
        uncovered = far.v > 0.7;
        if (uncovered) root.querySelectorAll('[data-num]').forEach((el) => el.dispatchEvent(new Event('recount')));
        if (uncovered && reel.active === 0) demo?.restart();
        else sync();
      }
      if (far.v >= 1) opened = true;
    };
    // The first update can arrive while the tween is still being created.
    let live: ScrollTrigger | undefined;
    const tween = gsap.to(state, {
      p: 1,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
      onUpdate: () => {
        if (!live) return;
        const v = gone + live.progress * left();
        if (v > reached) {
          const before = byScroll();
          reached = v;
          // Scrolling into a new screen takes over from a hand-picked one.
          if (byScroll() !== before) picked = null;
        }
        show();
        films[0].to(clamp(0, 1, (reached - MARKS[1]) / (SPAN[1] * 0.8)));
        films[1].to(clamp(0, 1, (reached - MARKS[2]) / (SPAN[2] * 0.8)));
        // The ball follows the smoothed scroll and never rolls back: if the
        // reader turns round half way, it finishes crossing by itself.
        if (!opened && !auto) {
          const cross = clamp(0, 1, (gone + state.p * left() - READ) / (LEAD - READ));
          if (cross >= far.v) far.v = cross;
          // Same if the scroll is already past the lead while the ball trails behind.
          else if ((far.v > 0 && cross < far.v - 0.04) || reached > LEAD + 8) auto = gsap.to(far, { v: 1, duration: 0.3 + 0.9 * (1 - far.v), ease: 'power1.inOut', onUpdate: paint });
        }
        paint();
      },
    });
    const trigger = tween.scrollTrigger!;
    live = trigger;
    reel.onGo((i) => {
      picked = i;
      show();
      if (i > 0) films[i - 1].play();
    });
    // Whenever the page comes to rest inside (or past) the scene, the scroll
    // already used is removed: going back up leaves the product in a few lines.
    const rest = onRest(() => {
      if (reached < LEAD) return null;
      if (!opened) {
        // The page is still and past the lead: the crossing is over, whatever frame it was on.
        auto?.kill();
        far.v = 1;
        paint();
      }
      const used = trigger.progress * left() - KEEP;
      if (used < 20) return null;
      return {
        root,
        cut: used,
        apply: () => {
          gone += used;
          size();
        },
      };
    });
    paint();
    return () => {
      rest();
      auto?.kill();
      trigger.kill();
      tween.kill();
      gate.clear();
      reel.clear();
      reel.onGo(() => {});
      films.forEach((item) => item.free());
      pinned = false;
      root.style.height = '';
      root.classList.remove('is-scene');
      sync();
    };
  });

  // Smaller screens: the gate is its own pinned screen above the content.
  mm.add(`not all and ${PINNED}`, () => {
    root.classList.add('is-gate');
    const state = { p: 0 };
    let far = opened ? 1 : 0;
    const tween = gsap.to(state, {
      p: 1,
      ease: 'none',
      scrollTrigger: { trigger: root.querySelector('.vm__gate'), start: 'top top', end: 'bottom bottom', scrub: 0.4 },
      onUpdate: () => {
        far = Math.max(far, clamp(0, 1, (state.p - 0.12) / 0.8));
        if (far >= 1) opened = true;
        gate.draw(far);
      },
    });
    gate.draw(far);
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gate.clear();
      root.classList.remove('is-gate');
    };
  });
}

/* ExpoLogic ----------------------------------------------------------- */

function initExpo(mm: gsap.MatchMedia) {
  const root = document.querySelector<HTMLElement>('.expo');
  if (!root) return;

  const map = root.querySelector<HTMLElement>('.expo__map')!;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.expo__steps li'));
  const pointer = map.querySelector<HTMLElement>('.expo__pointer')!;
  const sheet = map.querySelector<HTMLElement>('.expo__sheet')!;
  const confirm = sheet.querySelector<HTMLElement>('[data-confirm]')!;
  const done = root.querySelector<HTMLElement>('.expo__done')!;
  const card = done.querySelector<HTMLElement>('.expo__done-card')!;
  const check = card.querySelector('path')!;
  const freeEl = root.querySelector<HTMLElement>('[data-free]')!;
  const meter = root.querySelector<HTMLElement>('[data-meter]')!;
  const stand = map.querySelector<SVGGElement>('[data-stand="C5"]')!;
  const hatch = stand.querySelector<SVGRectElement>('.expo__hatch')!;
  const total = map.querySelectorAll('.expo__stand').length;
  const free = Number(freeEl.textContent);
  const reel = makeReel(root);

  // Bottom rows first: the fair fills in from the entrance upwards.
  const lifts = Array.from(map.querySelectorAll<SVGGElement>('.expo__stand'))
    .map((el) => ({ el: el.querySelector('.expo__lift')!, box: el.getBoundingClientRect() }))
    .sort((a, b) => b.box.top - a.box.top || a.box.left - b.box.left)
    .map((item) => item.el);

  const build = (scrub: boolean) => {
    const marks = { start: 0, pick: 0, sheet: 0, done: 0 };
    let shown = -2;

    // Everything discrete is derived from the playhead, so scrubbing backwards undoes it.
    const render = (time: number) => {
      // 0 idle, 1 heading to the stand, 2 stand picked, 3 sheet open, 4 booked
      const phase = time < marks.start ? 0 : time < marks.pick ? 1 : time < marks.sheet ? 2 : time < marks.done ? 3 : 4;
      if (phase === shown) return;
      shown = phase;
      const step = phase === 0 ? -1 : phase <= 2 ? 0 : phase === 3 ? 1 : 2;
      steps.forEach((li, i) => li.classList.toggle('is-on', i === step));
      stand.dataset.status = phase < 2 ? 'free' : phase < 4 ? 'pick' : 'wait';
      hatch.setAttribute('fill', phase === 4 ? 'url(#expo-hatch-wait)' : 'none');
      const left = phase === 4 ? free - 1 : free;
      freeEl.textContent = String(left);
      meter.style.transform = `scaleX(${left / total})`;
      confirm.style.background = phase === 4 ? '#b36139' : '';
    };

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
      onUpdate: () => render(tl.time()),
      ...(scrub ? {} : { repeat: -1, repeatDelay: 0.6 }),
    });

    const target = centre(stand, map);
    const button = {
      x: map.clientWidth - sheet.offsetWidth + confirm.offsetLeft + confirm.offsetWidth / 2,
      y: confirm.offsetTop + confirm.offsetHeight / 2,
    };
    const click = () => tl.to(pointer, { scale: 0.78, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' });

    tl.from(map.querySelector('.expo__venue'), { opacity: 0, duration: 0.3 })
      .from(map.querySelectorAll('.expo__zones > g'), { opacity: 0, y: 26, duration: 0.45, stagger: 0.07 }, '<0.1')
      .from(map.querySelectorAll('.expo__rows text'), { opacity: 0, duration: 0.3, stagger: 0.04 }, '<0.15')
      .from(lifts, { opacity: 0, y: 38, duration: 0.42, ease: 'back.out(1.8)', stagger: 0.022 }, '<')
      .set(pointer, { x: map.clientWidth * 0.3, y: map.clientHeight * 1.02, scale: 1 }, '+=0.25');
    marks.start = tl.duration();
    tl.to(pointer, { opacity: 1, duration: 0.15 }).to(pointer, { x: target.x, y: target.y, duration: 0.6, ease: 'power2.inOut' }, '<');
    click();
    marks.pick = tl.duration() - 0.1;

    tl.to(sheet, { x: 0, duration: 0.45, ease: 'power3.out' });
    marks.sheet = tl.duration() - 0.2;
    tl.to(pointer, { x: button.x, y: button.y, duration: 0.6, ease: 'power2.inOut' }, '+=0.15');
    click();
    marks.done = tl.duration() - 0.1;

    // The confirmation takes over the whole mini browser.
    tl.to(pointer, { opacity: 0, duration: 0.2 }, '+=0.1')
      .set(done, { visibility: 'visible' })
      .to(done, { opacity: 1, duration: 0.3 })
      .fromTo(card, { y: 36, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, '<0.05')
      .fromTo(check, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' }, '<0.2')
      .set(sheet, { x: '105%' })
      .to({}, { duration: scrub ? 1.1 : 2.4 });
    if (!scrub) tl.to(done, { opacity: 0, duration: 0.35, ease: 'power1.in' }).set(done, { visibility: 'hidden' });

    gsap.set(sheet, { x: '105%' });
    gsap.set(done, { opacity: 0, visibility: 'hidden' });
    render(0);
    return tl;
  };

  const tidy = () => gsap.set([sheet, done, card, check, pointer, ...lifts], { clearProps: 'all' });

  // Scroll budget of the pinned scene, in viewport heights: the reservation
  // plays over FLOW, then each screen has its stretch.
  const FLOW = 230;
  const MARKS = [0, 253, 359];
  const WHOLE = 460;
  const SPAN = [MARKS[1], MARKS[2] - MARKS[1], WHOLE - MARKS[2]];
  const KEEP = 10;
  const films = [1, 2].map((n) => film(root.querySelector<HTMLElement>(`.reel__slide[data-slide="${n}"] [data-demo]`)));
  let booked = false;
  let reached = 0;
  let gone = 0;

  mm.add(PINNED, () => {
    root.classList.add('is-scene');
    reel.set(0); // before measuring: the map must be the screen in focus
    const left = () => WHOLE - gone;
    const size = () => {
      root.style.height = `${left() + 100}vh`;
    };
    size();
    films.forEach((item) => item.to(0));

    let picked: number | null = null;
    const byScroll = () => (reached < MARKS[1] ? 0 : reached < MARKS[2] ? 1 : 2);
    const show = () => reel.set(picked ?? byScroll());

    let flow: gsap.core.Timeline | null = booked ? null : build(true);
    let loop: gsap.core.Timeline | null = null;
    let far = 0;
    let seen = false;
    const sync = () => {
      if (!booked) return;
      if (!seen || reel.active !== 0) return void loop?.pause();
      loop ??= build(false);
      loop.play();
    };
    // The booking has played to the end: from here on it is a loop, not a scrub.
    const handOver = () => {
      if (booked || !flow) return;
      booked = true;
      gsap.killTweensOf(flow);
      flow.progress(0).kill();
      flow = null;
      tidy();
      loop = build(false);
      // Pick up on the confirmation it just reached, and leave it up for a moment.
      loop.time(loop.duration() - 2).pause();
      sync();
    };
    // One way: the playhead only ever chases the furthest point asked for.
    const chase = (p: number, seconds: number) => {
      if (!flow || p <= far) return;
      far = p;
      gsap.to(flow, { progress: far, duration: seconds, ease: seconds > 1 ? 'none' : 'power2.out', overwrite: true, onComplete: () => void (far >= 1 && handOver()) });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        seen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.3 },
    );
    io.observe(map);
    reel.onChange(sync);

    const whole = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const v = gone + self.progress * left();
        if (v > reached) {
          const before = byScroll();
          reached = v;
          if (byScroll() !== before) picked = null;
        }
        show();
        films[0].to(clamp(0, 1, (reached - MARKS[1]) / (SPAN[1] * 0.8)));
        films[1].to(clamp(0, 1, (reached - MARKS[2]) / (SPAN[2] * 0.8)));
        chase(clamp(0, 1, reached / FLOW), 0.5);
      },
    });
    reel.onGo((i) => {
      picked = i;
      show();
      if (i > 0) films[i - 1].play();
      // The map, opened by hand before the booking was scrolled through: it plays out by itself.
      else if (flow) chase(1, 5 * (1 - far));
    });
    const rest = onRest(() => {
      const used = whole.progress * left() - KEEP;
      if (used < 20) return null;
      return {
        root,
        cut: used,
        apply: () => {
          gone += used;
          size();
        },
      };
    });
    return () => {
      rest();
      io.disconnect();
      whole.kill();
      if (flow) gsap.killTweensOf(flow);
      flow?.progress(0).kill();
      loop?.progress(0).kill();
      reel.clear();
      reel.onGo(() => {});
      reel.onChange(() => {});
      films.forEach((item) => item.free());
      root.style.height = '';
      root.classList.remove('is-scene');
      tidy();
    };
  });

  // Smaller screens: the same flow plays by itself while the map is on screen.
  mm.add(`not all and ${PINNED}`, () => {
    // An observer, not a scroll position: the sections above can still change height.
    let tl: gsap.core.Timeline | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return void tl?.pause();
        tl ??= build(false); // measured the first time the map is really on screen
        tl.play();
      },
      { threshold: 0.3 },
    );
    io.observe(map);
    return () => {
      io.disconnect();
      tl?.progress(0).kill();
      tidy();
    };
  });
}

export function initScenes() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  initVolley(mm);
  initExpo(mm);
}
