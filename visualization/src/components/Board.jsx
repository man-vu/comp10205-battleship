import { BOARD_SIZE, EMPTY, HIT, MISS, SUNK, SHIP } from '../engine/battleship';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function getCellClass(state, isCurrentShot) {
  let cls = 'cell';
  if (state === HIT) cls += ' cell-hit';
  else if (state === MISS) cls += ' cell-miss';
  else if (state === SUNK) cls += ' cell-sunk';
  else if (state === SHIP) cls += ' cell-ship';
  else cls += ' cell-empty';
  if (isCurrentShot) cls += ' cell-current';
  return cls;
}

function getProbColor(prob, maxProb) {
  if (maxProb === 0) return 'rgba(59, 130, 246, 0)';
  const intensity = prob / maxProb;
  return `rgba(59, 130, 246, ${intensity * 0.85})`;
}

export default function Board({ board, title, showProbability, currentShot, showShips, ships }) {
  let maxProb = 0;
  if (showProbability && board) {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c].probability > maxProb) maxProb = board[r][c].probability;
  }

  // Build a set of ship cells for the actual board overlay
  const shipCellSet = new Set();
  if (showShips && ships) {
    for (const ship of ships) {
      for (const c of ship.cells) {
        shipCellSet.add(`${c.x},${c.y}`);
      }
    }
  }

  return (
    <div className="board-container">
      <h3 className="board-title">{title}</h3>
      <div className="board-grid">
        {/* Column labels */}
        <div className="board-label corner"></div>
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <div key={i} className="board-label col-label">{i + 1}</div>
        ))}

        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <div key={row} className="board-row">
            <div className="board-label row-label">{LABELS[row]}</div>
            {Array.from({ length: BOARD_SIZE }, (_, col) => {
              const cell = board?.[row]?.[col];
              const state = cell?.state || EMPTY;
              const isCurrentShot = currentShot && currentShot.x === row && currentShot.y === col;
              const isShipCell = shipCellSet.has(`${col},${row}`);

              // For actual board, show ships underneath
              let displayState = state;
              if (showShips && isShipCell && state === EMPTY) {
                displayState = SHIP;
              }

              const probStyle = showProbability && state === EMPTY && cell
                ? { backgroundColor: getProbColor(cell.probability, maxProb) }
                : {};

              return (
                <div
                  key={col}
                  className={getCellClass(displayState, isCurrentShot)}
                  style={probStyle}
                  title={`(${LABELS[row]}${col + 1}) ${showProbability && cell ? `P: ${cell.probability.toFixed(1)}` : state}`}
                >
                  {state === HIT && '🔥'}
                  {state === MISS && '•'}
                  {state === SUNK && '✕'}
                  {showProbability && state === EMPTY && cell && cell.probability > 0 && (
                    <span className="prob-text">{cell.probability.toFixed(0)}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
