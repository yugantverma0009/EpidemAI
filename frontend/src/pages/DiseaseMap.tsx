import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import IndiaMap from "@/components/IndiaMap";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useCities, useAlerts } from "@/hooks/useApi";
import type { CityData } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const severityConfig = {
  high: { badgeClass: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "bg-destructive" },
  moderate: { badgeClass: "bg-warning/10 text-warning border-warning/20", dotClass: "bg-warning" },
  low: { badgeClass: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary" },
};

const riskFilters = ["All", "High", "Moderate", "Low"] as const;
const diseaseFilters = ["All", "Dengue", "Malaria", "Flu", "COVID-like", "TB"] as const;

export default function DiseaseMap() {
  const [selected, setSelected] = useState<CityData | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [diseaseFilter, setDiseaseFilter] = useState<string>("All");
  const { data: cities = [] } = useCities();
  const { data: alertsData = [] } = useAlerts();

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      const matchRisk = riskFilter === "All" || c.riskLevel === riskFilter.toLowerCase();
      const matchDisease = diseaseFilter === "All" || c.diseases.some((d) => d.name === diseaseFilter);
      return matchRisk && matchDisease;
    });
  }, [riskFilter, diseaseFilter, cities]);

  const sortedCities = [...filtered].sort((a, b) => b.riskScore - a.riskScore);
  const highRiskCount = cities.filter(c => c.riskLevel === "high").length;
  const moderateCount = cities.filter(c => c.riskLevel === "moderate").length;
  const lowCount = cities.filter(c => c.riskLevel === "low").length;
  const totalCases = cities.reduce((sum, c) => sum + c.diseases.reduce((s, d) => s + d.cases, 0), 0);

  const topAlerts = alertsData.filter(a => a.severity === "high").slice(0, 3);
  const topRiskCities = [...cities].sort((a, b) => b.riskScore - a.riskScore).slice(0, 7);

  // Disease breakdown
  const diseaseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    cities.forEach(c => c.diseases.forEach(d => { map[d.name] = (map[d.name] || 0) + d.cases; }));
    return Object.entries(map).map(([name, cases]) => ({ name, cases })).sort((a, b) => b.cases - a.cases);
  }, [cities]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Disease Map</h1>
            <p className="text-sm text-muted-foreground">Real-time disease surveillance across {cities.length} cities in India</p>
          </div>
          <RealTimeIndicator />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-xl font-bold text-destructive">{highRiskCount}</p>
            <p className="text-[10px] text-muted-foreground">High Risk Cities</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-xl font-bold text-warning">{moderateCount}</p>
            <p className="text-[10px] text-muted-foreground">Moderate Risk</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-xl font-bold text-accent">{lowCount}</p>
            <p className="text-[10px] text-muted-foreground">Low Risk</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-xl font-bold">{totalCases.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Total Active Cases</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground">Risk:</span>
            {riskFilters.map(f => (
              <button key={f} onClick={() => setRiskFilter(f)} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${riskFilter === f ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground">Disease:</span>
            {diseaseFilters.map(f => (
              <button key={f} onClick={() => setDiseaseFilter(f)} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${diseaseFilter === f ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Map */}
          <div className="lg:col-span-3">
            <IndiaMap filteredCities={filtered} selectedCity={selected} onSelectCity={setSelected} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Disease Breakdown */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Disease Breakdown</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={diseaseBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(215,15%,55%)" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} width={65} />
                  <Tooltip contentStyle={{ background: "hsl(220,22%,10%)", border: "1px solid hsl(220,18%,18%)", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="cases" fill="hsl(168,80%,42%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* High Alert Cities */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">High Alert Cities</h3>
              <div className="space-y-2">
                {topAlerts.map(a => (
                  <div key={a.id} className="rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2">
                    <p className="text-xs font-semibold">{a.location}</p>
                    <p className="text-[10px] text-muted-foreground">{a.title} · <span className="font-mono text-destructive">{a.confidence}%</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Risk Cities */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Risk Cities</h3>
              <div className="space-y-2">
                {topRiskCities.map(c => (
                  <div key={c.name} onClick={() => setSelected(c)} className="cursor-pointer flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 hover:bg-secondary/50 transition-colors">
                    <span className="text-xs font-semibold">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${c.riskLevel === "high" ? "bg-destructive" : c.riskLevel === "moderate" ? "bg-warning" : "bg-accent"}`} style={{ width: `${c.riskScore}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold w-6 text-right">{c.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Monitored Cities Grid */}
        <div className="mt-8">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">All Monitored Cities</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">State</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Cases</th>
                </tr>
              </thead>
              <tbody>
                {sortedCities.map(c => (
                  <tr key={c.name} className="border-t border-border hover:bg-secondary/20 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                    <td className="px-3 py-2.5 font-semibold">{c.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.state}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityConfig[c.riskLevel].badgeClass}`}>
                        {c.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono">{c.riskScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
