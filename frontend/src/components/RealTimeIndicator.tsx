import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export default function RealTimeIndicator() {
  const [mins, setMins] = useState(2);

  useEffect(() => {
    const t = setInterval(() => setMins((m) => m + 1), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="text-xs text-muted-foreground">Live</span>
      </div>
      <span className="text-xs text-muted-foreground">Updated {mins} min ago</span>
      <button
        onClick={() => setMins(0)}
        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-secondary transition-colors"
        aria-label="Refresh"
      >
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}
