"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/appointments", label: "Appointments" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="topnav" aria-label="Main navigation">
      <div className="topnav-inner">
        <Link href="/" className="brand">Multi-Clinic</Link>
        <ul>
          {LINKS.map(link => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>{link.label}</Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
