// Domain types for the mock (frontend-only) platform.

export type GameId = 'tambola' | 'rummy';

export type ConnState = 'online' | 'reconnecting' | 'left';

export interface Player {
  id: string;
  name: string;
  colorIndex: number; // 0..7 -> avatar hue
  isHost: boolean;
  isSelf: boolean;
  isBot: boolean;
  conn: ConnState;
}

export type RoomStatus = 'lobby' | 'in-game' | 'results';

export interface TambolaOptions {
  autoMark: boolean;
  speed: 'relaxed' | 'normal' | 'fast';
  prizes: TambolaPrizeId[];
}
export interface RummyOptions {
  pointsLimit: number;
}
export type GameOptions = TambolaOptions | RummyOptions;

export interface Room {
  code: string;
  name: string;
  gameId: GameId;
  status: RoomStatus;
  options: GameOptions;
  locked: boolean;
}

// ---- Tambola ----
export type TambolaPrizeId =
  | 'early5'
  | 'topLine'
  | 'middleLine'
  | 'bottomLine'
  | 'fullHouse';

export interface TambolaPrize {
  id: TambolaPrizeId;
  label: string;
  wonBy?: string; // player name
}

export type Ticket = (number | null)[][]; // 3 rows x 9 cols

export interface TambolaState {
  kind: 'tambola';
  tickets: Record<string, Ticket>; // playerId -> ticket
  marked: Record<string, Set<number>>; // playerId -> marked numbers
  called: number[]; // in order
  current: number | null;
  prizes: TambolaPrize[];
  finished: boolean;
}

// ---- Rummy ----
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export interface Card {
  id: string;
  rank: number; // 1..13 (1=A, 11=J, 12=Q, 13=K)
  suit: Suit;
  joker?: boolean;
}

export interface RummyState {
  kind: 'rummy';
  hands: Record<string, Card[]>; // playerId -> hand (only self is real/visible)
  handCounts: Record<string, number>;
  drawPileCount: number;
  discard: Card[]; // top is last
  wildJoker: Card;
  turnOrder: string[];
  turnIndex: number;
  turnEndsAt: number; // epoch ms
  hasDrawn: boolean; // self has drawn this turn
  finished: boolean;
  declarer?: string;
  scores?: Record<string, number>;
}

export type GameState = TambolaState | RummyState;

// ---- UI ephemera ----
export interface Toast {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning';
}
export interface MomentData {
  id: string;
  title: string;
  subtitle?: string;
  colorIndex?: number;
  avatarName?: string;
}
export interface FloatReaction {
  id: string;
  emoji: string;
  colorIndex: number;
  fromName: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  emphasis?: boolean;
}
