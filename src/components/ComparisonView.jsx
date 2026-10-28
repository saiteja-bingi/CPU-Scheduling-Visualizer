import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  Filter,
} from 'lucide-react'
import { ALGORITHMS } from '../algorithms/types.js'
import { runComparison } from '../algorithms/index.js'

export function ComparisonView({ processes, algorithmOptions }) {
  const [selectedAlgoIds, setSelectedAlgoIds] = useState(Object.keys(ALGORITHMS))
  const [activeMetricTab, setActiveMetricTab] = useState('avgWaitingTime') // 'avgWaitingTime' | 'avgTurnaroundTime' | 'avgResponseTime' | 'contextSwitches'

  const toggleAlgo = (id) => {
    setSelectedAlgoIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev // keep at least 1
        return prev.filter((a) => a !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const selectAll = () => setSelectedAlgoIds(Object.keys(ALGORITHMS))
  const deselectAll = () => setSelectedAlgoIds(['FCFS', 'SJF', 'ROUND_ROBIN'])

  // Run benchmark comparison
  const comparisonResults = useMemo(() => {
    if (!processes || processes.length === 0) return []
    return runComparison(processes, selectedAlgoIds, algorithmOptions)
  }, [processes, selectedAlgoIds, algorithmOptions])

  // Find best metrics
  const bestWT = useMemo(() => {
    if (comparisonResults.length === 0) return null
    return Math.min(...comparisonResults.map((r) => r.avgWaitingTime))
  }, [comparisonResults])

  const bestTAT = useMemo(() => {
    if (comparisonResults.length === 0) return null
    return Math.min(...comparisonResults.map((r) => r.avgTurnaroundTime))
  }, [comparisonResults])

  const bestRT = useMemo(() => {
    if (comparisonResults.length === 0) return null
    return Math.min(...comparisonResults.map((r) => r.avgResponseTime))
  }, [comparisonResults])

  const bestUtil = useMemo(() => {
    if (comparisonResults.length === 0) return null
    return Math.max(...comparisonResults.map((r) => r.cpuUtilization))
  }, [comparisonResults])

  // Metric metadata
  const metricTabs = [
    { key: 'avgWaitingTime', label: 'Average Waiting Time', unit: 'ms', lowerIsBetter: true },
    { key: 'avgTurnaroundTime', label: 'Average Turnaround Time', unit: 'ms', lowerIsBetter: true },
    { key: 'avgResponseTime', label: 'Average Response Time', unit: 'ms', lowerIsBetter: true },
    { key: 'contextSwitches', label: 'Context Switches', unit: 'switches', lowerIsBetter: true },
    { key: 'cpuUtilization', label: 'CPU Utilization', unit: '%', lowerIsBetter: false },
  ]

  const activeMeta = metricTabs.find((m) => m.key === activeMetricTab) || metricTabs[0]

  // Find max value for bar chart scaling
  const maxMetricVal = useMemo(() => {
    if (comparisonResults.length === 0) return 1
    const vals = comparisonResults.map((r) => r[activeMetricTab] || 0)
    return Math.max(1, ...vals)
  }, [comparisonResults, activeMetricTab])

  if (!processes || processes.length === 0) {
    return (
      <div className="card comparison-card">
        <div className="empty-state">
          <BarChart3 size={32} className="empty-icon" />
          <p className="empty-title">No Processes to Compare</p>
          <p className="empty-desc">Add processes in the Visualizer tab to benchmark all scheduling algorithms side-by-side.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="comparison-container">
      {/* Algorithm Filter Selection */}
      <div className="card filter-card">
        <div className="card-header">
          <div className="card-title">
            <Filter size={16} />
            <span>Select Algorithms ({selectedAlgoIds.length}/{Object.keys(ALGORITHMS).length})</span>
          </div>
          <div className="filter-actions">
            <button className="btn btn-secondary btn-xs" onClick={selectAll}>Select All</button>
            <button className="btn btn-secondary btn-xs" onClick={deselectAll}>Minimal Set</button>
          </div>
        </div>

        <div className="algo-checkboxes-grid">
          {Object.values(ALGORITHMS).map((algo) => {
            const isChecked = selectedAlgoIds.includes(algo.id)
            return (
              <label
                key={algo.id}
                className={`algo-checkbox-pill ${isChecked ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAlgo(algo.id)}
                />
                <span>{algo.shortName}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Comparative Bar Chart Card */}
      <div className="card comparison-chart-card">
        <div className="card-header">
          <div className="card-title">
            <BarChart3 size={18} />
            <span>Benchmark Comparison</span>
          </div>

          <div className="metric-tabs-group">
            {metricTabs.map((tab) => (
              <button
                key={tab.key}
                className={`metric-tab-btn ${activeMetricTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveMetricTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bars-container">
          {comparisonResults.map((res) => {
            const val = res[activeMetricTab] || 0
            const percentage = (val / maxMetricVal) * 100
            const isBest =
              activeMeta.lowerIsBetter
                ? val === Math.min(...comparisonResults.map((r) => r[activeMetricTab]))
                : val === Math.max(...comparisonResults.map((r) => r[activeMetricTab]))

            return (
              <div key={res.algorithmId} className="bar-row">
                <div className="bar-label font-mono">
                  <span>{res.shortName}</span>
                  {isBest && <span className="best-tag">BEST</span>}
                </div>

                <div className="bar-track">
                  <div
                    className={`bar-fill ${isBest ? 'bar-fill-best' : ''}`}
                    style={{ width: `${Math.max(4, percentage)}%` }}
                  >
                    <span className="bar-value-text font-mono">
                      {val} {activeMeta.unit}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Side-by-Side Comparison Table */}
      <div className="card comparison-table-card">
        <div className="card-header">
          <div className="card-title">
            <span>Algorithm Comparison Table</span>
          </div>
          <span className="badge badge-neutral">Lowest Latency Highlighted</span>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Avg. Waiting Time</th>
                <th>Avg. Turnaround Time</th>
                <th>Avg. Response Time</th>
                <th>CPU Utilization</th>
                <th>Throughput</th>
                <th>Context Switches</th>
                <th>Makespan</th>
              </tr>
            </thead>
            <tbody>
              {comparisonResults.map((res) => {
                const isBestWT = res.avgWaitingTime === bestWT
                const isBestTAT = res.avgTurnaroundTime === bestTAT
                const isBestRT = res.avgResponseTime === bestRT
                const isBestUtil = res.cpuUtilization === bestUtil

                return (
                  <tr key={res.algorithmId}>
                    <td>
                      <div className="algo-cell">
                        <strong className="font-mono">{res.shortName}</strong>
                        <span className="text-muted text-xs">{res.name}</span>
                      </div>
                    </td>

                    <td className="font-mono">
                      <span className={isBestWT ? 'best-metric-cell' : ''}>
                        {res.avgWaitingTime} ms {isBestWT && '★'}
                      </span>
                    </td>

                    <td className="font-mono">
                      <span className={isBestTAT ? 'best-metric-cell' : ''}>
                        {res.avgTurnaroundTime} ms {isBestTAT && '★'}
                      </span>
                    </td>

                    <td className="font-mono">
                      <span className={isBestRT ? 'best-metric-cell' : ''}>
                        {res.avgResponseTime} ms {isBestRT && '★'}
                      </span>
                    </td>

                    <td className="font-mono">
                      <span className={isBestUtil ? 'best-metric-cell' : ''}>
                        {res.cpuUtilization}%
                      </span>
                    </td>

                    <td className="font-mono">{res.throughput} proc/ms</td>
                    <td className="font-mono">{res.contextSwitches}</td>
                    <td className="font-mono">{res.totalExecutionTime} ms</td>
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
