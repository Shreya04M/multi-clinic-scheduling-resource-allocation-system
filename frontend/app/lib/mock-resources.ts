// DEMO DATA ONLY. There are no room/equipment API endpoints yet, so Resource
// Management works on local copies of database/seed.sql. Edits are not saved to MySQL.
import { MOCK_ROOMS } from "./mock-reference";
import type { Equipment, Room } from "./types";

// Seed rooms plus one extra demo room so the status filter has a non-available example.
const DEMO_ROOMS: Room[] = [
  ...MOCK_ROOMS,
  { room_id: 609, clinic_id: 203, room_number: "303", room_type: "Procedure", capacity: 3, status: "maintenance" },
];

const delay = <T,>(value: () => T, simulateError: boolean, what: string) =>
  new Promise<T>((resolve, reject) =>
    setTimeout(() => (simulateError ? reject(new Error(`Could not load ${what} (simulated error).`)) : resolve(value())), 400),
  );

export const loadMockRooms = (simulateError = false) => delay(() => DEMO_ROOMS.map(r => ({ ...r })), simulateError, "rooms");

// Seed equipment plus one extra demo item under maintenance.
const DEMO_EQUIPMENT: Equipment[] = [
  { equipment_id: 701, clinic_id: 201, equipment_type: "Diagnostic", equipment_name: "ECG Machine", status: "operational" },
  { equipment_id: 702, clinic_id: 201, equipment_type: "Monitoring", equipment_name: "Patient Monitor", status: "operational" },
  { equipment_id: 703, clinic_id: 202, equipment_type: "Diagnostic", equipment_name: "Ultrasound Machine", status: "operational" },
  { equipment_id: 704, clinic_id: 202, equipment_type: "Procedure", equipment_name: "Minor Surgery Kit", status: "operational" },
  { equipment_id: 705, clinic_id: 203, equipment_type: "Diagnostic", equipment_name: "Blood Pressure Monitor", status: "operational" },
  { equipment_id: 706, clinic_id: 203, equipment_type: "Diagnostic", equipment_name: "Glucometer", status: "operational" },
  { equipment_id: 707, clinic_id: 204, equipment_type: "Diagnostic", equipment_name: "Dermatoscope", status: "operational" },
  { equipment_id: 708, clinic_id: 204, equipment_type: "Monitoring", equipment_name: "Pulse Oximeter", status: "operational" },
  { equipment_id: 709, clinic_id: 201, equipment_type: "Diagnostic", equipment_name: "Portable X-Ray", status: "maintenance" },
];

export const loadMockEquipment = (simulateError = false) => delay(() => DEMO_EQUIPMENT.map(e => ({ ...e })), simulateError, "equipment");
