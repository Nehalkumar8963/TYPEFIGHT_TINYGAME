# TYPEFIGHT（タイプファイト）

A browser-based **typing battle game** with a retro Japanese arcade / ukiyo-e aesthetic. Press keys corresponding to combat moves (jab, cross, kick, uppercut, special, haymaker, finisher, sweep, roundhouse, spin kick) to duel pixel-art enemies across themed levels.

## Features

- **Typing-driven combat** — Letters queue up; type the right key to unleash a combat move and damage the enemy.
- **10 combat moves** — Each with unique damage, speed, color, and animation.
- **Combo system** — Chain hits to build combos. Combo 5+ triggers **Autofight** (faster spawns); combo 10+ triggers **Fever Mode** (2x damage).
- **Critical hits** — Higher combos raise crit chance (20–40%) for 1.8x damage with camera shake.
- **Energy & Special attack** — Land hits to charge energy, then press `SPACE` to unleash a full-screen area attack.
- **10 enemy types** — Rookie, Fighter, Ninja, Boss, Samurai, Assassin, Warlord, Demon, Shadow, and Dragon, each with unique stats, AI, and procedurally rendered pixel sprites. Up to 5 can fight at once on higher difficulties.
- **10 themed levels** — From The Dojo and Back Alley to Demon Gate and Dragon's Lair, each with a unique background and enemy roster.
- **4 difficulties** — Easy, Normal, Hard, and Insane.
- **Practice mode** — 4 drills: Letters, Words, Timed 60s (WPM tracking), and Falling.
- **100% procedural art & sound** — Zero image/audio assets. All pixel art is drawn with Phaser's Graphics API and all sound is synthesized live via the Web Audio API.
- **Retro CRT overlay** — Scanlines + vignette for the full arcade feel.
- **Mobile / touch support** — On-screen QWERTY keyboard and responsive layout for touch devices.

## Tech Stack

- **TypeScript** (strict mode)
- **Phaser 3** — game engine
- **Vite** — dev server + build tool
- **CSS** — pixel-art design system
- **Vercel** — deployment

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (18+ recommended)
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server with hot module replacement and auto-opens the browser.

### Build

```bash
npm run build
```

Type-checks with TypeScript, then produces a production bundle in `dist/`.

### Preview

```bash
npm run preview
```

Serves the built `dist/` directory locally for preview.

## How to Play

1. Select a **level**, **difficulty**, and **opponent** from the main menu.
2. Wait for letters to queue up in the HUD.
3. Type the correct key to trigger the matching combat move and damage the enemy.
4. Build combos for **Autofight** and **Fever Mode** boosts.
5. Watch the enemy's approach — when it gets close it attacks. Manage your distance and time your hits.
6. Charge to 100 energy and press `SPACE` to unleash your special attack.
7. Beat the level to unlock the next one.

## Project Structure

```
├── index.html            # Single-page HTML with all overlay menus
├── style.css             # Full game CSS (~1,890 lines)
├── src/
│   ├── main.ts           # Entry point — creates the Phaser game instance
│   ├── config.ts         # Game constants, enemies, levels, difficulties, moves
│   ├── types.ts          # TypeScript type definitions
│   ├── letters.ts        # Letter-to-combat-move mapping
│   ├── typingWords.ts    # Word list for typing challenges
│   ├── textures.ts       # Procedural pixel-art helpers (sun, torii, mountains, etc.)
│   ├── entities/
│   │   ├── PixelCharacter.ts   # Detailed pixel-art character renderer
│   │   └── Stickman.ts         # Stick-figure character renderer
│   ├── scenes/
│   │   ├── MenuScene.ts        # Main menu
│   │   ├── FightScene.ts       # Core combat gameplay
│   │   ├── ResultScene.ts      # Post-fight results
│   │   └── PracticeScene.ts    # Typing practice with 4 modes
│   └── systems/
│       ├── CombatEngine.ts     # Damage + grading logic
│       ├── LetterEngine.ts     # Letter queue + combo tracking
│       ├── SoundEngine.ts      # Procedural Web Audio sound effects
│       ├── TouchKeyboard.ts    # Mobile on-screen keyboard
│       ├── TypingEngine.ts     # Word-level typing tracking
│       └── UIManager.ts        # DOM HUD / menus / results
├── public/               # Static assets (currently empty)
├── dist/                 # Production build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

## Deployment

The project is configured for **Vercel** via `vercel.json`, which sets the build command to `npm run build`, output to `dist/`, and adds SPA rewrites back to `index.html`.

## Scripts

| Script    | Description                                        |
| --------- | -------------------------------------------------- |
| `dev`     | Start Vite dev server with HMR                    |
| `build`   | Type-check then build for production              |
| `preview` | Serve the production build locally                |
