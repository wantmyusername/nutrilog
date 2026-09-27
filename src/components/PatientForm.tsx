import { useState, type FormEvent, type ReactNode } from 'react'
import { ChevronDown, ClipboardList, Salad, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Patient, PatientInput } from '../api/types'
import { cx, inputClass, textareaClass } from './styles'

const EMPTY: PatientInput = {
  full_name: '',
  birth_date: '',
  sex: '',
  height_cm: null,
  phone: '',
  email: '',
  objective: '',
  activity_level: '',
  activity_type: '',
  daily_calories: null,
  protein_g: null,
  carbs_g: null,
  fats_g: null,
  water_l: null,
  allergies: '',
  supplements: '',
  notes: '',
  next_visit_date: '',
}

const TRACKED_FIELDS: (keyof PatientInput)[] = [
  'full_name',
  'birth_date',
  'sex',
  'height_cm',
  'phone',
  'email',
  'objective',
  'activity_level',
  'activity_type',
  'daily_calories',
  'protein_g',
  'carbs_g',
  'fats_g',
  'water_l',
]

function toFormValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function fromFormValue(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function numberFromFormValue(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-2.5 block text-sm font-semibold text-ink">
      {children}
      {required && <span className="text-accent"> *</span>}
    </label>
  )
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        className={cx(inputClass, 'cursor-pointer appearance-none pr-11')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
    </div>
  )
}

function SuffixField({
  value,
  onChange,
  unit,
  placeholder,
  step,
}: {
  value: string
  onChange: (value: string) => void
  unit: string
  placeholder?: string
  step?: string
}) {
  return (
    <div className="relative">
      <input
        className={cx(inputClass, 'pr-20')}
        type="number"
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-paper px-2 py-1 text-xs text-muted">
        {unit}
      </span>
    </div>
  )
}

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

interface PatientFormProps {
  formId: string
  initial?: Patient | null
  onSubmit: (data: PatientInput) => Promise<void>
  onSavingChange?: (saving: boolean) => void
}

