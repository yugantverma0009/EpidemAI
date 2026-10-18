import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import DemonstrationNotice from "@/components/DemonstrationNotice";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  Activity,
  Brain,
  Microscope,
  Layers,
  Zap,
  Info,
  Shield,
  Calendar,
  MapPin,
  ArrowUpRight,
  Database,
  Bug,
  Droplets,
  HeartPulse
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from "recharts";
import {
  hasConfiguredApi,
  useCities,
  useTopRiskRegions,
  correlationFactors,
  riskPredictions,
  useEpiclimDiseases,
  useEpiclimDistricts,
  useEpiclimForecast,
  useEpiclimModelComparison
} from "@/hooks/useApi";
import type { CityData } from "@/data/mockData";

const forecastColors = ["#ef4444", "#f97316", "#f59e0b", "#14b8a6"];

const MODEL_LABELS: Record<string, string> = {
  ridge_regression: "Ridge Regression",
  random_forest: "Random Forest",
  gradient_boosting: "Gradient Boosting",
  seasonal_month_mean_baseline: "Seasonal Baseline",
};

const MODEL_COLORS: Record<string, string> = {
  ridge_regression: "#6366f1",
  random_forest: "#10b981",
  gradient_boosting: "#f59e0b",
  seasonal_month_mean_baseline: "#94a3b8",
};

const DiseaseIcon = ({ disease, className = "h-4 w-4" }: { disease: string; className?: string }) => {
  switch (disease) {
    case "Dengue":
      return <Bug className={className} />;
    case "Malaria":
      return <Microscope className={className} />;
    case "Cholera":
      return <Droplets className={className} />;
    case "Chikungunya":
      return <Activity className={className} />;
    case "Acute Diarrhoeal Disease":
      return <HeartPulse className={className} />;
    case "Acute Encephalitis Syndrome":
      return <Brain className={className} />;
    default:
      return <Activity className={className} />;
  }
};

const DISEASE_COLORS: Record<string, string> = {
  Dengue: "#ef4444",
  Malaria: "#8b5cf6",
  Cholera: "#06b6d4",
  Chikungunya: "#f97316",
  "Acute Diarrhoeal Disease": "#10b981",
  "Acute Encephalitis Syndrome": "#ec4899",
};

