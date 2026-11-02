"use client";
import type { Patient } from "../../lib/types";
import { display, formatDate } from "../../lib/format";

function age(dob: string): number | null {
  const [y, m, d] = dob.split("-").map(Number);
  if (!y) return null;
  const now = new Date();
  let years = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) years -= 1;
  return years >= 0 ? years : null;
}

export default function PatientDetails({ patient, onEdit }: { patient: Patient; onEdit: () => void }) {
  const years = age(patient.date_of_birth);
  return (
    <>
      <dl className="details">
        <div><dt>Patient ID</dt><dd>{patient.patient_id}</dd></div>
        <div><dt>Full name</dt><dd>{patient.first_name} {patient.last_name}</dd></div>
        <div><dt>Date of birth</dt><dd>{formatDate(patient.date_of_birth)}{years !== null && ` (${years} yrs)`}</dd></div>
        <div><dt>Gender</dt><dd>{display(patient.gender)}</dd></div>
        <div><dt>Phone</dt><dd>{display(patient.phone)}</dd></div>
        <div><dt>Email</dt><dd>{display(patient.email)}</dd></div>
        <div style={{ gridColumn: "1 / -1" }}><dt>Address</dt><dd>{display(patient.address)}</dd></div>
      </dl>
      <div className="form-actions">
        <button className="btn" onClick={onEdit}>Edit patient</button>
      </div>
    </>
  );
}
