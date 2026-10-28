import { scheduleFCFS } from './fcfs.js'
import { scheduleSJF } from './sjf.js'
import { scheduleSRTF } from './srtf.js'
import { schedulePriorityNP } from './priorityNp.js'
import { schedulePriorityP } from './priorityP.js'
import { scheduleRoundRobin } from './roundRobin.js'
import { ALGORITHMS } from './types.js'

export {
  ALGORITHMS,
  scheduleFCFS,
  scheduleSJF,
  scheduleSRTF,
  schedulePriorityNP,
  schedulePriorityP,
  scheduleRoundRobin,
}

/**
 * Executes a chosen scheduling algorithm by ID
 */
export function runSchedulingAlgorithm(algorithmId, processes, options = {}) {
  switch (algorithmId) {
    case 'FCFS':
      return scheduleFCFS(processes)
    case 'SJF':
      return scheduleSJF(processes)
    case 'SRTF':
      return scheduleSRTF(processes)
    case 'PRIORITY_NP':
      return schedulePriorityNP(processes, options)
    case 'PRIORITY_P':
      return schedulePriorityP(processes, options)
    case 'ROUND_ROBIN':
      return scheduleRoundRobin(processes, options)
    default:
      return scheduleFCFS(processes)
  }
}

/**
 * Runs multiple algorithms on the exact same dataset to compare performance
 */
export function runComparison(processes, algorithmIds = Object.keys(ALGORITHMS), options = {}) {
  return algorithmIds
    .filter(id => ALGORITHMS[id])
    .map(algoId => {
      const result = runSchedulingAlgorithm(algoId, processes, options)
      const meta = ALGORITHMS[algoId] || {}
      return {
        algorithmId: algoId,
        name: meta.name || algoId,
        shortName: meta.shortName || algoId,
        ...result.summaryMetrics,
        ganttBlocks: result.ganttBlocks,
      }
    })
}
