import { useQuery } from "@tanstack/react-query";
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

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

async function apiFetch<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("API_BASE not configured");
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
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
    placeholderData: mockCities,
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
    placeholderData: mockAlerts.map(a => ({ ...a, id: String(a.id) })),
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
    placeholderData: mockAiInsights.map(i => ({ ...i, id: String(i.id) })),
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
      }));
    },
    staleTime: 60_000,
    placeholderData: mockNewsItems.map(n => ({ ...n, id: String(n.id) })),
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
    placeholderData: mockTrendData,
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
    placeholderData: mockTopRiskRegions,
    retry: 1,
  });
}

export { correlationFactors, riskPredictions, allDiseases };
