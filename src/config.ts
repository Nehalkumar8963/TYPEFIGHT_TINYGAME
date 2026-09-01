import type { EnemyConfig, DifficultyConfig, Difficulty, EnemyType, CombatMoveConfig, CombatMove, PixelSpriteDef, LevelConfig } from './types';

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
  sweep: {
    name: 'SWEEP', color: 0xffd700, cssColor: '#ffd700',
    baseDamage: 10, speed: 0.9, animName: 'sweep',
    energyCost: 0,
  },
  roundhouse: {
    name: 'ROUNDHOUSE', color: 0xff1493, cssColor: '#ff1493',
    baseDamage: 24, speed: 0.5, animName: 'roundhouse',
    energyCost: 25,
  },
  spinkick: {
    name: 'SPIN KICK', color: 0x7b68ee, cssColor: '#7b68ee',
    baseDamage: 18, speed: 0.6, animName: 'spinkick',
    energyCost: 0,
  },
};

export const MOVE_ORDER: CombatMove[] = ['jab', 'cross', 'kick', 'uppercut', 'special', 'haymaker', 'finisher', 'sweep', 'roundhouse', 'spinkick'];

// Distributes all 26 letters a-z randomly across the 10 moves (~2-3 each)
export function shuffleLetterPools(): Record<CombatMove, string[]> {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  // Fisher-Yates shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  const pools: Record<CombatMove, string[]> = {
    jab: [], cross: [], kick: [], uppercut: [], special: [], haymaker: [], finisher: [],
    sweep: [], roundhouse: [], spinkick: [],
  };

  const base = Math.floor(26 / MOVE_ORDER.length); // 2
  let remainder = 26 % MOVE_ORDER.length; // 6
  let idx = 0;

  for (const move of MOVE_ORDER) {
    let count = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    pools[move] = letters.slice(idx, idx + count);
    idx += count;
  }

  return pools;
}

// ---- PLAYER SPRITE ----

const PLAYER_SPRITE: PixelSpriteDef = {
  bodyColor: 0x39ff14, accentColor: 0x00cc44,
  headWidth: 14, headHeight: 14, bodyWidth: 16, bodyHeight: 20,
  hasHelmet: true, hasWeapon: false,
  hasShoulderPads: true,
};

// ---- ENEMY SPRITES ----

const SPRITE_ROOKIE: PixelSpriteDef = {
  bodyColor: 0x4d7cff, accentColor: 0x3355cc,
  headWidth: 12, headHeight: 12, bodyWidth: 14, bodyHeight: 18,
  hasHelmet: false, hasWeapon: false,
  bodyStyle: 'slim',
};

const SPRITE_FIGHTER: PixelSpriteDef = {
  bodyColor: 0xff6600, accentColor: 0xcc4400,
  headWidth: 14, headHeight: 14, bodyWidth: 16, bodyHeight: 20,
  hasHelmet: true, hasWeapon: false,
  hasShoulderPads: true,
};

const SPRITE_NINJA: PixelSpriteDef = {
  bodyColor: 0xff00ff, accentColor: 0xcc00cc,
  headWidth: 12, headHeight: 12, bodyWidth: 12, bodyHeight: 18,
  hasHelmet: true, hasWeapon: true, weaponType: 'claws',
  hasCape: true, capeColor: 0x9900cc,
  bodyStyle: 'slim',
};

const SPRITE_BOSS: PixelSpriteDef = {
  bodyColor: 0xff2442, accentColor: 0xcc0022,
  headWidth: 18, headHeight: 18, bodyWidth: 22, bodyHeight: 26,
  hasHelmet: true, hasWeapon: true, weaponType: 'sword',
  hasShoulderPads: true,
  bodyStyle: 'armored',
};

const SPRITE_SAMURAI: PixelSpriteDef = {
  bodyColor: 0x8b0000, accentColor: 0xffd700,
  headWidth: 16, headHeight: 16, bodyWidth: 18, bodyHeight: 22,
  hasHelmet: true, hasWeapon: true, weaponType: 'sword',
  hasCape: true, capeColor: 0x8b0000,
  bodyStyle: 'armored',
};

