import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useAlerts } from "@/hooks/useApi";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, Info, ChevronRight } from "lucide-react";
import DemonstrationNotice from "@/components/DemonstrationNotice";

const severityConfig = {
  high: { icon: ShieldAlert, badgeClass: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "bg-destructive", label: "WARNING" },
  moderate: { icon: AlertTriangle, badgeClass: "bg-warning/10 text-warning border-warning/20", dotClass: "bg-warning", label: "WARNING" },
  low: { icon: Info, badgeClass: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary", label: "INFO" },
};

export default function Alerts() {
  const { data: alertsData = [], isError, isLoading, refetch } = useAlerts();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeAlerts = alertsData.filter(a => !dismissed.has(a.id));
  const selectedAlert = activeAlerts.find((alert) => alert.id === selectedAlertId) ?? activeAlerts[0] ?? null;
  useEffect(() => { if (selectedAlert && selectedAlert.id !== selectedAlertId) setSelectedAlertId(selectedAlert.id); }, [selectedAlert, selectedAlertId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider">EpidemAI Alert System</h1>
            <p className="text-sm text-muted-foreground">Review example signal records and how this interface presents them.</p>
          </div>
          <RealTimeIndicator />
        </div>

        <DemonstrationNotice className="mb-6" />
        {isError && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">Alert examples could not be loaded.<button type="button" onClick={() => void refetch()} className="min-h-10 rounded-lg border px-3 font-semibold">Retry</button></div>}
        {isLoading && <p role="status" className="mb-4 text-sm text-muted-foreground">Loading example records…</p>}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Alert List */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Example signal records</h3>
              <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{activeAlerts.length} examples</span>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {activeAlerts.map((a, i) => {
                  const cfg = severityConfig[a.severity];
                  const initials = a.location.split(",")[0].split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const isSelected = selectedAlert?.id === a.id;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: i * 0.04 }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedAlertId(a.id); } }}
                      onClick={() => setSelectedAlertId(a.id)}
                      className={`cursor-pointer rounded-lg border bg-card p-4 transition-colors ${isSelected ? "border-primary/40 ring-1 ring-primary/20" : "border-border hover:border-primary/20"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.badgeClass} border text-xs font-bold`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold">{a.location}</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${cfg.badgeClass}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {a.title} · {a.time}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{a.region}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(a.id)); }}
                          className="min-h-10 shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Hide from this view
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Alert Analysis Panel */}
          <div className="lg:col-span-2">
            {selectedAlert && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sticky top-24 space-y-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Example record details</h3>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold">{selectedAlert.location}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{selectedAlert.description}</p>
                  </div>

                  {/* Dominant Signal */}
                  <div className="mb-4">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bundled signal split · illustrative</span>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>News Sources</span>
                        <span className="font-mono">{selectedAlert.signalSource.news}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${selectedAlert.signalSource.news}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Social Media</span>
                        <span className="font-mono">{selectedAlert.signalSource.social}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-warning/60" style={{ width: `${selectedAlert.signalSource.social}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Illustrative score · demo */}
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Illustrative score · demo</span>
                    <span className="font-display text-lg font-bold text-primary">{selectedAlert.confidence}%</span>
                  </div>

                  {/* Example review prompts · not official advice */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Example review prompts · not official advice</span>
                    <div className="mt-2 space-y-1.5">
                      {selectedAlert.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                          <p className="text-xs text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        {!activeAlerts.length && <p className="mt-5 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No example records are visible. Reload the page to restore the bundled examples.</p>}
      </main>
    </div>
  );
}
