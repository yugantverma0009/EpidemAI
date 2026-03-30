import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import IndiaMap from "@/components/IndiaMap";
import SearchFilters from "@/components/SearchFilters";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useCities, useAlerts } from "@/hooks/useApi";
import type { CityData } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, Info, ChevronRight } from "lucide-react";

const severityConfig = {
  high: { badgeClass: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "bg-destructive" },
  moderate: { badgeClass: "bg-warning/10 text-warning border-warning/20", dotClass: "bg-warning" },
  low: { badgeClass: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary" },
};

export default function DiseaseMap() {
  const [search, setSearch] = useState("");
  const [disease, setDisease] = useState("");
  const [selected, setSelected] = useState<CityData | null>(null);
  const { data: cities = [] } = useCities();
  const { data: alertsData = [] } = useAlerts();

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const matchDisease = !disease || c.diseases.some((d) => d.name === disease);
      return matchSearch && matchDisease;
    });
  }, [search, disease, cities]);

  const sortedCities = [...filtered].sort((a, b) => b.riskScore - a.riskScore);
  const topAlerts = alertsData.slice(0, 4);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const selectedAlert = alertsData.find(a => a.id === selectedAlertId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Disease Map</h1>
            <p className="text-sm text-muted-foreground">Interactive outbreak hotspot visualization across India</p>
          </div>
          <RealTimeIndicator />
        </div>
        <div className="mb-4">
          <SearchFilters searchQuery={search} onSearchChange={setSearch} selectedDisease={disease} onDiseaseChange={setDisease} />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Map */}
          <div className="lg:col-span-3">
            <IndiaMap filteredCities={filtered} selectedCity={selected} onSelectCity={setSelected} />
          </div>

          {/* Active Hotspots Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Hotspots ({sortedCities.length})</h3>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedCities.map((city) => {
                  const topDisease = city.diseases[0];
                  return (
                    <div
                      key={city.name}
                      onClick={() => setSelected(city)}
                      className={`cursor-pointer rounded-lg bg-secondary/30 px-3 py-2.5 transition-colors hover:bg-secondary/50 ${selected?.name === city.name ? "ring-1 ring-primary/30" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold">{city.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${severityConfig[city.riskLevel].badgeClass}`}>
                          {city.riskLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {topDisease?.name} · {city.mentions.toLocaleString()} mentions
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">Score:</span>
                        <span className="font-mono text-xs font-bold text-foreground">{city.riskScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Alerts */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority Alerts</h3>
                <span className="text-[10px] font-semibold text-destructive">{topAlerts.length} active</span>
              </div>
              <div className="space-y-2">
                {topAlerts.map((a) => {
                  const initials = a.location.split(",")[0].split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlertId(selectedAlertId === a.id ? null : a.id)}
                      className={`cursor-pointer rounded-lg bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/50 ${selectedAlertId === a.id ? "ring-1 ring-primary/30" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold ${severityConfig[a.severity].badgeClass} border`}>
                          {initials}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{a.location}</p>
                          <p className="text-[10px] text-muted-foreground">{a.title} · {a.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alert Analysis inline */}
              <AnimatePresence>
                {selectedAlert && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-border"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dominant signal</span>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span>News {selectedAlert.signalSource.news}%</span>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${selectedAlert.signalSource.news}%` }} />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span>Social {selectedAlert.signalSource.social}%</span>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-warning/60 rounded-full" style={{ width: `${selectedAlert.signalSource.social}%` }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
