/** Page-level behaviour: heading reveals and lazy loading of the heavy scenes. */
import { given } from './given';

// One restrained entrance, for section headings only.
const rise = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      rise.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -12% 0px' },
);
const rising = Array.from(document.querySelectorAll<HTMLElement>('[data-rise]'));
rising.forEach((el) => rise.observe(el));
// Belt and braces: a heading inside a section that was skipping rendering can
// miss its observer callback, so the scroll handler checks the stragglers too.
const riseLate = () => {
  for (let i = rising.length - 1; i >= 0; i--) {
    const el = rising[i];
    if (el.classList.contains('is-in')) {
      rising.splice(i, 1);
      continue;
    }
    const box = el.getBoundingClientRect();
    if (box.height > 0 && box.top < innerHeight * 0.9 && box.bottom > 0) {
      el.classList.add('is-in');
      rise.unobserve(el);
      rising.splice(i, 1);
    }
  }
};

// The animation library and the product scenes stay out of the first paint
// and out of the intro: they load a moment after the intro has finished, when
// the browser is idle, or at once if someone starts scrolling first.
const scenes = document.querySelectorAll<HTMLElement>('[data-scene]');
if (scenes.length) {
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    removeEventListener('scroll', load);
    import('./scenes').then((mod) => mod.initScenes());
  };
  const idle = () => (window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 200)))(load);
  const whenCalm = () => {
    if (loaded) return;
    // Not in the same breath as the end of the intro: that moment is busy enough.
    if (document.documentElement.classList.contains('intro-done') && document.readyState === 'complete') setTimeout(idle, 1200);
    else setTimeout(whenCalm, 400);
  };
  whenCalm();
  addEventListener('scroll', load, { passive: true });
}

// Far sections skip rendering until needed (see global.css). An in-page jump
// needs their real heights first, or it would land in the wrong place.
addEventListener('click', (event) => (event.target as Element).closest?.('a[href^="#"]') && document.documentElement.classList.add('all-in'), { capture: true });

// Ambient loops (the leaves behind ExpoLogic) only run while their section is on screen.
const ambient = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting)));
document.querySelectorAll('[data-live]').forEach((el) => ambient.observe(el));

// Tool previews: their loops only run while they are on screen.
const demos = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting)), { threshold: 0.2 });
document.querySelectorAll('[data-demo]').forEach((el) => demos.observe(el));

