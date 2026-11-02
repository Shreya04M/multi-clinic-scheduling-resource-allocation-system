// DEMO DATA ONLY, in the same shape as GET /appointments (appointment_details view).
// Used only when the user chooses "Use demo data" because the API cannot be reached.
// 801–808 mirror database/seed.sql; 809–811 are extra demo rows so the
// completed/cancelled status filters have something to show.
import type { AppointmentRecord } from "./types";

export const MOCK_APPOINTMENTS: AppointmentRecord[] = [
  { appointment_id: 801, patient_name: "Kavya Sharma", doctor_name: "Ananya Rao", clinic_name: "PES City Care Clinic", room_number: "101", appointment_date: "2026-10-05", start_time: "09:00:00", end_time: "09:30:00", appointment_type: "Consultation", status: "scheduled" },
  { appointment_id: 802, patient_name: "Rohan Kumar", doctor_name: "Rahul Sharma", clinic_name: "PES City Care Clinic", room_number: "102", appointment_date: "2026-10-06", start_time: "10:00:00", end_time: "10:30:00", appointment_type: "Consultation", status: "scheduled" },
  { appointment_id: 803, patient_name: "Sneha Patil", doctor_name: "Meera Nair", clinic_name: "Green Valley Clinic", room_number: "201", appointment_date: "2026-10-05", start_time: "14:00:00", end_time: "14:30:00", appointment_type: "Consultation", status: "scheduled" },
  { appointment_id: 804, patient_name: "Aditya Reddy", doctor_name: "Arjun Menon", clinic_name: "Green Valley Clinic", room_number: "202", appointment_date: "2026-10-06", start_time: "09:00:00", end_time: "10:00:00", appointment_type: "Procedure", status: "scheduled" },
  { appointment_id: 805, patient_name: "Nisha Shah", doctor_name: "Priya Iyer", clinic_name: "LifeCare Medical Centre", room_number: "301", appointment_date: "2026-10-07", start_time: "10:00:00", end_time: "10:30:00", appointment_type: "Consultation", status: "scheduled" },
  { appointment_id: 806, patient_name: "Vikram Joshi", doctor_name: "Ananya Rao", clinic_name: "MediPlus Clinic", room_number: "401", appointment_date: "2026-10-08", start_time: "09:00:00", end_time: "09:30:00", appointment_type: "Follow-up", status: "scheduled" },
  { appointment_id: 807, patient_name: "Kavya Sharma", doctor_name: "Meera Nair", clinic_name: "MediPlus Clinic", room_number: "402", appointment_date: "2026-10-09", start_time: "14:00:00", end_time: "14:30:00", appointment_type: "Follow-up", status: "scheduled" },
  { appointment_id: 808, patient_name: "Rohan Kumar", doctor_name: "Arjun Menon", clinic_name: "Green Valley Clinic", room_number: "202", appointment_date: "2026-10-13", start_time: "09:00:00", end_time: "10:00:00", appointment_type: "Procedure", status: "scheduled" },
  { appointment_id: 809, patient_name: "Sneha Patil", doctor_name: "Priya Iyer", clinic_name: "LifeCare Medical Centre", room_number: "302", appointment_date: "2026-10-14", start_time: "11:00:00", end_time: "11:30:00", appointment_type: "Consultation", status: "completed" },
  { appointment_id: 810, patient_name: "Aditya Reddy", doctor_name: "Ananya Rao", clinic_name: "PES City Care Clinic", room_number: null, appointment_date: "2026-10-21", start_time: "09:30:00", end_time: "10:00:00", appointment_type: "Follow-up", status: "cancelled" },
  { appointment_id: 811, patient_name: "Nisha Shah", doctor_name: "Rahul Sharma", clinic_name: "PES City Care Clinic", room_number: "102", appointment_date: "2026-11-10", start_time: "10:00:00", end_time: "10:30:00", appointment_type: "Consultation", status: "scheduled" },
];
