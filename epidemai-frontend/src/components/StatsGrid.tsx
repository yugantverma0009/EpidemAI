import { Activity, AlertTriangle, MapPin, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useCities, useAlerts } from "@/hooks/useApi";

export default function StatsGrid() {
  const { data: cities = [] } = useCities();
  const { data: alerts = [] } = useAlerts();

  const totalMentions = cities.reduce((sum, c) => sum + c.mentions, 0);
  const clustersDetected = cities.reduce((sum, c) => sum + c.diseases.length, 0);
  const criticalAlerts = alerts.filter(a => a.severity === "high").length;

  const stats = [
    { label: "Total Mentions", value: totalMentions.toLocaleString(), sub: "↑ 23% this week", icon: Activity, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Clusters Detected", value: clustersDetected.toString(), sub: "Active clusters", icon: MapPin, color: "text-warning", bgColor: "bg-warning/10" },
    { label: "Critical Alerts", value: criticalAlerts.toString(), sub: "Filterable queue", icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10" },
    { label: "7-Day Direction", value: "-18%", sub: "Improving trend", icon: TrendingDown, color: "text-accent", bgColor: "bg-accent/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bgColor}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