// Figures count up from zero every time they come on screen.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const running = new WeakMap<Element, number>();
  // Product figures land with a burst of sparks thrown out from the number.
  const burst = (el: HTMLElement) => {
    const total = 14;
    for (let i = 0; i < total; i++) {
      const spark = document.createElement('span');
      spark.className = i % 3 ? 'spark' : 'spark spark--alt';
      el.append(spark);
      const angle = (Math.PI * 2 * i) / total + Math.random() * 0.5;
      const reach = 34 + Math.random() * 46;
      const x = (Math.cos(angle) * reach).toFixed(1);
      const y = (Math.sin(angle) * reach).toFixed(1);
      spark.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 1 },
          { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0) rotate(180deg)`, opacity: 0 },
        ],
        { duration: 750 + Math.random() * 450, easing: 'cubic-bezier(0.15, 0.7, 0.2, 1)' },
      ).onfinish = () => spark.remove();
    }
  };
  const count = (el: HTMLElement) => {
    const digits = Array.from(el.querySelectorAll<HTMLElement>('b[data-to]')).map((b) => {
      const text = b.dataset.to!;
      const sep = text.match(/[.,]/)?.[0] ?? '';
      const decimals = sep ? text.split(sep)[1].length : 0;
      return { b, to: Number(text.replace(',', '.')), sep, decimals };
    });
    const start = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / 1300);
      const eased = 1 - Math.pow(1 - x, 4);
      for (const d of digits) {
        const value = (d.to * eased).toFixed(d.decimals);
        d.b.textContent = d.sep ? value.replace('.', d.sep) : value;
      }
      if (x < 1) {
        running.set(el, requestAnimationFrame(tick));
        return;
      }
      running.delete(el);
      el.classList.remove('is-pop');
      void el.offsetWidth;
      el.classList.add('is-pop');
      if (el.closest('.vm__stats, .expo__stats')) burst(el);
    };
    cancelAnimationFrame(running.get(el) ?? 0);
    running.set(el, requestAnimationFrame(tick));
  };
  const figures = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && count(entry.target as HTMLElement)), { threshold: 0.6 });
  document.querySelectorAll<HTMLElement>('[data-num]').forEach((el) => {
    figures.observe(el);
    // A scene can ask for the count again (Volley Manager, once the ball has uncovered it).
    el.addEventListener('recount', () => count(el));
  });
}

// Header: a progress line, and the chapter you are in lights up.
const header = document.querySelector<HTMLElement>('.top');
if (header) {
  const bar = header.querySelector<HTMLElement>('.top__progress');
  let queued = false;
  const progress = () => {
    queued = false;
    riseLate();
    // The product scenes hand scroll back once it is used up. Count it as still
    // there (eased in across what is left of each scene), so the line never retreats.
    let extra = 0;
    let passed = 0;
    for (const [scene, vh] of given) {
      const px = (vh * innerHeight) / 100;
      const into = (scrollY - scene.offsetTop) / Math.max(1, scene.offsetHeight - innerHeight);
      extra += px;
      passed += px * Math.min(1, Math.max(0, into));
    }
    const max = document.documentElement.scrollHeight - innerHeight + extra;
    bar?.style.setProperty('--p', (max > 0 ? Math.min(1, (scrollY + passed) / max) : 0).toFixed(4));
  };
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(progress);
    },
    { passive: true },
  );

  const links = Array.from(header.querySelectorAll<HTMLElement>('[data-spy]'));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((link) => link.classList.toggle('is-active', link.dataset.spy!.split(' ').includes(entry.target.id)));
      }
    },
    // A thin band across the middle of the screen decides which chapter is "current".
    { rootMargin: '-45% 0px -54% 0px' },
  );
  const ids = new Set(links.flatMap((link) => link.dataset.spy!.split(' ')));
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
  const hero = document.getElementById('top');
  if (hero) new IntersectionObserver(([entry]) => entry.isIntersecting && links.forEach((link) => link.classList.remove('is-active')), { rootMargin: '-45% 0px -54% 0px' }).observe(hero);
}

// Project index: the screenshot follows the cursor.
const peek = document.querySelector<HTMLElement>('[data-peek]');
if (peek && matchMedia('(hover: hover) and (min-width: 900px)').matches) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  peek.addEventListener(
    'pointermove',
    (event) => {
      const width = 22 * rem;
      const roomRight = innerWidth - event.clientX > width + 4 * rem;
      peek.style.setProperty('--px', `${roomRight ? event.clientX + 2 * rem : event.clientX - width - 2 * rem}px`);
      peek.style.setProperty('--py', `${event.clientY}px`);
    },
    { passive: true },
  );
}

// Project index teaser: the first time the list is on screen, every row shows
// its screenshot for a second, so the hover behaviour explains itself.
if (peek && matchMedia('(hover: hover) and (min-width: 900px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const tease = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      tease.disconnect();
      peek.classList.add('is-tease');
      setTimeout(() => {
        peek.classList.replace('is-tease', 'is-tease-out');
        setTimeout(() => peek.classList.remove('is-tease-out'), 900);
      }, 1500);
    },
    { threshold: 0.35 },
  );
  tease.observe(peek);
}

// Contact keys: a preview of where each key leads follows the cursor.
const keyboard = document.querySelector<HTMLElement>('[data-keys]');
const peeks = document.querySelector<HTMLElement>('[data-peeks]');
if (keyboard && peeks && matchMedia('(hover: hover) and (min-width: 900px)').matches) {
  let shown: HTMLElement | null = null;
  const show = (id?: string) => {
    const next = id ? peeks.querySelector<HTMLElement>(`[data-peek-for="${id}"]`) : null;
    if (next === shown) return;
    shown?.classList.remove('is-on');
    next?.classList.add('is-on');
    shown = next;
  };
  keyboard.addEventListener(
    'pointermove',
    (event) => {
      show((event.target as Element).closest<HTMLElement>('[data-peek-id]')?.dataset.peekId);
      if (!shown) return;
      const x = Math.min(innerWidth - peeks.offsetWidth - 16, Math.max(16, event.clientX + 28));
      const above = event.clientY - shown.offsetHeight - 24;
      peeks.style.transform = `translate3d(${x}px,${above > 72 ? above : event.clientY + 32}px,0)`;
    },
    { passive: true },
  );
  keyboard.addEventListener('pointerleave', () => show());
}

// About figures: one light under the whole grid trails the pointer. It is a
// single position shared by every cell, so it can sit across a corner of four.
const figures = document.querySelector<HTMLElement>('.about__stats');
if (figures && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const cells = Array.from(figures.children) as HTMLElement[];
  const place = () =>
    cells.forEach((cell) => {
      cell.style.setProperty('--ox', `${cell.offsetLeft}px`);
      cell.style.setProperty('--oy', `${cell.offsetTop}px`);
    });
  new ResizeObserver(place).observe(figures);
  const at = { x: 0, y: 0 };
  const to = { x: 0, y: 0 };
  let frame = 0;
  const follow = () => {
    at.x += (to.x - at.x) * 0.16;
    at.y += (to.y - at.y) * 0.16;
    figures.style.setProperty('--mx', `${at.x.toFixed(1)}px`);
    figures.style.setProperty('--my', `${at.y.toFixed(1)}px`);
    frame = Math.abs(to.x - at.x) + Math.abs(to.y - at.y) > 0.4 ? requestAnimationFrame(follow) : 0;
  };
  figures.addEventListener('pointermove', (event) => {
    const box = figures.getBoundingClientRect();
    to.x = event.clientX - box.left;
    to.y = event.clientY - box.top;
    if (!figures.classList.contains('is-lit')) {
      // Arrive where the pointer came in, instead of sweeping in from the last exit.
      at.x = to.x;
      at.y = to.y;
      figures.classList.add('is-lit');
    }
    frame ||= requestAnimationFrame(follow);
  });
  figures.addEventListener('pointerleave', () => figures.classList.remove('is-lit'));
}

// Editor credit: a preview of the profile follows the pointer over the link,
// the way the project screenshots do. The link itself goes to the profile.
const credit = document.querySelector<HTMLElement>('[data-credit]');
const creditLink = document.querySelector<HTMLElement>('[data-credit-open]');
if (credit && creditLink) {
  const host = credit.parentElement!;
  const place = (px: number, py: number) => {
    const box = host.getBoundingClientRect();
    const x = Math.max(0, Math.min(box.width - credit.offsetWidth, px - box.left - credit.offsetWidth + 28));
    credit.style.setProperty('--x', `${x.toFixed(0)}px`);
    credit.style.setProperty('--y', `${(py - box.top + 22).toFixed(0)}px`);
  };
  const move = (event: PointerEvent) => place(event.clientX, event.clientY);
  creditLink.addEventListener('pointerenter', (event) => {
    move(event);
    credit.classList.add('is-open');
  });
  creditLink.addEventListener('pointermove', move);
  creditLink.addEventListener('pointerleave', () => credit.classList.remove('is-open'));
  // Keyboard: shown under the link while it has focus.
  creditLink.addEventListener('focus', () => {
    const box = creditLink.getBoundingClientRect();
    place(box.right, box.bottom - 10);
    credit.classList.add('is-open');
  });
  creditLink.addEventListener('blur', () => credit.classList.remove('is-open'));
}

// Click-to-load players (YouTube, LinkedIn).
document.querySelectorAll<HTMLButtonElement>('[data-embed]').forEach((button) => {
  button.addEventListener('click', () => {
    const frame = document.createElement('div');
    frame.className = 'embed-frame embed-frame--video';
    const iframe = document.createElement('iframe');
    iframe.src = button.dataset.embed!;
    iframe.title = button.dataset.title ?? '';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.append(iframe);
    button.replaceWith(frame);
    iframe.focus();
  });
});

// Credentials tabs (WAI-ARIA tabs pattern, arrow keys included).
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((list) => {
  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const select = (tab: HTMLButtonElement, focus = false) => {
    tabs.forEach((other) => {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(other.getAttribute('aria-controls')!);
      if (panel) {
        panel.hidden = !on;
        panel.removeAttribute('data-later');
      }
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      select(tabs[(i + step + tabs.length) % tabs.length], true);
    });
  });
  select(tabs[0]);
});

// Folds (experience details, the full certification list): each one opens and
// closes with its height animated. One switch does it for every role at once.
const stillMode = matchMedia('(prefers-reduced-motion: reduce)').matches;
const folds = Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-fold]')).map((details) => {
  const more = details.querySelector<HTMLElement>('[data-fold-body]')!;
  let open = details.open;
  let anim: Animation | null = null;
  details.classList.toggle('is-open', open);

  const set = (next: boolean) => {
    if (next === open) return;
    open = next;
    // A closed <details> still gives its content a height, so that cannot be measured: closed means 0.
    const from = details.open ? more.getBoundingClientRect().height : 0;
    anim?.cancel();
    if (open) details.open = true;
    const to = open ? more.scrollHeight : 0;
    // One frame later, so the bullets transition in instead of just appearing.
    requestAnimationFrame(() => details.classList.toggle('is-open', open));
    if (stillMode) {
      details.open = open;
      return;
    }
    anim = more.animate({ height: [`${from}px`, `${to}px`] }, { duration: open ? 950 : 650, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' });
    anim.onfinish = () => {
      anim = null;
      if (!open) details.open = false;
    };
  };

  details.querySelector('summary')!.addEventListener('click', (event) => {
    event.preventDefault();
    set(!open);
  });
  return { details, set, toggle: () => set(!open) };
});

// A whole experience row toggles its details (links and the open content itself excepted).
document.querySelectorAll<HTMLElement>('.exp__item').forEach((item) => {
  const fold = folds.find((entry) => entry.details === item.querySelector('.exp__details'));
  item.addEventListener('click', (event) => {
    if ((event.target as Element).closest('summary, a, button, .exp__more') || getSelection()?.toString()) return;
    fold?.toggle();
  });
});

const expToggle = document.querySelector<HTMLButtonElement>('[data-exp-toggle]');
expToggle?.addEventListener('click', () => {
  const open = expToggle.getAttribute('aria-pressed') !== 'true';
  expToggle.setAttribute('aria-pressed', String(open));
  expToggle.textContent = open ? expToggle.dataset.collapse! : expToggle.dataset.expand!;
  folds.filter((fold) => fold.details.classList.contains('exp__details')).forEach((role, i) => setTimeout(() => role.set(open), i * 70));
});

// Copy email.
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  const slot = button.querySelector<HTMLElement>('[data-copy-label]') ?? button;
  const label = slot.textContent;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy!);
      slot.textContent = button.dataset.copied!;
      setTimeout(() => (slot.textContent = label), 1800);
    } catch {
      location.href = `mailto:${button.dataset.copy}`;
    }
  });
});
