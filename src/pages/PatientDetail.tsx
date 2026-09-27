import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Cake,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  Plus,
  Printer,
  Ruler,
  Scale,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { appointmentsApi, patientsApi } from '../api/endpoints'
import type { Appointment, Patient } from '../api/types'
import { LineChart } from '../components/LineChart'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/ui'
import { DeleteDialog } from '../components/DeleteDialog'
import { useToast } from '../components/Toast'
import { cx, inputClass } from '../components/styles'
import { METRICS, deltaTone, formatDelta } from '../lib/measurements'
import {
  calcAge,
  calcImc,
  daysUntil,
  formatDate,
  formatNumber,
  formatShortDate,
  imcLabel,
  relativeLabel,
} from '../lib/format'

type Tab = 'resumen' | 'citas' | 'progreso'

const COMPLETION_FIELDS: { key: keyof Patient; label: string }[] = [
  { key: 'birth_date', label: 'fecha de nacimiento' },
  { key: 'sex', label: 'sexo' },
  { key: 'height_cm', label: 'estatura' },
  { key: 'phone', label: 'teléfono' },
  { key: 'email', label: 'correo' },
  { key: 'objective', label: 'objetivo' },
  { key: 'activity_level', label: 'nivel de actividad' },
  { key: 'activity_type', label: 'tipo de actividad' },
  { key: 'daily_calories', label: 'calorías' },
  { key: 'protein_g', label: 'proteína' },
  { key: 'carbs_g', label: 'carbohidratos' },
  { key: 'fats_g', label: 'grasas' },
  { key: 'water_l', label: 'agua' },
  { key: 'allergies', label: 'alergias' },
  { key: 'supplements', label: 'suplementos' },
  { key: 'notes', label: 'notas' },
]

