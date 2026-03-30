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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<CityData[]> => {
      const { cities } = await get<{ cities: CityData[] }>("/dashboard");
      return cities;
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
      const { alerts } = await get<{ alerts: any[] }>("/alerts");
      return alerts.map((a: any) => ({
        id: a.id || String(Math.random()),
        severity: a.severity as "high" | "moderate" | "low",
        title: a.title,
        location: a.location,
        region: a.region,
        confidence: a.confidence,
        time: a.time,
        description: a.description,
        dismissed: a.dismissed,
        signalSource: a.signalSource || { news: 50, social: 50 },
        recommendations: a.recommendations || [],
      }));
    },
    staleTime: 30_000,
    placeholderData: mockAlerts.map((a) => ({ ...a, id: String(a.id) })),
    retry: 1,
  });
}

export function useAiInsights() {
  return useQuery({
    queryKey: ["aiInsights"],
    queryFn: async () => {
      const { insights } = await get<{ insights: any[] }>("/insights");
      return insights.map((i: any) => ({
        id: i.id || String(Math.random()),
        type: i.type as "trend" | "anomaly" | "prediction" | "seasonal",
        title: i.title,
        description: i.description,
        confidence: i.confidence,
      }));
    },
    staleTime: 60_000,
    placeholderData: mockAiInsights.map((i) => ({ ...i, id: String(i.id) })),
    retry: 1,
  });
}

export function useNewsItems() {
  return useQuery({
    queryKey: ["newsItems"],
    queryFn: async () => {
      const { news } = await get<{ news: any[] }>("/news");
      return news.map((n: any) => ({
        id: n.id || String(Math.random()),
        title: n.title,
        source: n.source,
        time: n.time,
        disease: n.disease,
        severity: n.severity as "high" | "moderate" | "low",
      }));
    },
    staleTime: 60_000,
    placeholderData: mockNewsItems.map((n) => ({ ...n, id: String(n.id) })),
    retry: 1,
  });
}

export function useTrendData() {
  return useQuery({
    queryKey: ["trendData"],
    queryFn: async () => {
      const { trends } = await get<{ trends: any[] }>("/trends");
      return trends;
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
      const { regions } = await get<{ regions: any[] }>("/top-risk-regions");
      return regions;
    },
    staleTime: 60_000,
    placeholderData: mockTopRiskRegions,
    retry: 1,
  });
}

export { correlationFactors, riskPredictions, allDiseases };
