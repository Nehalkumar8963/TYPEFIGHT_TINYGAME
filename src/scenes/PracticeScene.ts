import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from '../config';
import { UIManager } from '../systems/UIManager';
import { getAllLetters } from '../letters';

export class PracticeScene extends Phaser.Scene {
  private ui!: UIManager;
  private targetKey = 'a';
  private score = 0;
  private mistakes = 0;
  private totalKeystrokes = 0;
  private correctKeystrokes = 0;
  private startTime = 0;
  private active = false;
  private perLetter: Record<string, { correct: number; wrong: number }> = {};
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private btnListener: (() => void) | null = null;

  constructor() {
    super('PracticeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.ui = new UIManager();
    this.perLetter = {};
    this.score = 0;
    this.mistakes = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.active = true;
    this.startTime = performance.now();

    this.drawBackground();

    this.targetKey = this.pickRandomKey();
    this.ui.showPractice();
    this.ui.renderPracticeKeyboard(getAllLetters(), this.targetKey);
    this.ui.setPracticeMessage('LETTERS: ALL 26 &bull; RANDOMIZED MOVES', '#666680');
    this.updateHud();
    this.ui.clearPracticeFeedback();

    this.setupInput();

    const backBtn = document.getElementById('practice-back-btn');
    if (backBtn) {
      this.btnListener = () => this.goBack();
      backBtn.addEventListener('click', this.btnListener);
    }
  }

  private drawBackground() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x0d0d1e);
    gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    gfx.lineStyle(1, 0x1a1a3e, 0.12);
    for (let x = 0; x < GAME_WIDTH; x += 48) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GAME_HEIGHT); gfx.strokePath();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 48) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    gfx.fillStyle(0x1a1a2e);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    gfx.fillStyle(0x39ff14, 0.2);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, 2);
  }

  private pickRandomKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
    return chars[Math.floor(Math.random() * chars.length)];
  }

  private setupInput() {
    this.keyHandler = (e: KeyboardEvent) => this.handleKey(e);
    document.addEventListener('keydown', this.keyHandler);
  }

  private handleKey(e: KeyboardEvent) {
    if (!this.active) return;
    if (e.key.length !== 1) return;

    const k = e.key.toLowerCase();
    const isLetter = /^[a-z]$/.test(k);
    if (!isLetter) return;

    if (k === this.targetKey) {
      this.perLetter[k] = this.perLetter[k] || { correct: 0, wrong: 0 };
      this.perLetter[k].correct++;
      this.correctKeystrokes++;
      this.totalKeystrokes++;
      this.score++;

      this.ui.setPracticeKeyFeedback(k, 'correct');
      this.ui.setPracticeMessage(`NICE! ${k.toUpperCase()}`, '#39ff14');

      this.targetKey = this.pickRandomKey();
    } else {
      this.perLetter[k] = this.perLetter[k] || { correct: 0, wrong: 0 };
      this.perLetter[k].wrong++;
      this.mistakes++;
      this.totalKeystrokes++;

      this.ui.setPracticeKeyFeedback(k, 'wrong');
      this.ui.setPracticeMessage(`PRESS ${this.targetKey.toUpperCase()}, NOT ${k.toUpperCase()}`, '#ff2442');
    }

    this.ui.renderPracticeKeyboard(getAllLetters(), this.targetKey);
    this.updateHud();

    this.time.delayedCall(250, () => {
      this.ui.clearPracticeFeedback();
      if (this.events) this.ui.setPracticeMessage('LETTERS: ALL 26 &bull; RANDOMIZED MOVES', '#666680');
    });
  }

  private updateHud() {
    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;
    const elapsed = (performance.now() - this.startTime) / 60000;
    const wpm = elapsed > 0 ? Math.round((this.correctKeystrokes / 5) / elapsed) : 0;

    this.ui.updatePracticeHud(
      this.targetKey,
      this.score,
      this.mistakes,
      wpm,
      accuracy,
      Math.round(elapsed * 60)
    );
  }

  private goBack() {
    this.active = false;
    if (this.btnListener) {
      document.getElementById('practice-back-btn')?.removeEventListener('click', this.btnListener);
      this.btnListener = null;
    }
    this.ui.showMenu();
    this.scene.start('MenuScene');
  }

  update(_time: number, _delta: number) {
    this.updateHud();
  }

  shutdown() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }
}
