import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { Difficulty, EnemyType } from '../types';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'normal';
  private selectedEnemy: EnemyType = 'fighter';

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

    this.setupMenuListeners();
    (window as any).__menuScene = this;
  }

  private setupMenuListeners() {
    const diffBtns = document.querySelectorAll('#difficulty-btns .pixel-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDifficulty = (btn as HTMLElement).dataset.value as Difficulty;
      });
    });

    const enemyBtns = document.querySelectorAll('#enemy-btns .pixel-btn');
    enemyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        enemyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedEnemy = (btn as HTMLElement).dataset.value as EnemyType;
      });
    });

    document.getElementById('start-btn')!.addEventListener('click', () => {
      this.startFight();
    });

    const practiceBtn = document.getElementById('practice-btn');
    if (practiceBtn) {
      practiceBtn.addEventListener('click', () => {
        document.getElementById('main-menu')!.classList.remove('active');
        this.scene.start('PracticeScene');
      });
    }

    document.getElementById('main-menu')!.classList.add('active');
    document.getElementById('hud')!.classList.remove('active');
    document.getElementById('result-screen')!.classList.remove('active');
    const practice = document.getElementById('practice-screen');
    if (practice) practice.classList.remove('active');
  }

  private startFight() {
    document.getElementById('main-menu')!.classList.remove('active');
    this.scene.start('FightScene', {
      difficulty: this.selectedDifficulty,
      enemyType: this.selectedEnemy,
    });
  }
}
