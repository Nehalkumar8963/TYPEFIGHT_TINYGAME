import { COMBAT_MOVES, MOVE_ORDER, shuffleLetterPools } from './config';
import type { CombatMove } from './types';

// Current per-round letter -> move assignment (shuffled each round)
let currentPools: Record<CombatMove, string[]> = shuffleLetterPools();

// Recompute the pools for a fresh round
export function resetLetterPools(): void {
  currentPools = shuffleLetterPools();
}

export function getMoveForKey(key: string): CombatMove | null {
  const k = key.toLowerCase();
  for (const move of MOVE_ORDER) {
    if (currentPools[move]?.includes(k)) return move;
  }
  return null;
}

// Build a weighted letter list from the current pools, favoring weaker (common) moves
export function getRandomLetter(): { key: string; move: CombatMove } {
  const entries: { key: string; move: CombatMove; weight: number }[] = [];
  const weights: Record<CombatMove, number> = {
    jab: 28, cross: 22, kick: 18, uppercut: 12, special: 8, haymaker: 10, finisher: 6,
    sweep: 20, roundhouse: 10, spinkick: 14,
  };
  for (const move of MOVE_ORDER) {
    const pool = currentPools[move] || [];
    for (const key of pool) {
      entries.push({ key, move, weight: weights[move] });
    }
  }

  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return { key: entry.key, move: entry.move };
  }
  const fallback = entries[0];
  return fallback ? { key: fallback.key, move: fallback.move } : { key: 'a', move: 'jab' };
}

export function getAllLetters(): string[] {
  return 'abcdefghijklmnopqrstuvwxyz'.split('');
}
