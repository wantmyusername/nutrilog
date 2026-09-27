export interface Patient {
  id: number
  full_name: string
  birth_date: string | null
  sex: string | null
  height_cm: number | null
  phone: string | null
  email: string | null
  objective: string | null
  activity_level: string | null
  activity_type: string | null
  daily_calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fats_g: number | null
  water_l: number | null
  allergies: string | null
  supplements: string | null
  notes: string | null
  next_visit_date: string | null
  created_at: string
  updated_at: string
  appointments_count?: number
  last_appointment_date?: string | null
  last_weight_kg?: number | null
}

export interface Appointment {
  id: number
  patient_id: number
  appointment_date: string
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_kg: number | null
  waist_cm: number | null
  hip_cm: number | null
  chest_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
  blood_pressure: string | null
  glucose: number | null
  notes: string | null
  meal_plan: string | null
  created_at: string
}

export interface User {
  id: number
  username: string
}

export interface MonthlyCount {
  month: string
  count: number
}

export interface RecentAppointment {
  id: number
  patient_id: number
  patient_name: string
  appointment_date: string
  weight_kg: number | null
  previous_weight_kg: number | null
  weight_delta: number | null
  waist_cm: number | null
}

export interface Stats {
  totals: {
    patients: number
    appointments: number
    patients_this_month: number
    appointments_this_month: number
    appointments_prev_month: number
    appointments_last_6m: number
  }
  appointments_by_month: MonthlyCount[]
  recent_appointments: RecentAppointment[]
}

export type PatientInput = Omit<
  Patient,
  'id' | 'created_at' | 'updated_at' | 'appointments_count' | 'last_appointment_date' | 'last_weight_kg'
>

export type AppointmentInput = Omit<Appointment, 'id' | 'patient_id' | 'created_at'>
