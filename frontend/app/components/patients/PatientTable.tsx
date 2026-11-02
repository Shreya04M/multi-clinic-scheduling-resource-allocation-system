"use client";
import type { Patient } from "../../lib/types";
import { display, formatDate } from "../../lib/format";

interface Props {
  patients: Patient[];
  onView?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

export default function PatientTable({ patients, onView, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Full name</th>
            <th scope="col">Date of birth</th>
            <th scope="col">Gender</th>
            <th scope="col">Phone</th>
            <th scope="col">Email</th>
            <th scope="col">Address</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => {
            const name = `${p.first_name} ${p.last_name}`;
            return (
              <tr key={p.patient_id}>
                <td>{p.patient_id}</td>
                <td><strong>{name}</strong></td>
                <td>{formatDate(p.date_of_birth)}</td>
                <td>{display(p.gender)}</td>
                <td>{display(p.phone)}</td>
                <td>{display(p.email)}</td>
                <td>{display(p.address)}</td>
                <td>
                  <div className="row-actions">
                    {onView && <button className="btn secondary small" onClick={() => onView(p)} aria-label={`View ${name}`}>View</button>}
                    {onEdit && <button className="btn secondary small" onClick={() => onEdit(p)} aria-label={`Edit ${name}`}>Edit</button>}
                    <button className="btn danger small" onClick={() => onDelete(p)} aria-label={`Delete ${name}`}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
