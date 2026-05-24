import { useState } from "react";
import Navbar from "@/components/Navbar";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useAlerts } from "@/hooks/useApi";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, Info, X, ChevronRight } from "lucide-react";

const severityConfig = {
  high: { icon: ShieldAlert, badgeClass: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "bg-destructive", label: "WARNING" },
  moderate: { icon: AlertTriangle, badgeClass: "bg-warning/10 text-warning border-warning/20", dotClass: "bg-warning", label: "WARNING" },
  low: { icon: Info, badgeClass: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary", label: "INFO" },
};

export default function Alerts() {
  const { data: alertsData = [] } = useAlerts();
  const [selectedAlert, setSelectedAlert] = useState(alertsData[0] || null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeAlerts = alertsData.filter(a => !dismissed.has(a.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider">EpidemAI Alert System</h1>
            <p className="text-sm text-muted-foreground">Real-time priority alerts with AI-generated analysis and recommendations.</p>
          </div>
          <RealTimeIndicator />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Alert List */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Priority Alerts</h3>
              <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">{activeAlerts.length} active</span>
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
                      onClick={() => setSelectedAlert(a)}
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
                          className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          Dismiss
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
                  <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alert Analysis</h3>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold">{selectedAlert.location}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{selectedAlert.description}</p>
                  </div>

                  {/* Dominant Signal */}
                  <div className="mb-4">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dominant signal</span>
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

                  {/* Confidence Score */}
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Confidence Score</span>
                    <span className="font-display text-lg font-bold text-primary">{selectedAlert.confidence}%</span>
                  </div>

                  {/* AI Recommendations */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AI Recommendations</span>
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
      </div>
    </div>
  );
}
