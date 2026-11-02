"use client";
import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "./lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Record<string, number>>("/dashboard")
      .then(setStats)
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <main>
      <header>
        <span className="eyebrow">MULTI-CLINIC OPERATIONS</span>
        <h1>Scheduling command center</h1>
        <p>Coordinate clinicians, rooms, equipment, and patient care without resource conflicts.</p>
      </header>
      {error && <div className="error" role="alert">{error}</div>}
      <section className="grid">
        {stats ? Object.entries(stats).map(([key, value]) => (
          <article key={key}><span>{key}</span><strong>{value}</strong></article>
        )) : !error && <article>Loading dashboard...</article>}
      </section>
      <section className="panel">
        <h2>Workflow</h2>
        <p>Use the FastAPI documentation at <a href={`${API_URL}/docs`}>{API_URL}/docs</a> for appointment, patient, clinical-note, and search APIs.</p>
      </section>
    </main>
  );
}
