import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";
import VoiceInput from "@/components/assistant/VoiceInput";
import AgenticAssistantSection from "@/components/assistant/AgenticAssistantSection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAssistantSession,
  exportAssistantHistory,
  readAssistantToken,
  revokeAssistantSession,
  useAssistantContext,
  useAssistantEntries,
  useAssistantTriage,
  useCreateAssistantEntry,
  useCreateAssistantCheckIn,
  useDeleteAssistantEntry,
  useAssistantCheckIns,
  useStructureSymptoms,
  useAgentChat,
  type AgentChatResponse,
} from "@/hooks/useAssistantApi";
import type { AssistantSymptom, StoredAssistantEntry } from "@/types/assistant";
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Droplet,
  ExternalLink,
  FlaskConical,
  HeartPulse,
  Info,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Minus,
  PhoneCall,
  Plus,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingDown,
  User,
  Zap,
} from "lucide-react";
import { INDIAN_STATES, POPULAR_DISTRICTS } from "@/data/indiaLocations";

const DISCLAIMER =
  "General educational information only. This is not a diagnosis or a substitute for professional clinical care. If you are experiencing a medical emergency, call 112 or visit the nearest hospital emergency room.";

function HistoryEntryCard({
  entry,
  token,
  onDelete,
}: {
  entry: StoredAssistantEntry;
  token: string;
  onDelete: (id: string) => void;
}) {
  const [newSymptoms, setNewSymptoms] = useState("");
  const checkIns = useAssistantCheckIns(token, entry.id);
  const createCheckIn = useCreateAssistantCheckIn(token);

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{new Date(entry.created_at).toLocaleString()}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {entry.symptoms.map((symptom) => symptom.name).join(", ") || "No structured symptoms"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.urgent ? "Urgent warning was triggered" : entry.care_level || "General information"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Stored until {new Date(entry.expires_at).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onDelete(entry.id)} className="border-border text-foreground">
          Delete
        </Button>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-primary">Follow up on this entry</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-foreground" htmlFor={`checkin-symptoms-${entry.id}`}>
            Any new symptoms? (optional)
          </label>
          <Input
            id={`checkin-symptoms-${entry.id}`}
            value={newSymptoms}
            maxLength={1200}
            onChange={(event) => setNewSymptoms(event.target.value)}
            className="border-border bg-secondary/40 text-foreground"
          />
          <div className="flex flex-wrap gap-2">
            {(["better", "same", "worse"] as const).map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                disabled={createCheckIn.isPending}
                onClick={() => createCheckIn.mutate({ entry_id: entry.id, status, symptoms_text: newSymptoms })}
                className="border-border text-foreground hover:bg-secondary"
              >
                {status[0].toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          {createCheckIn.error && (
            <Alert variant="destructive">
              <AlertDescription>{createCheckIn.error.message}</AlertDescription>
            </Alert>
          )}
          {createCheckIn.data?.urgent && (
            <Alert variant="destructive">
              <AlertTitle>Seek urgent medical care now</AlertTitle>
              <AlertDescription>{createCheckIn.data.message}</AlertDescription>
            </Alert>
          )}
          {createCheckIn.data?.message && !createCheckIn.data.urgent && (
            <Alert>
              <AlertDescription>{createCheckIn.data.message}</AlertDescription>
            </Alert>
          )}
          {checkIns.data && checkIns.data.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Symptom follow-up and tracking
              </p>
              <ol className="space-y-2">
                {checkIns.data.map((checkin) => (
                  <li key={checkin.id} className="text-sm text-foreground">
                    <span className="font-medium">
                      {new Date(checkin.created_at).toLocaleDateString()} · {checkin.status}
                    </span>
                    {checkin.symptoms_text && (
                      <span className="block text-xs text-muted-foreground">
                        New symptoms reported: {checkin.symptoms_text}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {checkIns.error && <p className="text-xs text-destructive">{checkIns.error.message}</p>}
        </div>
      </details>
    </div>
  );
}

export default function HealthAssistant() {
  const [text, setText] = useState("");
  const [draftSymptoms, setDraftSymptoms] = useState<AssistantSymptom[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { profile, completion } = useHealthProfile();
  const [state, setState] = useState(profile.state || "");
  const [district, setDistrict] = useState(profile.district || "");
  const [demoScenario, setDemoScenario] = useState(false);
  const [structured, setStructured] = useState(false);
  const [acknowledged, setAcknowledged] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(() => readAssistantToken());
  const [storageConsent, setStorageConsent] = useState<boolean>(() => Boolean(readAssistantToken()));
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storagePending, setStoragePending] = useState(false);

  const structure = useStructureSymptoms();
  const triage = useAssistantTriage();
  const entries = useAssistantEntries(sessionToken);
  const createEntry = useCreateAssistantEntry(sessionToken);
  const deleteEntry = useDeleteAssistantEntry(sessionToken);
  const queryClient = useQueryClient();

  const result = triage.data;
  const hasArea = Boolean(state.trim() && district.trim());
  const context = useAssistantContext(state, district, Boolean(result && !result.urgent && hasArea));

  const archiveThrough = context.data?.items
    .map((item) => item.data_period.split(" to ")[1] ?? "")
    .filter(Boolean)
    .sort()
    .at(-1);

  const invalidDuration = draftSymptoms.some(
    (symptom) =>
      symptom.duration_days !== undefined &&
      (!Number.isInteger(symptom.duration_days) || symptom.duration_days < 0 || symptom.duration_days > 365)
  );

  useEffect(() => {
    if (profile.state && !state) setState(profile.state);
    if (profile.district && !district) setDistrict(profile.district);
  }, [profile.state, profile.district]);

  useEffect(() => {
    if (entries.error?.message.includes("session expired")) {
      setSessionToken(null);
      setStorageConsent(false);
      setStorageError(entries.error.message);
      queryClient.removeQueries({ queryKey: ["assistantEntries", sessionToken] });
      queryClient.removeQueries({ queryKey: ["assistantCheckins", sessionToken] });
    }
  }, [entries.error, queryClient, sessionToken]);

  const currentStep = result ? 4 : structured ? 3 : text.trim() ? 2 : 1;

  const startOver = () => {
    setText("");
    setDraftSymptoms([]);
    setAnswers({});
    setState(profile.state || "");
    setDistrict(profile.district || "");
    setDemoScenario(false);
    setStructured(false);
    structure.reset();
    triage.reset();
    createEntry.reset();
  };

  const handleStructure = async () => {
    triage.reset();
    try {
      const data = await structure.mutateAsync(text);
      setDraftSymptoms(data.symptoms.map((item) => ({ ...item, name: item.name.replaceAll("_", " ") })));
      setStructured(true);
    } catch {
      const words = text
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter((w) =>
          ["fever", "headache", "chills", "cough", "pain", "nausea", "vomiting", "fatigue", "rash", "sweating", "eye"].includes(w)
        );
      const extracted = words.length > 0 ? Array.from(new Set(words)) : ["fever", "headache"];
      setDraftSymptoms(extracted.map((w) => ({ name: w, reported: true })));
      setStructured(true);
    }
  };

  const updateSymptom = (index: number, value: string) => {
    setDraftSymptoms((items) => items.map((item, i) => (i === index ? { ...item, name: value } : item)));
  };

  const updateDuration = (index: number, value: string) => {
    const duration = value === "" ? undefined : Math.max(0, Math.min(365, Number(value)));
    setDraftSymptoms((items) => items.map((item, i) => (i === index ? { ...item, duration_days: duration } : item)));
  };

  const incrementDuration = (index: number) => {
    setDraftSymptoms((items) =>
      items.map((item, i) => {
        if (i !== index) return item;
        const current = item.duration_days ?? 0;
        return { ...item, duration_days: Math.min(365, current + 1) };
      })
    );
  };

  const decrementDuration = (index: number) => {
    setDraftSymptoms((items) =>
      items.map((item, i) => {
        if (i !== index) return item;
        const current = item.duration_days ?? 0;
        return { ...item, duration_days: Math.max(0, current - 1) };
      })
    );
  };

  const updateSeverity = (index: number, value: string) => {
    setDraftSymptoms((items) =>
      items.map((item, i) => (i === index ? { ...item, severity: value as AssistantSymptom["severity"] } : item))
    );
  };

  const removeSymptom = (index: number) => setDraftSymptoms((items) => items.filter((_, i) => i !== index));

  const addSymptom = () => setDraftSymptoms((items) => [...items, { name: "", reported: true }]);

  const loadDemoScenario = () => {
    setText("I have had high fever, severe eye pain behind eyeballs, headache, and severe body ache for 3 days.");
    setState("Maharashtra");
    setDistrict("Wardha");
    setDemoScenario(true);
    setDraftSymptoms([
      { name: "fever", reported: true, duration_days: 3, severity: "severe" },
      { name: "eye pain", reported: true, duration_days: 3, severity: "severe" },
      { name: "headache", reported: true, duration_days: 3, severity: "moderate" },
      { name: "body ache", reported: true, duration_days: 3, severity: "moderate" },
    ]);
    setStructured(true);
    structure.reset();
    triage.reset();
  };

  const submitTriage = (answerOverrides?: Record<string, string | null>) => {
    const validSymptoms = draftSymptoms.filter((symptom) => symptom.name.trim());
    triage.mutate({
      original_text: text,
      symptoms: validSymptoms.map(({ name, duration_days, severity }) => ({ name: name.trim(), duration_days, severity })),
      answers: answerOverrides ?? Object.fromEntries(Object.entries(answers).map(([id, answer]) => [id, answer || null])),
      state: state.trim() || profile.state,
      district: district.trim() || profile.district,
      age_group: profile.ageGroup,
      gender: profile.gender,
    });
  };

  const setStorageChoice = async (enabled: boolean) => {
    setStorageError(null);
    setStoragePending(true);
    try {
      if (enabled) {
        if (!sessionToken) {
          const session = await createAssistantSession();
          setSessionToken(session.access_token);
        }
        setStorageConsent(true);
      } else {
        if (sessionToken) await revokeAssistantSession(sessionToken);
        queryClient.removeQueries({ queryKey: ["assistantEntries", sessionToken] });
        queryClient.removeQueries({ queryKey: ["assistantCheckins", sessionToken] });
        setSessionToken(null);
        setStorageConsent(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the storage choice.";
      setStorageError(message);
      if (message.includes("session")) {
        setSessionToken(null);
        setStorageConsent(false);
      }
    } finally {
      setStoragePending(false);
    }
  };

  const saveCurrentEntry = () => {
    if (!result || !sessionToken) return;
    createEntry.mutate({
      symptoms: draftSymptoms.filter((symptom) => symptom.name.trim()),
      answers: Object.fromEntries(Object.entries(answers).map(([id, answer]) => [id, answer || null])),
      care_level: result.care_level ?? null,
      urgent: result.urgent,
      guidance: result.urgent ? { message: result.message, next_steps: result.next_steps } : result.guidance ?? {},
    });
  };

  const handleExport = async () => {
    if (!sessionToken) return;
    try {
      const blob = await exportAssistantHistory(sessionToken);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "epidemai-health-history.json";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Could not export history.");
    }
  };

  const handleDeleteAll = async () => {
    if (!sessionToken || !window.confirm("Delete this session and all saved entries and check-ins? This cannot be undone.")) return;
    await setStorageChoice(false);
  };

  const stateDistricts = state ? POPULAR_DISTRICTS[state] || [] : [];

  return (
    <HealthPortalLayout>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        {/* Top Header Card */}
        <header className="mb-8 rounded-3xl border border-border bg-gradient-to-b from-card to-card/70 p-6 shadow-[var(--shadow-card)] backdrop-blur-md sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <HeartPulse className="h-3.5 w-3.5" /> Clinical Symptom Triage & Cost Optimizer
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
                Symptom Assessment &{" "}
                <span className="text-primary">
                  Targeted Diagnostics
                </span>
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground max-w-4xl">
                Share your symptoms and duration. The clinical engine evaluates disease probabilities against regional
                surveillance data so you take <strong>targeted diagnostic tests only</strong>, avoiding ₹3,000–₹5,000 blanket panels.
              </p>
            </div>

            {/* Quick Demo Action & Value Pillars to fill right side */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end lg:w-72 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadDemoScenario}
                className="w-full sm:w-auto lg:w-full min-h-11 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all rounded-xl font-semibold shadow-sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Load Dengue Sample Case
              </Button>
              <div className="w-full rounded-2xl border border-border/70 bg-secondary/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cost Optimization Target</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Save up to <strong className="text-emerald-400 font-semibold">80% on lab expenses</strong> by targeting specific viral & bacterial antigens.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Animated Stepper */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
              {[
                { step: 1, label: "Profile & Area" },
                { step: 2, label: "Describe" },
                { step: 3, label: "Review Signs" },
                { step: 4, label: "Prediction & Tests" },
              ].map(({ step, label }) => {
                const isActive = currentStep === step;
                const isPassed = currentStep > step;
                return (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        isPassed
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                          : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md shadow-primary/20"
                          : "border border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {isPassed ? <Check className="h-4 w-4" /> : step}
                    </div>
                    <span className={`text-[11px] leading-tight ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        {/* Patient Profile Context Chip */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/25 to-teal-500/10 border border-primary/30 text-primary font-bold">
                {profile.displayName ? profile.displayName[0].toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {profile.displayName || "Guest Patient"}
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {profile.ageGroup ? `${profile.ageGroup.replace("_", " ")} yrs` : "All ages"}
                    {profile.gender ? ` • ${profile.gender}` : ""}
                    {profile.bloodGroup ? ` • ${profile.bloodGroup}` : ""}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    ({completion}% profile ready)
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {profile.address ? `${profile.address}, ` : ""}
                  {district ? `${district}, ` : ""}{state || "Area not selected"}
                </p>
              </div>
            </div>

            <Link
              to="/health-profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Update Profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* AI Assistance Navigation Banner */}
        <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Looking for conversational AI triage?</span>
                  <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Track 2 Live
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Try our new personal health assistant with clinical triage, red-flag escalation, and PM-JAY matching.
                </p>
              </div>
            </div>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shrink-0 self-start sm:self-auto shadow-sm transition-all"
            >
              <span>Open AI Assistance</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Clinical Disclaimer Alert */}
        <Alert className="mb-6 rounded-2xl border-warning/30 bg-warning/10 text-foreground [&>svg]:text-warning">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-semibold text-warning">Diagnostic Guidance Notice</AlertTitle>
          <AlertDescription className="leading-6 text-muted-foreground">{DISCLAIMER}</AlertDescription>
        </Alert>

            {/* STEP 1 & 2: SYMPTOM INPUT FORM */}
            <AnimatePresence mode="wait">
              {!result && (
                <motion.div
                  key="input-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
              <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-[var(--shadow-card)]">
                <CardHeader className="border-b border-border bg-card/60 px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <HeartPulse className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-xl text-foreground sm:text-2xl">Describe your symptoms</CardTitle>
                      <CardDescription className="mt-1 leading-6 text-muted-foreground">
                        Type or speak how you are feeling, when the fever/pain started, and associated signs like chills, vomiting, or eye pain.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-5 py-5 sm:px-7 sm:py-7">
                  <div className="space-y-2">
                    <label htmlFor="symptom-text" className="text-sm font-semibold text-foreground">
                      What are you experiencing?
                    </label>
                    <VoiceInput
                      value={text}
                      onChange={(value) => {
                        setText(value);
                        setDemoScenario(false);
                        setStructured(false);
                      }}
                    />
                    <Textarea
                      id="symptom-text"
                      value={text}
                      onChange={(event) => {
                        setText(event.target.value);
                        setDemoScenario(false);
                        setStructured(false);
                      }}
                      maxLength={2000}
                      placeholder="For example: I have had continuous high fever, severe eye pain behind eyeballs, headache, and body aches for 3 days…"
                      className="min-h-36 resize-y rounded-2xl border-border bg-secondary/30 p-4 text-base leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                    <p className="text-right text-xs text-muted-foreground">{text.length}/2000 characters</p>
                  </div>

                  {!structured ? (
                    <Button
                      onClick={handleStructure}
                      disabled={!acknowledged || !text.trim() || structure.isPending}
                      className="min-h-12 rounded-xl bg-primary px-7 font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
                    >
                      {structure.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Review Symptom Signs & Duration <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.35 }}
                      className="space-y-6"
                    >
                      {/* Structured Review Chips */}
                      <section className="space-y-4 rounded-2xl border border-primary/25 bg-secondary/30 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-base font-semibold text-foreground">
                              Confirm Detected Symptoms & Days
                            </h2>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">
                              Onset duration (days) determines whether early antigen or late antibody testing is most accurate.
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary">
                            {draftSymptoms.length} signs detected
                          </span>
                        </div>

                        {draftSymptoms.map((symptom, index) => (
                          <motion.div
                            key={`${index}-${symptom.name}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[minmax(0,1.2fr)_145px_225px_auto] items-center"
                          >
                            <Input
                              aria-label={`Reported symptom ${index + 1}`}
                              value={symptom.name}
                              onChange={(event) => updateSymptom(index, event.target.value)}
                              placeholder="e.g. fever, joint pain"
                              maxLength={80}
                              className="border-0 bg-secondary/30 text-foreground shadow-none font-medium rounded-xl h-10 px-3 focus-visible:ring-1 focus-visible:ring-ring"
                            />

                            {/* Plus / Minus Day Stepper */}
                            <div className="flex h-10 items-center justify-between rounded-xl border border-border bg-secondary/40 p-1">
                              <button
                                type="button"
                                onClick={() => decrementDuration(index)}
                                disabled={(symptom.duration_days ?? 0) <= 0}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                title="Decrease days"
                                aria-label={`Decrease days for symptom ${index + 1}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <div className="flex items-center gap-1 px-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={365}
                                  aria-label={`Duration in days for symptom ${index + 1}`}
                                  value={symptom.duration_days ?? ""}
                                  onChange={(event) => updateDuration(index, event.target.value)}
                                  placeholder="0"
                                  className="w-7 border-none bg-transparent text-center font-bold text-foreground focus:outline-none focus:ring-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[11px] font-medium text-muted-foreground select-none">
                                  {(symptom.duration_days ?? 0) === 1 ? "day" : "days"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => incrementDuration(index)}
                                disabled={(symptom.duration_days ?? 0) >= 365}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                title="Increase days"
                                aria-label={`Increase days for symptom ${index + 1}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* 3 Color-Coded Severity Buttons: Green (Mild), Yellow (Moderate), Red (Severe) */}
                            <div className="flex h-10 items-center rounded-xl border border-border bg-secondary/30 p-1 gap-1">
                              <button
                                type="button"
                                onClick={() => updateSeverity(index, symptom.severity === "mild" ? "" : "mild")}
                                className={`flex-1 h-8 rounded-lg px-2 text-xs font-semibold transition-all duration-200 border flex items-center justify-center gap-1.5 active:scale-95 ${
                                  symptom.severity === "mild"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    : "border-transparent bg-transparent text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                                }`}
                                aria-pressed={symptom.severity === "mild"}
                                title="Mild severity"
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${symptom.severity === "mild" ? "bg-emerald-400 ring-2 ring-emerald-400/30" : "bg-emerald-500/40"}`} />
                                Mild
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSeverity(index, symptom.severity === "moderate" ? "" : "moderate")}
                                className={`flex-1 h-8 rounded-lg px-2 text-xs font-semibold transition-all duration-200 border flex items-center justify-center gap-1.5 active:scale-95 ${
                                  symptom.severity === "moderate"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    : "border-transparent bg-transparent text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
                                }`}
                                aria-pressed={symptom.severity === "moderate"}
                                title="Moderate severity"
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${symptom.severity === "moderate" ? "bg-amber-300 ring-2 ring-amber-300/30" : "bg-amber-500/40"}`} />
                                Moderate
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSeverity(index, symptom.severity === "severe" ? "" : "severe")}
                                className={`flex-1 h-8 rounded-lg px-2 text-xs font-semibold transition-all duration-200 border flex items-center justify-center gap-1.5 active:scale-95 ${
                                  symptom.severity === "severe"
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                    : "border-transparent bg-transparent text-muted-foreground hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                                }`}
                                aria-pressed={symptom.severity === "severe"}
                                title="Severe severity"
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${symptom.severity === "severe" ? "bg-rose-400 ring-2 ring-rose-400/30" : "bg-rose-500/40"}`} />
                                Severe
                              </button>
                            </div>

                            {/* Delete / Remove Action Button */}
                            <button
                              type="button"
                              onClick={() => removeSymptom(index)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                              title="Remove symptom"
                              aria-label={`Remove symptom ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={addSymptom}
                          className="border-border text-foreground hover:bg-secondary"
                        >
                          + Add another symptom
                        </Button>
                      </section>

                      {/* Area Surveillance Inputs */}
                      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="text-sm font-semibold text-foreground">
                              Surveillance Area <span className="text-destructive">*</span>
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Maps against active state and district outbreak records to calculate disease match probability.
                            </p>
                          </div>
                          <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            District Linkage
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label htmlFor="assistant-state" className="text-xs font-semibold text-foreground">
                              State / UT <span className="text-destructive">*</span>
                            </label>
                            <select
                              id="assistant-state"
                              className="min-h-11 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground"
                              value={state}
                              onChange={(event) => {
                                setState(event.target.value);
                                setDistrict("");
                                setDemoScenario(false);
                              }}
                            >
                              <option value="" className="bg-card text-foreground">Select State</option>
                              {INDIAN_STATES.map((s) => (
                                <option key={s} value={s} className="bg-card text-foreground">
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="assistant-district" className="text-xs font-semibold text-foreground">
                              District <span className="text-destructive">*</span>
                            </label>
                            {stateDistricts.length > 0 ? (
                              <select
                                id="assistant-district"
                                className="min-h-11 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground"
                                value={district}
                                onChange={(event) => {
                                  setDistrict(event.target.value);
                                  setDemoScenario(false);
                                }}
                              >
                                <option value="" className="bg-card text-foreground">Select District</option>
                                {stateDistricts.map((d) => (
                                  <option key={d} value={d} className="bg-card text-foreground">
                                    {d}
                                  </option>
                                ))}
                                <option value="Other" className="bg-card text-foreground">Other</option>
                              </select>
                            ) : (
                              <Input
                                id="assistant-district"
                                required
                                value={district}
                                onChange={(event) => {
                                  setDistrict(event.target.value);
                                  setDemoScenario(false);
                                }}
                                maxLength={100}
                                placeholder="e.g. Wardha"
                                className="rounded-xl border-border bg-secondary/40 text-foreground"
                              />
                            )}
                          </div>
                        </div>
                      </section>

                      {/* Submit Action */}
                      <Button
                        onClick={() => submitTriage()}
                        disabled={triage.isPending || invalidDuration || !state.trim() || !district.trim()}
                        className="min-h-12 w-full rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all sm:w-auto"
                      >
                        {triage.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Evaluating Regional Outbreak Patterns…
                          </>
                        ) : (
                          <>
                            Predict Probable Conditions & Targeted Tests <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULTS SECTION WITH FLUID ANIMATIONS */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-6"
            >
              {result.urgent ? (
                <Alert variant="destructive" className="border-2 rounded-2xl bg-destructive/15">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="text-lg font-bold">Seek Urgent Emergency Medical Care</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>{result.message}</p>
                    <ul className="list-disc pl-5">
                      {result.next_steps?.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Result Header Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold">
                        <Zap className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Triage Assessment Generated For
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {profile.displayName || "Patient"} • {profile.ageGroup ? `${profile.ageGroup.replace("_", " ")} yrs` : "Adult"}
                          {profile.gender ? ` • ${profile.gender}` : ""} • {district}, {state}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startOver}
                      className="border-border text-foreground hover:bg-secondary"
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" /> Start Over
                    </Button>
                  </div>

                  {/* 1. PROBABLE CONDITIONS RANKING */}
                  {result.disease_predictions && result.disease_predictions.length > 0 && (
                    <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-[var(--shadow-card)]">
                      <CardHeader className="border-b border-border bg-secondary/30 px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                              <HeartPulse className="h-5 w-5 text-primary" />
                              Probable Clinical Conditions & Likelihood
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Correlated from your {draftSymptoms.length} reported symptom(s) and regional surveillance in {district}, {state}.
                            </CardDescription>
                          </div>
                          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            Differential Matrix
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-5 sm:p-6">
                        {result.disease_predictions.map((pred, i) => {
                          const isHigh = pred.probability >= 70;
                          const isMed = pred.probability >= 50 && pred.probability < 70;
                          const barColor = isHigh ? "bg-emerald-500" : isMed ? "bg-amber-500" : "bg-primary";
                          const badgeColor = isHigh ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : isMed ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-primary/40 bg-primary/10 text-primary";

                          return (
                            <motion.div
                              key={pred.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: i * 0.08 }}
                              className="rounded-2xl border border-border bg-secondary/20 p-4 transition-all hover:border-primary/40"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <h3 className="text-base font-bold text-foreground">{pred.disease}</h3>
                                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
                                    {pred.probability}% Match
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Clinical Urgency: <strong className={pred.urgency === "high" ? "text-destructive" : pred.urgency === "moderate" ? "text-warning" : "text-foreground"}>{pred.urgency}</strong>
                                </span>
                              </div>

                              {/* Animated Progress Meter */}
                              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                                <motion.div
                                  className={`h-full rounded-full ${barColor}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pred.probability}%` }}
                                  transition={{ duration: 0.75, ease: "easeOut", delay: i * 0.1 }}
                                />
                              </div>

                              <p className="mt-2.5 text-xs leading-5 text-muted-foreground">{pred.description}</p>

                              {/* Matched symptoms tags */}
                              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-foreground">Matched Signs:</span>
                                {pred.matched_symptoms.map((s) => (
                                  <span
                                    key={s}
                                    className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-foreground font-medium"
                                  >
                                    {s}
                                  </span>
                                ))}
                                <span className="ml-auto text-xs font-medium text-primary">
                                  {pred.key_indicators}
                                </span>
                              </div>

                              {/* Outbreak surveillance flag */}
                              {pred.regional_boost && (
                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-xs text-foreground">
                                  <ShieldAlert className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                  <span>{pred.regional_note || `Documented historical surveillance reports recorded in ${district}, ${state}.`}</span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* 2. TARGETED DIAGNOSTIC TESTS CHECKLIST */}
                  {result.recommended_tests && result.recommended_tests.length > 0 && (
                    <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-[var(--shadow-card)]">
                      <CardHeader className="border-b border-border bg-secondary/30 px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                              <FlaskConical className="h-5 w-5 text-primary" />
                              Targeted Diagnostic Tests (Cost-Saving Protocol)
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Order <strong>only these specific tests</strong> for your high-probability conditions rather than a broad blanket panel.
                            </CardDescription>
                          </div>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                            Focused Strategy
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 sm:p-6">
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          {result.recommended_tests.map((test, index) => (
                            <motion.div
                              key={test.test_name}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.06 }}
                              className="flex flex-col justify-between rounded-2xl border border-border bg-secondary/30 p-4 transition-all hover:border-primary/40"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-foreground text-sm leading-snug">
                                    {test.test_name}
                                  </h4>
                                  <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                                    {test.priority}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                  {test.purpose}
                                </p>
                              </div>

                              <div className="mt-4 border-t border-border pt-3">
                                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-primary" /> {test.turnaround_time}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    Sample: {test.sample_type}
                                  </span>
                                </div>
                                <div className="mt-2.5 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Est. Private Cost:</span>
                                  <span className="font-bold text-foreground text-sm">
                                    {test.estimated_cost_inr > 0 ? `₹${test.estimated_cost_inr.toLocaleString("en-IN")}` : "Free / Clinical Exam"}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 3. COST OPTIMIZATION & PATIENT SAVINGS BREAKDOWN */}
                  {result.cost_optimization && (
                    <Card className="overflow-hidden rounded-3xl border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-card shadow-[var(--shadow-card)]">
                      <CardHeader className="border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-emerald-400" />
                            <CardTitle className="text-xl text-foreground">
                              Out-of-Pocket Diagnostic Cost Optimization
                            </CardTitle>
                          </div>
                          <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                            <BadgePercent className="h-3.5 w-3.5" />
                            Save ~{result.cost_optimization.savings_percentage}%
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5 p-5 sm:p-6">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-border bg-card p-4 text-center">
                            <span className="text-xs font-medium text-muted-foreground">Blanket Febrile Panel</span>
                            <p className="mt-1 text-xl font-bold text-muted-foreground line-through">
                              ₹{result.cost_optimization.blanket_panel_cost_inr.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Tests 10+ unrelated pathogens</p>
                          </div>

                          <div className="rounded-2xl border border-primary/40 bg-card p-4 text-center">
                            <span className="text-xs font-semibold text-primary">Targeted Tests Strategy</span>
                            <p className="mt-1 text-2xl font-bold text-primary">
                              ₹{result.cost_optimization.targeted_tests_cost_inr.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[11px] text-primary/80 mt-0.5">Focuses on high-probability causes</p>
                          </div>

                          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
                            <span className="text-xs font-semibold text-emerald-400">Estimated Patient Savings</span>
                            <p className="mt-1 text-2xl font-black text-emerald-400">
                              ₹{result.cost_optimization.estimated_savings_inr.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[11px] text-emerald-300 mt-0.5">
                              ~{result.cost_optimization.savings_percentage}% reduction in cost
                            </p>
                          </div>
                        </div>

                        {/* Animated Savings Comparison Fill */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Out-of-Pocket Retained:</span>
                            <span className="text-emerald-400 font-bold">
                              ₹{result.cost_optimization.estimated_savings_inr.toLocaleString("en-IN")} retained in patient pocket
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.cost_optimization.savings_percentage}%` }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        <p className="rounded-xl border border-border bg-card p-3.5 text-xs leading-relaxed text-muted-foreground">
                          💡 <strong>Clinical Cost Rationale:</strong> {result.cost_optimization.cost_rationale}
                        </p>

                        {/* Government Free Diagnostic Schemes Banner */}
                        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                100% Free Testing Under Government Schemes
                              </h4>
                              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                                Under <strong>Ayushman Bharat (AB-PMJAY)</strong> and the <strong>National Health Mission (NHM) Free Diagnostics Service Initiative</strong>, targeted tests like Complete Blood Count (CBC), Dengue NS1/IgM, and Malaria RDTs are provided <strong>100% free of charge</strong> at government Community Health Centers (CHCs) and District Civil Hospitals.
                              </p>
                            </div>
                            <Link
                              to="/health-schemes"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                            >
                              Find Free Testing Centers <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 4. CLINICAL GUIDANCE & NEXT STEPS */}
                  <Card className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
                    <CardHeader className="border-b border-border bg-card px-5 py-4 sm:px-6">
                      <CardTitle className="text-lg text-foreground">Doctor Discussion Guide & Next Steps</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Take this checklist to your clinician appointment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5 sm:p-6">
                      <p className="text-sm text-foreground leading-6">{result.guidance?.summary}</p>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Recommended Clinical Next Steps
                        </h4>
                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                          {result.guidance?.next_steps?.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Follow-up question if any */}
                      {result.follow_up_questions && result.follow_up_questions.length > 0 && (
                        <div className="space-y-3 border-t border-border pt-4">
                          <h4 className="text-sm font-semibold text-foreground">
                            Additional questions to organize your clinic visit
                          </h4>
                          {result.follow_up_questions.map((question) => (
                            <div key={question.id} className="space-y-1">
                              <label htmlFor={question.id} className="text-sm text-foreground">
                                {question.text}
                              </label>
                              <Input
                                id={question.id}
                                value={answers[question.id] ?? ""}
                                maxLength={300}
                                onChange={(event) => setAnswers((old) => ({ ...old, [question.id]: event.target.value }))}
                                className="border-border bg-secondary/40 text-foreground"
                              />
                            </div>
                          ))}
                          <Button
                            onClick={() => submitTriage()}
                            variant="outline"
                            disabled={triage.isPending}
                            className="border-border text-foreground hover:bg-secondary"
                          >
                            {triage.isPending ? "Refining…" : "Update Triage Answers"}
                          </Button>
                        </div>
                      )}

                      {/* Save to history */}
                      {storageConsent && (
                        <div className="border-t border-border pt-4">
                          <Button
                            onClick={saveCurrentEntry}
                            disabled={createEntry.isPending || Boolean(createEntry.data)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {createEntry.isPending ? "Saving…" : createEntry.data ? "✓ Saved to my health history" : "Save this assessment to history"}
                          </Button>
                          {createEntry.error && <p role="alert" className="mt-2 text-sm text-destructive">{createEntry.error.message}</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Local History Section */}
        {storageConsent && sessionToken && (
          <Card id="history" className="mt-8 rounded-3xl border-border bg-card shadow-[var(--shadow-card)]">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">My Health History</CardTitle>
              <CardDescription className="text-muted-foreground">
                Saved locally for up to 30 days. You can export or delete anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExport} disabled={!entries.data?.length} className="border-border text-foreground hover:bg-secondary">
                  Export JSON
                </Button>
                <Button variant="destructive" onClick={() => void handleDeleteAll()}>
                  Delete all saved data
                </Button>
              </div>
              {entries.isLoading && <p className="text-sm text-muted-foreground">Loading saved entries…</p>}
              {entries.error && <Alert variant="destructive"><AlertDescription>{entries.error.message}</AlertDescription></Alert>}
              {entries.data?.length === 0 && <p className="text-sm text-muted-foreground">No saved entries yet.</p>}
              {entries.data?.map((entry) => (
                <HistoryEntryCard key={entry.id} entry={entry} token={sessionToken} onDelete={(id) => deleteEntry.mutate(id)} />
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </HealthPortalLayout>
  );
}
