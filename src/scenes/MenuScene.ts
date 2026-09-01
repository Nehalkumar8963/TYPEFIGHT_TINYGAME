import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, ENEMY_CONFIGS, PLAYER_SPRITE_CONFIG, LEVEL_CONFIGS } from '../config';
import type { Difficulty, EnemyType } from '../types';
import { PixelCharacter } from '../entities/PixelCharacter';
import { SoundEngine } from '../systems/SoundEngine';

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
    gfx.fillStyle(0x1a1a2e);
    gfx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    gfx.fillStyle(0x2a2a4e);
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      gfx.fillRect(x, GAME_HEIGHT - 40, 10, 2);
    }

    gfx.fillStyle(0x141428, 0.3);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      gfx.fillRect(x, 0, 1, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      gfx.fillRect(0, y, GAME_WIDTH, 1);
    }

    for (let i = 0; i < 25; i++) {
      const px = Phaser.Math.Between(0, GAME_WIDTH);
      const py = Phaser.Math.Between(0, GAME_HEIGHT - 60);
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

    // Animated title glow ring
    const t = Date.now() * 0.0015;
    this.titleFx.clear();
    this.titleFx.fillStyle(0x39ff14, 0.04 + Math.sin(t) * 0.02);
    this.titleFx.fillRect(GAME_WIDTH / 2 - 130, 40, 260, 60);

    this.titleFx.lineStyle(2, 0x39ff14, 0.2 + Math.sin(t) * 0.1);
    this.titleFx.strokeRect(GAME_WIDTH / 2 - 130, 40, 260, 60);
  }

  shutdown() {
    if (this.playerPreview) this.playerPreview.destroy();
    if (this.enemyPreview) this.enemyPreview.destroy();
  }
}