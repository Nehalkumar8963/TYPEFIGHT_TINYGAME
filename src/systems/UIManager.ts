import type { AttackGrade, LetterEvent, CombatMode, EnemyInstance } from '../types';
import { COMBAT_MOVES } from '../config';
import type { CombatMove } from '../types';

export class UIManager {
  private el = (id: string) => document.getElementById(id)!;

  showMenu() {
    this.el('main-menu').classList.add('active');
    this.el('hud').classList.remove('active');
    this.el('result-screen').classList.remove('active');
    const practice = this.el('practice-screen');
    if (practice) practice.classList.remove('active');
  }

  showHud() {
    this.el('main-menu').classList.remove('active');
    this.el('hud').classList.add('active');
    this.el('result-screen').classList.remove('active');
    const practice = this.el('practice-screen');
    if (practice) practice.classList.remove('active');
  }

  showResults() {
    this.el('main-menu').classList.remove('active');
    this.el('hud').classList.remove('active');
    this.el('result-screen').classList.add('active');
  }

  showPractice() {
    this.el('main-menu').classList.remove('active');
    this.el('hud').classList.remove('active');
    this.el('result-screen').classList.remove('active');
    this.el('practice-screen').classList.add('active');
  }

  hidePractice() {
    this.el('practice-screen').classList.remove('active');
  }

  updatePracticeHud(targetKey: string, score: number, mistakes: number, wpm: number, accuracy: number, elapsedSecs: number) {
    const target = this.el('practice-target');
    if (target) target.textContent = targetKey.toUpperCase();
    this.el('practice-score').textContent = String(score);
    this.el('practice-mistakes').textContent = String(mistakes);
    this.el('practice-wpm').textContent = `${wpm} WPM`;
    this.el('practice-accuracy').textContent = `${accuracy}%`;
    this.el('practice-time').textContent = `${Math.floor(elapsedSecs / 60)}:${String(elapsedSecs % 60).padStart(2, '0')}`;
  }

