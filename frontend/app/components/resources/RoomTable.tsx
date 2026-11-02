"use client";
import { StatusBadge } from "../ui";
import { display } from "../../lib/format";
import { clinicName } from "../../lib/mock-reference";
import type { Room } from "../../lib/types";

export default function RoomTable({ rooms, onEdit }: { rooms: Room[]; onEdit: (room: Room) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Room ID</th>
            <th scope="col">Clinic</th>
            <th scope="col">Room number</th>
            <th scope="col">Room type</th>
            <th scope="col">Capacity</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(r => (
            <tr key={r.room_id}>
              <td>{r.room_id}</td>
              <td>{clinicName(r.clinic_id)}</td>
              <td><strong>{r.room_number}</strong></td>
              <td>{display(r.room_type)}</td>
              <td>{display(r.capacity)}</td>
              <td><StatusBadge status={r.status} /></td>
              <td><button className="btn secondary small" onClick={() => onEdit(r)} aria-label={`Edit room ${r.room_number}`}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
