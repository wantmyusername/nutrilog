import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { patientsApi } from '../api/endpoints'
import type { Patient, PatientInput } from '../api/types'
import { PatientForm } from '../components/PatientForm'
import { Button } from '../components/ui'
import { useToast } from '../components/Toast'

const FORM_ID = 'patient-form'

export function PatientEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEdit = id !== undefined
  const patientId = Number(id)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    patientsApi
      .get(patientId)
      .then((data) => setPatient(data.patient))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el paciente'))
      .finally(() => setLoading(false))
  }, [isEdit, patientId])

  async function handleSubmit(data: PatientInput) {
    if (isEdit) {
      const updated = await patientsApi.update(patientId, data)
      toast('Paciente actualizado')
      navigate(`/patients/${updated.id}`)
    } else {
      const created = await patientsApi.create(data)
      toast('Paciente registrado')
      navigate(`/patients/${created.id}`)
    }
  }

  if (isEdit && Number.isNaN(patientId)) return <Navigate to="/patients" replace />

  const backTo = isEdit ? `/patients/${patientId}` : '/patients'
  const showForm = !loading && !error

  return (
    <div className="mx-auto max-w-[920px] pb-6">
      <nav className="mb-3.5 text-[13px] text-muted">
        <button type="button" className="transition-colors hover:text-ink" onClick={() => navigate('/patients')}>
          Pacientes
        </button>
        <span className="px-1">/</span>
        <span className="font-semibold text-ink">{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</span>
      </nav>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            {isEdit ? patient?.full_name ?? 'Editar paciente' : 'Nuevo paciente'}
          </h2>
          <p className="mt-1 text-muted">
            {isEdit
              ? 'Actualiza los datos de contacto, requerimientos y observaciones.'
              : 'Registra los datos de contacto, requerimientos y observaciones del paciente.'}
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
        <p className="text-muted">Cargando paciente…</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <PatientForm
          formId={FORM_ID}
          initial={isEdit ? patient : null}
          onSubmit={handleSubmit}
          onSavingChange={setSaving}
        />
      )}

      {showForm && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-lg ring-1 ring-black/5">
          <span className="hidden min-w-0 truncate text-sm text-muted sm:block">
            Los campos marcados con * son obligatorios.
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} variant="primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar paciente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
