import React from 'react'
import { Cpu, ListOrdered, Hourglass } from 'lucide-react'
import { getProcessColor, IDLE_PALETTE } from '../utils/colors.js'

export function ReadyQueueView({
  currentSnapshot,
  processes,
  currentTime,
}) {
  const runningPid = currentSnapshot?.runningPid
  const readyQueue = currentSnapshot?.readyQueue || []
  const completed = new Set(currentSnapshot?.completed || [])
  const remainingMap = currentSnapshot?.remainingMap || {}

  const runningColor = runningPid ? getProcessColor(runningPid) : IDLE_PALETTE
  const runningProcess = processes.find(p => p.id === runningPid)

  return (
    <div className="ready-queue-grid">
      {/* Active CPU Processor Card */}
      <div className="card cpu-status-card">
        <div className="card-header">
          <div className="card-title">
            <Cpu size={18} />
            <span>CPU Status</span>
          </div>
          <span className={`badge ${runningPid ? 'badge-emerald' : 'badge-neutral'}`}>
            {runningPid ? 'Running' : 'Idle'}
          </span>
        </div>

        <div className="cpu-core-display">
          {runningPid ? (
            <div
              className="active-process-box"
              style={{
                borderColor: runningColor.border,
                backgroundColor: runningColor.bg,
              }}
            >
              <div className="active-pid-badge font-mono" style={{ color: runningColor.text }}>
                {runningPid}
              </div>
              <div className="active-details">
                <div className="detail-row">
                  <span className="text-muted">Remaining Burst:</span>
                  <span className="font-mono text-bold">
                    {remainingMap[runningPid] ?? 0} ms
                  </span>
                </div>
                <div className="detail-row">
                  <span className="text-muted">Total Burst:</span>
                  <span className="font-mono">{runningProcess?.burstTime} ms</span>
                </div>
                {runningProcess?.priority !== undefined && (
                  <div className="detail-row">
                    <span className="text-muted">Priority:</span>
                    <span className="badge badge-amber font-mono">{runningProcess.priority}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="cpu-idle-box">
              <Hourglass size={28} className="text-faint" />
              <div className="idle-title">CPU is Idle</div>
              <div className="idle-subtitle">No process executing at t={currentTime}</div>
            </div>
          )}
        </div>
      </div>

      {/* Live Ready Queue Card */}
      <div className="card live-queue-card">
        <div className="card-header">
          <div className="card-title">
            <ListOrdered size={18} />
            <span>Ready Queue</span>
            <span className="badge badge-neutral">{readyQueue.length} Waiting</span>
          </div>
          <span className="text-muted text-xs font-mono">Order: Head &rarr; Tail</span>
        </div>

        <div className="queue-track">
          {readyQueue.length === 0 ? (
            <div className="empty-queue-message">
              <span>Ready queue is empty at t={currentTime}</span>
            </div>
          ) : (
            <div className="queue-items-list">
              {readyQueue.map((item, idx) => {
                const color = getProcessColor(item.id)
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="queue-process-pill"
                    style={{
                      borderColor: color.border,
                      backgroundColor: color.bg,
                    }}
                  >
                    <div className="qp-header">
                      <span className="font-mono qp-name" style={{ color: color.text }}>
                        {item.id}
                      </span>
                    </div>
                    <div className="qp-stats font-mono">
                      <span>Rem: {item.remainingTime ?? remainingMap[item.id] ?? 0}ms</span>
                      {item.priority !== undefined && <span>P:{item.priority}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Process Status Matrix */}
        <div className="process-states-footer">
          <div className="states-heading text-xs text-muted">All Process States at t={currentTime}:</div>
          <div className="process-states-chips">
            {processes.map((p) => {
              const rem = remainingMap[p.id] ?? p.burstTime
              const isComp = completed.has(p.id)
              const isRun = runningPid === p.id
              const isReady = p.arrivalTime <= currentTime && !isComp && !isRun

              let stateClass = 'state-future'
              let stateLabel = `Arrives t=${p.arrivalTime}`
              if (isComp) {
                stateClass = 'state-completed'
                stateLabel = 'Finished'
              } else if (isRun) {
                stateClass = 'state-running'
                stateLabel = 'Running'
              } else if (isReady) {
                stateClass = 'state-ready'
                stateLabel = `Ready (rem: ${rem})`
              }

              return (
                <div key={p.id} className={`process-state-chip ${stateClass}`}>
                  <span className="font-mono chip-pid">{p.id}</span>
                  <span className="chip-label">{stateLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
