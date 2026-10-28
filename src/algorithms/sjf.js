import { calculateMetrics } from './metrics.js'

/**
 * Shortest Job First (SJF) Non-preemptive Scheduling
 */
export function scheduleSJF(inputProcesses) {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      ganttBlocks: [],
      timeline: [],
      ...calculateMetrics([], []),
    }
  }

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

  while (completedCount < n) {
    const ready = processes
      .filter(p => p.arrivalTime <= currentTime && !completedSet.has(p.id))
      .sort((a, b) => {
        if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
        return a.originalIndex - b.originalIndex
      })

    if (ready.length === 0) {
      const nextArrivalProcess = processes
        .filter(p => !completedSet.has(p.id))
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0]

      const idleDuration = nextArrivalProcess.arrivalTime - currentTime

      for (let step = 0; step < idleDuration; step++) {
        timeline.push({
          time: currentTime + step,
          runningPid: null,
          readyQueue: [],
          completed: Array.from(completedSet),
          remainingMap: { ...remaining },
          decision: `CPU is IDLE. Waiting for process ${nextArrivalProcess.id} to arrive at t=${nextArrivalProcess.arrivalTime}.`,
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

    const current = ready[0]
    const startTime = currentTime
    const duration = current.burstTime

    for (let step = 0; step < duration; step++) {
      const stepTime = currentTime + step
      const stepReady = processes
        .filter(p => p.arrivalTime <= stepTime && !completedSet.has(p.id) && p.id !== current.id)
        .sort((a, b) => {
          if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime
          if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
          return a.originalIndex - b.originalIndex
        })
        .map(p => ({
          id: p.id,
          remainingTime: remaining[p.id],
          burstTime: p.burstTime,
          arrivalTime: p.arrivalTime,
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
          ? `${current.id} dispatched: Shortest CPU burst (${current.burstTime} ms) among ready processes. Non-preemptive, runs to completion.`
          : `${current.id} executing (step ${step + 1}/${duration}, remaining: ${duration - step - 1}).`,
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

  timeline.push({
    time: currentTime,
    runningPid: null,
    readyQueue: [],
    completed: Array.from(completedSet),
    remainingMap: { ...remaining },
    decision: 'All processes completed execution.',
  })

  const metrics = calculateMetrics(inputProcesses, ganttBlocks)

  return {
    algorithm: 'SJF',
    ganttBlocks,
    timeline,
    ...metrics,
  }
}
