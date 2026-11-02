"use client";
// Small shared UI building blocks used by the Patient, Appointment and Resource modules.
import { useEffect, useRef, type ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="compact">
      <div className="page-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </div>
    </header>
  );
}

export function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="notice demo" role="note">
      <strong>Demo data:</strong> {children}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" /> {label}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="state empty">
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry, extra }: { message: string; onRetry?: () => void; extra?: ReactNode }) {
  return (
    <div className="state error-state" role="alert">
      <strong>Something went wrong</strong>
      <p>{message}</p>
      <div className="actions">
        {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
        {extra}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = (status ?? "unknown").toLowerCase();
  return <span className={`badge badge-${value.replace(/[^a-z]/g, "")}`}>{value.replace(/_/g, " ")}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-body">{message}</div>
      <div className="form-actions">
        <button className="btn secondary" onClick={onCancel}>Cancel</button>
        <button className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), 5000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
      <button className="btn ghost small" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}

/** Labelled form field with an inline validation message. */
export function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="req"> *</span> : <span className="optional"> (optional)</span>}
      </label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    </div>
  );
}
