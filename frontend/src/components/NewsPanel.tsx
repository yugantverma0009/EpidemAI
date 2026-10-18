import { Newspaper } from "lucide-react";
import { useNewsItems, useTinyFishStatus } from "@/hooks/useApi";

const severityDot: Record<string, string> = {
  high: "bg-destructive",
  moderate: "bg-warning",
  low: "bg-accent",
};

export default function NewsPanel({ compact }: { compact?: boolean }) {
  const { data: newsItems = [] } = useNewsItems();
  const tinyFishStatus = useTinyFishStatus();
  const items = compact ? newsItems.slice(0, 4) : newsItems;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h3 className="font-display text-sm font-semibold tracking-wider uppercase">Bundled news examples</h3>
      </div>
      {tinyFishStatus.data && (
        <p className="mb-3 text-xs text-muted-foreground" role="status">
          {tinyFishStatus.data.configured
            ? `TinyFish connected · ${tinyFishStatus.data.articles_stored} collected article${tinyFishStatus.data.articles_stored === 1 ? "" : "s"}${tinyFishStatus.data.scheduler_enabled ? " · scheduled collection on" : " · manual collection"}`
            : "TinyFish is not configured on this backend · showing available feed data"}
        </p>
      )}
      <div className="space-y-2">
        {items.map((n) => {
          const title = n.title.split(new RegExp(`(${n.disease})`, "gi")).map((part, i) =>
            part.toLowerCase() === n.disease.toLowerCase()
              ? <span key={i} className="font-semibold text-primary">{part}</span>
              : part
          );
          return (
            <div key={n.id} className="group rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot[n.severity]}`} />
                <div>
                  <p className="text-sm leading-snug">
                    {n.url ? (
                      <a href={n.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                        {title}
                      </a>
                    ) : title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.source} · {n.time}</p>
                  {n.summary && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{n.summary}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
