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
