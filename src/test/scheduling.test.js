import { describe, it, expect } from 'vitest'
import {
  scheduleFCFS,
  scheduleSJF,
  scheduleSRTF,
  schedulePriorityNP,
  schedulePriorityP,
  scheduleRoundRobin,
  runComparison,
} from '../algorithms/index.js'

describe('CPU Scheduling Engine Test Suite', () => {
  const standardWorkload = [
    { id: 'P1', arrivalTime: 0, burstTime: 4, priority: 2 },
    { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 3 },
    { id: 'P3', arrivalTime: 2, burstTime: 1, priority: 1 },
  ]

  describe('FCFS', () => {
    it('schedules in arrival order without preemption', () => {
      const result = scheduleFCFS(standardWorkload)
      expect(result.summaryMetrics.totalExecutionTime).toBe(8)
      expect(result.processMetrics.find(p => p.id === 'P1').completionTime).toBe(4)
      expect(result.processMetrics.find(p => p.id === 'P2').completionTime).toBe(7)
      expect(result.processMetrics.find(p => p.id === 'P3').completionTime).toBe(8)
      expect(result.summaryMetrics.avgWaitingTime).toBe(2.67)
      expect(result.summaryMetrics.avgTurnaroundTime).toBe(5.33)
    })
  })

  describe('SJF (Non-preemptive)', () => {
    it('picks the shortest job among arrived processes when CPU becomes free', () => {
      const result = scheduleSJF(standardWorkload)
      expect(result.processMetrics.find(p => p.id === 'P1').completionTime).toBe(4)
      expect(result.processMetrics.find(p => p.id === 'P3').completionTime).toBe(5)
      expect(result.processMetrics.find(p => p.id === 'P2').completionTime).toBe(8)
      expect(result.summaryMetrics.avgWaitingTime).toBe(2.00)
    })
  })

  describe('SRTF (Preemptive)', () => {
    it('preempts when a process with shorter remaining burst arrives', () => {
      const workload = [
        { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 1 },
        { id: 'P2', arrivalTime: 2, burstTime: 4, priority: 1 },
        { id: 'P3', arrivalTime: 4, burstTime: 1, priority: 1 },
      ]
      const result = scheduleSRTF(workload)
      expect(result.processMetrics.find(p => p.id === 'P3').completionTime).toBe(5)
      expect(result.processMetrics.find(p => p.id === 'P2').completionTime).toBe(7)
      expect(result.processMetrics.find(p => p.id === 'P1').completionTime).toBe(12)
      expect(result.summaryMetrics.totalExecutionTime).toBe(12)
    })
  })

  describe('Priority Scheduling (Non-preemptive and Preemptive)', () => {
    it('executes highest priority first non-preemptively', () => {
      const result = schedulePriorityNP(standardWorkload, { priorityOrder: 'lower' })
      expect(result.processMetrics.find(p => p.id === 'P3').completionTime).toBe(5)
      expect(result.processMetrics.find(p => p.id === 'P2').completionTime).toBe(8)
    })

    it('preempts when higher priority process arrives', () => {
      const workload = [
        { id: 'P1', arrivalTime: 0, burstTime: 6, priority: 3 },
        { id: 'P2', arrivalTime: 2, burstTime: 2, priority: 1 },
      ]
      const result = schedulePriorityP(workload, { priorityOrder: 'lower' })
      expect(result.processMetrics.find(p => p.id === 'P2').completionTime).toBe(4)
      expect(result.processMetrics.find(p => p.id === 'P1').completionTime).toBe(8)
      expect(result.summaryMetrics.contextSwitches).toBe(2)
    })
  })

  describe('Round Robin', () => {
    it('rotates processes correctly with quantum = 2 and arrival order', () => {
      const workload = [
        { id: 'P1', arrivalTime: 0, burstTime: 5 },
        { id: 'P2', arrivalTime: 1, burstTime: 3 },
        { id: 'P3', arrivalTime: 2, burstTime: 1 },
      ]
      const result = scheduleRoundRobin(workload, { quantum: 2 })
      expect(result.processMetrics.find(p => p.id === 'P3').completionTime).toBe(5)
      expect(result.processMetrics.find(p => p.id === 'P2').completionTime).toBe(8)
      expect(result.processMetrics.find(p => p.id === 'P1').completionTime).toBe(9)
      expect(result.summaryMetrics.totalExecutionTime).toBe(9)
    })
  })

  describe('CPU Idle Handling and Disjoint Arrivals', () => {
    it('correctly inserts IDLE blocks and calculates CPU utilization', () => {
      const workload = [
        { id: 'P1', arrivalTime: 0, burstTime: 2 },
        { id: 'P2', arrivalTime: 5, burstTime: 3 },
      ]
      const result = scheduleFCFS(workload)
      expect(result.summaryMetrics.totalExecutionTime).toBe(8)
      expect(result.summaryMetrics.totalBusyTime).toBe(5)
      expect(result.summaryMetrics.totalIdleTime).toBe(3)
      expect(result.summaryMetrics.cpuUtilization).toBe(62.5)
      expect(result.ganttBlocks.some(b => b.isIdle && b.startTime === 2 && b.endTime === 5)).toBe(true)
    })
  })

  describe('runComparison', () => {
    it('returns metrics for all 6 active algorithms', () => {
      const comparison = runComparison(standardWorkload)
      expect(comparison.length).toBe(6)
      comparison.forEach(item => {
        expect(item.avgWaitingTime).toBeGreaterThanOrEqual(0)
        expect(item.avgTurnaroundTime).toBeGreaterThanOrEqual(0)
        expect(item.cpuUtilization).toBeGreaterThan(0)
      })
    })
  })
})