export function PatientForm({ formId, initial, onSubmit, onSavingChange }: PatientFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const source = initial ?? EMPTY
    return Object.fromEntries(
      Object.entries(source).map(([key, value]) => [key, toFormValue(value)]),
    ) as Record<string, string>
  })
  const [error, setError] = useState<string | null>(null)

  const completed = TRACKED_FIELDS.filter((field) => form[field]?.trim() !== '').length
  const progress = Math.round((completed / TRACKED_FIELDS.length) * 100)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.full_name.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const payload: PatientInput = {
      full_name: form.full_name.trim(),
      birth_date: fromFormValue(form.birth_date),
      sex: fromFormValue(form.sex),
      height_cm: numberFromFormValue(form.height_cm),
      phone: fromFormValue(form.phone),
      email: fromFormValue(form.email),
      objective: fromFormValue(form.objective),
      activity_level: fromFormValue(form.activity_level),
      activity_type: fromFormValue(form.activity_type),
      daily_calories: numberFromFormValue(form.daily_calories),
      protein_g: numberFromFormValue(form.protein_g),
      carbs_g: numberFromFormValue(form.carbs_g),
      fats_g: numberFromFormValue(form.fats_g),
      water_l: numberFromFormValue(form.water_l),
      allergies: fromFormValue(form.allergies),
      supplements: fromFormValue(form.supplements),
      notes: fromFormValue(form.notes),
      next_visit_date: fromFormValue(form.next_visit_date),
    }

    setError(null)
    onSavingChange?.(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
      onSavingChange?.(false)
    }
  }

  return (
    <form id={formId} className="flex flex-col" onSubmit={handleSubmit}>
      <div className="mb-6 flex items-center gap-3.5 rounded-full border border-line bg-surface px-2 py-1.5">
        <span className="whitespace-nowrap pl-2 text-xs text-muted">
          {completed} de {TRACKED_FIELDS.length} campos completados
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Section icon={UserRound} title="Datos personales" subtitle="Información de contacto y objetivo del paciente">
        <div className="grid gap-6">
          <div>
            <Label required>Nombre completo</Label>
            <input
              className={inputClass}
              placeholder="Ej. María Fernanda López"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label>Fecha de nacimiento</Label>
              <input className={inputClass} type="date" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
            </div>
            <div>
              <Label>Sexo</Label>
              <SelectField value={form.sex} onChange={(v) => update('sex', v)}>
                <option value="">Selecciona…</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="Otro">Otro</option>
              </SelectField>
            </div>
            <div>
              <Label>Estatura</Label>
              <SuffixField value={form.height_cm} onChange={(v) => update('height_cm', v)} unit="cm" placeholder="165" step="0.1" />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label>Teléfono</Label>
              <input className={inputClass} type="tel" placeholder="+52 33 0000 0000" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <Label>Correo</Label>
              <input className={inputClass} type="email" placeholder="nombre@correo.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <Label>Objetivo</Label>
              <input className={inputClass} placeholder="Bajar grasa, ganar masa…" value={form.objective} onChange={(e) => update('objective', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label>Nivel de actividad</Label>
              <SelectField value={form.activity_level} onChange={(v) => update('activity_level', v)}>
                <option value="">Selecciona…</option>
                <option value="Sedentario">Sedentario</option>
                <option value="Ligero">Ligero</option>
                <option value="Moderado">Moderado</option>
                <option value="Intenso">Intenso</option>
                <option value="Atleta">Atleta</option>
              </SelectField>
            </div>
            <div>
              <Label>Tipo de actividad</Label>
              <input className={inputClass} placeholder="Pesas, cardio, natación…" value={form.activity_type} onChange={(e) => update('activity_type', e.target.value)} />
            </div>
            <div>
              <Label>Próxima cita</Label>
              <input className={inputClass} type="date" value={form.next_visit_date} onChange={(e) => update('next_visit_date', e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Salad} title="Requerimientos" subtitle="Metas nutricionales diarias del plan">
        <div className="grid gap-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label>Calorías</Label>
              <SuffixField value={form.daily_calories} onChange={(v) => update('daily_calories', v)} unit="kcal/día" placeholder="2000" />
            </div>
            <div>
              <Label>Proteína</Label>
              <SuffixField value={form.protein_g} onChange={(v) => update('protein_g', v)} unit="gramos" placeholder="120" step="0.1" />
            </div>
            <div>
              <Label>Carbohidratos</Label>
              <SuffixField value={form.carbs_g} onChange={(v) => update('carbs_g', v)} unit="gramos" placeholder="220" step="0.1" />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label>Grasas</Label>
              <SuffixField value={form.fats_g} onChange={(v) => update('fats_g', v)} unit="gramos" placeholder="60" step="0.1" />
            </div>
            <div>
              <Label>Agua</Label>
              <SuffixField value={form.water_l} onChange={(v) => update('water_l', v)} unit="litros" placeholder="2.5" step="0.1" />
            </div>
          </div>
        </div>
      </Section>

      <Section icon={ClipboardList} title="Notas" subtitle="Alergias, suplementos y observaciones">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <Label>Alergias / intolerancias</Label>
            <textarea className={textareaClass} rows={4} placeholder="Ej. lactosa, mariscos…" value={form.allergies} onChange={(e) => update('allergies', e.target.value)} />
          </div>
          <div>
            <Label>Suplementos</Label>
            <textarea className={textareaClass} rows={4} placeholder="Ej. omega 3, creatina…" value={form.supplements} onChange={(e) => update('supplements', e.target.value)} />
          </div>
          <div>
            <Label>Notas generales</Label>
            <textarea className={textareaClass} rows={4} placeholder="Observaciones adicionales…" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
        </div>
      </Section>

      {error && <p className="px-1 text-sm text-danger">{error}</p>}
    </form>
  )
}
