"use client";
import { useState, type FormEvent } from "react";
import { Field } from "../ui";
import { todayISO } from "../../lib/format";
import { GENDER_OPTIONS, type Patient, type PatientInput } from "../../lib/types";

type Values = Record<keyof PatientInput, string>;
type Errors = Partial<Record<keyof PatientInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]*$/;

/** Client-side checks only. The backend remains the authority on validity. */
export function validatePatient(v: Values): Errors {
  const errors: Errors = {};
  if (!v.first_name.trim()) errors.first_name = "First name is required.";
  else if (v.first_name.trim().length > 50) errors.first_name = "First name must be 50 characters or fewer.";
  if (!v.last_name.trim()) errors.last_name = "Last name is required.";
  else if (v.last_name.trim().length > 50) errors.last_name = "Last name must be 50 characters or fewer.";

  if (!v.date_of_birth) errors.date_of_birth = "Date of birth is required.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date_of_birth) || Number.isNaN(Date.parse(v.date_of_birth))) errors.date_of_birth = "Enter a valid date of birth.";
  else if (v.date_of_birth > todayISO()) errors.date_of_birth = "Date of birth cannot be in the future.";
  else if (v.date_of_birth < "1900-01-01") errors.date_of_birth = "Date of birth must be after 1900.";

  const phone = v.phone.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "").length;
    if (!PHONE_RE.test(phone) || digits < 7 || digits > 15) errors.phone = "Phone must contain 7–15 digits (spaces, dashes and a leading + are allowed).";
    else if (phone.length > 20) errors.phone = "Phone must be 20 characters or fewer.";
  }
  const email = v.email.trim();
  if (email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email address, e.g. name@example.com.";
  else if (email.length > 150) errors.email = "Email must be 150 characters or fewer.";
  if (v.address.trim().length > 255) errors.address = "Address must be 255 characters or fewer.";
  return errors;
}

function toValues(p?: Patient): Values {
  return {
    first_name: p?.first_name ?? "",
    last_name: p?.last_name ?? "",
    date_of_birth: p?.date_of_birth ?? "",
    gender: p?.gender ?? "",
    phone: p?.phone ?? "",
    email: p?.email ?? "",
    address: p?.address ?? "",
  };
}

const orNull = (s: string) => (s.trim() === "" ? null : s.trim());

interface Props {
  initial?: Patient;
  onSubmit: (input: PatientInput) => Promise<void>;
  onCancel: () => void;
}

export default function PatientForm({ initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (submitted) setErrors(validatePatient(next));
  };

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validatePatient(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    setServerError("");
    try {
      await onSubmit({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        date_of_birth: values.date_of_birth,
        gender: orNull(values.gender),
        phone: orNull(values.phone),
        email: orNull(values.email),
        address: orNull(values.address),
      });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const aria = (key: keyof Values) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `pf-${key}-error` : undefined });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <div className="form-error" role="alert">{serverError}</div>}
      {submitted && errorCount > 0 && <div className="form-error" role="alert">Please fix {errorCount} field{errorCount > 1 ? "s" : ""} highlighted below.</div>}
      <div className="form-grid">
        <Field id="pf-first_name" label="First name" required error={errors.first_name}>
          <input id="pf-first_name" value={values.first_name} onChange={set("first_name")} maxLength={50} autoComplete="given-name" {...aria("first_name")} />
        </Field>
        <Field id="pf-last_name" label="Last name" required error={errors.last_name}>
          <input id="pf-last_name" value={values.last_name} onChange={set("last_name")} maxLength={50} autoComplete="family-name" {...aria("last_name")} />
        </Field>
        <Field id="pf-date_of_birth" label="Date of birth" required error={errors.date_of_birth}>
          <input id="pf-date_of_birth" type="date" value={values.date_of_birth} max={todayISO()} onChange={set("date_of_birth")} {...aria("date_of_birth")} />
        </Field>
        <Field id="pf-gender" label="Gender" error={errors.gender}>
          <select id="pf-gender" value={values.gender} onChange={set("gender")}>
            <option value="">Not specified</option>
            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field id="pf-phone" label="Phone" error={errors.phone} hint="7–15 digits, e.g. 9876501001">
          <input id="pf-phone" type="tel" value={values.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" {...aria("phone")} />
        </Field>
        <Field id="pf-email" label="Email" error={errors.email}>
          <input id="pf-email" type="email" value={values.email} onChange={set("email")} maxLength={150} autoComplete="email" {...aria("email")} />
        </Field>
        <div className="span-2">
          <Field id="pf-address" label="Address" error={errors.address} hint={`${values.address.length}/255 characters`}>
            <textarea id="pf-address" rows={2} value={values.address} onChange={set("address")} maxLength={255} autoComplete="street-address" {...aria("address")} />
          </Field>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn" disabled={submitting}>{submitting ? "Saving…" : initial ? "Save changes" : "Add patient"}</button>
      </div>
    </form>
  );
}
