"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, DemoBanner, EmptyState, ErrorState, Field, LoadingState, Modal, PageHeader, Toast } from "../components/ui";
import PatientDetails from "../components/patients/PatientDetails";
import PatientForm from "../components/patients/PatientForm";
import PatientTable from "../components/patients/PatientTable";
import { loadMockPatients } from "../lib/mock-patients";
import { GENDER_OPTIONS, type Patient, type PatientInput } from "../lib/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [viewing, setViewing] = useState<Patient | null>(null);
  // "new" opens an empty Add form; a Patient opens the Edit form with its values.
  const [editing, setEditing] = useState<Patient | "new" | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    // Append ?simulate=error to the URL to preview the error state.
    const simulateError = new URLSearchParams(window.location.search).get("simulate") === "error";
    loadMockPatients(simulateError)
      .then(setPatients)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return patients.filter(p => {
      const matchesSearch = !term || String(p.patient_id).includes(term) || `${p.first_name} ${p.last_name}`.toLowerCase().includes(term);
      const matchesGender = !gender || (p.gender ?? "") === gender;
      return matchesSearch && matchesGender;
    });
  }, [patients, search, gender]);

  const filtersActive = search.trim() !== "" || gender !== "";
  const clearFilters = () => {
    setSearch("");
    setGender("");
  };

  const savePatient = (input: PatientInput) => {
    if (editing === "new") {
      // PATIENT.patient_id is not AUTO_INCREMENT; a real API would assign/validate it.
      const nextId = patients.reduce((max, p) => Math.max(max, p.patient_id), 300) + 1;
      setPatients(list => [...list, { patient_id: nextId, ...input }]);
      setToast(`Demo only: ${input.first_name} ${input.last_name} was added on this page (ID ${nextId}) and not saved to MySQL.`);
    } else if (editing) {
      const updated = { ...editing, ...input };
      setPatients(list => list.map(p => (p.patient_id === updated.patient_id ? updated : p)));
      setToast(`Demo only: changes to ${updated.first_name} ${updated.last_name} were applied on this page, not saved to MySQL.`);
    }
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setPatients(list => list.filter(p => p.patient_id !== toDelete.patient_id));
    setToast(`Demo only: ${toDelete.first_name} ${toDelete.last_name} was removed from this page, not from MySQL.`);
    setToDelete(null);
  };

  return (
    <main className="module">
      <PageHeader eyebrow="PATIENT MANAGEMENT" title="Patients" description="View, search and maintain patient records across clinics." action={<button className="btn light" onClick={() => setEditing("new")}>+ Add patient</button>} />
      <DemoBanner>No patient API endpoint exists yet. Records come from local sample data matching database/seed.sql, and changes last only until the page is reloaded.</DemoBanner>

      <section className="card" aria-labelledby="patient-list-title">
        <div className="card-head">
          <h2 id="patient-list-title">Patient records</h2>
        </div>

        <div className="toolbar" role="search">
          <div className="field grow"><label htmlFor="patient-search">Search by name or patient ID</label>
            <input id="patient-search" type="search" placeholder="e.g. Kavya or 301" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Field id="patient-gender" label="Gender">
            <select id="patient-gender" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">All genders</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <button className="btn secondary" onClick={clearFilters} disabled={!filtersActive}>Clear filters</button>
        </div>

        {loading ? (
          <LoadingState label="Loading patients…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : patients.length === 0 ? (
          <EmptyState title="No patients yet" message="There are no patient records to show." action={<button className="btn" onClick={() => setEditing("new")}>Add the first patient</button>} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching patients" message="No patients match the current search or gender filter." action={<button className="btn secondary" onClick={clearFilters}>Clear filters</button>} />
        ) : (
          <>
            <PatientTable patients={filtered} onView={setViewing} onEdit={setEditing} onDelete={setToDelete} />
            <p className="result-count">Showing {filtered.length} of {patients.length} patients</p>
          </>
        )}
      </section>

      {viewing && (
        <Modal title="Patient details" onClose={() => setViewing(null)}>
          <PatientDetails patient={viewing} onEdit={() => { setEditing(viewing); setViewing(null); }} />
        </Modal>
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add patient" : `Edit patient #${editing.patient_id}`} onClose={() => setEditing(null)} wide>
          <PatientForm initial={editing === "new" ? undefined : editing} onSubmit={savePatient} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete patient?"
          message={<>Delete <strong>{toDelete.first_name} {toDelete.last_name}</strong> (ID {toDelete.patient_id})? This is a demo action and only removes the record from this page.</>}
          confirmLabel="Delete patient"
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </main>
  );
}
