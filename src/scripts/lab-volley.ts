/**
 * Volley Manager's live scouting, playable. A small state machine that follows
 * the real console's rules (see VolleyLab.astro for the summary): what one tap
 * on the keypad records, when the court asks where the ball went, which
 * touches score, and when the lineup rotates.
 */

type Skill = 'serve' | 'reception' | 'attack' | 'block' | 'dig' | 'enf' | 'general';
type Grade = '#' | '+' | '/' | '-' | '=';
type Side = 'home' | 'away';
type Step = 'player' | 'keypad' | 'dest' | 'serve' | 'ask';

interface Copy {
  player: string;
  zone: string;
  cancel: string;
  hints: Record<'player' | 'keypad' | 'dest' | 'serve' | 'block' | 'error' | 'serveGrade', string>;
  blocks: string[];
  errors: { id: string; label: string }[];
  names: Record<Skill, string>;
  labels: Record<string, Record<string, string>>;
  toast: { us: string; rival: string; rotate: string; logged: string };
  quick: Record<Side, string>;
}

interface Court {
  netX: number;
  top: number;
  col: number;
  row: number;
  away: number[][];
  spots: Record<string, { x: number; y: number }>;
}

interface Snapshot {
  home: number;
  away: number;
  serving: Side;
  lineup: [number, number][];
  expect: Skill[];
  counter: boolean;
}

const NS = 'http://www.w3.org/2000/svg';
/** Zone a player moves to when the lineup rotates forward (2 serves next). */
const NEXT_ZONE: Record<number, number> = { 2: 1, 1: 6, 6: 5, 5: 4, 4: 3, 3: 2 };

