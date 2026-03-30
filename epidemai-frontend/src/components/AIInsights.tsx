import { Brain, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAiInsights } from "@/hooks/useApi";

const typeConfig = {
  trend: { icon: TrendingUp, color: "text-primary", border: "border-primary/20" },
  anomaly: { icon: AlertTriangle, color: "text-warning", border: "border-warning/20" },
  prediction: { icon: Brain, color: "text-accent", border: "border-accent/20" },
  seasonal: { icon: Zap, color: "text-muted-foreground", border: "border-border" },
};

export default function AIInsights() {
  const { data: aiInsights = [] } = useAiInsights();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-display text-sm font-semibold tracking-wider uppercase">AI-Generated Insights</h3>
      </div>
      {aiInsights.map((insight, i) => {
        const cfg = typeConfig[insight.type];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-lg border ${cfg.border} bg-card p-4`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
              <div>
                <h4 className="text-sm font-semibold">{insight.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-1 w-16 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${insight.confidence}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{insight.confidence}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
