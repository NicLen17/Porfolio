/**
 * The demo fair used by ExpoLogic's map, both in the scripted carousel and in
 * the hands-on demo. Laid out like the product's own seeded map: rows of
 * stands in the organizer's colours, with the status drawn as an outline plus a
 * hatch (never as the fill).
 */
export const SIZE = 46;
export const STEP = 62;

export const rows = [
  { id: 'G', y: 188, x: 470, n: 10, fill: '#fdba74' },
  { id: 'F', y: 250, x: 470, n: 10, fill: '#86efac' },
  { id: 'E', y: 350, x: 594, n: 8, fill: '#93c5fd' },
  { id: 'D', y: 450, x: 250, n: 12, fill: '#c4b5fd' },
  { id: 'C', y: 590, x: 420, n: 10, fill: '#fde047' },
  { id: 'A', y: 670, x: 420, n: 10, fill: '#fca5a5' },
];

const taken = new Set(['G2', 'G3', 'G7', 'F1', 'F5', 'F9', 'E4', 'E6', 'D3', 'D4', 'D10', 'C2', 'C8', 'A6']);
const waiting = new Set(['G9', 'E2', 'D7', 'A3']);

export type StandStatus = 'taken' | 'wait' | 'free';

export const stands = rows.flatMap((row) =>
  Array.from({ length: row.n }, (_, i) => {
    const code = `${row.id}${i + 1}`;
    const status: StandStatus = taken.has(code) ? 'taken' : waiting.has(code) ? 'wait' : 'free';
    return { code, row: row.id, x: row.x + STEP * i, y: row.y, fill: row.fill, status };
  }),
);

export const total = stands.length;
export const free = stands.filter((stand) => stand.status === 'free').length;
export const stroke = { free: '#16a34a', wait: '#f59e0b', taken: '#ef4444' } as const;
export const legend = ['#3b82f6', '#16a34a', '#f59e0b', '#ef4444'];
