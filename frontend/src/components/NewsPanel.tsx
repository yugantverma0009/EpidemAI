import { Newspaper } from "lucide-react";
import { useNewsItems } from "@/hooks/useApi";

const severityDot: Record<string, string> = {
  high: "bg-destructive",
  moderate: "bg-warning",
  low: "bg-accent",
};

export default function NewsPanel({ compact }: { compact?: boolean }) {
  const { data: newsItems = [] } = useNewsItems();
  const items = compact ? newsItems.slice(0, 4) : newsItems;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h3 className="font-display text-sm font-semibold tracking-wider uppercase">Outbreak News Feed</h3>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="group rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot[n.severity]}`} />
              <div>
                <p className="text-sm leading-snug">
                  {n.title.split(new RegExp(`(${n.disease})`, "gi")).map((part, i) =>
                    part.toLowerCase() === n.disease.toLowerCase()
                      ? <span key={i} className="font-semibold text-primary">{part}</span>
                      : part
                  )}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.source} · {n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
