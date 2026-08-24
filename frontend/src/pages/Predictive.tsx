import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { useCities, useTopRiskRegions, correlationFactors, riskPredictions } from "@/hooks/useApi";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CityData } from "@/data/mockData";

const forecastColors = ["#ef4444", "#f97316", "#f59e0b", "#14b8a6"];

function ForecastChart({ cities }: { cities: CityData[] }) {
  const forecastCities = [...cities].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
  const data = Array.from({ length: 7 }, (_, index) => ({
    day: `Day ${index + 1}`,
    ...Object.fromEntries(forecastCities.map((city) => [city.name, city.prediction7d[index] ?? 0])),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} width={38} />
          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          {forecastCities.map((city, index) => <Line key={city.name} type="monotone" dataKey={city.name} stroke={forecastColors[index]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Predictive() {
  const { data: cities = [] } = useCities();
  const { data: topRiskRegions = [] } = useTopRiskRegions();
  const highRiskCities = cities.filter((c) => c.riskLevel === "high" || c.riskLevel === "moderate").slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Predictive Analytics</h1>
          <p className="text-sm text-muted-foreground">Explainable 7-day forecasts using weighted trend extrapolation and anomaly signals.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* City-level forecast */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">7-Day City Forecast</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">Projected active cases for the four highest-risk cities.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">Forecast</span>
            </div>
            <ForecastChart cities={cities} />
          </div>

          {/* Top Risk Regions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Risk Regions</h3>
            <div className="space-y-2">
              {topRiskRegions.map((r) => (
                <motion.div
                  key={r.rank}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: r.rank * 0.05 }}
                  className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">#{r.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.location}</p>
                    <p className="text-[11px] text-muted-foreground">{r.disease} · {r.mentions} mentions</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Correlation Factors & Risk Predictions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Correlation Factors */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why risk is rising</h3>
              </div>
              <span className="text-[10px] text-muted-foreground">Signals used in risk scoring</span>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold">Possible outbreak signal in the next 24–72 hours</span>
              </div>
              <span className="rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-xs font-bold text-destructive">High</span>
            </div>

            <div className="space-y-3">
              {correlationFactors.map((cf) => (
                <div key={cf.factor} className="rounded-lg bg-secondary/30 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{cf.factor}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{cf.correlation}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cf.strength === "Strong" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{cf.strength}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{cf.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">Prototype model: weighted trend extrapolation with explainable input signals.</p>
          </motion.div>

          {/* Risk Predictions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Expected cases next</h3>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Frame</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected cases</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {riskPredictions.map((rp) => (
                    <tr key={rp.timeFrame} className="border-t border-border">
                      <td className="px-4 py-3 font-mono font-semibold">{rp.timeFrame}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${rp.riskLevel === "High Risk" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                          {rp.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{rp.predictedCases}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{rp.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 7-Day City Predictions */}
            <h4 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">City forecast summary</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {highRiskCities.slice(0, 4).map((city, i) => {
                const maxVal = Math.max(...city.prediction7d);
                const change = Math.round(((city.prediction7d[6] - city.prediction7d[0]) / city.prediction7d[0]) * 100);
                const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";

                return (
                  <motion.div
                    key={city.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="rounded-lg border border-border bg-secondary/20 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{city.name}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold ${trend === "up" ? "text-destructive" : trend === "down" ? "text-accent" : "text-muted-foreground"}`}>
                        {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {change > 0 ? "+" : ""}{change}%
                      </span>
                    </div>
                    <div className="flex items-end gap-0.5 h-10">
                      {city.prediction7d.map((v, j) => (
                        <div key={j} className="flex-1 rounded-sm bg-primary/50" style={{ height: `${(v / maxVal) * 32}px` }} />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
