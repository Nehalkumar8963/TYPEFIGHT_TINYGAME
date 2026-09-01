import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from '../config';
import { UIManager } from '../systems/UIManager';
import { SoundEngine } from '../systems/SoundEngine';
import { getAllLetters } from '../letters';
import { getRandomWord } from '../typingWords';
import { TouchKeyboard } from '../systems/TouchKeyboard';
import {
  drawSun, drawTorii, drawMountainRange, drawGrain, drawSeigaihaStrip,
} from '../textures';

type PracticeMode = 'letters' | 'words' | 'timed' | 'fall';

const TIMED_SECONDS = 60;
const READY_TICKS = 3;

const FALL_START_LIVES = 3;
const FALL_BASE_SPEED = 44;
const FALL_SPEED_RAMP = 0.9;
const FALL_MAX_SPEED = 110;
const FALL_MAX_WORDS = 5;
const FALL_START_INTERVAL = 2300;
const FALL_MIN_INTERVAL = 1300;
const FALL_INTERVAL_RAMP = 12;
const FALL_DANGER_OFFSET = 48;

interface FallWord {
  text: string;
  el: HTMLElement;
  x: number;
  y: number;
  speed: number;
  charIndex: number;
  removed: boolean;
}

export class PracticeScene extends Phaser.Scene {
  private ui!: UIManager;
  private sfx = SoundEngine.instance;

  private mode: PracticeMode = 'letters';
  private sessionActive = false;
  private readyPhase = false;
  private startTime = 0;

  private score = 0;
  private mistakes = 0;
  private totalKeystrokes = 0;
  private correctKeystrokes = 0;
  private streak = 0;
  private bestStreak = 0;
  private wordsTyped = 0;

  private targetKey = 'a';
  private currentWord = '';
  private charIndex = 0;

  private fallWords: FallWord[] = [];
  private fallLives = FALL_START_LIVES;
  private fallScore = 0;
  private fallNextSpawn = 0;
  private fallTimeAlive = 0;
  private fallGameOver = false;
  private fallFieldW = 0;
  private fallFieldH = 0;

  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private backListener: (() => void) | null = null;
  private modeListeners: Array<{ btn: HTMLElement; cb: (e: Event) => void }> = [];

