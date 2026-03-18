export default function Stats({ snapshot, totalShots, gameHistory }) {
  const avg = gameHistory.length > 0
    ? (gameHistory.reduce((a, b) => a + b, 0) / gameHistory.length).toFixed(2)
    : '—';

  const min = gameHistory.length > 0 ? Math.min(...gameHistory) : '—';
  const max = gameHistory.length > 0 ? Math.max(...gameHistory) : '—';

  return (
    <div className="stats-panel">
      <h3>Game Stats</h3>

      {snapshot && (
        <div className="stats-current">
          <div className="stat-row">
            <span className="stat-label">Shot #</span>
            <span className="stat-value">{snapshot.shotNumber}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Target</span>
            <span className="stat-value">
              ({String.fromCharCode(65 + snapshot.shot.x)}{snapshot.shot.y + 1})
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Result</span>
            <span className={`stat-value result-${snapshot.result}`}>
              {snapshot.result.toUpperCase()}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Phase</span>
            <span className={`stat-value phase-${snapshot.phase}`}>
              {snapshot.phase === 'hunting' && '🔍 Probability Hunt'}
              {snapshot.phase === 'sinking' && '🎯 Tactical Sink'}
              {snapshot.phase === 'endgame' && '♟ Diagonal Parity'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Ships Sunk</span>
            <span className="stat-value">{snapshot.shipsSunk} / 5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Ships Alive</span>
            <span className="stat-value">
              {snapshot.aliveShips.length > 0 ? `[${snapshot.aliveShips.join(', ')}]` : 'None'}
            </span>
          </div>
        </div>
      )}

      <hr className="stats-divider" />

      <div className="stats-history">
        <h4>Session History ({gameHistory.length} games)</h4>
        <div className="stat-row">
          <span className="stat-label">Average</span>
          <span className="stat-value">{avg}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Best</span>
          <span className="stat-value">{min}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Worst</span>
          <span className="stat-value">{max}</span>
        </div>
      </div>

      {totalShots !== null && (
        <>
          <hr className="stats-divider" />
          <div className="stat-row total-row">
            <span className="stat-label">Total Shots</span>
            <span className="stat-value">{totalShots}</span>
          </div>
        </>
      )}
    </div>
  );
}
