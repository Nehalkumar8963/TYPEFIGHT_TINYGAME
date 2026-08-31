import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { FightStats } from '../types';
import { UIManager } from '../systems/UIManager';

export class ResultScene extends Phaser.Scene {
  private ui!: UIManager;

  constructor() {
    super('ResultScene');
  }

  create(stats: FightStats) {
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.ui = new UIManager();

    const gfx = this.add.graphics();
    gfx.fillStyle(0x0d0d2b);
    gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    gfx.lineStyle(1, 0x1a1a3e, 0.2);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GAME_HEIGHT); gfx.strokePath();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    for (let i = 0; i < 15; i++) {
      const dot = this.add.graphics();
      const c = stats.victory
        ? Phaser.Utils.Array.GetRandom([0x39ff14, 0x00ffff, 0xffe600])
        : Phaser.Utils.Array.GetRandom([0xff2442, 0xff6600, 0xff00ff]);
      dot.fillStyle(c, 0.3);
      dot.fillRect(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        2, 2
      );
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.1, to: 0.5 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true, repeat: -1,
      });
    }

    this.ui.setResult(
      stats.victory, stats.grade, stats.wpm, stats.accuracy,
      stats.damageDealt, stats.maxCombo, stats.wordsTyped,
      stats.mistakes, stats.time,
      stats.movesUsed, stats.feverActivations
    );
    this.ui.showResults();

    document.getElementById('retry-btn')!.onclick = () => {
      this.ui.showMenu();
      this.scene.start('MenuScene');
    };
    document.getElementById('menu-btn')!.onclick = () => {
      this.ui.showMenu();
      this.scene.start('MenuScene');
    };
  }

  shutdown() {
    // Cleanup handled by scene transition
  }
}
