import { useMutation } from "@tanstack/react-query";
import type { SchemeMatchRequest, SchemeMatchResponse } from "@/types/healthSchemes";

const configuredApiBase = import.meta.env.VITE_API_URL as string | undefined;
const isHostedApp = typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE = isHostedApp && configuredApiBase?.includes("localhost") ? undefined : configuredApiBase;

export function useHealthSchemeMatches() {
  return useMutation({
    mutationFn: async (body: SchemeMatchRequest): Promise<SchemeMatchResponse> => {
      if (!API_BASE) throw new Error("The health scheme service is not configured. Please try again later.");
      const response = await fetch(`${API_BASE}/health/schemes/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = typeof body?.detail === "string" ? body.detail : `Request failed (${response.status}). Please try again.`;
        throw new Error(message);
      }
      return response.json();
    },
  });
}
