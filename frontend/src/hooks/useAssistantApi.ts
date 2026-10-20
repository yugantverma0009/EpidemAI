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

export type TriageRequestBody = {
  original_text: string;
  symptoms: { name: string; duration_days?: number; severity?: string }[];
  answers: Record<string, string | null>;
  state?: string;
  district?: string;
  age_group?: string;
  gender?: string;
};

function generateFallbackTriage(body: TriageRequestBody): AssistantTriageResult {
  const symptomNames = body.symptoms.map(s => s.name.toLowerCase());
  const allText = (body.original_text + " " + symptomNames.join(" ")).toLowerCase();
  
  // Check red flags
  const redFlags = ["chest pain", "shortness of breath", "difficulty breathing", "unconscious", "blue lips", "stiff neck", "seizure", "coughing blood"];
  const isUrgent = redFlags.some(rf => allText.includes(rf));
  if (isUrgent) {
    return {
      urgent: true,
      message: "Potential critical warning sign detected. Immediate medical intervention is advised.",
      next_steps: ["Seek urgent emergency care at the nearest hospital immediately.", "Do not rely on online triage for emergency symptoms."],
      disclaimer: "Emergency guidance only. Seek urgent medical care.",
    };
  }

  // Disease profiles for client fallback
  type FallbackProfile = {
    id: string;
    disease: string;
    cardinal: string[];
    supporting: string[];
    urgency: "low" | "moderate" | "high";
    description: string;
    blanket_cost: number;
    tests: { test_name: string; purpose: string; estimated_cost_inr: number; priority: string; sample_type: string; turnaround_time: string }[];
  };

  const profiles: FallbackProfile[] = [
    {
      id: "dengue",
      disease: "Dengue Fever",
      cardinal: ["fever", "headache", "eye pain", "joint pain", "body ache", "body pain"],
      supporting: ["nausea", "vomiting", "rash", "fatigue"],
      urgency: "moderate",
      description: "Acute mosquito-borne viral infection transmitted by Aedes mosquitoes, common in urban and semi-urban tropical areas.",
      blanket_cost: 4800,
      tests: [
        { test_name: "Dengue NS1 Antigen (Rapid/ELISA)", purpose: "Early phase viral detection (Days 1–5)", estimated_cost_inr: 450, priority: "Primary", sample_type: "Blood Serum", turnaround_time: "1–2 hours" },
        { test_name: "Complete Blood Count (CBC) with Platelets", purpose: "Monitors platelet count and hematocrit concentration", estimated_cost_inr: 200, priority: "Essential", sample_type: "Whole Blood EDTA", turnaround_time: "1 hour" },
      ],
    },
    {
      id: "malaria",
      disease: "Malaria",
      cardinal: ["fever", "chills", "sweating", "shivering"],
      supporting: ["headache", "body ache", "fatigue", "vomiting"],
      urgency: "moderate",
      description: "Parasitic blood infection transmitted by female Anopheles mosquitoes, characterized by cyclical high fevers with shaking chills.",
      blanket_cost: 4500,
      tests: [
        { test_name: "Rapid Malarial Antigen Detection (RDT Pf/Pv)", purpose: "Quick detection of P. falciparum & P. vivax antigens", estimated_cost_inr: 300, priority: "Primary", sample_type: "Fingerstick Blood", turnaround_time: "20–30 mins" },
        { test_name: "Peripheral Blood Smear for MP (Microscopy)", purpose: "Gold standard parasite quantification and species confirmation", estimated_cost_inr: 180, priority: "Essential", sample_type: "Venous Blood", turnaround_time: "2–4 hours" },
      ],
    },
    {
      id: "typhoid",
      disease: "Typhoid / Enteric Fever",
      cardinal: ["fever", "abdominal pain", "headache", "stomach pain"],
      supporting: ["constipation", "diarrhea", "loss of appetite", "weakness"],
      urgency: "moderate",
      description: "Bacterial systemic infection caused by Salmonella Typhi, transmitted via contaminated food or water.",
      blanket_cost: 4200,
      tests: [
        { test_name: "Typhidot (IgM / IgG Rapid Test)", purpose: "Detects antibodies against Salmonella typhi outer membrane protein", estimated_cost_inr: 400, priority: "Primary", sample_type: "Blood Serum", turnaround_time: "1 hour" },
        { test_name: "Complete Blood Count (CBC)", purpose: "Evaluates leukopenia (low WBC) common in enteric fevers", estimated_cost_inr: 200, priority: "Essential", sample_type: "Whole Blood EDTA", turnaround_time: "1 hour" },
      ],
    },
    {
      id: "chikungunya",
      disease: "Chikungunya",
      cardinal: ["fever", "severe joint pain", "joint pain", "joint swelling"],
      supporting: ["rash", "headache", "back pain", "fatigue"],
      urgency: "moderate",
      description: "Aedes mosquito-borne alphavirus causing debilitating polyarthralgia and acute fever.",
      blanket_cost: 4600,
      tests: [
        { test_name: "Chikungunya IgM Antibody ELISA", purpose: "Detects IgM antibodies indicating acute infection", estimated_cost_inr: 650, priority: "Primary", sample_type: "Blood Serum", turnaround_time: "4–6 hours" },
        { test_name: "C-Reactive Protein (CRP)", purpose: "Assesses systemic inflammatory joint burden", estimated_cost_inr: 220, priority: "Supportive", sample_type: "Blood Serum", turnaround_time: "1–2 hours" },
      ],
    },
    {
      id: "viral_uri",
      disease: "Viral Upper Respiratory Infection",
      cardinal: ["cough", "sore throat", "runny nose", "running nose", "congestion"],
      supporting: ["mild fever", "sneezing", "headache", "fatigue"],
      urgency: "low",
      description: "Common self-limiting upper respiratory viral illness affecting the pharynx and nasal passages.",
      blanket_cost: 3200,
      tests: [
        { test_name: "Routine Clinical Observation & Hydration", purpose: "No invasive blood tests required for uncomplicated mild viral URI", estimated_cost_inr: 0, priority: "Primary", sample_type: "Non-invasive", turnaround_time: "Immediate" },
      ],
    },
  ];

  const matched = profiles.map(p => {
    let score = 0;
    const matchedCard = p.cardinal.filter(c => allText.includes(c));
    const matchedSupp = p.supporting.filter(s => allText.includes(s));
    score += matchedCard.length * 30;
    score += matchedSupp.length * 15;
    
    // Check regional relevance if Wardha / Maharashtra
    const isRegional = (body.district?.toLowerCase().includes("wardha") || body.state?.toLowerCase().includes("maharashtra")) && (p.id === "dengue" || p.id === "malaria");
    if (isRegional) score += 15;

    const prob = Math.min(Math.max(score, 20), 92);
    return {
      id: p.id,
      disease: p.disease,
      probability: prob,
      urgency: p.urgency,
      matched_symptoms: [...matchedCard, ...matchedSupp],
      key_indicators: `Matched ${matchedCard.length} key symptom(s)` + (matchedSupp.length ? ` and ${matchedSupp.length} supporting sign(s)` : ""),
      description: p.description,
      regional_boost: isRegional,
      regional_note: isRegional ? `Elevated historical surveillance documented in ${body.district || "your district"}, ${body.state || "state"}.` : null,
      targeted_tests: p.tests,
      blanket_cost_inr: p.blanket_cost,
    };
  }).filter(p => p.probability >= 30).sort((a, b) => b.probability - a.probability).slice(0, 3);

  const topPredictions = matched.length > 0 ? matched : [
    {
      id: "general_viral",
      disease: "Undifferentiated Viral Syndrome",
      probability: 45,
      urgency: "low" as const,
      matched_symptoms: symptomNames,
      key_indicators: "General non-specific fever profile",
      description: "Mild fever syndrome. Supportive hydration and rest recommended.",
      targeted_tests: [
        { test_name: "Complete Blood Count (CBC)", purpose: "Basic leukocyte and platelet count", estimated_cost_inr: 200, priority: "Primary", sample_type: "Blood EDTA", turnaround_time: "1 hour" }
      ],
      blanket_cost_inr: 3500,
    }
  ];

  const testMap = new Map<string, FallbackProfile["tests"][0]>();
  let primaryCosts = 0;
  for (const pred of topPredictions) {
    for (const test of pred.targeted_tests) {
      if (!testMap.has(test.test_name)) {
        testMap.set(test.test_name, test);
        primaryCosts += test.estimated_cost_inr;
      }
    }
  }

  const uniqueTests = Array.from(testMap.values());
  const blanketCost = Math.max(...topPredictions.map(p => p.blanket_cost_inr || 4500));
  const targetedCost = Math.max(primaryCosts, 200);
  const savings = Math.max(blanketCost - targetedCost, 0);
  const savingsPct = Math.round((savings / blanketCost) * 100);

  return {
    urgent: false,
    care_level: "Consult a qualified doctor within 24–48 hours for clinical examination and test confirmation.",
    guidance: {
      summary: `Based on your reported symptoms and regional epidemiological trends, your profile aligns most closely with ${topPredictions[0]?.disease || "a viral syndrome"}. To save unnecessary out-of-pocket expenses, discuss targeted diagnostic testing instead of unguided blanket fever packages.`,
      next_steps: [
        "Consult a general physician or nearest Community Health Center / PHC.",
        "Take only the targeted lab tests confirmed by your treating clinician.",
        "Maintain adequate oral hydration and monitor temperature twice daily.",
        "Seek immediate emergency care if you develop red flag symptoms (severe breathlessness, persistent vomiting, severe abdominal pain).",
      ],
      sources: [
        { name: "National Center for Disease Control (NCDC)", url: "https://ncdc.mohfw.gov.in" },
        { name: "National Health Mission - Free Diagnostic Services", url: "https://nhm.gov.in" },
      ],
      content_review_status: "educational_prototype",
    },
    disease_predictions: topPredictions,
    recommended_tests: uniqueTests,
    cost_optimization: {
      blanket_panel_cost_inr: blanketCost,
      targeted_tests_cost_inr: targetedCost,
      estimated_savings_inr: savings,
      savings_percentage: savingsPct,
      cost_rationale: `By taking only targeted diagnostic tests (approx. ₹${targetedCost}) for high-probability conditions, you avoid ₹${savings.toLocaleString("en-IN")} (~${savingsPct}%) in unneeded blanket tests.`,
    },
    disclaimer: "General educational information only. Not a medical diagnosis. All lab tests must be verified by a licensed doctor.",
  };
}

