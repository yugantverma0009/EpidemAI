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
import { BarChart3, Shield, AlertTriangle, ArrowRight, MapPin } from "lucide-react";

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

function CityRiskCard({ city, isSelected, onClick }: {
  city: CityData; isSelected: boolean; onClick: () => void;
}) {
  const color = city.riskLevel === "high" ? "bg-destructive" : city.riskLevel === "moderate" ? "bg-warning" : "bg-accent";
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg bg-secondary/30 px-3 py-2 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? "ring-1 ring-primary/30" : ""}`}
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
        <span>{city.mentions.toLocaleString()} example mentions</span>
        <span>Sample score</span>
      </div>
    </button>
  );
}

function PriorityActionCard({ city, onSelect }: { city: CityData; onSelect: () => void }) {
  const leadingDisease = city.diseases[0];

  return (
    <button onClick={onSelect} className="group w-full rounded-xl border border-border bg-secondary/25 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning"><AlertTriangle className="h-3.5 w-3.5" /> Sample signal</div>
          <h3 className="mt-1 text-base font-semibold">{city.name} · {leadingDisease?.name ?? "Disease signal"}</h3>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 font-mono text-sm font-bold text-foreground">{city.riskScore} <span className="text-[10px] font-normal">demo</span></span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Example record from the bundled dataset.</p>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-[10px] text-muted-foreground">
        <span>{city.mentions.toLocaleString()} sample mentions</span>
        <span className="flex items-center gap-1 font-semibold text-primary group-hover:underline">View record <ArrowRight className="h-3 w-3" /></span>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [disease, setDisease] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const { data: cities = [], isError: citiesError, isLoading: citiesLoading, refetch: refetchCities } = useCities();

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      const ms = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const md = !disease || c.diseases.some((d) => d.name === disease);
      return ms && md;
    });
  }, [search, disease, cities]);

  const sortedCities = [...filtered].sort((a, b) => b.riskScore - a.riskScore);

  const totalMentions = filtered.reduce((sum, c) => sum + c.mentions, 0);
  const totalCases = filtered.reduce((sum, c) => sum + c.diseases.reduce((s, d) => s + d.cases, 0), 0);
  const highRiskCount = filtered.filter(c => c.riskLevel === "high").length;
  const avgRisk = filtered.length ? Math.round(filtered.reduce((sum, c) => sum + c.riskScore, 0) / filtered.length) : null;

  const stats = [
    { label: "Example mentions", value: totalMentions.toLocaleString(), icon: BarChart3, color: "text-primary", bg: "bg-primary/10", sub: "Bundled sample records" },
    { label: "Example case counts", value: totalCases.toLocaleString(), icon: BarChart3, color: "text-warning", bg: "bg-warning/10", sub: "Bundled sample records" },
    { label: "High-labelled records", value: highRiskCount.toString(), icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", sub: "Example signals" },
    { label: "Average demo score", value: avgRisk === null ? "—" : avgRisk.toString(), icon: Shield, color: "text-accent", bg: "bg-accent/10", sub: "Illustrative score" },
  ];
  const priorityCities = sortedCities.filter((city) => city.riskLevel !== "low").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pt-20 pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Command Dashboard</h1>
            <p className="text-sm text-muted-foreground">Explore the structure of EpidemAI’s public health workspace and its example indicators.</p>
          </div>
          <RealTimeIndicator />
        </div>

        {citiesError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/35 bg-destructive/10 p-4 text-sm text-foreground"><p>Dashboard sample data could not be loaded. The figures below are unavailable until the API responds.</p><button type="button" onClick={() => void refetchCities()} className="min-h-11 rounded-lg border border-border px-4 font-semibold hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Retry</button></div>}
        {citiesLoading && <p className="mb-5 text-sm text-muted-foreground" role="status">Loading sample indicators…</p>}

        {/* Available sample-record filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchFilters searchQuery={search} onSearchChange={setSearch} selectedDisease={disease} onDiseaseChange={setDisease} />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
          {stats.map((s, i) => (
            <QuickStatCard key={s.label} {...s} delay={i * 0.08} />
          ))}
        </div>

        {/* Decision-first alert queue */}
        <section className="mb-6 rounded-xl border border-primary/20 bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><h2 className="font-display text-sm font-semibold">Example signal records</h2></div>
              <p className="mt-1 text-sm text-muted-foreground">Illustrative examples to demonstrate review workflows.</p>
            </div>
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">Examples</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {priorityCities.length > 0 ? priorityCities.map((city) => <PriorityActionCard key={city.name} city={city} onSelect={() => setSelectedCity(city)} />) : <p className="text-sm text-muted-foreground">No priority actions match the selected filters.</p>}
          </div>
        </section>

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
                {sortedCities.length ? sortedCities.map((city) => (
                  <CityRiskCard
                    key={city.name}
                    city={city}
                    isSelected={selectedCity?.name === city.name}
                    onClick={() => setSelectedCity(city)}
                  />
                )) : <p className="rounded-lg bg-secondary/30 px-3 py-4 text-center text-xs text-muted-foreground">No records match these filters. Try another disease or location.</p>}
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
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">7-Day Reported Case Trend</h3>
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
      </main>
    </div>
  );
}
