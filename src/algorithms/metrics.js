/**
 * Calculates CPU scheduling metrics given the input processes, generated Gantt chart blocks,
 * and total makespan.
 * 
 * @param {Array} processes - Original process definitions [{ id, arrivalTime, burstTime, priority, queue }]
 * @param {Array} ganttBlocks - Sequence of execution slices [{ pid, startTime, endTime, duration, isIdle, queueLevel }]
 * @returns {Object} { processMetrics, summaryMetrics }
 */
export function calculateMetrics(processes, ganttBlocks) {
  if (!processes || processes.length === 0) {
    return {
      processMetrics: [],
      summaryMetrics: {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        cpuUtilization: 0,
        throughput: 0,
        contextSwitches: 0,
        totalExecutionTime: 0,
        totalBusyTime: 0,
        totalIdleTime: 0,
      },
    }
  }

  // Count context switches and busy/idle times
  let contextSwitches = 0
  let totalBusyTime = 0
  let totalIdleTime = 0

  let lastActivePid = null
  for (let i = 0; i < ganttBlocks.length; i++) {
    const block = ganttBlocks[i]
    const dur = block.endTime - block.startTime
    if (block.isIdle || block.pid === 'IDLE') {
      totalIdleTime += dur
    } else {
      totalBusyTime += dur
      if (lastActivePid !== null && lastActivePid !== block.pid) {
        contextSwitches++
      }
      lastActivePid = block.pid
    }
  }

  const makespan = ganttBlocks.length > 0 ? ganttBlocks[ganttBlocks.length - 1].endTime : 0

  // Per-process metrics map
  const processMap = {}
  processes.forEach(p => {
    processMap[p.id] = {
      id: p.id,
      arrivalTime: Number(p.arrivalTime),
      burstTime: Number(p.burstTime),
      priority: p.priority !== undefined ? Number(p.priority) : 1,
      queue: p.queue || 1,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: 0,
      firstStartTime: null,
    }
  })

  // Scan gantt blocks to record first start time and latest completion time
  ganttBlocks.forEach(block => {
    if (block.isIdle || block.pid === 'IDLE') return
    const p = processMap[block.pid]
    if (p) {
      if (p.firstStartTime === null) {
        p.firstStartTime = block.startTime
      }
      p.completionTime = Math.max(p.completionTime, block.endTime)
    }
  })

  let sumWT = 0
  let sumTAT = 0
  let sumRT = 0

  const processMetrics = processes.map(p => {
    const entry = processMap[p.id]
    const ct = entry.completionTime
    const tat = ct - entry.arrivalTime
    const wt = tat - entry.burstTime
    const rt = (entry.firstStartTime !== null ? entry.firstStartTime : entry.arrivalTime) - entry.arrivalTime

    sumWT += wt
    sumTAT += tat
    sumRT += rt

    return {
      id: entry.id,
      arrivalTime: entry.arrivalTime,
      burstTime: entry.burstTime,
      priority: entry.priority,
      queue: entry.queue,
      completionTime: ct,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
      firstStartTime: entry.firstStartTime,
    }
  })

  const n = processes.length
  const avgWaitingTime = Number((sumWT / n).toFixed(2))
  const avgTurnaroundTime = Number((sumTAT / n).toFixed(2))
  const avgResponseTime = Number((sumRT / n).toFixed(2))
  const cpuUtilization = makespan > 0 ? Number(((totalBusyTime / makespan) * 100).toFixed(2)) : 0
  const throughput = makespan > 0 ? Number((n / makespan).toFixed(4)) : 0

  return {
    processMetrics,
    summaryMetrics: {
      avgWaitingTime,
      avgTurnaroundTime,
      avgResponseTime,
      cpuUtilization,
      throughput,
      contextSwitches,
      totalExecutionTime: makespan,
      totalBusyTime,
      totalIdleTime,
    },
  }
}
