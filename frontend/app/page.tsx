"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { const token = localStorage.getItem("token"); fetch(`${API}/dashboard`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }).then(setStats).catch(e => setError(e.message)); }, []);
  return <main><header><span className="eyebrow">MULTI-CLINIC OPERATIONS</span><h1>Scheduling command center</h1><p>Coordinate clinicians, rooms, equipment, and patient care without resource conflicts.</p></header>{error && <div className="error">{error}</div>}<section className="grid">{stats ? Object.entries(stats).map(([key,value]) => <article key={key}><span>{key}</span><strong>{value}</strong></article>) : <article>Loading dashboard...</article>}</section><section className="panel"><h2>Workflow</h2><p>Use the FastAPI documentation at <a href={`${API}/docs`}>{API}/docs</a> for appointment, clinical-note, and search APIs.</p></section></main>;
}