const SPRITE_ASSASSIN: PixelSpriteDef = {
  bodyColor: 0x1a1a2e, accentColor: 0x4d7cff,
  headWidth: 12, headHeight: 12, bodyWidth: 13, bodyHeight: 18,
  hasHelmet: true, hasWeapon: true, weaponType: 'claws',
  hasEyeGlow: true, eyeGlowColor: 0x00ffff,
  bodyStyle: 'slim',
};

const SPRITE_WARLORD: PixelSpriteDef = {
  bodyColor: 0xb8860b, accentColor: 0x8b4513,
  headWidth: 20, headHeight: 20, bodyWidth: 26, bodyHeight: 30,
  hasHelmet: true, hasWeapon: true, weaponType: 'axe',
  hasShoulderPads: true,
  bodyStyle: 'heavy',
};

const SPRITE_DEMON: PixelSpriteDef = {
  bodyColor: 0xcc0000, accentColor: 0xff4500,
  headWidth: 18, headHeight: 18, bodyWidth: 20, bodyHeight: 24,
  hasHelmet: true, hasWeapon: false,
  hasEyeGlow: true, eyeGlowColor: 0xff0000,
  bodyStyle: 'heavy',
};

const SPRITE_SHADOW: PixelSpriteDef = {
  bodyColor: 0x2d1b4e, accentColor: 0x6a0dad,
  headWidth: 14, headHeight: 14, bodyWidth: 16, bodyHeight: 20,
  hasHelmet: true, hasWeapon: true, weaponType: 'whip',
  hasCape: true, capeColor: 0x1a0a3e,
  hasEyeGlow: true, eyeGlowColor: 0xff00ff,
  bodyStyle: 'slim',
};

