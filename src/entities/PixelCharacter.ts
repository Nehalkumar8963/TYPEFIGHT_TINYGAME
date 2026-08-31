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

    const bodyX = px + m(p.bodyX + p.bodyLean);
    const bodyY = py + p.bodyY;

    g.fillStyle(col, bodyAlpha);
    g.fillRect(bodyX - p.bodyW / 2, bodyY, p.bodyW, p.bodyH);

    g.fillStyle(accent, bodyAlpha * 0.6);
    g.fillRect(bodyX - p.bodyW / 2 + 2, bodyY + 2, p.bodyW - 4, 4);
    g.fillRect(bodyX - p.bodyW / 2 + 2, bodyY + p.bodyH - 6, p.bodyW - 4, 4);

    const headX = px + m(p.headX + p.bodyLean);
    const headY = py + p.headY;
    const hw = this.sprite.headWidth;
    const hh = this.sprite.headHeight;

    g.fillStyle(col, bodyAlpha);
    g.fillRect(headX - hw / 2, headY - hh / 2, hw, hh);

    if (this.sprite.hasHelmet) {
      g.fillStyle(accent, bodyAlpha * 0.8);
      g.fillRect(headX - hw / 2 - 1, headY - hh / 2 - 2, hw + 2, 4);
      g.fillRect(headX - hw / 2 + 1, headY - hh / 2 + hh - 2, hw - 2, 3);
    }

    const eyeX = this.facingRight ? 2 : -2;
    g.fillStyle(0xffffff, bodyAlpha);
    g.fillRect(headX + eyeX - 2, headY - 2, 3, 3);
    g.fillRect(headX + eyeX + 3, headY - 2, 3, 3);

    g.fillStyle(0x000000, bodyAlpha);
    g.fillRect(headX + eyeX - 1, headY - 1, 2, 2);
    g.fillRect(headX + eyeX + 4, headY - 1, 2, 2);

    const lArmX = px + m(p.lArmX + p.bodyLean);
    const lArmY = py + p.lArmY;
    g.fillStyle(col, bodyAlpha * 0.9);
    g.fillRect(lArmX - p.lArmW / 2, lArmY, p.lArmW, p.lArmH);
    g.fillStyle(this.sprite.accentColor, bodyAlpha * 0.5);
    g.fillRect(lArmX - p.lArmW / 2, lArmY, p.lArmW, 3);

    const rArmX = px + m(p.rArmX + p.bodyLean);
    const rArmY = py + p.rArmY;
    g.fillStyle(col, bodyAlpha * 0.9);
    g.fillRect(rArmX - p.rArmW / 2, rArmY, p.rArmW, p.rArmH);
    g.fillStyle(this.sprite.accentColor, bodyAlpha * 0.5);
    g.fillRect(rArmX - p.rArmW / 2, rArmY, p.rArmW, 3);

    const lHandX = px + m(p.lHandX + p.bodyLean);
    const lHandY = py + p.lHandY;
    g.fillStyle(accent, bodyAlpha);
    g.fillRect(lHandX - 3, lHandY - 3, 6, 6);

    const rHandX = px + m(p.rHandX + p.bodyLean);
    const rHandY = py + p.rHandY;
    g.fillStyle(accent, bodyAlpha);
    g.fillRect(rHandX - 3, rHandY - 3, 6, 6);

    if (this.sprite.hasWeapon) {
      g.fillStyle(0xcccccc, bodyAlpha * 0.7);
      if (this.sprite.weaponType === 'sword') {
        g.fillRect(rHandX + m(2), rHandY - 16, 3, 20);
        g.fillStyle(0xffe600, bodyAlpha * 0.5);
        g.fillRect(rHandX + m(1), rHandY - 2, 5, 3);
      } else if (this.sprite.weaponType === 'claws') {
        g.fillRect(rHandX + m(4), rHandY - 6, 8, 2);
        g.fillRect(rHandX + m(4), rHandY - 2, 8, 2);
        g.fillRect(rHandX + m(4), rHandY + 2, 8, 2);
      }
    }

    const lLegX = px + m(p.lLegX + p.bodyLean);
    const lLegY = py + p.lLegY;
    g.fillStyle(col, bodyAlpha * 0.85);
    g.fillRect(lLegX - p.lLegW / 2, lLegY, p.lLegW, p.lLegH);

    const rLegX = px + m(p.rLegX + p.bodyLean);
    const rLegY = py + p.rLegY;
    g.fillStyle(col, bodyAlpha * 0.85);
    g.fillRect(rLegX - p.rLegW / 2, rLegY, p.rLegW, p.rLegH);

    const lFootX = px + m(p.lFootX + p.bodyLean);
    const lFootY = py + p.lFootY;
    g.fillStyle(accent, bodyAlpha * 0.7);
    g.fillRect(lFootX - 4, lFootY, 8, 4);

    const rFootX = px + m(p.rFootX + p.bodyLean);
    const rFootY = py + p.rFootY;
    g.fillStyle(accent, bodyAlpha * 0.7);
    g.fillRect(rFootX - 4, rFootY, 8, 4);

    if (this.sprite.hasHelmet && (this.sprite.weaponType === 'sword')) {
      g.fillStyle(accent, bodyAlpha * 0.6);
      g.fillRect(headX - hw / 2 - 2, headY - hh / 2 - 6, hw + 4, 3);
      g.fillRect(headX - hw / 4, headY - hh / 2 - 10, hw / 2, 5);
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
