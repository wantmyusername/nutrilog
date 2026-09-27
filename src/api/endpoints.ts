import { api } from './client'
import type { Patient, PatientInput, Appointment, AppointmentInput, Stats } from './types'

export const patientsApi = {
  list: () => api<Patient[]>('/patients'),
  get: (id: number) => api<{ patient: Patient; appointments: Appointment[] }>(`/patients/${id}`),
  create: (data: PatientInput) => api<Patient>('/patients', { method: 'POST', body: data }),
  update: (id: number, data: Partial<PatientInput>) =>
    api<Patient>(`/patients/${id}`, { method: 'PUT', body: data }),
  remove: (id: number) => api<{ ok: boolean }>(`/patients/${id}`, { method: 'DELETE' }),
}

export const appointmentsApi = {
  create: (patientId: number, data: AppointmentInput) =>
    api<Appointment>(`/patients/${patientId}/appointments`, { method: 'POST', body: data }),
  update: (id: number, data: Partial<AppointmentInput>) =>
    api<Appointment>(`/appointments/${id}`, { method: 'PUT', body: data }),
  remove: (id: number) => api<{ ok: boolean }>(`/appointments/${id}`, { method: 'DELETE' }),
}

export const statsApi = {
  get: () => api<Stats>('/stats'),
}
