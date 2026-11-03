/** Formats a YYYY-MM-DD string without timezone shifting, e.g. "14 May 2002". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Formats HH:MM[:SS] strings or seconds since midnight as 12-hour time. */
export function formatTime(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";

  let hours: number;
  let minutes: number;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value >= 86400) return "—";
    hours = Math.floor(value / 3600);
    minutes = Math.floor((value % 3600) / 60);
  } else {
    const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return value;

    hours = Number(match[1]);
    minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return value;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Today's date as YYYY-MM-DD in the browser's local timezone. */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}