const SPRITE_DRAGON: PixelSpriteDef = {
  bodyColor: 0x006400, accentColor: 0xff4500,
  headWidth: 22, headHeight: 22, bodyWidth: 28, bodyHeight: 32,
  hasHelmet: true, hasWeapon: true, weaponType: 'flame',
  hasShoulderPads: true,
  hasEyeGlow: true, eyeGlowColor: 0xffd700,
  bodyStyle: 'heavy',
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
  samurai: {
    type: 'samurai', maxHp: 120, attackInterval: 3500, attackDamage: 18,
    approachSpeed: 75, name: 'SAMURAI', color: 0x8b0000, sprite: SPRITE_SAMURAI,
  },
  assassin: {
    type: 'assassin', maxHp: 55, attackInterval: 2200, attackDamage: 22,
    approachSpeed: 150, name: 'ASSASSIN', color: 0x1a1a2e, sprite: SPRITE_ASSASSIN,
  },
  warlord: {
    type: 'warlord', maxHp: 200, attackInterval: 4500, attackDamage: 25,
    approachSpeed: 40, name: 'WARLORD', color: 0xb8860b, sprite: SPRITE_WARLORD,
  },
  demon: {
    type: 'demon', maxHp: 140, attackInterval: 2800, attackDamage: 20,
    approachSpeed: 100, name: 'DEMON', color: 0xcc0000, sprite: SPRITE_DEMON,
  },
  shadow: {
    type: 'shadow', maxHp: 90, attackInterval: 2000, attackDamage: 18,
    approachSpeed: 140, name: 'SHADOW', color: 0x6a0dad, sprite: SPRITE_SHADOW,
  },
  dragon: {
    type: 'dragon', maxHp: 300, attackInterval: 3000, attackDamage: 30,
    approachSpeed: 60, name: 'DRAGON', color: 0x006400, sprite: SPRITE_DRAGON,
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

// ---- 10 LEVELS ----

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 1, name: 'THE DOJO', theme: 'dojo',
    enemyTypes: ['rookie'], difficulty: 'easy',
    bgGradient: [10, 10, 18], accentColor: 0x39ff14, groundColor: 0x1a1a2e,
    starColors: [0x39ff14, 0x00ffff], requiredScore: 0,
    description: 'Your training begins.',
  },
  {
    id: 2, name: 'BACK ALLEY', theme: 'alley',
    enemyTypes: ['rookie', 'fighter'], difficulty: 'easy',
    bgGradient: [8, 8, 20], accentColor: 0x4d7cff, groundColor: 0x151530,
    starColors: [0x4d7cff, 0x00ffff], requiredScore: 200,
    description: 'The streets are unforgiving.',
  },
  {
    id: 3, name: 'CRIMSON TEMPLE', theme: 'temple',
    enemyTypes: ['fighter', 'ninja'], difficulty: 'normal',
    bgGradient: [15, 5, 10], accentColor: 0xff00ff, groundColor: 0x201018,
    starColors: [0xff00ff, 0xff6600], requiredScore: 500,
    description: 'Warriors await in the shadows.',
  },
  {
    id: 4, name: 'BURNING ARENA', theme: 'volcano',
    enemyTypes: ['fighter', 'ninja', 'rookie'], difficulty: 'normal',
    bgGradient: [20, 8, 5], accentColor: 0xff6600, groundColor: 0x2a1508,
    starColors: [0xff6600, 0xff2d00, 0xffe600], requiredScore: 900,
    description: 'Heat rises with the stakes.',
  },
  {
    id: 5, name: 'VOID STATION', theme: 'space',
    enemyTypes: ['ninja', 'boss'], difficulty: 'hard',
    bgGradient: [2, 2, 15], accentColor: 0x00ffff, groundColor: 0x0a0a25,
    starColors: [0x00ffff, 0xffffff, 0xff00ff], requiredScore: 1400,
    description: 'Zero gravity. Zero mercy.',
  },
  {
    id: 6, name: 'SHADOW REALM', theme: 'void',
    enemyTypes: ['shadow', 'ninja', 'assassin'], difficulty: 'hard',
    bgGradient: [5, 2, 12], accentColor: 0x6a0dad, groundColor: 0x0e0820,
    starColors: [0x6a0dad, 0xff00ff, 0x00ffff], requiredScore: 2000,
    description: 'Darkness consumes all.',
  },
  {
    id: 7, name: 'IRON PALACE', theme: 'palace',
    enemyTypes: ['warlord', 'samurai', 'fighter'], difficulty: 'hard',
    bgGradient: [12, 10, 5], accentColor: 0xffd700, groundColor: 0x1e1a0a,
    starColors: [0xffd700, 0xb8860b, 0xffffff], requiredScore: 2700,
    description: 'Kneel before the warlord.',
  },
  {
    id: 8, name: 'DEMON GATE', theme: 'throne',
    enemyTypes: ['demon', 'shadow', 'assassin'], difficulty: 'insane',
    bgGradient: [18, 2, 2], accentColor: 0xff0000, groundColor: 0x2a0505,
    starColors: [0xff0000, 0xff4500, 0xcc0000], requiredScore: 3500,
    description: 'Hell opens its gates.',
  },
  {
    id: 9, name: 'TWILIGHT THRONE', theme: 'shadow',
    enemyTypes: ['warlord', 'demon', 'shadow', 'assassin'], difficulty: 'insane',
    bgGradient: [8, 3, 15], accentColor: 0x9932cc, groundColor: 0x150a25,
    starColors: [0x9932cc, 0xff00ff, 0x00ffff], requiredScore: 4500,
    description: 'The throne of eternal night.',
  },
  {
    id: 10, name: "DRAGON'S LAIR", theme: 'dragon',
    enemyTypes: ['dragon', 'warlord', 'demon', 'shadow', 'boss'], difficulty: 'insane',
    bgGradient: [5, 10, 5], accentColor: 0xff4500, groundColor: 0x0a1808,
    starColors: [0xff4500, 0x006400, 0xffd700, 0xff0000], requiredScore: 6000,
    description: 'The final battle. Prove your worth.',
  },
];

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
}
