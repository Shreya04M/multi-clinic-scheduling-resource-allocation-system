"use client";
import { StatusBadge } from "../ui";
import { display, formatDate, formatTime } from "../../lib/format";
import type { AppointmentRecord } from "../../lib/types";

export default function AppointmentTable({ appointments, onView }: { appointments: AppointmentRecord[]; onView: (a: AppointmentRecord) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Patient</th>
            <th scope="col">Doctor</th>
            <th scope="col">Clinic</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(a => (
            <tr key={a.appointment_id}>
              <td>{a.appointment_id}</td>
              <td><strong>{a.patient_name}</strong></td>
              <td>Dr. {a.doctor_name}</td>
              <td>{a.clinic_name}</td>
              <td style={{ whiteSpace: "nowrap" }}>{formatDate(a.appointment_date)}</td>
              <td style={{ whiteSpace: "nowrap" }}>{formatTime(a.start_time)} – {formatTime(a.end_time)}</td>
              <td>{display(a.appointment_type)}</td>
              <td><StatusBadge status={a.status} /></td>
              <td>
                <button className="btn secondary small" onClick={() => onView(a)} aria-label={`View appointment ${a.appointment_id}`}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
