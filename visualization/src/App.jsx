import { useState, useRef, useCallback, useEffect } from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import Stats from './components/Stats';
import Histogram from './components/Histogram';
import { simulateGame, BOARD_SIZE } from './engine/battleship';
import './App.css';

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ state: 'empty', probability: 0 }))
  );
}

export default function App() {
  const [game, setGame] = useState(null);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [showShips, setShowShips] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const timerRef = useRef(null);
  const gameCompletedRef = useRef(false);

  const startNewGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    gameCompletedRef.current = false;
    const newGame = simulateGame();
    setGame(newGame);
    setStep(0);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Track game completion
  useEffect(() => {
    if (game && step === game.snapshots.length && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      setGameHistory(h => [...h, game.totalShots]);
    }
  }, [step, game]);

  const stepForward = useCallback(() => {
    if (!game) return;
    setStep(prev => Math.min(prev + 1, game.snapshots.length));
  }, [game]);

  const autoPlay = useCallback(() => {
    if (!game || step >= game.snapshots.length) return;
    setIsPlaying(true);
  }, [game, step]);

  useEffect(() => {
    if (isPlaying && game) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setStep(prev => {
          const next = prev + 1;
          if (next >= game.snapshots.length) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            return game.snapshots.length;
          }
          return next;
        });
      }, Math.max(10, 500 / speed));
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [speed, isPlaying, game]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const seek = useCallback((value) => {
    setStep(value);
  }, []);

  const snapshot = game && step > 0 ? game.snapshots[step - 1] : null;
  const virtualBoard = snapshot ? snapshot.virtualBoard : emptyBoard();
  const actualBoard = snapshot ? snapshot.actualBoard : emptyBoard();
  const currentShot = snapshot ? snapshot.shot : null;
  const totalSteps = game ? game.snapshots.length : 0;

  return (
    <div className="app">
      <header className="header">
        <h1>Battleship AI Visualizer</h1>
        <p className="subtitle">Probability Density Function + Parity Hunting Strategy</p>
      </header>

      <Controls
        onNewGame={startNewGame}
        onStep={stepForward}
        onAutoPlay={autoPlay}
        onPause={pause}
        isPlaying={isPlaying}
        currentStep={step}
        totalSteps={totalSteps}
        onSeek={seek}
        speed={speed}
        onSpeedChange={setSpeed}
        showShips={showShips}
        onToggleShips={() => setShowShips(s => !s)}
      />

      <div className="main-content">
        <div className="boards">
          <Board
            board={virtualBoard}
            title="Bot's View (Probability Heatmap)"
            showProbability={true}
            currentShot={currentShot}
          />
          <Board
            board={actualBoard}
            title="Actual Board"
            showProbability={false}
            currentShot={currentShot}
            showShips={showShips}
            ships={game?.ships}
          />
        </div>

        <div className="side-panel">
          <Stats
            snapshot={snapshot}
            totalShots={game?.totalShots ?? null}
            gameHistory={gameHistory}
          />
          <Histogram gameHistory={gameHistory} />
        </div>
      </div>

      <div className="legend">
        <span className="legend-item"><span className="legend-swatch swatch-empty"></span> Empty</span>
        <span className="legend-item"><span className="legend-swatch swatch-prob"></span> High Probability</span>
        <span className="legend-item"><span className="legend-swatch swatch-hit"></span> Hit</span>
        <span className="legend-item"><span className="legend-swatch swatch-miss"></span> Miss</span>
        <span className="legend-item"><span className="legend-swatch swatch-sunk"></span> Sunk</span>
        <span className="legend-item"><span className="legend-swatch swatch-ship"></span> Ship (hidden)</span>
        <span className="legend-item"><span className="legend-swatch swatch-current"></span> Current Shot</span>
      </div>
    </div>
  );
}
