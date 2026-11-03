"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, Field, ErrorState, LoadingState, Modal, PageHeader, Toast } from "../components/ui";
import AppointmentForm, { type AppointmentRequest } from "../components/appointments/AppointmentForm";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import AppointmentTable from "../components/appointments/AppointmentTable";
import { API_URL, apiFetch } from "../lib/api";
import { APPOINTMENT_STATUSES, type AppointmentRecord } from "../lib/types";
import { useRequireAuth } from "../lib/auth";

const byDateTime = (a: AppointmentRecord, b: AppointmentRecord) =>
  `${a.appointment_date} ${a.start_time}`.localeCompare(`${b.appointment_date} ${b.start_time}`);

export default function AppointmentsPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
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
    setLoading(true);
    setError("");
    apiFetch<AppointmentRecord[]>("/appointments")
      .then(rows => setAppointments([...rows].sort(byDateTime)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) loadLive();
  }, [loadLive, user]);

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
    const result = await apiFetch<{ appointment_id: number }>("/appointments", {
      method: "POST",
      body: JSON.stringify({ ...request, appointment_type: appointmentType }),
    });
    setBooking(false);
    setToast(`Appointment #${result.appointment_id} confirmed by the backend.`);
    loadLive();
  };

  const updateStatus = async (status: string) => {
    if (!viewing) return;
    const result = await apiFetch<{ appointment_id: number; status: string }>(
      `/appointments/${viewing.appointment_id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
    const updated = { ...viewing, status: result.status };
    setViewing(updated);
    setToast(`Appointment #${result.appointment_id} marked ${result.status}.`);
    loadLive();
  };

  if (authLoading || !user) return <main className="module"><LoadingState label="Checking your session…" /></main>;

  return (
    <main className="module">
      <PageHeader eyebrow="APPOINTMENT MANAGEMENT" title="Appointments" description="Review appointments across clinics and submit new booking requests." action={<button className="btn light" onClick={() => setBooking(true)} disabled={loading || Boolean(error)}>+ Book appointment</button>} />

      {!loading && !error && (
        <div className="notice live" role="note"><strong>Live data:</strong> loaded from GET {API_URL}/appointments.</div>
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
          <ErrorState message={`Could not load appointments: ${error}`} onRetry={loadLive} />
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
          <AppointmentDetails appointment={viewing} onStatusChange={updateStatus} />
        </Modal>
      )}
      {booking && (
        <Modal title="Book appointment" onClose={() => setBooking(false)} wide>
          <AppointmentForm mode="live" onSubmit={submitBooking} onCancel={() => setBooking(false)} />
        </Modal>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </main>
  );
}
