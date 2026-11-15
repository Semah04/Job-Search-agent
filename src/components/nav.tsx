import Link from "next/link";

const links = [
  { href: "/", label: "Agent" },
  { href: "/profile", label: "Profile" },
  { href: "/jobs", label: "Jobs" },
  { href: "/tracker", label: "Tracker" },
];

export function Nav() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
          Job Search Agent
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-[var(--muted)] transition hover:bg-[var(--chip)] hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
