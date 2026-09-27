import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarDays, Plus, UserPlus, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { patientsApi, statsApi } from '../api/endpoints'
import type { Patient, Stats } from '../api/types'
import { LineChart } from '../components/LineChart'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/ui'
import { useAuth } from '../auth/context'
import { cx } from '../components/styles'
import {
  calcAge,
  calcImc,
  formatDate,
  goalBadgeClass,
  imcToneClass,
  monthShort,
} from '../lib/format'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [statsData, patientsData] = await Promise.all([statsApi.get(), patientsApi.list()])
      setStats(statsData)
      setPatients(patientsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el panel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const recentPatients = [...patients]
    .sort((a, b) => (b.last_appointment_date ?? '').localeCompare(a.last_appointment_date ?? ''))
    .slice(0, 6)

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let monthDelta = '—'
  let averagePerMonth = 0
  if (stats) {
    const { appointments_this_month: current, appointments_prev_month: prev, appointments_last_6m: total } =
      stats.totals
    averagePerMonth = Math.round((total / 6) * 10) / 10
    if (prev > 0) {
      const pct = Math.round(((current - prev) / prev) * 100)
      monthDelta = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}%`
    } else if (current > 0) {
      monthDelta = '↑ 100%'
    } else {
      monthDelta = '= 0%'
    }
  }

  const chartData = stats ? stats.appointments_by_month.map((m) => ({ label: monthShort(m.month), value: m.count })) : []

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Hola, {user?.username}</h2>
          <p className="mt-1 capitalize text-muted">{today}</p>
        </div>
        <Button variant="primary" className="px-6 py-3 text-base" onClick={() => navigate('/patients/new')}>
          <Plus className="h-5 w-5" />
          Añadir nuevo paciente
        </Button>
      </div>

      {loading && <p className="text-muted">Cargando panel…</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {stats && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} tone="bg-indigo-50 text-indigo-600" label="Pacientes" value={stats.totals.patients} note="Total registrados" />
            <MetricCard
              icon={CalendarCheck}
              tone="bg-green-50 text-green-600"
              label="Visitas registradas"
              value={stats.totals.appointments}
              note={`Promedio ${averagePerMonth} por mes`}
            />
            <MetricCard
              icon={CalendarDays}
              tone="bg-amber-50 text-amber-600"
              label="Visitas este mes"
              value={stats.totals.appointments_this_month}
              note={`vs. mes anterior (${stats.totals.appointments_prev_month})`}
              badge={monthDelta}
            />
            <MetricCard
              icon={UserPlus}
              tone="bg-rose-50 text-rose-600"
              label="Pacientes nuevos"
              value={stats.totals.patients_this_month}
              note="Este mes"
            />
          </div>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Visitas por mes</h3>
                <p className="text-sm text-muted">Últimos 6 meses</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                {stats.totals.appointments_last_6m} total
              </span>
            </div>
            <div className="-mx-2 overflow-x-auto px-2">
              <div className="min-w-[520px]">
                <LineChart data={chartData} />
              </div>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3 px-6 pt-6">
              <h3 className="text-lg font-bold text-ink">Pacientes</h3>
              <Link to="/patients" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                Ver todos →
              </Link>
            </div>
            {recentPatients.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted">
                Aún no hay pacientes. Agrega el primero para empezar.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-line">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Paciente</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Objetivo</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Última visita</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Peso</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">IMC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white">
                    {recentPatients.map((patient) => {
                      const imc = calcImc(patient.last_weight_kg, patient.height_cm)
                      const age = calcAge(patient.birth_date)
                      return (
                        <tr key={patient.id} className="transition-colors hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link to={`/patients/${patient.id}`} className="flex items-center gap-3">
                              <Avatar seed={patient.full_name} className="h-10 w-10" />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-ink">{patient.full_name}</span>
                                <span className="block text-xs text-muted">{age !== null ? `${age} años` : '—'}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cx('inline-flex rounded-md px-2 py-1 text-xs font-medium', goalBadgeClass(patient.objective))}>
                              {patient.objective ?? 'Sin objetivo'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-muted">{formatDate(patient.last_appointment_date)}</td>
                          <td className="px-4 py-4 text-sm font-bold tabular-nums">{patient.last_weight_kg ?? '—'} kg</td>
                          <td className={cx('px-6 py-4 text-sm font-bold tabular-nums', imcToneClass(imc))}>{imc ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}

function MetricCard({
  icon: Icon,
  tone,
  label,
  value,
  note,
  badge,
}: {
  icon: LucideIcon
  tone: string
  label: string
  value: number
  note: string
  badge?: string
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <span className={cx('grid h-12 w-12 place-items-center rounded-xl', tone)}>
          <Icon className="h-6 w-6" />
        </span>
        {badge && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">{badge}</span>}
      </div>
      <p className="mt-4 text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-faint">{note}</p>
    </div>
  )
}
