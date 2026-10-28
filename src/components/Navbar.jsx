import React from 'react'
import { Cpu, Activity, BarChart3 } from 'lucide-react'

export function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <div className="brand-icon">
          <Cpu size={20} />
        </div>
        <div>
          <h1 className="brand-title">CPU Scheduling Simulator</h1>
          <p className="brand-subtitle">Process Execution & Algorithm Analysis</p>
        </div>
      </div>

      <nav className="navbar-nav">
        <button
          className={`nav-tab ${activeTab === 'visualizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizer')}
        >
          <Activity size={16} />
          <span>Visualizer</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <BarChart3 size={16} />
          <span>Comparison</span>
        </button>
      </nav>
    </header>
  )
}
