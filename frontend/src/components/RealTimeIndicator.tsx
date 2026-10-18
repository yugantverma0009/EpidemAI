import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { hasConfiguredApi, useBackendHealth } from "@/hooks/useApi";

export default function RealTimeIndicator() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const backend = useBackendHealth();

  const backendLabel = !hasConfiguredApi
    ? "Bundled sample data"
    : backend.isSuccess
      ? backend.data.data_mode === "demonstration" ? "API connected · demo records" : "API connected"
      : backend.isLoading
        ? "Checking API…"
        : "API unavailable · no current data";

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        type: "active",
        predicate: query => query.queryKey[0] !== "backendHealth",
        throwOnError: true,
      });
      if (hasConfiguredApi) {
        const result = await backend.refetch();
        if (result.isError) throw result.error;
      }
      setLastRefreshed(Date.now());
    } catch {
      setLastRefreshed(null);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card px-3 py-2" aria-live="polite">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className={`relative inline-flex h-2 w-2 rounded-full ${backend.isError ? "bg-destructive" : hasConfiguredApi && backend.isSuccess ? "bg-accent" : "bg-warning"}`} />
        </span>
        <span className="text-xs text-muted-foreground">{backendLabel}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {lastRefreshed ? `Checked ${new Date(lastRefreshed).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Refresh to check API"}
      </span>
      <button
        onClick={refresh}
        disabled={refreshing}
        className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Refresh dashboard data"
        title="Refresh dashboard data"
      >
        <RefreshCw className={`h-3 w-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
