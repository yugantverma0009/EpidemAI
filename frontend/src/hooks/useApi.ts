import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { CityData } from "@/data/mockData";
import {
  cities as mockCities,
  alerts as mockAlerts,
  aiInsights as mockAiInsights,
  newsItems as mockNewsItems,
  trendData as mockTrendData,
  topRiskRegions as mockTopRiskRegions,
  correlationFactors,
  riskPredictions,
  allDiseases,
} from "@/data/mockData";

const configuredApiBase = import.meta.env.VITE_API_URL as string | undefined;
// A localhost API is only reachable while running the app locally. Never send a
// deployed visitor's browser to its own localhost: it causes empty dashboards
// and can trigger a browser local-network permission prompt.
const isHostedApp = typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE = isHostedApp && configuredApiBase?.includes("localhost") ? undefined : configuredApiBase;
export const hasConfiguredApi = Boolean(API_BASE);

async function apiFetch<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("API_BASE not configured");
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export function useBackendHealth() {
  return useQuery({
    queryKey: ["backendHealth"],
    queryFn: () => apiFetch<{ status: string; service: string; data_mode?: "demonstration" | "operational"; data_source?: string }>("/health"),
    enabled: hasConfiguredApi,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 0,
  });
}

export type TinyFishStatus = {
  configured: boolean;
  ingestion_enabled: boolean;
  scheduler_enabled: boolean;
  collection_interval_seconds: number;
  sources_configured: number;
  articles_stored: number;
};

export function useTinyFishStatus() {
  return useQuery({
    queryKey: ["tinyfishStatus"],
    queryFn: () => apiFetch<TinyFishStatus>("/ingest/tinyfish/status"),
    enabled: hasConfiguredApi,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 0,
  });
}

export type DelhiClimateReference = {
  available: boolean;
  city: string;
  source?: string;
  date_start?: string;
  date_end?: string;
  observation_days?: number;
  duplicate_rows_removed?: number;
  daily_average?: { mean_temperature_c: number; relative_humidity_pct: number };
  observed_range?: { temperature_c: [number, number]; relative_humidity_pct: [number, number] };
  note: string;
};

