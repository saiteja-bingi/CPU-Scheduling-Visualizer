import { calculateMetrics } from './metrics.js'

/**
 * Priority Scheduling (Preemptive)
 * Preempts if an arriving process has higher priority.
 */
export function schedulePriorityP(inputProcesses, options = { priorityOrder: 'lower' }) {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      ganttBlocks: [],
      timeline: [],
      ...calculateMetrics([], []),
    }
  }

  const isLowerHigher = options?.priorityOrder !== 'higher'

  const processes = inputProcesses.map((p, idx) => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    priority: p.priority !== undefined ? Number(p.priority) : 1,
    queue: p.queue || 1,
    originalIndex: idx,
  }))

  const rawSlices = []
  const timeline = []
  const n = processes.length

  const remaining = {}
  processes.forEach(p => {
    remaining[p.id] = p.burstTime
  })

  let currentTime = 0
  let completedCount = 0
  const completedSet = new Set()
  let previousPid = null

  const comparePriority = (a, b) => {
    if (a.priority !== b.priority) {
      return isLowerHigher ? a.priority - b.priority : b.priority - a.priority
    }
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
    return a.originalIndex - b.originalIndex
  }

  const totalBurst = processes.reduce((acc, p) => acc + p.burstTime, 0)
  const maxArrival = Math.max(...processes.map(p => p.arrivalTime))
  const maxTimeLimit = maxArrival + totalBurst + 1000

  while (completedCount < n && currentTime < maxTimeLimit) {
    const ready = processes
      .filter(p => p.arrivalTime <= currentTime && !completedSet.has(p.id))
      .sort(comparePriority)

    if (ready.length === 0) {
      timeline.push({
        time: currentTime,
        runningPid: null,
        readyQueue: [],
        completed: Array.from(completedSet),
        remainingMap: { ...remaining },
        decision: `CPU is IDLE. Waiting for processes to arrive.`,
      })

      rawSlices.push({
        pid: 'IDLE',
        startTime: currentTime,
        endTime: currentTime + 1,
        isIdle: true,
      })

      previousPid = null
      currentTime++
      continue
    }

    const current = ready[0]

    const stepReady = ready
      .filter(p => p.id !== current.id)
      .map(p => ({
        id: p.id,
        remainingTime: remaining[p.id],
        priority: p.priority,
        arrivalTime: p.arrivalTime,
      }))

    let decisionText = ''
    if (previousPid === null) {
      decisionText = `${current.id} dispatched: Highest priority (${current.priority}).`
    } else if (previousPid !== current.id) {
      const prevProcess = processes.find(p => p.id === previousPid)
      if (remaining[previousPid] > 0) {
        decisionText = `PREEMPTION! ${previousPid} (priority ${prevProcess?.priority}) preempted by ${current.id} (priority ${current.priority}).`
      } else {
        decisionText = `${previousPid} finished. ${current.id} dispatched with highest priority (${current.priority}).`
      }
    } else {
      decisionText = `${current.id} continues running (priority ${current.priority}, remaining burst: ${remaining[current.id] - 1} ms).`
    }

    timeline.push({
      time: currentTime,
      runningPid: current.id,
      readyQueue: stepReady,
      completed: Array.from(completedSet),
      remainingMap: { ...remaining },
      decision: decisionText,
    })

    rawSlices.push({
      pid: current.id,
      startTime: currentTime,
      endTime: currentTime + 1,
      isIdle: false,
    })

    remaining[current.id]--
    if (remaining[current.id] === 0) {
      completedSet.add(current.id)
      completedCount++
    }

    previousPid = current.id
    currentTime++
  }

  timeline.push({
    time: currentTime,
    runningPid: null,
    readyQueue: [],
    completed: Array.from(completedSet),
    remainingMap: { ...remaining },
    decision: 'All processes completed execution.',
  })

  // Merge consecutive slices
  const ganttBlocks = []
  rawSlices.forEach(slice => {
    if (ganttBlocks.length === 0) {
      ganttBlocks.push({ ...slice, duration: slice.endTime - slice.startTime })
    } else {
      const last = ganttBlocks[ganttBlocks.length - 1]
      if (last.pid === slice.pid && last.endTime === slice.startTime) {
        last.endTime = slice.endTime
        last.duration = last.endTime - last.startTime
      } else {
        ganttBlocks.push({ ...slice, duration: slice.endTime - slice.startTime })
      }
    }
  })

  const metrics = calculateMetrics(inputProcesses, ganttBlocks)

  return {
    algorithm: 'PRIORITY_P',
    ganttBlocks,
    timeline,
    ...metrics,
  }
}
