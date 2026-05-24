import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { to: "/", label: "Portal" },
  { to: "/disease-map", label: "Map" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/alerts", label: "Alerts" },
  { to: "/what-if", label: "What-If" },
  { to: "/reporter", label: "Reporter" },
  { to: "/predictive", label: "Predictive" },
  { to: "/compare", label: "Compare" },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-wider text-foreground">
            Epidem<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/gov-portal"
            className={`ml-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              location.pathname === "/gov-portal"
                ? "bg-primary text-primary-foreground"
                : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            Gov
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden hover:bg-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <Link
                to="/gov-portal"
                onClick={() => setMobileOpen(false)}
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                Gov Portal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
