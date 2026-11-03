"use client";

import { FormEvent, useState } from "react";
import { ErrorState, LoadingState, PageHeader } from "../components/ui";
import { apiFetch } from "../lib/api";
import { useRequireAuth } from "../lib/auth";

type SearchResult = { note_id: number; text: string; distance: number };

export default function ClinicalSearchPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading || !user) return <main className="module"><LoadingState label="Checking your session…" /></main>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<{ results: SearchResult[] }>("/notes/search", {
        method: "POST",
        body: JSON.stringify({ query, top_k: 5 }),
      });
      setResults(response.results);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Search is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="module">
      <PageHeader eyebrow="CLINICAL KNOWLEDGE" title="Semantic search" description="Search only the clinical notes authorized for your clinic." />
      <section className="card">
        <form onSubmit={submit} className="toolbar">
          <div className="field grow"><label htmlFor="clinical-query">Search notes</label><input id="clinical-query" required value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. chest discomfort" /></div>
          <button className="btn" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
        </form>
        {error && <ErrorState message={error} />}
        {loading && <LoadingState label="Searching authorized notes…" />}
        {!loading && !error && results.length === 0 && query && <p className="state">No authorized notes matched this query.</p>}
        {!loading && results.map(result => (
          <article className="panel" key={result.note_id}><strong>Note #{result.note_id}</strong><p>{result.text}</p><small>Distance: {result.distance.toFixed(3)}</small></article>
        ))}
      </section>
    </main>
  );
}
