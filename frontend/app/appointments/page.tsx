"use client";
import { useCallback, useEffect, useState } from "react";
import { DemoBanner, EmptyState, ErrorState, LoadingState, Modal, PageHeader } from "../components/ui";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import AppointmentTable from "../components/appointments/AppointmentTable";
import { API_URL, apiFetch } from "../lib/api";
import { MOCK_APPOINTMENTS } from "../lib/mock-appointments";
import type { AppointmentRecord } from "../lib/types";

type Source = "live" | "demo";

const byDateTime = (a: AppointmentRecord, b: AppointmentRecord) =>
  `${a.appointment_date} ${a.start_time}`.localeCompare(`${b.appointment_date} ${b.start_time}`);

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [source, setSource] = useState<Source>("live");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<AppointmentRecord | null>(null);

  const loadLive = useCallback(() => {
    setSource("live");
    setLoading(true);
    setError("");
    apiFetch<AppointmentRecord[]>("/appointments")
      .then(rows => setAppointments([...rows].sort(byDateTime)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const useDemo = useCallback(() => {
    setSource("demo");
    setError("");
    setLoading(false);
    setAppointments([...MOCK_APPOINTMENTS].sort(byDateTime));
  }, []);

  useEffect(() => {
    // ?source=demo skips the API call (useful for reviews without a backend).
    if (new URLSearchParams(window.location.search).get("source") === "demo") useDemo();
    else loadLive();
  }, [loadLive, useDemo]);

  return (
    <main className="module">
      <PageHeader eyebrow="APPOINTMENT MANAGEMENT" title="Appointments" description="Review appointments across clinics and open any record for details." />

      {source === "live" && !loading && !error && (
        <div className="notice live" role="note"><strong>Live data:</strong> loaded from GET {API_URL}/appointments.</div>
      )}
      {source === "demo" && (
        <DemoBanner>
          These appointments are local sample data (seed.sql plus a few extra rows), not records from MySQL.{" "}
          <button className="btn ghost small" onClick={loadLive}>Try the live API again</button>
        </DemoBanner>
      )}

      <section className="card" aria-labelledby="appointment-list-title">
        <div className="card-head">
          <h2 id="appointment-list-title">Appointment list</h2>
        </div>

        {loading ? (
          <LoadingState label="Loading appointments…" />
        ) : error ? (
          <ErrorState message={`Could not load appointments: ${error}`} onRetry={loadLive} extra={<button className="btn secondary" onClick={useDemo}>Use demo data</button>} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments" message="There are no appointments to show yet." />
        ) : (
          <AppointmentTable appointments={appointments} onView={setViewing} />
        )}
      </section>

      {viewing && (
        <Modal title={`Appointment #${viewing.appointment_id}`} onClose={() => setViewing(null)}>
          <AppointmentDetails appointment={viewing} />
        </Modal>
      )}
    </main>
  );
}
