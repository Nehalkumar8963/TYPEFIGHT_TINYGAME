import type { EnemyConfig, DifficultyConfig, Difficulty, EnemyType, CombatMoveConfig, CombatMove, PixelSpriteDef } from './types';

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 600;
export const GROUND_Y = 460;

export const PLAYER_START_X = 220;
export const ENEMY_START_X = 700;
export const COMBAT_DISTANCE = 150;
export const MAX_PLAYER_HP = 100;
export const MAX_ENERGY = 100;

export const PLAYER_COLOR = 0x39ff14;
export const ENEMY_COLOR_DEFAULT = 0xff2442;

export const COMBO_AUTO_THRESHOLD = 5;
export const COMBO_FEVER_THRESHOLD = 10;
export const FEVER_DURATION_MS = 5000;
export const ENERGY_PER_HIT = 8;
export const ENERGY_SPECIAL_COST = 100;

export const COMBAT_MOVES: Record<CombatMove, CombatMoveConfig> = {
  jab: {
    name: 'JAB', color: 0x39ff14, cssColor: '#39ff14',
    baseDamage: 7, speed: 1, animName: 'jab',
    energyCost: 0,
  },
  cross: {
    name: 'CROSS', color: 0x4d7cff, cssColor: '#4d7cff',
    baseDamage: 12, speed: 0.8, animName: 'cross',
    energyCost: 0,
  },
  kick: {
    name: 'KICK', color: 0xff6600, cssColor: '#ff6600',
    baseDamage: 14, speed: 0.75, animName: 'kick',
    energyCost: 0,
  },
  uppercut: {
    name: 'UPPERCUT', color: 0xff00ff, cssColor: '#ff00ff',
    baseDamage: 21, speed: 0.55, animName: 'uppercut',
    energyCost: 0,
  },
  special: {
    name: 'SPECIAL', color: 0x00ffff, cssColor: '#00ffff',
    baseDamage: 30, speed: 0.35, animName: 'special',
    energyCost: 50,
  },
  haymaker: {
    name: 'HAYMAKER', color: 0xff2d00, cssColor: '#ff2d00',
    baseDamage: 27, speed: 0.45, animName: 'haymaker',
    energyCost: 30,
  },
  finisher: {
    name: 'FINISHER', color: 0xffffff, cssColor: '#ffffff',
    baseDamage: 40, speed: 0.3, animName: 'finisher',
    energyCost: 0,
  },
};

export const MOVE_ORDER: CombatMove[] = ['jab', 'cross', 'kick', 'uppercut', 'special', 'haymaker', 'finisher'];

// Distributes all 26 letters a-z randomly across the 7 moves (~3-4 each)
export function shuffleLetterPools(): Record<CombatMove, string[]> {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  // Fisher-Yates shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  const pools: Record<CombatMove, string[]> = {
    jab: [], cross: [], kick: [], uppercut: [], special: [], haymaker: [], finisher: [],
  };

  const base = Math.floor(26 / MOVE_ORDER.length); // 3
  let remainder = 26 % MOVE_ORDER.length; // 5
  let idx = 0;

  for (const move of MOVE_ORDER) {
    let count = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    pools[move] = letters.slice(idx, idx + count);
    idx += count;
  }

  return pools;
}

const PLAYER_SPRITE: PixelSpriteDef = {
  bodyColor: 0x39ff14, accentColor: 0x00cc44,
  headWidth: 14, headHeight: 14, bodyWidth: 16, bodyHeight: 20,
  hasHelmet: true, hasWeapon: false,
};

const SPRITE_ROOKIE: PixelSpriteDef = {
  bodyColor: 0x4d7cff, accentColor: 0x3355cc,
  headWidth: 12, headHeight: 12, bodyWidth: 14, bodyHeight: 18,
  hasHelmet: false, hasWeapon: false,
};

const SPRITE_FIGHTER: PixelSpriteDef = {
  bodyColor: 0xff6600, accentColor: 0xcc4400,
  headWidth: 14, headHeight: 14, bodyWidth: 16, bodyHeight: 20,
  hasHelmet: true, hasWeapon: false,
};

const SPRITE_NINJA: PixelSpriteDef = {
  bodyColor: 0xff00ff, accentColor: 0xcc00cc,
  headWidth: 12, headHeight: 12, bodyWidth: 12, bodyHeight: 18,
  hasHelmet: true, hasWeapon: true, weaponType: 'claws',
};

const SPRITE_BOSS: PixelSpriteDef = {
  bodyColor: 0xff2442, accentColor: 0xcc0022,
  headWidth: 18, headHeight: 18, bodyWidth: 22, bodyHeight: 26,
  hasHelmet: true, hasWeapon: true, weaponType: 'sword',
};

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  rookie: {
    type: 'rookie', maxHp: 60, attackInterval: 5500, attackDamage: 8,
    approachSpeed: 60, name: 'ROOKIE', color: 0x4d7cff, sprite: SPRITE_ROOKIE,
  },
  fighter: {
    type: 'fighter', maxHp: 85, attackInterval: 4200, attackDamage: 12,
    approachSpeed: 85, name: 'FIGHTER', color: 0xff6600, sprite: SPRITE_FIGHTER,
  },
  ninja: {
    type: 'ninja', maxHp: 70, attackInterval: 3200, attackDamage: 16,
    approachSpeed: 120, name: 'NINJA', color: 0xff00ff, sprite: SPRITE_NINJA,
  },
  boss: {
    type: 'boss', maxHp: 160, attackInterval: 3800, attackDamage: 20,
    approachSpeed: 55, name: 'BOSS', color: 0xff2442, sprite: SPRITE_BOSS,
  },
};

export const PLAYER_SPRITE_CONFIG: PixelSpriteDef = PLAYER_SPRITE;

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    wordLengthMin: 2, wordLengthMax: 5, timerMs: 7000,
    enemySpeedMult: 0.6, enemyDamageMult: 0.7, enemyIntervalMult: 1.4,
    letterSpawnInterval: 1300, letterTimeWindow: 2200,
    enemyCount: 1,
  },
  normal: {
    wordLengthMin: 3, wordLengthMax: 8, timerMs: 5000,
    enemySpeedMult: 1.0, enemyDamageMult: 1.0, enemyIntervalMult: 1.0,
    letterSpawnInterval: 1050, letterTimeWindow: 1800,
    enemyCount: 2,
  },
  hard: {
    wordLengthMin: 5, wordLengthMax: 12, timerMs: 3800,
    enemySpeedMult: 1.3, enemyDamageMult: 1.2, enemyIntervalMult: 0.8,
    letterSpawnInterval: 800, letterTimeWindow: 1400,
    enemyCount: 3,
  },
  insane: {
    wordLengthMin: 6, wordLengthMax: 20, timerMs: 2800,
    enemySpeedMult: 1.6, enemyDamageMult: 1.5, enemyIntervalMult: 0.6,
    letterSpawnInterval: 580, letterTimeWindow: 1000,
    enemyCount: 5,
  },
};
