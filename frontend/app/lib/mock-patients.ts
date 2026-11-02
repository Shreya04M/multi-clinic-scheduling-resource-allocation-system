// DEMO DATA ONLY. There is no patient API endpoint yet, so the Patient
// Management page works on this local copy of database/seed.sql.
// Nothing here is read from or written to MySQL.
import type { Patient } from "./types";

export const MOCK_PATIENTS: Patient[] = [
  { patient_id: 301, first_name: "Kavya", last_name: "Sharma", date_of_birth: "2002-05-14", gender: "Female", phone: "9876501001", email: "kavya.sharma@email.com", address: "Electronic City, Bengaluru" },
  { patient_id: 302, first_name: "Rohan", last_name: "Kumar", date_of_birth: "1998-11-23", gender: "Male", phone: "9876501002", email: "rohan.kumar@email.com", address: "Koramangala, Bengaluru" },
  { patient_id: 303, first_name: "Sneha", last_name: "Patil", date_of_birth: "2005-02-17", gender: "Female", phone: "9876501003", email: "sneha.patil@email.com", address: "JP Nagar, Bengaluru" },
  { patient_id: 304, first_name: "Aditya", last_name: "Reddy", date_of_birth: "1995-08-09", gender: "Male", phone: "9876501004", email: "aditya.reddy@email.com", address: "Indiranagar, Bengaluru" },
  { patient_id: 305, first_name: "Nisha", last_name: "Shah", date_of_birth: "2000-12-30", gender: "Female", phone: "9876501005", email: "nisha.shah@email.com", address: "Whitefield, Bengaluru" },
  { patient_id: 306, first_name: "Vikram", last_name: "Joshi", date_of_birth: "1992-04-18", gender: "Male", phone: "9876501006", email: "vikram.joshi@email.com", address: "HSR Layout, Bengaluru" },
];

/** Simulates a network fetch so loading/error states can be exercised. */
export function loadMockPatients(simulateError = false): Promise<Patient[]> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (simulateError ? reject(new Error("Could not load patients (simulated error).")) : resolve(MOCK_PATIENTS.map(p => ({ ...p })))), 400),
  );
}
