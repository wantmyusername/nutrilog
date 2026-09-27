import { useState, type FormEvent, type ReactNode } from 'react'
import { CalendarPlus, HeartPulse, NotebookPen, Ruler } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Appointment, AppointmentInput } from '../api/types'
import { Field } from './ui'
import { inputClass, textareaClass, cx } from './styles'

const EMPTY: AppointmentInput = {
  appointment_date: new Date().toISOString().slice(0, 10),
  weight_kg: null,
  body_fat_pct: null,
  muscle_kg: null,
  waist_cm: null,
  hip_cm: null,
  chest_cm: null,
  arm_cm: null,
  thigh_cm: null,
  blood_pressure: '',
  glucose: null,
  notes: '',
  meal_plan: '',
}

const NUMERIC_FIELDS = [
  'weight_kg',
  'body_fat_pct',
  'muscle_kg',
  'waist_cm',
  'hip_cm',
  'chest_cm',
  'arm_cm',
  'thigh_cm',
  'glucose',
] as const

const MEASURES: { field: (typeof NUMERIC_FIELDS)[number]; label: string; hint?: string }[] = [
  { field: 'body_fat_pct', label: 'Grasa corporal', hint: '%' },
  { field: 'muscle_kg', label: 'Masa muscular', hint: 'kg' },
  { field: 'waist_cm', label: 'Cintura', hint: 'cm' },
  { field: 'hip_cm', label: 'Cadera', hint: 'cm' },
  { field: 'chest_cm', label: 'Pecho', hint: 'cm' },
  { field: 'arm_cm', label: 'Brazo', hint: 'cm' },
  { field: 'thigh_cm', label: 'Muslo', hint: 'cm' },
]

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3.5 border-b border-line px-6 py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  )
}

interface AppointmentFormProps {
  formId: string
  initial?: Appointment | null
  onSubmit: (data: AppointmentInput) => Promise<void>
  onSavingChange?: (saving: boolean) => void
}

export function AppointmentForm({ formId, initial, onSubmit, onSavingChange }: AppointmentFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const source = initial ?? EMPTY
    return Object.fromEntries(
      Object.entries(source).map(([key, value]) => [
        key,
        value === null || value === undefined ? '' : String(value),
      ]),
    ) as Record<string, string>
  })
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.appointment_date) {
      setError('La fecha de la visita es obligatoria')
      return
    }

    const payload = { ...EMPTY } as Record<string, unknown>
    payload.appointment_date = form.appointment_date
    payload.blood_pressure = form.blood_pressure.trim() || null
    payload.notes = form.notes.trim() || null
    payload.meal_plan = form.meal_plan.trim() || null
    for (const field of NUMERIC_FIELDS) {
      const raw = form[field]?.trim()
      payload[field] = raw ? Number(raw) : null
    }

    setError(null)
    onSavingChange?.(true)
    try {
      await onSubmit(payload as AppointmentInput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
      onSavingChange?.(false)
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Section icon={CalendarPlus} title="Datos de la visita" subtitle="Fecha y peso del día">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Fecha de la visita *">
            <input
              className={inputClass}
              type="date"
              value={form.appointment_date}
              onChange={(e) => update('appointment_date', e.target.value)}
            />
          </Field>
          <Field label="Peso" hint="kg">
            <input
              className={cx(inputClass, 'tabular-nums')}
              type="number"
              step="0.1"
              value={form.weight_kg}
              onChange={(e) => update('weight_kg', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={Ruler} title="Medidas" subtitle="Composición corporal y perímetros">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {MEASURES.map(({ field, label, hint }) => (
            <Field key={field} label={label} hint={hint}>
              <input
                className={cx(inputClass, 'tabular-nums')}
                type="number"
                step="0.1"
                value={form[field]}
                onChange={(e) => update(field, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section icon={HeartPulse} title="Signos vitales" subtitle="Presión y glucosa">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Presión arterial">
            <input
              className={inputClass}
              value={form.blood_pressure}
              onChange={(e) => update('blood_pressure', e.target.value)}
              placeholder="120/80"
            />
          </Field>
          <Field label="Glucosa" hint="mg/dL">
            <input
              className={cx(inputClass, 'tabular-nums')}
              type="number"
              step="0.1"
              value={form.glucose}
              onChange={(e) => update('glucose', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={NotebookPen} title="Notas" subtitle="Observaciones de la visita">
        <Field label="Notas de la visita">
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="Observaciones, próxima visita…"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </Field>
      </Section>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </form>
  )
}
