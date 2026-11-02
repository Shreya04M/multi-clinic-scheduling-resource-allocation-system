"use client";
import { StatusBadge } from "../ui";
import { display, formatDate, formatTime } from "../../lib/format";
import type { AppointmentRecord } from "../../lib/types";

export default function AppointmentDetails({ appointment: a }: { appointment: AppointmentRecord }) {
  return (
    <dl className="details">
      <div><dt>Appointment ID</dt><dd>{a.appointment_id}</dd></div>
      <div><dt>Status</dt><dd><StatusBadge status={a.status} /></dd></div>
      <div><dt>Patient</dt><dd>{a.patient_name}</dd></div>
      <div><dt>Doctor</dt><dd>Dr. {a.doctor_name}</dd></div>
      <div><dt>Clinic</dt><dd>{a.clinic_name}</dd></div>
      <div><dt>Room</dt><dd>{a.room_number ? `Room ${a.room_number}` : "Not assigned"}</dd></div>
      <div><dt>Date</dt><dd>{formatDate(a.appointment_date)}</dd></div>
      <div><dt>Time</dt><dd>{formatTime(a.start_time)} – {formatTime(a.end_time)}</dd></div>
      <div><dt>Appointment type</dt><dd>{display(a.appointment_type)}</dd></div>
    </dl>
  );
}
