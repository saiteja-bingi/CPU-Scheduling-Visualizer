import { calculateMetrics } from './metrics.js'

/**
 * Round Robin (RR) Scheduling
 * Supports configurable time quantum (default: 2)
 */
export function scheduleRoundRobin(inputProcesses, options = { quantum: 2 }) {
  if (!inputProcesses || inputProcesses.length === 0) {
    return {
      ganttBlocks: [],
      timeline: [],
      ...calculateMetrics([], []),
    }
  }

  const quantum = Math.max(1, Number(options?.quantum) || 2)

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

  // Track which processes have already entered the ready queue at least once
  const enqueuedSet = new Set()
  const readyQueue = [] // Array of process IDs

  // Helper to add newly arrived processes up to given time
  const enqueueArrivals = (time) => {
    const newlyArrived = processes
      .filter(p => p.arrivalTime <= time && !enqueuedSet.has(p.id) && !completedSet.has(p.id))
      .sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
        return a.originalIndex - b.originalIndex
      })

    newlyArrived.forEach(p => {
      readyQueue.push(p.id)
      enqueuedSet.add(p.id)
    })
  }

  // Initial arrivals at t=0
  enqueueArrivals(0)

  const totalBurst = processes.reduce((acc, p) => acc + p.burstTime, 0)
  const maxArrival = Math.max(...processes.map(p => p.arrivalTime))
  const maxTimeLimit = maxArrival + totalBurst + 1000

  while (completedCount < n && currentTime < maxTimeLimit) {
    if (readyQueue.length === 0) {
      // Find next arriving process
      const unarrived = processes
        .filter(p => !enqueuedSet.has(p.id) && !completedSet.has(p.id))
        .sort((a, b) => a.arrivalTime - b.arrivalTime)

      if (unarrived.length === 0) break

      const nextArrival = unarrived[0].arrivalTime
      const idleDuration = nextArrival - currentTime

      for (let step = 0; step < idleDuration; step++) {
        timeline.push({
          time: currentTime + step,
          runningPid: null,
          readyQueue: [],
          completed: Array.from(completedSet),
          remainingMap: { ...remaining },
          decision: `CPU is IDLE. Waiting for ${unarrived[0].id} to arrive at t=${nextArrival}.`,
        })
        rawSlices.push({
          pid: 'IDLE',
          startTime: currentTime + step,
          endTime: currentTime + step + 1,
          isIdle: true,
        })
      }

      currentTime = nextArrival
      enqueueArrivals(currentTime)
      continue
    }

    const currentPid = readyQueue.shift()
    const runDuration = Math.min(quantum, remaining[currentPid])
    const sliceStart = currentTime

    for (let step = 0; step < runDuration; step++) {
      const stepTime = currentTime + step

      // Note: ready queue snapshot at this exact time step
      const rqSnapshot = readyQueue.map(pid => {
        const proc = processes.find(p => p.id === pid)
        return {
          id: pid,
          remainingTime: remaining[pid],
          arrivalTime: proc?.arrivalTime,
        }
      })

      timeline.push({
        time: stepTime,
        runningPid: currentPid,
        readyQueue: rqSnapshot,
        completed: Array.from(completedSet),
        remainingMap: {
          ...remaining,
          [currentPid]: remaining[currentPid] - step,
        },
        decision: step === 0
          ? `${currentPid} dispatched from front of ready queue (quantum=${quantum}, remaining=${remaining[currentPid]} ms).`
          : `${currentPid} executing (quantum step ${step + 1}/${runDuration}, remaining: ${remaining[currentPid] - step - 1} ms).`,
      })

      rawSlices.push({
        pid: currentPid,
        startTime: stepTime,
        endTime: stepTime + 1,
        isIdle: false,
      })

      // As time ticks, check if any process arrived right now
      enqueueArrivals(stepTime + 1)
    }

    currentTime += runDuration
    remaining[currentPid] -= runDuration

    // Ensure all processes arrived up to currentTime are enqueued
    enqueueArrivals(currentTime)

    if (remaining[currentPid] === 0) {
      completedSet.add(currentPid)
      completedCount++
    } else {
      // Re-enqueue current process to the back of the queue
      readyQueue.push(currentPid)
    }
  }

  timeline.push({
    time: currentTime,
    runningPid: null,
    readyQueue: [],
    completed: Array.from(completedSet),
    remainingMap: { ...remaining },
    decision: 'All processes completed execution.',
  })

  // Merge consecutive slices for the same process
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
    algorithm: 'ROUND_ROBIN',
    quantum,
    ganttBlocks,
    timeline,
    ...metrics,
  }
}
