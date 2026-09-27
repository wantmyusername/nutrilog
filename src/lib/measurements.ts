import type { Appointment } from '../api/types'

export interface MetricConfig {
  key: keyof Appointment
  label: string
  unit: string
  lowerIsBetter: boolean | null
}

export const METRICS: MetricConfig[] = [
  { key: 'weight_kg', label: 'Peso', unit: ' kg', lowerIsBetter: true },
  { key: 'body_fat_pct', label: 'Grasa', unit: ' %', lowerIsBetter: true },
  { key: 'muscle_kg', label: 'Músculo', unit: ' kg', lowerIsBetter: false },
  { key: 'waist_cm', label: 'Cintura', unit: ' cm', lowerIsBetter: true },
  { key: 'hip_cm', label: 'Cadera', unit: ' cm', lowerIsBetter: true },
  { key: 'chest_cm', label: 'Pecho', unit: ' cm', lowerIsBetter: null },
  { key: 'arm_cm', label: 'Brazo', unit: ' cm', lowerIsBetter: false },
  { key: 'thigh_cm', label: 'Muslo', unit: ' cm', lowerIsBetter: true },
  { key: 'glucose', label: 'Glucosa', unit: ' mg/dL', lowerIsBetter: true },
]

export function deltaTone(delta: number, lowerIsBetter: boolean | null): string {
  if (delta === 0 || lowerIsBetter === null) return 'text-muted'
  const good = lowerIsBetter ? delta < 0 : delta > 0
  return good ? 'text-green-600' : 'text-rose-600'
}

export function deltaColor(delta: number, lowerIsBetter: boolean | null): string {
  if (delta === 0 || lowerIsBetter === null) return '#9ca3af'
  const good = lowerIsBetter ? delta < 0 : delta > 0
  return good ? '#16a34a' : '#e11d48'
}

export function formatDelta(delta: number): string {
  const rounded = Number(delta.toFixed(1))
  if (rounded === 0) return '= 0'
  return `${rounded > 0 ? '↑' : '↓'} ${Math.abs(rounded)}`
}
