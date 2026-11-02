"use client";
import { useState, type FormEvent } from "react";
import { Field } from "../ui";
import { MOCK_CLINICS } from "../../lib/mock-reference";
import { EQUIPMENT_STATUSES, EQUIPMENT_TYPES, type Equipment, type EquipmentInput } from "../../lib/types";

interface Values { clinic_id: string; equipment_name: string; equipment_type: string; status: string }
type Errors = Partial<Record<keyof Values, string>>;

export function validateEquipment(v: Values): Errors {
  const e: Errors = {};
  if (!v.clinic_id) e.clinic_id = "Select the clinic this equipment belongs to.";
  if (!v.equipment_name.trim()) e.equipment_name = "Equipment name is required.";
  else if (v.equipment_name.trim().length > 150) e.equipment_name = "Equipment name must be 150 characters or fewer.";
  if (v.equipment_type.trim().length > 100) e.equipment_type = "Equipment type must be 100 characters or fewer.";
  if (!v.status) e.status = "Select an operational status.";
  return e;
}

interface Props { initial?: Equipment; onSubmit: (input: EquipmentInput) => void; onCancel: () => void }

export default function EquipmentForm({ initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Values>({
    clinic_id: initial ? String(initial.clinic_id) : "",
    equipment_name: initial?.equipment_name ?? "",
    equipment_type: initial?.equipment_type ?? "",
    status: initial?.status ?? "operational",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (submitted) setErrors(validateEquipment(next));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateEquipment(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({
      clinic_id: Number(values.clinic_id),
      equipment_name: values.equipment_name.trim(),
      equipment_type: values.equipment_type.trim() || null,
      status: values.status,
    });
  };

  const statuses = Array.from(new Set<string>([...EQUIPMENT_STATUSES, ...(initial ? [initial.status] : [])]));
  const errorCount = Object.keys(errors).length;
  const aria = (key: keyof Values) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `ef-${key}-error` : undefined });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitted && errorCount > 0 && <div className="form-error" role="alert">Please fix {errorCount} field{errorCount > 1 ? "s" : ""} highlighted below.</div>}
      <div className="form-grid">
        <Field id="ef-clinic_id" label="Clinic" required error={errors.clinic_id}>
          <select id="ef-clinic_id" value={values.clinic_id} onChange={set("clinic_id")} {...aria("clinic_id")}>
            <option value="">Select a clinic</option>
            {MOCK_CLINICS.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.clinic_name}</option>)}
          </select>
        </Field>
        <Field id="ef-equipment_name" label="Equipment name" required error={errors.equipment_name}>
          <input id="ef-equipment_name" value={values.equipment_name} onChange={set("equipment_name")} maxLength={150} placeholder="e.g. ECG Machine" {...aria("equipment_name")} />
        </Field>
        <Field id="ef-equipment_type" label="Equipment type" error={errors.equipment_type} hint="Pick a suggestion or type your own.">
          <input id="ef-equipment_type" list="equipment-type-options" value={values.equipment_type} onChange={set("equipment_type")} maxLength={100} {...aria("equipment_type")} />
          <datalist id="equipment-type-options">{EQUIPMENT_TYPES.map(t => <option key={t} value={t} />)}</datalist>
        </Field>
        <Field id="ef-status" label="Operational status" required error={errors.status}>
          <select id="ef-status" value={values.status} onChange={set("status")} {...aria("status")}>
            {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn">{initial ? "Save equipment" : "Add equipment"}</button>
      </div>
    </form>
  );
}
