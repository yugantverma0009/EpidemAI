import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { useAlerts } from "@/hooks/useApi";
import { motion } from "framer-motion";

const severityConfig = {
  high: { icon: ShieldAlert, badgeClass: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "bg-destructive" },
  moderate: { icon: AlertTriangle, badgeClass: "bg-warning/10 text-warning border-warning/20", dotClass: "bg-warning" },
  low: { icon: Info, badgeClass: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary" },
};

export default function AlertsPanel({ limit }: { limit?: number }) {
  const { data: alerts = [] } = useAlerts();
  const items = limit ? alerts.slice(0, limit) : alerts;

  return (
    <div className="space-y-3">
      {items.map((a, i) => {
        const cfg = severityConfig[a.severity];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.badgeClass} border`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold">{a.title}</h4>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${cfg.badgeClass}`}>
                    {a.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.location} · {a.time}</p>
                <p className="mt-1.5 text-xs text-secondary-foreground/80 leading-relaxed">{a.description}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${a.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{a.confidence}% confidence</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
