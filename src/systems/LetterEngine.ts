import type { CombatMove, LetterEvent, LetterStatus } from '../types';
import { COMBAT_MOVES, COMBO_AUTO_THRESHOLD, COMBO_FEVER_THRESHOLD } from '../config';
import { getRandomLetter } from '../letters';

export class LetterEngine {
  private queue: LetterEvent[] = [];
  private maxQueue = 3;
  private spawnTimer = 0;
  private spawnInterval = 1100;
  private baseTimeWindow = 1800;
  private active = false;
  private combo = 0;
  private totalKeystrokes = 0;
  private correctKeystrokes = 0;
  private startTime = 0;

  get currentLetter(): LetterEvent | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  get letters(): readonly LetterEvent[] { return this.queue; }
  get isActive(): boolean { return this.active; }
  get currentCombo(): number { return this.combo; }

  get mode(): 'normal' | 'autofight' | 'fever' {
    if (this.combo >= COMBO_FEVER_THRESHOLD) return 'fever';
    if (this.combo >= COMBO_AUTO_THRESHOLD) return 'autofight';
    return 'normal';
  }

  start(spawnInterval: number, timeWindow: number) {
    this.spawnInterval = spawnInterval;
    this.baseTimeWindow = timeWindow;
    this.queue = [];
    this.combo = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.spawnTimer = 0;
    this.startTime = performance.now();
    this.active = true;
    this.spawnLetter();
  }

  stop() {
    this.active = false;
    this.queue = [];
  }

  update(delta: number) {
    if (!this.active) return;

    const mode = this.mode;
    const intervalMult = mode === 'fever' ? 0.4 : mode === 'autofight' ? 0.65 : 1;

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval * intervalMult && this.queue.length < this.maxQueue) {
      this.spawnTimer = 0;
      this.spawnLetter();
    }

    for (let i = this.queue.length - 1; i >= 0; i--) {
      const letter = this.queue[i];
      if (letter.status === 'active') {
        letter.timer -= delta;
        if (letter.timer <= 0) {
          letter.status = 'missed';
          this.combo = 0;
          this.queue.splice(i, 1);
        }
      }
    }

    if (this.queue.length === 0 && this.active) {
      this.spawnTimer = 0;
      this.spawnLetter();
    }
  }

  private spawnLetter() {
    const { key, move } = getRandomLetter();
    const timerMult = this.mode === 'fever' ? 0.75 : this.mode === 'autofight' ? 0.85 : 1;
    const letter: LetterEvent = {
      key,
      move,
      status: 'active',
      timer: this.baseTimeWindow * timerMult,
      maxTimer: this.baseTimeWindow * timerMult,
    };
    this.queue.push(letter);
  }

  handleKey(key: string): { hit: boolean; move: CombatMove | null; missed: boolean } {
    if (!this.active || key.length !== 1) {
      return { hit: false, move: null, missed: false };
    }

    this.totalKeystrokes++;
    const k = key.toLowerCase();
    const target = this.currentLetter;

    if (!target) return { hit: false, move: null, missed: false };

    if (k === target.key) {
      target.status = 'correct';
      this.correctKeystrokes++;
      this.combo++;

      const move = target.move;
      const idx = this.queue.indexOf(target);
      if (idx >= 0) this.queue.splice(idx, 1);

      this.spawnTimer = 0;
      if (this.queue.length < this.maxQueue) {
        this.spawnLetter();
      }

      return { hit: true, move, missed: false };
    } else {
      target.status = 'wrong';
      this.combo = 0;
      setTimeout(() => {
        if (target.status === 'wrong') target.status = 'active';
      }, 200);
      return { hit: false, move: null, missed: false };
    }
  }

  getAccuracy(): number {
    if (this.totalKeystrokes === 0) return 100;
    return Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100);
  }

  getWpm(): number {
    const elapsed = (performance.now() - this.startTime) / 60000;
    if (elapsed <= 0) return 0;
    return Math.round((this.correctKeystrokes / 5) / elapsed);
  }

  deactivate() {
    this.active = false;
  }
}
