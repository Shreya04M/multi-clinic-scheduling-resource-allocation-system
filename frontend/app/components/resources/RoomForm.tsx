"use client";
import { useState, type FormEvent } from "react";
import { Field } from "../ui";
import { MOCK_CLINICS } from "../../lib/mock-reference";
import { ROOM_STATUSES, ROOM_TYPES, type Room, type RoomInput } from "../../lib/types";

interface Values { clinic_id: string; room_number: string; room_type: string; capacity: string; status: string }
type Errors = Partial<Record<keyof Values, string>>;

export function validateRoom(v: Values, existing: Room[], editingId?: number): Errors {
  const e: Errors = {};
  if (!v.clinic_id) e.clinic_id = "Select the clinic this room belongs to.";
  const num = v.room_number.trim();
  if (!num) e.room_number = "Room number is required.";
  else if (num.length > 20) e.room_number = "Room number must be 20 characters or fewer.";
  else if (!/^[A-Za-z0-9][A-Za-z0-9 \-/]*$/.test(num)) e.room_number = "Room number may contain only letters, numbers, spaces, '-' and '/'.";
  // Mirrors UNIQUE (clinic_id, room_number) for the records on screen; the database stays authoritative.
  else if (v.clinic_id && existing.some(r => r.room_id !== editingId && String(r.clinic_id) === v.clinic_id && r.room_number.toLowerCase() === num.toLowerCase()))
    e.room_number = "This clinic already has a room with that number.";
  if (v.room_type.trim().length > 50) e.room_type = "Room type must be 50 characters or fewer.";
  if (v.capacity.trim() !== "") {
    const n = Number(v.capacity);
    if (!Number.isInteger(n) || n <= 0) e.capacity = "Capacity must be a positive whole number.";
    else if (n > 1000) e.capacity = "Capacity looks too large; enter 1000 or fewer.";
  }
  if (!v.status) e.status = "Select a room status.";
  return e;
}

interface Props { initial?: Room; existing: Room[]; onSubmit: (input: RoomInput) => void; onCancel: () => void }

export default function RoomForm({ initial, existing, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Values>({
    clinic_id: initial ? String(initial.clinic_id) : "",
    room_number: initial?.room_number ?? "",
    room_type: initial?.room_type ?? "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    status: initial?.status ?? "available",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (submitted) setErrors(validateRoom(next, existing, initial?.room_id));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateRoom(values, existing, initial?.room_id);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({
      clinic_id: Number(values.clinic_id),
      room_number: values.room_number.trim(),
      room_type: values.room_type.trim() || null,
      capacity: values.capacity.trim() === "" ? null : Number(values.capacity),
      status: values.status,
    });
  };

  // Keep an unexpected status from the data selectable instead of silently replacing it.
  const statuses = Array.from(new Set<string>([...ROOM_STATUSES, ...(initial ? [initial.status] : [])]));
  const errorCount = Object.keys(errors).length;
  const aria = (key: keyof Values) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `rf-${key}-error` : undefined });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitted && errorCount > 0 && <div className="form-error" role="alert">Please fix {errorCount} field{errorCount > 1 ? "s" : ""} highlighted below.</div>}
      <div className="form-grid">
        <Field id="rf-clinic_id" label="Clinic" required error={errors.clinic_id}>
          <select id="rf-clinic_id" value={values.clinic_id} onChange={set("clinic_id")} {...aria("clinic_id")}>
            <option value="">Select a clinic</option>
            {MOCK_CLINICS.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.clinic_name}</option>)}
          </select>
        </Field>
        <Field id="rf-room_number" label="Room number" required error={errors.room_number}>
          <input id="rf-room_number" value={values.room_number} onChange={set("room_number")} maxLength={20} placeholder="e.g. 101" {...aria("room_number")} />
        </Field>
        <Field id="rf-room_type" label="Room type" error={errors.room_type} hint="Pick a suggestion or type your own.">
          <input id="rf-room_type" list="room-type-options" value={values.room_type} onChange={set("room_type")} maxLength={50} {...aria("room_type")} />
          <datalist id="room-type-options">{ROOM_TYPES.map(t => <option key={t} value={t} />)}</datalist>
        </Field>
        <Field id="rf-capacity" label="Capacity" error={errors.capacity} hint="Leave blank if not tracked.">
          <input id="rf-capacity" type="number" min={1} step={1} inputMode="numeric" value={values.capacity} onChange={set("capacity")} {...aria("capacity")} />
        </Field>
        <Field id="rf-status" label="Status" required error={errors.status}>
          <select id="rf-status" value={values.status} onChange={set("status")} {...aria("status")}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn">{initial ? "Save room" : "Add room"}</button>
      </div>
    </form>
  );
}
