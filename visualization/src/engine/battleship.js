// Battleship game engine - JS port of the Java BattleshipAPI + bot logic

const BOARD_SIZE = 10;
const SHIP_SIZES = [2, 3, 3, 4, 5];

// Cell states
const EMPTY = 'empty';
const HIT = 'hit';
const MISS = 'miss';
const SUNK = 'sunk';
const SHIP = 'ship'; // only used in the actual board, not virtualField

// Ship direction
const TBD = 'tbd';
const VERTICAL = 'vertical';
const HORIZONTAL = 'horizontal';

function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ state: EMPTY, probability: 0 }))
  );
}

/** Place ships randomly on the board */
function placeShips() {
  const board = createBoard();
  const ships = [];

  for (const size of SHIP_SIZES) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const x = Math.floor(Math.random() * (horizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE));
      const y = Math.floor(Math.random() * (horizontal ? BOARD_SIZE : BOARD_SIZE - size + 1));

      const cells = [];
      let canPlace = true;
      for (let i = 0; i < size; i++) {
        const cx = horizontal ? x + i : x;
        const cy = horizontal ? y : y + i;
        if (board[cy][cx].state === SHIP) {
          canPlace = false;
          break;
        }
        cells.push({ x: cx, y: cy });
      }

      if (canPlace) {
        for (const c of cells) {
          board[c.y][c.x].state = SHIP;
        }
        ships.push({ size, cells, sunk: false });
        placed = true;
      }
    }
  }

  return { board, ships };
}

/** The actual game board that knows where ships are */
class GameBoard {
  constructor() {
    const { board, ships } = placeShips();
    this.board = board;
    this.ships = ships;
    this.shipsSunk = 0;
  }

  shoot(x, y) {
    if (this.board[y][x].state === SHIP) {
      this.board[y][x].state = HIT;
      // Check if any ship is fully sunk
      for (const ship of this.ships) {
        if (!ship.sunk && ship.cells.every(c => this.board[c.y][c.x].state === HIT)) {
          ship.sunk = true;
          this.shipsSunk++;
          for (const c of ship.cells) {
            this.board[c.y][c.x].state = SUNK;
          }
          return { hit: true, sunk: true, shipSize: ship.size };
        }
      }
      return { hit: true, sunk: false };
    }
    this.board[y][x].state = MISS;
    return { hit: false, sunk: false };
  }

  allSunk() {
    return this.ships.every(s => s.sunk);
  }
}

/** Virtual field - the bot's view of the board (mirrors Java VirtualField) */
class VirtualField {
  constructor() {
    this.board = createBoard();
    this.hitPoints = [];
    this.sunkStack = [];
    this.aliveShips = [...SHIP_SIZES];
    this.maxHits = SHIP_SIZES.reduce((a, b) => a + b, 0);
    this.sinkHitDirection = TBD;
  }

  isInBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }

  getAdjacentCells(x, y) {
    return [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ].filter(p => this.isInBounds(p.x, p.y));
  }

  getAvailableSurrounding(x, y) {
    return this.getAdjacentCells(x, y).filter(
      p => this.board[p.x][p.y].state === EMPTY
    );
  }

  cannotPlaceShip(cell) {
    return cell.state !== EMPTY && cell.state !== HIT;
  }

  updateProbability() {
    // Reset
    for (let x = 0; x < BOARD_SIZE; x++)
      for (let y = 0; y < BOARD_SIZE; y++)
        this.board[x][y].probability = 0;

    for (const length of this.aliveShips) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x <= BOARD_SIZE - length; x++) {
          // Horizontal
          let canPlace = true;
          for (let l = 0; l < length; l++) {
            if (this.cannotPlaceShip(this.board[y][x + l])) {
              canPlace = false;
              break;
            }
          }
          if (canPlace) {
            for (let l = 0; l < length; l++) this.board[y][x + l].probability++;
          }

          // Vertical
          canPlace = true;
          for (let l = 0; l < length; l++) {
            if (this.cannotPlaceShip(this.board[x + l][y])) {
              canPlace = false;
              break;
            }
          }
          if (canPlace) {
            for (let l = 0; l < length; l++) this.board[x + l][y].probability++;
          }
        }
      }
    }
  }

  diagonalSkew() {
    for (let y = 2; y < BOARD_SIZE - 1; y += 2) {
      for (let x = 1; x < BOARD_SIZE - 1; x += 2) {
        if (this.canPlaceDiag(y, x)) {
          this.board[x][y].probability *= 1.5;
        }
      }
    }
    for (let y = 1; y < BOARD_SIZE - 1; y += 2) {
      for (let x = 2; x < BOARD_SIZE - 1; x += 2) {
        if (this.canPlaceDiag(y, x)) {
          this.board[x][y].probability *= 1.5;
        }
      }
    }
  }

  canPlaceDiag(y, x) {
    return (
      this.board[y][x + 1].state === EMPTY &&
      this.board[y][x - 1].state === EMPTY &&
      this.board[y + 1][x].state === EMPTY &&
      this.board[y - 1][x].state === EMPTY &&
      this.board[y][x].state === EMPTY
    );
  }

  getNextShot() {
    let maxProb = -1;
    let best = null;
    const hits = this.countState(HIT) + this.countState(SUNK);

    if (hits < this.maxHits - 1) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
          if (this.board[x][y].state === EMPTY && this.board[x][y].probability > maxProb) {
            maxProb = this.board[x][y].probability;
            best = { x, y };
          }
        }
      }
    }

    if (hits === this.maxHits - 1 || maxProb === 0) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
          if (this.board[x][y].state === HIT || this.board[x][y].state === SUNK) {
            const surr = this.getAvailableSurrounding(x, y);
            if (surr.length > 0) return surr[0];
          }
        }
      }
    }

    return best;
  }

  countState(state) {
    let count = 0;
    for (let x = 0; x < BOARD_SIZE; x++)
      for (let y = 0; y < BOARD_SIZE; y++)
        if (this.board[x][y].state === state) count++;
    return count;
  }

  handleShotHit(shot) {
    this.board[shot.x][shot.y].state = HIT;

    if (this.hitPoints.length === 0) {
      this.sinkHitDirection = TBD;
    }

    if (this.sunkStack.length === 0) {
      this.hitPoints.push(shot);
      this.setupSinkStack(shot);
    } else {
      const surr = this.getAvailableSurrounding(shot.x, shot.y);
      this.hitPoints.push(shot);

      if (shot.x === this.hitPoints[0].x) {
        this.sinkHitDirection = HORIZONTAL;
        surr.filter(p => p.x === shot.x).forEach(p => this.sunkStack.push(p));
      } else if (shot.y === this.hitPoints[0].y) {
        this.sinkHitDirection = VERTICAL;
        surr.filter(p => p.y === shot.y).forEach(p => this.sunkStack.push(p));
      }
    }
  }

  setupSinkStack(point) {
    const candidates = this.getAvailableSurrounding(point.x, point.y);
    candidates.sort((a, b) => this.board[a.x][a.y].probability - this.board[b.x][b.y].probability);
    this.sunkStack = [...candidates];
  }

  sinkMode() {
    while (true) {
      if (this.sunkStack.length > 0) {
        const best = this.sunkStack.pop();
        if (this.board[best.x][best.y].state !== EMPTY) continue;
        if (this.hitPoints.length === 0) return best;
        if (best.x === this.hitPoints[0].x) {
          if (this.sinkHitDirection !== VERTICAL) return best;
          if (best.y !== this.hitPoints[0].y) continue;
          return best;
        }
        if (this.sinkHitDirection === HORIZONTAL) continue;
        if (best.y !== this.hitPoints[0].y) continue;
        return best;
      }

      for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
          if (this.board[x][y].state === HIT) {
            this.setupSinkStack({ x, y });
            if (this.sunkStack.length > 0) return this.sunkStack.pop();
          }
        }
      }
      return null;
    }
  }

  getSunkLength() {
    const latest = this.hitPoints[this.hitPoints.length - 1];
    const first = this.hitPoints[Math.max(this.hitPoints.length - 2, 0)];
    let len = 0;

    if (latest.x === first.x) {
      let startY = latest.y;
      for (const p of this.hitPoints) if (p.x === latest.x && p.y < startY) startY = p.y;
      for (let y = startY; y < BOARD_SIZE && this.board[latest.x][y].state === HIT; y++) len++;
    } else {
      let startX = latest.x;
      for (const p of this.hitPoints) if (p.y === latest.y && p.x < startX) startX = p.x;
      for (let x = startX; x < BOARD_SIZE && this.board[x][latest.y].state === HIT; x++) len++;
    }
    return len;
  }

  setCellStateSunk(shipLength) {
    const last = this.hitPoints[this.hitPoints.length - 1];
    const secondLast = this.hitPoints[Math.max(this.hitPoints.length - 2, 0)];

    if (last.x === secondLast.x) {
      let startY = last.y;
      for (const p of this.hitPoints) if (p.x === last.x && p.y < startY) startY = p.y;
      for (let y = startY; y < startY + shipLength; y++) this.board[last.x][y].state = SUNK;
    } else {
      let startX = last.x;
      for (const p of this.hitPoints) if (p.y === last.y && p.x < startX) startX = p.x;
      for (let x = startX; x < startX + shipLength; x++) this.board[x][last.y].state = SUNK;
    }
  }
}

