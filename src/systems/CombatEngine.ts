import type { CombatMove, CombatDamage, AttackGrade, FightStats } from '../types';
import { COMBAT_MOVES } from '../config';

export class CombatEngine {
  calculateDamage(move: CombatMove, combo: number, isFever: boolean): CombatDamage {
    const cfg = COMBAT_MOVES[move];
    const comboMult = 1 + Math.min(combo, 30) * 0.12;
    const feverMult = isFever ? 2.0 : 1.0;

    // Higher crit chance at higher combos
    const critChance = combo >= 10 ? 0.4 : combo >= 5 ? 0.3 : 0.2;
    const isCritical = combo >= 5 && Math.random() < critChance;
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
    const levelBonus = (stats.level - 1) * 3;
    const score =
      (stats.wpm * 0.15) +
      (stats.accuracy * 0.2) +
      (stats.maxCombo * 0.25) +
      (stats.damageDealt * 0.003) +
      (diversity * 4) +
      (stats.feverActivations * 8) +
      levelBonus;
    if (score >= 80) return 'S';
    if (score >= 60) return 'A';
    if (score >= 40) return 'B';
    if (score >= 20) return 'C';
    return 'D';
  }
}
