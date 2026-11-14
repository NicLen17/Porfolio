/**
 * Hands-on demos. Loaded the first time someone asks for one (see page.ts), so
 * none of this weighs on the page until it is wanted.
 *
 * Each demo is a small state machine over markup that is already in the page:
 * the visitor does by hand what the carousels play by themselves.
 */
import { initVolleyLab } from './lab-volley';

type Demo = { reset: () => void };
const demos = new Map<string, Demo>();
let opener: HTMLElement | null = null;
let current: HTMLElement | null = null;

/* Frame ------------------------------------------------------------------ */

function close() {
  if (!current) return;
  const lab = current;
  current = null;
  lab.classList.remove('is-open');
  document.documentElement.classList.remove('lab-open');
  removeEventListener('keydown', onKey);
  setTimeout(() => (lab.hidden = true), 320);
  opener?.focus();
}

function onKey(event: KeyboardEvent) {
  if (!current) return;
  if (event.key === 'Escape') return close();
  if (event.key !== 'Tab') return;
  // Keep Tab inside the demo while it is open.
  const stops = Array.from(current.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]')).filter((el) => el.getClientRects().length);
  if (!stops.length) return;
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function openLab(id: string, from: HTMLElement) {
  const lab = document.querySelector<HTMLElement>(`[data-lab="${id}"]`);
  if (!lab || current) return;
  opener = from;
  current = lab;
  lab.hidden = false;
  document.documentElement.classList.add('lab-open');
  // Every visit starts from a clean board.
  demos.get(id)?.reset();
  requestAnimationFrame(() => lab.classList.add('is-open'));
  lab.querySelector<HTMLElement>('[data-lab-close]')?.focus();
  addEventListener('keydown', onKey);
}

/* ExpoLogic: book a stand in two clicks ------------------------------------ */

function initExpoLab(lab: HTMLElement): Demo {
  const root = lab.querySelector<HTMLElement>('[data-xl]')!;
  const stands = Array.from(root.querySelectorAll<SVGGElement>('.xl__stand'));
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-xl-step]'));
  const sheet = root.querySelector<HTMLElement>('[data-xl-view]')!;
  const views = Array.from(sheet.querySelectorAll<HTMLElement>('[data-view]'));
  const freeEl = root.querySelector<HTMLElement>('[data-xl-free]')!;
  const meter = root.querySelector<HTMLElement>('[data-xl-meter]')!;
  const total = Number(root.dataset.total);
  const doneText = root.dataset.doneText!;
  let free = Number(root.dataset.free);
  let picked: SVGGElement | null = null;
  let ticket = 428;

  const show = (name: string, step: number) => {
    views.forEach((view) => (view.hidden = view.dataset.view !== name));
    steps.forEach((li, i) => {
      li.classList.toggle('is-on', i === step);
      li.classList.toggle('is-past', i < step);
    });
  };

  const count = () => {
    freeEl.textContent = String(free);
    meter.style.transform = `scaleX(${free / total})`;
  };

  const pick = (stand: SVGGElement) => {
    picked?.classList.remove('is-picked');
    picked = stand;
    stand.classList.add('is-picked');
    const status = stand.dataset.status!;
    sheet.querySelectorAll('[data-xl-code]').forEach((el) => (el.textContent = stand.dataset.code!));
    sheet.querySelector('[data-xl-row]')!.textContent = stand.dataset.row!;
    // A stand you just booked is waiting for the organizer, like anyone else's request.
    show(status === 'free' ? 'pick' : status === 'taken' ? 'taken' : 'wait', status === 'free' ? 1 : 0);
  };

  const confirm = () => {
    if (!picked || picked.dataset.status !== 'free') return;
    const stand = picked;
    stand.dataset.status = 'mine';
    stand.classList.remove('is-picked');
    stand.classList.remove('is-new');
    void stand.getBoundingClientRect();
    stand.classList.add('is-new');
    free -= 1;
    count();
    sheet.querySelector('[data-xl-done]')!.textContent = doneText.replace('{code}', stand.dataset.code!);
    sheet.querySelector('[data-xl-ticket]')!.textContent = `#EXP-0${ticket++}`;
    picked = null;
    show('done', 2);
    sheet.querySelector<HTMLElement>('[data-xl-again]')?.focus();
  };

  const idle = () => {
    picked?.classList.remove('is-picked');
    picked = null;
    show('idle', 0);
  };

  stands.forEach((stand) => {
    stand.addEventListener('click', () => pick(stand));
    stand.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      pick(stand);
      sheet.querySelector<HTMLElement>('[data-xl-confirm]')?.focus();
    });
  });
  sheet.querySelector('[data-xl-confirm]')!.addEventListener('click', confirm);
  sheet.querySelector('[data-xl-again]')!.addEventListener('click', idle);

  const reset = () => {
    stands.forEach((stand) => {
      stand.dataset.status = stand.dataset.initial!;
      stand.classList.remove('is-picked', 'is-new');
    });
    free = Number(root.dataset.free);
    ticket = 428;
    count();
    idle();
  };
  return { reset };
}

/* Wiring -------------------------------------------------------------------- */

document.querySelectorAll<HTMLElement>('[data-lab]').forEach((lab) => {
  const id = lab.dataset.lab!;
  const demo = id === 'expo' ? initExpoLab(lab) : id === 'vm' ? initVolleyLab(lab) : null;
  if (demo) demos.set(id, demo);
  lab.querySelector('[data-lab-close]')?.addEventListener('click', close);
  lab.querySelector('[data-lab-reset]')?.addEventListener('click', () => demos.get(id)?.reset());
  // A click on the dimmed margin closes it; a click inside the panel does not.
  lab.addEventListener('click', (event) => event.target === lab && close());
});