/** Run one full game step-by-step, returning snapshots of each turn */
export function simulateGame() {
  const gameBoard = new GameBoard();
  const vf = new VirtualField();
  const snapshots = [];
  let shotNumber = 0;

  while (!gameBoard.allSunk()) {
    // Apply diagonal skew if applicable
    if (vf.aliveShips.length === 1 && vf.aliveShips[0] === 2 && vf.hitPoints.length === 0) {
      vf.diagonalSkew();
    }

    vf.updateProbability();

    const shipsSunkBefore = gameBoard.shipsSunk;
    let shot = vf.sinkMode();
    if (!shot) shot = vf.getNextShot();
    if (!shot) break;

    const result = gameBoard.shoot(shot.x, shot.y);
    shotNumber++;

    if (result.hit) {
      vf.handleShotHit(shot);
    } else {
      vf.board[shot.x][shot.y].state = MISS;
    }

    // Handle after shot (sunk logic)
    const shipsSunkAfter = gameBoard.shipsSunk;
    if (shipsSunkAfter > shipsSunkBefore) {
      const length = vf.getSunkLength();
      let foundShip = false;
      for (let i = 0; i < vf.aliveShips.length; i++) {
        if (length === vf.aliveShips[i] && length > 1) {
          vf.aliveShips.splice(i, 1);
          foundShip = true;
          break;
        }
      }
      if (foundShip) vf.setCellStateSunk(length);
      vf.board[shot.x][shot.y].state = SUNK;
      vf.sunkStack = [];
      vf.hitPoints = [];

      if (shipsSunkAfter === SHIP_SIZES.length - 1) {
        let shotHits = vf.countState(HIT) + vf.countState(SUNK);
        shotHits = Math.min(19, shotHits);
        vf.aliveShips = [vf.maxHits - shotHits];
      }
    }

    // Determine the phase
    let phase = 'hunting';
    if (vf.sunkStack.length > 0 || vf.hitPoints.length > 0) phase = 'sinking';
    if (vf.aliveShips.length === 1 && vf.aliveShips[0] === 2) phase = 'endgame';

    // Create snapshot
    snapshots.push({
      shotNumber,
      shot: { x: shot.x, y: shot.y },
      result: result.hit ? (result.sunk ? 'sunk' : 'hit') : 'miss',
      phase,
      // Deep copy board states
      virtualBoard: vf.board.map(row => row.map(c => ({ state: c.state, probability: c.probability }))),
      actualBoard: gameBoard.board.map(row => row.map(c => ({ state: c.state }))),
      aliveShips: [...vf.aliveShips],
      shipsSunk: gameBoard.shipsSunk,
      // Ship positions for display
      ships: gameBoard.ships.map(s => ({ ...s, cells: [...s.cells] })),
    });
  }

  return {
    totalShots: shotNumber,
    snapshots,
    ships: gameBoard.ships,
  };
}

/** Run N games and return just the shot counts */
export function runBatchSimulation(numGames) {
  const results = [];
  for (let i = 0; i < numGames; i++) {
    const game = simulateGame();
    results.push(game.totalShots);
  }
  return results;
}

export { BOARD_SIZE, SHIP_SIZES, EMPTY, HIT, MISS, SUNK, SHIP };
