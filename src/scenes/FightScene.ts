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

    // Gradient sky
    for (let y = 0; y < GROUND_Y; y += 3) {
      const t = y / GROUND_Y;
      const r = Math.floor(bgR + t * 12);
      const g = Math.floor(bgG + t * 8);
      const b = Math.floor(bgB + t * 16);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, y, GAME_WIDTH, 3);
    }

    // Grid lines
    gfx.lineStyle(1, lc.accentColor, 0.08);
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GROUND_Y); gfx.strokePath();
    }
    for (let y = 0; y < GROUND_Y; y += 32) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    // Theme-specific background decorations
    this.drawThemeDecorations(gfx, lc);

    // Ground
    gfx.fillStyle(lc.groundColor);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    // Ground accent line
    gfx.fillStyle(lc.accentColor, 0.45);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, 2);
    gfx.fillStyle(lc.accentColor, 0.2);
    gfx.fillRect(0, GROUND_Y + 2, GAME_WIDTH, 2);

    // Ground tile pattern
    gfx.fillStyle(lc.accentColor, 0.12);
    for (let x = 0; x < GAME_WIDTH; x += 48) {
      gfx.fillRect(x, GROUND_Y + 8, 24, 2);
    }
    for (let x = 24; x < GAME_WIDTH; x += 48) {
      gfx.fillRect(x, GROUND_Y + 20, 16, 2);
    }

    // Floating particles
    for (let i = 0; i < 25; i++) {
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
  }

  private drawThemeDecorations(gfx: Phaser.GameObjects.Graphics, lc: LevelConfig) {
    switch (lc.theme) {
      case 'dojo': {
        // Wooden pillars
        gfx.fillStyle(0x8b4513, 0.3);
        gfx.fillRect(80, 100, 12, GROUND_Y - 100);
        gfx.fillRect(GAME_WIDTH - 92, 100, 12, GROUND_Y - 100);
        // Torii gate outline
        gfx.fillStyle(0xcc3333, 0.15);
        gfx.fillRect(60, 80, GAME_WIDTH - 120, 6);
        gfx.fillRect(70, 86, 6, 40);
        gfx.fillRect(GAME_WIDTH - 76, 86, 6, 40);
        break;
      }
      case 'alley': {
        // Brick walls
        gfx.fillStyle(0x3a2a1a, 0.3);
        for (let y = 60; y < GROUND_Y; y += 16) {
          for (let x = 0; x < 60; x += 24) {
            gfx.fillRect(x, y, 22, 14);
          }
          for (let x = GAME_WIDTH - 60; x < GAME_WIDTH; x += 24) {
            gfx.fillRect(x, y, 22, 14);
          }
        }
        // Neon signs
        gfx.fillStyle(0xff00ff, 0.1);
        gfx.fillRect(20, 120, 30, 15);
        gfx.fillStyle(0x00ffff, 0.08);
        gfx.fillRect(GAME_WIDTH - 50, 180, 30, 12);
        break;
      }
      case 'temple': {
        // Pagoda silhouettes
        gfx.fillStyle(0x440022, 0.2);
        gfx.fillRect(40, 120, 60, GROUND_Y - 120);
        gfx.fillRect(30, 110, 80, 10);
        gfx.fillRect(20, 100, 100, 10);
        gfx.fillRect(GAME_WIDTH - 100, 150, 60, GROUND_Y - 150);
        gfx.fillRect(GAME_WIDTH - 110, 140, 80, 10);
        // Floating lanterns
        gfx.fillStyle(0xff6600, 0.15);
        gfx.fillRect(200, 80, 8, 12);
        gfx.fillRect(600, 60, 8, 12);
        gfx.fillRect(900, 90, 8, 12);
        break;
      }
      case 'volcano': {
        // Lava streams
        gfx.fillStyle(0xff2200, 0.1);
        gfx.fillRect(100, GROUND_Y - 4, 3, 4);
        gfx.fillRect(400, GROUND_Y - 4, 2, 4);
        gfx.fillRect(700, GROUND_Y - 4, 4, 4);
        gfx.fillRect(1000, GROUND_Y - 4, 3, 4);
        // Smoke particles
        gfx.fillStyle(0x666666, 0.08);
        gfx.fillRect(120, 60, 20, 30);
        gfx.fillRect(900, 40, 25, 35);
        break;
      }
      case 'space': {
        // Stars
        for (let i = 0; i < 40; i++) {
          const sx = Phaser.Math.Between(0, GAME_WIDTH);
          const sy = Phaser.Math.Between(0, GROUND_Y - 20);
          const ss = Phaser.Math.Between(1, 3);
          gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
          gfx.fillRect(sx, sy, ss, ss);
        }
        // Planet
        gfx.fillStyle(0x0066cc, 0.12);
        gfx.fillCircle(GAME_WIDTH - 120, 100, 40);
        gfx.fillStyle(0x0044aa, 0.08);
        gfx.fillRect(GAME_WIDTH - 160, 98, 80, 4);
        break;
      }
      case 'void': {
        // Swirling void energy
        for (let i = 0; i < 8; i++) {
          const vx = Phaser.Math.Between(100, GAME_WIDTH - 100);
          const vy = Phaser.Math.Between(50, GROUND_Y - 50);
          gfx.fillStyle(0x6a0dad, 0.06);
          gfx.fillCircle(vx, vy, Phaser.Math.Between(15, 35));
        }
        break;
      }
      case 'palace': {
        // Golden pillars
        gfx.fillStyle(0xffd700, 0.1);
        gfx.fillRect(100, 80, 10, GROUND_Y - 80);
        gfx.fillRect(GAME_WIDTH - 110, 80, 10, GROUND_Y - 80);
        gfx.fillRect(300, 120, 8, GROUND_Y - 120);
        gfx.fillRect(GAME_WIDTH - 308, 120, 8, GROUND_Y - 120);
        // Crown emblem
        gfx.fillStyle(0xffd700, 0.08);
        gfx.fillRect(GAME_WIDTH / 2 - 20, 40, 40, 8);
        gfx.fillRect(GAME_WIDTH / 2 - 15, 32, 30, 8);
        gfx.fillRect(GAME_WIDTH / 2 - 10, 26, 20, 6);
        break;
      }
      case 'throne': {
        // Demon pillars with skulls
        gfx.fillStyle(0x440000, 0.25);
        gfx.fillRect(60, 60, 16, GROUND_Y - 60);
        gfx.fillRect(GAME_WIDTH - 76, 60, 16, GROUND_Y - 60);
        // Red energy veins
        gfx.lineStyle(2, 0xff0000, 0.06);
        gfx.beginPath();
        gfx.moveTo(GAME_WIDTH / 2, 0);
        for (let vy = 0; vy < GROUND_Y; vy += 20) {
          gfx.lineTo(GAME_WIDTH / 2 + Math.sin(vy * 0.05) * 60, vy);
        }
        gfx.strokePath();
        break;
      }
      case 'shadow': {
        // Shadow clones
        gfx.fillStyle(0x2d1b4e, 0.08);
        gfx.fillRect(350, 180, 16, 50);
        gfx.fillRect(800, 200, 14, 45);
        gfx.fillRect(500, 160, 12, 55);
        // Purple mist
        gfx.fillStyle(0x9932cc, 0.04);
        gfx.fillRect(0, GROUND_Y - 20, GAME_WIDTH, 20);
        break;
      }
      case 'dragon': {
        // Dragon scales on walls
        gfx.fillStyle(0x006400, 0.1);
        for (let dy = 60; dy < GROUND_Y; dy += 20) {
          for (let dx = 0; dx < 50; dx += 12) {
            gfx.fillCircle(dx + 6, dy + 10, 5);
          }
          for (let dx = GAME_WIDTH - 50; dx < GAME_WIDTH; dx += 12) {
            gfx.fillCircle(dx + 6, dy + 10, 5);
          }
        }
        // Fire breath glow
        gfx.fillStyle(0xff4500, 0.06);
        gfx.fillCircle(GAME_WIDTH / 2, GROUND_Y - 80, 60);
        break;
      }
    }
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
