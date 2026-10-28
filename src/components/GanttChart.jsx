import React, { useState, useRef } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Layers } from 'lucide-react'
import { getProcessColor, IDLE_PALETTE } from '../utils/colors.js'

export function GanttChart({ ganttBlocks, currentTime, totalTime, processes }) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const chartScrollRef = useRef(null)

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))
  const handleResetZoom = () => setZoomLevel(1)

  const handleMouseMove = (e, block) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX,
      y: rect.top - 10,
    })
    setHoveredBlock(block)
  }

  const handleMouseLeave = () => {
    setHoveredBlock(null)
  }

  if (!ganttBlocks || ganttBlocks.length === 0) {
    return (
      <div className="card gantt-card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} className="text-cyan" />
            <span>Interactive Gantt Chart</span>
          </div>
        </div>
        <div className="empty-state">
          <p className="empty-title">Simulation Not Started</p>
          <p className="empty-desc">Add processes or load an example scenario to view the execution timeline.</p>
        </div>
      </div>
    )
  }

  const makespan = totalTime || (ganttBlocks[ganttBlocks.length - 1]?.endTime ?? 1)
  // Base scale: 40px per time unit * zoomLevel
  const unitWidth = Math.max(25, 42 * zoomLevel)
  const totalChartWidth = makespan * unitWidth

  // Current simulation cursor position in px
  const cursorLeft = (currentTime || 0) * unitWidth

  return (
    <div className="card gantt-card">
      <div className="card-header">
        <div className="card-title">
          <Layers size={18} />
          <span>Gantt Chart</span>
          <span className="badge badge-neutral">Total Time: {makespan} ms</span>
        </div>

        <div className="gantt-controls">
          <div className="zoom-btn-group">
            <button className="icon-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={15} />
            </button>
            <span className="zoom-indicator font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button className="icon-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={15} />
            </button>
            <button className="icon-btn" onClick={handleResetZoom} title="Reset Zoom">
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main scrollable chart container */}
      <div className="gantt-scroll-container" ref={chartScrollRef}>
        <div className="gantt-track-wrapper" style={{ width: `${Math.max(totalChartWidth + 60, 600)}px` }}>
          {/* Timeline Time Rulers */}
          <div className="gantt-time-ruler">
            {Array.from({ length: makespan + 1 }).map((_, t) => (
              <div
                key={t}
                className="ruler-tick"
                style={{ left: `${t * unitWidth}px` }}
              >
                <div className="tick-line" />
                <span className="tick-label font-mono">{t}</span>
              </div>
            ))}
          </div>

          {/* Gantt Blocks Bar */}
          <div className="gantt-blocks-track">
            {ganttBlocks.map((block, index) => {
              const dur = block.endTime - block.startTime
              const blockWidth = dur * unitWidth
              const blockLeft = block.startTime * unitWidth
              const isIdle = block.isIdle || block.pid === 'IDLE'
              const color = isIdle ? IDLE_PALETTE : getProcessColor(block.pid)

              return (
                <div
                  key={`${block.pid}-${block.startTime}-${index}`}
                  className={`gantt-block ${isIdle ? 'gantt-idle-block' : 'gantt-active-block'}`}
                  style={{
                    left: `${blockLeft}px`,
                    width: `${blockWidth}px`,
                    backgroundColor: color.bg,
                    borderColor: color.border,
                  }}
                  onMouseMove={(e) => handleMouseMove(e, block)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="block-content">
                    <span
                      className="block-label font-mono"
                      style={{ color: color.text }}
                    >
                      {isIdle ? 'IDLE' : block.pid}
                    </span>
                    <span className="block-duration font-mono">{dur}ms</span>
                  </div>

                  <div className="block-timestamp block-start font-mono">{block.startTime}</div>
                  <div className="block-timestamp block-end font-mono">{block.endTime}</div>
                </div>
              )
            })}

            {/* Live Playhead / Execution Cursor */}
            <div
              className="gantt-playhead"
              style={{ left: `${cursorLeft}px` }}
            >
              <div className="playhead-line" />
              <div className="playhead-badge font-mono">t={currentTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {hoveredBlock && (
        <div
          className="gantt-tooltip"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="tooltip-header">
            <strong>{hoveredBlock.isIdle ? 'CPU Idle' : `Process: ${hoveredBlock.pid}`}</strong>
          </div>
          <div className="tooltip-body font-mono">
            <div>Start: {hoveredBlock.startTime} ms</div>
            <div>End: {hoveredBlock.endTime} ms</div>
            <div>Duration: {hoveredBlock.endTime - hoveredBlock.startTime} ms</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="gantt-legend">
        <div className="legend-item">
          <div className="legend-box idle-box" />
          <span>CPU Idle</span>
        </div>
        {processes.map((p, idx) => {
          const col = getProcessColor(p.id, idx)
          return (
            <div key={p.id} className="legend-item">
              <div
                className="legend-box"
                style={{ backgroundColor: col.border }}
              />
              <span className="font-mono">{p.id}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
