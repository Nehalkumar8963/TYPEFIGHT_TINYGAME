import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, ENEMY_CONFIGS, PLAYER_SPRITE_CONFIG, LEVEL_CONFIGS } from '../config';
import type { Difficulty, EnemyType } from '../types';
import { PixelCharacter } from '../entities/PixelCharacter';
import { SoundEngine } from '../systems/SoundEngine';
import {
  drawSun, drawTorii, drawMountainRange, drawHanko, drawGrain,
  drawSeigaihaStrip, drawTatami,
} from '../textures';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'normal';
  private selectedEnemy: EnemyType = 'fighter';
  private selectedLevel = 1;
  private usingCustom = false;
  private sfx = SoundEngine.instance;

  private playerPreview!: PixelCharacter;
  private enemyPreview!: PixelCharacter;
  private titleFx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a12');

    const gfx = this.add.graphics();

    // -- Sky gradient (indigo-to-crimson dusk) --
    for (let y = 0; y < GROUND_Y; y += 3) {
      const t = y / GROUND_Y;
      const r = Math.floor(8 + t * 22);
      const g = Math.floor(6 + t * 8);
      const b = Math.floor(20 + t * 26);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, y, GAME_WIDTH, 3);
    }

    // -- Rising sun --
    drawSun(gfx, GAME_WIDTH - 210, GROUND_Y - 150, 100, 0xff2442, 0.5);

    // -- Layered mountains --
    drawMountainRange(gfx, GROUND_Y, 0x2a1030, 0.6, [
      { x: 140, w: 420, h: 170 },
      { x: 660, w: 480, h: 220 },
      { x: 1060, w: 300, h: 140 },
    ]);
    drawMountainRange(gfx, GROUND_Y, 0x1a0b22, 0.85, [
      { x: 60, w: 280, h: 110 },
      { x: 460, w: 340, h: 150 },
      { x: 860, w: 320, h: 130 },
    ]);

    // -- Torii gates flanking the arena --
    drawTorii(gfx, 90, GROUND_Y, 1.1, 0x12060c, 0.75);
    drawTorii(gfx, GAME_WIDTH - 118, GROUND_Y, 1.1, 0x12060c, 0.75);

    // -- Grain + faint grid texture --
    drawGrain(gfx, 0, 0, GAME_WIDTH, GROUND_Y, 0xffffff, 0.05, 200, 7);
    gfx.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GROUND_Y); gfx.strokePath();
    }
    for (let y = 0; y < GROUND_Y; y += 40) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    // -- Kanji seals across the sky --
    drawHanko(gfx, 320, 90, 30, 0xff2442, 0.18, 1);
    drawHanko(gfx, 680, 60, 24, 0xff2442, 0.13, 2);
    drawHanko(gfx, 940, 130, 30, 0xff2442, 0.16, 0);

    // -- Floor: tatami + bottom wave border --
    gfx.fillStyle(0x151023);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    drawTatami(gfx, 0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y, 0xffffff, 0.08, 24);
    gfx.fillStyle(0xff2442, 0.4);
    gfx.fillRect(0, GROUND_Y, GAME_WIDTH, 3);
    drawSeigaihaStrip(gfx, 0, GAME_HEIGHT - 6, GAME_WIDTH, 18, 0xff2442, 0.3);
    drawGrain(gfx, 0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y, 0x000000, 0.12, 100, 11);

    // -- Twinkling stars --
    for (let i = 0; i < 25; i++) {
      const px = Phaser.Math.Between(0, GAME_WIDTH);
      const py = Phaser.Math.Between(0, Math.floor(GROUND_Y * 0.6));
      const dot = this.add.graphics();
      const colors = [0x39ff14, 0x00ffff, 0xff00ff, 0xffe600];
      dot.fillStyle(Phaser.Utils.Array.GetRandom(colors), 0.3);
      dot.fillRect(px, py, 2, 2);

      this.tweens.add({
        targets: dot,
        alpha: { from: 0.1, to: 0.5 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // -- Drifting sakura petals --
    for (let i = 0; i < 12; i++) {
      const petal = this.add.graphics();
      const px = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const py = Phaser.Math.Between(20, GROUND_Y - 40);
      const pinks = [0xff9fcf, 0xffc4dd, 0xff7bb8];
      petal.fillStyle(Phaser.Utils.Array.GetRandom(pinks), Phaser.Math.FloatBetween(0.2, 0.5));
      petal.fillRect(0, 0, 4, 3);
      this.tweens.add({
        targets: petal,
        x: { from: px, to: px + Phaser.Math.Between(-80, 80) },
        y: { from: py, to: py + Phaser.Math.Between(70, 170) },
        duration: Phaser.Math.Between(4000, 9000),
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

    // Live character previews (left = player, right = selected enemy)
    this.playerPreview = new PixelCharacter(this, 150, GROUND_Y, PLAYER_SPRITE_CONFIG, true);
    this.enemyPreview = new PixelCharacter(
      this, GAME_WIDTH - 150, GROUND_Y, ENEMY_CONFIGS.fighter.sprite, false
    );

    // Title scanline sweep effect
    this.titleFx = this.add.graphics();
    this.titleFx.setDepth(3);
    this.tweens.add({
      targets: this.titleFx,
      alpha: 0,
      duration: 900,
      yoyo: true,
      repeat: -1,
      delay: 3000,
    });

    this.setupMenuListeners();
    (window as any).__menuScene = this;
  }

  private setupMenuListeners() {
    const safeClick = (cb: () => void) => {
      if (!this.scene.isActive()) return;
      if (!this.sfx.isMuted) this.sfx.uiClick();
      cb();
    };

    const diffBtns = document.querySelectorAll('#difficulty-btns .pixel-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        safeClick(() => {
          diffBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedDifficulty = (btn as HTMLElement).dataset.value as Difficulty;
          this.usingCustom = true;
        });
      });
    });

    const enemyBtns = document.querySelectorAll('#enemy-btns .pixel-btn');
    enemyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        safeClick(() => {
          enemyBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedEnemy = (btn as HTMLElement).dataset.value as EnemyType;
          this.usingCustom = true;
          this.swapEnemyPreview(this.selectedEnemy);
        });
      });
    });

    // Level select
    const levelBtns = document.querySelectorAll('#level-btns .pixel-btn');
    levelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        safeClick(() => {
          levelBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const lvl = Number((btn as HTMLElement).dataset.value);
          this.selectedLevel = lvl;
          this.usingCustom = false;
          this.applyLevelDefaults(lvl);
        });
      });
    });

    // Level info
    const levelDesc = document.getElementById('level-desc');
    const updateLevelDesc = () => {
      if (levelDesc) {
        const lvl = LEVEL_CONFIGS[this.selectedLevel - 1];
        levelDesc.textContent = `LVL ${lvl.id}: ${lvl.name} - ${lvl.description}`;
      }
    };
    updateLevelDesc();

    document.getElementById('start-btn')!.addEventListener('click', () => {
      safeClick(() => this.startFight());
    });

    const practiceBtn = document.getElementById('practice-btn');
    if (practiceBtn) {
      practiceBtn.addEventListener('click', () => {
        safeClick(() => {
          document.getElementById('main-menu')!.classList.remove('active');
          this.scene.start('PracticeScene');
        });
      });
    }

    const sfxBtn = document.getElementById('menu-sfx-toggle') as HTMLButtonElement | null;
    if (sfxBtn) {
      sfxBtn.onclick = (e) => {
        e.stopPropagation();
        this.sfx.toggleMuted();
        sfxBtn.textContent = this.sfx.isMuted ? 'SFX OFF' : 'SFX ON';
        sfxBtn.classList.toggle('muted', this.sfx.isMuted);
        if (!this.sfx.isMuted) this.sfx.uiClick();
      };
      sfxBtn.textContent = this.sfx.isMuted ? 'SFX OFF' : 'SFX ON';
    }

    document.getElementById('main-menu')!.classList.add('active');
    document.getElementById('hud')!.classList.remove('active');
    document.getElementById('result-screen')!.classList.remove('active');
    const practice = document.getElementById('practice-screen');
    if (practice) practice.classList.remove('active');
  }

  private swapEnemyPreview(enemyType: EnemyType) {
    this.enemyPreview.destroy();
    this.enemyPreview = new PixelCharacter(
      this, GAME_WIDTH - 150, GROUND_Y, ENEMY_CONFIGS[enemyType].sprite, false
    );
  }

  private applyLevelDefaults(level: number) {
    const lvl = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];

    // Set difficulty to the level's difficulty
    const diffBtns = document.querySelectorAll('#difficulty-btns .pixel-btn');
    diffBtns.forEach(b => {
      b.classList.toggle('active', (b as HTMLElement).dataset.value === lvl.difficulty);
    });
    this.selectedDifficulty = lvl.difficulty;

    // Set enemy to the level's first enemy type
    const firstType = lvl.enemyTypes[0];
    const enemyBtns = document.querySelectorAll('#enemy-btns .pixel-btn');
    enemyBtns.forEach(b => {
      b.classList.toggle('active', (b as HTMLElement).dataset.value === firstType);
    });
    this.selectedEnemy = firstType;
    this.swapEnemyPreview(firstType);

    // Update level description
    const levelDesc = document.getElementById('level-desc');
    if (levelDesc) {
      levelDesc.textContent = `LVL ${lvl.id}: ${lvl.name} - ${lvl.description}`;
    }
  }

  private startFight() {
    const lvl = LEVEL_CONFIGS[Math.min(this.selectedLevel - 1, LEVEL_CONFIGS.length - 1)];
    document.getElementById('main-menu')!.classList.remove('active');
    this.scene.start('FightScene', {
      difficulty: this.selectedDifficulty,
      enemyType: this.selectedEnemy,
      level: this.selectedLevel,
      enemies: this.usingCustom ? undefined : lvl.enemyTypes,
    });
  }

  update(_time: number, delta: number) {
    this.playerPreview.update(delta);
    this.enemyPreview.update(delta);

    // Animated title: sun ring + hanko seals
    const t = Date.now() * 0.0015;
    this.titleFx.clear();

    // Retro sun disc behind the title text
    const pulse = 0.16 + Math.sin(t) * 0.05;
    this.titleFx.fillStyle(0xff2442, pulse * 0.5);
    this.titleFx.fillCircle(GAME_WIDTH / 2, 62, 40);
    this.titleFx.lineStyle(2, 0xff2442, pulse);
    this.titleFx.strokeCircle(GAME_WIDTH / 2, 62, 46);
    this.titleFx.strokeCircle(GAME_WIDTH / 2, 62, 40);

    // Red hanko seals at the title corners
    drawHanko(this.titleFx, GAME_WIDTH / 2 - 178, 58, 30, 0xff2442, 0.35 + Math.sin(t) * 0.1, 1);
    drawHanko(this.titleFx, GAME_WIDTH / 2 + 178, 58, 30, 0xff2442, 0.35 + Math.sin(t) * 0.1, 2);
  }

  shutdown() {
    if (this.playerPreview) this.playerPreview.destroy();
    if (this.enemyPreview) this.enemyPreview.destroy();
  }
}