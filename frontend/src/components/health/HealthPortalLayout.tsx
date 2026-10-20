import { Activity, ArrowRight, Bot, HeartPulse, Home, Landmark, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const links = [
  { to: "/health-portal", label: "Home", icon: Home, end: true },
  { to: "/ai-assistant", label: "AI Assistance", icon: Bot },
  { to: "/health-assistant", label: "Report symptoms", icon: HeartPulse },
  { to: "/health-schemes", label: "Schemes & care", icon: Landmark },
  { to: "/health-profile", label: "My profile", icon: UserRound },
];

export function HealthPortalLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname]);
  return <div className="health-portal-theme min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/88">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/health-portal" className="flex items-center gap-2 shrink-0 font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary"><Activity className="h-5 w-5" /></span>
          <span className="text-base font-bold tracking-tight">Epidem<span className="text-primary">AI</span></span>
        </Link>
        <nav aria-label="Individual health navigation" className="hidden items-center gap-1 lg:gap-1.5 md:flex shrink-0">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border border-primary/30 bg-primary/15 text-primary font-semibold shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            <Icon className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">{label}</span>
          </NavLink>)}
          <Link to="/" className="ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium whitespace-nowrap text-foreground hover:border-primary/40 hover:bg-secondary shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Platform <ArrowRight className="h-4 w-4 shrink-0" /></Link>
        </nav>
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="health-mobile-nav" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
    {menuOpen && <nav id="health-mobile-nav" aria-label="Individual health navigation" className="border-b border-border bg-card px-4 py-3 sm:hidden"><div className="mx-auto grid max-w-6xl gap-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `inline-flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? "border border-primary/30 bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</NavLink>)}<Link to="/" className="inline-flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><ArrowRight className="h-4 w-4" />Platform</Link></div></nav>}
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="mt-16 border-t border-border bg-card/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> General information only. This assistant does not diagnose or replace professional care.</p>
        <Link to="/health-assistant" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Report symptoms <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </footer>
  </div>;
}

export function HealthPortalCard({ icon: Icon, title, description, to, action }: { icon: typeof HeartPulse; title: string; description: string; to: string; action: string }) {
  return <Link to={to} className="group flex min-h-48 flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon className="h-6 w-6" /></span>
    <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
    <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">{action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
  </Link>;
}

