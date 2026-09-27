import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Printer, UtensilsCrossed } from 'lucide-react'
import { appointmentsApi, patientsApi } from '../api/endpoints'
import type { Appointment, Patient } from '../api/types'
import { Button } from '../components/ui'
import { RichTextEditor } from '../components/RichTextEditor'
import { useToast } from '../components/Toast'
import { cx } from '../components/styles'
import { calcAge, calcImc, formatDate, formatNumber, imcLabel } from '../lib/format'
import { METRICS, deltaTone, formatDelta } from '../lib/measurements'
import { planToHtml } from '../lib/richText'

export function VisitView() {
  const { id, visitId } = useParams()
  const patientId = Number(id)
  const appointmentId = Number(visitId)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState(false)
  const [planHtml, setPlanHtml] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)

  useEffect(() => {
    if (Number.isNaN(patientId)) return
    patientsApi
      .get(patientId)
      .then((data) => {
        setPatient(data.patient)
        setAppointments(data.appointments)
        const found = data.appointments.find((a) => a.id === appointmentId) ?? null
        setAppointment(found)
        setPlanHtml(planToHtml(found?.meal_plan))
        if (!found) setError('Visita no encontrada')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la información'))
      .finally(() => setLoading(false))
  }, [patientId, appointmentId])

  if (Number.isNaN(patientId)) return <Navigate to="/patients" replace />
  if (loading) return <p className="text-muted">Cargando…</p>
  if (error || !patient || !appointment) return <p className="text-rose-600">{error ?? 'No encontrado'}</p>

  const age = calcAge(patient.birth_date)
  const imc = calcImc(appointment.weight_kg, patient.height_cm)
  const backTo = `/patients/${patientId}?tab=visitas`
  const index = appointments.findIndex((a) => a.id === appointment.id)
  const previous = index > 0 ? appointments[index - 1] : null

  async function savePlan() {
    setSavingPlan(true)
    try {
      const updated = await appointmentsApi.update(appointment!.id, { meal_plan: planHtml })
      setAppointment(updated)
      setEditingPlan(false)
      toast('Plan alimenticio guardado')
    } finally {
      setSavingPlan(false)
    }
  }

  const measurements: { label: string; value: string }[] = [
    { label: 'Grasa corporal', value: formatNumber(appointment.body_fat_pct, ' %') },
    { label: 'Masa muscular', value: formatNumber(appointment.muscle_kg, ' kg') },
    { label: 'Cintura', value: formatNumber(appointment.waist_cm, ' cm') },
    { label: 'Cadera', value: formatNumber(appointment.hip_cm, ' cm') },
    { label: 'Pecho', value: formatNumber(appointment.chest_cm, ' cm') },
    { label: 'Brazo', value: formatNumber(appointment.arm_cm, ' cm') },
    { label: 'Muslo', value: formatNumber(appointment.thigh_cm, ' cm') },
    { label: 'Presión arterial', value: appointment.blood_pressure ?? '—' },
    { label: 'Glucosa', value: formatNumber(appointment.glucose, ' mg/dL') },
  ]

  return (
    <div className="mx-auto max-w-[1000px]">
      <nav className="mb-3.5 text-sm text-muted">
        <button type="button" className="transition-colors hover:text-ink" onClick={() => navigate('/patients')}>
          Pacientes
        </button>
        <span className="px-1.5">/</span>
        <button type="button" className="transition-colors hover:text-ink" onClick={() => navigate(backTo)}>
          {patient.full_name}
        </button>
        <span className="px-1.5">/</span>
        <span className="font-semibold text-ink">Visita</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">{formatDate(appointment.appointment_date)}</h2>
          <p className="mt-1 text-muted">
            {patient.full_name}
            {age !== null ? ` · ${age} años` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => navigate(`/patients/${patientId}/visits/${appointment.id}/print`)}>
            <Printer className="h-5 w-5" />
            Imprimir
          </Button>
          <Button variant="primary" onClick={() => navigate(`/patients/${patientId}/visits/${appointment.id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Editar datos de la visita
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Datos de la visita</h3>
          <div className="grid grid-cols-2 gap-5">
            <Info label="Peso" value={formatNumber(appointment.weight_kg, ' kg')} />
            <Info label="IMC" value={imc !== null ? `${imc} · ${imcLabel(imc)}` : '—'} />
            {measurements.map((m) => (
              <Info key={m.label} label={m.label} value={m.value} />
            ))}
          </div>

          {appointment.notes && (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Notas</h3>
              <p className="whitespace-pre-wrap text-sm text-ink">{appointment.notes}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
              <UtensilsCrossed className="h-4 w-4" />
              Plan alimenticio
            </h3>
            {!editingPlan && (
              <Button size="sm" variant="outline" onClick={() => setEditingPlan(true)}>
                <Pencil className="h-4 w-4" />
                {appointment.meal_plan ? 'Editar plan' : 'Añadir plan'}
              </Button>
            )}
          </div>

          {editingPlan ? (
            <>
              <RichTextEditor initialHtml={planHtml} onChange={setPlanHtml} placeholder="Escribe el plan de la visita…" />
              <div className="mt-4 flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlanHtml(planToHtml(appointment.meal_plan))
                    setEditingPlan(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button variant="primary" onClick={savePlan} disabled={savingPlan}>
                  {savingPlan ? 'Guardando…' : 'Guardar plan'}
                </Button>
              </div>
            </>
          ) : appointment.meal_plan ? (
            <div className="rich-content text-sm text-ink" dangerouslySetInnerHTML={{ __html: planToHtml(appointment.meal_plan) }} />
          ) : (
            <p className="text-sm italic text-muted">Sin plan alimenticio registrado en esta visita.</p>
          )}
        </section>
      </div>

      {previous && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-ink">Cambios vs. visita anterior</h3>
            <p className="text-sm text-muted">Comparado con {formatDate(previous.appointment_date)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {METRICS.map((m) => {
              const prevVal = previous[m.key]
              const lastVal = appointment[m.key]
              if (typeof prevVal !== 'number' || typeof lastVal !== 'number') return null
              const delta = Number((lastVal - prevVal).toFixed(1))
              return (
                <div key={String(m.key)} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                  <div>
                    <p className="text-xs text-muted">{m.label}</p>
                    <p className="text-sm font-bold text-ink">
                      {prevVal}
                      <span className="text-muted"> → </span>
                      {lastVal}
                      <span className="ml-0.5 text-xs font-medium text-muted">{m.unit.trim()}</span>
                    </p>
                  </div>
                  <span className={cx('shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold', deltaTone(delta, m.lowerIsBetter))}>
                    {formatDelta(delta)}
                    {m.unit.replace(/^\s/, ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  )
}
