"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, router, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="module">
      <section className="card auth-card">
        <span className="eyebrow">MULTI-CLINIC OPERATIONS</span>
        <h1>Sign in</h1>
        <p>Use your clinic account to access scheduling and patient data.</p>
        {error && <div className="error" role="alert">{error}</div>}
        <form onSubmit={submit} className="form-grid">
          <label className="field">Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="field">Password<input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></label>
          <button className="btn" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}
