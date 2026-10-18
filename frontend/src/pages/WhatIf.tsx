import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import DemonstrationNotice from "@/components/DemonstrationNotice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker,
  RotateCcw,
  Droplets,
  Thermometer,
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Brain,
  Zap,
  AlertTriangle,
  Shield,
  Activity,
  Flame,
  CloudRain,
  Sun,
  Waves,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Bug,
  Microscope,
  HeartPulse,
  Dna
} from "lucide-react";
import { hasConfiguredApi, useEpiclimDiseases, useEpiclimDistricts, useEpiclimWhatIf } from "@/hooks/useApi";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const MODEL_LABELS: Record<string, string> = {
  ridge_regression: "Ridge Regression",
  random_forest: "Random Forest",
  gradient_boosting: "Gradient Boosting",
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

const DISEASE_BIOLOGY: Record<string, { vector: string; optimalTemp: string; precipEffect: string; note: string }> = {
  Dengue: {
    vector: "Aedes aegypti / albopictus",
    optimalTemp: "26°C – 32°C (Extrinsic incubation accelerates above 28°C)",
    precipEffect: "Rainwater accumulation creates artificial container breeding sites.",
    note: "Peak transmission typically follows monsoon onset by 3–5 weeks.",
  },
  Malaria: {
    vector: "Anopheles culicifacies / stephensi",
    optimalTemp: "22°C – 30°C (Sporogony inhibited below 18°C or above 35°C)",
    precipEffect: "Standing monsoon pools provide extensive rural and peri-urban breeding.",
    note: "High humidity (>60%) significantly extends adult mosquito lifespan.",
  },
  Cholera: {
    vector: "Vibrio cholerae (Waterborne)",
    optimalTemp: "25°C – 35°C (Favors aquatic bacterial bloom)",
    precipEffect: "Intense rainfall overwhelms urban drainage and contaminates potable water.",
    note: "Flooding events correlate with acute pathogen transmission within 48–72 hours.",
  },
  Chikungunya: {
    vector: "Aedes aegypti",
    optimalTemp: "25°C – 31°C",
    precipEffect: "Intermittent rainfall alternating with warmth maximizes biting activity.",
    note: "Shares vector dynamics with dengue but exhibits explosive localized transmission.",
  },
  "Acute Diarrhoeal Disease": {
    vector: "Enteric pathogens (Bacterial / Viral)",
    optimalTemp: "28°C – 38°C",
    precipEffect: "Monsoon flooding and runoff compromise sanitation infrastructure.",
    note: "High ambient temperature also accelerates bacterial food contamination.",
  },
  "Acute Encephalitis Syndrome": {
    vector: "Culex tritaeniorhynchus & enteroviruses",
    optimalTemp: "24°C – 32°C",
    precipEffect: "Flooded paddy fields and marshlands provide vast breeding expanses.",
    note: "Endemic transmission concentrates post-monsoon in agricultural river basins.",
  },
};

export default function WhatIf() {
  const { data: diseasesData } = useEpiclimDiseases();
  const diseases = diseasesData?.diseases ?? [];

  const [selectedDisease, setSelectedDisease] = useState("Dengue");
  const [requestedState, setRequestedState] = useState("");
  const [requestedDistrict, setRequestedDistrict] = useState("");
  const [selectedModel, setSelectedModel] = useState("ridge_regression");

  // Track if user manually moved sliders
  const isCustomizedRef = useRef(false);

  // Climate Sliders local state (immediate 60fps update)
  const [temperature, setTemperature] = useState(28);
  const [precipitation, setPrecipitation] = useState(100);
  const [lai, setLai] = useState(1.0);

  // Debounced climate values for network query (150ms)
  const [debouncedTemp, setDebouncedTemp] = useState(28);
  const [debouncedPrecip, setDebouncedPrecip] = useState(100);
  const [debouncedLai, setDebouncedLai] = useState(1.0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTemp(temperature);
      setDebouncedPrecip(precipitation);
      setDebouncedLai(lai);
    }, 150);
    return () => clearTimeout(handler);
  }, [temperature, precipitation, lai]);

  // Interventions toggle
  const [enableInterventions, setEnableInterventions] = useState(false);
  const [larviciding, setLarviciding] = useState(true);
  const [communityAlert, setCommunityAlert] = useState(true);
  const [clinicalPrep, setClinicalPrep] = useState(false);

  const currentDiseaseInfo = diseases.find((d) => d.disease === selectedDisease);
  const availableModels = currentDiseaseInfo?.models ?? ["ridge_regression", "random_forest", "gradient_boosting"];

  const { data: directory } = useEpiclimDistricts(selectedDisease);
  const districtsList = directory?.districts ?? [];
  const states = useMemo(() => [...new Set(districtsList.map((r) => r.state))].sort(), [districtsList]);

  // Fallback to first state if requestedState not available in this disease
  const state = states.includes(requestedState) ? requestedState : states[0] ?? "";
  const stateDistricts = useMemo(() => districtsList.filter((r) => r.state === state), [districtsList, state]);
  const district = stateDistricts.some((r) => r.district === requestedDistrict)
    ? requestedDistrict
    : stateDistricts[0]?.district ?? "";

  const validModel = availableModels.includes(selectedModel) ? selectedModel : availableModels[0] ?? "ridge_regression";

  // Simulation Query
  const { data: whatifResult, isLoading, isFetching, isError, refetch } = useEpiclimWhatIf(
    selectedDisease,
    state,
    district,
    debouncedTemp,
    debouncedPrecip,
    debouncedLai,
    validModel
  );

  // Auto-sync sliders to baseline on disease or state change if not manually customized
  useEffect(() => {
    if (whatifResult?.baseline_climate && !isCustomizedRef.current) {
      setTemperature(Math.round(whatifResult.baseline_climate.temperature));
      setPrecipitation(Math.round(whatifResult.baseline_climate.precipitation));
      setLai(Number(whatifResult.baseline_climate.lai.toFixed(1)));
    }
  }, [whatifResult?.baseline_climate, state, selectedDisease]);

  // Reset to baseline
  const resetFactors = useCallback(() => {
    isCustomizedRef.current = false;
    if (whatifResult?.baseline_climate) {
      setTemperature(Math.round(whatifResult.baseline_climate.temperature));
      setPrecipitation(Math.round(whatifResult.baseline_climate.precipitation));
      setLai(Number(whatifResult.baseline_climate.lai.toFixed(1)));
    } else {
      setTemperature(28);
      setPrecipitation(100);
      setLai(1.0);
    }
  }, [whatifResult]);

  // Apply climate presets
  const applyPreset = (preset: "heatwave" | "monsoon" | "flood" | "drought") => {
    isCustomizedRef.current = true;
    const base = whatifResult?.baseline_climate ?? { temperature: 28, precipitation: 100, lai: 1.0 };
    if (preset === "heatwave") {
      setTemperature(Math.min(48, Math.round(base.temperature + 6)));
      setPrecipitation(Math.max(5, Math.round(base.precipitation * 0.4)));
      setLai(Math.max(0.2, Number((base.lai - 0.4).toFixed(1))));
    } else if (preset === "monsoon") {
      setTemperature(Math.round(base.temperature + 1));
      setPrecipitation(Math.min(500, Math.round(base.precipitation + 180)));
      setLai(Math.min(10.0, Number((base.lai + 1.2).toFixed(1))));
    } else if (preset === "flood") {
      setTemperature(Math.round(base.temperature + 2));
      setPrecipitation(Math.min(500, Math.round(base.precipitation + 260)));
      setLai(Math.min(10.0, Number((base.lai + 1.6).toFixed(1))));
    } else if (preset === "drought") {
      setTemperature(Math.min(48, Math.round(base.temperature + 4)));
      setPrecipitation(Math.max(0, Math.round(base.precipitation * 0.15)));
      setLai(Math.max(0.1, Number((base.lai - 0.7).toFixed(1))));
    }
  };

  // Intervention effectiveness reduction factor
  const interventionReduction = useMemo(() => {
    if (!enableInterventions) return 0;
    let factor = 0;
    if (larviciding) factor += 0.28;
    if (communityAlert) factor += 0.14;
    if (clinicalPrep) factor += 0.12;
    return Math.min(factor, 0.5);
  }, [enableInterventions, larviciding, communityAlert, clinicalPrep]);

  // Chart data calculation
  const chartData = useMemo(() => {
    if (!whatifResult?.baseline_forecasts?.length) return [];
    return whatifResult.baseline_forecasts.map((b, i) => {
      const sim = whatifResult.simulated_forecasts?.[i]?.cases ?? 0;
      const mitigated = enableInterventions
        ? Math.max(0, Math.round(sim - (sim - b.cases) * interventionReduction))
        : sim;
      return {
        period: b.period,
        baseline: b.cases,
        simulated: sim,
        mitigated: enableInterventions ? mitigated : undefined,
      };
    });
  }, [whatifResult, enableInterventions, interventionReduction]);

  const diseaseColor = DISEASE_COLORS[selectedDisease] ?? "#6366f1";
  const biologyInfo = DISEASE_BIOLOGY[selectedDisease] ?? DISEASE_BIOLOGY["Dengue"];

  // Risk Classification
  const changePct = whatifResult?.change_pct ?? 0;
  const riskLevel = whatifResult
    ? changePct > 80
      ? "critical"
      : changePct > 25
      ? "high"
      : changePct > 0
      ? "moderate"
      : "low"
    : null;

  const riskConfig = {
    critical: { label: "Scenario increase · model output", color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle },
    high: { label: "Scenario increase · model output", color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle },
    moderate: { label: "Scenario increase · model output", color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Activity },
    low: { label: "Scenario decrease · model output", color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Shield },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pt-24 pb-12">
        <DemonstrationNotice className="mb-6" />
        {/* ─── Header ─── */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <Beaker className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    EpidemAI Scenario Explorer
                  </span>

                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Climate scenario analysis</h1>
                <p className="text-xs text-muted-foreground">
                  Explore modeled climate inputs for {diseases.length || 6} conditions. Results are experimental estimates, not case forecasts or outbreak warnings.
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-3">
              {isFetching && (
                <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Calculating…</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {!hasConfiguredApi ? (
          <section className="mx-auto my-10 max-w-2xl rounded-2xl border border-border bg-card p-6 text-center sm:p-9" role="status">
            <Beaker className="mx-auto mb-3 h-12 w-12 text-primary/70" />
            <h2 className="text-xl font-semibold">Scenario service is not configured</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">The rest of the site can still be used. To run climate scenarios locally, start the EpidemAI API and set <code className="rounded bg-secondary px-1.5 py-0.5">VITE_API_URL</code> in <code className="rounded bg-secondary px-1.5 py-0.5">frontend/.env</code>, then restart Vite.</p>
          </section>
        ) : (
          <>
          {isError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/35 bg-destructive/10 p-4 text-sm"><span><strong className="block">Scenario request failed.</strong><span className="text-muted-foreground">Check that the API is running and try again. Previous estimates may remain visible until a new request succeeds.</span></span><button type="button" onClick={() => void refetch()} className="min-h-10 rounded-lg border border-border bg-card px-4 font-semibold hover:bg-secondary">Retry</button></div>}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* ─── Left Controls Panel (5 Cols) ─── */}
            <div className="lg:col-span-5 space-y-4">
              {/* Disease Selection Strip */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Target Pathogen
                  </h2>
                  <span className="text-[10px] text-muted-foreground">{diseases.length || 6} models</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(diseases.length > 0
                    ? diseases
                    : [{ disease: "Dengue" }, { disease: "Malaria" }, { disease: "Cholera" }, { disease: "Chikungunya" }]
                  ).map((d) => {
                    const isSelected = selectedDisease === d.disease;
                    return (
                      <button
                        key={d.disease}
                        onClick={() => {
                          isCustomizedRef.current = false;
                          setSelectedDisease(d.disease);
                          setRequestedState("");
                          setRequestedDistrict("");
                        }}
                        className={`group relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm shadow-primary/5"
                            : "border-border/60 bg-secondary/20 hover:border-border hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                              isSelected
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary/60 text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            <DiseaseIcon disease={d.disease} className="h-3.5 w-3.5" />
                          </div>
                          <span
                            className={`text-xs font-semibold leading-tight line-clamp-1 ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {d.disease}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* State & Model Selectors */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  Geography & Model Engine
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      State / Region
                    </label>
                    <select
                      value={state}
                      onChange={(e) => {
                        isCustomizedRef.current = false;
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
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      District Focus
                    </label>
                    <select
                      value={district}
                      onChange={(e) => {
                        isCustomizedRef.current = false;
                        setRequestedDistrict(e.target.value);
                      }}
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
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
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
              </div>

              {/* Climate Sliders & Quick Presets */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Climate Shock Variables
                    </h2>
                  </div>
                  <button
                    onClick={resetFactors}
                    className="flex items-center gap-1 rounded-lg bg-secondary/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset Baseline
                  </button>
                </div>

                {/* Scenario Presets Strip */}
                <div className="mb-5 pb-3 border-b border-border/50">
                  <p className="text-[10px] text-muted-foreground mb-2 font-medium">Quick Crisis Presets:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => applyPreset("heatwave")}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-orange-400 hover:bg-orange-500/10 transition-colors"
                    >
                      <Flame className="h-3.5 w-3.5" /> Heatwave
                    </button>
                    <button
                      onClick={() => applyPreset("monsoon")}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                      <CloudRain className="h-3.5 w-3.5" /> Monsoon
                    </button>
                    <button
                      onClick={() => applyPreset("flood")}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Waves className="h-3.5 w-3.5" /> Flooding
                    </button>
                    <button
                      onClick={() => applyPreset("drought")}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Sun className="h-3.5 w-3.5" /> Drought
                    </button>
                  </div>
                </div>

                {/* Temperature Slider */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                        <Thermometer className="h-4 w-4 text-orange-400" />
                      </div>
                      <span className="text-xs font-semibold">Mean Ambient Temperature</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-orange-400">{temperature}°C</span>
                      {whatifResult?.baseline_climate && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          (base: {Math.round(whatifResult.baseline_climate.temperature)}°C)
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={45}
                    value={temperature}
                    onChange={(e) => {
                      isCustomizedRef.current = true;
                      setTemperature(+e.target.value);
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-400"
                    style={{ background: `linear-gradient(to right, #3b82f6 0%, #f97316 50%, #ef4444 100%)` }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>10°C (Winter)</span>
                    <span>28°C (Optimal Vector)</span>
                    <span>45°C (Extreme)</span>
                  </div>
                </div>

                {/* Precipitation Slider */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                        <Droplets className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-xs font-semibold">Monthly Total Precipitation</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-blue-400">{precipitation} mm</span>
                      {whatifResult?.baseline_climate && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          (base: {Math.round(whatifResult.baseline_climate.precipitation)} mm)
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={5}
                    value={precipitation}
                    onChange={(e) => {
                      isCustomizedRef.current = true;
                      setPrecipitation(+e.target.value);
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-400"
                    style={{ background: `linear-gradient(to right, #64748b 0%, #38bdf8 50%, #1d4ed8 100%)` }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>0 mm (Arid)</span>
                    <span>200 mm (Normal)</span>
                    <span>500 mm (Extreme Monsoon)</span>
                  </div>
                </div>

                {/* Vegetation (LAI) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Leaf className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold">Vegetation Canopy (Leaf Area Index)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-emerald-400">{lai.toFixed(1)}</span>
                      {whatifResult?.baseline_climate && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          (base: {whatifResult.baseline_climate.lai.toFixed(1)})
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={lai}
                    onChange={(e) => {
                      isCustomizedRef.current = true;
                      setLai(+e.target.value);
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-400"
                    style={{ background: `linear-gradient(to right, #a1a1aa 0%, #34d399 50%, #059669 100%)` }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>0.0 (Barren)</span>
                    <span>5.0 (Moderate Foliage)</span>
                    <span>10.0 (Dense Tropical Canopy)</span>
                  </div>
                </div>
              </div>

              {/* Public Health Mitigation Simulator Card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Public Health Interventions
                    </h2>
                  </div>
                  <button
                    onClick={() => setEnableInterventions(!enableInterventions)}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                      enableInterventions
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {enableInterventions ? "Mitigation Active" : "Simulate Interventions"}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Model the impact of proactive public-health counter-measures against this scenario.
                </p>

                {enableInterventions && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="flex items-center justify-between rounded-xl bg-secondary/20 p-2.5 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${larviciding ? "text-emerald-400" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">Intensive Larviciding & Space Spraying</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={larviciding}
                        onChange={(e) => setLarviciding(e.target.checked)}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-xl bg-secondary/20 p-2.5 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${communityAlert ? "text-emerald-400" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">Early Warning SMS & Source Reduction</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={communityAlert}
                        onChange={(e) => setCommunityAlert(e.target.checked)}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-xl bg-secondary/20 p-2.5 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${clinicalPrep ? "text-emerald-400" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">Clinical Stockpiling & Fever Clinics</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={clinicalPrep}
                        onChange={(e) => setClinicalPrep(e.target.checked)}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                    </label>

                    <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center text-xs text-emerald-400 font-semibold">
                      Estimated Transmission Aversion: -{Math.round(interventionReduction * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Right Visualization Panel (7 Cols) ─── */}
            <div className="lg:col-span-7 space-y-4">
              {/* Dynamic Risk Banner */}
              {whatifResult && riskLevel && (
                <div
                  className={`rounded-2xl border ${riskConfig[riskLevel].border} ${riskConfig[riskLevel].bg} p-4 shadow-sm transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = riskConfig[riskLevel].icon;
                        return <Icon className="h-6 w-6" style={{ color: riskConfig[riskLevel].color }} />;
                      })()}
                      <div>
                        <p className="text-sm font-bold" style={{ color: riskConfig[riskLevel].color }}>
                          {riskConfig[riskLevel].label}: {changePct > 0 ? "+" : ""}
                          {changePct}% Projected Caseload Shift
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedDisease} in {state} · Peak moves from {whatifResult.peak_baseline ?? 0} to{" "}
                          {whatifResult.peak_simulated ?? 0} cases/month
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono" style={{ color: riskConfig[riskLevel].color }}>
                        {(whatifResult.change ?? 0) > 0 ? "+" : ""}
                        {whatifResult.change ?? 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Peak change vs baseline</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation Chart */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${diseaseColor}15`, color: diseaseColor }}
                    >
                      <DiseaseIcon disease={selectedDisease} className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-sm font-bold">
                        {selectedDisease} Transmission Dynamics — {district ? `${district}, ` : ""}{state || "India"}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Simulating {MODEL_LABELS[validModel]} with {temperature}°C temp, {precipitation}mm rain, {lai.toFixed(1)} LAI
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${diseaseColor}15`, color: diseaseColor }}
                  >
                    {MODEL_LABELS[validModel]}
                  </span>
                </div>

                {/* Legend indicator */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 rounded bg-muted-foreground/60 border-t border-dashed" />
                    <span>Baseline Seasonal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-2 rounded" style={{ backgroundColor: diseaseColor }} />
                    <span className="font-medium text-foreground">Climate Shock Scenario</span>
                  </div>
                  {enableInterventions && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-2 rounded bg-emerald-400" />
                      <span className="font-medium text-emerald-400">Mitigated Transmission</span>
                    </div>
                  )}
                </div>

                {chartData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="whatifBaseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.08} />
                            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="whatifSimGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={diseaseColor} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={diseaseColor} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="whatifMitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                          formatter={(value: any, name: any) => [
                            `${(Number(value) || 0).toLocaleString()} cases`,
                            name === "baseline" ? "Baseline" : name === "simulated" ? "Simulated" : "Mitigated",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="baseline"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          fill="url(#whatifBaseGrad)"
                          dot={false}
                          name="baseline"
                        />
                        <Area
                          type="monotone"
                          dataKey="simulated"
                          stroke={diseaseColor}
                          strokeWidth={2.5}
                          fill="url(#whatifSimGrad)"
                          dot={{ r: 4, fill: diseaseColor, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                          activeDot={{ r: 6 }}
                          name="simulated"
                        />
                        {enableInterventions && (
                          <Area
                            type="monotone"
                            dataKey="mitigated"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fill="url(#whatifMitGrad)"
                            dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "hsl(var(--card))" }}
                            activeDot={{ r: 6 }}
                            name="mitigated"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : isFetching || isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm font-medium">Calculating scenario estimate…</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Applying the selected model to these inputs</p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 max-w-sm">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">Simulation Parameter Issue</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        The model was unable to compute for the current parameter configuration.
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Retry Calculation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60">
                    <Beaker className="h-10 w-10 mb-3" />
                    <p className="text-sm font-medium">Waiting for simulation data</p>
                    <p className="text-xs mt-1">Select a state and adjust the sliders above</p>
                  </div>
                )}
              </div>

              {/* Impact Metric Cards */}
              {whatifResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Baseline Peak
                    </p>
                    <p className="text-xl font-bold font-mono">{(whatifResult.peak_baseline ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">cases / mo</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Simulated Peak
                    </p>
                    <p className="text-xl font-bold font-mono" style={{ color: diseaseColor }}>
                      {(whatifResult.peak_simulated ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">cases / mo</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Peak change
                    </p>
                    <p
                      className={`text-xl font-bold font-mono ${
                        (whatifResult.change ?? 0) > 0 ? "text-destructive" : (whatifResult.change ?? 0) < 0 ? "text-emerald-400" : ""
                      }`}
                    >
                      {(whatifResult.change ?? 0) > 0 ? "+" : ""}
                      {whatifResult.change ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">cases</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Relative Shift
                    </p>
                    <p
                      className={`text-xl font-bold font-mono ${
                        changePct > 0 ? "text-destructive" : changePct < 0 ? "text-emerald-400" : ""
                      }`}
                    >
                      {changePct > 0 ? "+" : ""}
                      {changePct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">vs baseline</p>
                  </div>
                </div>
              )}

              {/* Vector Biology & Sensitivity Insight Card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Dna className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider">
                    Biological Sensitivity: {selectedDisease}
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-secondary/20 p-3">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Primary Vector</p>
                    <p className="font-semibold text-foreground">{biologyInfo.vector}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{biologyInfo.note}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/20 p-3">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Thermal & Rain Dynamics</p>
                    <p className="font-semibold text-orange-400">{biologyInfo.optimalTemp}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{biologyInfo.precipEffect}</p>
                  </div>
                </div>
              </div>

              {/* Monthly Simulation Breakdown Table */}
              {whatifResult?.baseline_forecasts && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Detailed Monthly Breakdown
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/40">
                          <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">
                            Month
                          </th>
                          <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-muted-foreground">
                            Baseline
                          </th>
                          <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-muted-foreground">
                            Simulated
                          </th>
                          {enableInterventions && (
                            <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-emerald-400">
                              Mitigated
                            </th>
                          )}
                          <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-muted-foreground">
                            Impact
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {whatifResult.baseline_forecasts.map((b, i) => {
                          const s = whatifResult.simulated_forecasts?.[i];
                          const simCases = s?.cases ?? 0;
                          const diff = simCases - b.cases;
                          const pct = b.cases > 0 ? Math.round((diff / b.cases) * 100) : 0;
                          const mit = enableInterventions
                            ? Math.max(0, Math.round(simCases - diff * interventionReduction))
                            : simCases;

                          return (
                            <tr key={b.period} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-2.5 font-mono font-semibold">{b.period}</td>
                              <td className="px-4 py-2.5 text-right font-mono">{b.cases.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold" style={{ color: diseaseColor }}>
                                {simCases.toLocaleString()}
                              </td>
                              {enableInterventions && (
                                <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                                  {mit.toLocaleString()}
                                </td>
                              )}
                              <td
                                className={`px-4 py-2.5 text-right font-mono font-semibold ${
                                  diff > 0 ? "text-destructive" : diff < 0 ? "text-emerald-400" : "text-muted-foreground"
                                }`}
                              >
                                {diff > 0 ? "+" : ""}
                                {diff} ({pct > 0 ? "+" : ""}
                                {pct}%)
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </main>
    </div>
  );
}
