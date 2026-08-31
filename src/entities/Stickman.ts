import Phaser from 'phaser';
import type { Pose, AnimFrame } from '../types';

/* ---- POSE DEFINITIONS (right-facing) ---- */
const P: Record<string, Pose> = {
  idle1: {
    headX: 0, headY: -96, neckX: 0, neckY: -80, hipX: 0, hipY: -40,
    lElbowX: -16, lElbowY: -62, lHandX: -12, lHandY: -48,
    rElbowX: 16, rElbowY: -62, rHandX: 12, rHandY: -48,
    lKneeX: -6, lKneeY: -22, lFootX: -10, lFootY: 0,
    rKneeX: 6, rKneeY: -22, rFootX: 10, rFootY: 0,
  },
  idle2: {
    headX: 0, headY: -93, neckX: 0, neckY: -77, hipX: 0, hipY: -38,
    lElbowX: -16, lElbowY: -59, lHandX: -12, lHandY: -45,
    rElbowX: 16, rElbowY: -59, rHandX: 12, rHandY: -45,
    lKneeX: -6, lKneeY: -21, lFootX: -10, lFootY: 0,
    rKneeX: 6, rKneeY: -21, rFootX: 10, rFootY: 0,
  },
  punchWindup: {
    headX: -4, headY: -94, neckX: -2, neckY: -78, hipX: 0, hipY: -40,
    lElbowX: -20, lElbowY: -64, lHandX: -24, lHandY: -52,
    rElbowX: 8, rElbowY: -70, rHandX: 0, rHandY: -74,
    lKneeX: -8, lKneeY: -22, lFootX: -14, lFootY: 0,
    rKneeX: 8, rKneeY: -22, rFootX: 14, rFootY: 0,
  },
  punchStrike: {
    headX: 8, headY: -92, neckX: 4, neckY: -76, hipX: 0, hipY: -40,
    lElbowX: -20, lElbowY: -60, lHandX: -16, lHandY: -46,
    rElbowX: 32, rElbowY: -76, rHandX: 54, rHandY: -74,
    lKneeX: -10, lKneeY: -22, lFootX: -18, lFootY: 0,
    rKneeX: 10, rKneeY: -22, rFootX: 14, rFootY: 0,
  },
  punchRecover: {
    headX: 3, headY: -95, neckX: 1, neckY: -79, hipX: 0, hipY: -40,
    lElbowX: -18, lElbowY: -62, lHandX: -14, lHandY: -48,
    rElbowX: 20, rElbowY: -64, rHandX: 18, rHandY: -50,
    lKneeX: -7, lKneeY: -22, lFootX: -12, lFootY: 0,
    rKneeX: 7, rKneeY: -22, rFootX: 12, rFootY: 0,
  },
  kickWindup: {
    headX: -2, headY: -94, neckX: -1, neckY: -78, hipX: 0, hipY: -40,
    lElbowX: -18, lElbowY: -62, lHandX: -20, lHandY: -50,
    rElbowX: 18, rElbowY: -62, rHandX: 20, rHandY: -50,
    lKneeX: -8, lKneeY: -22, lFootX: -12, lFootY: 0,
    rKneeX: 16, rKneeY: -36, rFootX: 12, rFootY: -26,
  },
  kickStrike: {
    headX: -6, headY: -93, neckX: -3, neckY: -77, hipX: 2, hipY: -40,
    lElbowX: -22, lElbowY: -60, lHandX: -26, lHandY: -48,
    rElbowX: 22, rElbowY: -60, rHandX: 26, rHandY: -48,
    lKneeX: -8, lKneeY: -22, lFootX: -12, lFootY: 0,
    rKneeX: 34, rKneeY: -34, rFootX: 56, rFootY: -32,
  },
  kickRecover: {
    headX: -2, headY: -95, neckX: -1, neckY: -79, hipX: 0, hipY: -40,
    lElbowX: -18, lElbowY: -62, lHandX: -16, lHandY: -48,
    rElbowX: 18, rElbowY: -62, rHandX: 16, rHandY: -48,
    lKneeX: -7, lKneeY: -22, lFootX: -10, lFootY: 0,
    rKneeX: 10, rKneeY: -26, rFootX: 14, rFootY: -6,
  },
  heavyWindup: {
    headX: -8, headY: -94, neckX: -4, neckY: -78, hipX: 0, hipY: -40,
    lElbowX: -24, lElbowY: -68, lHandX: -30, lHandY: -58,
    rElbowX: -6, rElbowY: -76, rHandX: -2, rHandY: -86,
    lKneeX: -10, lKneeY: -22, lFootX: -16, lFootY: 0,
    rKneeX: 8, rKneeY: -22, rFootX: 14, rFootY: 0,
  },
  heavyStrike: {
    headX: 10, headY: -90, neckX: 6, neckY: -74, hipX: 0, hipY: -40,
    lElbowX: -18, lElbowY: -58, lHandX: -14, lHandY: -44,
    rElbowX: 38, rElbowY: -78, rHandX: 62, rHandY: -70,
    lKneeX: -12, lKneeY: -22, lFootX: -20, lFootY: 0,
    rKneeX: 12, rKneeY: -22, rFootX: 16, rFootY: 0,
  },
  heavyRecover: {
    headX: 4, headY: -95, neckX: 2, neckY: -79, hipX: 0, hipY: -40,
    lElbowX: -18, lElbowY: -62, lHandX: -14, lHandY: -48,
    rElbowX: 22, rElbowY: -66, rHandX: 20, rHandY: -52,
    lKneeX: -7, lKneeY: -22, lFootX: -12, lFootY: 0,
    rKneeX: 7, rKneeY: -22, rFootX: 12, rFootY: 0,
  },
  hurt: {
    headX: -8, headY: -90, neckX: -5, neckY: -75, hipX: 2, hipY: -38,
    lElbowX: -12, lElbowY: -64, lHandX: -8, lHandY: -56,
    rElbowX: 10, rElbowY: -64, rHandX: 6, rHandY: -56,
    lKneeX: -10, lKneeY: -20, lFootX: -14, lFootY: 0,
    rKneeX: 4, rKneeY: -20, rFootX: 8, rFootY: 0,
  },
  walk1: {
    headX: 2, headY: -95, neckX: 1, neckY: -79, hipX: 0, hipY: -40,
    lElbowX: -14, lElbowY: -62, lHandX: -10, lHandY: -48,
    rElbowX: 14, rElbowY: -62, rHandX: 10, rHandY: -48,
    lKneeX: -12, lKneeY: -22, lFootX: -20, lFootY: 0,
    rKneeX: 14, rKneeY: -22, rFootX: 22, rFootY: 0,
  },
  walk2: {
    headX: 2, headY: -95, neckX: 1, neckY: -79, hipX: 0, hipY: -40,
    lElbowX: -14, lElbowY: -62, lHandX: -10, lHandY: -48,
    rElbowX: 14, rElbowY: -62, rHandX: 10, rHandY: -48,
    lKneeX: 14, lKneeY: -22, lFootX: 22, lFootY: 0,
    rKneeX: -12, rKneeY: -22, rFootX: -20, rFootY: 0,
  },
  victory: {
    headX: 0, headY: -100, neckX: 0, neckY: -84, hipX: 0, hipY: -42,
    lElbowX: -20, lElbowY: -68, lHandX: -16, lHandY: -54,
    rElbowX: 14, rElbowY: -86, rHandX: 10, rHandY: -104,
    lKneeX: -6, lKneeY: -22, lFootX: -10, lFootY: 0,
    rKneeX: 6, rKneeY: -22, rFootX: 10, rFootY: 0,
  },
  defeat: {
    headX: -12, headY: -52, neckX: -6, neckY: -48, hipX: 4, hipY: -22,
    lElbowX: -18, lElbowY: -38, lHandX: -24, lHandY: -28,
    rElbowX: 14, rElbowY: -34, rHandX: 20, rHandY: -24,
    lKneeX: -14, lKneeY: -10, lFootX: -20, lFootY: 0,
    rKneeX: 16, rKneeY: -10, rFootX: 22, rFootY: 0,
  },
  block: {
    headX: -2, headY: -94, neckX: -1, neckY: -78, hipX: 0, hipY: -40,
    lElbowX: -8, lElbowY: -74, lHandX: 6, lHandY: -78,
    rElbowX: 8, rElbowY: -74, rHandX: -6, rHandY: -78,
    lKneeX: -8, lKneeY: -22, lFootX: -14, lFootY: 0,
    rKneeX: 8, rKneeY: -22, rFootX: 14, rFootY: 0,
  },
};