export function initVolleyLab(lab: HTMLElement) {
  const root = lab.querySelector<HTMLElement>('[data-vl]')!;
  const copy: Copy = JSON.parse(root.dataset.vlStrings!);
  const court: Court = JSON.parse(root.dataset.court!);
  const seed: { zone: number; n: number }[] = JSON.parse(root.dataset.lineup!);

  const svg = root.querySelector<SVGSVGElement>('.vl__court')!;
  const players = Array.from(root.querySelectorAll<SVGGElement>('.vl__player'));
  const targets = Array.from(root.querySelectorAll<SVGRectElement>('.vl__target'));
  const shots = root.querySelector<SVGGElement>('[data-vl-shots]')!;
  const hint = root.querySelector<HTMLElement>('.vl__hint')!;
  const hintText = root.querySelector<HTMLElement>('[data-vl-hint]')!;
  const hintMark = root.querySelector<HTMLElement>('[data-vl-mark]')!;
  const ask = root.querySelector<HTMLElement>('[data-vl-ask]')!;
  const grid = root.querySelector<HTMLElement>('.vl__grid')!;
  const columns = Array.from(root.querySelectorAll<HTMLElement>('.vl__col'));
  const keys = Array.from(root.querySelectorAll<HTMLButtonElement>('.vl__col button'));
  const enf = root.querySelector<HTMLButtonElement>('[data-vl-enf]')!;
  const log = root.querySelector<HTMLElement>('[data-vl-log]')!;
  const empty = root.querySelector<HTMLElement>('[data-vl-empty]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-vl-undo]')!;
  const scoreEl = { home: root.querySelector<HTMLElement>('[data-vl-home]')!, away: root.querySelector<HTMLElement>('[data-vl-away]')! };
  const serveEl = Array.from(root.querySelectorAll<HTMLElement>('[data-vl-serve]'));

  let score = { home: 12, away: 9 };
  let serving: Side = 'away';
  let lineup = new Map<number, number>();
  let expect: Skill[] = [];
  let counter = false;
  let step: Step = 'player';
  let selected: number | null = null;
  let draft: { skill: Skill; grade: Grade; to?: string } | null = null;
  let preview: SVGGElement | null = null;
  let history: Snapshot[] = [];
  let hintTimer = 0;

  /* Drawing ---------------------------------------------------------------- */

  const zoneOf = (n: number) => [...lineup].find(([, player]) => player === n)![0];
  const spotOf = (n: number) => court.spots[zoneOf(n)];

  const place = () =>
    players.forEach((el) => {
      const spot = spotOf(Number(el.dataset.player));
      el.style.transform = `translate(${spot.x}px,${spot.y}px)`;
    });

  const hintFor = (): [string, string] => {
    if (step === 'serve') return ['●', copy.hints.serve];
    if (step === 'dest') return ['3', copy.hints.dest];
    if (step === 'keypad') return ['2', copy.hints.keypad];
    return ['1', copy.hints.player];
  };

  const say = (mark: string, text: string, tone = '') => {
    hintMark.textContent = mark;
    hintText.textContent = text;
    hint.dataset.tone = tone;
  };

  /** Shows the outcome of the last touch for a moment, then the next instruction. */
  const flash = (text: string, tone: string) => {
    clearTimeout(hintTimer);
    say('✓', text, tone);
    hintTimer = window.setTimeout(() => say(...hintFor()), 1500);
  };

  const paint = () => {
    root.dataset.step = step;
    players.forEach((el) => el.classList.toggle('is-on', Number(el.dataset.player) === selected));
    const ready = step === 'keypad';
    keys.forEach((key) => (key.disabled = !ready));
    enf.disabled = !ready;
    // The likely next touch is lit, as the product's suggestions do.
    grid.classList.toggle('has-next', expect.length > 0);
    columns.forEach((column) => {
      column.classList.toggle('is-next', expect.includes(column.dataset.col as Skill));
      const label = column.querySelector<HTMLElement>('span')!;
      label.textContent = counter && label.dataset.counter ? label.dataset.counter : label.dataset.label!;
    });
    const marking = step === 'dest' || step === 'serve';
    targets.forEach((target) => target.setAttribute('tabindex', marking ? '0' : '-1'));
    scoreEl.home.textContent = String(score.home);
    scoreEl.away.textContent = String(score.away);
    serveEl.forEach((el) => el.classList.toggle('is-serving', el.dataset.vlServe === serving));
    undoBtn.disabled = history.length === 0;
    empty.hidden = log.childElementCount > 0;
    if (step !== 'ask') {
      ask.hidden = true;
      ask.replaceChildren();
    }
  };

  const go = (next: Step) => {
    step = next;
    paint();
    clearTimeout(hintTimer);
    say(...hintFor());
  };

  /* Arrow from the player to where the ball went ------------------------------ */

  const toCourt = (event: { clientX: number; clientY: number }) => {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  const arrow = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'vl__shot');
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const tip = (turn: number, back: number) => `${to.x - Math.cos(angle + turn) * back},${to.y - Math.sin(angle + turn) * back}`;
    g.innerHTML =
      `<line x1="${from.x}" y1="${from.y}" x2="${to.x - Math.cos(angle) * 14}" y2="${to.y - Math.sin(angle) * 14}"/>` +
      `<polygon points="${to.x},${to.y} ${tip(0.42, 30)} ${tip(-0.42, 30)}"/>` +
      `<circle cx="${from.x}" cy="${from.y}" r="9"/>`;
    return g;
  };

  const dropPreview = () => {
    preview?.remove();
    preview = null;
  };

  svg.addEventListener('pointermove', (event) => {
    if ((step !== 'dest' && step !== 'serve') || selected === null) return;
    dropPreview();
    preview = arrow(spotOf(selected), toCourt(event));
    shots.append(preview);
  });
  svg.addEventListener('pointerleave', dropPreview);

  /* Recording --------------------------------------------------------------- */

  const snapshot = (): Snapshot => ({ ...score, serving, lineup: [...lineup], expect: [...expect], counter });

  const entry = (who: string, text: string, where: string, tone: string) => {
    const li = document.createElement('li');
    li.dataset.tone = tone;
    const b = document.createElement('b');
    b.textContent = who;
    const span = document.createElement('span');
    span.textContent = text;
    const i = document.createElement('i');
    i.textContent = where;
    li.append(b, span, i);
    log.prepend(li);
  };

  /** A new rally: either we serve (the server is picked for us) or we wait for their serve. */
  const rally = () => {
    counter = false;
    draft = null;
    if (serving === 'home') {
      selected = lineup.get(1)!;
      expect = [];
      go('serve');
      // A serve can also simply fail: those answers are on offer while the target is open.
      question(copy.hints.serve, copy.errors.slice(0, 2).map((error) => ({ label: error.label, tone: 'is-err', run: () => record('serve', '=', error.label) })), false);
    } else {
      selected = null;
      expect = ['reception'];
      go('player');
    }
  };

  const point = (side: Side) => {
    score[side] += 1;
    const el = scoreEl[side];
    el.classList.remove('is-up');
    void el.offsetWidth;
    el.classList.add('is-up');
    let rotated = false;
    if (side === 'home' && serving === 'away') {
      // Side-out: we won the rally on their serve, so we rotate and serve next.
      lineup = new Map([...lineup].map(([zone, player]) => [NEXT_ZONE[zone], player]));
      serving = 'home';
      rotated = true;
      place();
    } else if (side === 'away' && serving === 'home') {
      serving = 'away';
    }
    return rotated;
  };

  function record(skill: Skill, grade: Grade, where = '') {
    history.push(snapshot());
    const player = selected;
    const label = copy.labels[skill]?.[grade] ?? '';
    const us = grade === '#' && (skill === 'serve' || skill === 'attack' || skill === 'block');
    const rival = grade === '=' || (skill === 'attack' && grade === '/') || skill === 'enf';
    const from = player === null ? '' : String(zoneOf(player));
    const route = skill === 'attack' || skill === 'serve' ? `${from} → ${where}` : where;
    dropPreview();

    let rotated = false;
    if (us) rotated = point('home');
    if (rival) point('away');
    const tone = us ? 'good' : rival ? 'bad' : '';
    const text = skill === 'enf' ? copy.names.enf : `${copy.names[skill]} · ${grade} ${label}`;
    entry(player === null ? '—' : `#${player}`, us || rival ? `${text} · ${score.home}-${score.away}` : text, route, tone);

    if (us || rival) {
      rally();
      flash(us ? (rotated ? `${copy.toast.us} · ${copy.toast.rotate}` : copy.toast.us) : copy.toast.rival, tone);
      return;
    }
    // The rally goes on: light the touch that usually comes next.
    counter = skill === 'block' || skill === 'dig';
    expect = skill === 'reception' || counter ? ['attack'] : ['block', 'dig'];
    selected = null;
    draft = null;
    go('player');
    flash(`${copy.toast.logged}: ${label}`, '');
  }

  /* Follow-up questions -------------------------------------------------------- */

  function question(title: string, answers: { label: string; mark?: string; tone?: string; run: () => void }[], modal = true) {
    ask.replaceChildren();
    answers.forEach((answer) => {
      const button = document.createElement('button');
      button.type = 'button';
      if (answer.tone) button.className = answer.tone;
      if (answer.mark) {
        const b = document.createElement('b');
        b.textContent = answer.mark;
        button.append(b);
      }
      button.append(answer.label);
      button.addEventListener('click', answer.run);
      ask.append(button);
    });
    if (modal) {
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'is-quiet';
      cancel.textContent = copy.cancel;
      cancel.addEventListener('click', () => {
        dropPreview();
        // Cancelling a serve question goes back to marking it; anything else, back to the player.
        if (draft?.skill === 'serve') return rally();
        selected = null;
        draft = null;
        go('player');
      });
      ask.append(cancel);
      step = 'ask';
      paint();
      clearTimeout(hintTimer);
      say('?', title);
    }
    ask.hidden = false;
    if (modal) ask.querySelector<HTMLElement>('button')?.focus();
  }

  /* Input ---------------------------------------------------------------------- */

  const choose = (n: number) => {
    if (step !== 'player' && step !== 'keypad') return;
    selected = selected === n ? null : n;
    go(selected === null ? 'player' : 'keypad');
  };

  players.forEach((el) => {
    const n = Number(el.dataset.player);
    el.addEventListener('click', () => choose(n));
    el.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      choose(n);
    });
  });

  keys.forEach((key) =>
    key.addEventListener('click', () => {
      if (step !== 'keypad' || selected === null) return;
      const skill = key.dataset.skill as Skill;
      const grade = key.dataset.grade as Grade;
      // Reception, block and dig are complete as they are.
      if (skill !== 'attack') return record(skill, grade);
      draft = { skill, grade };
      if (grade === '/') return question(copy.hints.block, copy.blocks.map((label) => ({ label, run: () => record('attack', '/', label) })));
      if (grade === '=') return question(copy.hints.error, copy.errors.map((error) => ({ label: error.label, tone: 'is-err', run: () => record('attack', '=', error.label) })));
      go('dest');
    }),
  );

  enf.addEventListener('click', () => step === 'keypad' && record('enf', '='));

  const land = (target: SVGRectElement, at?: { x: number; y: number }) => {
    const zone = target.dataset.target!;
    // Each zone has four sub-zones, A to D, read left to right and top to bottom.
    let sub = '';
    if (at) {
      const x = Number(target.getAttribute('x'));
      const y = Number(target.getAttribute('y'));
      sub = 'ABCD'[(at.x > x + court.col / 2 ? 1 : 0) + (at.y > y + court.row / 2 ? 2 : 0)];
    }
    const where = `${zone}${sub}`;
    const from = spotOf(selected!);
    const to = at ?? { x: Number(target.getAttribute('x')) + court.col / 2, y: Number(target.getAttribute('y')) + court.row / 2 };
    dropPreview();
    const done = arrow(from, to);
    shots.append(done);
    requestAnimationFrame(() => done.classList.add('is-old'));
    setTimeout(() => done.remove(), 1000);
    target.classList.remove('is-hit');
    void target.getBoundingClientRect();
    target.classList.add('is-hit');

    if (step === 'dest' && draft) return record('attack', draft.grade, where);
    if (step !== 'serve') return;
    draft = { skill: 'serve', grade: '+', to: where };
    question(
      copy.hints.serveGrade,
      (['#', '+', '-', '/'] as Grade[]).map((grade) => ({ mark: grade, label: copy.labels.serve[grade], run: () => record('serve', grade, where) })),
    );
  };

  targets.forEach((target) => {
    target.addEventListener('click', (event) => (step === 'dest' || step === 'serve') && land(target, toCourt(event)));
    target.addEventListener('keydown', (event) => {
      if ((event.key !== 'Enter' && event.key !== ' ') || (step !== 'dest' && step !== 'serve')) return;
      event.preventDefault();
      land(target);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-vl-quick]').forEach((button) =>
    button.addEventListener('click', () => {
      const side = button.dataset.vlQuick as Side;
      history.push(snapshot());
      dropPreview();
      const rotated = point(side);
      entry('—', `${button.textContent!.trim()} · ${score.home}-${score.away}`, '', side === 'home' ? 'good' : 'bad');
      rally();
      flash(side === 'home' ? (rotated ? `${copy.toast.us} · ${copy.toast.rotate}` : copy.toast.us) : copy.toast.rival, side === 'home' ? 'good' : 'bad');
    }),
  );

  undoBtn.addEventListener('click', () => {
    const last = history.pop();
    if (!last) return;
    score = { home: last.home, away: last.away };
    serving = last.serving;
    lineup = new Map(last.lineup);
    log.firstElementChild?.remove();
    place();
    dropPreview();
    if (serving === 'home' && last.expect.length === 0) return rally();
    expect = last.expect;
    counter = last.counter;
    selected = null;
    draft = null;
    go('player');
  });

  const reset = () => {
    clearTimeout(hintTimer);
    score = { home: 12, away: 9 };
    serving = 'away';
    lineup = new Map(seed.map((spot) => [spot.zone, spot.n]));
    history = [];
    log.replaceChildren();
    shots.replaceChildren();
    preview = null;
    place();
    rally();
  };

  reset();
  return { reset };
}
