# CLAUDE.md

## Project Overview

A Java-based Battleship AI bot (COMP10205 assignment) that plays the classic Battleship game using a **Probability Density Function + Parity Hunting** strategy. The bot minimizes average shots needed to sink all ships across 10,000 games. Best recorded score: **45.75 shots average** (record since 2014).

**Authors:** Man Vu & Huy Mac

## Repository Structure

```
├── src/                     # All Java source files
│   ├── A6.java              # Entry point - runs 10,000 games and reports average
│   ├── DrInvisible_Bot.java # Main bot strategy (fireShot, handleAfterShot)
│   ├── VirtualField.java    # Board state, probability engine, shot selection
│   ├── Cell.java            # Cell data (state + probability)
│   ├── CellState.java       # Enum: Empty, Hit, Miss, Sunk
│   ├── ShipDirection.java   # Enum: To_Be_Determined, Vertical, Horizontal
│   └── VIEW.java            # Enum: DOWN, LEFT, RIGHT, UP
├── out/production/          # Compiled .class output (IntelliJ)
├── BattleshipAPI.jar        # External game engine API (required dependency)
├── A6_Start.iml             # IntelliJ IDEA project config
└── README.md                # Project documentation and strategy explanation
```

## Build & Run

**Language:** Java 21 (OpenJDK)
**IDE:** IntelliJ IDEA (no Maven/Gradle)

### Compile and run from command line

```bash
javac -cp BattleshipAPI.jar -d out/production src/*.java
java -cp out/production:BattleshipAPI.jar A6
```

### Run from IntelliJ

Open the project, ensure `BattleshipAPI.jar` is in the module classpath, and run `A6.java`.

### Expected output

The program runs 10,000 Battleship games and prints the average number of shots per game. Target: below 46.15 shots.

## Architecture

### Strategy: Three-phase approach

1. **Probability Hunting** — For each alive ship, calculate all valid placements on the board. Cells that appear in more valid placements get higher probability scores. Always fire at the highest-probability empty cell.

2. **Tactical Sinking** — After a hit, explore adjacent cells (up/down/left/right). Once a second hit confirms ship orientation (horizontal/vertical), continue along that axis to sink the ship. Uses a Stack to manage candidate target cells.

3. **Diagonal Parity (Endgame)** — When only the 2-cell ship remains, apply a diagonal checkerboard bias (1.5x multiplier) to increase hit efficiency by ~20%.

### Key classes

| Class | Responsibility |
|---|---|
| `A6` | Game loop runner, statistics aggregation |
| `DrInvisible_Bot` | Bot interface implementation, delegates to VirtualField |
| `VirtualField` | Core engine: board state, probability calculation, shot selection, sink mode |
| `Cell` | Unit data: state enum + probability value |

### Board representation

- 10x10 grid of `Cell` objects (`Cell[][] board`)
- Ships: sizes 2, 3, 3, 4, 5 (17 total cells)
- Coordinates use `java.awt.Point`

## Code Conventions

- **Classes:** PascalCase (`VirtualField`, `DrInvisible_Bot`)
- **Methods:** camelCase (`fireShot`, `updateProbability`, `getNextShot`)
- **Constants:** UPPER_SNAKE_CASE (`BOARD_SIZE`, `NUMBEROFGAMES`)
- **Enums:** PascalCase values, some use underscores (`To_Be_Determined`)
- **Documentation:** JavaDoc comments on all public methods
- **Style:** Modern Java features (switch expressions, streams, lambdas)
- **Modifiers:** `final` on getter methods in `Cell.java`

## Key Methods Reference

### VirtualField.java (core logic)

- `updateProbability()` — Recalculates probability density for all cells based on remaining ships
- `getNextShot()` — Returns the highest-probability empty cell as the next target
- `sinkMode()` — Tactical follow-up after a hit; explores adjacent cells along ship direction
- `diagonalSkew()` — Applies checkerboard bias for 2-ship endgame
- `handleShotHit(Point, boolean sunk)` — Processes hit/sunk feedback, updates board state

### DrInvisible_Bot.java (bot interface)

- `fireShot()` — Called by BattleshipAPI each turn; delegates to VirtualField
- `handleAfterShot()` — Callback after each shot with hit/miss/sunk result

## Testing

No formal test suite (JUnit, etc.). Testing is done by running the full 10,000-game simulation and evaluating the average shots metric.

**Performance benchmarks:**
- Professor's best: 46.10 shots
- This bot's best: 45.75 shots
- Current average: ~46.15 shots

## Dependencies

- **BattleshipAPI.jar** — Provided game engine. Contains `battleship.BattleShip` class and reference bot implementations. Must be on classpath at compile and runtime.
- **Java 21+** — Required for switch expressions and modern stream API usage.

## Common Tasks

- **Improve bot performance:** Modify strategy in `VirtualField.java` (probability calculation, sink mode logic, or endgame heuristics)
- **Adjust game count:** Change `NUMBEROFGAMES` constant in `A6.java`
- **Add new cell states:** Update `CellState.java` enum and its `toString()` switch expression