  constructor() {
    super('PracticeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.ui = new UIManager();

    this.drawBackground();
    this.wireButtons();
    this.setupInput();
    this.ui.showPractice();

    const saved = localStorage.getItem('typefight_practice_mode');
    const initialMode: PracticeMode =
      saved === 'words' || saved === 'timed' || saved === 'fall' ? saved : 'letters';
    this.startSession(initialMode);
  }

  private drawBackground() {
    const gfx = this.add.graphics();

    // Sky gradient
    for (let y = 0; y < GROUND_Y; y += 3) {
      const t = y / GROUND_Y;
      const r = Math.floor(10 + t * 14);
      const g = Math.floor(10 + t * 8);
      const b = Math.floor(22 + t * 22);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, y, GAME_WIDTH, 3);
    }

    // Faint sun + mountains for a dojo vista
    drawSun(gfx, GAME_WIDTH - 190, GROUND_Y - 110, 70, 0xff2442, 0.35);
    drawMountainRange(gfx, GROUND_Y, 0x151030, 0.7, [
      { x: 120, w: 420, h: 130 },
      { x: 620, w: 380, h: 170 },
      { x: 980, w: 300, h: 100 },
    ]);
    drawTorii(gfx, 260, GROUND_Y, 0.9, 0x0e0712, 0.4);

    drawGrain(gfx, 0, 0, GAME_WIDTH, GROUND_Y, 0xffffff, 0.04, 160, 13);

    gfx.lineStyle(1, 0x3a2a4e, 0.08);
    for (let x = 0; x < GAME_WIDTH; x += 48) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GROUND_Y); gfx.strokePath();
    }
    for (let y = 0; y < GROUND_Y; y += 48) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    // Floor
    gfx.fillStyle(0x1a1a2e);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    drawSeigaihaStrip(gfx, 0, GAME_HEIGHT - 6, GAME_WIDTH, 16, 0x39ff14, 0.14);
    gfx.fillStyle(0x39ff14, 0.25);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, 2);
    drawGrain(gfx, 0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y, 0x000000, 0.12, 90, 19);
  }

  private wireButtons() {
    const modeBtns = Array.from(
      document.querySelectorAll<HTMLElement>('.practice-mode-row .mode-btn')
    );
    modeBtns.forEach(btn => {
      const cb = (e: Event) => {
        if (!this.scene.isActive()) return;
        e.preventDefault();
        if (!this.sfx.isMuted) this.sfx.uiClick();
        modeBtns.forEach(b => b.classList.toggle('active', b === btn));
        this.startSession((btn.dataset.mode as PracticeMode) || 'letters');
      };
      btn.addEventListener('click', cb);
      this.modeListeners.push({ btn, cb });
    });

    const backBtn = document.getElementById('practice-back-btn');
    if (backBtn) {
      this.backListener = () => {
        if (!this.scene.isActive()) return;
        this.sessionActive = false;
        if (!this.sfx.isMuted) this.sfx.uiClick();
        this.ui.showMenu();
        this.scene.start('MenuScene');
      };
      backBtn.addEventListener('click', this.backListener);
    }

    const againBtn = document.getElementById('practice-res-again') as HTMLButtonElement | null;
    if (againBtn) {
      againBtn.onclick = () => {
        if (!this.scene.isActive()) return;
        if (!this.sfx.isMuted) this.sfx.uiClick();
        this.startSession(this.mode);
      };
    }

    const sfxBtn = document.getElementById('practice-sfx-toggle') as HTMLButtonElement | null;
    if (sfxBtn) {
      sfxBtn.onclick = (e) => {
        e.stopPropagation();
        const muted = this.sfx.toggleMuted();
        sfxBtn.textContent = muted ? 'SFX OFF' : 'SFX ON';
        sfxBtn.classList.toggle('muted', muted);
        if (!muted) this.sfx.uiClick();
      };
      sfxBtn.textContent = this.sfx.isMuted ? 'SFX OFF' : 'SFX ON';
      sfxBtn.classList.toggle('muted', this.sfx.isMuted);
    }
  }

  private startSession(mode: PracticeMode) {
    this.mode = mode;
    localStorage.setItem('typefight_practice_mode', mode);

    this.ui.setPracticeDisplay(mode);
    this.ui.hidePracticeResults();
    this.ui.clearPracticeFeedback();

    this.score = 0;
    this.mistakes = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.wordsTyped = 0;
    this.charIndex = 0;
    this.sessionActive = false;
    this.readyPhase = false;

    if (mode === 'letters') {
      this.targetKey = this.pickRandomKey();
      this.ui.renderPracticeKeyboard(getAllLetters(), this.targetKey);
      this.ui.setPracticeMessage('TYPE THE KEY &bull; KEEP YOUR STREAK ALIVE', '#666680');
      this.sessionActive = true;
      this.startTime = performance.now();
    } else if (mode === 'fall') {
      this.ui.clearFallingWords();
      this.fallWords = [];
      this.fallLives = FALL_START_LIVES;
      this.fallScore = 0;
      this.fallNextSpawn = 300;
      this.fallTimeAlive = 0;
      this.fallGameOver = false;
      this.fallFieldW = 0;
      this.fallFieldH = 0;
      this.ui.renderPracticeFallHud(0, this.fallLives, FALL_START_LIVES);
      if (TouchKeyboard.enabled()) {
        this.ui.renderPracticeKeyboard(getAllLetters(), '');
      }
      this.sessionActive = true;
      this.startTime = performance.now();
    } else {
      this.currentWord = getRandomWord();
      this.charIndex = 0;
      this.ui.renderPracticeKeyboard(getAllLetters(), this.currentWord[0]);
      this.ui.renderPracticeWord(this.currentWord, 0);

      if (mode === 'timed') {
        this.beginTimedReady();
      } else {
        this.ui.setPracticeMessage('WORD MODE &bull; TYPE WORDS &bull; SPACES ARE IGNORED', '#666680');
        this.sessionActive = true;
        this.startTime = performance.now();
      }
    }

    this.updateHud();
  }

  private beginTimedReady() {
    this.readyPhase = true;
    this.ui.setPracticeMessage(`GET READY &bull; ${TIMED_SECONDS}s TEST`, '#ffe600');
    let count = READY_TICKS;

    const tick = () => {
      if (this.mode !== 'timed' || !this.readyPhase) return;
      if (this.scene.isActive() && !this.sfx.isMuted) this.sfx.uiClick();
      if (count > 0) {
        this.ui.setPracticeMessage(String(count), '#ffe600');
        count--;
        this.time.delayedCall(750, tick);
      } else {
        this.ui.setPracticeMessage('GO!', '#39ff14');
        if (!this.sfx.isMuted) this.sfx.comboMilestone();
        this.readyPhase = false;
        this.sessionActive = true;
        this.startTime = performance.now();
        this.time.delayedCall(700, () => {
          if (this.mode === 'timed' && this.sessionActive) {
            this.ui.setPracticeMessage('TIMED TEST &bull; TYPE AS MANY WORDS AS YOU CAN', '#666680');
          }
        });
      }
    };
    tick();
  }

  private pickRandomKey(): string {
    const chars = getAllLetters();
    return chars[Math.floor(Math.random() * chars.length)];
  }

  private setupInput() {
    this.keyHandler = (e: KeyboardEvent) => this.handleKey(e);
    document.addEventListener('keydown', this.keyHandler);
  }

  private handleKey(e: KeyboardEvent) {
    if (!this.sessionActive || this.readyPhase) return;
    if (e.key.length !== 1) return;

    const k = e.key.toLowerCase();
    if (!/^[a-z]$/.test(k)) return;

    if (this.mode === 'letters') {
      const correct = k === this.targetKey;
      if (correct) {
        this.recordCorrect();
        this.ui.setPracticeMessage(`NICE! ${k.toUpperCase()}`, '#39ff14');
        this.targetKey = this.pickRandomKey();
      } else {
        this.recordWrong();
        this.ui.setPracticeMessage(`PRESS ${this.targetKey.toUpperCase()}, NOT ${k.toUpperCase()}`, '#ff2442');
      }
      this.ui.renderPracticeKeyboard(getAllLetters(), this.targetKey);
      this.ui.setPracticeKeyFeedback(k, correct ? 'correct' : 'wrong');
    } else if (this.mode === 'fall') {
      if (this.fallGameOver) return;
      const word = this.getActiveFallWord();
      if (!word) return;

      const target = word.text[word.charIndex];
      if (k === target) {
        this.recordCorrect();
        word.charIndex++;
        this.renderFallWordChars(word);
        this.updateFallActive();
        if (word.charIndex >= word.text.length) {
          this.wordsTyped++;
          this.fallScore += word.text.length * 10;
          if (!this.sfx.isMuted) this.sfx.comboMilestone();
          this.removeFallWord(word);
        }
      } else {
        this.recordWrong();
        this.ui.setPracticeKeyFeedback(k, 'wrong');
      }
    } else {
      const target = this.currentWord[this.charIndex];
      if (k === target) {
        this.recordCorrect();
        this.charIndex++;
        if (this.charIndex >= this.currentWord.length) {
          this.wordsTyped++;
          if (!this.sfx.isMuted) this.sfx.comboMilestone();
          this.advanceWord();
        } else {
          this.ui.renderPracticeKeyboard(getAllLetters(), this.currentWord[this.charIndex]);
          this.ui.renderPracticeWord(this.currentWord, this.charIndex);
          this.ui.setPracticeKeyFeedback(k, 'correct');
        }
      } else {
        this.recordWrong();
        this.ui.renderPracticeKeyboard(getAllLetters(), this.currentWord[this.charIndex]);
        this.ui.setPracticeKeyFeedback(k, 'wrong');
      }
    }

    this.updateHud();
    this.time.delayedCall(200, () => {
      if (this.sessionActive) this.ui.clearPracticeFeedback();
    });
  }

  private recordCorrect() {
    this.correctKeystrokes++;
    this.totalKeystrokes++;
    this.score++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    if (!this.sfx.isMuted) this.sfx.letterHit();
  }

  private recordWrong() {
    this.mistakes++;
    this.totalKeystrokes++;
    this.streak = 0;
    if (!this.sfx.isMuted) this.sfx.letterWrong();
  }

  private advanceWord() {
    this.currentWord = getRandomWord(this.currentWord);
    this.charIndex = 0;
    this.ui.renderPracticeKeyboard(getAllLetters(), this.currentWord[0]);
    this.ui.renderPracticeWord(this.currentWord, 0);
  }

  /* ---- FALLING WORDS ---- */

  private ensureFallFieldSize() {
    const field = document.getElementById('fall-field');
    if (!field) return;
    const rect = field.getBoundingClientRect();
    if (rect.width > 0) this.fallFieldW = rect.width;
    if (rect.height > 0) this.fallFieldH = rect.height;
  }

  private spawnFallWord() {
    if (this.fallWords.length >= FALL_MAX_WORDS) return;
    this.ensureFallFieldSize();
    if (this.fallFieldW < 40) return;

    const container = document.getElementById('fall-words');
    if (!container) return;

    const text = getRandomWord();
    const el = document.createElement('div');
    el.className = 'fall-word';
    container.appendChild(el);

    const estW = text.length * 13 + 8;
    const x = 8 + Math.random() * Math.max(1, this.fallFieldW - estW - 16);
    const speed = Math.min(
      FALL_MAX_SPEED,
      FALL_BASE_SPEED + (this.fallTimeAlive / 1000) * FALL_SPEED_RAMP
    );

    this.fallWords.push({
      text, el, x, y: -38, speed, charIndex: 0, removed: false,
    });

    const word = this.fallWords[this.fallWords.length - 1];
    this.renderFallWordChars(word);
    this.refreshFallWordPos(word);
    this.pickFallSpawnInterval();
  }

  private pickFallSpawnInterval() {
    this.fallNextSpawn = Math.max(
      FALL_MIN_INTERVAL,
      FALL_START_INTERVAL - (this.fallTimeAlive / 1000) * FALL_INTERVAL_RAMP
    );
  }

  private renderFallWordChars(word: FallWord) {
    let html = '';
    for (let i = 0; i < word.text.length; i++) {
      const cls = i < word.charIndex
        ? 'fallchar done'
        : i === word.charIndex
          ? 'fallchar current'
          : 'fallchar todo';
      html += `<span class="${cls}">${word.text[i]}</span>`;
    }
    word.el.innerHTML = html;
  }

  private refreshFallWordPos(word: FallWord) {
    word.el.style.transform = `translate(${word.x}px, ${word.y}px)`;
  }

  private getActiveFallWord(): FallWord | null {
    let best: FallWord | null = null;
    for (const w of this.fallWords) {
      if (w.removed || w.charIndex >= w.text.length) continue;
      if (!best || w.y > best.y) best = w;
    }
    return best;
  }

  private updateFallActive() {
    const active = this.getActiveFallWord();
    for (const w of this.fallWords) {
      w.el.classList.toggle('active', w === active);
    }
  }

  private removeFallWord(word: FallWord) {
    word.removed = true;
    word.el.remove();
    this.fallWords = this.fallWords.filter(w => !w.removed);
    this.updateFallActive();
  }

  private loseFallLife(word: FallWord) {
    this.fallLives--;
    if (!this.sfx.isMuted) this.sfx.playerHurt();
    this.cameras.main.shake(150, 0.008);
    this.removeFallWord(word);
    if (this.fallLives <= 0) this.endFallGame();
  }

  private endFallGame() {
    this.fallGameOver = true;
    this.sessionActive = false;

    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;

    const bestKey = 'typefight_best_fall_score';
    const prevBest = Number(localStorage.getItem(bestKey) ?? '0');
    const newBest = this.fallScore > prevBest;
    if (newBest) localStorage.setItem(bestKey, String(this.fallScore));

    this.sfx.defeat();
    const survived = Math.round((performance.now() - this.startTime) / 1000);
    this.ui.showPracticeResults({
      score: this.fallScore,
      raw: this.wordsTyped,
      words: survived,
      accuracy,
      mistakes: this.mistakes,
      bestStreak: this.bestStreak,
      newBest,
      title: 'GAME OVER',
    });
  }

  private updateHud(displaySecsOverride?: number) {
    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;

    let displaySecs: number;
    let minutes: number;
    if (displaySecsOverride !== undefined) {
      displaySecs = Math.max(0, displaySecsOverride);
      const elapsed = Math.max(1, TIMED_SECONDS - displaySecs);
      minutes = elapsed / 60;
    } else {
      const elapsed = Math.max(0.5, (performance.now() - this.startTime) / 1000);
      displaySecs = elapsed;
      minutes = elapsed / 60;
    }

    const wpm = minutes > 0 ? Math.round((this.correctKeystrokes / 5) / minutes) : 0;
    const targetKey = this.mode === 'letters' ? this.targetKey : '';

    this.ui.updatePracticeHud(
      targetKey, this.score, this.mistakes, wpm, accuracy, displaySecs, this.streak
    );
  }

  private endTimedTest() {
    this.sessionActive = false;
    const minutes = TIMED_SECONDS / 60;
    const rawWpm = this.totalKeystrokes / 5 / minutes;
    const netWpm = this.correctKeystrokes / 5 / minutes;
    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;

    const bestKey = 'typefight_best_wpm';
    const prevBest = Number(localStorage.getItem(bestKey) ?? '0');
    const newBest = netWpm > prevBest;
    if (newBest) localStorage.setItem(bestKey, String(Math.round(netWpm)));

    this.sfx.victory();
    this.ui.setPracticeMessage('TIME UP!', '#ff2442');
    this.ui.showPracticeResults({
      wpm: Math.round(netWpm),
      raw: Math.round(rawWpm),
      words: this.wordsTyped,
      accuracy,
      mistakes: this.mistakes,
      bestStreak: this.bestStreak,
      newBest,
    });
  }

  update(_time: number, _delta: number) {
    if (this.mode === 'timed' && this.sessionActive) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      if (elapsed >= TIMED_SECONDS) {
        this.updateHud(0);
        this.endTimedTest();
        return;
      }
      this.updateHud(TIMED_SECONDS - elapsed);
    } else if (this.mode === 'fall' && this.sessionActive && !this.fallGameOver) {
      const dt = Math.min(_delta, 50);
      this.fallTimeAlive += dt;
      this.ensureFallFieldSize();

      if (this.fallWords.length < FALL_MAX_WORDS) {
        if (this.fallNextSpawn <= 0) {
          this.spawnFallWord();
        } else {
          this.fallNextSpawn -= dt;
          if (this.fallNextSpawn <= 0) this.spawnFallWord();
        }
      }

      const dangerY = Math.max(10, this.fallFieldH - FALL_DANGER_OFFSET);
      const hits: FallWord[] = [];
      for (const w of this.fallWords) {
        w.y += w.speed * (dt / 1000);
        this.refreshFallWordPos(w);
        w.el.classList.toggle('danger', dangerY - w.y < 95);
        if (w.y >= dangerY) hits.push(w);
      }

      for (const w of hits) {
        if (w.removed || this.fallGameOver || !this.sessionActive) continue;
        this.loseFallLife(w);
      }

      if (!this.fallGameOver && this.sessionActive) {
        this.ui.renderPracticeFallHud(this.fallScore, this.fallLives, FALL_START_LIVES);
        this.updateHud();
      }
    } else if (this.sessionActive) {
      this.updateHud();
    }
  }

  shutdown() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.backListener) {
      document.getElementById('practice-back-btn')?.removeEventListener('click', this.backListener);
      this.backListener = null;
    }
    this.modeListeners.forEach(({ btn, cb }) => btn.removeEventListener('click', cb));
    this.modeListeners = [];
  }
}