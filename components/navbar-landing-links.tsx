const LANDING_NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#pricing", label: "Pricing" },
] as const;

export default function NavbarLandingLinks() {
  return (
    <nav
      aria-label="Landing page sections"
      className="hidden lg:flex items-center gap-6"
    >
      {LANDING_NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="group relative py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <span className="after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent/80 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100">
            {link.label}
          </span>
        </a>
      ))}
    </nav>
  );
}
