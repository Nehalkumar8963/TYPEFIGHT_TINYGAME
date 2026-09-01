import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y,
  PLAYER_START_X, ENEMY_START_X, COMBAT_DISTANCE,
  MAX_PLAYER_HP, MAX_ENERGY,
  ENEMY_CONFIGS, DIFFICULTY_CONFIGS, COMBAT_MOVES,
  ENERGY_PER_HIT, ENERGY_SPECIAL_COST,
  PLAYER_SPRITE_CONFIG, LEVEL_CONFIGS, getLevelConfig,
} from '../config';
import type {
  Difficulty, EnemyType, EnemyState, FightStats, CombatMove, EnemyInstance, LevelConfig,
} from '../types';
import { PixelCharacter } from '../entities/PixelCharacter';
import { LetterEngine } from '../systems/LetterEngine';
import { CombatEngine } from '../systems/CombatEngine';
import { UIManager } from '../systems/UIManager';
import { SoundEngine } from '../systems/SoundEngine';
import { resetLetterPools } from '../letters';
import {
  drawSun, drawTorii, drawMountainRange, drawHanko, drawGrain,
  drawLantern, drawSeigaihaStrip, drawTatami, drawBamboo,
} from '../textures';

export class FightScene extends Phaser.Scene {
  private player!: PixelCharacter;
  private enemies: EnemyInstance[] = [];
  private letters!: LetterEngine;
  private combat!: CombatEngine;
  private ui!: UIManager;
  private sfx = SoundEngine.instance;

  private difficulty!: Difficulty;
  private enemyType!: EnemyType;
  private levelNum = 1;
  private levelConfig!: LevelConfig;
  private levelRoster: EnemyType[] | null = null;
  private diffConfig = DIFFICULTY_CONFIGS.normal;
  private enemyConfig = ENEMY_CONFIGS.fighter;

  private playerHp = MAX_PLAYER_HP;
  private energy = 0;
  private combo = 0;
  private maxCombo = 0;
  private wordsTyped = 0;
  private totalMistakes = 0;
  private totalDamage = 0;
  private startTime = 0;
  private gameOver = false;

  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private feverOverlay!: Phaser.GameObjects.Graphics;
  private feverActive = false;
  private feverTimer = 0;
  private energyWasFull = false;

  private movesUsed: Record<CombatMove, number> = {
    jab: 0, cross: 0, kick: 0, uppercut: 0, special: 0, haymaker: 0, finisher: 0,
    sweep: 0, roundhouse: 0, spinkick: 0,
  };
  private feverActivations = 0;

  constructor() {
    super('FightScene');
  }

  init(data: { difficulty: Difficulty; enemyType: EnemyType; level?: number; enemies?: EnemyType[] }) {
    this.difficulty = data.difficulty;
    this.enemyType = data.enemyType;
    this.levelNum = data.level || 1;
    this.levelConfig = getLevelConfig(this.levelNum);
    this.levelRoster = data.enemies && data.enemies.length > 0 ? data.enemies : null;
    this.diffConfig = DIFFICULTY_CONFIGS[this.difficulty];
    this.enemyConfig = ENEMY_CONFIGS[this.enemyType];
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.gameOver = false;
    this.playerHp = MAX_PLAYER_HP;
    this.energy = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.wordsTyped = 0;
    this.totalMistakes = 0;
    this.totalDamage = 0;
    this.startTime = performance.now();
    this.feverActive = false;
    this.feverTimer = 0;
    this.movesUsed = {
      jab: 0, cross: 0, kick: 0, uppercut: 0, special: 0, haymaker: 0, finisher: 0,
      sweep: 0, roundhouse: 0, spinkick: 0,
    };
    this.feverActivations = 0;
    this.enemies = [];

    resetLetterPools();

    this.letters = new LetterEngine();
    this.combat = new CombatEngine();
    this.ui = new UIManager();

    this.createArena();
    this.createCharacters();
    this.createFeverOverlay();
    this.setupInput();
    this.startUI();

    this.setupSfxToggle();
    this.ui.setMuted(this.sfx.isMuted);

    this.time.delayedCall(400, () => this.showIntro());
    this.time.delayedCall(1800, () => {
      if (!this.gameOver) this.startCombat();
    });
    this.staggerEnemyTimers();
  }

