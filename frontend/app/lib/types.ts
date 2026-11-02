// Frontend types mirroring the tables in database/schema.sql.
// Field names match the MySQL columns so records can be swapped for API data later.

export interface Clinic {
  clinic_id: number;
  clinic_name: string;
}

export interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialization: string | null;
}

// PATIENT table
export interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export type PatientInput = Omit<Patient, "patient_id">;

// Gender values used by database/seed.sql (column is a free VARCHAR(20)).
export const GENDER_OPTIONS = ["Female", "Male", "Other"] as const;

// ROOM table
export interface Room {
  room_id: number;
  clinic_id: number;
  room_number: string;
  room_type: string | null;
  capacity: number | null;
  status: string;
}

export interface Equipment {
  equipment_id: number;
  clinic_id: number;
  equipment_type: string | null;
  equipment_name: string;
  status: string;
}

export interface ReferenceData {
  patients: Patient[];
  clinics: Clinic[];
  doctors: Doctor[];
  rooms: Room[];
  equipment: Equipment[];
}

/**
 * Row shape returned by GET /appointments, which selects from the
 * appointment_details view (database/views.sql).
 */
export interface AppointmentRecord {
  appointment_id: number;
  patient_name: string;
  doctor_name: string;
  clinic_name: string;
  room_number: string | null;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  appointment_type: string | null;
  status: string;
}

// APPOINTMENT.status values used by the backend scheduling service.
export const APPOINTMENT_STATUSES = ["scheduled", "completed", "cancelled"] as const;

// APPOINTMENT.appointment_type values used in database/seed.sql (free VARCHAR(50)).
export const APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Procedure"] as const;
