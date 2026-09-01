import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_CONFIGS } from '../config';
import type { FightStats } from '../types';
import { UIManager } from '../systems/UIManager';
import { SoundEngine } from '../systems/SoundEngine';
import { drawSun, drawGrain, drawSeigaihaStrip } from '../textures';

export class ResultScene extends Phaser.Scene {
  private ui!: UIManager;
  private stats!: FightStats;
  private sfx = SoundEngine.instance;

  constructor() {
    super('ResultScene');
  }

  create(stats: FightStats) {
    this.stats = stats;
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.ui = new UIManager();

    if (stats.victory) this.sfx.victory();
    else this.sfx.defeat();

    // Track best level reached
    const bestKey = 'typefight_max_level';
    let best = Number(localStorage.getItem(bestKey) ?? '0');
    if (stats.victory && stats.level > best) {
      best = stats.level;
      localStorage.setItem(bestKey, String(best));
    }
    const current = stats.victory ? stats.level : stats.level - 1;
    this.time.delayedCall(250, () => {
      this.ui.renderLevelProgress(Math.max(current, 0), LEVEL_CONFIGS.length);
    });

    const gfx = this.add.graphics();

    // Dusk gradient + rising sun tinted by win/loss
    for (let y = 0; y < 300; y += 3) {
      const t = y / 300;
      const r = Math.floor(9 + t * 16);
      const g = Math.floor(8 + t * 8);
      const b = Math.floor(22 + t * 26);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, y, GAME_WIDTH, 3);
    }
    gfx.fillStyle(0x120e24);
    gfx.fillRect(0, 300, GAME_WIDTH, GAME_HEIGHT - 300);

    drawSun(
      gfx,
      stats.victory ? GAME_WIDTH - 180 : 180,
      220, 90,
      stats.victory ? 0xffd700 : 0xff2442,
      0.35
    );

    drawGrain(gfx, 0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.04, 180, 23);

    gfx.lineStyle(1, 0x1a1a3e, 0.15);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      gfx.beginPath(); gfx.moveTo(x, 0); gfx.lineTo(x, GAME_HEIGHT); gfx.strokePath();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(GAME_WIDTH, y); gfx.strokePath();
    }

    drawSeigaihaStrip(gfx, 0, GAME_HEIGHT - 6, GAME_WIDTH, 18, 0xff2442, 0.2);

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
    this.ui.setResultLevel(stats.level);
    this.ui.showResults();

    // Grade reveal
    const gradeEl = document.getElementById('result-grade');
    if (gradeEl) {
      gradeEl.classList.add('reveal-pop');
      this.time.delayedCall(500, () => gradeEl.classList.remove('reveal-pop'));
    }

    document.getElementById('retry-btn')!.onclick = () => {
      this.sfx.uiClick();
      const lvl = LEVEL_CONFIGS[Math.min(stats.level - 1, LEVEL_CONFIGS.length - 1)];
      this.ui.showMenu();
      this.scene.start('FightScene', {
        difficulty: stats.difficulty,
        enemyType: stats.enemyType,
        level: stats.level,
        enemies: lvl.enemyTypes,
      });
    };
    document.getElementById('menu-btn')!.onclick = () => {
      this.sfx.uiClick();
      this.ui.showMenu();
      this.scene.start('MenuScene');
    };

    // Next level button (only on victory and if not at max level)
    const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
    if (nextBtn) {
      const canAdvance = stats.victory && stats.level < LEVEL_CONFIGS.length;
      if (canAdvance) {
        nextBtn.style.display = '';
        const nextLevel = LEVEL_CONFIGS[stats.level];
        nextBtn.innerHTML = `&#9654; NEXT: ${nextLevel.name}`;
        nextBtn.onclick = () => {
          this.sfx.uiClick();
          this.ui.showMenu();
          this.scene.start('FightScene', {
            difficulty: nextLevel.difficulty,
            enemyType: nextLevel.enemyTypes[0],
            level: stats.level + 1,
            enemies: nextLevel.enemyTypes,
          });
        };
      } else {
        nextBtn.style.display = 'none';
      }
    }
  }

  shutdown() {
    // Cleanup handled by scene transition
  }
}