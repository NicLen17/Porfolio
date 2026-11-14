/** Two-orb cursor follower: a sharp lead and a soft trail that lags behind. */
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

if (fine.matches && !calm.matches) {
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i class="cursor__trail"></i><i class="cursor__lead"></i>';
  document.body.append(el);
  const trail = el.firstElementChild as HTMLElement;
  const lead = el.lastElementChild as HTMLElement;

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let lx = x;
  let ly = y;
  let tx = x;
  let ty = y;
  let raf = 0;

  const tick = () => {
    // The lead stands in for the system pointer, so it never lags behind it.
    lx = x;
    ly = y;
    tx += (x - tx) * 0.11;
    ty += (y - ty) * 0.11;
    lead.style.transform = `translate3d(${lx}px,${ly}px,0)`;
    trail.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    const settled = Math.abs(x - tx) < 0.2 && Math.abs(y - ty) < 0.2;
    raf = settled ? 0 : requestAnimationFrame(tick);
  };

  addEventListener(
    'pointermove',
    (event) => {
      // The last move before entering an embedded page is reported on the frame itself.
      if ((event.target as Element).tagName === 'IFRAME') return void el.classList.remove('is-on');
      x = event.clientX;
      y = event.clientY;
      el.classList.add('is-on');
      document.documentElement.classList.add('has-cursor');
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );

  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  // Focus moving into an embedded page (a click on a LinkedIn post) means the pointer is in there too.
  addEventListener('blur', () => document.activeElement?.tagName === 'IFRAME' && el.classList.remove('is-on'));

  // A click spins the diamond and flashes it in the accent colour.
  addEventListener('pointerdown', () => {
    el.classList.remove('is-click');
    void el.offsetWidth;
    el.classList.add('is-click');
  });
  lead.addEventListener('animationend', () => el.classList.remove('is-click'));

  // Grow over anything interactive, and switch to a dark orb on light sections.
  document.addEventListener(
    'pointerover',
    (event) => {
      const target = event.target as Element;
      // Inside an embedded page (the LinkedIn posts) no pointer events reach us
      // and the system pointer is back: stand down instead of freezing at the edge.
      if (target.tagName === 'IFRAME') {
        el.classList.remove('is-on');
        return;
      }
      el.classList.toggle('is-link', Boolean(target.closest('a:not(.tile), button, summary, [role="tab"]')));
      el.classList.toggle('is-paper', Boolean(target.closest('.expo')));
    },
    { passive: true },
  );
}
