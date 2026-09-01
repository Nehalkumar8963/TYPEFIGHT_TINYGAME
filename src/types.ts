export type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';
export type EnemyType = 'rookie' | 'fighter' | 'ninja' | 'boss' | 'samurai' | 'assassin' | 'warlord' | 'demon' | 'shadow' | 'dragon';
export type EnemyState = 'idle' | 'approaching' | 'attacking' | 'retreating' | 'hurt' | 'dead';
export type AttackGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type CombatMove = 'jab' | 'cross' | 'kick' | 'uppercut' | 'special' | 'haymaker' | 'finisher' | 'sweep' | 'roundhouse' | 'spinkick';
export type LetterStatus = 'pending' | 'active' | 'correct' | 'missed' | 'wrong';
export type CombatMode = 'normal' | 'autofight' | 'fever';
export type LevelTheme = 'dojo' | 'alley' | 'temple' | 'volcano' | 'space' | 'void' | 'palace' | 'throne' | 'shadow' | 'dragon';

export interface LevelConfig {
  id: number;
  name: string;
  theme: LevelTheme;
  enemyTypes: EnemyType[];
  difficulty: Difficulty;
  bgGradient: [number, number, number];
  accentColor: number;
  groundColor: number;
  starColors: number[];
  requiredScore: number;
  description: string;
}

export interface Pose {
  headX: number; headY: number;
  neckX: number; neckY: number;
  hipX: number; hipY: number;
  lElbowX: number; lElbowY: number;
  lHandX: number; lHandY: number;
  rElbowX: number; rElbowY: number;
  rHandX: number; rHandY: number;
  lKneeX: number; lKneeY: number;
  lFootX: number; lFootY: number;
  rKneeX: number; rKneeY: number;
  rFootX: number; rFootY: number;
}

export interface AnimFrame {
  pose: Pose;
  duration: number;
}

export interface PixelSpriteDef {
  bodyColor: number;
  accentColor: number;
  headWidth: number;
  headHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  hasHelmet: boolean;
  hasWeapon: boolean;
  weaponType?: 'sword' | 'staff' | 'claws' | 'axe' | 'whip' | 'flame' | 'fist';
  hasCape?: boolean;
  capeColor?: number;
  hasShoulderPads?: boolean;
  hasEyeGlow?: boolean;
  eyeGlowColor?: number;
  bodyStyle?: 'normal' | 'heavy' | 'slim' | 'armored';
}

export interface CombatMoveConfig {
  name: string;
  color: number;
  cssColor: string;
  baseDamage: number;
  speed: number;
  animName: string;
  energyCost: number;
}

export interface LetterEvent {
  key: string;
  move: CombatMove;
  status: LetterStatus;
  timer: number;
  maxTimer: number;
}

export interface EnemyInstance {
  type: EnemyType;
  character: unknown; // PixelCharacter
  config: EnemyConfig;
  hp: number;
  maxHp: number;
  state: EnemyState;
  x: number;
  startX: number;
  targetX: number;
  approachTween: unknown | null;
  retreatTween: unknown | null;
  attackTimer: unknown | null;
  canStagger: boolean;
}

export interface TypingResult {
  wpm: number;
  accuracy: number;
  score: number;
  timeMs: number;
  mistakes: number;
  correctChars: number;
  totalChars: number;
  isCritical: boolean;
  isSpecial: boolean;
}

export interface CombatDamage {
  amount: number;
  isCritical: boolean;
  isSpecial: boolean;
  move: CombatMove;
  moveColor: number;
}

export interface FightStats {
  wpm: number;
  accuracy: number;
  damageDealt: number;
  maxCombo: number;
  wordsTyped: number;
  mistakes: number;
  time: number;
  grade: AttackGrade;
  victory: boolean;
  movesUsed: Record<CombatMove, number>;
  feverActivations: number;
  enemyType: EnemyType;
  difficulty: Difficulty;
  level: number;
}

export interface PracticeStats {
  lettersTyped: number;
  accuracy: number;
  mistakes: number;
  wpm: number;
  time: number;
  perLetter: Record<string, { correct: number; wrong: number }>;
}

export interface EnemyConfig {
  type: EnemyType;
  maxHp: number;
  attackInterval: number;
  attackDamage: number;
  approachSpeed: number;
  name: string;
  color: number;
  sprite: PixelSpriteDef;
}

export interface DifficultyConfig {
  wordLengthMin: number;
  wordLengthMax: number;
  timerMs: number;
  enemySpeedMult: number;
  enemyDamageMult: number;
  enemyIntervalMult: number;
  letterSpawnInterval: number;
  letterTimeWindow: number;
  enemyCount: number;
}
