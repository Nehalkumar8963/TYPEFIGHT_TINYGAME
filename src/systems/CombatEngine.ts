import type { CombatMove, CombatDamage, AttackGrade, FightStats } from '../types';
import { COMBAT_MOVES } from '../config';

export class CombatEngine {
  calculateDamage(move: CombatMove, combo: number, isFever: boolean): CombatDamage {
    const cfg = COMBAT_MOVES[move];
    const comboMult = 1 + Math.min(combo, 20) * 0.1;
    const feverMult = isFever ? 2.0 : 1.0;

    const isCritical = combo >= 8 && Math.random() < 0.3;
    const base = cfg.baseDamage;
    const amount = Math.round(base * comboMult * feverMult * (isCritical ? 1.8 : 1));

    return {
      amount,
      isCritical,
      isSpecial: move === 'special',
      move,
      moveColor: cfg.color,
    };
  }

  calculateEnemyDamage(baseDamage: number, damageMult: number, playerBlocking: boolean): number {
    let dmg = Math.round(baseDamage * damageMult);
    if (playerBlocking) dmg = Math.round(dmg * 0.3);
    return dmg;
  }

  calculateGrade(stats: FightStats): AttackGrade {
    const moveScore = Object.values(stats.movesUsed).reduce((s, v) => s + v, 0);
    const diversity = Object.values(stats.movesUsed).filter(v => v > 0).length;
    const score =
      (stats.wpm * 0.15) +
      (stats.accuracy * 0.2) +
      (stats.maxCombo * 0.25) +
      (stats.damageDealt * 0.003) +
      (diversity * 5) +
      (stats.feverActivations * 8);
    if (score >= 80) return 'S';
    if (score >= 60) return 'A';
    if (score >= 40) return 'B';
    if (score >= 20) return 'C';
    return 'D';
  }
}
