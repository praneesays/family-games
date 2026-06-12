import { create } from 'zustand';
import type {
  ActivityItem,
  AuthState,
  Card,
  FloatReaction,
  GameId,
  GameState,
  HistoryEntry,
  MomentData,
  Player,
  Room,
  RummyState,
  TambolaOptions,
  TambolaPrizeId,
  TambolaState,
  Toast,
} from './types';
import {
  BOT_NAMES,
  makeRoomCode,
  phraseFor,
} from './mockData';
import {
  defaultPrizes,
  generateTicket,
  numbersToGo,
  prizeSatisfied,
} from '../games/tambola/tambolaLogic';
import {
  botDiscardChoice,
  dealRummy,
  estimateDeadwood,
  sortHand,
} from '../games/rummy/rummyLogic';

let uid = 0;
const id = () => `id${++uid}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_TAMBOLA: TambolaOptions = {
  autoMark: true,
  speed: 'relaxed',
  prizes: ['early5', 'topLine', 'middleLine', 'bottomLine', 'fullHouse'],
};
const SPEED_MS = { relaxed: 3000, normal: 2200, fast: 1400 } as const;
const REACTIONS = ['😂', '👏', '😮', '🎉', '❤️'];

// ---- module-level simulation timers (kept out of React state) ----
const sim: { timers: Set<ReturnType<typeof setTimeout>>; loops: Set<ReturnType<typeof setInterval>> } = {
  timers: new Set(),
  loops: new Set(),
};
function later(fn: () => void, ms: number) {
  const t = setTimeout(() => {
    sim.timers.delete(t);
    fn();
  }, ms);
  sim.timers.add(t);
  return t;
}
function loop(fn: () => void, ms: number) {
  const t = setInterval(fn, ms);
  sim.loops.add(t);
  return t;
}
function clearSim() {
  sim.timers.forEach(clearTimeout);
  sim.loops.forEach(clearInterval);
  sim.timers.clear();
  sim.loops.clear();
}

interface SessionWin {
  name: string;
  count: number;
}

interface State {
  selfName: string;
  selfColor: number;
  room: Room | null;
  players: Player[];
  game: GameState | null;
  toasts: Toast[];
  moment: MomentData | null;
  floats: FloatReaction[];
  activity: ActivityItem[];
  terminal: null | 'full' | 'ended' | 'invalid' | 'kicked' | 'goodbye';
  sessionWins: SessionWin[];
  gamesPlayed: number;
  auth: AuthState;
  history: HistoryEntry[];

  // identity
  setName: (name: string) => void;
  loadSelf: () => void;
  signIn: (method: 'google' | 'phone', phone?: string) => void;
  signOut: () => void;

  // room lifecycle
  createRoom: (name: string, gameId: GameId, options: TambolaOptions | { pointsLimit: number }) => string;
  ensureJoinableRoom: (code: string) => void; // simulate a host-made room when arriving via link
  joinRoom: () => void;
  startGame: () => void;
  switchGame: (gameId: GameId) => void;
  playAgain: () => void;
  leaveRoom: () => void;
  endRoom: () => void;
  kick: (playerId: string) => void;
  transferHost: (playerId: string) => void;
  toggleLock: () => void;

  // tambola
  toggleAutoMark: () => void;
  markNumber: (n: number) => void;
  claimPrize: (prize: TambolaPrizeId) => void;

  // rummy
  drawFrom: (src: 'closed' | 'discard') => void;
  discardCard: (cardId: string) => void;
  declareRummy: () => void;
  dropHand: () => void;
  reorderHand: (cards: Card[]) => void;

  // ephemera
  react: (emoji: string) => void;
  dismissMoment: () => void;
  dismissToast: (id: string) => void;
  setTerminal: (t: State['terminal']) => void;
}

function selfId() {
  return 'self';
}

export const useStore = create<State>((set, get) => {
  // ---- helpers ----
  function toast(text: string, tone: Toast['tone'] = 'info') {
    const t: Toast = { id: id(), text, tone };
    set((s) => ({ toasts: [...s.toasts.slice(-2), t] }));
    later(() => get().dismissToast(t.id), 3200);
  }
  function activity(text: string, emphasis = false) {
    set((s) => ({ activity: [{ id: id(), text, emphasis }, ...s.activity].slice(0, 40) }));
  }
  function showMoment(m: Omit<MomentData, 'id'>, autoMs = 2600) {
    const moment = { ...m, id: id() };
    set({ moment });
    later(() => {
      if (get().moment?.id === moment.id) set({ moment: null });
    }, autoMs);
  }
  function recordHistory(outcome: string, won: boolean) {
    const room = get().room;
    if (!room) return;
    const entry: HistoryEntry = {
      id: id(),
      roomName: room.name,
      roomCode: room.code,
      gameId: room.gameId,
      date: new Date().toISOString(),
      outcome,
      won,
    };
    const history = [entry, ...get().history].slice(0, 30);
    set({ history });
    try {
      localStorage.setItem('fg_history', JSON.stringify(history));
    } catch {
      /* storage full/unavailable — history is best-effort */
    }
  }

  function recordWin(name: string) {
    set((s) => {
      const existing = s.sessionWins.find((w) => w.name === name);
      if (existing) {
        return { sessionWins: s.sessionWins.map((w) => (w.name === name ? { ...w, count: w.count + 1 } : w)) };
      }
      return { sessionWins: [...s.sessionWins, { name, count: 1 }] };
    });
  }
  function botFloat() {
    const bots = get().players.filter((p) => p.isBot && p.conn === 'online');
    if (!bots.length) return;
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    spawnFloat(emoji, bot.colorIndex, bot.name);
  }
  function spawnFloat(emoji: string, colorIndex: number, fromName: string) {
    const f: FloatReaction = { id: id(), emoji, colorIndex, fromName };
    set((s) => ({ floats: [...s.floats, f] }));
    later(() => set((s) => ({ floats: s.floats.filter((x) => x.id !== f.id) })), 1600);
  }

  // seed bots joining the lobby over a few seconds
  function seedBotsJoining(count: number, startColor: number) {
    const names = BOT_NAMES.filter((n) => n !== get().selfName).slice(0, count);
    names.forEach((name, i) => {
      later(() => {
        if (!get().room) return;
        const p: Player = {
          id: id(),
          name,
          colorIndex: (startColor + i + 1) % 8,
          isHost: false,
          isSelf: false,
          isBot: true,
          conn: 'online',
        };
        set((s) => ({ players: [...s.players, p] }));
        activity(`${name} joined`);
        toast(`${name} joined`, 'info');
        // one bot demonstrates the reconnect state
        if (i === 1) {
          later(() => {
            set((s) => ({ players: s.players.map((x) => (x.id === p.id ? { ...x, conn: 'reconnecting' } : x)) }));
            later(() => {
              set((s) => ({ players: s.players.map((x) => (x.id === p.id ? { ...x, conn: 'online' } : x)) }));
            }, 3500);
          }, 6000);
        }
      }, 1200 + i * 1400);
    });
  }

  // ============ TAMBOLA ENGINE ============
  function startTambola() {
    const players = get().players.filter((p) => p.conn !== 'left');
    const opts = get().room!.options as TambolaOptions;
    const tickets: TambolaState['tickets'] = {};
    const marked: TambolaState['marked'] = {};
    players.forEach((p) => {
      tickets[p.id] = generateTicket();
      marked[p.id] = new Set();
    });
    const state: TambolaState = {
      kind: 'tambola',
      tickets,
      marked,
      called: [],
      current: null,
      prizes: defaultPrizes(opts.prizes),
      finished: false,
    };
    set({ game: state, room: { ...get().room!, status: 'in-game' } });
    activity('Tickets dealt — good luck!', true);

    const pool = Array.from({ length: 90 }, (_, i) => i + 1);
    // shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let idx = 0;
    const speed = SPEED_MS[opts.speed];
    loop(() => {
      const g = get().game as TambolaState | null;
      if (!g || g.finished) return;
      if (idx >= pool.length) return;
      const n = pool[idx++];
      const called = [...g.called, n];
      const calledSet = new Set(called);
      const newMarked: TambolaState['marked'] = {};
      // auto-mark everyone (bots always; self if option on)
      Object.keys(g.tickets).forEach((pid) => {
        const cur = new Set(g.marked[pid]);
        const isSelf = pid === selfId();
        const ticketHas = g.tickets[pid].some((row) => row.includes(n));
        if (ticketHas && (!isSelf || opts.autoMark)) cur.add(n);
        newMarked[pid] = cur;
      });
      set({ game: { ...g, called, current: n, marked: newMarked } });
      activity(phraseFor(n));

      // bots auto-claim satisfied prizes
      get().players.forEach((p) => {
        if (!p.isBot || p.conn === 'left') return;
        const ticket = g.tickets[p.id];
        if (!ticket) return;
        get().game!.kind === 'tambola' &&
          (get().game as TambolaState).prizes.forEach((prize) => {
            if (prize.wonBy) return;
            if (prizeSatisfied(prize.id, ticket, calledSet)) {
              later(() => awardPrize(prize.id, p.name), 500 + Math.random() * 1200);
            }
          });
      });
      if (Math.random() < 0.25) botFloat();
    }, speed);
  }

  function awardPrize(prizeId: TambolaPrizeId, winner: string) {
    const g = get().game as TambolaState | null;
    if (!g || g.kind !== 'tambola') return;
    const prize = g.prizes.find((p) => p.id === prizeId);
    if (!prize || prize.wonBy) return; // already claimed
    const prizes = g.prizes.map((p) => (p.id === prizeId ? { ...p, wonBy: winner } : p));
    set({ game: { ...g, prizes } });
    recordWin(winner);
    activity(`🏆 ${winner} won ${prize.label}!`, true);
    showMoment({
      title: `${winner} wins ${prize.label}!`,
      subtitle: prizeId === 'fullHouse' ? 'Full House — game over 🎉' : 'Well played 🎉',
      avatarName: winner,
      colorIndex: get().players.find((p) => p.name === winner)?.colorIndex ?? 0,
    });
    if (prizeId === 'fullHouse' || prizes.every((p) => p.wonBy)) {
      finishTambola();
    }
  }

  function finishTambola() {
    const g = get().game as TambolaState;
    set({ game: { ...g, finished: true } });
    clearSim();
    const myName = get().players.find((p) => p.isSelf)?.name;
    const myPrizes = g.prizes.filter((p) => p.wonBy === myName).map((p) => p.label);
    recordHistory(myPrizes.length ? `Won ${myPrizes.join(' · ')}` : 'No prizes this time', myPrizes.length > 0);
    later(() => set({ room: { ...get().room!, status: 'results' }, gamesPlayed: get().gamesPlayed + 1 }), 1800);
  }

  // ============ RUMMY ENGINE ============
  function startRummy() {
    const players = get().players.filter((p) => p.conn !== 'left');
    const ids = players.map((p) => p.id);
    const deal = dealRummy(ids);
    const handCounts: Record<string, number> = {};
    ids.forEach((pid) => (handCounts[pid] = 13));
    const state: RummyState = {
      kind: 'rummy',
      hands: deal.hands,
      handCounts,
      drawPileCount: deal.drawPile.length,
      discard: deal.discard,
      wildJoker: deal.wildJoker,
      turnOrder: ids,
      turnIndex: 0,
      turnEndsAt: Date.now() + 30000,
      hasDrawn: false,
      finished: false,
    };
    set({ game: state, room: { ...get().room!, status: 'in-game' } });
    activity('Cards dealt — sort your hand!', true);
    advanceRummyTurnIfBot();
  }

  function currentRummyPlayer(): Player | undefined {
    const g = get().game as RummyState;
    const pid = g.turnOrder[g.turnIndex];
    return get().players.find((p) => p.id === pid);
  }

  function advanceRummyTurnIfBot() {
    const g = get().game as RummyState | null;
    if (!g || g.finished) return;
    const player = currentRummyPlayer();
    if (!player) return;
    if (player.id === selfId()) {
      // human's turn: set a 30s auto-discard
      set({ game: { ...g, turnEndsAt: Date.now() + 30000, hasDrawn: false } });
      later(() => {
        const cur = get().game as RummyState;
        if (cur && cur.kind === 'rummy' && cur.turnOrder[cur.turnIndex] === selfId() && !cur.finished) {
          // auto play: draw if needed then discard worst
          if (!cur.hasDrawn) doSelfDraw('closed', true);
          const hand = (get().game as RummyState).hands[selfId()];
          const worst = botDiscardChoice(hand);
          toast('Time’s up — auto-discarded', 'warning');
          doDiscard(worst.id);
        }
      }, 30000);
      return;
    }
    // bot turn
    later(() => {
      const cur = get().game as RummyState | null;
      if (!cur || cur.kind !== 'rummy' || cur.finished) return;
      const pid = cur.turnOrder[cur.turnIndex];
      // bot maybe declares after enough turns
      if (cur.discard.length > 8 && Math.random() < 0.18) {
        botDeclare(pid);
        return;
      }
      // bot draws (from discard sometimes), then discards
      const took = Math.random() < 0.25 ? cur.discard[cur.discard.length - 1] : null;
      const newCounts = { ...cur.handCounts };
      let discard = cur.discard;
      let drawPileCount = cur.drawPileCount;
      if (took) {
        discard = cur.discard.slice(0, -1);
        activity(`${currentRummyPlayer()?.name} took ${cardLabel(took)} from discard`);
      } else {
        drawPileCount = Math.max(0, drawPileCount - 1);
        activity(`${currentRummyPlayer()?.name} drew a card`);
      }
      // bot discards a plausible card
      const discardCard: Card = took
        ? { id: id(), rank: Math.ceil(Math.random() * 13), suit: (['spades', 'hearts', 'diamonds', 'clubs'] as const)[Math.floor(Math.random() * 4)] }
        : { id: id(), rank: Math.ceil(Math.random() * 13), suit: (['spades', 'hearts', 'diamonds', 'clubs'] as const)[Math.floor(Math.random() * 4)] };
      const next: RummyState = {
        ...cur,
        discard: [...discard, discardCard],
        handCounts: newCounts,
        drawPileCount,
        turnIndex: (cur.turnIndex + 1) % cur.turnOrder.length,
        hasDrawn: false,
        turnEndsAt: Date.now() + 30000,
      };
      set({ game: next });
      if (Math.random() < 0.2) botFloat();
      advanceRummyTurnIfBot();
    }, 1400 + Math.random() * 1400);
  }

  function doSelfDraw(src: 'closed' | 'discard', silent = false) {
    const g = get().game as RummyState;
    if (g.hasDrawn) return;
    let drawn: Card;
    let discard = g.discard;
    let drawPileCount = g.drawPileCount;
    if (src === 'discard' && g.discard.length) {
      drawn = g.discard[g.discard.length - 1];
      discard = g.discard.slice(0, -1);
    } else {
      // synthesize a random card from "closed pile"
      drawn = { id: id(), rank: Math.ceil(Math.random() * 13), suit: (['spades', 'hearts', 'diamonds', 'clubs'] as const)[Math.floor(Math.random() * 4)] };
      drawPileCount = Math.max(0, drawPileCount - 1);
    }
    const hand = sortHand([...g.hands[selfId()], drawn]);
    set({ game: { ...g, hands: { ...g.hands, [selfId()]: hand }, discard, drawPileCount, hasDrawn: true } });
    if (!silent) activity(`You drew ${cardLabel(drawn)}`);
  }

  function doDiscard(cardId: string) {
    const g = get().game as RummyState;
    const hand = g.hands[selfId()];
    const card = hand.find((c) => c.id === cardId);
    if (!card) return;
    const newHand = hand.filter((c) => c.id !== cardId);
    const next: RummyState = {
      ...g,
      hands: { ...g.hands, [selfId()]: newHand },
      discard: [...g.discard, card],
      turnIndex: (g.turnIndex + 1) % g.turnOrder.length,
      hasDrawn: false,
      turnEndsAt: Date.now() + 30000,
    };
    set({ game: next });
    activity(`You discarded ${cardLabel(card)}`);
    advanceRummyTurnIfBot();
  }

  function botDeclare(pid: string) {
    const g = get().game as RummyState;
    const name = get().players.find((p) => p.id === pid)?.name ?? 'Player';
    const scores: Record<string, number> = {};
    get().players.forEach((p) => {
      if (p.id === pid) scores[p.id] = 0;
      else if (p.id === selfId()) scores[p.id] = Math.min(80, estimateDeadwood(g.hands[selfId()]));
      else scores[p.id] = Math.min(80, 10 + Math.floor(Math.random() * 50));
    });
    set({ game: { ...g, finished: true, declarer: pid, scores } });
    recordWin(name);
    {
      const ranking = Object.entries(scores).sort((a, b) => a[1] - b[1]);
      const myRank = ranking.findIndex(([p]) => p === selfId()) + 1;
      const ord = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'][myRank] ?? `${myRank}th`;
      recordHistory(`${ord} · ${scores[selfId()] ?? 0} pts`, myRank === 1);
    }
    activity(`🃏 ${name} declared and won!`, true);
    showMoment({ title: `${name} declares!`, subtitle: 'Hands revealed 🎉', avatarName: name, colorIndex: get().players.find((p) => p.id === pid)?.colorIndex ?? 0 });
    clearSim();
    later(() => set({ room: { ...get().room!, status: 'results' }, gamesPlayed: get().gamesPlayed + 1 }), 1900);
  }

  function cardLabel(c: Card): string {
    if (c.joker) return 'Joker';
    const r = c.rank === 1 ? 'A' : c.rank === 11 ? 'J' : c.rank === 12 ? 'Q' : c.rank === 13 ? 'K' : String(c.rank);
    const sym = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[c.suit];
    return `${r}${sym}`;
  }

  // ============ PUBLIC ACTIONS ============
  return {
    selfName: '',
    selfColor: 0,
    room: null,
    players: [],
    game: null,
    toasts: [],
    moment: null,
    floats: [],
    activity: [],
    terminal: null,
    sessionWins: [],
    gamesPlayed: 0,
    auth: { signedIn: false },
    history: [],

    loadSelf: () => {
      const name = localStorage.getItem('fg_name') ?? '';
      const color = Number(localStorage.getItem('fg_color') ?? '0');
      let auth: AuthState = { signedIn: false };
      let history: HistoryEntry[] = [];
      try {
        auth = JSON.parse(localStorage.getItem('fg_auth') ?? 'null') ?? { signedIn: false };
        history = JSON.parse(localStorage.getItem('fg_history') ?? '[]');
      } catch {
        /* corrupt storage — fall back to defaults */
      }
      set({ selfName: name, selfColor: color, auth, history });
    },
    signIn: (method, phone) => {
      const auth: AuthState = { signedIn: true, method, phone };
      localStorage.setItem('fg_auth', JSON.stringify(auth));
      set({ auth });
      toast(method === 'google' ? 'Signed in with Google ✓' : 'Phone verified ✓', 'success');
    },
    signOut: () => {
      localStorage.removeItem('fg_auth');
      set({ auth: { signedIn: false } });
      toast('Signed out', 'info');
    },
    setName: (name) => {
      const color = get().selfColor || Math.floor(Math.random() * 8);
      localStorage.setItem('fg_name', name);
      localStorage.setItem('fg_color', String(color));
      set({ selfName: name, selfColor: color });
    },

    createRoom: (name, gameId, options) => {
      clearSim();
      const code = makeRoomCode();
      const self: Player = {
        id: selfId(),
        name: get().selfName || 'You',
        colorIndex: get().selfColor,
        isHost: true,
        isSelf: true,
        isBot: false,
        conn: 'online',
      };
      const room: Room = {
        code,
        name,
        gameId,
        status: 'lobby',
        options: gameId === 'tambola' ? (options as TambolaOptions) : (options as { pointsLimit: number }),
        locked: false,
      };
      set({ room, players: [self], game: null, activity: [], sessionWins: [], gamesPlayed: 0, terminal: null });
      localStorage.setItem('fg_lastRoom', JSON.stringify({ code, name }));
      seedBotsJoining(4, get().selfColor);
      return code;
    },

    ensureJoinableRoom: (code) => {
      if (get().room?.code === code) return;
      clearSim();
      // Simulate a room a relative already created and shared via WhatsApp.
      const hostColor = 0;
      const host: Player = { id: id(), name: 'Priya', colorIndex: hostColor, isHost: true, isSelf: false, isBot: true, conn: 'online' };
      const others: Player[] = ['Asha', 'Ravi'].map((n, i) => ({
        id: id(), name: n, colorIndex: (i + 1) % 8, isHost: false, isSelf: false, isBot: true, conn: 'online',
      }));
      const room: Room = {
        code,
        name: 'Sharma Family Diwali 🪔',
        gameId: 'tambola',
        status: 'lobby',
        options: DEFAULT_TAMBOLA,
        locked: false,
      };
      set({ room, players: [host, ...others], game: null, activity: [], sessionWins: [], gamesPlayed: 0, terminal: null });
    },

    joinRoom: () => {
      const room = get().room;
      if (!room) return;
      if (get().players.some((p) => p.isSelf)) return;
      const self: Player = {
        id: selfId(),
        name: get().selfName || 'You',
        colorIndex: get().selfColor,
        isHost: false,
        isSelf: true,
        isBot: false,
        conn: 'online',
      };
      set((s) => ({ players: [...s.players, self] }));
      localStorage.setItem('fg_lastRoom', JSON.stringify({ code: room.code, name: room.name }));
      activity('You joined the room');
      // a couple more relatives trickle in
      seedBotsJoining(2, get().selfColor + 3);
      // host (bot) auto-starts shortly to keep the demo flowing
      later(() => {
        if (get().room?.status === 'lobby') {
          toast('Priya is starting the game…', 'info');
          later(() => get().startGame(), 1600);
        }
      }, 5000);
    },

    startGame: () => {
      const room = get().room;
      if (!room) return;
      showMoment({ title: '3 · 2 · 1', subtitle: 'Game starting!' }, 1400);
      later(() => {
        if (room.gameId === 'tambola') startTambola();
        else startRummy();
      }, 1400);
    },

    switchGame: (gameId) => {
      clearSim();
      const room = get().room!;
      set({
        room: { ...room, gameId, status: 'lobby', options: gameId === 'tambola' ? DEFAULT_TAMBOLA : { pointsLimit: 101 } },
        game: null,
      });
      activity(`Switched to ${gameId === 'tambola' ? 'Tambola' : 'Rummy'}`, true);
      toast(`Next up: ${gameId === 'tambola' ? 'Tambola 🎫' : 'Rummy 🃏'}`);
    },

    playAgain: () => {
      const room = get().room!;
      set({ room: { ...room, status: 'lobby' }, game: null });
      later(() => get().startGame(), 800);
    },

    leaveRoom: () => {
      clearSim();
      set({ room: null, players: [], game: null, activity: [], moment: null, floats: [], terminal: 'goodbye' });
    },
    endRoom: () => {
      clearSim();
      set({ terminal: 'ended', room: null, players: [], game: null });
    },
    kick: (pid) => {
      const p = get().players.find((x) => x.id === pid);
      set((s) => ({ players: s.players.filter((x) => x.id !== pid) }));
      if (p) toast(`${p.name} left`, 'info');
    },
    transferHost: (pid) => {
      set((s) => ({ players: s.players.map((p) => ({ ...p, isHost: p.id === pid })) }));
      const name = get().players.find((p) => p.id === pid)?.name;
      if (name) toast(`${name} is now the host`, 'info');
    },
    toggleLock: () => set((s) => ({ room: s.room ? { ...s.room, locked: !s.room.locked } : null })),

    toggleAutoMark: () => {
      const room = get().room;
      if (!room || room.gameId !== 'tambola') return;
      const opts = room.options as TambolaOptions;
      set({ room: { ...room, options: { ...opts, autoMark: !opts.autoMark } } });
    },
    markNumber: (n) => {
      const g = get().game as TambolaState | null;
      if (!g || g.kind !== 'tambola') return;
      if (!g.called.includes(n)) {
        // tapped a not-yet-called cell — gentle no-op (UI shakes)
        return;
      }
      const cur = new Set(g.marked[selfId()]);
      cur.add(n);
      set({ game: { ...g, marked: { ...g.marked, [selfId()]: cur } } });
    },
    claimPrize: (prizeId) => {
      const g = get().game as TambolaState | null;
      if (!g || g.kind !== 'tambola') return;
      const ticket = g.tickets[selfId()];
      const called = new Set(g.called);
      if (prizeSatisfied(prizeId, ticket, called)) {
        awardPrize(prizeId, get().players.find((p) => p.isSelf)?.name ?? 'You');
      } else {
        const togo = numbersToGo(prizeId, ticket, called);
        toast(`Not yet! ${togo} more number${togo === 1 ? '' : 's'} to go.`, 'warning');
      }
    },

    drawFrom: (src) => {
      const g = get().game as RummyState | null;
      if (!g || g.kind !== 'rummy') return;
      if (g.turnOrder[g.turnIndex] !== selfId()) return;
      doSelfDraw(src);
    },
    discardCard: (cardId) => {
      const g = get().game as RummyState | null;
      if (!g || g.kind !== 'rummy') return;
      if (g.turnOrder[g.turnIndex] !== selfId() || !g.hasDrawn) {
        toast('Draw a card first', 'warning');
        return;
      }
      doDiscard(cardId);
    },
    declareRummy: () => {
      const g = get().game as RummyState | null;
      if (!g || g.kind !== 'rummy') return;
      const scores: Record<string, number> = {};
      get().players.forEach((p) => {
        if (p.isSelf) scores[p.id] = 0;
        else scores[p.id] = Math.min(80, 10 + Math.floor(Math.random() * 50));
      });
      set({ game: { ...g, finished: true, declarer: selfId(), scores } });
      const me = get().players.find((p) => p.isSelf)?.name ?? 'You';
      recordWin(me);
      recordHistory('Declared & won 🃏', true);
      showMoment({ title: 'You declared! 🎉', subtitle: 'Hands revealed', avatarName: me, colorIndex: get().selfColor });
      clearSim();
      later(() => set({ room: { ...get().room!, status: 'results' }, gamesPlayed: get().gamesPlayed + 1 }), 1900);
    },
    dropHand: () => {
      const g = get().game as RummyState | null;
      if (!g) return;
      toast('You dropped this hand (20 pts)', 'warning');
      const next: RummyState = { ...g, turnIndex: (g.turnIndex + 1) % g.turnOrder.length, hasDrawn: false };
      set({ game: next });
      advanceRummyTurnIfBot();
    },
    reorderHand: (cards) => {
      const g = get().game as RummyState | null;
      if (!g || g.kind !== 'rummy') return;
      set({ game: { ...g, hands: { ...g.hands, [selfId()]: cards } } });
    },

    react: (emoji) => {
      spawnFloat(emoji, get().selfColor, get().selfName || 'You');
    },
    dismissMoment: () => set({ moment: null }),
    dismissToast: (tid) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== tid) })),
    setTerminal: (t) => set({ terminal: t }),
  };
});

export function selfPlayerId() {
  return selfId();
}
