import type { Ticket, TambolaPrize, TambolaPrizeId } from '../../lib/types';
import { PRIZE_LABELS } from '../../lib/mockData';

// Column n covers: col0 -> 1..9, col1 -> 10..19, ... col8 -> 80..90.
function columnRange(col: number): [number, number] {
  if (col === 0) return [1, 9];
  if (col === 8) return [80, 90];
  return [col * 10, col * 10 + 9];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 0/1 incidence matrix: 3 rows summing to 5, col sums = counts[col].
function buildLayout(counts: number[]): boolean[][] | null {
  const rows = [
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
  ];
  const rowCap = [5, 5, 5];
  // Place columns with the most numbers first (most constrained).
  const order = counts
    .map((c, col) => ({ c, col }))
    .sort((a, b) => b.c - a.c);
  for (const { c, col } of order) {
    const choices = [0, 1, 2]
      .filter((r) => rowCap[r] > 0)
      .sort((a, b) => rowCap[b] - rowCap[a]);
    if (choices.length < c) return null;
    // pick c rows with the most remaining capacity (ties broken randomly)
    const shuffled = choices.sort(() => Math.random() - 0.5).sort((a, b) => rowCap[b] - rowCap[a]);
    for (let i = 0; i < c; i++) {
      const r = shuffled[i];
      rows[r][col] = true;
      rowCap[r]--;
    }
  }
  if (rowCap.some((x) => x !== 0)) return null;
  return rows;
}

export function generateTicket(): Ticket {
  for (let attempt = 0; attempt < 200; attempt++) {
    // column counts: each 1..3, sum 15
    const counts = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    let remaining = 6;
    while (remaining > 0) {
      const col = randInt(0, 8);
      if (counts[col] < 3) {
        counts[col]++;
        remaining--;
      }
    }
    const layout = buildLayout(counts);
    if (!layout) continue;

    const ticket: Ticket = [
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
    ];
    for (let col = 0; col < 9; col++) {
      const [lo, hi] = columnRange(col);
      const pool: number[] = [];
      for (let n = lo; n <= hi; n++) pool.push(n);
      // pick counts[col] distinct numbers, ascending (filled top->bottom)
      const picked: number[] = [];
      for (let i = 0; i < counts[col]; i++) {
        const idx = randInt(0, pool.length - 1);
        picked.push(pool.splice(idx, 1)[0]);
      }
      picked.sort((a, b) => a - b);
      let p = 0;
      for (let row = 0; row < 3; row++) {
        if (layout[row][col]) {
          ticket[row][col] = picked[p++];
        }
      }
    }
    return ticket;
  }
  // Fallback (should never hit): trivial layout
  return [
    [1, null, 23, null, 47, null, null, null, 80],
    [null, 12, null, 34, null, 56, null, 70, null],
    [7, null, 29, null, null, 61, 77, null, null],
  ];
}

export function ticketNumbers(ticket: Ticket, row?: number): number[] {
  const out: number[] = [];
  ticket.forEach((r, ri) => {
    if (row !== undefined && ri !== row) return;
    r.forEach((c) => {
      if (c !== null) out.push(c);
    });
  });
  return out;
}

export function defaultPrizes(ids: TambolaPrizeId[]): TambolaPrize[] {
  return ids.map((id) => ({ id, label: PRIZE_LABELS[id] }));
}

// Is `prize` satisfied by this ticket given the set of called numbers?
export function prizeSatisfied(
  prize: TambolaPrizeId,
  ticket: Ticket,
  called: Set<number>,
): boolean {
  const allCalled = (nums: number[]) => nums.length > 0 && nums.every((n) => called.has(n));
  switch (prize) {
    case 'early5':
      return ticketNumbers(ticket).filter((n) => called.has(n)).length >= 5;
    case 'topLine':
      return allCalled(ticketNumbers(ticket, 0));
    case 'middleLine':
      return allCalled(ticketNumbers(ticket, 1));
    case 'bottomLine':
      return allCalled(ticketNumbers(ticket, 2));
    case 'fullHouse':
      return allCalled(ticketNumbers(ticket));
  }
}

// Numbers still needed for a prize (for the "2 to go" private hint).
export function numbersToGo(
  prize: TambolaPrizeId,
  ticket: Ticket,
  called: Set<number>,
): number {
  if (prize === 'early5') {
    const have = ticketNumbers(ticket).filter((n) => called.has(n)).length;
    return Math.max(0, 5 - have);
  }
  const nums =
    prize === 'topLine'
      ? ticketNumbers(ticket, 0)
      : prize === 'middleLine'
        ? ticketNumbers(ticket, 1)
        : prize === 'bottomLine'
          ? ticketNumbers(ticket, 2)
          : ticketNumbers(ticket);
  return nums.filter((n) => !called.has(n)).length;
}
