import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssistantCheckIn, AssistantContext, AssistantSession, AssistantTriageResult, StoredAssistantEntry } from "@/types/assistant";

const configuredApiBase = import.meta.env.VITE_API_URL as string | undefined;
const isHostedApp = typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE = isHostedApp && configuredApiBase?.includes("localhost") ? undefined : configuredApiBase;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE) throw new Error("The assistant API is not configured. Please try again later.");
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Assistant request failed (${response.status}). Please try again.`);
  return response.json();
}

const SESSION_KEY = "epidemai_assistant_session_token";

export function readAssistantToken(): string | null {
  try { return window.sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}

function writeAssistantToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(SESSION_KEY, token);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch { /* sessionStorage may be disabled; current page state still works */ }
}

async function authorizedFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new Error("The assistant API is not configured. Please try again later.");
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 401) writeAssistantToken(null);
    throw new Error(response.status === 401 ? "Your history session expired. Start a new storage session to continue." : `History request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function createAssistantSession(): Promise<AssistantSession> {
  const session = await postJson<AssistantSession>("/assistant/session", { storage_consent: true });
  writeAssistantToken(session.access_token);
  return session;
}

export async function revokeAssistantSession(token: string): Promise<void> {
  await authorizedFetch<void>("/assistant/session", token, { method: "DELETE" });
  writeAssistantToken(null);
}

export async function exportAssistantHistory(token: string): Promise<Blob> {
  if (!API_BASE) throw new Error("The assistant API is not configured.");
  const response = await fetch(`${API_BASE}/assistant/export`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    if (response.status === 401) writeAssistantToken(null);
    throw new Error(response.status === 401 ? "Your history session expired." : "Could not export history.");
  }
  return response.blob();
}

export function useStructureSymptoms() {
  return useMutation({
    mutationFn: (text: string) => postJson<{ symptoms: { name: string; reported: true; duration_days?: number; severity?: string }[]; duration_days: number | null; severity: string | null }>("/assistant/symptoms/structure", { text }),
  });
}

export function useAssistantTriage() {
  return useMutation({
    mutationFn: (body: {
      original_text: string;
      symptoms: { name: string; duration_days?: number; severity?: string }[];
      answers: Record<string, string | null>;
      state?: string;
      district?: string;
      age_group?: string;
      gender?: string;
    }) =>
      postJson<AssistantTriageResult>("/assistant/triage", body),
  });
}

export function useAssistantContext(state: string, district: string, enabled: boolean) {
  return useQuery({
    queryKey: ["assistantContext", state, district],
    queryFn: async (): Promise<AssistantContext> => {
      if (!API_BASE) throw new Error("The assistant API is not configured.");
      const params = new URLSearchParams({ state, district });
      const response = await fetch(`${API_BASE}/assistant/context?${params}`);
      if (!response.ok) throw new Error(`Context request failed (${response.status}).`);
      return response.json();
    },
    enabled: enabled && Boolean(state.trim() && district.trim()),
    retry: 0,
  });
}

export function useAssistantEntries(token: string | null) {
  return useQuery({
    queryKey: ["assistantEntries", token],
    queryFn: () => authorizedFetch<StoredAssistantEntry[]>("/assistant/entries", token!),
    enabled: Boolean(token),
    retry: 0,
  });
}

export function useCreateAssistantEntry(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { symptoms: unknown[]; answers: Record<string, string | null>; care_level: string | null; urgent: boolean; guidance: Record<string, unknown> }) => {
      if (!token) throw new Error("Enable storage consent before saving.");
      return authorizedFetch<{ id: string; created_at: string; expires_at: string; urgent: boolean }>("/assistant/entries", token, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assistantEntries", token] }),
  });
}

export function useDeleteAssistantEntry(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => {
      if (!token) throw new Error("No active history session.");
      return authorizedFetch<void>(`/assistant/entries/${encodeURIComponent(entryId)}`, token, { method: "DELETE" });
    },
    onSuccess: (_data, entryId) => {
      queryClient.invalidateQueries({ queryKey: ["assistantEntries", token] });
      queryClient.removeQueries({ queryKey: ["assistantCheckins", token, entryId] });
    },
  });
}

export function useAssistantCheckIns(token: string | null, entryId: string | null) {
  return useQuery({
    queryKey: ["assistantCheckins", token, entryId],
    queryFn: () => authorizedFetch<AssistantCheckIn[]>(`/assistant/checkins?entry_id=${encodeURIComponent(entryId!)}`, token!),
    enabled: Boolean(token && entryId),
    retry: 0,
  });
}

export function useCreateAssistantCheckIn(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { entry_id: string; status: "better" | "same" | "worse"; symptoms_text: string }) => {
      if (!token) throw new Error("No active history session.");
      return authorizedFetch<AssistantCheckIn>("/assistant/checkins", token, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ["assistantCheckins", token, variables.entry_id] }),
  });
}