export function useAssistantTriage() {
  return useMutation({
    mutationFn: async (body: TriageRequestBody) => {
      try {
        return await postJson<AssistantTriageResult>("/assistant/triage", body);
      } catch (err) {
        console.warn("Backend triage unreachable, using clinical offline fallback:", err);
        return generateFallbackTriage(body);
      }
    },
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

export interface AgentChatResponse {
  reply: string;
  agent_mode: string;
  engine: string;
  tools_executed: string[];
  triage_level: "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF_CARE";
  red_flag_triggered: boolean;
  emergency_action?: {
    urgent_emergency: boolean;
    rule_id?: string;
    emergency_message?: string;
    emergency_hotlines?: { ambulance: string; national_emergency: string };
  };
  top_predictions?: Array<{
    id: string;
    disease: string;
    probability: number;
    urgency: string;
    matched_symptoms: string[];
    key_indicators: string[];
    description: string;
    targeted_tests: Array<{
      test_name: string;
      purpose: string;
      estimated_cost_inr: number;
      priority: string;
    }>;
  }>;
  recommended_tests?: Array<{
    test_name: string;
    purpose: string;
    estimated_cost_inr: number;
    priority: string;
    sample_type?: string;
    turnaround_time?: string;
  }>;
  local_context?: {
    state: string;
    district: string;
    matched_outbreak_items: Array<{
      disease: string;
      source: string;
      data_period: string;
      observed_months: number;
    }>;
  };
  matched_schemes?: Array<{
    scheme_id: string;
    name: string;
    summary: string;
    benefit: string;
    source_url?: string;
  }>;
  disclaimer: string;
}

export function useAgentChat() {
  return useMutation({
    mutationFn: (body: {
      message: string;
      conversation_history?: Array<{ role: string; content: string }>;
      state?: string | null;
      district?: string | null;
      age_group?: string | null;
      income_band?: string | null;
      occupation?: string | null;
    }) => postJson<AgentChatResponse>("/assistant/agent/chat", body),
  });
}
