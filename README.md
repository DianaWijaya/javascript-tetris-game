# javasciupt-tetris-game

A classic Tetris implementation featuring all seven tetromino types, controls, rotation mechanics with wall kicks, progressive difficulty scaling, and score tracking.

## Features

- **7 Tetromino Types**: All classic Tetris blocks (I, O, T, S, Z, J, L)
- **Super Rotation System**: Authentic rotation mechanics with wall kick implementation
- **Progressive Difficulty**: Speed increases as you level up
- **Score Tracking**: Earn points for clearing lines
- **Collision Detection**: Precise block placement and boundary checking
- **Line Clearing**: Automatic detection and removal of completed rows
- **Instant Drop**: Quick placement with spacebar

## Controls

| Key | Action |
|-----|--------|
| `A` | Move left |
| `D` | Move right |
| `S` | Move down (soft drop) |
| `X` | Rotate counterclockwise |
| `C` | Rotate clockwise |
| `Space` | Instant drop |
| `R` | Restart game (when game over) |

## Game Rules

- Blocks spawn at the top of the playing field
- Arrange falling blocks to create complete horizontal lines
- Completed lines are cleared and award points
- Game speed increases with each level
- Game ends when blocks stack to the top of the field
- Blocks cannot move through walls or other placed blocks

## Setup / Installation

### 1. Prerequisites

Node.js (version 14 or higher recommended)

- Install here: https://nodejs.org/en

### 2. Installation

1. Clone the repository
```bash
git clone https://github.com/DianaWijaya/javascript-tetris-game.git
cd javascript-tetris-game
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the console (by default, it should be `http://localhost:5173`)

## Technologies Used

- **TypeScript**: Strongly-typed JavaScript for better code quality and maintainability
- **RxJS**: Reactive programming library for handling asynchronous events and game state
- **HTML5 SVG**: Scalable Vector Graphics for rendering game blocks
- **CSS3**: Custom styling with flexbox layout
- **Vite**: Fast build tool and development server
- **Functional Programming**: Pure functions and immutable state management

## Acknowledgments

- Based on the classic Tetris game by Alexey Pajitnov
- Implements the Super Rotation System (https://tetris.wiki/Super_Rotation_System)