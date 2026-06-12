import type { Card } from '../../lib/types';
import { makeDeck, shuffle } from '../../lib/mockData';

const SUIT_ORDER = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 } as const;

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (a.joker && !b.joker) return 1;
    if (b.joker && !a.joker) return -1;
    if (a.suit !== b.suit) return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    return a.rank - b.rank;
  });
}

// High-card points used for the loser score (J/Q/K/A = 10, else face).
export function cardValue(card: Card): number {
  if (card.joker) return 0;
  if (card.rank === 1 || card.rank >= 11) return 10;
  return card.rank;
}

export interface RummyDeal {
  hands: Record<string, Card[]>;
  drawPile: Card[];
  discard: Card[];
  wildJoker: Card;
}

export function dealRummy(playerIds: string[]): RummyDeal {
  const deck = shuffle(makeDeck());
  const hands: Record<string, Card[]> = {};
  for (const id of playerIds) hands[id] = [];
  // 13 each
  for (let i = 0; i < 13; i++) {
    for (const id of playerIds) {
      hands[id].push(deck.pop()!);
    }
  }
  for (const id of playerIds) hands[id] = sortHand(hands[id]);
  const wildJoker = deck.pop()!;
  const discard = [deck.pop()!];
  return { hands, drawPile: deck, discard, wildJoker };
}

// Rough estimate of a hand's "deadwood" for bot decisions / scoring.
export function estimateDeadwood(hand: Card[]): number {
  // crude: cards not part of an obvious same-suit run or same-rank set
  const used = new Set<string>();
  const bySuit: Record<string, Card[]> = {};
  for (const c of hand) {
    if (c.joker) {
      used.add(c.id);
      continue;
    }
    (bySuit[c.suit] ??= []).push(c);
  }
  // runs of 3+
  for (const suit of Object.keys(bySuit)) {
    const cards = bySuit[suit].sort((a, b) => a.rank - b.rank);
    let run: Card[] = [];
    const flush = () => {
      if (run.length >= 3) run.forEach((c) => used.add(c.id));
      run = [];
    };
    for (let i = 0; i < cards.length; i++) {
      if (run.length === 0 || cards[i].rank === run[run.length - 1].rank + 1) {
        run.push(cards[i]);
      } else if (cards[i].rank === run[run.length - 1].rank) {
        continue;
      } else {
        flush();
        run = [cards[i]];
      }
    }
    flush();
  }
  // sets of 3+ same rank
  const byRank: Record<number, Card[]> = {};
  for (const c of hand) {
    if (c.joker || used.has(c.id)) continue;
    (byRank[c.rank] ??= []).push(c);
  }
  for (const rank of Object.keys(byRank)) {
    const cards = byRank[Number(rank)];
    if (cards.length >= 3) cards.forEach((c) => used.add(c.id));
  }
  return hand.filter((c) => !used.has(c.id)).reduce((s, c) => s + cardValue(c), 0);
}

// Pick the bot's worst card to discard (highest value, not in a group).
export function botDiscardChoice(hand: Card[]): Card {
  const sorted = [...hand].sort((a, b) => cardValue(b) - cardValue(a));
  return sorted.find((c) => !c.joker) ?? sorted[0];
}
