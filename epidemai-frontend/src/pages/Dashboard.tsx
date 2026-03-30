import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import TrendChart from "@/components/TrendChart";
import AlertsPanel from "@/components/AlertsPanel";
import AIInsights from "@/components/AIInsights";
import NewsPanel from "@/components/NewsPanel";
import IndiaMap from "@/components/IndiaMap";
import SearchFilters from "@/components/SearchFilters";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useCities } from "@/hooks/useApi";
import type { CityData } from "@/data/mockData";
import { motion } from "framer-motion";
import { Clock, BarChart3, Shield, Zap } from "lucide-react";

const timeRanges = [
  { label: "24h", value: "Last 24h", multiplier: 0.15 },
  { label: "7d", value: "Last 7 days", multiplier: 0.5 },
  { label: "30d", value: "Last 30 days", multiplier: 0.85 },
  { label: "90d", value: "Last 90 days", multiplier: 1 },
];

function QuickStatCard({ label, value, icon: Icon, color, bg, sub, delay }: {
  label: string; value: string; icon: React.ElementType; color: string; bg: string; sub: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </motion.div>
  );
}

function CityRiskCard({ city, isSelected, onClick, multiplier }: {
  city: CityData; isSelected: boolean; onClick: () => void; multiplier: number;
}) {
  const color = city.riskLevel === "high" ? "bg-destructive" : city.riskLevel === "moderate" ? "bg-warning" : "bg-accent";
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/50 ${isSelected ? "ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{city.name}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{city.riskScore}</span>
          <span className={`h-2 w-2 rounded-full ${color}`} />
        </div>
      </div>
      <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${city.riskScore}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{Math.round(city.mentions * multiplier)} mentions</span>
        <span>{city.riskLevel}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [disease, setDisease] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [timeRange, setTimeRange] = useState("Last 24h");

  const currentMultiplier = timeRanges.find(t => t.value === timeRange)?.multiplier ?? 1;
  const { data: cities = [] } = useCities();

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      const ms = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const md = !disease || c.diseases.some((d) => d.name === disease);
      return ms && md;
    });
  }, [search, disease, cities]);

  const sortedCities = [...filtered].sort((a, b) => b.riskScore - a.riskScore);

  const totalMentions = Math.round(filtered.reduce((sum, c) => sum + c.mentions, 0) * currentMultiplier);
  const totalCases = Math.round(filtered.reduce((sum, c) => sum + c.diseases.reduce((s, d) => s + d.cases, 0), 0) * currentMultiplier);
  const highRiskCount = filtered.filter(c => c.riskLevel === "high").length;
  const avgRisk = Math.round(filtered.reduce((sum, c) => sum + c.riskScore, 0) / (filtered.length || 1));

  const stats = [
    { label: "Total Mentions", value: totalMentions.toLocaleString(), icon: BarChart3, color: "text-primary", bg: "bg-primary/10", sub: `In ${timeRange.toLowerCase()}` },
    { label: "Total Cases", value: totalCases.toLocaleString(), icon: Zap, color: "text-warning", bg: "bg-warning/10", sub: `Across ${filtered.length} cities` },
    { label: "High Risk Zones", value: highRiskCount.toString(), icon: Shield, color: "text-destructive", bg: "bg-destructive/10", sub: "Immediate attention" },
    { label: "Avg Risk Score", value: avgRisk.toString(), icon: Clock, color: "text-accent", bg: "bg-accent/10", sub: avgRisk > 60 ? "Elevated" : avgRisk > 40 ? "Moderate" : "Stable" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Command Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Live disease signals, focused alert queue, and region-level drill-down.
            </p>
          </div>
          <RealTimeIndicator />
        </div>

        {/* Filters + Time Range */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchFilters searchQuery={search} onSearchChange={setSearch} selectedDisease={disease} onDiseaseChange={setDisease} />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {timeRanges.map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeRange(t.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  timeRange === t.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
          {stats.map((s, i) => (
            <QuickStatCard key={s.label} {...s} delay={i * 0.08} />
          ))}
        </div>

        {/* ── TOP SECTION: Map + Hotspot List ── */}
        <div className="grid gap-6 lg:grid-cols-12 mb-6">
          {/* India Hotspot Map — wider */}
          <div className="lg:col-span-9">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                India Hotspot Map
              </h3>
              <IndiaMap filteredCities={filtered} selectedCity={selectedCity} onSelectCity={setSelectedCity} />
            </div>
          </div>

          {/* City Risk Scores */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-24">
              <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                City Risk Scores
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {sortedCities.map((city) => (
                  <CityRiskCard
                    key={city.name}
                    city={city}
                    isSelected={selectedCity?.name === city.name}
                    onClick={() => setSelectedCity(city)}
                    multiplier={currentMultiplier}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION: Trends + AI + Alerts + News ── */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Trends */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disease Trends</h3>
                <span className="text-[10px] text-muted-foreground">{timeRange}</span>
              </div>
              <TrendChart selectedDisease={disease || undefined} />
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-card p-5 h-full">
              <AIInsights />
            </div>
          </div>

          {/* Alerts */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Alerts</h3>
              <AlertsPanel limit={5} />
            </div>
          </div>

          {/* News */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest News</h3>
              <NewsPanel compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
