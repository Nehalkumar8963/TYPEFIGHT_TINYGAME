import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y,
  PLAYER_START_X, ENEMY_START_X, COMBAT_DISTANCE,
  MAX_PLAYER_HP, MAX_ENERGY,
  ENEMY_CONFIGS, DIFFICULTY_CONFIGS, COMBAT_MOVES,
  ENERGY_PER_HIT, ENERGY_SPECIAL_COST,
  PLAYER_SPRITE_CONFIG,
} from '../config';
import type {
  Difficulty, EnemyType, EnemyState, FightStats, CombatMove, EnemyInstance,
} from '../types';
import { PixelCharacter } from '../entities/PixelCharacter';
import { LetterEngine } from '../systems/LetterEngine';
import { CombatEngine } from '../systems/CombatEngine';
import { UIManager } from '../systems/UIManager';
import { resetLetterPools } from '../letters';

export class FightScene extends Phaser.Scene {
  private player!: PixelCharacter;
  private enemies: EnemyInstance[] = [];
  private letters!: LetterEngine;
  private combat!: CombatEngine;
  private ui!: UIManager;

  private difficulty!: Difficulty;
  private enemyType!: EnemyType;
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

  private movesUsed: Record<CombatMove, number> = {
    jab: 0, cross: 0, kick: 0, uppercut: 0, special: 0, haymaker: 0, finisher: 0,
  };
  private feverActivations = 0;

  constructor() {
    super('FightScene');
  }

  init(data: { difficulty: Difficulty; enemyType: EnemyType }) {
    this.difficulty = data.difficulty;
    this.enemyType = data.enemyType;
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
    this.movesUsed = { jab: 0, cross: 0, kick: 0, uppercut: 0, special: 0, haymaker: 0, finisher: 0 };
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

    this.time.delayedCall(600, () => this.startCombat());
    this.staggerEnemyTimers();
  }

  private createArena() {
    const gfx = this.add.graphics();
    gfx.setDepth(0);

    for (let y = 0; y < GROUND_Y; y += 3) {
      const t = y / GROUND_Y;
      const r = Math.floor(10 + t * 8);
      const g2 = Math.floor(10 + t * 6);
      const b = Math.floor(27 + t * 12);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g2, b));
      gfx.fillRect(0, y, GAME_WIDTH, 3);
    }

    gfx.lineStyle(1, 0x1a1a3e, 0.15);
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GROUND_Y); gfx.strokePath();
    }
    for (let y = 0; y < GROUND_Y; y += 32) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    gfx.fillStyle(0x1a1a2e);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    gfx.fillStyle(0x39ff14, 0.35);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, 2);
    gfx.fillStyle(0x39ff14, 0.15);
    gfx.fillRect(0, GROUND_Y + 2, GAME_WIDTH, 2);

    gfx.fillStyle(0x2a2a4e, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 48) {
      gfx.fillRect(x, GROUND_Y + 8, 24, 2);
    }
    for (let x = 24; x < GAME_WIDTH; x += 48) {
      gfx.fillRect(x, GROUND_Y + 20, 16, 2);
    }

    for (let i = 0; i < 20; i++) {
      const dot = this.add.graphics();
      dot.setDepth(1);
      const c = Phaser.Utils.Array.GetRandom([0x39ff14, 0x00ffff, 0xff00ff]);
      dot.fillStyle(c, 0.2);
      dot.fillRect(
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        Phaser.Math.Between(30, GROUND_Y - 60),
        2, 2
      );
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.05, to: 0.35 },
        duration: Phaser.Math.Between(1200, 3000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  private createCharacters() {
    this.player = new PixelCharacter(this, PLAYER_START_X, GROUND_Y, PLAYER_SPRITE_CONFIG, true);

    const count = this.diffConfig.enemyCount || 1;
    const spacing = count <= 1 ? 0 : 130;
    for (let i = 0; i < count; i++) {
      const startX = ENEMY_START_X + (i - (count - 1) / 2) * spacing;
      const enemy = new PixelCharacter(this, startX, GROUND_Y, this.enemyConfig.sprite, false);
      this.enemies.push({
        type: this.enemyType,
        character: enemy,
        config: this.enemyConfig,
        hp: this.enemyConfig.maxHp,
        maxHp: this.enemyConfig.maxHp,
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
    this.ui.setEnemyName(this.enemyConfig.name);
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
      this.spawnHitParticles(enemyX, enemyY - 40, 14, moveCfg.color);
      this.ui.showDamageNumber(enemyX, enemyY - 90, damage.amount, 'critical');
      this.ui.showComboPopup(enemyX, enemyY - 120, 'CRITICAL!');
      this.cameras.main.flash(100, 255, 255, 255, false, undefined, undefined);
    } else {
      this.spawnHitParticles(enemyX, enemyY - 40, 6, moveCfg.color);
      this.ui.showDamageNumber(enemyX, enemyY - 80, damage.amount, 'normal');
    }

    if (damage.isSpecial) {
      this.ui.showComboPopup(enemyX, enemyY - 110, 'SPECIAL!');
    }

    if (this.combo >= 3 && this.combo % 5 === 0) {
      this.ui.showComboPopup(this.player.x + 60, this.player.y - 100, `x${this.combo} COMBO`);
    }

    enemyChar.play('hurt');
    enemyChar.flash();

    if (target.state === 'approaching' && damage.amount > 10 && target.canStagger) {
      this.staggerEnemy(target);
    }

    // If enemy died
    if (target.hp <= 0) {
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
      this.cameras.main.flash(300, 0, 255, 255, false);
      this.tweens.add({ targets: this.feverOverlay, alpha: 0.15, duration: 300 });
      this.ui.showComboPopup(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'FEVER MODE!');
    } else if (!this.feverActive && prevFever) {
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
        this.spawnHitParticles((t.character as PixelCharacter).x, (t.character as PixelCharacter).y - 40, 20, 0x00ffff);
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
      this.ui.updatePlayerHp(this.playerHp, MAX_PLAYER_HP);
      this.player.play('hurt');
      this.player.flash();

      this.ui.showDamageNumber(this.player.x, this.player.y - 80, dmg, 'normal');
      this.spawnHitParticles(this.player.x, this.player.y - 40, 8, 0xff2442);

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
  }

  /* ---- GAME END ---- */

  private onFightEnd(victory: boolean) {
    if (this.gameOver) return;
    this.gameOver = true;

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
