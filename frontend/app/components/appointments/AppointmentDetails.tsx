"use client";
import { StatusBadge } from "../ui";
import { display, formatDate, formatTime } from "../../lib/format";
import type { AppointmentRecord } from "../../lib/types";
import { APPOINTMENT_STATUSES } from "../../lib/types";
import { useState } from "react";

export default function AppointmentDetails({ appointment: a, onStatusChange }: { appointment: AppointmentRecord; onStatusChange?: (status: string) => Promise<void> }) {
  const [statusError, setStatusError] = useState("");
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (status: string) => {
    if (!onStatusChange) return;
    setUpdating(true);
    setStatusError("");
    try {
      await onStatusChange(status);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Could not update appointment status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <dl className="details">
      <div><dt>Appointment ID</dt><dd>{a.appointment_id}</dd></div>
      <div><dt>Status</dt><dd>
        {onStatusChange ? (
          <select value={a.status.toLowerCase()} onChange={event => changeStatus(event.target.value)} disabled={updating} aria-label="Appointment status">
            {APPOINTMENT_STATUSES.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
          </select>
        ) : <StatusBadge status={a.status} />}
      </dd></div>
      {statusError && <div><dt>Status update</dt><dd className="error">{statusError}</dd></div>}
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
