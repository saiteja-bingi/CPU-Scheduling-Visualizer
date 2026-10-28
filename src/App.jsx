import React, { useState, useEffect, useMemo } from 'react'
import { Navbar } from './components/Navbar.jsx'
import { ProcessManager } from './components/ProcessManager.jsx'
import { SimulationControls } from './components/SimulationControls.jsx'
import { GanttChart } from './components/GanttChart.jsx'
import { ReadyQueueView } from './components/ReadyQueueView.jsx'
import { MetricsTable } from './components/MetricsTable.jsx'
import { ComparisonView } from './components/ComparisonView.jsx'
import { runSchedulingAlgorithm } from './algorithms/index.js'
import './App.css'

const DEFAULT_PROCESSES = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 },
  { id: 'P5', arrivalTime: 4, burstTime: 2, priority: 5 },
]

function App() {
  const [activeTab, setActiveTab] = useState('visualizer')
  const [processes, setProcesses] = useState(DEFAULT_PROCESSES)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('FCFS')
  const [algorithmOptions, setAlgorithmOptions] = useState({
    quantum: 2,
    priorityOrder: 'lower',
  })

  // Playback state
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(600) // ms per step

  // Run scheduling engine
  const simulationResult = useMemo(() => {
    return runSchedulingAlgorithm(selectedAlgorithm, processes, algorithmOptions)
  }, [selectedAlgorithm, processes, algorithmOptions])

  const {
    ganttBlocks = [],
    timeline = [],
    processMetrics = [],
    summaryMetrics = {},
  } = simulationResult

  // Clamp currentStep if timeline length changes
  useEffect(() => {
    if (timeline.length === 0) {
      setCurrentStep(0)
    } else if (currentStep >= timeline.length) {
      setCurrentStep(timeline.length - 1)
    }
  }, [timeline.length, currentStep])

  // Playback timer
  useEffect(() => {
    let timer = null
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= timeline.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isPlaying, speed, timeline.length])

  // Simulation handlers
  const handlePlay = () => {
    if (timeline.length === 0) return
    if (currentStep >= timeline.length - 1) {
      setCurrentStep(0)
    }
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleStepForward = () => {
    setIsPlaying(false)
    setCurrentStep((prev) => Math.min(prev + 1, timeline.length - 1))
  }

  const handleStepBackward = () => {
    setIsPlaying(false)
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleSeekStep = (step) => {
    setIsPlaying(false)
    setCurrentStep(Math.min(Math.max(0, step), timeline.length - 1))
  }

  // Process management handlers
  const handleAddProcess = (newProcess) => {
    setProcesses((prev) => [...prev, newProcess])
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleDeleteProcess = (id) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id))
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleClearProcesses = () => {
    setProcesses([])
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleGenerateRandom = (count = 4) => {
    const generated = []
    for (let i = 1; i <= count; i++) {
      generated.push({
        id: `P${i}`,
        arrivalTime: i === 1 ? 0 : Math.floor(Math.random() * 6),
        burstTime: Math.floor(Math.random() * 8) + 1,
        priority: Math.floor(Math.random() * 5) + 1,
      })
    }
    // Sort slightly by arrival for realism
    generated.sort((a, b) => a.arrivalTime - b.arrivalTime)
    setProcesses(generated)
    setIsPlaying(false)
    setCurrentStep(0)
  }

  // Current snapshot for live views
  const currentSnapshot = timeline[currentStep] || timeline[0] || null
  const currentTime = currentSnapshot ? currentSnapshot.time : 0
  const totalTime = summaryMetrics.totalExecutionTime || 0

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {activeTab === 'visualizer' && (
          <div className="visualizer-view">
            {/* Simulation controls bar */}
            <SimulationControls
              selectedAlgorithm={selectedAlgorithm}
              onSelectAlgorithm={(algoId) => {
                setSelectedAlgorithm(algoId)
                setIsPlaying(false)
                setCurrentStep(0)
              }}
              algorithmOptions={algorithmOptions}
              onChangeAlgorithmOptions={setAlgorithmOptions}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              speed={speed}
              onChangeSpeed={setSpeed}
              currentStep={currentStep}
              totalSteps={timeline.length}
              currentTime={currentTime}
              totalTime={totalTime}
              onSeekStep={handleSeekStep}
            />

            {/* Interactive Gantt Chart */}
            <GanttChart
              ganttBlocks={ganttBlocks}
              currentTime={currentTime}
              totalTime={totalTime}
              processes={processes}
            />

            {/* Live Ready Queue and CPU status */}
            <ReadyQueueView
              currentSnapshot={currentSnapshot}
              processes={processes}
              currentTime={currentTime}
            />

            {/* Process Performance Metrics */}
            <MetricsTable
              processMetrics={processMetrics}
              summaryMetrics={summaryMetrics}
              onDeleteProcess={handleDeleteProcess}
            />

            {/* Process Workload Configuration Card */}
            <ProcessManager
              processes={processes}
              onAddProcess={handleAddProcess}
              onClearProcesses={handleClearProcesses}
              onGenerateRandom={handleGenerateRandom}
            />
          </div>
        )}

        {activeTab === 'comparison' && (
          <ComparisonView
            processes={processes}
            algorithmOptions={algorithmOptions}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>CPU Scheduling Simulator &bull; OS Process Management</span>
          <span className="footer-subtext">Interactive Timeline &bull; Metrics Analysis</span>
        </div>
      </footer>
    </div>
  )
}

export default App