/* ---- ANIMATION SEQUENCES ---- */
const ANIMS: Record<string, AnimFrame[]> = {
  idle: [
    { pose: P.idle1, duration: 600 },
    { pose: P.idle2, duration: 600 },
  ],
  punch: [
    { pose: P.punchWindup, duration: 80 },
    { pose: P.punchStrike, duration: 60 },
    { pose: P.punchRecover, duration: 150 },
    { pose: P.idle1, duration: 200 },
  ],
  kick: [
    { pose: P.kickWindup, duration: 100 },
    { pose: P.kickStrike, duration: 80 },
    { pose: P.kickRecover, duration: 180 },
    { pose: P.idle1, duration: 200 },
  ],
  heavy: [
    { pose: P.heavyWindup, duration: 180 },
    { pose: P.heavyStrike, duration: 80 },
    { pose: P.heavyRecover, duration: 250 },
    { pose: P.idle1, duration: 200 },
  ],
  hurt: [
    { pose: P.hurt, duration: 200 },
    { pose: P.idle1, duration: 300 },
  ],
  walk: [
    { pose: P.walk1, duration: 200 },
    { pose: P.idle1, duration: 100 },
    { pose: P.walk2, duration: 200 },
    { pose: P.idle1, duration: 100 },
  ],
  victory: [
    { pose: P.victory, duration: 800 },
    { pose: P.idle1, duration: 400 },
  ],
  defeat: [
    { pose: P.defeat, duration: 1000 },
  ],
  block: [
    { pose: P.block, duration: 300 },
    { pose: P.idle1, duration: 200 },
  ],
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    headX: lerp(a.headX, b.headX, t), headY: lerp(a.headY, b.headY, t),
    neckX: lerp(a.neckX, b.neckX, t), neckY: lerp(a.neckY, b.neckY, t),
    hipX: lerp(a.hipX, b.hipX, t), hipY: lerp(a.hipY, b.hipY, t),
    lElbowX: lerp(a.lElbowX, b.lElbowX, t), lElbowY: lerp(a.lElbowY, b.lElbowY, t),
    lHandX: lerp(a.lHandX, b.lHandX, t), lHandY: lerp(a.lHandY, b.lHandY, t),
    rElbowX: lerp(a.rElbowX, b.rElbowX, t), rElbowY: lerp(a.rElbowY, b.rElbowY, t),
    rHandX: lerp(a.rHandX, b.rHandX, t), rHandY: lerp(a.rHandY, b.rHandY, t),
    lKneeX: lerp(a.lKneeX, b.lKneeX, t), lKneeY: lerp(a.lKneeY, b.lKneeY, t),
    lFootX: lerp(a.lFootX, b.lFootX, t), lFootY: lerp(a.lFootY, b.lFootY, t),
    rKneeX: lerp(a.rKneeX, b.rKneeX, t), rKneeY: lerp(a.rKneeY, b.rKneeY, t),
    rFootX: lerp(a.rFootX, b.rFootX, t), rFootY: lerp(a.rFootY, b.rFootY, t),
  };
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export class Stickman {
  scene: Phaser.Scene;
  x: number;
  y: number;
  color: number;
  facingRight: boolean;
  graphics: Phaser.GameObjects.Graphics;
  private currentPose: Pose;
  private animQueue: AnimFrame[] = [];
  private fromPose: Pose;
  private frameTime = 0;
  private isPlayingAnim = false;
  private onAnimComplete: (() => void) | null = null;
  private idleTime = 0;
  private hpPercent = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, facingRight: boolean) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.color = color;
    this.facingRight = facingRight;
    this.currentPose = { ...P.idle1 };
    this.fromPose = { ...P.idle1 };
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5);
  }

  play(animName: string, onComplete?: () => void) {
    const seq = ANIMS[animName];
    if (!seq) return;
    this.animQueue = seq.map(f => ({ ...f, pose: { ...f.pose } }));
    this.fromPose = { ...this.currentPose };
    this.frameTime = 0;
    this.isPlayingAnim = true;
    this.onAnimComplete = onComplete ?? null;
  }

  get isAnimating(): boolean {
    return this.isPlayingAnim;
  }

  setHp(pct: number) {
    this.hpPercent = Math.max(0, Math.min(1, pct));
  }

  update(delta: number) {
    if (this.isPlayingAnim) {
      this.updateAnim(delta);
    } else {
      this.updateIdle(delta);
    }
    this.draw();
  }

  private updateIdle(delta: number) {
    this.idleTime += delta * 0.003;
    const t = (Math.sin(this.idleTime) + 1) / 2;
    this.currentPose = lerpPose(P.idle1, P.idle2, easeInOutQuad(t));
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
    this.currentPose = lerpPose(this.fromPose, this.animQueue[0].pose, easeOutQuad(t));
  }

  private mirrorX(x: number): number {
    return this.facingRight ? x : -x;
  }

  private draw() {
    const g = this.graphics;
    g.clear();

    const px = this.x;
    const py = this.y;
    const pose = this.currentPose;
    const m = (x: number) => this.mirrorX(x);
    const lineW = 3;

    const flashAlpha = this.hpPercent < 0.25 ? 0.6 + Math.sin(Date.now() * 0.01) * 0.4 : 1;
    const col = Phaser.Display.Color.IntegerToColor(this.color);

    g.lineStyle(lineW, this.color, flashAlpha);
    g.fillStyle(this.color, flashAlpha);

    const headX = px + m(pose.headX);
    const headY = py + pose.headY;
    const neckX = px + m(pose.neckX);
    const neckY = py + pose.neckY;
    const hipX = px + m(pose.hipX);
    const hipY = py + pose.hipY;

    const lEx = px + m(pose.lElbowX);
    const lEy = py + pose.lElbowY;
    const lHx = px + m(pose.lHandX);
    const lHy = py + pose.lHandY;
    const rEx = px + m(pose.rElbowX);
    const rEy = py + pose.rElbowY;
    const rHx = px + m(pose.rHandX);
    const rHy = py + pose.rHandY;
    const lKx = px + m(pose.lKneeX);
    const lKy = py + pose.lKneeY;
    const lFx = px + m(pose.lFootX);
    const lFy = py + pose.lFootY;
    const rKx = px + m(pose.rKneeX);
    const rKy = py + pose.rKneeY;
    const rFx = px + m(pose.rFootX);
    const rFy = py + pose.rFootY;

    // Head (pixel-ish: draw a rect with rounded feel)
    g.fillRect(headX - 8, headY - 8, 16, 16);
    g.strokeRect(headX - 9, headY - 9, 18, 18);

    // Eyes (two small bright pixels)
    const eyeOffsetX = this.facingRight ? 3 : -3;
    g.fillStyle(0xffffff, flashAlpha);
    g.fillRect(headX + eyeOffsetX - 2, headY - 2, 2, 2);
    g.fillRect(headX + eyeOffsetX + 3, headY - 2, 2, 2);

    // Torso
    g.lineStyle(lineW, this.color, flashAlpha);
    g.beginPath();
    g.moveTo(neckX, neckY);
    g.lineTo(hipX, hipY);
    g.strokePath();

    // Left arm
    g.beginPath();
    g.moveTo(neckX, neckY);
    g.lineTo(lEx, lEy);
    g.lineTo(lHx, lHy);
    g.strokePath();

    // Right arm
    g.beginPath();
    g.moveTo(neckX, neckY);
    g.lineTo(rEx, rEy);
    g.lineTo(rHx, rHy);
    g.strokePath();

    // Left leg
    g.beginPath();
    g.moveTo(hipX, hipY);
    g.lineTo(lKx, lKy);
    g.lineTo(lFx, lFy);
    g.strokePath();

    // Right leg
    g.beginPath();
    g.moveTo(hipX, hipY);
    g.lineTo(rKx, rKy);
    g.lineTo(rFx, rFy);
    g.strokePath();

    // Joint dots (pixel-art feel)
    const dotR = 2;
    g.fillStyle(this.color, flashAlpha);
    [
      [neckX, neckY], [hipX, hipY],
      [lEx, lEy], [rEx, rEy],
      [lKx, lKy], [rKx, rKy],
    ].forEach(([jx, jy]) => {
      g.fillRect(jx - dotR, jy - dotR, dotR * 2, dotR * 2);
    });
  }

  destroy() {
    this.graphics.destroy();
  }
}
