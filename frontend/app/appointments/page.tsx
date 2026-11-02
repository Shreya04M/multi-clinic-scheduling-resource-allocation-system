"use client";
import { useCallback, useEffect, useState } from "react";
import { DemoBanner, EmptyState, ErrorState, LoadingState, Modal, PageHeader, Toast } from "../components/ui";
import AppointmentForm, { type AppointmentRequest } from "../components/appointments/AppointmentForm";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import AppointmentTable from "../components/appointments/AppointmentTable";
import { API_URL, apiFetch } from "../lib/api";
import { MOCK_APPOINTMENTS } from "../lib/mock-appointments";
import { MOCK_PATIENTS } from "../lib/mock-patients";
import { MOCK_DOCTORS, MOCK_ROOMS, clinicName } from "../lib/mock-reference";
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
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState("");

  const loadLive = useCallback(() => {
    setSource("live");
    setLoading(true);
    setError("");
    apiFetch<AppointmentRecord[]>("/appointments")
      .then(rows => setAppointments([...rows].sort(byDateTime)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const showDemo = useCallback(() => {
    setSource("demo");
    setError("");
    setLoading(false);
    setAppointments([...MOCK_APPOINTMENTS].sort(byDateTime));
  }, []);

  useEffect(() => {
    // ?source=demo skips the API call (useful for reviews without a backend).
    if (new URLSearchParams(window.location.search).get("source") === "demo") showDemo();
    else loadLive();
  }, [loadLive, showDemo]);

  const submitBooking = async (request: AppointmentRequest, appointmentType: string | null) => {
    if (source === "live") {
      // Throws ApiError on 4xx/5xx; AppointmentForm shows the message (including 409 conflicts).
      const result = await apiFetch<{ appointment_id: number }>("/appointments", { method: "POST", body: JSON.stringify(request) });
      setBooking(false);
      setToast(`Appointment #${result.appointment_id} confirmed by the backend.`);
      loadLive();
      return;
    }
    // Demo mode: keep the request on this page only. No availability or conflict check is done.
    const patient = MOCK_PATIENTS.find(p => p.patient_id === request.patient_id);
    const doctor = MOCK_DOCTORS.find(d => d.doctor_id === request.doctor_id);
    const room = MOCK_ROOMS.find(r => r.room_id === request.room_id);
    const nextId = appointments.reduce((max, a) => Math.max(max, a.appointment_id), 800) + 1;
    const record: AppointmentRecord = {
      appointment_id: nextId,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${request.patient_id}`,
      doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : `Doctor ${request.doctor_id}`,
      clinic_name: clinicName(request.clinic_id),
      room_number: room?.room_number ?? null,
      appointment_date: request.appointment_date,
      start_time: request.start_time,
      end_time: request.end_time,
      appointment_type: appointmentType,
      status: "scheduled",
    };
    setAppointments(list => [...list, record].sort(byDateTime));
    setBooking(false);
    setToast(`Demo only: request #${nextId} was added on this page. It was not sent to the backend or saved, so it is NOT a confirmed appointment.`);
  };

  return (
    <main className="module">
      <PageHeader eyebrow="APPOINTMENT MANAGEMENT" title="Appointments" description="Review appointments across clinics and submit new booking requests." action={<button className="btn light" onClick={() => setBooking(true)} disabled={loading || Boolean(error)}>+ Book appointment</button>} />

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
          <ErrorState message={`Could not load appointments: ${error}`} onRetry={loadLive} extra={<button className="btn secondary" onClick={showDemo}>Use demo data</button>} />
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
      {booking && (
        <Modal title="Book appointment" onClose={() => setBooking(false)} wide>
          <AppointmentForm mode={source} onSubmit={submitBooking} onCancel={() => setBooking(false)} />
        </Modal>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </main>
  );
}
