export const PROCESS_PALETTES = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', solid: '#2563eb', bar: '#60a5fa' }, // Blue
  { bg: '#ecfdf5', border: '#10b981', text: '#065f46', solid: '#059669', bar: '#34d399' }, // Emerald
  { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6', solid: '#7c3aed', bar: '#a78bfa' }, // Violet
  { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', solid: '#d97706', bar: '#fbbf24' }, // Amber
  { bg: '#fff1f2', border: '#f43f5e', text: '#9f1239', solid: '#e11d48', bar: '#fb7185' }, // Rose
  { bg: '#eef2ff', border: '#6366f1', text: '#3730a3', solid: '#4f46e5', bar: '#818cf8' }, // Indigo
  { bg: '#f0fdfa', border: '#14b8a6', text: '#115e59', solid: '#0d9488', bar: '#2dd4bf' }, // Teal
  { bg: '#fdf2f8', border: '#ec4899', text: '#9d174d', solid: '#db2777', bar: '#f472b6' }, // Pink
  { bg: '#ecfeff', border: '#06b6d4', text: '#155e75', solid: '#0891b2', bar: '#22d3ee' }, // Cyan
  { bg: '#fff7ed', border: '#f97316', text: '#9a3412', solid: '#ea580c', bar: '#fb923c' }, // Orange
]

export const IDLE_PALETTE = {
  bg: '#f1f5f9',
  border: '#cbd5e1',
  text: '#64748b',
  solid: '#94a3b8',
  bar: '#cbd5e1',
  glow: 'none',
}

/**
 * Returns a consistent palette for a process ID
 */
export function getProcessColor(pid, index = 0) {
  if (!pid || pid === 'IDLE') return IDLE_PALETTE

  // Extract trailing digits if PID is like P1, P2
  const match = pid.match(/\d+$/)
  const num = match ? parseInt(match[0], 10) - 1 : index
  const safeIndex = Math.abs(num) % PROCESS_PALETTES.length

  return PROCESS_PALETTES[safeIndex]
}