export function PatientDetail() {
  const { id } = useParams()
  const patientId = Number(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(() => (searchParams.get('tab') === 'visitas' ? 'citas' : 'resumen'))
  const [metric, setMetric] = useState<keyof Appointment>('weight_kg')
  const [scheduling, setScheduling] = useState(false)
  const [nextDate, setNextDate] = useState('')
  const [visitToDelete, setVisitToDelete] = useState<Appointment | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await patientsApi.get(patientId)
      setPatient(data.patient)
      setAppointments(data.appointments)
      setNextDate(data.patient.next_visit_date ?? '')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el paciente')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (!Number.isNaN(patientId)) {
      load()
    }
  }, [patientId, load])

  if (Number.isNaN(patientId)) return <p className="text-sm text-danger">Paciente inválido</p>
  if (loading) return <p className="text-sm text-faint">Cargando perfil…</p>
  if (error || !patient) return <p className="text-sm text-danger">{error ?? 'Paciente no encontrado'}</p>

  const latest = appointments.length > 0 ? appointments[appointments.length - 1] : null
  const first = appointments.length > 0 ? appointments[0] : null
  const age = calcAge(patient.birth_date)
  const imc = calcImc(latest?.weight_kg, patient.height_cm)
  const imcOk = imc !== null && imc >= 18.5 && imc < 25
  const weightDelta =
    first?.weight_kg !== null && first?.weight_kg !== undefined && latest?.weight_kg !== null && latest?.weight_kg !== undefined
      ? Number((latest.weight_kg - first.weight_kg).toFixed(1))
      : null
  const weightNote =
    weightDelta === null
      ? 'Sin registros'
      : weightDelta === 0
        ? 'Sin cambio (Δ 0 kg)'
        : `Δ ${weightDelta > 0 ? '+' : ''}${weightDelta} kg`

  const missing = COMPLETION_FIELDS.filter(({ key }) => {
    const value = patient[key]
    return value === null || value === undefined || value === ''
  })
  const completion = Math.round(((COMPLETION_FIELDS.length - missing.length) / COMPLETION_FIELDS.length) * 100)

  const editPatient = () => navigate(`/patients/${patient.id}/edit`)
  const newVisit = () => navigate(`/patients/${patient.id}/visits/new`)
  const editVisit = (visit: Appointment) => navigate(`/patients/${patient.id}/visits/${visit.id}/edit`)

  const nextVisitDate = patient.next_visit_date
  let nextStatusClass = ''
  if (nextVisitDate) {
    const days = daysUntil(nextVisitDate)
    nextStatusClass =
      days < 0
        ? 'bg-rose-50 text-rose-600'
        : days === 0
          ? 'bg-amber-50 text-amber-700'
          : days <= 7
            ? 'bg-indigo-50 text-indigo-600'
            : 'bg-gray-100 text-gray-600'
  }

  async function saveNext(date: string | null) {
    const updated = await patientsApi.update(patient!.id, { next_visit_date: date })
    setPatient(updated)
    setNextDate(updated.next_visit_date ?? '')
    setScheduling(false)
    toast(date ? 'Próxima cita actualizada' : 'Próxima cita quitada')
  }

  const weightSeries = appointments
    .filter((a) => a.weight_kg !== null && a.weight_kg !== undefined)
    .map((a) => ({ label: formatShortDate(a.appointment_date), value: a.weight_kg as number }))

  const prevAppointment = appointments.length >= 2 ? appointments[appointments.length - 2] : null
  const metricConfig = METRICS.find((m) => m.key === metric) ?? METRICS[0]
  const metricSeries = appointments
    .filter((a) => a[metric] !== null && a[metric] !== undefined && a[metric] !== '')
    .map((a) => ({ label: formatShortDate(a.appointment_date), value: Number(a[metric]) }))
  const metricDelta =
    metricSeries.length >= 2
      ? Number((metricSeries[metricSeries.length - 1].value - metricSeries[metricSeries.length - 2].value).toFixed(1))
      : null

  async function handleDeleteAppointment(appointment: Appointment) {
    setVisitToDelete(appointment)
  }

  async function confirmDeleteVisit() {
    if (!visitToDelete) return
    await appointmentsApi.remove(visitToDelete.id)
    setAppointments((prev) => prev.filter((a) => a.id !== visitToDelete.id))
    toast('Visita eliminada')
    setVisitToDelete(null)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        onClick={() => navigate('/patients')}
      >
        <ArrowLeft className="h-4 w-4" />
        Pacientes
      </Button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar seed={patient.full_name} className="h-16 w-16" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink">{patient.full_name}</h2>
            <p className="mt-1 text-muted">
              {age !== null ? `${age} años` : 'Edad —'}
              {patient.objective ? ` · ${patient.objective}` : ''}
              {patient.activity_type ? ` · ${patient.activity_type}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={editPatient}>
            Editar datos del paciente
          </Button>
          <Button variant="primary" onClick={newVisit}>
            <Plus className="h-5 w-5" />
            Registrar visita
          </Button>
        </div>
      </div>

      {completion < 100 && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span>
            <b className="font-bold">Perfil {completion}% completo</b>
            {' — faltan '}
            {missing.slice(0, 4).map((m) => m.label).join(', ')}
            {missing.length > 4 ? ' y más' : ''}.
          </span>
          <div className="h-1.5 w-44 max-w-full overflow-hidden rounded-full bg-amber-200">
            <div className="h-full rounded-full bg-amber-500 transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto shrink-0 whitespace-nowrap border-amber-300 bg-white font-bold text-amber-700 hover:bg-amber-100"
            onClick={editPatient}
          >
            Completar →
          </Button>
        </div>
      )}

      <nav className="mt-6 mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-gray-50 p-2 shadow-sm">
        {([
          ['resumen', 'Resumen', LayoutDashboard],
          ['citas', 'Visitas', CalendarDays],
          ['progreso', 'Progreso', TrendingUp],
        ] as [Tab, string, LucideIcon][]).map(([value, label, Icon]) => {
          const active = tab === value
          return (
            <button
              key={value}
              type="button"
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex items-center gap-2 rounded-xl border px-4 py-3 text-[15px] font-bold transition-all sm:px-6',
                active
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'border-line bg-white text-ink shadow-sm hover:border-indigo-300 hover:text-indigo-700',
              )}
              onClick={() => setTab(value)}
            >
              <Icon className="h-5 w-5" />
              {label}
              {value === 'citas' && (
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {appointments.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {tab === 'resumen' && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Scale}
              label="Peso actual"
              value={formatNumber(latest?.weight_kg, ' kg')}
              note={weightNote}
              tone="bg-indigo-50 text-indigo-600"
            />
            <MetricCard
              icon={CheckCircle2}
              label="IMC"
              value={imc ?? '—'}
              note={imc !== null ? imcLabel(imc) : 'Sin datos'}
              tone={imcOk ? 'bg-green-50 text-green-600' : imc === null ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}
              noteTone={imcOk ? 'text-green-600' : undefined}
            />
            <MetricCard icon={Ruler} label="Estatura" value={formatNumber(patient.height_cm, ' cm')} tone="bg-blue-50 text-blue-600" />
            <MetricCard icon={Cake} label="Edad" value={age !== null ? `${age} años` : '—'} tone="bg-purple-50 text-purple-600" />
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <CalendarDays className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm text-muted">Próxima cita</p>
                  {patient.next_visit_date ? (
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-ink">{formatDate(patient.next_visit_date)}</span>
                      <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', nextStatusClass)}>
                        {relativeLabel(patient.next_visit_date)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-lg font-bold text-muted">Sin programar</p>
                  )}
                </div>
              </div>

              {!scheduling ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setScheduling(true)}>
                    {patient.next_visit_date ? 'Cambiar' : 'Programar'}
                  </Button>
                  {patient.next_visit_date && (
                    <Button size="sm" variant="ghost" onClick={() => saveNext(null)}>
                      Quitar
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    className={cx(inputClass, 'mt-0 w-44')}
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                  <Button size="sm" variant="primary" onClick={() => saveNext(nextDate || null)}>
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNextDate(patient.next_visit_date ?? '')
                      setScheduling(false)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </section>

          {appointments.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-ink">Evolución</h3>
                  <p className="text-sm text-muted">{metricConfig.label} · por visita</p>
                </div>
                {metricSeries.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-bold leading-none">
                      {metricSeries[metricSeries.length - 1].value}
                      <span className="ml-0.5 text-sm font-medium text-muted">{metricConfig.unit.trim()}</span>
                    </span>
                    {metricDelta !== null && (
                      <span
                        className={cx(
                          'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold',
                          deltaTone(metricDelta, metricConfig.lowerIsBetter),
                        )}
                      >
                        {formatDelta(metricDelta)}
                        {metricConfig.unit.replace(/^\s/, ' ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-5 flex flex-wrap gap-1.5">
                {METRICS.map((m) => (
                  <button
                    key={String(m.key)}
                    type="button"
                    onClick={() => setMetric(m.key)}
                    className={cx(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                      metric === m.key
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-line bg-white text-muted hover:bg-gray-50 hover:text-ink',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {metricSeries.length >= 2 ? (
                <div className="-mx-2 overflow-x-auto px-2">
                  <div className="min-w-[520px]">
                    <LineChart
                      data={metricSeries}
                      unit={metricConfig.unit}
                      showDelta
                      lowerIsBetter={metricConfig.lowerIsBetter}
                    />
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted">
                  Se necesitan al menos dos visitas con {metricConfig.label.toLowerCase()} registrado.
                </p>
              )}
            </section>
          )}

          {prevAppointment && latest && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-ink">Cambios vs. visita anterior</h3>
                <p className="text-sm text-muted">Comparado con {formatDate(prevAppointment.appointment_date)}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {METRICS.map((m) => {
                  const prevVal = prevAppointment[m.key]
                  const lastVal = latest[m.key]
                  if (typeof prevVal !== 'number' || typeof lastVal !== 'number') return null
                  const delta = Number((lastVal - prevVal).toFixed(1))
                  return (
                    <div
                      key={String(m.key)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
                    >
                      <div>
                        <p className="text-xs text-muted">{m.label}</p>
                        <p className="text-sm font-bold text-ink">
                          {prevVal}
                          <span className="text-muted"> → </span>
                          {lastVal}
                          <span className="ml-0.5 text-xs font-medium text-muted">{m.unit.trim()}</span>
                        </p>
                      </div>
                      <span
                        className={cx(
                          'shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold',
                          deltaTone(delta, m.lowerIsBetter),
                        )}
                      >
                        {formatDelta(delta)}
                        {m.unit.replace(/^\s/, ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <ProfileSection title="Requerimientos">
            <InfoItem label="Calorías" value={patient.daily_calories} tag="kcal/día" onAdd={editPatient} />
            <InfoItem label="Proteína" value={patient.protein_g} tag="g" onAdd={editPatient} />
            <InfoItem label="Carbohidratos" value={patient.carbs_g} tag="g" onAdd={editPatient} />
            <InfoItem label="Grasas" value={patient.fats_g} tag="g" onAdd={editPatient} />
            <InfoItem label="Agua" value={patient.water_l} tag="L" onAdd={editPatient} />
            <InfoItem label="Nivel de actividad" value={patient.activity_level} onAdd={editPatient} />
            <InfoItem label="Tipo de actividad" value={patient.activity_type} onAdd={editPatient} />
          </ProfileSection>

          <ProfileSection title="Salud y notas">
            <InfoItem label="Alergias" value={patient.allergies} onAdd={editPatient} />
            <InfoItem label="Suplementos" value={patient.supplements} onAdd={editPatient} />
            <InfoItem
              label="Presión arterial"
              tag="última visita"
              value={latest?.blood_pressure ?? null}
              onAdd={newVisit}
            />
            <InfoItem
              label="Glucosa"
              tag="última visita"
              value={latest?.glucose ?? null}
              valueSuffix=" mg/dL"
              onAdd={newVisit}
            />
            <InfoItem label="Notas" value={patient.notes} onAdd={editPatient} wide />
          </ProfileSection>

          <ProfileSection title="Contacto">
            <InfoItem label="Fecha de nacimiento" value={formatDate(patient.birth_date)} />
            <ContactItem label="Teléfono" value={patient.phone} kind="tel" onAdd={editPatient} />
            <ContactItem label="Correo" value={patient.email} kind="email" onAdd={editPatient} />
          </ProfileSection>
        </div>
      )}

      {tab === 'citas' && (
        <div className="flex flex-col gap-4">
          {appointments.length === 0 && (
            <EmptyState text="Este paciente todavía no tiene visitas.">
              <Button variant="primary" onClick={newVisit}>
                Registrar primera visita
              </Button>
            </EmptyState>
          )}

          {[...appointments].reverse().map((appointment) => (
            <article key={appointment.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 border-l-4 border-l-primary">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{formatDate(appointment.appointment_date)}</h3>
                <div className="flex flex-wrap justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/patients/${patient.id}/visits/${appointment.id}`)}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/patients/${patient.id}/visits/${appointment.id}/print`)}
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editVisit(appointment)}>
                    Editar visita
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteAppointment(appointment)}>
                    Eliminar
                  </Button>
                </div>
              </header>
              <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-4 sm:grid-cols-5">
                <Metric label="Peso" value={formatNumber(appointment.weight_kg, ' kg')} />
                <Metric label="Grasa" value={formatNumber(appointment.body_fat_pct, '%')} />
                <Metric label="Músculo" value={formatNumber(appointment.muscle_kg, ' kg')} />
                <Metric label="Cintura" value={formatNumber(appointment.waist_cm, ' cm')} />
                <Metric label="Cadera" value={formatNumber(appointment.hip_cm, ' cm')} />
                <Metric label="Pecho" value={formatNumber(appointment.chest_cm, ' cm')} />
                <Metric label="Brazo" value={formatNumber(appointment.arm_cm, ' cm')} />
                <Metric label="Muslo" value={formatNumber(appointment.thigh_cm, ' cm')} />
                <Metric label="Presión" value={appointment.blood_pressure ?? '—'} />
                <Metric label="Glucosa" value={formatNumber(appointment.glucose, ' mg/dL')} />
              </div>
              {appointment.notes && (
                <p className="mt-5 border-t border-dashed border-line pt-4 text-sm text-muted">{appointment.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === 'progreso' && (
        <div>
          {appointments.length === 0 ? (
            <EmptyState text="Aún no hay datos para mostrar progreso." />
          ) : (
            <div className="flex flex-col gap-4">
              {weightSeries.length >= 2 && (
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-ink">Evolución de peso</h3>
                    <p className="text-sm text-muted">Todas las visitas registradas</p>
                  </div>
                  <div className="-mx-2 overflow-x-auto px-2">
                    <div className="min-w-[520px]">
                      <LineChart data={weightSeries} unit=" kg" showDelta lowerIsBetter />
                    </div>
                  </div>
                </section>
              )}
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Fecha</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Peso</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">% Grasa</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Músculo</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Cintura</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Cadera</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Pecho</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Brazo</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Muslo</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Glucosa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {appointments.map((appointment) => (
                        <tr key={appointment.id} className="tabular-nums transition-colors hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{formatDate(appointment.appointment_date)}</td>
                          <td className="px-4 py-4 text-sm font-medium">{formatNumber(appointment.weight_kg)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.body_fat_pct)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.muscle_kg)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.waist_cm)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.hip_cm)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.chest_cm)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.arm_cm)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.thigh_cm)}</td>
                          <td className="px-4 py-4 text-sm text-muted">{formatNumber(appointment.glucose)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <DeleteDialog
        open={visitToDelete !== null}
        title="Eliminar visita"
        message={visitToDelete ? `¿Eliminar la visita del ${formatDate(visitToDelete.appointment_date)}?` : undefined}
        onConfirm={confirmDeleteVisit}
        onCancel={() => setVisitToDelete(null)}
      />
    </>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
  noteTone,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  note?: string
  tone: string
  noteTone?: string
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-xl', tone)}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-muted">{label}</div>
        <div className="mt-1 text-3xl font-bold leading-none tabular-nums text-ink">{value}</div>
        {note && <div className={cx('mt-1 text-xs', noteTone ?? 'text-faint')}>{note}</div>}
      </div>
    </div>
  )
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-black/5">
      <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="h-[7px] w-[7px] rounded-full bg-primary" />
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">{children}</div>
    </section>
  )
}

function InfoItem({
  label,
  value,
  tag,
  valueSuffix,
  wide,
  onAdd,
}: {
  label: string
  value: string | number | null | undefined
  tag?: string
  valueSuffix?: string
  wide?: boolean
  onAdd?: () => void
}) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className={wide ? 'col-span-2 sm:col-span-4' : undefined}>
      <div className="text-sm font-semibold text-ink">
        {label}
        {tag && <span className="ml-1 text-xs font-medium text-faint">({tag})</span>}
      </div>
      {empty ? (
        <div className="mt-1.5 flex items-center gap-2 text-base text-faint">
          <span>Sin registrar</span>
          {onAdd && (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100" onClick={onAdd}>
              + Agregar
            </button>
          )}
        </div>
      ) : (
        <div className="mt-1.5 text-base text-ink">
          {value}
          {valueSuffix && <span className="ml-1 font-medium text-faint">{valueSuffix}</span>}
        </div>
      )}
    </div>
  )
}

function ContactItem({
  label,
  value,
  kind,
  onAdd,
}: {
  label: string
  value: string | null | undefined
  kind: 'tel' | 'email'
  onAdd?: () => void
}) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      {value ? (
        <a
          href={`${kind === 'tel' ? 'tel' : 'mailto'}:${value}`}
          className="mt-1.5 inline-block text-base font-semibold text-indigo-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <div className="mt-1.5 flex items-center gap-2 text-base text-faint">
          <span>Sin registrar</span>
          {onAdd && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
              onClick={onAdd}
            >
              + Agregar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-faint">{label}</div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">{value}</div>
    </div>
  )
}

function EmptyState({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-muted">{text}</p>
      {children}
    </div>
  )
}
