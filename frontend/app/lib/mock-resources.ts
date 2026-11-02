// DEMO DATA ONLY. There are no room/equipment API endpoints yet, so Resource
// Management works on local copies of database/seed.sql. Edits are not saved to MySQL.
import { MOCK_ROOMS } from "./mock-reference";
import type { Room } from "./types";

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
