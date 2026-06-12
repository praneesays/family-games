import type { Card, Suit, TambolaPrizeId } from './types';

// Avatar hues (8-color set, badge-contrast safe) — index by colorIndex.
export const AVATAR_COLORS = [
  '#C2410C', // marigold
  '#0F766E', // peacock
  '#7C3AED', // violet
  '#B91C1C', // red
  '#1D4ED8', // blue
  '#15803D', // green
  '#A16207', // amber-brown
  '#BE185D', // pink
];

export function colorFor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// Family/friend names used to seed believable "rooms".
export const BOT_NAMES = [
  'Priya',
  'Asha',
  'Ravi',
  'Maya',
  'Kiran',
  'Suresh',
  'Anita',
  'Vikram',
  'Deepa',
  'Arjun',
];

// Default room-name placeholders (festival-aware-ish for the demo).
export const ROOM_NAME_SUGGESTIONS = [
  'Sharma Family Diwali 🪔',
  'Sunday Game Night',
  'Cousins Tambola Bash',
  'After-Dinner Rummy',
];

// Traditional Tambola call phrases (charm + audio-free narration).
export const TAMBOLA_PHRASES: Record<number, string> = {
  1: 'Kelly’s eye… 1!',
  2: 'One little duck… 2!',
  7: 'Lucky… 7!',
  8: 'Garden gate… 8!',
  9: 'Doctor’s orders… 9!',
  11: 'Legs eleven… 11!',
  13: 'Unlucky for some… 13!',
  21: 'Key of the door… 21!',
  22: 'Two little ducks… 22!',
  33: 'All the threes… 33!',
  44: 'All the fours… 44!',
  55: 'All the fives… 55!',
  66: 'Clickety click… 66!',
  77: 'Sunset strip… 77!',
  80: 'Gandhiji’s number… 80!',
  88: 'Two fat ladies… 88!',
  90: 'Top of the shop… 90!',
};
export function phraseFor(n: number): string {
  return TAMBOLA_PHRASES[n] ?? `Number… ${n}!`;
}

export const PRIZE_LABELS: Record<TambolaPrizeId, string> = {
  early5: 'Early Five',
  topLine: 'Top Line',
  middleLine: 'Middle Line',
  bottomLine: 'Bottom Line',
  fullHouse: 'Full House',
};

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
export const RANK_LABEL: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
};
export function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < 2; d++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ id: `${suit}-${rank}-${d}`, rank, suit });
      }
    }
  }
  // 2 printed jokers
  deck.push({ id: 'joker-0', rank: 0, suit: 'spades', joker: true });
  deck.push({ id: 'joker-1', rank: 0, suit: 'hearts', joker: true });
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Short, speakable, ambiguity-free room code (no 0/O, 1/I/L).
const CODE_WORDS = ['MANGO', 'LOTUS', 'TIGER', 'PEACOCK', 'JASMINE', 'COBRA', 'KITE', 'LADDU'];
const CODE_DIGITS = '23456789';
export function makeRoomCode(): string {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const d1 = CODE_DIGITS[Math.floor(Math.random() * CODE_DIGITS.length)];
  const d2 = CODE_DIGITS[Math.floor(Math.random() * CODE_DIGITS.length)];
  return `${word}${d1}${d2}`;
}
