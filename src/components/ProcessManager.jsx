import React, { useState } from 'react'
import { Plus, Trash2, Dices, AlertCircle, X } from 'lucide-react'

export function ProcessManager({
  processes,
  onAddProcess,
  onClearProcesses,
  onGenerateRandom,
}) {
  const [formPid, setFormPid] = useState(`P${processes.length + 1}`)
  const [formArrival, setFormArrival] = useState('0')
  const [formBurst, setFormBurst] = useState('4')
  const [formPriority, setFormPriority] = useState('1')
  const [errorMessage, setErrorMessage] = useState('')
  const [randomCount, setRandomCount] = useState(4)

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedPid = formPid.trim()
    const arrival = parseInt(formArrival, 10)
    const burst = parseInt(formBurst, 10)
    const priority = parseInt(formPriority, 10)

    if (!trimmedPid) {
      setErrorMessage('Process ID cannot be empty.')
      return
    }

    if (processes.some((p) => p.id.toLowerCase() === trimmedPid.toLowerCase())) {
      setErrorMessage(`Process ID "${trimmedPid}" already exists. Please choose a unique ID.`)
      return
    }

    if (isNaN(arrival) || arrival < 0) {
      setErrorMessage('Arrival time must be an integer >= 0.')
      return
    }

    if (isNaN(burst) || burst <= 0) {
      setErrorMessage('Burst time must be an integer >= 1.')
      return
    }

    const processData = {
      id: trimmedPid,
      arrivalTime: arrival,
      burstTime: burst,
      priority: isNaN(priority) ? 1 : priority,
    }

    onAddProcess(processData)
    setFormPid(`P${processes.length + 2}`)
    setFormArrival('0')
    setFormBurst('4')
  }

  return (
    <div className="card process-manager-card">
      <div className="card-header">
        <div className="card-title">
          <span>Add Process</span>
          <span className="badge badge-neutral">{processes.length} Configured</span>
        </div>

        <div className="manager-toolbar">
          <div className="random-generator-group">
            <select
              className="small-select"
              value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
            >
              <option value={3}>3 Jobs</option>
              <option value={4}>4 Jobs</option>
              <option value={5}>5 Jobs</option>
              <option value={6}>6 Jobs</option>
              <option value={8}>8 Jobs</option>
            </select>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onGenerateRandom(randomCount)}
              title="Generate randomized process parameters"
            >
              <Dices size={14} />
              <span>Random</span>
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm btn-danger-subtle"
            onClick={onClearProcesses}
            disabled={processes.length === 0}
            title="Clear all processes"
          >
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
          <button className="error-dismiss" onClick={() => setErrorMessage('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="process-form" style={{ marginBottom: 0 }}>
        <div className="form-group">
          <label>Process ID</label>
          <input
            type="text"
            className="form-input"
            value={formPid}
            onChange={(e) => setFormPid(e.target.value)}
            placeholder="e.g. P1"
            required
          />
        </div>

        <div className="form-group">
          <label>Arrival Time (AT)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formArrival}
            onChange={(e) => setFormArrival(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Burst Time (BT)</label>
          <input
            type="number"
            min="1"
            className="form-input"
            value={formBurst}
            onChange={(e) => setFormBurst(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Priority</label>
          <input
            type="number"
            className="form-input"
            value={formPriority}
            onChange={(e) => setFormPriority(e.target.value)}
            title="Priority level"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <Plus size={16} /> Add Process
          </button>
        </div>
      </form>
    </div>
  )
}
