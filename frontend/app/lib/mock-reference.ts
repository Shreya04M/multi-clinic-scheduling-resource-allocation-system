// DEMO REFERENCE DATA copied from database/seed.sql.
// Used to fill dropdowns (clinic, doctor, room) because the API does not yet
// expose list endpoints for these tables. IDs match seed.sql so a booking
// request sent to a seeded backend refers to real rows.
import type { Clinic, Doctor, Room } from "./types";

export const MOCK_CLINICS: Clinic[] = [
  { clinic_id: 201, clinic_name: "PES City Care Clinic" },
  { clinic_id: 202, clinic_name: "Green Valley Clinic" },
  { clinic_id: 203, clinic_name: "LifeCare Medical Centre" },
  { clinic_id: 204, clinic_name: "MediPlus Clinic" },
];

export const MOCK_DOCTORS: Doctor[] = [
  { doctor_id: 101, first_name: "Ananya", last_name: "Rao", specialization: "Cardiology" },
  { doctor_id: 102, first_name: "Rahul", last_name: "Sharma", specialization: "Neurology" },
  { doctor_id: 103, first_name: "Meera", last_name: "Nair", specialization: "Dermatology" },
  { doctor_id: 104, first_name: "Arjun", last_name: "Menon", specialization: "Orthopedics" },
  { doctor_id: 105, first_name: "Priya", last_name: "Iyer", specialization: "General Medicine" },
];

export const MOCK_ROOMS: Room[] = [
  { room_id: 601, clinic_id: 201, room_number: "101", room_type: "Consultation", capacity: 2, status: "available" },
  { room_id: 602, clinic_id: 201, room_number: "102", room_type: "Examination", capacity: 2, status: "available" },
  { room_id: 603, clinic_id: 202, room_number: "201", room_type: "Consultation", capacity: 2, status: "available" },
  { room_id: 604, clinic_id: 202, room_number: "202", room_type: "Procedure", capacity: 4, status: "available" },
  { room_id: 605, clinic_id: 203, room_number: "301", room_type: "Consultation", capacity: 2, status: "available" },
  { room_id: 606, clinic_id: 203, room_number: "302", room_type: "Examination", capacity: 2, status: "available" },
  { room_id: 607, clinic_id: 204, room_number: "401", room_type: "Consultation", capacity: 2, status: "available" },
  { room_id: 608, clinic_id: 204, room_number: "402", room_type: "Procedure", capacity: 4, status: "available" },
];

export const doctorName = (d: Doctor) => `Dr. ${d.first_name} ${d.last_name}`;
export const clinicName = (id: number) => MOCK_CLINICS.find(c => c.clinic_id === id)?.clinic_name ?? `Clinic ${id}`;
