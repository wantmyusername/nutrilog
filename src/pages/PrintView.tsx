import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flame, Leaf, PartyPopper, Printer, Sparkles, ThumbsUp, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { patientsApi } from '../api/endpoints'
import type { Appointment, Patient } from '../api/types'
import { calcAge, calcImc, formatDate, formatNumber, imcLabel } from '../lib/format'
import { METRICS, deltaTone, formatDelta } from '../lib/measurements'
import { planToHtml } from '../lib/richText'
import { cx } from '../components/styles'

interface Comparison {
  label: string
  unit: string
  prev: number
  now: number
  delta: number
  lowerIsBetter: boolean | null
}

const FEEDBACK: Record<string, { icon: LucideIcon; title: string; body: string; cls: string }> = {
  good: {
    icon: PartyPopper,
    title: '¡Felicidades!',
    body: 'Tus resultados se reflejan en la báscula y en las medidas. El esfuerzo y la constancia están dando fruto. ¡Sigue así!',
    cls: 'border-green-200 bg-green-50 text-green-800',
  },
  flat: {
    icon: ThumbsUp,
    title: '¡Vas muy bien!',
    body: 'Mantener los resultados también es un logro. La constancia es la clave: continúa con tu plan y tus horarios.',
    cls: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  },
  encourage: {
    icon: Flame,
    title: '¡Ánimo!',
    body: 'Los resultados son un proceso, no una carrera. Cada paso, por pequeño que sea, te acerca a tu objetivo. ¡Seguimos!',
    cls: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  first: {
    icon: Sparkles,
    title: '¡Bienvenido!',
    body: 'Este es tu punto de partida. A partir de aquí mediremos tu progreso visita a visita.',
    cls: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  },
}

export function PrintView() {
  const { id, visitId } = useParams()
  const patientId = Number(id)
  const appointmentId = Number(visitId)
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Number.isNaN(patientId)) return
    patientsApi
      .get(patientId)
      .then((data) => {
        setPatient(data.patient)
        setAppointments(data.appointments)
        const found = data.appointments.find((a) => a.id === appointmentId) ?? null
        setAppointment(found)
        if (!found) setError('Visita no encontrada')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la información'))
      .finally(() => setLoading(false))
  }, [patientId, appointmentId])

  if (loading) return <p className="p-10 text-muted">Cargando…</p>
  if (error || !patient || !appointment) return <p className="p-10 text-rose-600">{error ?? 'No encontrado'}</p>

  const age = calcAge(patient.birth_date)
  const imc = calcImc(appointment.weight_kg, patient.height_cm)
  const generatedAt = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  const index = appointments.findIndex((a) => a.id === appointment.id)
  const previous = index > 0 ? appointments[index - 1] : null

  const comparisons: Comparison[] = previous
    ? METRICS.map((m): Comparison | null => {
        const prevVal = previous[m.key]
        const nowVal = appointment[m.key]
        if (typeof prevVal !== 'number' || typeof nowVal !== 'number') return null
        return {
          label: m.label,
          unit: m.unit,
          prev: prevVal,
          now: nowVal,
          delta: Number((nowVal - prevVal).toFixed(1)),
          lowerIsBetter: m.lowerIsBetter,
        }
      }).filter((c): c is Comparison => c !== null)
    : []

  const weight = comparisons.find((c) => c.label === 'Peso') ?? null
  let feedbackKey: keyof typeof FEEDBACK = 'first'
  if (previous && comparisons.length > 0) {
    const goodCount = comparisons.filter(
      (c) => c.lowerIsBetter !== null && (c.lowerIsBetter ? c.delta < 0 : c.delta > 0),
    ).length
    const badCount = comparisons.filter(
      (c) => c.lowerIsBetter !== null && (c.lowerIsBetter ? c.delta > 0 : c.delta < 0),
    ).length
    const ref = weight ?? comparisons[0]
    if (ref.delta <= -0.2) feedbackKey = 'good'
    else if (ref.delta >= 0.2) feedbackKey = 'encourage'
    else if (goodCount > badCount) feedbackKey = 'good'
    else if (badCount > goodCount) feedbackKey = 'encourage'
    else feedbackKey = 'flat'
  }
  const feedback = FEEDBACK[feedbackKey]
  const FeedbackIcon = feedback.icon
  const weightLine =
    feedbackKey === 'good' && weight && weight.delta < 0
      ? ` Bajaste ${Math.abs(weight.delta)} kg desde tu visita anterior.`
      : ''

  const measurements: { label: string; value: string }[] = [
    { label: 'Peso', value: formatNumber(appointment.weight_kg, ' kg') },
    { label: 'Grasa corporal', value: formatNumber(appointment.body_fat_pct, ' %') },
    { label: 'Masa muscular', value: formatNumber(appointment.muscle_kg, ' kg') },
    { label: 'Cintura', value: formatNumber(appointment.waist_cm, ' cm') },
    { label: 'Cadera', value: formatNumber(appointment.hip_cm, ' cm') },
    { label: 'Pecho', value: formatNumber(appointment.chest_cm, ' cm') },
    { label: 'Brazo', value: formatNumber(appointment.arm_cm, ' cm') },
    { label: 'Muslo', value: formatNumber(appointment.thigh_cm, ' cm') },
    { label: 'Presión arterial', value: appointment.blood_pressure ?? '—' },
    { label: 'Glucosa', value: formatNumber(appointment.glucose, ' mg/dL') },
  ].filter((m) => m.value !== '—')

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-gray-800 px-4 py-3 text-white sm:px-6">
        <span className="hidden text-sm font-semibold sm:block">Vista de impresión · Plan alimenticio</span>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-bold transition-colors hover:bg-green-600 sm:flex-none"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}?tab=visitas`)}
            className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-bold transition-colors hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
            Cerrar
          </button>
        </div>
      </div>

      <div className="paper mx-auto my-4 max-w-[850px] bg-white p-5 shadow-lg sm:my-8 sm:p-10 print:my-0 print:max-w-full print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <Leaf className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xl font-bold leading-none">NutriLog</p>
              <p className="text-xs text-muted">Plan alimenticio</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Visita del {formatDate(appointment.appointment_date)}</p>
            <p className="text-xs text-muted">Generado el {generatedAt}</p>
          </div>
        </header>

        <section className="mt-6">
          <h1 className="text-2xl font-bold">{patient.full_name}</h1>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <Info label="Edad" value={age !== null ? `${age} años` : '—'} />
            <Info label="Talla" value={formatNumber(patient.height_cm, ' cm')} />
            <Info label="Objetivo" value={patient.objective ?? '—'} />
            <Info label="Agua al día" value={formatNumber(patient.water_l, ' L')} />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 border-b border-line pb-1 text-sm font-bold uppercase tracking-wide text-muted">
            Medidas de la visita
          </h2>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            <Info label="Peso" value={formatNumber(appointment.weight_kg, ' kg')} />
            <Info label="IMC" value={imc !== null ? `${imc} · ${imcLabel(imc)}` : '—'} />
            {measurements.map((m) => (
              <Info key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 border-b border-line pb-1 text-sm font-bold uppercase tracking-wide text-muted">
            {previous ? 'Comparativa vs. visita anterior' : 'Punto de partida'}
          </h2>

          {previous && comparisons.length > 0 && (
            <>
              <p className="mb-3 text-xs text-muted">Comparado con la visita del {formatDate(previous.appointment_date)}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {comparisons.map((c) => (
                  <div key={c.label} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                    <div>
                      <p className="text-xs text-muted">{c.label}</p>
                      <p className="text-sm font-bold text-ink">
                        {c.prev}
                        <span className="text-muted"> → </span>
                        {c.now}
                        <span className="ml-0.5 text-xs font-medium text-muted">{c.unit.trim()}</span>
                      </p>
                    </div>
                    <span className={cx('shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold', deltaTone(c.delta, c.lowerIsBetter))}>
                      {formatDelta(c.delta)}
                      {c.unit.replace(/^\s/, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={cx('mt-4 flex items-start gap-3 rounded-xl border px-4 py-3', feedback.cls)}>
            <FeedbackIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">
                {feedback.title}
                {weightLine}
              </p>
              <p className="text-sm">{feedback.body}</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 border-b border-line pb-1 text-sm font-bold uppercase tracking-wide text-muted">
            Plan alimenticio
          </h2>
          {appointment.meal_plan ? (
            <div
              className="rich-content text-[14px] leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: planToHtml(appointment.meal_plan) }}
            />
          ) : (
            <p className="text-sm italic text-muted">Sin plan alimenticio registrado en esta visita.</p>
          )}
        </section>

        {appointment.notes && (
          <section className="mt-8">
            <h2 className="mb-3 border-b border-line pb-1 text-sm font-bold uppercase tracking-wide text-muted">
              Notas
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{appointment.notes}</p>
          </section>
        )}

        <footer className="mt-12 border-t border-line pt-4 text-center text-xs text-muted">
          <p>Este documento es un respaldo del plan alimenticio entregado en consulta.</p>
          <p className="mt-1 font-semibold">NutriLog</p>
        </footer>
      </div>
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
