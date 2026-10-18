import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Activity, ArrowRight, ChevronDown, HeartPulse, Menu, Shield, X } from "lucide-react";

const tools = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/disease-map", label: "Disease map" },
  { to: "/alerts", label: "Alerts" },
  { to: "/what-if", label: "What-if analysis" },
  { to: "/reporter", label: "Reporter" },
  { to: "/predictive", label: "Predictive analytics" },
  { to: "/compare", label: "Compare" },
];

const itemClass = ({ isActive }: { isActive: boolean }) => `inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`;

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const allToolLinks = tools.map(({ to, label }) => <NavLink key={to} to={to} end className={itemClass} aria-current={location.pathname === to ? "page" : undefined}>{label}</NavLink>);

  return <>
    <a href="#main-content" className="sr-only fixed left-3 top-3 z-[70] rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 shadow-lg focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-teal-500">Skip to main content</a>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/88">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-5 lg:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary"><Activity className="h-5 w-5" /></span>
          <span className="font-semibold tracking-tight">Epidem<span className="text-primary">AI</span></span>
        </Link>

        <nav aria-label="Main navigation" className="ml-auto hidden min-w-0 items-center gap-0.5 xl:flex">
          <NavLink to="/" end className={itemClass} aria-current={location.pathname === "/" ? "page" : undefined}>Portals</NavLink>
          {allToolLinks}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex xl:ml-2">
          <details className="group relative xl:hidden">
            <summary className="inline-flex min-h-11 list-none items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Tools <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
            <div className="absolute right-0 top-full mt-2 grid min-w-56 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">{allToolLinks}</div>
          </details>
          <NavLink to="/gov-portal" className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/40 hover:bg-secondary"}`}><Shield className="h-4 w-4" /><span className="hidden 2xl:inline">Government Portal</span><span className="2xl:hidden">Government</span></NavLink>
          <NavLink to="/health-portal" className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary/15 text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}><HeartPulse className="h-4 w-4" /><span className="hidden 2xl:inline">Individual Health</span><span className="2xl:hidden">Individual</span></NavLink>
        </div>

        <button type="button" className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && <nav id="mobile-navigation" aria-label="Main navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background px-4 py-4 md:hidden">
        <div className="mx-auto grid max-w-xl gap-1">
          <NavLink to="/" end className={itemClass} aria-current={location.pathname === "/" ? "page" : undefined}>Portal home<ArrowRight className="ml-auto h-4 w-4" /></NavLink>
          <Link to="/gov-portal" className="mb-2 inline-flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 text-sm font-semibold text-foreground"><Shield className="h-4 w-4 text-primary" />Government Portal</Link>
          <Link to="/health-portal" className="mb-2 inline-flex min-h-12 items-center gap-3 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"><HeartPulse className="h-4 w-4" />Individual Health Portal</Link>
          <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Public health tools</p>
          {tools.map(({ to, label }) => <NavLink key={to} to={to} className={itemClass}>{label}<ArrowRight className="ml-auto h-4 w-4" /></NavLink>)}
        </div>
      </nav>}
    </header>
  </>;
}
