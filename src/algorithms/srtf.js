import { calculateMetrics } from './metrics.js'

/**
 * Shortest Remaining Time First (SRTF) Preemptive Scheduling
 */
export function scheduleSRTF(inputProcesses) {
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

  // Safety break to prevent infinite loops in unexpected edge cases
  const totalBurst = processes.reduce((acc, p) => acc + p.burstTime, 0)
  const maxArrival = Math.max(...processes.map(p => p.arrivalTime))
  const maxTimeLimit = maxArrival + totalBurst + 1000

  while (completedCount < n && currentTime < maxTimeLimit) {
    // Find arrived and unfinished
    const ready = processes
      .filter(p => p.arrivalTime <= currentTime && !completedSet.has(p.id))
      .sort((a, b) => {
        if (remaining[a.id] !== remaining[b.id]) return remaining[a.id] - remaining[b.id]
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
        return a.originalIndex - b.originalIndex
      })

    if (ready.length === 0) {
      // Idle
      timeline.push({
        time: currentTime,
        runningPid: null,
        readyQueue: [],
        completed: Array.from(completedSet),
        remainingMap: { ...remaining },
        decision: `CPU is IDLE. No processes have arrived yet; waiting for upcoming arrivals.`,
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

    // Ready queue excluding running process
    const stepReady = ready
      .filter(p => p.id !== current.id)
      .map(p => ({
        id: p.id,
        remainingTime: remaining[p.id],
        arrivalTime: p.arrivalTime,
      }))

    let decisionText = ''
    if (previousPid === null) {
      decisionText = `${current.id} dispatched: Shortest remaining burst (${remaining[current.id]} ms).`
    } else if (previousPid !== current.id) {
      const prevRem = remaining[previousPid]
      if (prevRem > 0) {
        decisionText = `PREEMPTION! ${previousPid} preempted by ${current.id} (remaining burst ${remaining[current.id]} ms < ${previousPid}'s ${prevRem} ms).`
      } else {
        decisionText = `${previousPid} finished. ${current.id} selected with shortest remaining burst (${remaining[current.id]} ms).`
      }
    } else {
      decisionText = `${current.id} continues execution (remaining burst: ${remaining[current.id] - 1} ms).`
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

  // Merge consecutive raw slices for the same process
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
    algorithm: 'SRTF',
    ganttBlocks,
    timeline,
    ...metrics,
  }
}