  private setupSfxToggle() {
    const btn = document.getElementById('sfx-toggle') as HTMLButtonElement | null;
    if (btn) {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.ui.setMuted(this.sfx.toggleMuted());
        if (!this.sfx.isMuted) this.sfx.uiClick();
      };
    }
  }

  private showIntro() {
    this.ui.showFightBanner(`LEVEL ${this.levelNum}`, this.levelConfig.name);
    this.sfx.fightBanner();
    this.time.delayedCall(900, () => {
      if (!this.gameOver) {
        this.ui.showFightBanner('FIGHT!');
        this.sfx.fightBanner();
      }
    });
  }

  private createArena() {
    const gfx = this.add.graphics();
    gfx.setDepth(0);

    const lc = this.levelConfig;
    const [bgR, bgG, bgB] = lc.bgGradient;

    // Gradient sky with subtle banding for arcade poster feel
    for (let y = 0; y < GROUND_Y; y += 3) {
      const t = y / GROUND_Y;
      const r = Math.floor(bgR + t * 14);
      const g = Math.floor(bgG + t * 10);
      const b = Math.floor(bgB + t * 20);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, y, GAME_WIDTH, 3);
    }

    // Big retro sun hugging the horizon
    drawSun(
      gfx,
      GAME_WIDTH - 220,
      GROUND_Y - 120,
      86,
      lc.accentColor,
      0.4
    );

    // Far mountain silhouettes (two depths)
    drawMountainRange(gfx, GROUND_Y, Phaser.Display.Color.GetColor(bgR + 30, bgG + 26, bgB + 40), 0.5, [
      { x: 120, w: 380, h: 150 },
      { x: 620, w: 460, h: 200 },
      { x: 1050, w: 320, h: 120 },
    ]);
    drawMountainRange(gfx, GROUND_Y, Phaser.Display.Color.GetColor(bgR + 16, bgG + 13, bgB + 22), 0.75, [
      { x: 40, w: 260, h: 100 },
      { x: 430, w: 300, h: 130 },
      { x: 820, w: 340, h: 150 },
      { x: 1120, w: 220, h: 80 },
    ]);

    // Faint torii on the horizon for temple-ish themes
    if (lc.theme === 'dojo' || lc.theme === 'temple' || lc.theme === 'palace') {
      drawTorii(gfx, GAME_WIDTH / 2, GROUND_Y, 1, 0x12070c, 0.35);
    }

    // Coarse grain gives the sky hand-drawn texture
    drawGrain(gfx, 0, 0, GAME_WIDTH, GROUND_Y, 0xffffff, 0.05, 220, lc.id * 17 + 3);

    // Faint perspective grid
    gfx.lineStyle(1, lc.accentColor, 0.06);
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GROUND_Y); gfx.strokePath();
    }
    for (let y = 0; y < GROUND_Y; y += 32) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    // Theme-specific background decorations
    this.drawThemeDecorations(gfx, lc);

    // Kanji hanko seals floating in the sky
    const seals: Array<[number, number, number, number]> = [
      [180, 90, 26, 0], [GAME_WIDTH - 190, 150, 26, 1], [540, 60, 20, 2],
    ];
    for (const [sx, sy, ss, sv] of seals) {
      drawHanko(gfx, sx, sy, ss, lc.accentColor, 0.14, sv + lc.id);
    }

    // ---- GROUND ----
    gfx.fillStyle(lc.groundColor);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    // Perspective depth bands on the top strip of the ground
    const perspOffsets = [6, 14, 26, 42, 62, 86];
    gfx.fillStyle(lc.accentColor, 0.1);
    for (const off of perspOffsets) {
      gfx.fillRect(0, GROUND_Y + off, GAME_WIDTH, 1);
    }

    // Ground accent lines
    gfx.fillStyle(lc.accentColor, 0.5);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, 3);
    gfx.fillStyle(lc.accentColor, 0.2);
    gfx.fillRect(0, GROUND_Y + 4, GAME_WIDTH, 2);

    // Tatami lattice for dojo/temple/palace, light tiles otherwise
    if (lc.theme === 'dojo' || lc.theme === 'temple' || lc.theme === 'palace') {
      drawTatami(gfx, 0, GROUND_Y + 8, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 8, lc.accentColor, 0.09, 26);
    } else {
      gfx.fillStyle(lc.accentColor, 0.1);
      for (let x = 0; x < GAME_WIDTH; x += 48) {
        gfx.fillRect(x + 6, GROUND_Y + 14, 22, 3);
      }
      for (let x = 24; x < GAME_WIDTH; x += 48) {
        gfx.fillRect(x + 4, GROUND_Y + 28, 16, 3);
      }
    }

    // Grain on the ground too
    drawGrain(gfx, 0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y, 0x000000, 0.12, 120, lc.id * 31 + 5);

    // Seigaiha wave strip at the very bottom
    drawSeigaihaStrip(gfx, 0, GAME_HEIGHT - 6, GAME_WIDTH, 16, lc.accentColor, 0.18);

    // Floating ember particles
    for (let i = 0; i < 20; i++) {
      const dot = this.add.graphics();
      dot.setDepth(1);
      const c = Phaser.Utils.Array.GetRandom(lc.starColors);
      dot.fillStyle(c, 0.2);
      dot.fillRect(
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        Phaser.Math.Between(30, GROUND_Y - 60),
        2, 2
      );
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.05, to: 0.4 },
        duration: Phaser.Math.Between(1200, 3000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // Sakura petals drifting for nature themes
    if (['dojo', 'temple', 'palace', 'dragon'].includes(lc.theme)) {
      for (let i = 0; i < 10; i++) {
        const petal = this.add.graphics();
        petal.setDepth(1);
        const px = Phaser.Math.Between(40, GAME_WIDTH - 40);
        const py = Phaser.Math.Between(20, GROUND_Y - 30);
        const pink = [0xff9fcf, 0xffc4dd, 0xff7bb8];
        petal.fillStyle(Phaser.Utils.Array.GetRandom(pink), Phaser.Math.FloatBetween(0.2, 0.5));
        petal.fillRect(0, 0, 4, 3);
        this.tweens.add({
          targets: petal,
          x: { from: px, to: px + Phaser.Math.Between(-70, 70) },
          y: { from: py, to: py + Phaser.Math.Between(60, 160) },
          duration: Phaser.Math.Between(4000, 8000),
          repeat: -1, yoyo: true,
          ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 3000),
        });
        this.tweens.add({
          targets: petal,
          alpha: { from: 0.2, to: 0.6 },
          duration: Phaser.Math.Between(1500, 3000),
          yoyo: true, repeat: -1,
        });
      }
    }
  }

  private drawThemeDecorations(gfx: Phaser.GameObjects.Graphics, lc: LevelConfig) {
    const themes: Record<string, () => void> = {
      dojo: () => {
        // Wooden pillars
        gfx.fillStyle(0x8b4513, 0.3);
        gfx.fillRect(80, 100, 12, GROUND_Y - 100);
        gfx.fillRect(GAME_WIDTH - 92, 100, 12, GROUND_Y - 100);
        // Bamboo grove
        drawBamboo(gfx, 220, GROUND_Y, 170, 0x2f7d3a, 0.4);
        drawBamboo(gfx, 240, GROUND_Y, 130, 0x2f7d3a, 0.32);
        drawBamboo(gfx, 980, GROUND_Y, 150, 0x2f7d3a, 0.4);
        drawBamboo(gfx, 1000, GROUND_Y, 180, 0x2f7d3a, 0.32);
        // Lantern
        drawLantern(gfx, GAME_WIDTH - 130, 120, 14, 0xff6600, 0.25);
      },
      alley: () => {
        // Brick walls
        gfx.fillStyle(0x3a2a1a, 0.3);
        for (let y = 60; y < GROUND_Y; y += 16) {
          for (let x = 0; x < 60; x += 24) { gfx.fillRect(x, y, 22, 14); }
          for (let x = GAME_WIDTH - 60; x < GAME_WIDTH; x += 24) { gfx.fillRect(x, y, 22, 14); }
        }
        // Neon signs
        gfx.fillStyle(0xff00ff, 0.1);
        gfx.fillRect(20, 120, 30, 15);
        gfx.fillStyle(0x00ffff, 0.08);
        gfx.fillRect(GAME_WIDTH - 50, 180, 30, 12);
        // Hanging lanterns
        drawLantern(gfx, 60, 60, 12, 0xff2442, 0.2);
        drawLantern(gfx, GAME_WIDTH - 60, 80, 12, 0xff2442, 0.2);
      },
      temple: () => {
        // Pagoda silhouette
        gfx.fillStyle(0x440022, 0.22);
        gfx.fillRect(40, 120, 60, GROUND_Y - 120);
        gfx.fillRect(30, 110, 80, 10);
        gfx.fillRect(20, 100, 100, 10);
        gfx.fillRect(12, 90, 116, 10);
        gfx.fillRect(GAME_WIDTH - 100, 150, 60, GROUND_Y - 150);
        gfx.fillRect(GAME_WIDTH - 110, 140, 80, 10);
        gfx.fillRect(GAME_WIDTH - 120, 130, 100, 10);
        // Floating lanterns
        drawLantern(gfx, 200, 80, 12, 0xff6600, 0.3);
        drawLantern(gfx, 600, 60, 12, 0xff6600, 0.22);
        drawLantern(gfx, 900, 90, 12, 0xff6600, 0.28);
        // Bell
        gfx.fillStyle(0xffd700, 0.16);
        gfx.fillRect(GAME_WIDTH - 210, 150, 18, 16);
        gfx.fillRect(GAME_WIDTH - 214, 146, 26, 4);
      },
      volcano: () => {
        // Lava streams
        gfx.fillStyle(0xff2200, 0.12);
        gfx.fillRect(100, GROUND_Y - 4, 3, 4);
        gfx.fillRect(400, GROUND_Y - 4, 2, 4);
        gfx.fillRect(700, GROUND_Y - 4, 4, 4);
        gfx.fillRect(1000, GROUND_Y - 4, 3, 4);
        // Smoke plumes
        for (let i = 0; i < 6; i++) {
          gfx.fillStyle(0x666666, 0.07);
          gfx.fillRect(110 + i * 14, 40 + Math.floor(Phaser.Math.Between(0, 20)), 14 + i * 2, 18);
        }
        gfx.fillStyle(0x3a3a3a, 0.1);
        gfx.fillRect(880, 50, 30, 26);
        gfx.fillRect(900, 30, 34, 20);
      },
      space: () => {
        // Stars
        for (let i = 0; i < 50; i++) {
          const sx = Phaser.Math.Between(0, GAME_WIDTH);
          const sy = Phaser.Math.Between(0, GROUND_Y - 20);
          const ss = Phaser.Math.Between(1, 3);
          gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
          gfx.fillRect(sx, sy, ss, ss);
        }
        // Planet
        gfx.fillStyle(0x0066cc, 0.14);
        gfx.fillCircle(GAME_WIDTH - 120, 100, 42);
        gfx.fillStyle(0x0044aa, 0.08);
        gfx.fillRect(GAME_WIDTH - 162, 98, 84, 4);
        // Shuttle silhouette
        gfx.fillStyle(0x222244, 0.5);
        gfx.fillRect(120, 200, 26, 6);
        gfx.fillRect(124, 190, 12, 12);
        gfx.fillRect(128, 206, 4, 8);
      },
      void: () => {
        // Swirling void energy
        for (let i = 0; i < 8; i++) {
          const vx = Phaser.Math.Between(100, GAME_WIDTH - 100);
          const vy = Phaser.Math.Between(50, GROUND_Y - 50);
          gfx.fillStyle(0x6a0dad, 0.06);
          gfx.fillCircle(vx, vy, Phaser.Math.Between(15, 35));
        }
        // Torn paper strips
        for (let i = 0; i < 4; i++) {
          gfx.fillStyle(0x2d1b4e, 0.25);
          gfx.fillRect(Phaser.Math.Between(100, GAME_WIDTH - 120), Phaser.Math.Between(80, 300), 3, 60);
        }
      },
      palace: () => {
        // Golden pillars
        gfx.fillStyle(0xffd700, 0.1);
        gfx.fillRect(100, 80, 10, GROUND_Y - 80);
        gfx.fillRect(GAME_WIDTH - 110, 80, 10, GROUND_Y - 80);
        gfx.fillRect(300, 120, 8, GROUND_Y - 120);
        gfx.fillRect(GAME_WIDTH - 308, 120, 8, GROUND_Y - 120);
        // Emblem
        gfx.fillStyle(0xffd700, 0.1);
        gfx.fillRect(GAME_WIDTH / 2 - 20, 46, 40, 8);
        gfx.fillRect(GAME_WIDTH / 2 - 15, 38, 30, 8);
        gfx.fillRect(GAME_WIDTH / 2 - 10, 32, 20, 6);
        // Roof curves at corners
        gfx.fillStyle(0xffd700, 0.08);
        gfx.fillRect(90, 92, 30, 4);
        gfx.fillRect(GAME_WIDTH - 120, 92, 30, 4);
      },
      throne: () => {
        // Demon pillars
        gfx.fillStyle(0x440000, 0.28);
        gfx.fillRect(60, 60, 16, GROUND_Y - 60);
        gfx.fillRect(GAME_WIDTH - 76, 60, 16, GROUND_Y - 60);
        // Foul flames at their bases
        gfx.fillStyle(0xff2200, 0.12);
        gfx.fillRect(56, GROUND_Y - 14, 24, 12);
        gfx.fillRect(GAME_WIDTH - 80, GROUND_Y - 14, 24, 12);
        // Red energy veins
        gfx.lineStyle(2, 0xff0000, 0.06);
        gfx.beginPath();
        gfx.moveTo(GAME_WIDTH / 2, 0);
        for (let vy = 0; vy < GROUND_Y; vy += 20) {
          gfx.lineTo(GAME_WIDTH / 2 + Math.sin(vy * 0.05) * 60, vy);
        }
        gfx.strokePath();
      },
      shadow: () => {
        // Shadow clones
        gfx.fillStyle(0x2d1b4e, 0.1);
        gfx.fillRect(350, 180, 16, 50);
        gfx.fillRect(800, 200, 14, 45);
        gfx.fillRect(500, 160, 12, 55);
        // Purple mist over ground
        gfx.fillStyle(0x9932cc, 0.05);
        gfx.fillRect(0, GROUND_Y - 30, GAME_WIDTH, 30);
        // Creepy distant eyes
        gfx.fillStyle(0xff00ff, 0.16);
        gfx.fillRect(300, 150, 3, 3);
        gfx.fillRect(320, 150, 3, 3);
        gfx.fillRect(860, 180, 3, 3);
        gfx.fillRect(886, 182, 3, 3);
      },
      dragon: () => {
        // Dragon scales on walls
        gfx.fillStyle(0x006400, 0.12);
        for (let dy = 60; dy < GROUND_Y; dy += 20) {
          for (let dx = 0; dx < 50; dx += 12) { gfx.fillCircle(dx + 6, dy + 10, 5); }
          for (let dx = GAME_WIDTH - 50; dx < GAME_WIDTH; dx += 12) { gfx.fillCircle(dx + 6, dy + 10, 5); }
        }
        // Fire breath glow
        gfx.fillStyle(0xff4500, 0.07);
        gfx.fillCircle(GAME_WIDTH / 2, GROUND_Y - 80, 60);
        // Treasure pile
        gfx.fillStyle(0xffd700, 0.2);
        gfx.fillRect(120, GROUND_Y - 18, 34, 8);
        gfx.fillRect(130, GROUND_Y - 26, 16, 10);
        gfx.fillStyle(0x00ffff, 0.2);
        gfx.fillRect(140, GROUND_Y - 22, 8, 6);
      },
    };
    const draw = themes[lc.theme];
    if (draw) draw();
  }

  private createCharacters() {
    this.player = new PixelCharacter(this, PLAYER_START_X, GROUND_Y, PLAYER_SPRITE_CONFIG, true);

    const roster = this.levelRoster ?? Array.from(
      { length: this.diffConfig.enemyCount || 1 },
      () => this.enemyType
    );
    const spacing = roster.length <= 1 ? 0 : 130;
    for (let i = 0; i < roster.length; i++) {
      const type = roster[i];
      const cfg = ENEMY_CONFIGS[type];
      const startX = ENEMY_START_X + (i - (roster.length - 1) / 2) * spacing;
      const enemy = new PixelCharacter(this, startX, GROUND_Y, cfg.sprite, false);
      this.enemies.push({
        type,
        character: enemy,
        config: cfg,
        hp: cfg.maxHp,
        maxHp: cfg.maxHp,
        state: 'idle',
        x: startX,
        startX,
        targetX: PLAYER_START_X + COMBAT_DISTANCE,
        approachTween: null,
        retreatTween: null,
        attackTimer: null,
        canStagger: true,
      });
    }
  }

  private createFeverOverlay() {
    this.feverOverlay = this.add.graphics();
    this.feverOverlay.setDepth(20);
    this.feverOverlay.setAlpha(0);
  }

  private setupInput() {
    this.keyHandler = (e: KeyboardEvent) => this.handleKey(e);
    document.addEventListener('keydown', this.keyHandler);
  }

  private startUI() {
    this.ui.showHud();
    this.ui.renderFightKeyboard();
    this.ui.setEnemyName(
      this.levelRoster && this.levelRoster.length > 1 ? 'HOSTILES' : this.enemyConfig.name
    );
    this.ui.setLevelInfo(this.levelNum, this.levelConfig.name);
    this.ui.updatePlayerHp(this.playerHp, MAX_PLAYER_HP);
    this.ui.renderEnemyHp(this.enemies);
    this.ui.updateCombo(0);
    this.ui.updateWpm(0);
    this.ui.updateAccuracy(100);
    this.ui.updateEnergy(0, MAX_ENERGY);
    this.ui.updateDistance(ENEMY_START_X - PLAYER_START_X);
    this.ui.updateMode('normal');
    this.ui.renderLetterQueue([]);
  }

  private startCombat() {
    if (this.gameOver) return;
    this.letters.start(
      this.diffConfig.letterSpawnInterval || 1050,
      this.diffConfig.letterTimeWindow || 1800
    );
  }

  /* ---- TARGETING ---- */

  private getLivingEnemies(): EnemyInstance[] {
    return this.enemies.filter(e => e.hp > 0);
  }

  private getClosestEnemy(): EnemyInstance | null {
    const living = this.getLivingEnemies();
    if (living.length === 0) return null;
    let closest: EnemyInstance = living[0];
    let minDist = Infinity;
    for (const e of living) {
      const d = Math.abs(e.x - PLAYER_START_X);
      if (d < minDist) { minDist = d; closest = e; }
    }
    return closest;
  }

  /* ---- INPUT ---- */

  private handleKey(e: KeyboardEvent) {
    if (this.gameOver) return;

    if (e.key === ' ' && this.energy >= ENERGY_SPECIAL_COST) {
      e.preventDefault();
      this.triggerSpecialAttack();
      return;
    }

    if (!this.letters.isActive) return;

    const result = this.letters.handleKey(e.key);

    if (result.hit && result.move) {
      this.onMoveHit(result.move);
    } else if (!result.hit && !result.missed) {
      this.sfx.letterWrong();
      this.totalMistakes++;
      this.combo = 0;
      this.ui.updateCombo(0);
      (this.letters as any).combo = 0;
    }
  }

  /* ---- PLAYER MOVE ---- */

  private onMoveHit(move: CombatMove) {
    const target = this.getClosestEnemy();
    if (!target) return;

    const isFever = this.feverActive;
    const damage = this.combat.calculateDamage(move, this.combo, isFever);

    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.wordsTyped++;
    this.movesUsed[move]++;

    this.energy = Math.min(MAX_ENERGY, this.energy + ENERGY_PER_HIT + this.combo);

    const actualDmg = Math.min(target.hp, damage.amount);
    target.hp -= actualDmg;
    this.totalDamage += actualDmg;

    const moveCfg = COMBAT_MOVES[move];
    this.player.play(moveCfg.animName);
    const enemyChar = target.character as PixelCharacter;

    const enemyX = enemyChar.x;
    const enemyY = enemyChar.y;

    if (damage.isCritical) {
      this.cameras.main.shake(200, 0.015);
      this.sfx.crit();
      this.spawnShockwave(enemyX, enemyY - 45, moveCfg.color);
      this.spawnSlash(this.player.x, enemyX, enemyY - 45, moveCfg.color);
      this.spawnHitParticles(enemyX, enemyY - 40, 14, moveCfg.color);
      this.ui.showDamageNumber(enemyX, enemyY - 90, damage.amount, 'critical');
      this.ui.showComboPopup(enemyX, enemyY - 120, 'CRITICAL!');
      this.cameras.main.flash(100, 255, 255, 255, false, undefined, undefined);
    } else {
      this.sfx.enemyHurt();
      this.spawnSlash(this.player.x, enemyX, enemyY - 45, moveCfg.color);
      this.spawnHitParticles(enemyX, enemyY - 40, 6, moveCfg.color);
      this.ui.showDamageNumber(enemyX, enemyY - 80, damage.amount, 'normal');
    }

    this.sfx.letterHit();
    this.sfx.comboRise(this.combo);

    if (damage.isSpecial) {
      this.sfx.specialAttack();
      this.spawnShockwave(enemyX, enemyY - 45, 0x00ffff);
      this.ui.showComboPopup(enemyX, enemyY - 110, 'SPECIAL!');
    }

    if (this.combo >= 3 && this.combo % 5 === 0) {
      this.sfx.comboMilestone();
      this.ui.showComboPopup(this.player.x + 60, this.player.y - 100, `x${this.combo} COMBO`);
    }

    enemyChar.play('hurt');
    enemyChar.flash();

    if (target.state === 'approaching' && damage.amount > 10 && target.canStagger) {
      this.sfx.stagger();
      this.staggerEnemy(target);
    }

    // If enemy died
    if (target.hp <= 0) {
      this.sfx.enemyDead();
      enemyChar.play('defeat');
      if (this.getLivingEnemies().length === 0) {
        this.onFightEnd(true);
        return;
      }
    }

    this.ui.renderEnemyHp(this.enemies);
    this.ui.updateCombo(this.combo);
    this.ui.updateEnergy(this.energy, MAX_ENERGY);
    this.ui.updateWpm(this.letters.getWpm());
    this.ui.updateAccuracy(this.letters.getAccuracy());
    this.ui.renderLetterQueue(this.letters.letters);
    this.ui.updateMode(this.letters.mode);

    this.checkModeTransition();
  }

  private checkModeTransition() {
    const prevFever = this.feverActive;
    this.feverActive = this.letters.mode === 'fever';

    if (this.feverActive && !prevFever) {
      this.feverActivations++;
      this.sfx.furyTrigger();
      this.cameras.main.flash(300, 0, 255, 255, false);
      this.tweens.add({ targets: this.feverOverlay, alpha: 0.15, duration: 300 });
      this.player.setAura(0x00ffff);
      this.ui.showComboPopup(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'FEVER MODE!');
    } else if (!this.feverActive && prevFever) {
      this.player.setAura(null);
      this.tweens.add({ targets: this.feverOverlay, alpha: 0, duration: 300 });
    }
  }

  private triggerSpecialAttack() {
    this.energy -= ENERGY_SPECIAL_COST;
    this.letters.deactivate();

    const targets = this.getLivingEnemies();
    if (targets.length === 0) return;

    const specialDmg = Math.round(35 + this.combo * 2);
    let total = 0;

    this.sfx.specialAttack();
    this.player.play('special', () => {
      for (const t of targets) {
        const actualDmg = Math.min(t.hp, specialDmg);
        t.hp -= actualDmg;
        total += actualDmg;
        (t.character as PixelCharacter).play('hurt');
        (t.character as PixelCharacter).flash();
      }
      this.totalDamage += total;

      this.cameras.main.shake(400, 0.025);
      for (const t of targets) {
        const ec = t.character as PixelCharacter;
        this.spawnShockwave(ec.x, ec.y - 45, 0x00ffff);
        this.spawnHitParticles(ec.x, ec.y - 40, 20, 0x00ffff);
      }
      this.ui.showDamageNumber(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, total, 'special');
      this.ui.showComboPopup(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, 'ULTRA ATTACK!');

      this.ui.renderEnemyHp(this.enemies);
      this.ui.updateEnergy(this.energy, MAX_ENERGY);

      const remaining = this.getLivingEnemies();
      if (remaining.length === 0) {
        this.onFightEnd(true);
        return;
      }

      this.time.delayedCall(400, () => {
        if (!this.gameOver) this.startCombat();
      });
    });
  }

  private staggerEnemy(target: EnemyInstance) {
    const enemyChar = target.character as PixelCharacter;
    if ((target.approachTween as Phaser.Tweens.Tween | null)) {
      (target.approachTween as Phaser.Tweens.Tween).stop();
      target.approachTween = null;
    }

    target.state = 'hurt';
    target.canStagger = false;

    const pushTarget = Math.min(target.x + 60, target.startX);
    this.tweens.add({
      targets: enemyChar,
      x: pushTarget,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (target.hp <= 0) return;
        target.state = 'idle';
        this.scheduleEnemyAttack(target);
      },
    });
  }

  /* ---- ENEMY AI ---- */

  private staggerEnemyTimers() {
    const living = this.getLivingEnemies();
    living.forEach((e, i) => {
      this.scheduleEnemyAttack(e, i * 1200);
    });
  }

  private scheduleEnemyAttack(enemy: EnemyInstance, initialDelay = 0) {
    if (this.gameOver || enemy.hp <= 0) return;
    if (enemy.attackTimer) {
      (enemy.attackTimer as Phaser.Time.TimerEvent).destroy();
    }

    const interval = enemy.config.attackInterval * this.diffConfig.enemyIntervalMult;
    enemy.attackTimer = this.time.addEvent({
      delay: initialDelay + interval,
      callback: () => this.startEnemyApproach(enemy),
      loop: false,
    });
  }

  private startEnemyApproach(enemy: EnemyInstance) {
    if (this.gameOver || enemy.hp <= 0 || enemy.state !== 'idle') return;
    enemy.state = 'approaching';
    enemy.canStagger = true;

    const targetX = PLAYER_START_X + COMBAT_DISTANCE;
    const distance = enemy.x - targetX;
    const speed = enemy.config.approachSpeed * this.diffConfig.enemySpeedMult;
    const duration = Math.max(500, (distance / speed) * 1000);

    const enemyChar = enemy.character as PixelCharacter;
    enemyChar.play('walk');

    enemy.approachTween = this.tweens.add({
      targets: enemyChar,
      x: targetX,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        if (this.getClosestEnemy() === enemy) {
          this.ui.updateDistance(Math.max(0, enemyChar.x - this.player.x));
        }
      },
      onComplete: () => {
        enemy.approachTween = null;
        if (enemy.state === 'approaching' && enemy.hp > 0) {
          this.performEnemyAttack(enemy);
        }
      },
    });
  }

  private performEnemyAttack(enemy: EnemyInstance) {
    if (this.gameOver || enemy.hp <= 0) return;
    enemy.state = 'attacking';
    const dmg = this.combat.calculateEnemyDamage(
      enemy.config.attackDamage, this.diffConfig.enemyDamageMult, false
    );

    const enemyChar = enemy.character as PixelCharacter;
    enemyChar.play('jab', () => {
      if (this.gameOver || enemy.hp <= 0) return;
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.sfx.playerHurt();
      this.ui.updatePlayerHp(this.playerHp, MAX_PLAYER_HP);
      this.player.play('hurt');
      this.player.flash();

      this.ui.showDamageNumber(this.player.x, this.player.y - 80, dmg, 'normal');
      this.spawnHitParticles(this.player.x, this.player.y - 40, 8, 0xff2442);
      this.spawnShockwave(this.player.x, this.player.y - 45, 0xff2442);

      this.combo = 0;
      this.ui.updateCombo(0);
      (this.letters as any).combo = 0;

      if (this.playerHp <= 0) {
        this.onFightEnd(false);
        return;
      }
      this.time.delayedCall(300, () => this.startEnemyRetreat(enemy));
    });
  }

  private startEnemyRetreat(enemy: EnemyInstance) {
    if (this.gameOver || enemy.hp <= 0) return;
    enemy.state = 'retreating';

    const enemyChar = enemy.character as PixelCharacter;
    enemyChar.play('walk');

    enemy.retreatTween = this.tweens.add({
      targets: enemyChar,
      x: enemy.startX,
      duration: 1200,
      ease: 'Power2',
      onUpdate: () => {
        if (this.getClosestEnemy() === enemy) {
          this.ui.updateDistance(Math.max(0, enemyChar.x - this.player.x));
        }
      },
      onComplete: () => {
        enemy.retreatTween = null;
        if (enemy.hp <= 0) return;
        enemy.state = 'idle';
        this.ui.updateDistance(ENEMY_START_X - PLAYER_START_X);
        this.scheduleEnemyAttack(enemy);
      },
    });
  }

  /* ---- PARTICLES ---- */

  private spawnHitParticles(x: number, y: number, count: number, color: number) {
    for (let i = 0; i < count; i++) {
      const p = this.add.graphics();
      p.setDepth(15);
      p.fillStyle(color, 1);
      const size = Phaser.Math.Between(2, 5);
      p.fillRect(-size / 2, -size / 2, size, size);
      p.x = x;
      p.y = y;

      const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
      const speed = Phaser.Math.Between(80, 280);
      const tx = Math.cos(angle) * speed;
      const ty = Math.sin(angle) * speed;

      this.tweens.add({
        targets: p,
        x: x + tx, y: y + ty,
        alpha: 0,
        duration: Phaser.Math.Between(250, 550),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Gravity-embers burst
    for (let i = 0; i < Math.floor(count / 2); i++) {
      const p = this.add.graphics();
      p.setDepth(14);
      p.fillStyle(color, 0.8);
      const size = Phaser.Math.Between(1, 3);
      p.fillRect(-size / 2, -size / 2, size, size);
      p.x = x + Phaser.Math.Between(-20, 20);
      p.y = y;

      const vy0 = Phaser.Math.FloatBetween(-220, -80);
      const vx0 = Phaser.Math.FloatBetween(-120, 120);
      this.tweens.add({
        targets: p,
        y: p.y + 220,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeIn',
        onUpdate: () => { p.x += vx0 * 0.016; p.y = Math.max(p.y + vy0 * 0.016, y - 60); },
        onComplete: () => p.destroy(),
      });
    }
  }

  private spawnSlash(fromX: number, toX: number, y: number, color: number) {
    const g = this.add.graphics();
    g.setDepth(14);
    const dir = toX >= fromX ? 1 : -1;
    const len = Math.abs(toX - fromX) + 40;
    g.x = (fromX + toX) / 2;
    g.y = y;

    const lineY = Phaser.Math.Between(-20, 10);
    g.lineStyle(6, color, 0.55);
    g.lineBetween(-len / 2, lineY, 0, lineY - 4);
    g.lineStyle(3, 0xffffff, 0.55);
    g.lineBetween(-len / 2, lineY, 0, lineY - 4);
    g.scaleX = dir;

    this.tweens.add({
      targets: g,
      x: g.x + dir * len * 0.15,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  private spawnShockwave(x: number, y: number, color: number) {
    const g = this.add.graphics();
    g.setDepth(14);
    g.x = x;
    g.y = y;
    g.lineStyle(4, color, 0.9);
    g.strokeEllipse(0, 0, 8, 8);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeEllipse(0, 0, 14, 14);

    let radius = 8;
    const wave = this.time.addEvent({
      repeat: 13,
      delay: 20,
      callback: () => {
        radius += 10;
        g.clear();
        g.lineStyle(4, color, Math.max(0, 0.9 - radius * 0.012));
        g.strokeEllipse(0, 0, radius * 2, radius * 2);
        g.lineStyle(2, 0xffffff, Math.max(0, 0.6 - radius * 0.01));
        g.strokeEllipse(0, 0, radius * 2 + 8, radius * 2 + 8);
      },
    });
    this.time.delayedCall(300, () => {
      wave.destroy();
      g.destroy();
    });
  }

  /* ---- GAME END ---- */

  private onFightEnd(victory: boolean) {
    if (this.gameOver) return;
    this.gameOver = true;

    if (victory) this.sfx.victory();
    else this.sfx.defeat();

    this.letters.deactivate();
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    this.enemies.forEach(e => {
      if (e.attackTimer) (e.attackTimer as Phaser.Time.TimerEvent).destroy();
      if (e.approachTween) (e.approachTween as Phaser.Tweens.Tween).stop();
      if (e.retreatTween) (e.retreatTween as Phaser.Tweens.Tween).stop();
    });

    if (victory) {
      this.getLivingEnemies().forEach(e => (e.character as PixelCharacter).play('defeat'));
      this.player.play('victory');
    } else {
      this.player.play('defeat');
      for (const e of this.enemies) {
        if (e.hp > 0) (e.character as PixelCharacter).play('victory');
      }
    }

    this.tweens.add({ targets: this.feverOverlay, alpha: 0, duration: 300 });

    const elapsed = (performance.now() - this.startTime) / 1000;
    const stats: FightStats = {
      wpm: this.letters.getWpm(),
      accuracy: this.letters.getAccuracy(),
      damageDealt: this.totalDamage,
      maxCombo: this.maxCombo,
      wordsTyped: this.wordsTyped,
      mistakes: this.totalMistakes,
      time: elapsed,
      grade: 'D',
      victory,
      movesUsed: { ...this.movesUsed },
      feverActivations: this.feverActivations,
      enemyType: this.enemyType,
      difficulty: this.difficulty,
      level: this.levelNum,
    };
    stats.grade = this.combat.calculateGrade(stats);

    this.time.delayedCall(1800, () => {
      this.scene.start('ResultScene', stats);
    });
  }

  update(_time: number, delta: number) {
    if (this.gameOver) {
      this.player.update(delta);
      this.enemies.forEach(e => (e.character as PixelCharacter).update(delta));
      return;
    }

    this.letters.update(delta);

    if (this.letters.isActive) {
      this.ui.renderLetterQueue(this.letters.letters);

      if (this.letters.currentCombo === 0 && this.letters.letters.length === 0) {
        this.time.delayedCall(200, () => {
          if (!this.gameOver && this.letters.isActive) this.startCombat();
        });
      }
    }

    if (this.feverActive) {
      const t = (Date.now() % 2000) / 2000;
      const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
      this.feverOverlay.clear();
      this.feverOverlay.fillStyle(0x00ffff, 0.03 + pulse * 0.04);
      this.feverOverlay.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

      // Speed lines
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        const sx = GAME_WIDTH - ((now * (0.08 + i * 0.017)) % (GAME_WIDTH * 1.4)) + 120;
        const sy = (i * 97 + now * 0.01) % (GROUND_Y - 40);
        this.feverOverlay.fillStyle(0x00ffff, 0.12);
        this.feverOverlay.fillRect(sx, sy, 18, 2);
        this.feverOverlay.fillRect(sx, sy + 8, 11, 2);
      }
    }

    // Energy full -> ready sound (once)
    if (this.energy >= MAX_ENERGY && this.energyWasFull !== true) {
      this.energyWasFull = true;
      this.sfx.specialReady();
    } else if (this.energy < MAX_ENERGY && this.energyWasFull !== false) {
      this.energyWasFull = false;
    }

    // Autofight aura
    if (this.letters.mode === 'autofight' && !this.feverActive) {
      this.player.setAura(0xff6600);
    } else if (this.letters.mode === 'normal' && !this.feverActive) {
      this.player.setAura(null);
    }

    const closest = this.getClosestEnemy();
    if (closest && (closest.state === 'idle' || closest.state === 'retreating')) {
      const dist = Math.abs(closest.x - this.player.x);
      this.ui.updateDistance(dist);
    }

    this.player.setHp(this.playerHp / MAX_PLAYER_HP);
    this.player.update(delta);
    for (const e of this.enemies) {
      const ec = e.character as PixelCharacter;
      ec.setHp(e.hp / e.maxHp);
      ec.update(delta);
    }
  }

  shutdown() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    this.enemies.forEach(e => {
      if (e.attackTimer) (e.attackTimer as Phaser.Time.TimerEvent).destroy();
      if (e.approachTween) (e.approachTween as Phaser.Tweens.Tween).stop();
      if (e.retreatTween) (e.retreatTween as Phaser.Tweens.Tween).stop();
    });
    if (this.player) this.player.destroy();
    this.enemies.forEach(e => (e.character as PixelCharacter).destroy());
    this.ui.clearDamageNumbers();
  }
}
