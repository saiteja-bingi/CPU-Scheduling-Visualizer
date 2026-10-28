import { calculateMetrics } from './metrics.js'

/**
 * First-Come, First-Served (FCFS) Scheduling
 */
export function scheduleFCFS(inputProcesses) {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      ganttBlocks: [],
      timeline: [],
      ...calculateMetrics([], []),
    }
  }

  // Clone processes
  const processes = inputProcesses.map((p, idx) => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    priority: p.priority !== undefined ? Number(p.priority) : 1,
    queue: p.queue || 1,
    originalIndex: idx,
  }))

  const ganttBlocks = []
  const timeline = []
  const n = processes.length

  const remaining = {}
  processes.forEach(p => {
    remaining[p.id] = p.burstTime
  })

  let currentTime = 0
  let completedCount = 0
  const completedSet = new Set()

  // Track the highest arrival time to make sure we don't terminate prematurely
  const maxArrival = Math.max(...processes.map(p => p.arrivalTime))

  while (completedCount < n) {
    // Determine processes that have arrived and are unfinished
    const ready = processes
      .filter(p => p.arrivalTime <= currentTime && !completedSet.has(p.id))
      .sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
        return a.originalIndex - b.originalIndex
      })

    if (ready.length === 0) {
      // CPU is idle
      const nextArrivalProcess = processes
        .filter(p => !completedSet.has(p.id))
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0]

      const idleDuration = nextArrivalProcess.arrivalTime - currentTime

      // Log idle time timeline steps
      for (let step = 0; step < idleDuration; step++) {
        timeline.push({
          time: currentTime + step,
          runningPid: null,
          readyQueue: [],
          completed: Array.from(completedSet),
          remainingMap: { ...remaining },
          decision: `CPU is IDLE. No processes in ready queue; waiting for next arrival (${nextArrivalProcess.id} at t=${nextArrivalProcess.arrivalTime}).`,
        })
      }

      ganttBlocks.push({
        pid: 'IDLE',
        startTime: currentTime,
        endTime: nextArrivalProcess.arrivalTime,
        duration: idleDuration,
        isIdle: true,
      })

      currentTime = nextArrivalProcess.arrivalTime
      continue
    }

    // Select the first-arrived process
    const current = ready[0]
    const startTime = currentTime
    const duration = current.burstTime

    // Create timeline steps for this process execution
    for (let step = 0; step < duration; step++) {
      const stepTime = currentTime + step
      const stepReady = processes
        .filter(p => p.arrivalTime <= stepTime && !completedSet.has(p.id) && p.id !== current.id)
        .sort((a, b) => {
          if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
          return a.originalIndex - b.originalIndex
        })
        .map(p => ({
          id: p.id,
          remainingTime: remaining[p.id],
          arrivalTime: p.arrivalTime,
          priority: p.priority,
        }))

      timeline.push({
        time: stepTime,
        runningPid: current.id,
        readyQueue: stepReady,
        completed: Array.from(completedSet),
        remainingMap: {
          ...remaining,
          [current.id]: duration - step,
        },
        decision: step === 0
          ? `${current.id} dispatched: Earliest arrived process in ready queue (arrived at t=${current.arrivalTime}). FCFS runs to completion.`
          : `${current.id} executing (step ${step + 1}/${duration}, remaining burst: ${duration - step - 1}).`,
      })
    }

    currentTime += duration
    remaining[current.id] = 0
    completedSet.add(current.id)
    completedCount++

    ganttBlocks.push({
      pid: current.id,
      startTime,
      endTime: currentTime,
      duration,
      isIdle: false,
    })
  }

  // Final snapshot at completion
  timeline.push({
    time: currentTime,
    runningPid: null,
    readyQueue: [],
    completed: Array.from(completedSet),
    remainingMap: { ...remaining },
    decision: 'All processes completed execution successfully.',
  })

  const metrics = calculateMetrics(inputProcesses, ganttBlocks)

  return {
    algorithm: 'FCFS',
    ganttBlocks,
    timeline,
    ...metrics,
  }
}
