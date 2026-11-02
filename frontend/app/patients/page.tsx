"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, DemoBanner, Field, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from "../components/ui";
import PatientTable from "../components/patients/PatientTable";
import { loadMockPatients } from "../lib/mock-patients";
import { GENDER_OPTIONS, type Patient } from "../lib/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");

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

  const confirmDelete = () => {
    if (!toDelete) return;
    setPatients(list => list.filter(p => p.patient_id !== toDelete.patient_id));
    setToast(`Demo only: ${toDelete.first_name} ${toDelete.last_name} was removed from this page, not from MySQL.`);
    setToDelete(null);
  };

  return (
    <main className="module">
      <PageHeader eyebrow="PATIENT MANAGEMENT" title="Patients" description="View, search and maintain patient records across clinics." />
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
          <EmptyState title="No patients yet" message="There are no patient records to show." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching patients" message="No patients match the current search or gender filter." action={<button className="btn secondary" onClick={clearFilters}>Clear filters</button>} />
        ) : (
          <>
            <PatientTable patients={filtered} onDelete={setToDelete} />
            <p className="result-count">Showing {filtered.length} of {patients.length} patients</p>
          </>
        )}
      </section>

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