export function useDelhiClimateReference() {
  return useQuery({
    queryKey: ["delhiClimateReference"],
    queryFn: () => apiFetch<DelhiClimateReference>("/climate/delhi-reference"),
    enabled: hasConfiguredApi,
    staleTime: 24 * 60 * 60_000,
    retry: 1,
  });
}

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<CityData[]> => {
      if (!API_BASE) return mockCities;
      const res = await apiFetch<any[]>("/map-data");
      return res.map((c: any) => ({
        name: c.name,
        state: c.state,
        lat: c.lat,
        lng: c.lng,
        riskScore: c.risk_score ?? c.riskScore,
        riskLevel: (c.risk_level ?? c.riskLevel) as CityData["riskLevel"],
        mentions: c.mentions,
        symptoms: c.symptoms || [],
        population: c.population || "",
        prediction7d: c.prediction_7d ?? c.prediction7d ?? [],
        diseases: (c.diseases || []).map((d: any) => ({
          name: d.name,
          cases: d.cases,
          trend: d.trend as "up" | "down" | "stable",
        })),
        news: (c.news || []).map((n: any) => ({
          title: n.title,
          source: n.source,
          time: n.time,
        })),
      }));
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      if (!API_BASE) return mockAlerts.map(a => ({ ...a, id: String(a.id) }));
      const res = await apiFetch<any[]>("/alerts");
      return res.map((a: any) => ({
        id: a.id || String(Math.random()),
        severity: a.severity as "high" | "moderate" | "low",
        title: a.title,
        location: a.location,
        region: a.region,
        confidence: a.confidence,
        time: a.time,
        description: a.description,
        dismissed: a.dismissed ?? false,
        signalSource: a.signal_source ?? a.signalSource ?? { news: 50, social: 50 },
        recommendations: a.recommendations || [],
      }));
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAiInsights() {
  return useQuery({
    queryKey: ["aiInsights"],
    queryFn: async () => {
      if (!API_BASE) return mockAiInsights.map(i => ({ ...i, id: String(i.id) }));
      const res = await apiFetch<any[]>("/insights");
      return res.map((i: any) => ({
        id: i.id || String(Math.random()),
        type: i.type as "trend" | "anomaly" | "prediction" | "seasonal",
        title: i.title,
        description: i.description,
        confidence: i.confidence,
      }));
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useNewsItems() {
  return useQuery({
    queryKey: ["newsItems"],
    queryFn: async () => {
      if (!API_BASE) return mockNewsItems.map(n => ({ ...n, id: String(n.id) }));
      const res = await apiFetch<any[]>("/news");
      return res.map((n: any) => ({
        id: n.id || String(Math.random()),
        title: n.title,
        source: n.source,
        time: n.time,
        disease: n.disease,
        severity: n.severity as "high" | "moderate" | "low",
        url: n.url,
        summary: n.summary,
      }));
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useTrendData() {
  return useQuery({
    queryKey: ["trendData"],
    queryFn: async () => {
      if (!API_BASE) return mockTrendData;
      return apiFetch<any[]>("/trends");
    },
    staleTime: 120_000,
    retry: 1,
  });
}

export function useTopRiskRegions() {
  return useQuery({
    queryKey: ["topRiskRegions"],
    queryFn: async () => {
      if (!API_BASE) return mockTopRiskRegions;
      return apiFetch<any[]>("/top-risk-regions");
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export type EpiclimDistrict = { state: string; district: string; latitude: number; longitude: number; observed_district_months: number; latest_observed_month: string };
export type EpiclimForecast = {
  disease: string;
  state: string;
  district: string;
  trained_through: string;
  note: string;
  forecasts: Array<{
    period: string;
    expected_reported_cases: number | null;
    lower_bound?: number | null;
    upper_bound?: number | null;
    uncertainty_range?: string | null;
    status: string;
    method?: string;
  }>;
  model: string;
  validation: Record<string, { mae_reported_cases: number; rmse_reported_cases: number } | string>;
  historical_observations?: Array<{
    period: string;
    cases: number;
    report_count: number;
    status: string;
  }>;
  historical_summary?: {
    total_reports: number;
    observed_months_count: number;
    total_observed_cases: number;
    first_observed?: string;
    last_observed?: string;
    has_data_gaps: boolean;
    note: string;
  };
  provenance?: {
    model_version: string;
    dataset_version: string;
    training_cutoff: string;
    is_experimental_estimate: boolean;
    target_definition: string;
    limitations: string;
  };
};

export type DiseaseInfo = {
  disease: string;
  best_model: string;
  best_mae: number;
  baseline_mae: number;
  improvement_pct: number;
  models: string[];
  district_count: number;
  data_rows: number;
  train_through: string;
};

export type ModelComparison = {
  disease: string;
  best_model: string;
  train_rows: number;
  test_rows: number;
  train_through_month: string;
  test_from_month: string;
  test_through_month: string;
  models: Record<string, { mae_reported_cases: number; rmse_reported_cases: number }>;
};

export function useEpiclimDiseases() {
  return useQuery({
    queryKey: ["epiclimDiseases"],
    queryFn: () => apiFetch<{ diseases: DiseaseInfo[]; total_models?: number }>("/epiclim/diseases"),
    enabled: hasConfiguredApi,
    staleTime: 60 * 60_000,
    retry: 1,
  });
}

export function useEpiclimDistricts(disease: string = "Dengue") {
  return useQuery({
    queryKey: ["epiclimDistricts", disease],
    queryFn: () => apiFetch<{ available: boolean; trained_through?: string; disease?: string; districts: EpiclimDistrict[] }>(`/epiclim/districts?disease=${encodeURIComponent(disease)}`),
    enabled: hasConfiguredApi && Boolean(disease),
    staleTime: 60 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useEpiclimForecast(state: string, district: string, model: string, disease: string = "Dengue") {
  return useQuery({
    queryKey: ["epiclimForecast", disease, state, district, model],
    queryFn: () => apiFetch<EpiclimForecast>(`/epiclim/forecast?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&horizon=6&model=${encodeURIComponent(model)}&disease=${encodeURIComponent(disease)}`),
    enabled: hasConfiguredApi && Boolean(state && district && model && disease),
    staleTime: 60 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useEpiclimModelComparison(disease: string) {
  return useQuery({
    queryKey: ["epiclimCompare", disease],
    queryFn: () => apiFetch<ModelComparison>(`/epiclim/compare-models?disease=${encodeURIComponent(disease)}`),
    enabled: hasConfiguredApi && Boolean(disease),
    staleTime: 60 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export type WhatIfResult = {
  disease: string;
  state: string;
  district: string;
  model: string;
  baseline_climate: { temperature: number; precipitation: number; lai: number };
  simulated_climate: { temperature: number; precipitation: number; lai: number };
  baseline_forecasts: Array<{ period: string; cases: number }>;
  simulated_forecasts: Array<{ period: string; cases: number }>;
  peak_baseline: number;
  peak_simulated: number;
  change: number;
  change_pct: number;
  note: string;
};

export function useEpiclimWhatIf(
  disease: string, state: string, district: string,
  temperature: number, precipitation: number, lai: number,
  model: string,
) {
  return useQuery({
    queryKey: ["epiclimWhatIf", disease, state, district, temperature, precipitation, lai, model],
    queryFn: () => apiFetch<WhatIfResult>(
      `/epiclim/whatif?disease=${encodeURIComponent(disease)}&state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&temperature=${temperature}&precipitation=${precipitation}&lai=${lai}&model=${encodeURIComponent(model)}`
    ),
    enabled: hasConfiguredApi && Boolean(state && district && disease),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export { correlationFactors, riskPredictions, allDiseases };
