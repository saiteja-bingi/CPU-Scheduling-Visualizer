import React from 'react'
import { Play, Pause, RotateCcw, StepForward, StepBack, Clock, Cpu } from 'lucide-react'
import { ALGORITHMS } from '../algorithms/types.js'

export function SimulationControls({
  selectedAlgorithm,
  onSelectAlgorithm,
  algorithmOptions,
  onChangeAlgorithmOptions,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  speed,
  onChangeSpeed,
  currentStep,
  totalSteps,
  currentTime,
  totalTime,
  onSeekStep,
}) {

  return (
    <div className="card simulation-controls-card">
      <div className="controls-primary-bar">
        {/* Algorithm selection & parameters */}
        <div className="algo-select-group">
          <div className="algo-label">
            <Cpu size={16} />
            <span>Algorithm:</span>
          </div>
          <select
            className="algo-dropdown"
            value={selectedAlgorithm}
            onChange={(e) => onSelectAlgorithm(e.target.value)}
          >
            {Object.values(ALGORITHMS).map((algo) => (
              <option key={algo.id} value={algo.id}>
                {algo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm parameters (Quantum, Priority order) */}
        <div className="algo-options-bar">
          {selectedAlgorithm === 'ROUND_ROBIN' && (
            <div className="param-item">
              <label>Time Quantum:</label>
              <input
                type="number"
                min="1"
                max="20"
                className="param-input"
                value={algorithmOptions.quantum ?? 2}
                onChange={(e) =>
                  onChangeAlgorithmOptions({
                    ...algorithmOptions,
                    quantum: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
              />
            </div>
          )}

          {(selectedAlgorithm === 'PRIORITY_NP' || selectedAlgorithm === 'PRIORITY_P') && (
            <div className="param-item">
              <label>Priority Rank:</label>
              <select
                className="param-select"
                value={algorithmOptions.priorityOrder ?? 'lower'}
                onChange={(e) =>
                  onChangeAlgorithmOptions({
                    ...algorithmOptions,
                    priorityOrder: e.target.value,
                  })
                }
              >
                <option value="lower">Lower # = Higher Priority</option>
                <option value="higher">Higher # = Higher Priority</option>
              </select>
            </div>
          )}
        </div>

        {/* Execution control buttons */}
        <div className="playback-buttons">
          <button
            className="btn btn-secondary icon-control-btn"
            onClick={onReset}
            title="Reset to start (t=0)"
            disabled={totalSteps === 0}
          >
            <RotateCcw size={16} />
          </button>

          <button
            className="btn btn-secondary icon-control-btn"
            onClick={onStepBackward}
            disabled={currentStep <= 0}
            title="Step Backward 1 unit"
          >
            <StepBack size={16} />
          </button>

          {isPlaying ? (
            <button className="btn btn-primary play-pause-btn" onClick={onPause}>
              <Pause size={18} />
              <span>Pause</span>
            </button>
          ) : (
            <button
              className="btn btn-success play-pause-btn"
              onClick={onPlay}
              disabled={totalSteps === 0 || currentStep >= totalSteps - 1}
            >
              <Play size={18} />
              <span>{currentStep > 0 && currentStep < totalSteps - 1 ? 'Resume' : 'Play'}</span>
            </button>
          )}

          <button
            className="btn btn-secondary icon-control-btn"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
            title="Step Forward 1 unit"
          >
            <StepForward size={16} />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="speed-control-group">
          <Clock size={15} className="text-muted" />
          <span className="speed-label">Speed:</span>
          <div className="speed-pills">
            {[
              { label: '0.5x', ms: 1200 },
              { label: '1x', ms: 600 },
              { label: '2x', ms: 300 },
              { label: '4x', ms: 120 },
            ].map((s) => (
              <button
                key={s.label}
                className={`speed-pill ${speed === s.ms ? 'active' : ''}`}
                onClick={() => onChangeSpeed(s.ms)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrubbing Timeline */}
      <div className="timeline-scrubber-bar">
        <div className="time-readout">
          <span className="time-current font-mono">Time: t={currentTime}</span>
          <span className="time-divider">/</span>
          <span className="time-total font-mono">{totalTime} ms</span>
        </div>

        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onSeekStep(Number(e.target.value))}
          className="scrubber-slider"
          disabled={totalSteps <= 1}
        />

        <div className="step-readout font-mono">
          Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
        </div>
      </div>
    </div>
  )
}
