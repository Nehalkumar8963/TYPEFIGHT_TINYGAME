import Phaser from 'phaser';

// Shared procedural pixel-art helpers used across scenes for a
// Japanese-retro (ukiyo-e arcade) atmosphere.

function clampA(alpha: number): number { return Phaser.Math.Clamp(alpha, 0, 1); }

/** Retro rising-sun disc with a flat band across it. */
export function drawSun(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, r: number,
  color = 0xff2442, alpha = 0.5
) {
  g.fillStyle(color, clampA(alpha * 0.22));
  g.fillCircle(x, y, r + 14);
  g.fillStyle(color, clampA(alpha * 0.4));
  g.fillCircle(x, y, r + 4);
  g.fillStyle(color, clampA(alpha * 0.7));
  g.fillCircle(x, y, r);
  g.fillStyle(color, clampA(alpha * 0.32));
  g.fillRect(x - r * 1.6, y, r * 3.2, 3);
}

/** Silhouette torii gate. baseY = ground line. */
export function drawTorii(
  g: Phaser.GameObjects.Graphics,
  x: number, baseY: number,
  scale = 1, color = 0x170a10, alpha = 0.55
) {
  const s = scale;
  const a = clampA(alpha);
  g.fillStyle(color, a);
  // pillars
  g.fillRect(x - 60 * s, baseY - 96 * s, 11 * s, 96 * s);
  g.fillRect(x + 50 * s, baseY - 96 * s, 11 * s, 96 * s);
  // base stones
  g.fillRect(x - 64 * s, baseY - 3 * s, 19 * s, 3 * s);
  g.fillRect(x + 46 * s, baseY - 3 * s, 19 * s, 3 * s);
  // nuki (lower bar)
  g.fillRect(x - 82 * s, baseY - 112 * s, 164 * s, 9 * s);
  // gakuzuka (emblem plaque)
  g.fillRect(x - 20 * s, baseY - 101 * s, 40 * s, 12 * s);
  // shimaki (2nd bar)
  g.fillRect(x - 88 * s, baseY - 116 * s, 176 * s, 7 * s);
  // kasagi (top bar, slightly overhanging)
  g.fillStyle(color, a * 0.95);
  g.fillRect(x - 100 * s, baseY - 130 * s, 200 * s, 16 * s);
}

/** Layered pixel mountains (two passes: back tint + front shadow). */
export function drawMountainRange(
  g: Phaser.GameObjects.Graphics,
  baseY: number, color: number, alpha: number,
  peaks: Array<{ x: number; w: number; h: number }>
) {
  const a = clampA(alpha);
  for (const p of peaks) {
    // draw as stacked rows so it reads as chunky pixel slopes
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const y0 = baseY - p.h + (p.h * t);
      const halfW = p.w * (1 - t) / 2;
      g.fillStyle(color, a * (0.5 + 0.5 * (1 - t)));
      g.fillRect(p.x - halfW, y0, Math.ceil(halfW * 2), Math.ceil(p.h / steps) + 1);
    }
  }
}

/** Red ink seal (hanko) with abstract kanji strokes. Variants vary the stroke density. */
export function drawHanko(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, size: number,
  color = 0xff2442, alpha = 0.85, variant = 0
) {
  const s = size;
  const a = clampA(alpha);
  // outer frame
  g.fillStyle(color, a);
  g.fillRect(x - s / 2, y - s / 2, s, 3);
  g.fillRect(x - s / 2, y + s / 2 - 3, s, 3);
  g.fillRect(x - s / 2, y - s / 2, 3, s);
  g.fillRect(x + s / 2 - 3, y - s / 2, 3, s);
  // abstract strokes (white paper cuts through the red)
  g.fillStyle(0xffffff, a);
  const rows = variant % 3 + 2;
  const cols = rows + 1;
  const pad = s * 0.16;
  const cw = (s - pad * 2) / cols;
  const ch = (s - pad * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c + variant) % 4 === 0) continue;
      const sx = x - s / 2 + pad + c * cw;
      const sy = y - s / 2 + pad + r * ch;
      g.fillRect(sx, sy, Math.max(2, cw - 2), Math.max(2, ch - 2));
    }
  }
}

/** Coarse pixel grain for surface texture. */
export function drawGrain(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  color: number, alpha: number, count = 140, seed = 1
) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const a = clampA(alpha);
  g.fillStyle(color, a);
  for (let i = 0; i < count; i++) {
    const px = Math.floor(x + rand() * w);
    const py = Math.floor(y + rand() * h);
    g.fillRect(px, py, rand() > 0.7 ? 2 : 1, 1);
  }
}

/** Paper lantern with glow. */
export function drawLantern(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, size = 12,
  color = 0xff6600, alpha = 0.2
) {
  const a = clampA(alpha);
  g.fillStyle(color, a * 0.6);
  g.fillCircle(x, y, size + 8);
  g.fillStyle(color, a);
  g.fillRect(x - size / 2, y - size, size, size * 2); // body
  g.fillStyle(0xffffff, a * 0.8);
  g.fillRect(x - size / 2, y - size, size, 2);         // cap
  g.fillRect(x - size / 2, y + size - 2, size, 2);     // base
  g.fillStyle(0x000000, a * 0.35);
  g.fillRect(x - 1, y - size + 2, 2, size * 2 - 4);    // ridge
}

/** Classic seigaiha (wave) strip sitting on a baseline. */
export function drawSeigaihaStrip(
  g: Phaser.GameObjects.Graphics,
  x: number, baseY: number, w: number, arcR: number,
  color: number, alpha: number
) {
  const a = clampA(alpha);
  g.lineStyle(2, color, a);
  for (let cx = x - arcR + 4; cx < x + w + arcR; cx += arcR * 2 - 4) {
    g.strokeCircle(cx, baseY, arcR);
    g.strokeCircle(cx + arcR, baseY, arcR - 2);
  }
}

/** Tatami mat lattice for dojo/temple floors. */
export function drawTatami(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  lineColor: number, alpha: number, cellH = 26
) {
  const a = clampA(alpha);
  g.lineStyle(1, lineColor, a);
  for (let yy = y; yy < y + h; yy += cellH) {
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.strokePath();
    g.beginPath(); g.moveTo(x, yy + cellH / 2); g.lineTo(x + w, yy + cellH / 2); g.strokePath();
  }
  for (let xx = x; xx < x + w; xx += 40) {
    g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.strokePath();
  }
}

/** A tall vertical bamboo shoot. */
export function drawBamboo(
  g: Phaser.GameObjects.Graphics,
  x: number, baseY: number, h: number,
  color = 0x1d6a34, alpha = 0.45
) {
  const a = clampA(alpha);
  g.fillStyle(color, a);
  g.fillRect(x - 5, baseY - h, 10, h);
  g.fillStyle(0xffffff, a * 0.4);
  g.fillRect(x - 3, baseY - h, 2, h);
  g.fillStyle(0x0f3a1d, a * 0.5);
  for (let seg = 0; seg < Math.floor(h / 22); seg++) {
    g.fillRect(x - 6, baseY - 22 * seg - 2, 12, 2);
  }
  // leaves
  g.fillStyle(color, a);
  g.fillRect(x - 16, baseY - h - 2, 10, 2);
  g.fillRect(x + 8, baseY - h - 6, 10, 2);
  g.fillRect(x + 2, baseY - h - 10, 8, 2);
}