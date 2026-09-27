import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { patientsApi } from '../api/endpoints'
import type { Patient } from '../api/types'
import { Avatar } from '../components/Avatar'
import { daysUntil, formatDate, relativeLabel } from '../lib/format'
import { cx } from '../components/styles'

interface Row {
  patient: Patient
  days: number
}

export function Agenda() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setPatients(await patientsApi.list())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las citas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const scheduled: Row[] = patients
    .filter((p) => p.next_visit_date)
    .map((p) => ({ patient: p, days: daysUntil(p.next_visit_date as string) }))
    .sort((a, b) => a.days - b.days)

  const groups: { title: string; rows: Row[] }[] = [
    { title: 'Vencidas', rows: scheduled.filter((r) => r.days < 0) },
    { title: 'Hoy', rows: scheduled.filter((r) => r.days === 0) },
    { title: 'Próximos 7 días', rows: scheduled.filter((r) => r.days > 0 && r.days <= 7) },
    { title: 'Más adelante', rows: scheduled.filter((r) => r.days > 7) },
  ]

  const unscheduled = patients.filter((p) => !p.next_visit_date)

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Agenda</h2>
        <p className="mt-1 text-muted">
          {scheduled.length} {scheduled.length === 1 ? 'cita programada' : 'citas programadas'}
        </p>
      </div>

      {loading && <p className="text-muted">Cargando agenda…</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {!loading && !error && patients.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-muted">Aún no hay pacientes registrados.</p>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="flex flex-col gap-6">
          {scheduled.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center shadow-sm">
              <CalendarClock className="mx-auto h-6 w-6 text-faint" />
              <p className="text-muted">No hay citas programadas. Programa desde el perfil de un paciente.</p>
            </div>
          )}

          {groups
            .filter((group) => group.rows.length > 0)
            .map((group) => (
              <section key={group.title}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                  {group.title}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                    {group.rows.length}
                  </span>
                </h3>
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  <ul className="divide-y divide-line">
                    {group.rows.map(({ patient, days }) => (
                      <AgendaRow key={patient.id} patient={patient} days={days} />
                    ))}
                  </ul>
                </div>
              </section>
            ))}

          {unscheduled.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                Sin programar
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {unscheduled.length}
                </span>
              </h3>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <ul className="divide-y divide-line">
                  {unscheduled.map((patient) => (
                    <AgendaRow key={patient.id} patient={patient} days={null} />
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}

function AgendaRow({ patient, days }: { patient: Patient; days: number | null }) {
  const chip =
    days === null
      ? 'bg-gray-100 text-gray-500'
      : days < 0
        ? 'bg-rose-50 text-rose-600'
        : days === 0
          ? 'bg-amber-50 text-amber-700'
          : days <= 7
            ? 'bg-indigo-50 text-indigo-600'
            : 'bg-gray-100 text-gray-600'

  return (
    <li>
      <Link to={`/patients/${patient.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50">
        <Avatar seed={patient.full_name} className="h-10 w-10" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{patient.full_name}</span>
          <span className="block truncate text-xs text-muted">
            {patient.next_visit_date ? formatDate(patient.next_visit_date) : 'Sin próxima cita'}
            {patient.objective ? ` · ${patient.objective}` : ''}
          </span>
        </span>
        <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', chip)}>
          {patient.next_visit_date ? relativeLabel(patient.next_visit_date) : 'Programar'}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
      </Link>
    </li>
  )
}
