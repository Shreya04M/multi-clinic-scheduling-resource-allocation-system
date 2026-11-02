"use client";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog, DemoBanner, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from "../components/ui";
import PatientTable from "../components/patients/PatientTable";
import { loadMockPatients } from "../lib/mock-patients";
import type { Patient } from "../lib/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [toast, setToast] = useState("");

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

        {loading ? (
          <LoadingState label="Loading patients…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : patients.length === 0 ? (
          <EmptyState title="No patients yet" message="There are no patient records to show." />
        ) : (
          <PatientTable patients={patients} onDelete={setToDelete} />
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
