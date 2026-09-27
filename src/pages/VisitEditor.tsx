import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { appointmentsApi, patientsApi } from '../api/endpoints'
import type { Appointment, AppointmentInput, Patient } from '../api/types'
import { AppointmentForm } from '../components/AppointmentForm'
import { Button } from '../components/ui'
import { useToast } from '../components/Toast'

const FORM_ID = 'visit-form'

export function VisitEditor() {
  const { id, visitId } = useParams()
  const patientId = Number(id)
  const isEdit = visitId !== undefined
  const appointmentId = Number(visitId)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (Number.isNaN(patientId)) return
    patientsApi
      .get(patientId)
      .then((data) => {
        setPatient(data.patient)
        if (isEdit) {
          const found = data.appointments.find((a) => a.id === appointmentId) ?? null
          setAppointment(found)
          if (!found) setError('Visita no encontrada')
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la información'))
      .finally(() => setLoading(false))
  }, [patientId, isEdit, appointmentId])

  async function handleSubmit(data: AppointmentInput) {
    if (isEdit) {
      await appointmentsApi.update(appointmentId, data)
    } else {
      await appointmentsApi.create(patientId, data)
    }
    toast(isEdit ? 'Visita actualizada' : 'Visita registrada')
    navigate(`/patients/${patientId}?tab=visitas`)
  }

  if (Number.isNaN(patientId)) return <Navigate to="/patients" replace />

  const backTo = `/patients/${patientId}?tab=visitas`
  const showForm = !loading && !error

  return (
    <div className="mx-auto max-w-[920px] pb-6">
      <nav className="mb-3.5 text-sm text-muted">
        <button type="button" className="transition-colors hover:text-ink" onClick={() => navigate('/patients')}>
          Pacientes
        </button>
        <span className="px-1.5">/</span>
        <button
          type="button"
          className="transition-colors hover:text-ink"
          onClick={() => navigate(backTo)}
        >
          {patient?.full_name ?? 'Paciente'}
        </button>
        <span className="px-1.5">/</span>
        <span className="font-semibold text-ink">{isEdit ? 'Editar visita' : 'Registrar visita'}</span>
      </nav>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            {isEdit ? 'Editar visita' : 'Registrar visita'}
          </h2>
          <p className="mt-1 text-muted">
            {patient ? `${patient.full_name} · registra medidas, signos vitales y notas.` : 'Registra medidas, signos vitales y notas.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <AppointmentForm
          formId={FORM_ID}
          initial={isEdit ? appointment : null}
          onSubmit={handleSubmit}
          onSavingChange={setSaving}
        />
      )}

      {showForm && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-lg ring-1 ring-black/5">
          <span className="hidden min-w-0 truncate text-sm text-muted sm:block">
            La fecha de la visita es obligatoria.
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} variant="primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar visita'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
