"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Field } from "../ui";
import { ApiError, apiFetch } from "../../lib/api";
import { todayISO } from "../../lib/format";
import { MOCK_PATIENTS } from "../../lib/mock-patients";
import { MOCK_CLINICS, MOCK_DOCTORS, MOCK_ROOMS, doctorName } from "../../lib/mock-reference";
import { APPOINTMENT_TYPES, type ReferenceData } from "../../lib/types";

/** Request body accepted by POST /appointments (backend/app/schemas.py AppointmentCreate). */
export interface AppointmentRequest {
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  room_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  equipment: number[];
  appointment_type: string | null;
}

interface Values {
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  room_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
}
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { patient_id: "", doctor_id: "", clinic_id: "", room_id: "", appointment_date: "", start_time: "", end_time: "", appointment_type: "" };

/**
 * Basic input checks only. Doctor availability, clinic association, room and
 * equipment conflicts and overlaps are decided by the FastAPI scheduling service.
 */
export function validateBooking(v: Values): Errors {
  const e: Errors = {};
  if (!v.patient_id) e.patient_id = "Select a patient.";
  if (!v.doctor_id) e.doctor_id = "Select a doctor.";
  if (!v.clinic_id) e.clinic_id = "Select a clinic.";
  if (!v.room_id) e.room_id = "Select a room (required by the booking API).";
  if (!v.appointment_date) e.appointment_date = "Appointment date is required.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.appointment_date) || Number.isNaN(Date.parse(v.appointment_date))) e.appointment_date = "Enter a valid appointment date.";
  else if (v.appointment_date < todayISO()) e.appointment_date = "Appointment date cannot be in the past.";
  if (!v.start_time) e.start_time = "Start time is required.";
  if (!v.end_time) e.end_time = "End time is required.";
  else if (v.start_time && v.end_time <= v.start_time) e.end_time = "End time must be later than the start time.";
  return e;
}

const withSeconds = (t: string) => (t.length === 5 ? `${t}:00` : t);

interface Props {
  mode: "live" | "demo";
  onSubmit: (request: AppointmentRequest, appointmentType: string | null) => Promise<void>;
  onCancel: () => void;
}

export default function AppointmentForm({ mode, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<{ title: string; message: string } | null>(null);
  const [reference, setReference] = useState<ReferenceData>({ patients: MOCK_PATIENTS, clinics: MOCK_CLINICS, doctors: MOCK_DOCTORS, rooms: MOCK_ROOMS, equipment: [] });

  useEffect(() => {
    if (mode !== "live") return;
    apiFetch<ReferenceData>("/reference").then(setReference).catch((err: Error) => setServerError({ title: "Reference data unavailable", message: err.message }));
  }, [mode]);

  const rooms = useMemo(() => reference.rooms.filter(r => String(r.clinic_id) === values.clinic_id), [reference.rooms, values.clinic_id]);

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    const next = { ...values, [key]: e.target.value };
    // Rooms belong to a clinic, so changing the clinic clears the room choice.
    if (key === "clinic_id") next.room_id = "";
    setValues(next);
    setServerError(null);
    if (submitted) setErrors(validateBooking(next));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateBooking(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(
        {
          patient_id: Number(values.patient_id),
          doctor_id: Number(values.doctor_id),
          clinic_id: Number(values.clinic_id),
          room_id: Number(values.room_id),
          appointment_date: values.appointment_date,
          start_time: withSeconds(values.start_time),
          end_time: withSeconds(values.end_time),
          equipment: [],
          appointment_type: values.appointment_type || null,
        },
        values.appointment_type || null,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        const title =
          err.status === 409 ? "Scheduling conflict (409)" :
          err.status === 422 ? "The backend rejected the request (422)" :
          err.status === 401 ? "Not signed in (401)" :
          err.status === 403 ? "Not permitted (403)" :
          err.status === 0 ? "API unreachable" : `Booking failed (${err.status})`;
        setServerError({ title, message: err.message });
      } else {
        setServerError({ title: "Booking failed", message: err instanceof Error ? err.message : String(err) });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const aria = (key: keyof Values) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `af-${key}-error` : undefined });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {mode === "demo" ? (
        <div className="notice demo"><strong>Demo mode:</strong> this request will NOT be sent to the backend. No availability or conflict checks run, and nothing is saved to MySQL.</div>
      ) : (
        <div className="notice live">The request is sent to POST /appointments. The backend checks doctor availability and room conflicts, and confirms the booking.</div>
      )}
      {serverError && (
        <div className="form-error" role="alert"><strong>{serverError.title}:</strong> {serverError.message}</div>
      )}
      {submitted && errorCount > 0 && <div className="form-error" role="alert">Please fix {errorCount} field{errorCount > 1 ? "s" : ""} highlighted below.</div>}

      <div className="form-grid">
        <Field id="af-patient_id" label="Patient" required error={errors.patient_id}>
          <select id="af-patient_id" value={values.patient_id} onChange={set("patient_id")} {...aria("patient_id")}>
            <option value="">Select a patient</option>
            {reference.patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name} (#{p.patient_id})</option>)}
          </select>
        </Field>
        <Field id="af-doctor_id" label="Doctor" required error={errors.doctor_id}>
          <select id="af-doctor_id" value={values.doctor_id} onChange={set("doctor_id")} {...aria("doctor_id")}>
            <option value="">Select a doctor</option>
            {reference.doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{doctorName(d)}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
          </select>
        </Field>
        <Field id="af-clinic_id" label="Clinic" required error={errors.clinic_id}>
          <select id="af-clinic_id" value={values.clinic_id} onChange={set("clinic_id")} {...aria("clinic_id")}>
            <option value="">Select a clinic</option>
            {reference.clinics.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.clinic_name}</option>)}
          </select>
        </Field>
        <Field id="af-room_id" label="Room" required error={errors.room_id} hint={values.clinic_id ? "Room availability is checked by the backend." : "Select a clinic first."}>
          <select id="af-room_id" value={values.room_id} onChange={set("room_id")} disabled={!values.clinic_id} {...aria("room_id")}>
            <option value="">{values.clinic_id ? "Select a room" : "Select a clinic first"}</option>
            {rooms.map(r => <option key={r.room_id} value={r.room_id}>Room {r.room_number}{r.room_type ? ` — ${r.room_type}` : ""}</option>)}
          </select>
        </Field>
        <Field id="af-appointment_date" label="Appointment date" required error={errors.appointment_date}>
          <input id="af-appointment_date" type="date" min={todayISO()} value={values.appointment_date} onChange={set("appointment_date")} {...aria("appointment_date")} />
        </Field>
        <Field id="af-appointment_type" label="Appointment type">
          <select id="af-appointment_type" value={values.appointment_type} onChange={set("appointment_type")}>
            <option value="">Not specified</option>
            {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field id="af-start_time" label="Start time" required error={errors.start_time}>
          <input id="af-start_time" type="time" value={values.start_time} onChange={set("start_time")} {...aria("start_time")} />
        </Field>
        <Field id="af-end_time" label="End time" required error={errors.end_time}>
          <input id="af-end_time" type="time" value={values.end_time} onChange={set("end_time")} {...aria("end_time")} />
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn" disabled={submitting}>{submitting ? "Submitting…" : mode === "demo" ? "Add demo request" : "Submit booking request"}</button>
      </div>
    </form>
  );
}
