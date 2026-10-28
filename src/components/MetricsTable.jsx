import React from 'react'
import {
  Clock,
  RotateCcw,
  Zap,
  Trash2,
} from 'lucide-react'
import { getProcessColor } from '../utils/colors.js'

export function MetricsTable({ processMetrics, summaryMetrics, onDeleteProcess }) {
  if (!processMetrics || processMetrics.length === 0) {
    return null
  }

  const {
    avgWaitingTime = 0,
    avgTurnaroundTime = 0,
    avgResponseTime = 0,
  } = summaryMetrics || {}

  return (
    <div className="metrics-section">
      {/* Summary Cards */}
      <div className="metrics-summary-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-title">Avg. Waiting Time</span>
            <Clock size={16} className="metric-icon" />
          </div>
          <div className="metric-value font-mono">{avgWaitingTime} <span className="metric-unit">ms</span></div>
          <div className="metric-formula text-xs text-muted">Average time spent in ready queue</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-title">Avg. Turnaround Time</span>
            <RotateCcw size={16} className="metric-icon" />
          </div>
          <div className="metric-value font-mono">{avgTurnaroundTime} <span className="metric-unit">ms</span></div>
          <div className="metric-formula text-xs text-muted">Average time from arrival to completion</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-title">Avg. Response Time</span>
            <Zap size={16} className="metric-icon" />
          </div>
          <div className="metric-value font-mono">{avgResponseTime} <span className="metric-unit">ms</span></div>
          <div className="metric-formula text-xs text-muted">Average time until first execution</div>
        </div>
      </div>

      {/* Process-Level Breakdown Table */}
      <div className="card process-metrics-table-card">
        <div className="card-header">
          <div className="card-title">
            <span>Process Metrics</span>
          </div>
          <div className="table-legend text-xs text-muted">
            <span>AT = Arrival &bull; BT = Burst &bull; CT = Completion &bull; TAT = Turnaround &bull; WT = Waiting &bull; RT = Response</span>
          </div>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>Arrival Time (AT)</th>
                <th>Burst Time (BT)</th>
                <th>Priority</th>
                <th>Completion Time (CT)</th>
                <th>Turnaround Time (TAT)</th>
                <th>Waiting Time (WT)</th>
                <th>Response Time (RT)</th>
                {onDeleteProcess && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {processMetrics.map((p, idx) => {
                const color = getProcessColor(p.id, idx)
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="process-tag">
                        <span
                          className="color-dot"
                          style={{
                            backgroundColor: color.solid,
                          }}
                        />
                        <span className="font-mono font-semibold">{p.id}</span>
                      </div>
                    </td>
                    <td className="font-mono">{p.arrivalTime}</td>
                    <td className="font-mono">{p.burstTime}</td>
                    <td>
                      <span className="badge badge-neutral font-mono">{p.priority}</span>
                    </td>
                    <td className="font-mono font-medium">{p.completionTime}</td>
                    <td className="font-mono font-medium">{p.turnaroundTime}</td>
                    <td className="font-mono font-medium">{p.waitingTime}</td>
                    <td className="font-mono font-medium">{p.responseTime}</td>
                    {onDeleteProcess && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="icon-btn delete-icon"
                          onClick={() => onDeleteProcess(p.id)}
                          title={`Delete process ${p.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
