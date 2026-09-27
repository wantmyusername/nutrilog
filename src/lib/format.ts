export function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function calcImc(weightKg: number | null | undefined, heightCm: number | null | undefined) {
  if (!weightKg || !heightCm) return null
  const meters = heightCm / 100
  return Number((weightKg / (meters * meters)).toFixed(1))
}

export function imcLabel(imc: number | null): string {
  if (imc === null) return 'Sin datos'
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatNumber(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '—'
  return `${value}${suffix}`
}

export function goalBadgeClass(objective: string | null): string {
  const text = (objective ?? '').toLowerCase()
  if (!objective) return 'bg-gray-100 text-gray-600'
  if (text.includes('manten')) return 'bg-gray-100 text-gray-600'
  if (
    text.includes('perd') ||
    text.includes('grasa') ||
    text.includes('bajar') ||
    text.includes('deficit') ||
    text.includes('déficit')
  ) {
    return 'bg-rose-50 text-rose-600'
  }
  if (
    text.includes('gan') ||
    text.includes('masa') ||
    text.includes('muscul') ||
    text.includes('aument')
  ) {
    return 'bg-green-50 text-green-600'
  }
  return 'bg-gray-100 text-gray-600'
}

export function imcToneClass(imc: number | null): string {
  if (imc === null) return 'text-muted'
  return imc >= 18.5 && imc < 25 ? 'text-green-600' : 'text-amber-600'
}

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function monthShort(ym: string): string {
  const [, month] = ym.split('-')
  return SHORT_MONTHS[Number(month) - 1] ?? ym
}

export function formatShortDate(value: string): string {
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr)
  date.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

export function relativeLabel(dateStr: string): string {
  const n = daysUntil(dateStr)
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Mañana'
  if (n === -1) return 'Ayer'
  if (n > 1) return `En ${n} días`
  return `Hace ${Math.abs(n)} días`
}
