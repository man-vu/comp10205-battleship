import { useState } from 'react';

export default function Controls({
  onNewGame,
  onStep,
  onAutoPlay,
  onPause,
  isPlaying,
  currentStep,
  totalSteps,
  onSeek,
  speed,
  onSpeedChange,
  showShips,
  onToggleShips,
}) {
  return (
    <div className="controls">
      <div className="controls-row">
        <button className="btn btn-primary" onClick={onNewGame}>New Game</button>
        <button className="btn" onClick={onStep} disabled={isPlaying || currentStep >= totalSteps}>
          Step →
        </button>
        {!isPlaying ? (
          <button className="btn btn-play" onClick={onAutoPlay} disabled={currentStep >= totalSteps}>
            ▶ Play
          </button>
        ) : (
          <button className="btn btn-pause" onClick={onPause}>
            ⏸ Pause
          </button>
        )}
        <button className="btn" onClick={() => onSeek(0)} disabled={isPlaying || currentStep === 0}>
          ⏮ Reset
        </button>
      </div>

      <div className="controls-row">
        <label className="speed-label">
          Speed:
          <input
            type="range"
            min={1}
            max={50}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="speed-slider"
          />
          <span>{speed}x</span>
        </label>
        <label className="toggle-label">
          <input type="checkbox" checked={showShips} onChange={onToggleShips} />
          Show Ships
        </label>
      </div>

      <div className="controls-row">
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="seek-slider"
          disabled={isPlaying}
        />
        <span className="step-counter">
          Shot {currentStep} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