  renderPracticeKeyboard(letters: string[], targetKey: string) {
    const keyboard = this.el('practice-keyboard');
    if (!keyboard) return;
    keyboard.innerHTML = '';

    const rows = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ];

    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'pkey-row';
      row.forEach(letter => {
        const key = document.createElement('div');
        key.className = 'pkey';
        if (letter === targetKey) key.classList.add('active');
        key.dataset.key = letter;
        key.textContent = letter.toUpperCase();
        rowEl.appendChild(key);
      });
      keyboard.appendChild(rowEl);
    });
  }

  setPracticeKeyFeedback(letter: string, state: 'correct' | 'wrong') {
    const keys = this.el('practice-keyboard').querySelectorAll(`[data-key="${letter}"]`);
    keys.forEach(k => {
      k.classList.add(state);
    });
  }

  clearPracticeFeedback() {
    const keys = this.el('practice-keyboard').querySelectorAll('.pkey.correct, .pkey.wrong');
    keys.forEach(k => {
      k.classList.remove('correct', 'wrong');
    });
  }

  setPracticeMessage(text: string, color: string) {
    const msg = this.el('practice-message');
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = color;
  }

  updatePlayerHp(hp: number, maxHp: number) {
    const pct = Math.max(0, (hp / maxHp) * 100);
    const fill = this.el('player-hp-fill');
    fill.style.width = pct + '%';
    if (pct < 25) {
      fill.style.background = 'linear-gradient(180deg, #ff2442 0%, #cc1030 100%)';
    } else if (pct < 50) {
      fill.style.background = 'linear-gradient(180deg, #ffe600 0%, #ccbb10 100%)';
    } else {
      fill.style.background = 'linear-gradient(180deg, #39ff14 0%, #2bcc10 100%)';
    }
    this.el('player-hp-text').textContent = String(Math.round(hp));
  }

  updateEnemyHp(hp: number, maxHp: number) {
    const pct = Math.max(0, (hp / maxHp) * 100);
    const fill = this.el('enemy-hp-fill');
    fill.style.width = pct + '%';
    this.el('enemy-hp-text').textContent = String(Math.round(hp));
  }

  renderEnemyHp(enemies: readonly EnemyInstance[]) {
    const container = this.el('enemy-hp-list');
    if (!container) return;
    container.innerHTML = '';

    if (enemies.length <= 1) {
      const e = enemies[0];
      const hiddenBar = this.el('enemy-hp-block');
      if (hiddenBar) hiddenBar.style.display = '';
      if (e) {
        const pct = Math.max(0, (e.hp / e.maxHp) * 100);
        const fill = this.el('enemy-hp-fill');
        if (fill) fill.style.width = pct + '%';
        const text = this.el('enemy-hp-text');
        if (text) text.textContent = String(Math.round(e.hp));
      }
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    const hiddenBar = this.el('enemy-hp-block');
    if (hiddenBar) hiddenBar.style.display = 'none';

    enemies.forEach((e, i) => {
      const pct = Math.max(0, (e.hp / e.maxHp) * 100);
      const row = document.createElement('div');
      row.className = 'enemy-hp-row' + (e.hp <= 0 ? ' dead' : '');
      const config = e.config;
      row.innerHTML = `
        <span class="enemy-idx" style="color: ${config.color === 0xff2442 ? '#ff2442' : '#ffffff'}">#${i + 1}</span>
        <div class="enemy-mini-bar">
          <div class="enemy-mini-fill" style="width:${pct}%; background: ${COMBAT_MOVES.jab.cssColor}; background: ${config.color === 0xff2442 ? '#ff2442' : '#ff6600'}"></div>
        </div>
        <span class="enemy-mini-hp">${Math.round(e.hp)}</span>
      `;
      container.appendChild(row);
    });
  }

  updateCombo(combo: number) {
    const el = this.el('combo-display');
    el.textContent = `COMBO x${combo}`;
    if (combo >= 5) {
      el.classList.add('combo-hot');
      setTimeout(() => el.classList.remove('combo-hot'), 300);
    }
  }

  updateWpm(wpm: number) {
    this.el('wpm-display').textContent = `${wpm} WPM`;
  }

  updateAccuracy(acc: number) {
    this.el('accuracy-display').textContent = `${acc}%`;
  }

  updateDistance(dist: number) {
    const el = this.el('distance-display');
    if (dist > 350) {
      el.textContent = 'FAR';
      el.classList.remove('close');
    } else if (dist > 220) {
      el.textContent = 'MID';
      el.classList.remove('close');
    } else {
      el.textContent = 'CLOSE';
      el.classList.add('close');
    }
  }

  updateEnergy(current: number, max: number) {
    const pct = (current / max) * 100;
    this.el('energy-fill').style.width = pct + '%';
    const hint = this.el('energy-hint');
    if (current >= max) {
      hint.classList.add('ready');
      hint.textContent = '[SPACE]';
    } else {
      hint.classList.remove('ready');
      hint.textContent = `[${Math.round(pct)}%]`;
    }
  }

  updateMode(mode: CombatMode) {
    const el = this.el('mode-indicator');
    el.classList.remove('autofight', 'fever');
    switch (mode) {
      case 'autofight':
        el.textContent = 'AUTO FIGHT';
        el.classList.add('autofight');
        break;
      case 'fever':
        el.textContent = 'FEVER';
        el.classList.add('fever');
        break;
      default:
        el.textContent = '';
        break;
    }
  }

  renderLetterQueue(letters: readonly LetterEvent[]) {
    const container = this.el('letter-queue');
    container.innerHTML = '';

    if (letters.length === 0) {
      const waiting = document.createElement('div');
      waiting.className = 'letter-waiting';
      waiting.textContent = '...';
      container.appendChild(waiting);
      return;
    }

    letters.forEach((letter, idx) => {
      const cfg = COMBAT_MOVES[letter.move];
      const el = document.createElement('div');
      el.className = 'letter-card';

      if (idx === 0) el.classList.add('letter-active');
      if (letter.status === 'wrong') el.classList.add('letter-wrong');
      if (letter.status === 'missed') el.classList.add('letter-missed');

      const pct = Math.max(0, letter.timer / letter.maxTimer) * 100;
      if (pct < 25) el.classList.add('letter-danger');
      else if (pct < 50) el.classList.add('letter-warning');

      el.innerHTML = `
        <div class="letter-key" style="color: ${cfg.cssColor}; text-shadow: 0 0 10px ${cfg.cssColor}">${letter.key.toUpperCase()}</div>
        <div class="letter-move-name" style="color: ${cfg.cssColor}">${cfg.name}</div>
        <div class="letter-timer-bar">
          <div class="letter-timer-fill" style="width: ${pct}%; background: ${cfg.cssColor}"></div>
        </div>
      `;
      container.appendChild(el);
    });
  }

  setEnemyName(name: string) {
    this.el('enemy-name-label').textContent = name;
  }

  showDamageNumber(x: number, y: number, amount: number, type: 'normal' | 'critical' | 'special') {
    const container = this.el('damage-numbers');
    const el = document.createElement('div');
    el.className = 'dmg-number ' + type;
    el.textContent = type === 'critical' ? `${amount}!` : type === 'special' ? `${amount}!!` : String(amount);

    const gameContainer = this.el('game-container');
    const rect = gameContainer.getBoundingClientRect();
    const scaleX = rect.width / 1200;
    const scaleY = rect.height / 600;

    el.style.left = (x * scaleX) + 'px';
    el.style.top = (y * scaleY) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  showComboPopup(x: number, y: number, text: string) {
    const container = this.el('combo-popups');
    const el = document.createElement('div');
    el.className = 'combo-popup';
    el.textContent = text;

    const gameContainer = this.el('game-container');
    const rect = gameContainer.getBoundingClientRect();
    const scaleX = rect.width / 1200;
    const scaleY = rect.height / 600;

    el.style.left = (x * scaleX) + 'px';
    el.style.top = (y * scaleY) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  setResult(victory: boolean, grade: AttackGrade, wpm: number, accuracy: number,
    damage: number, maxCombo: number, words: number, mistakes: number, time: number,
    movesUsed?: Record<CombatMove, number>, feverActivations?: number) {
    const title = this.el('result-title');
    title.textContent = victory ? 'VICTORY' : 'DEFEAT';
    title.className = 'result-title' + (victory ? '' : ' defeat');
    this.el('result-grade').textContent = grade;
    this.el('res-wpm').textContent = String(wpm);
    this.el('res-acc').textContent = accuracy + '%';
    this.el('res-dmg').textContent = String(damage);
    this.el('res-combo').textContent = String(maxCombo);
    this.el('res-words').textContent = String(words);
    this.el('res-mistakes').textContent = String(mistakes);

    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    this.el('res-time').textContent = `${mins}:${String(secs).padStart(2, '0')}`;

    if (movesUsed) {
      const movesEl = this.el('res-moves');
      if (movesEl) {
        movesEl.innerHTML = '';
        for (const [move, count] of Object.entries(movesUsed) as [CombatMove, number][]) {
          if (count > 0) {
            const cfg = COMBAT_MOVES[move];
            const span = document.createElement('span');
            span.className = 'move-stat';
            span.style.color = cfg.cssColor;
            span.textContent = `${cfg.name}: ${count}`;
            movesEl.appendChild(span);
          }
        }
      }
    }

    if (feverActivations !== undefined) {
      const feverEl = this.el('res-fever');
      if (feverEl) feverEl.textContent = String(feverActivations);
    }
  }

  clearDamageNumbers() {
    this.el('damage-numbers').innerHTML = '';
    this.el('combo-popups').innerHTML = '';
  }
}
