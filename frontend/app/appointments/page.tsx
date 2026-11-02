"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DemoBanner, EmptyState, Field, ErrorState, LoadingState, Modal, PageHeader, Toast } from "../components/ui";
import AppointmentForm, { type AppointmentRequest } from "../components/appointments/AppointmentForm";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import AppointmentTable from "../components/appointments/AppointmentTable";
import { API_URL, apiFetch } from "../lib/api";
import { MOCK_APPOINTMENTS } from "../lib/mock-appointments";
import { MOCK_PATIENTS } from "../lib/mock-patients";
import { MOCK_DOCTORS, MOCK_ROOMS, clinicName } from "../lib/mock-reference";
import { APPOINTMENT_STATUSES, type AppointmentRecord } from "../lib/types";

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
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [clinicFilter, setClinicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  // Filter options come from the loaded records, so they work for live and demo data alike.
  const doctorOptions = useMemo(() => Array.from(new Set(appointments.map(a => a.doctor_name))).sort(), [appointments]);
  const clinicOptions = useMemo(() => Array.from(new Set(appointments.map(a => a.clinic_name))).sort(), [appointments]);
  const statusOptions = useMemo(() => {
    const extra = appointments.map(a => a.status.toLowerCase()).filter(s => !(APPOINTMENT_STATUSES as readonly string[]).includes(s));
    return [...APPOINTMENT_STATUSES, ...Array.from(new Set(extra))];
  }, [appointments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^#/, "");
    return appointments.filter(a =>
      (!term || String(a.appointment_id).includes(term) || a.patient_name.toLowerCase().includes(term)) &&
      (!dateFilter || a.appointment_date.slice(0, 10) === dateFilter) &&
      (!doctorFilter || a.doctor_name === doctorFilter) &&
      (!clinicFilter || a.clinic_name === clinicFilter) &&
      (!statusFilter || a.status.toLowerCase() === statusFilter),
    );
  }, [appointments, search, dateFilter, doctorFilter, clinicFilter, statusFilter]);

  const filtersActive = Boolean(search.trim() || dateFilter || doctorFilter || clinicFilter || statusFilter);
  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setDoctorFilter("");
    setClinicFilter("");
    setStatusFilter("");
  };

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

        <div className="toolbar" role="search">
          <div className="field grow">
            <label htmlFor="appt-search">Search by appointment ID or patient name</label>
            <input id="appt-search" type="search" placeholder="e.g. 804 or Kavya" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Field id="appt-date" label="Date">
            <input id="appt-date" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          </Field>
          <Field id="appt-doctor" label="Doctor">
            <select id="appt-doctor" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}>
              <option value="">All doctors</option>
              {doctorOptions.map(d => <option key={d} value={d}>Dr. {d}</option>)}
            </select>
          </Field>
          <Field id="appt-clinic" label="Clinic">
            <select id="appt-clinic" value={clinicFilter} onChange={e => setClinicFilter(e.target.value)}>
              <option value="">All clinics</option>
              {clinicOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field id="appt-status" label="Status">
            <select id="appt-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Field>
          <button className="btn secondary" onClick={clearFilters} disabled={!filtersActive}>Clear filters</button>
        </div>

        {loading ? (
          <LoadingState label="Loading appointments…" />
        ) : error ? (
          <ErrorState message={`Could not load appointments: ${error}`} onRetry={loadLive} extra={<button className="btn secondary" onClick={showDemo}>Use demo data</button>} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments" message="There are no appointments to show yet." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching appointments" message="No appointments match the current search or filters." action={<button className="btn secondary" onClick={clearFilters}>Clear filters</button>} />
        ) : (
          <>
            <AppointmentTable appointments={filtered} onView={setViewing} />
            <p className="result-count">Showing {filtered.length} of {appointments.length} appointments</p>
          </>
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
