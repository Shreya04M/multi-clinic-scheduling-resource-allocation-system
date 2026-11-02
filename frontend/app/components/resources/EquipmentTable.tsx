"use client";
import { StatusBadge } from "../ui";
import { display } from "../../lib/format";
import { clinicName } from "../../lib/mock-reference";
import type { Equipment } from "../../lib/types";

export default function EquipmentTable({ equipment, onEdit }: { equipment: Equipment[]; onEdit: (item: Equipment) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Equipment ID</th>
            <th scope="col">Clinic</th>
            <th scope="col">Equipment name</th>
            <th scope="col">Equipment type</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(e => (
            <tr key={e.equipment_id}>
              <td>{e.equipment_id}</td>
              <td>{clinicName(e.clinic_id)}</td>
              <td><strong>{e.equipment_name}</strong></td>
              <td>{display(e.equipment_type)}</td>
              <td><StatusBadge status={e.status} /></td>
              <td><button className="btn secondary small" onClick={() => onEdit(e)} aria-label={`Edit ${e.equipment_name}`}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
