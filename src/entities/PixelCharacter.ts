import Phaser from 'phaser';
import type { PixelSpriteDef, CombatMove } from '../types';

interface PixelPose {
  headX: number; headY: number;
  bodyX: number; bodyY: number;
  bodyW: number; bodyH: number;
  lArmX: number; lArmY: number; lArmW: number; lArmH: number;
  rArmX: number; rArmY: number; rArmW: number; rArmH: number;
  lLegX: number; lLegY: number; lLegW: number; lLegH: number;
  rLegX: number; rLegY: number; rLegW: number; rLegH: number;
  lHandX: number; lHandY: number;
  rHandX: number; rHandY: number;
  lFootX: number; lFootY: number;
  rFootX: number; rFootY: number;
  bodyLean: number;
}

interface PixelAnimFrame {
  pose: PixelPose;
  duration: number;
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function lerpPose(a: PixelPose, b: PixelPose, t: number): PixelPose {
  const r: Record<string, number> = {};
  for (const k of Object.keys(a) as (keyof PixelPose)[]) {
    r[k] = lerp(a[k] as number, b[k] as number, t);
  }
  return r as unknown as PixelPose;
}

const POSES: Record<string, PixelPose> = {
  idle: {
    headX: 0, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 0,
  },
  idle2: {
    headX: 0, headY: -70, bodyX: 0, bodyY: -48, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -50, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -26, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -26, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -38, rHandX: 11, rHandY: -38,
    lFootX: -8, lFootY: -8, rFootX: 2, rFootY: -8,
    bodyLean: 0,
  },

  jab: {
    headX: 4, headY: -72, bodyX: 2, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 14, rArmY: -56, rArmW: 5, rArmH: 8,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 36, rHandY: -56,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 4,
  },
  jabRecover: {
    headX: 1, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 10, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 12, rHandY: -38,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 1,
  },

  cross: {
    headX: 8, headY: -70, bodyX: 4, bodyY: -48, bodyW: 20, bodyH: 22,
    lArmX: -12, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 18, rArmY: -58, rArmW: 5, rArmH: 10,
    lLegX: -8, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 2, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -14, lHandY: -40, rHandX: 48, rHandY: -58,
    lFootX: -10, lFootY: -10, rFootX: 4, rFootY: -10,
    bodyLean: 8,
  },
  crossRecover: {
    headX: 3, headY: -72, bodyX: 1, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 10, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 12, rHandY: -38,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 2,
  },

  kick: {
    headX: -4, headY: -72, bodyX: -2, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -16, lArmY: -50, lArmW: 5, lArmH: 14,
    rArmX: 11, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 8, rLegY: -30, rLegW: 6, rLegH: 12,
    lHandX: -18, lHandY: -38, rHandX: 13, rHandY: -38,
    lFootX: -8, lFootY: -10, rFootX: 40, rFootY: -28,
    bodyLean: -6,
  },
  kickRecover: {
    headX: -1, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -26, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -8,
    bodyLean: -2,
  },

  uppercut: {
    headX: 2, headY: -80, bodyX: 1, bodyY: -56, bodyW: 18, bodyH: 24,
    lArmX: -12, lArmY: -56, lArmW: 5, lArmH: 14,
    rArmX: 10, rArmY: -68, rArmW: 5, rArmH: 10,
    lLegX: -8, lLegY: -32, lLegW: 6, lLegH: 20,
    rLegX: 2, rLegY: -32, rLegW: 6, rLegH: 20,
    lHandX: -14, lHandY: -44, rHandX: 12, rHandY: -78,
    lFootX: -10, lFootY: -12, rFootX: 4, rFootY: -12,
    bodyLean: 2,
  },
  uppercutRecover: {
    headX: 1, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -38,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 0,
  },

  special: {
    headX: 0, headY: -82, bodyX: 0, bodyY: -58, bodyW: 22, bodyH: 26,
    lArmX: -20, lArmY: -64, lArmW: 6, lArmH: 16,
    rArmX: 14, rArmY: -64, rArmW: 6, rArmH: 16,
    lLegX: -10, lLegY: -32, lLegW: 7, lLegH: 20,
    rLegX: 3, rLegY: -32, rLegW: 7, rLegH: 20,
    lHandX: -24, lHandY: -50, rHandX: 18, rHandY: -50,
    lFootX: -12, lFootY: -12, rFootX: 5, rFootY: -12,
    bodyLean: 0,
  },
  specialRecover: {
    headX: 0, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 0,
  },

  haymaker: {
    headX: 12, headY: -76, bodyX: 6, bodyY: -52, bodyW: 22, bodyH: 24,
    lArmX: -8, lArmY: -54, lArmW: 5, lArmH: 14,
    rArmX: 22, rArmY: -70, rArmW: 7, rArmH: 14,
    lLegX: -10, lLegY: -30, lLegW: 7, lLegH: 20,
    rLegX: 4, rLegY: -30, rLegW: 7, rLegH: 20,
    lHandX: -10, lHandY: -42, rHandX: 60, rHandY: -68,
    lFootX: -12, lFootY: -10, rFootX: 6, rFootY: -10,
    bodyLean: 10,
  },
  haymakerRecover: {
    headX: 3, headY: -72, bodyX: 1, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 12, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 14, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 3,
  },

  finisher: {
    headX: 0, headY: -90, bodyX: 0, bodyY: -64, bodyW: 24, bodyH: 28,
    lArmX: -24, lArmY: -70, lArmW: 7, lArmH: 18,
    rArmX: 18, rArmY: -86, rArmW: 7, rArmH: 10,
    lLegX: -12, lLegY: -36, lLegW: 8, lLegH: 24,
    rLegX: 4, rLegY: -36, rLegW: 8, rLegH: 24,
    lHandX: -28, lHandY: -54, rHandX: 20, rHandY: -94,
    lFootX: -14, lFootY: -12, rFootX: 6, rFootY: -12,
    bodyLean: 0,
  },
  finisherRecover: {
    headX: 1, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -38,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 0,
  },

  // SWEEP - low spin kick
  sweep: {
    headX: -6, headY: -56, bodyX: -3, bodyY: -38, bodyW: 18, bodyH: 20,
    lArmX: -18, lArmY: -42, lArmW: 5, lArmH: 14,
    rArmX: 12, rArmY: -42, rArmW: 5, rArmH: 14,
    lLegX: -14, lLegY: -16, lLegW: 6, lLegH: 10,
    rLegX: 10, rLegY: -16, rLegW: 6, rLegH: 10,
    lHandX: -20, lHandY: -30, rHandX: 14, rHandY: -30,
    lFootX: -28, lFootY: -8, rFootX: 30, rFootY: -8,
    bodyLean: -4,
  },
  sweepRecover: {
    headX: -1, headY: -72, bodyX: 0, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: -2,
  },

  // ROUNDHOUSE - high arc kick
  roundhouse: {
    headX: -6, headY: -76, bodyX: -3, bodyY: -54, bodyW: 20, bodyH: 22,
    lArmX: -18, lArmY: -56, lArmW: 5, lArmH: 14,
    rArmX: 14, rArmY: -56, rArmW: 5, rArmH: 14,
    lLegX: -8, lLegY: -32, lLegW: 6, lLegH: 20,
    rLegX: 12, rLegY: -42, rLegW: 6, rLegH: 8,
    lHandX: -20, lHandY: -44, rHandX: 16, rHandY: -44,
    lFootX: -10, lFootY: -12, rFootX: 48, rFootY: -52,
    bodyLean: -8,
  },
  roundhouseRecover: {
    headX: -2, headY: -72, bodyX: -1, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: -3,
  },

  // SPIN KICK - 360 spin
  spinkick: {
    headX: 8, headY: -72, bodyX: 4, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: 16, lArmY: -50, lArmW: 5, lArmH: 14,
    rArmX: -12, rArmY: -54, rArmW: 5, rArmH: 14,
    lLegX: 10, lLegY: -30, lLegW: 6, lLegH: 14,
    rLegX: -8, rLegY: -32, rLegW: 6, rLegH: 12,
    lHandX: 18, lHandY: -38, rHandX: -14, rHandY: -42,
    lFootX: 30, lFootY: -26, rFootX: -18, rFootY: -28,
    bodyLean: 8,
  },
  spinkickRecover: {
    headX: 2, headY: -72, bodyX: 1, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -14, lArmY: -52, lArmW: 5, lArmH: 14,
    rArmX: 9, rArmY: -52, rArmW: 5, rArmH: 14,
    lLegX: -6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: 0, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -16, lHandY: -40, rHandX: 11, rHandY: -40,
    lFootX: -8, lFootY: -10, rFootX: 2, rFootY: -10,
    bodyLean: 3,
  },

  hurt: {
    headX: -8, headY: -68, bodyX: -4, bodyY: -48, bodyW: 18, bodyH: 22,
    lArmX: -10, lArmY: -48, lArmW: 5, lArmH: 12,
    rArmX: 6, rArmY: -48, rArmW: 5, rArmH: 12,
    lLegX: -8, lLegY: -26, lLegW: 6, lLegH: 16,
    rLegX: 2, rLegY: -26, rLegW: 6, rLegH: 16,
    lHandX: -12, lHandY: -38, rHandX: 8, rHandY: -38,
    lFootX: -10, lFootY: -10, rFootX: 4, rFootY: -10,
    bodyLean: -8,
  },

  victory: {
    headX: 0, headY: -80, bodyX: 0, bodyY: -56, bodyW: 18, bodyH: 24,
    lArmX: -16, lArmY: -60, lArmW: 5, lArmH: 14,
    rArmX: 11, rArmY: -72, rArmW: 5, rArmH: 10,
    lLegX: -6, lLegY: -32, lLegW: 6, lLegH: 20,
    rLegX: 0, rLegY: -32, rLegW: 6, rLegH: 20,
    lHandX: -18, lHandY: -48, rHandX: 13, rHandY: -82,
    lFootX: -8, lFootY: -12, rFootX: 2, rFootY: -12,
    bodyLean: 0,
  },

  defeat: {
    headX: -10, headY: -30, bodyX: -4, bodyY: -24, bodyW: 18, bodyH: 16,
    lArmX: -12, lArmY: -26, lArmW: 5, lArmH: 10,
    rArmX: 6, rArmY: -22, rArmW: 5, rArmH: 10,
    lLegX: -12, lLegY: -12, lLegW: 6, lLegH: 12,
    rLegX: 6, rLegY: -12, rLegW: 6, rLegH: 12,
    lHandX: -14, lHandY: -18, rHandX: 8, rHandY: -14,
    lFootX: -14, lFootY: -2, rFootX: 8, rFootY: -2,
    bodyLean: -4,
  },

  walk1: {
    headX: 2, headY: -72, bodyX: 1, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -12, lArmY: -50, lArmW: 5, lArmH: 14,
    rArmX: 10, rArmY: -54, rArmW: 5, rArmH: 14,
    lLegX: -10, lLegY: -28, lLegW: 6, lLegH: 16,
    rLegX: 6, rLegY: -28, rLegW: 6, rLegH: 18,
    lHandX: -14, lHandY: -38, rHandX: 12, rHandY: -42,
    lFootX: -14, lFootY: -12, rFootX: 8, rFootY: -10,
    bodyLean: 3,
  },
  walk2: {
    headX: 2, headY: -72, bodyX: 1, bodyY: -50, bodyW: 18, bodyH: 22,
    lArmX: -12, lArmY: -54, lArmW: 5, lArmH: 14,
    rArmX: 10, rArmY: -50, rArmW: 5, rArmH: 14,
    lLegX: 6, lLegY: -28, lLegW: 6, lLegH: 18,
    rLegX: -10, rLegY: -28, rLegW: 6, rLegH: 16,
    lHandX: -14, lHandY: -42, rHandX: 12, rHandY: -38,
    lFootX: 8, lFootY: -10, rFootX: -14, rFootY: -12,
    bodyLean: 3,
  },
};

function getAttackPose(move: CombatMove): string[] {
  switch (move) {
    case 'jab': return ['jab', 'jabRecover'];
    case 'cross': return ['cross', 'crossRecover'];
    case 'kick': return ['kick', 'kickRecover'];
    case 'uppercut': return ['uppercut', 'uppercutRecover'];
    case 'special': return ['special', 'specialRecover'];
    case 'haymaker': return ['haymaker', 'haymakerRecover'];
    case 'finisher': return ['finisher', 'finisherRecover'];
    case 'sweep': return ['sweep', 'sweepRecover'];
    case 'roundhouse': return ['roundhouse', 'roundhouseRecover'];
    case 'spinkick': return ['spinkick', 'spinkickRecover'];
    default: return ['jab', 'jabRecover'];
  }
}

const MOVE_ANIM_FRAMES: Record<string, PixelAnimFrame[]> = {
  jab: [
    { pose: POSES.jab, duration: 60 },
    { pose: POSES.jabRecover, duration: 120 },
    { pose: POSES.idle, duration: 80 },
  ],
  cross: [
    { pose: POSES.cross, duration: 80 },
    { pose: POSES.crossRecover, duration: 140 },
    { pose: POSES.idle, duration: 80 },
  ],
  kick: [
    { pose: POSES.kick, duration: 80 },
    { pose: POSES.kickRecover, duration: 160 },
    { pose: POSES.idle, duration: 80 },
  ],
  uppercut: [
    { pose: POSES.uppercut, duration: 100 },
    { pose: POSES.uppercutRecover, duration: 180 },
    { pose: POSES.idle, duration: 80 },
  ],
  special: [
    { pose: POSES.special, duration: 140 },
    { pose: POSES.specialRecover, duration: 220 },
    { pose: POSES.idle, duration: 100 },
  ],
  haymaker: [
    { pose: POSES.haymaker, duration: 110 },
    { pose: POSES.haymakerRecover, duration: 190 },
    { pose: POSES.idle, duration: 90 },
  ],
  finisher: [
    { pose: POSES.finisher, duration: 160 },
    { pose: POSES.finisherRecover, duration: 240 },
    { pose: POSES.idle, duration: 120 },
  ],
  sweep: [
    { pose: POSES.sweep, duration: 70 },
    { pose: POSES.sweepRecover, duration: 130 },
    { pose: POSES.idle, duration: 80 },
  ],
  roundhouse: [
    { pose: POSES.roundhouse, duration: 90 },
    { pose: POSES.roundhouseRecover, duration: 170 },
    { pose: POSES.idle, duration: 80 },
  ],
  spinkick: [
    { pose: POSES.spinkick, duration: 85 },
    { pose: POSES.spinkickRecover, duration: 155 },
    { pose: POSES.idle, duration: 80 },
  ],
  hurt: [
    { pose: POSES.hurt, duration: 180 },
    { pose: POSES.idle, duration: 120 },
  ],
  victory: [
    { pose: POSES.victory, duration: 600 },
    { pose: POSES.idle, duration: 300 },
  ],
  defeat: [
    { pose: POSES.defeat, duration: 1000 },
  ],
  walk: [
    { pose: POSES.walk1, duration: 160 },
    { pose: POSES.idle, duration: 80 },
    { pose: POSES.walk2, duration: 160 },
    { pose: POSES.idle, duration: 80 },
  ],
};

export class PixelCharacter {
  scene: Phaser.Scene;
  x: number;
  y: number;
  sprite: PixelSpriteDef;
  facingRight: boolean;
  graphics: Phaser.GameObjects.Graphics;
  private currentPose: PixelPose;
  private fromPose: PixelPose;
  private animQueue: PixelAnimFrame[] = [];
  private frameTime = 0;
  private isPlayingAnim = false;
  private onAnimComplete: (() => void) | null = null;
  private idleTime = 0;
  private hpPercent = 1;
  private flashTimer = 0;
  private isFlashing = false;
  private auraColor: number | null = null;
  private auraPulse = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, sprite: PixelSpriteDef, facingRight: boolean) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.facingRight = facingRight;
    this.currentPose = { ...POSES.idle };
    this.fromPose = { ...POSES.idle };
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5);
  }

  play(animName: string, onComplete?: () => void) {
    const seq = MOVE_ANIM_FRAMES[animName];
    if (!seq) return;
    this.animQueue = seq.map(f => ({ ...f, pose: { ...f.pose } }));
    this.fromPose = { ...this.currentPose };
    this.frameTime = 0;
    this.isPlayingAnim = true;
    this.onAnimComplete = onComplete ?? null;
  }

  get isAnimating(): boolean { return this.isPlayingAnim; }

  setHp(pct: number) { this.hpPercent = Math.max(0, Math.min(1, pct)); }

  setAura(color: number | null) { this.auraColor = color; }

  flash() {
    this.isFlashing = true;
    this.flashTimer = 150;
  }

  update(delta: number) {
    if (this.isPlayingAnim) {
      this.updateAnim(delta);
    } else {
      this.updateIdle(delta);
    }

    if (this.isFlashing) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) this.isFlashing = false;
    }

    this.draw();
  }

  private updateIdle(delta: number) {
    this.idleTime += delta * 0.003;
    const t = (Math.sin(this.idleTime) + 1) / 2;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    this.currentPose = lerpPose(POSES.idle, POSES.idle2, ease);
  }

  private updateAnim(delta: number) {
    if (this.animQueue.length === 0) {
      this.isPlayingAnim = false;
      return;
    }

    this.frameTime += delta;
    const frame = this.animQueue[0];

    if (this.frameTime >= frame.duration) {
      this.frameTime -= frame.duration;
      this.fromPose = { ...frame.pose };
      this.animQueue.shift();

      if (this.animQueue.length === 0) {
        this.currentPose = { ...this.fromPose };
        this.isPlayingAnim = false;
        if (this.onAnimComplete) {
          const cb = this.onAnimComplete;
          this.onAnimComplete = null;
          cb();
        }
        return;
      }
    }

    const t = Math.min(this.frameTime / this.animQueue[0].duration, 1);
    const ease = t * (2 - t);
    this.currentPose = lerpPose(this.fromPose, this.animQueue[0].pose, ease);
  }

  private mx(x: number): number {
    return this.facingRight ? x : -x;
  }

  private brighten(color: number, amount: number): number {
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = color & 0xff;
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return (r << 16) | (g << 8) | b;
  }

  private darken(color: number, amount: number): number {
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = color & 0xff;
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return (r << 16) | (g << 8) | b;
  }

  private draw() {
    const g = this.graphics;
    g.clear();

    const px = this.x;
    const py = this.y;
    const p = this.currentPose;
    const m = (x: number) => this.mx(x);

    const flashOn = this.isFlashing && Math.floor(this.flashTimer / 30) % 2 === 0;
    const alpha = this.hpPercent < 0.25 ? 0.5 + Math.sin(Date.now() * 0.01) * 0.5 : 1;
    const bodyAlpha = flashOn ? 0.4 : alpha;

    const col = this.sprite.bodyColor;
    const accent = this.sprite.accentColor;
    const bright = this.brighten(col, 60);
    const dark = this.darken(col, 40);
    const accentBright = this.brighten(accent, 40);

    // ---- DROP SHADOW ----
    const shadowW = Math.max(this.sprite.bodyWidth, this.sprite.headWidth) + 14;
    g.fillStyle(0x000000, 0.38);
    g.fillEllipse(px, py + 3, shadowW, 9);
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(px, py + 3, shadowW + 8, 11);

    // ---- AURA GLOW ----
    if (this.auraColor) {
      this.auraPulse += 0.08;
      const pulse = (Math.sin(this.auraPulse) + 1) / 2;
      const glowH = Math.max(this.sprite.bodyHeight + this.sprite.headHeight, 70) + 10;
      const glowW = this.sprite.bodyWidth + 34;
      g.fillStyle(this.auraColor, 0.05 + pulse * 0.05);
      g.fillRect(px - glowW / 2, py - glowH - 6, glowW, glowH);
      g.fillStyle(this.auraColor, 0.04 + pulse * 0.04);
      g.fillRect(px - glowW / 2 - 6, py - glowH - 10, glowW + 12, glowH + 8);
    }

    // ---- CAPE ----
    if (this.sprite.hasCape && this.sprite.capeColor) {
      const capeX = px + m(p.bodyX + p.bodyLean - 4);
      const capeY = py + p.bodyY + 2;
      const capeW = p.bodyW + 6;
      const capeH = p.bodyH + 16;
      const capeWave = Math.sin(Date.now() * 0.004) * 3;

      g.fillStyle(this.sprite.capeColor, bodyAlpha * 0.7);
      g.fillRect(capeX - capeW / 2 - 2, capeY, capeW + 4, capeH);
      g.fillStyle(this.darken(this.sprite.capeColor, 30), bodyAlpha * 0.5);
      g.fillRect(capeX - capeW / 2, capeY + capeH - 6, capeW, 6);

      // Cape edge highlight
      g.fillStyle(this.brighten(this.sprite.capeColor, 30), bodyAlpha * 0.3);
      g.fillRect(capeX - capeW / 2 - 2, capeY, 2, capeH + capeWave);
    }

    // ---- BODY (with shading) ----
    const bodyX = px + m(p.bodyX + p.bodyLean);
    const bodyY = py + p.bodyY;

    // Body shadow side
    g.fillStyle(dark, bodyAlpha * 0.9);
    g.fillRect(bodyX - p.bodyW / 2, bodyY, p.bodyW / 2, p.bodyH);

    // Body main
    g.fillStyle(col, bodyAlpha);
    g.fillRect(bodyX - p.bodyW / 2 + p.bodyW / 2, bodyY, p.bodyW / 2, p.bodyH);

    // Body highlight strip
    g.fillStyle(bright, bodyAlpha * 0.4);
    g.fillRect(bodyX - p.bodyW / 2 + 2, bodyY + 2, 3, p.bodyH - 4);

    // Body outline
    g.fillStyle(dark, bodyAlpha * 0.5);
    g.fillRect(bodyX - p.bodyW / 2, bodyY, p.bodyW, 1);
    g.fillRect(bodyX - p.bodyW / 2, bodyY + p.bodyH - 1, p.bodyW, 1);
    g.fillRect(bodyX - p.bodyW / 2, bodyY, 1, p.bodyH);
    g.fillRect(bodyX + p.bodyW / 2 - 1, bodyY, 1, p.bodyH);

    // Accent stripes (belt + chest)
    g.fillStyle(accent, bodyAlpha * 0.7);
    g.fillRect(bodyX - p.bodyW / 2 + 2, bodyY + 2, p.bodyW - 4, 4);
    g.fillRect(bodyX - p.bodyW / 2 + 2, bodyY + p.bodyH - 6, p.bodyW - 4, 4);

    // Belt buckle
    g.fillStyle(accentBright, bodyAlpha * 0.6);
    g.fillRect(bodyX - 2, bodyY + 2, 4, 4);

    // ---- SHOULDER PADS ----
    if (this.sprite.hasShoulderPads) {
      const padW = 8;
      const padH = 5;

      // Left shoulder pad
      g.fillStyle(accent, bodyAlpha * 0.8);
      g.fillRect(bodyX - p.bodyW / 2 - padW / 2, bodyY - 2, padW, padH);
      g.fillStyle(accentBright, bodyAlpha * 0.5);
      g.fillRect(bodyX - p.bodyW / 2 - padW / 2, bodyY - 2, padW, 2);

      // Right shoulder pad
      g.fillStyle(accent, bodyAlpha * 0.8);
      g.fillRect(bodyX + p.bodyW / 2 - padW / 2, bodyY - 2, padW, padH);
      g.fillStyle(accentBright, bodyAlpha * 0.5);
      g.fillRect(bodyX + p.bodyW / 2 - padW / 2, bodyY - 2, padW, 2);
    }

    // ---- HEAD ----
    const headX = px + m(p.headX + p.bodyLean);
    const headY = py + p.headY;
    const hw = this.sprite.headWidth;
    const hh = this.sprite.headHeight;

    // Head shadow
    g.fillStyle(dark, bodyAlpha * 0.9);
    g.fillRect(headX - hw / 2, headY - hh / 2, hw / 2, hh);

    // Head main
    g.fillStyle(col, bodyAlpha);
    g.fillRect(headX, headY - hh / 2, hw / 2, hh);

    // Head highlight
    g.fillStyle(bright, bodyAlpha * 0.35);
    g.fillRect(headX - hw / 2, headY - hh / 2, 3, hh - 2);

    // Head outline
    g.fillStyle(dark, bodyAlpha * 0.4);
    g.fillRect(headX - hw / 2, headY - hh / 2, hw, 1);
    g.fillRect(headX - hw / 2, headY + hh / 2 - 1, hw, 1);

    // ---- HELMET ----
    if (this.sprite.hasHelmet) {
      g.fillStyle(accent, bodyAlpha * 0.8);
      g.fillRect(headX - hw / 2 - 1, headY - hh / 2 - 2, hw + 2, 4);
      g.fillRect(headX - hw / 2 + 1, headY + hh / 2 - 2, hw - 2, 3);

      // Helmet crest
      g.fillStyle(accentBright, bodyAlpha * 0.5);
      g.fillRect(headX - 1, headY - hh / 2 - 4, 2, 3);

      // Helmet shine
      g.fillStyle(0xffffff, bodyAlpha * 0.15);
      g.fillRect(headX - hw / 2 + 2, headY - hh / 2, hw - 4, 2);
    }

    // ---- EYES ----
    const eyeX = this.facingRight ? 2 : -2;

    if (this.sprite.hasEyeGlow && this.sprite.eyeGlowColor) {
      // Glowing eyes
      g.fillStyle(this.sprite.eyeGlowColor, bodyAlpha * 0.4);
      g.fillRect(headX + eyeX - 4, headY - 4, 10, 6);
      g.fillStyle(this.sprite.eyeGlowColor, bodyAlpha * 0.9);
      g.fillRect(headX + eyeX - 2, headY - 2, 3, 3);
      g.fillRect(headX + eyeX + 3, headY - 2, 3, 3);
      g.fillStyle(0xffffff, bodyAlpha);
      g.fillRect(headX + eyeX - 1, headY - 1, 1, 1);
      g.fillRect(headX + eyeX + 4, headY - 1, 1, 1);
    } else {
      // Normal eyes
      g.fillStyle(0xffffff, bodyAlpha);
      g.fillRect(headX + eyeX - 2, headY - 2, 3, 3);
      g.fillRect(headX + eyeX + 3, headY - 2, 3, 3);
      g.fillStyle(0x000000, bodyAlpha);
      g.fillRect(headX + eyeX - 1, headY - 1, 2, 2);
      g.fillRect(headX + eyeX + 4, headY - 1, 2, 2);
    }

    // ---- LEFT ARM ----
    const lArmX = px + m(p.lArmX + p.bodyLean);
    const lArmY = py + p.lArmY;
    g.fillStyle(col, bodyAlpha * 0.9);
    g.fillRect(lArmX - p.lArmW / 2, lArmY, p.lArmW, p.lArmH);
    g.fillStyle(dark, bodyAlpha * 0.4);
    g.fillRect(lArmX - p.lArmW / 2, lArmY, 1, p.lArmH);
    g.fillStyle(this.sprite.accentColor, bodyAlpha * 0.5);
    g.fillRect(lArmX - p.lArmW / 2, lArmY, p.lArmW, 3);

    // ---- RIGHT ARM ----
    const rArmX = px + m(p.rArmX + p.bodyLean);
    const rArmY = py + p.rArmY;
    g.fillStyle(col, bodyAlpha * 0.9);
    g.fillRect(rArmX - p.rArmW / 2, rArmY, p.rArmW, p.rArmH);
    g.fillStyle(bright, bodyAlpha * 0.3);
    g.fillRect(rArmX - p.rArmW / 2 + p.rArmW - 1, rArmY, 1, p.rArmH);
    g.fillStyle(this.sprite.accentColor, bodyAlpha * 0.5);
    g.fillRect(rArmX - p.rArmW / 2, rArmY, p.rArmW, 3);

    // ---- LEFT HAND ----
    const lHandX = px + m(p.lHandX + p.bodyLean);
    const lHandY = py + p.lHandY;
    g.fillStyle(accent, bodyAlpha);
    g.fillRect(lHandX - 3, lHandY - 3, 6, 6);
    g.fillStyle(accentBright, bodyAlpha * 0.4);
    g.fillRect(lHandX - 2, lHandY - 2, 2, 2);

    // ---- RIGHT HAND ----
    const rHandX = px + m(p.rHandX + p.bodyLean);
    const rHandY = py + p.rHandY;
    g.fillStyle(accent, bodyAlpha);
    g.fillRect(rHandX - 3, rHandY - 3, 6, 6);
    g.fillStyle(accentBright, bodyAlpha * 0.4);
    g.fillRect(rHandX - 2, rHandY - 2, 2, 2);

    // ---- WEAPONS ----
    if (this.sprite.hasWeapon) {
      const weaponX = rHandX;
      const weaponY = rHandY;

      switch (this.sprite.weaponType) {
        case 'sword': {
          // Blade
          g.fillStyle(0xe0e0e0, bodyAlpha * 0.9);
          g.fillRect(weaponX + m(2), weaponY - 18, 3, 22);
          // Blade highlight
          g.fillStyle(0xffffff, bodyAlpha * 0.5);
          g.fillRect(weaponX + m(2), weaponY - 18, 1, 22);
          // Guard
          g.fillStyle(0xffd700, bodyAlpha * 0.8);
          g.fillRect(weaponX + m(0), weaponY - 2, 7, 3);
          // Handle wrap
          g.fillStyle(0x8b4513, bodyAlpha * 0.7);
          g.fillRect(weaponX + m(2), weaponY + 1, 3, 5);
          break;
        }
        case 'claws': {
          g.fillStyle(0xcccccc, bodyAlpha * 0.8);
          for (let c = 0; c < 3; c++) {
            const cy = weaponY - 6 + c * 4;
            g.fillRect(weaponX + m(4), cy, 10, 2);
            g.fillStyle(0xffffff, bodyAlpha * 0.4);
            g.fillRect(weaponX + m(12), cy, 2, 2);
            g.fillStyle(0xcccccc, bodyAlpha * 0.8);
          }
          break;
        }
        case 'axe': {
          // Handle
          g.fillStyle(0x8b4513, bodyAlpha * 0.8);
          g.fillRect(weaponX + m(1), weaponY - 14, 3, 18);
          // Axe head
          g.fillStyle(0xaaaaaa, bodyAlpha * 0.9);
          g.fillRect(weaponX + m(-2), weaponY - 20, 10, 8);
          g.fillStyle(0xdddddd, bodyAlpha * 0.5);
          g.fillRect(weaponX + m(0), weaponY - 20, 2, 8);
          // Axe edge
          g.fillStyle(0xffffff, bodyAlpha * 0.3);
          g.fillRect(weaponX + m(6), weaponY - 20, 2, 8);
          break;
        }
        case 'whip': {
          const whipTime = Date.now() * 0.008;
          g.fillStyle(0x654321, bodyAlpha * 0.8);
          g.fillRect(weaponX + m(2), weaponY - 4, 3, 6);
          g.lineStyle(2, 0x8b4513, bodyAlpha * 0.7);
          g.beginPath();
          g.moveTo(weaponX + m(3), weaponY - 4);
          for (let s = 0; s < 8; s++) {
            const sx = weaponX + m(3 + s * 4);
            const sy = weaponY - 4 + Math.sin(whipTime + s * 0.8) * 4;
            g.lineTo(sx, sy);
          }
          g.strokePath();
          break;
        }
        case 'flame': {
          const flameTime = Date.now() * 0.006;
          const flameColors = [0xff4500, 0xff6600, 0xffd700, 0xff0000];
          for (let f = 0; f < 6; f++) {
            const fc = flameColors[f % flameColors.length];
            const fx = weaponX + m(Math.sin(flameTime + f) * 4 - 6);
            const fy = weaponY - 8 - f * 4 + Math.cos(flameTime + f * 0.5) * 3;
            const fs = 6 - f;
            g.fillStyle(fc, bodyAlpha * (0.8 - f * 0.1));
            g.fillRect(fx, fy, fs, fs);
          }
          break;
        }
        default:
          break;
      }
    }

    // ---- BODY STYLE HEAVY (extra bulk) ----
    if (this.sprite.bodyStyle === 'heavy') {
      g.fillStyle(dark, bodyAlpha * 0.3);
      g.fillRect(bodyX - p.bodyW / 2 - 2, bodyY + 4, 2, p.bodyH - 8);
      g.fillRect(bodyX + p.bodyW / 2, bodyY + 4, 2, p.bodyH - 8);
    }

    // ---- LEFT LEG ----
    const lLegX = px + m(p.lLegX + p.bodyLean);
    const lLegY = py + p.lLegY;
    g.fillStyle(dark, bodyAlpha * 0.85);
    g.fillRect(lLegX - p.lLegW / 2, lLegY, p.lLegW, p.lLegH);
    g.fillStyle(bright, bodyAlpha * 0.2);
    g.fillRect(lLegX - p.lLegW / 2 + 1, lLegY + 2, 1, p.lLegH - 4);

    // ---- RIGHT LEG ----
    const rLegX = px + m(p.rLegX + p.bodyLean);
    const rLegY = py + p.rLegY;
    g.fillStyle(col, bodyAlpha * 0.85);
    g.fillRect(rLegX - p.rLegW / 2, rLegY, p.rLegW, p.rLegH);
    g.fillStyle(bright, bodyAlpha * 0.25);
    g.fillRect(rLegX - p.rLegW / 2 + 1, rLegY + 2, 1, p.rLegH - 4);

    // ---- LEFT FOOT ----
    const lFootX = px + m(p.lFootX + p.bodyLean);
    const lFootY = py + p.lFootY;
    g.fillStyle(accent, bodyAlpha * 0.7);
    g.fillRect(lFootX - 4, lFootY, 8, 4);
    g.fillStyle(dark, bodyAlpha * 0.4);
    g.fillRect(lFootX - 4, lFootY + 3, 8, 1);

    // ---- RIGHT FOOT ----
    const rFootX = px + m(p.rFootX + p.bodyLean);
    const rFootY = py + p.rFootY;
    g.fillStyle(accent, bodyAlpha * 0.7);
    g.fillRect(rFootX - 4, rFootY, 8, 4);
    g.fillStyle(dark, bodyAlpha * 0.4);
    g.fillRect(rFootX - 4, rFootY + 3, 8, 1);

    // ---- HELMET HORN (boss/samurai/warlord type) ----
    if (this.sprite.hasHelmet && this.sprite.weaponType === 'sword') {
      g.fillStyle(accent, bodyAlpha * 0.6);
      g.fillRect(headX - hw / 2 - 2, headY - hh / 2 - 6, hw + 4, 3);
      g.fillRect(headX - hw / 4, headY - hh / 2 - 10, hw / 2, 5);
    }

    // ---- BODY STYLE ARMORED (extra plates) ----
    if (this.sprite.bodyStyle === 'armored') {
      g.fillStyle(accentBright, bodyAlpha * 0.2);
      g.fillRect(bodyX - p.bodyW / 2 + 3, bodyY + 6, p.bodyW - 6, 2);
      g.fillRect(bodyX - p.bodyW / 2 + 3, bodyY + 12, p.bodyW - 6, 2);
      g.fillRect(bodyX - p.bodyW / 2 + 3, bodyY + 18, p.bodyW - 6, 2);
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
