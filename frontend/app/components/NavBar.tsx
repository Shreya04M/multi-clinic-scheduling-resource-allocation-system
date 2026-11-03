"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/appointments", label: "Appointments" },
  { href: "/search", label: "Clinical search" },
  { href: "/resources", label: "Rooms & equipment" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  if (pathname === "/login") return null;
  if (loading) return null;
  return (
    <nav className="topnav" aria-label="Main navigation">
      <div className="topnav-inner">
        <Link href="/" className="brand">Multi-Clinic</Link>
        {user && <ul>
          {LINKS.map(link => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>{link.label}</Link>
              </li>
            );
          })}
        </ul>}
        {user ? <button className="btn ghost small" onClick={logout}>Sign out</button> : <Link href="/login" className="btn ghost small">Sign in</Link>}
      </div>
    </nav>
  );
}