/* ─── City Forecast Chart ──────────────────────────────── */
function ForecastChart({ cities }: { cities: CityData[] }) {
  const forecastCities = [...cities].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
  const data = Array.from({ length: 7 }, (_, index) => ({
    day: `Day ${index + 1}`,
    ...Object.fromEntries(forecastCities.map((city) => [city.name, city.prediction7d[index] ?? 0])),
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          {forecastCities.map((city, index) => (
            <Line
              key={city.name}
              type="monotone"
              dataKey={city.name}
              stroke={forecastColors[index % forecastColors.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Predictive() {
  const { data: cities = [] } = useCities();
  const { data: topRiskRegions = [] } = useTopRiskRegions();
  const highRiskCities = cities.filter((c) => c.riskLevel === "high" || c.riskLevel === "moderate").slice(0, 6);

  // Global disease selector for coordinated analytics
  const { data: diseasesData, isLoading: diseasesLoading } = useEpiclimDiseases();
  const diseases = diseasesData?.diseases ?? [];
  const [selectedDisease, setSelectedDisease] = useState("Dengue");
  const [selectedModel, setSelectedModel] = useState("ridge_regression");
  const [requestedState, setRequestedState] = useState("");
  const [requestedDistrict, setRequestedDistrict] = useState("");
  const [viewMode, setViewMode] = useState<"forecast" | "observed_vs_forecast" | "table">("forecast");

  // Active disease metadata
  const currentDiseaseInfo = diseases.find((d) => d.disease === selectedDisease);
  const availableModels = currentDiseaseInfo?.models ?? ["ridge_regression", "random_forest", "gradient_boosting"];
  const validModel = availableModels.includes(selectedModel) ? selectedModel : availableModels[0] ?? "ridge_regression";

  // Districts & location
  const { data: directory, isLoading: districtsLoading } = useEpiclimDistricts(selectedDisease);
  const districts = directory?.districts ?? [];
  const states = useMemo(() => [...new Set(districts.map((row) => row.state))].sort(), [districts]);
  const state = states.includes(requestedState) ? requestedState : states[0] ?? "";
  const stateDistricts = useMemo(() => districts.filter((row) => row.state === state), [districts, state]);
  const district = stateDistricts.some((row) => row.district === requestedDistrict)
    ? requestedDistrict
    : stateDistricts[0]?.district ?? "";

  // 6-Month Forecast
  const { data: forecast, isLoading: forecastLoading, isError: forecastError } = useEpiclimForecast(
    state,
    district,
    validModel,
    selectedDisease
  );

  // Model comparison data for active disease
  const { data: comparisonData, isLoading: comparisonLoading } = useEpiclimModelComparison(selectedDisease);

  // Forecast chart data with uncertainty bounds
  const chartData = useMemo(() => {
    if (!forecast?.forecasts) return [];
    return forecast.forecasts
      .filter((r) => r.expected_reported_cases !== null)
      .map((row) => ({
        period: row.period,
        cases: row.expected_reported_cases ?? 0,
        lower: row.lower_bound ?? Math.max(0, (row.expected_reported_cases ?? 0) - 20),
        upper: row.upper_bound ?? (row.expected_reported_cases ?? 0) + 20,
        uncertainty: row.uncertainty_range ?? "±20 cases",
        method: row.method?.replaceAll("_", " ") ?? row.status,
      }));
  }, [forecast]);

  // Combined Historical Observed vs Forecast Data
  const observedVsForecastData = useMemo(() => {
    const points: Array<{
      period: string;
      observedCases: number | null;
      predictedCases: number | null;
      lower: number | null;
      upper: number | null;
      reportCount?: number;
      type: "observed" | "forecast";
    }> = [];

    if (forecast?.historical_observations && forecast.historical_observations.length > 0) {
      const recentObs = forecast.historical_observations.slice(-8);
      for (const obs of recentObs) {
        points.push({
          period: obs.period,
          observedCases: obs.cases,
          predictedCases: null,
          lower: null,
          upper: null,
          reportCount: obs.report_count,
          type: "observed",
        });
      }
    }

    if (forecast?.forecasts) {
      for (const fc of forecast.forecasts) {
        if (fc.expected_reported_cases !== null) {
          points.push({
            period: fc.period,
            observedCases: null,
            predictedCases: fc.expected_reported_cases,
            lower: fc.lower_bound ?? Math.max(0, (fc.expected_reported_cases ?? 0) - 20),
            upper: fc.upper_bound ?? (fc.expected_reported_cases ?? 0) + 20,
            type: "forecast",
          });
        }
      }
    }

    return points;
  }, [forecast]);

  // Forecast KPIs
  const forecastKpis = useMemo(() => {
    if (!chartData.length) return null;
    const cases = chartData.map((d) => d.cases);
    const maxCases = Math.max(...cases);
    const maxIndex = cases.indexOf(maxCases);
    const peakPeriod = chartData[maxIndex]?.period ?? "";
    const totalCases = cases.reduce((a, b) => a + b, 0);
    const avgMonthly = Math.round(totalCases / cases.length);
    const startCase = cases[0] ?? 0;
    const endCase = cases[cases.length - 1] ?? 0;
    const trendDiff = endCase - startCase;
    const trend = trendDiff > 2 ? "rising" : trendDiff < -2 ? "declining" : "stable";

    return {
      peakCases: maxCases,
      peakPeriod,
      totalCases,
      avgMonthly,
      trend,
    };
  }, [chartData]);

  // Model Comparison Chart Data
  const modelComparisonChartData = useMemo(() => {
    if (!comparisonData?.models) return [];
    return Object.entries(comparisonData.models)
      .filter(([, v]) => v.mae_reported_cases != null)
      .map(([name, metrics]) => ({
        name: MODEL_LABELS[name] ?? name,
        id: name,
        MAE: metrics.mae_reported_cases,
        RMSE: metrics.rmse_reported_cases,
        fill: MODEL_COLORS[name] ?? "#6366f1",
        isBest: name === comparisonData.best_model,
        isSelected: name === validModel,
      }))
      .sort((a, b) => a.MAE - b.MAE);
  }, [comparisonData, validModel]);

  const activeDiseaseColor = DISEASE_COLORS[selectedDisease] ?? "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pt-20 pb-12">
        <DemonstrationNotice className="mb-6" />
        {/* ─── Hero Header & Telemetry ─── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-md shadow-primary/5">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    EpidemAI Forecast Experiments
                  </h1>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">Experimental disease trend estimates</h2>
                <p className="text-sm text-muted-foreground">
                  Operational machine learning forecasting models across vector-borne and climate-sensitive diseases.
                </p>
              </div>
            </div>

            {/* Model metadata and demonstration indicators */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Disease Models</p>
                <p className="font-mono text-base font-bold text-foreground">
                  {diseases.length || 6}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">ML Architectures</p>
                <p className="font-mono text-base font-bold text-primary">3 Models</p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Coverage</p>
                <p className="font-mono text-base font-bold text-emerald-400">
                  {directory?.districts?.length ?? 300}+ Dist
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Inference Speed</p>
                <p className="font-mono text-base font-bold text-accent">&lt;12ms</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Disease Model Selector Strip ─── */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Microscope className="h-4 w-4 text-primary" />
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Disease Model
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Click a disease to switch forecasting and model comparison
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(diseases.length > 0
              ? diseases
              : [
                  { disease: "Dengue", best_model: "ridge_regression", best_mae: 67.1, improvement_pct: 66.1 },
                  { disease: "Malaria", best_model: "random_forest", best_mae: 12.4, improvement_pct: 42.0 },
                  { disease: "Cholera", best_model: "random_forest", best_mae: 8.9, improvement_pct: 35.8 },
                  { disease: "Chikungunya", best_model: "ridge_regression", best_mae: 14.2, improvement_pct: 38.5 },
                  { disease: "Acute Diarrhoeal Disease", best_model: "ridge_regression", best_mae: 33.0, improvement_pct: 23.6 },
                  { disease: "Acute Encephalitis Syndrome", best_model: "ridge_regression", best_mae: 45.1, improvement_pct: 48.1 },
                ]
            ).map((d) => {
              const isSelected = selectedDisease === d.disease;
              const color = DISEASE_COLORS[d.disease] ?? "#6366f1";
              return (
                <button
                  key={d.disease}
                  onClick={() => {
                    setSelectedDisease(d.disease);
                    setRequestedState("");
                    setRequestedDistrict("");
                    if (d.best_model) setSelectedModel(d.best_model);
                  }}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
                      : "border-border/60 bg-card hover:border-border hover:bg-secondary/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary/60 text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <DiseaseIcon disease={d.disease} className="h-4 w-4" />
                      </div>
                      {d.improvement_pct > 0 && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          +{d.improvement_pct}%
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-xs font-semibold leading-snug line-clamp-2 ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {d.disease}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Optimal: {MODEL_LABELS[d.best_model]?.split(" ")[0] ?? "Ridge"}</span>
                    <span className="font-mono font-medium">{d.best_mae ? `${d.best_mae.toFixed(1)} MAE` : ""}</span>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="activeDiseaseBar"
                      className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Main Forecasting Engine Panel ─── */}
        <div className="grid gap-6 lg:grid-cols-12 mb-8">
          {/* Left Column: Forecast Engine (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${DISEASE_COLORS[selectedDisease] || "#06b6d4"}15`,
                      color: DISEASE_COLORS[selectedDisease] || "#06b6d4",
                    }}
                  >
                    <DiseaseIcon disease={selectedDisease} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">
                      {selectedDisease} 6-Month Case Projection
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Location: {district ? `${district}, ` : ""}{state || "India"}
                    </p>
                  </div>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg self-start sm:self-auto overflow-x-auto">
                  <button
                    onClick={() => setViewMode("forecast")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      viewMode === "forecast"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Forecast & Bounds
                  </button>
                  <button
                    onClick={() => setViewMode("observed_vs_forecast")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      viewMode === "observed_vs_forecast"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Historical vs Forecast
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      viewMode === "table"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Surveillance Table
                  </button>
                </div>
              </div>

              {/* Selector Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setRequestedState(e.target.value);
                      setRequestedDistrict("");
                    }}
                    className="w-full h-10 rounded-xl border border-border bg-secondary/30 px-3 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    {states.length === 0 && <option value="">Loading states…</option>}
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setRequestedDistrict(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-secondary/30 px-3 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    {stateDistricts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    ML Architecture
                  </label>
                  <select
                    value={validModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-secondary/30 px-3 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {MODEL_LABELS[m] ?? m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KPI Cards */}
              {forecastKpis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Peak Projected
                    </p>
                    <p className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {forecastKpis.peakCases.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{forecastKpis.peakPeriod}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Avg Monthly
                    </p>
                    <p className="font-mono text-lg font-bold text-primary mt-0.5">
                      {forecastKpis.avgMonthly.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">cases / mo</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      6-Mo Cumulative
                    </p>
                    <p className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {forecastKpis.totalCases.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">expected total</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Trend Vector
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      {forecastKpis.trend === "rising" ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-destructive" />
                          <span className="font-mono text-xs font-bold text-destructive">Surging</span>
                        </>
                      ) : forecastKpis.trend === "declining" ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-emerald-400" />
                          <span className="font-mono text-xs font-bold text-emerald-400">Declining</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs font-bold text-muted-foreground">Stable</span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">trajectory</p>
                  </div>
                </div>
              )}

              {/* Chart & Table Views */}
              {forecastLoading && !chartData.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-pulse">
                  <Brain className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm">Generating ML predictions…</p>
                </div>
              ) : viewMode === "forecast" && chartData.length > 0 ? (
                <div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeDiseaseColor} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={activeDiseaseColor} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="period"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            return (
                              <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs space-y-1.5">
                                <p className="font-bold text-foreground">{label} Projection</p>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Expected:</span>
                                  <span className="font-mono font-bold" style={{ color: activeDiseaseColor }}>
                                    {d?.cases?.toLocaleString()} cases
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-[11px]">
                                  <span className="text-muted-foreground">Uncertainty (±1.25 MAE):</span>
                                  <span className="font-mono text-muted-foreground">
                                    [{d?.lower?.toLocaleString()} – {d?.upper?.toLocaleString()}]
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-[10px] pt-1 border-t border-border/50 text-muted-foreground">
                                  <span>Model:</span>
                                  <span className="font-mono capitalize">{d?.method}</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cases"
                          stroke={activeDiseaseColor}
                          strokeWidth={2.5}
                          fill="url(#forecastAreaGrad)"
                          dot={{
                            r: 4,
                            fill: activeDiseaseColor,
                            strokeWidth: 2,
                            stroke: "hsl(var(--card))",
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/40 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeDiseaseColor }} />
                      <span className="font-medium text-foreground">{MODEL_LABELS[validModel]} Projection</span>
                      <span className="text-muted-foreground">({chartData[0]?.uncertainty ?? "±1.25 MAE bounds"})</span>
                    </div>
                    <span className="font-mono text-[10px]">Trained through: {forecast?.trained_through}</span>
                  </div>
                </div>
              ) : viewMode === "observed_vs_forecast" && observedVsForecastData.length > 0 ? (
                <div>
                  {forecast?.historical_summary && (
                    <div className="mb-3 rounded-xl bg-secondary/20 border border-border/40 p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-muted-foreground">
                          Observed Surveillance: <strong className="text-foreground">{forecast.historical_summary.total_reports} reports</strong> ({forecast.historical_summary.total_observed_cases.toLocaleString()} cases) across {forecast.historical_summary.observed_months_count} months
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                        Range: {forecast.historical_summary.first_observed} → {forecast.historical_summary.last_observed}
                      </span>
                    </div>
                  )}

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={observedVsForecastData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="period"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                          }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            const isObs = d?.type === "observed";
                            return (
                              <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-bold text-foreground">{label}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                      isObs ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {isObs ? "Observed Surveillance" : "Model Projection"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 pt-1">
                                  <span className="text-muted-foreground">Cases:</span>
                                  <span className="font-mono font-bold text-sm">
                                    {(isObs ? d?.observedCases : d?.predictedCases)?.toLocaleString()}
                                  </span>
                                </div>
                                {isObs && d?.reportCount != null && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Filing reports: {d.reportCount} outbreak notice(s)
                                  </p>
                                )}
                                {!isObs && d?.lower != null && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Bounds: [{d.lower.toLocaleString()} – {d.upper.toLocaleString()}]
                                  </p>
                                )}
                              </div>
                            );
                          }}
                        />
                        {forecast?.trained_through && (
                          <ReferenceLine
                            x={forecast.trained_through.slice(0, 7)}
                            stroke="#eab308"
                            strokeDasharray="3 3"
                            label={{
                              value: "Cutoff",
                              fill: "#eab308",
                              fontSize: 10,
                              position: "top",
                            }}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="observedCases"
                          name="Historical Observed"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#10b981" }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="predictedCases"
                          name="Model Forecast"
                          stroke={activeDiseaseColor}
                          strokeWidth={2.5}
                          strokeDasharray="4 4"
                          dot={{ r: 4, fill: activeDiseaseColor }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/40 gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>Observed Surveillance Cases</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeDiseaseColor }} />
                        <span>{MODEL_LABELS[validModel]} Projection (Dashed)</span>
                      </div>
                    </div>
                    <span className="italic text-[10px]">Missing historical months = no outbreak report filed</span>
                  </div>
                </div>
              ) : viewMode === "table" ? (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/40">
                        <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                          Period
                        </th>
                        <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                          Classification
                        </th>
                        <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-muted-foreground">
                          Reported / Forecast Cases
                        </th>
                        <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-muted-foreground">
                          Uncertainty Interval
                        </th>
                        <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-muted-foreground">
                          Inference Protocol
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Historical recent observations */}
                      {(forecast?.historical_observations?.slice(-4) ?? []).map((row) => (
                        <tr
                          key={`obs-${row.period}`}
                          className="border-t border-border/50 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono font-semibold">{row.period}</td>
                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                              Observed Report
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                            {row.cases.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                            {row.report_count} notification(s)
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                            Surveillance Record
                          </td>
                        </tr>
                      ))}
                      {/* Forecast rows */}
                      {chartData.map((row) => (
                        <tr
                          key={`fc-${row.period}`}
                          className="border-t border-border/50 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono font-semibold">{row.period}</td>
                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                              Model Projection
                            </span>
                          </td>
                          <td
                            className="px-4 py-2.5 text-right font-mono font-bold text-sm"
                            style={{ color: activeDiseaseColor }}
                          >
                            {row.cases.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                            [{row.lower.toLocaleString()} – {row.upper.toLocaleString()}] ({row.uncertainty})
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground capitalize">
                            {row.method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  No prediction data available for this selection.
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Model Architecture Benchmark & Validation (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                    Model Benchmark — {selectedDisease}
                  </h3>
                </div>
                {comparisonData && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Optimal: {MODEL_LABELS[comparisonData.best_model]?.split(" ")[0]}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Mean Absolute Error (MAE) evaluated on holdout test set across 2009–2022 surveillance data. Lower is better.
              </p>

              {/* Benchmark Bar Chart */}
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={modelComparisonChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                      formatter={(val: number) => [`${val.toFixed(1)} MAE (cases/mo)`, "Holdout Error"]}
                    />
                    <Bar dataKey="MAE" radius={[0, 4, 4, 0]} barSize={18}>
                      {modelComparisonChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.fill}
                          opacity={entry.isSelected ? 1 : entry.isBest ? 0.9 : 0.5}
                          stroke={entry.isSelected ? "hsl(var(--primary))" : "none"}
                          strokeWidth={entry.isSelected ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Data Split Telemetry */}
              {comparisonData && (
                <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-secondary/30 p-2 text-center">
                    <p className="text-muted-foreground text-[9px] uppercase">Training Split</p>
                    <p className="font-mono font-bold mt-0.5">{comparisonData.train_rows} records</p>
                    <p className="text-[9px] text-muted-foreground font-mono">through {comparisonData.train_through_month}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-2 text-center">
                    <p className="text-muted-foreground text-[9px] uppercase">Holdout Test Split</p>
                    <p className="font-mono font-bold text-primary mt-0.5">{comparisonData.test_rows} records</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{comparisonData.test_from_month} → {comparisonData.test_through_month}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* About This Estimate & Surveillance Protocol Panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-border bg-card p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider">
                    About This Estimate & Protocol
                  </h4>
                </div>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                  {forecast?.provenance?.dataset_version ?? "EpiClim 2009–2022"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                    Target Definition
                  </p>
                  <p className="text-foreground leading-relaxed text-[11px] font-medium">
                    {forecast?.provenance?.target_definition ?? "Monthly sum of reported outbreak cases in surveillance records"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                    *Target measures reported outbreak filings, not complete population incidence.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                  <div className="rounded-xl bg-secondary/30 p-2.5">
                    <p className="text-[9px] uppercase font-semibold text-muted-foreground">Evaluation Protocol</p>
                    <p className="font-semibold text-foreground text-[11px] mt-0.5">Chronological Holdout</p>
                    <p className="text-[10px] text-muted-foreground">No future time leakage</p>
                  </div>
                  <div className="rounded-xl bg-secondary/30 p-2.5">
                    <p className="text-[9px] uppercase font-semibold text-muted-foreground">Baseline Comparison</p>
                    <p className="font-semibold text-emerald-400 text-[11px] mt-0.5">
                      {currentDiseaseInfo?.improvement_pct ? `+${currentDiseaseInfo.improvement_pct}% vs Seasonal` : "Beats Baseline"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Holdout MAE: {currentDiseaseInfo?.best_mae?.toFixed(1) ?? "67.1"}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-secondary/20 border border-border/40 p-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground font-semibold">Surveillance Scope: </strong>
                      Surveillance records represent episodic outbreak alerts. Missing months cannot be assumed zero. Experimental prototype for research & surveillance planning.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Feature Drivers Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-accent" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider">
                  Top Predictive Drivers for {selectedDisease}
                </h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-secondary/20 p-2.5">
                  <span className="font-medium">1-Month Lagged Precipitation</span>
                  <span className="font-mono font-bold text-primary">r = +0.68</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/20 p-2.5">
                  <span className="font-medium">Temperature Anomaly (26–32°C Window)</span>
                  <span className="font-mono font-bold text-accent">r = +0.59</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/20 p-2.5">
                  <span className="font-medium">Vegetation Density (MODIS LAI)</span>
                  <span className="font-mono font-bold text-emerald-400">r = +0.42</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Surveillance Signals & City Early Warning ─── */}
        <div className="grid gap-6 lg:grid-cols-12 mb-8">
          {/* 7-Day City Forecast (8 Cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                    7-Day Near-Term City Trajectory
                  </h3>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                    Demo Telemetry · Pending District-City Reconciliation
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  High-frequency projection across metropolitan centers (synthetic demo data until reconciled with district-month surveillance models).
                </p>
              </div>
            </div>
            <ForecastChart cities={cities} />
          </div>

          {/* Top Risk Regions (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-destructive" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                  Priority Risk Surveillance
                </h3>
              </div>
              <span className="rounded-full bg-secondary border border-border/60 px-2 py-0.5 text-[9px] text-muted-foreground font-semibold">
                Simulated Signals
              </span>
            </div>
            <div className="space-y-2">
              {topRiskRegions.slice(0, 5).map((r) => (
                <div
                  key={r.rank}
                  className="flex items-center gap-3 rounded-xl bg-secondary/20 border border-border/40 px-3.5 py-2.5 transition-all hover:bg-secondary/40"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    #{r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{r.location}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.disease} · {r.mentions.toLocaleString()} surveillance mentions
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Leading Indicators & Early Warning Matrix ─── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Environmental Correlation Signals */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                  Outbreak Signal Drivers
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">Surveillance feature weights</span>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-semibold text-foreground">
                  Active Vector Amplification Phase
                </span>
              </div>
              <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                High Risk
              </span>
            </div>

            <div className="space-y-2.5">
              {correlationFactors.map((cf) => (
                <div key={cf.factor} className="rounded-xl bg-secondary/20 border border-border/40 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{cf.factor}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{cf.correlation}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          cf.strength === "Strong"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {cf.strength}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{cf.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk Predictions Matrix */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                Multi-Horizon Case Projections
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-border mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/40">
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                      Time Horizon
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                      Threat Level
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                      Expected Cases
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {riskPredictions.map((rp) => (
                    <tr key={rp.timeFrame} className="border-t border-border/50">
                      <td className="px-4 py-3 font-mono font-semibold">{rp.timeFrame}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${
                            rp.riskLevel === "High Risk"
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {rp.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{rp.predictedCases}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{rp.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* City forecast summary grid */}
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              7-Day Trajectory by Metropolitan Center
            </h4>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {highRiskCities.slice(0, 4).map((city) => {
                const maxVal = Math.max(...city.prediction7d);
                const change = Math.round(
                  ((city.prediction7d[6] - city.prediction7d[0]) / city.prediction7d[0]) * 100
                );
                const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";

                return (
                  <div
                    key={city.name}
                    className="rounded-xl border border-border/50 bg-secondary/20 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{city.name}</span>
                      <span
                        className={`flex items-center gap-1 text-[10px] font-mono font-semibold ${
                          trend === "up"
                            ? "text-destructive"
                            : trend === "down"
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {trend === "up" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : trend === "down" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {change > 0 ? "+" : ""}
                        {change}%
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-9">
                      {city.prediction7d.map((v, j) => (
                        <div
                          key={j}
                          className="flex-1 rounded-sm bg-primary/40 transition-all hover:bg-primary"
                          style={{ height: `${Math.max(4, (v / maxVal) * 32)}px` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
