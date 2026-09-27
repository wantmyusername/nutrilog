import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { patientsApi } from '../api/endpoints'
import type { Patient } from '../api/types'
import { Button } from '../components/ui'
import { Avatar } from '../components/Avatar'
import { DeleteDialog } from '../components/DeleteDialog'
import { useToast } from '../components/Toast'
import { inputClass } from '../components/styles'
import { calcAge, calcImc, formatDate, goalBadgeClass, imcToneClass } from '../lib/format'

export function Patients() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<Patient | null>(null)

  const load = useCallback(async () => {
    try {
      setPatients(await patientsApi.list())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pacientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return patients
    return patients.filter((p) => p.full_name.toLowerCase().includes(term))
  }, [patients, search])

  async function confirmDelete() {
    if (!toDelete) return
    await patientsApi.remove(toDelete.id)
    setPatients((prev) => prev.filter((p) => p.id !== toDelete.id))
    toast('Paciente eliminado')
    setToDelete(null)
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Pacientes</h2>
          <p className="mt-1 text-muted">
            {patients.length} {patients.length === 1 ? 'expediente' : 'expedientes'}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
            <input
              className={`${inputClass} mt-0 w-full pl-10 sm:w-64`}
              placeholder="Buscar paciente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" className="w-full px-6 py-3 text-base sm:w-auto" onClick={() => navigate('/patients/new')}>
            <Plus className="h-5 w-5" />
            Nuevo paciente
          </Button>
        </div>
      </div>

      {loading && <p className="text-muted">Cargando pacientes…</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-muted">
            {patients.length === 0 ? 'Aún no hay pacientes registrados.' : 'Sin resultados para esa búsqueda.'}
          </p>
          {patients.length === 0 && (
            <Button variant="primary" onClick={() => navigate('/patients/new')}>
              <Plus className="h-5 w-5" />
              Agregar el primero
            </Button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Paciente</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Objetivo</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Última visita</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">Peso</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">IMC</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-muted">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {filtered.map((patient) => {
                  const age = calcAge(patient.birth_date)
                  const imc = calcImc(patient.last_weight_kg, patient.height_cm)
                  return (
                    <tr key={patient.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link to={`/patients/${patient.id}`} className="flex items-center gap-3">
                          <Avatar seed={patient.full_name} className="h-10 w-10" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{patient.full_name}</span>
                            <span className="block text-xs text-muted">
                              {age !== null ? `${age} años` : '—'} · {patient.appointments_count ?? 0}{' '}
                              {patient.appointments_count === 1 ? 'visita' : 'visitas'}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex rounded-md px-2 py-1 text-xs font-medium', goalBadgeClass(patient.objective))}>
                          {patient.objective ?? 'Sin objetivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-muted">{formatDate(patient.last_appointment_date)}</td>
                      <td className="px-4 py-4 text-sm font-bold tabular-nums">{patient.last_weight_kg ?? '—'} kg</td>
                      <td className={cn('px-4 py-4 text-sm font-bold tabular-nums', imcToneClass(imc))}>{imc ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            className="rounded-lg bg-amber-50 p-2 text-amber-600 transition-colors hover:bg-amber-100"
                            title="Editar"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(patient)}
                            className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeleteDialog
        open={toDelete !== null}
        title="Eliminar paciente"
        message={toDelete ? `¿Eliminar a ${toDelete.full_name} y todas sus visitas?` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
