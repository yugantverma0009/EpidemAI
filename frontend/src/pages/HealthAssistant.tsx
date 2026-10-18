import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";
import VoiceInput from "@/components/assistant/VoiceInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAssistantSession, exportAssistantHistory, readAssistantToken, revokeAssistantSession, useAssistantContext, useAssistantEntries, useAssistantTriage, useCreateAssistantEntry, useCreateAssistantCheckIn, useDeleteAssistantEntry, useAssistantCheckIns, useStructureSymptoms } from "@/hooks/useAssistantApi";
import type { AssistantSymptom, StoredAssistantEntry } from "@/types/assistant";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  FileCheck,
  HeartPulse,
  Info,
  Loader2,
  LockKeyhole,
  MapPin,
  PiggyBank,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  UserCheck,
} from "lucide-react";

const DISCLAIMER = "General information only. This is not a diagnosis or a substitute for professional care. If you may be having an emergency, contact local emergency services or go to the nearest hospital.";

function HistoryEntryCard({ entry, token, onDelete }: { entry: StoredAssistantEntry; token: string; onDelete: (id: string) => void }) {
  const [newSymptoms, setNewSymptoms] = useState("");
  const checkIns = useAssistantCheckIns(token, entry.id);
  const createCheckIn = useCreateAssistantCheckIn(token);
  return <div className="rounded-lg border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-semibold">{new Date(entry.created_at).toLocaleString()}</p><p className="mt-1 text-sm">{entry.symptoms.map((symptom) => symptom.name).join(", ") || "No structured symptoms"}</p><p className="mt-1 text-xs text-muted-foreground">{entry.urgent ? "Urgent warning was triggered" : entry.care_level || "General information"}</p><p className="mt-1 text-xs text-muted-foreground">Stored until {new Date(entry.expires_at).toLocaleString()}</p></div>
      <Button variant="outline" size="sm" onClick={() => onDelete(entry.id)}>Delete</Button>
    </div>
    <details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Follow up on this entry</summary>
      <div className="mt-3 space-y-3">
        <label className="block text-sm" htmlFor={`checkin-symptoms-${entry.id}`}>Any new symptoms? (optional)</label>
        <Input id={`checkin-symptoms-${entry.id}`} value={newSymptoms} maxLength={1200} onChange={(event) => setNewSymptoms(event.target.value)} />
        <div className="flex flex-wrap gap-2">{(["better", "same", "worse"] as const).map((status) => <Button key={status} variant="outline" size="sm" disabled={createCheckIn.isPending} onClick={() => createCheckIn.mutate({ entry_id: entry.id, status, symptoms_text: newSymptoms })}>{status[0].toUpperCase() + status.slice(1)}</Button>)}</div>
        {createCheckIn.error && <Alert variant="destructive"><AlertDescription>{createCheckIn.error.message}</AlertDescription></Alert>}
        {createCheckIn.data?.urgent && <Alert variant="destructive"><AlertTitle>Seek urgent medical care now</AlertTitle><AlertDescription>{createCheckIn.data.message}</AlertDescription></Alert>}
        {createCheckIn.data?.message && !createCheckIn.data.urgent && <Alert><AlertDescription>{createCheckIn.data.message}</AlertDescription></Alert>}
        {checkIns.data && checkIns.data.length > 0 && <div className="border-t pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Symptom follow-up and tracking</p><ol className="space-y-2">{checkIns.data.map((checkin) => <li key={checkin.id} className="text-sm"><span className="font-medium">{new Date(checkin.created_at).toLocaleDateString()} · {checkin.status}</span>{checkin.symptoms_text && <span className="block text-xs text-muted-foreground">New symptoms reported: {checkin.symptoms_text}</span>}</li>)}</ol></div>}
        {checkIns.error && <p className="text-xs text-destructive">{checkIns.error.message}</p>}
      </div>
    </details>
  </div>;
}

export default function HealthAssistant() {
  const [text, setText] = useState("");
  const [draftSymptoms, setDraftSymptoms] = useState<AssistantSymptom[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { profile } = useHealthProfile();
  const [state, setState] = useState(profile.state);
  const [district, setDistrict] = useState(profile.district);
  const [demoScenario, setDemoScenario] = useState(false);
  const [structured, setStructured] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
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
  const invalidDuration = draftSymptoms.some((symptom) => symptom.duration_days !== undefined && (!Number.isInteger(symptom.duration_days) || symptom.duration_days < 0 || symptom.duration_days > 365));

  useEffect(() => {
    if (entries.error?.message.includes("session expired")) {
      setSessionToken(null);
      setStorageConsent(false);
      setStorageError(entries.error.message);
      queryClient.removeQueries({ queryKey: ["assistantEntries", sessionToken] });
      queryClient.removeQueries({ queryKey: ["assistantCheckins", sessionToken] });
    }
  }, [entries.error, queryClient, sessionToken]);

  const startOver = () => {
    setText("");
    setDraftSymptoms([]);
    setAnswers({});
    setState(profile.state);
    setDistrict(profile.district);
    setDemoScenario(false);
    setStructured(false);
    structure.reset();
    triage.reset();
    createEntry.reset();
  };

  const handleStructure = async () => {
    triage.reset();
    const data = await structure.mutateAsync(text);
    setDraftSymptoms(data.symptoms.map((item) => ({ ...item, name: item.name.replaceAll("_", " ") })));
    setStructured(true);
  };

  const updateSymptom = (index: number, value: string) => {
    setDraftSymptoms((items) => items.map((item, i) => i === index ? { ...item, name: value } : item));
  };

  const updateDuration = (index: number, value: string) => {
    const duration = value === "" ? undefined : Number(value);
    setDraftSymptoms((items) => items.map((item, i) => i === index ? { ...item, duration_days: duration } : item));
  };

  const updateSeverity = (index: number, value: string) => {
    setDraftSymptoms((items) => items.map((item, i) => i === index ? { ...item, severity: value as AssistantSymptom["severity"] } : item));
  };

  const removeSymptom = (index: number) => setDraftSymptoms((items) => items.filter((_, i) => i !== index));

  const addSymptom = () => setDraftSymptoms((items) => [...items, { name: "", reported: true }]);

  const loadDemoScenario = () => {
    setText("I have had a fever, headache, and body pain for two days.");
    setState("Maharashtra");
    setDistrict("Wardha");
    setDemoScenario(true);
    setStructured(false);
    setDraftSymptoms([]);
    structure.reset();
    triage.reset();
  };

  const submitTriage = (answerOverrides?: Record<string, string | null>) => {
    const validSymptoms = draftSymptoms.filter((symptom) => symptom.name.trim());
    triage.mutate({
      original_text: text,
      symptoms: validSymptoms.map(({ name, duration_days, severity }) => ({ name: name.trim(), duration_days, severity })),
      answers: answerOverrides ?? Object.fromEntries(Object.entries(answers).map(([id, answer]) => [id, answer || null])),
      state: state.trim() || undefined,
      district: district.trim() || undefined,
      age_group: profile.ageGroup || undefined,
      gender: profile.gender || undefined,
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

  return (
    <HealthPortalLayout>
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-9">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <HeartPulse className="h-3.5 w-3.5" /> Personal Health Assistant
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Let’s understand what you’re experiencing</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Share your symptoms and get general information about possible next steps. You stay in control of what you share and whether anything is saved.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground"><span className="rounded-full bg-secondary px-3 py-1.5 ring-1 ring-border">1. Describe</span><span className="rounded-full bg-secondary px-3 py-1.5 ring-1 ring-border">2. Review</span><span className="rounded-full bg-secondary px-3 py-1.5 ring-1 ring-border">3. Get general guidance</span></div>
          <Button type="button" variant="outline" onClick={loadDemoScenario} className="mt-5 min-h-10 border-border text-foreground hover:bg-secondary"><Sparkles className="mr-2 h-4 w-4 text-primary" />Load sample demo</Button>
          <p className="mt-2 text-xs text-muted-foreground">Uses fictional symptoms and a sample district. When you request a symptom summary or guidance, the entered text is sent to the server for processing. It is not saved to history unless you opt in and save a response.</p>
        </header>

        <Alert className="mb-5 rounded-2xl border-warning/30 bg-warning/10 text-foreground [&>svg]:text-warning" role="note">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-semibold text-warning">A note about your health information</AlertTitle>
          <AlertDescription className="leading-6 text-muted-foreground">{DISCLAIMER} This prototype has not been clinically validated. When you request a summary or guidance, your text is sent to the server for processing. It is saved to history only if you opt in and choose to save a response.</AlertDescription>
        </Alert>

        <section aria-labelledby="privacy-heading" className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><ShieldCheck className="h-5 w-5" /></span>
            <div><h2 id="privacy-heading" className="text-base font-semibold text-foreground">Your privacy and choices</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">You can get general information without saving a history. Requests are processed by the server; saving history is a separate choice. Guidance and safety content is pending qualified clinical review.</p></div>
          </div>
          <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <label htmlFor="assistant-acknowledgement" className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/40 p-4 text-sm leading-5 text-foreground">
              <input id="assistant-acknowledgement" type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
              <span>I understand this is general information, not a diagnosis.</span>
            </label>
            <label htmlFor="assistant-storage-consent" className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/40 p-4 text-sm leading-5 text-foreground">
              <input id="assistant-storage-consent" type="checkbox" checked={storageConsent} disabled={storagePending} onChange={(event) => void setStorageChoice(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
              <span><strong className="block font-semibold text-foreground">Save my history (optional)</strong>Save selected summaries and check-ins for up to 30 days. You can export or delete them at any time. Anyone with access to this browser session may see saved history.</span>
            </label>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5 text-primary" />History is off until you opt in. You choose separately which responses to save.</p>
          {storagePending && <p className="mt-2 text-xs text-muted-foreground">Updating your storage choice…</p>}
          {storageError && <p role="alert" className="mt-2 text-sm text-destructive">{storageError}</p>}
        </section>

        {/* Profile Details Linked Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">
                {profile.displayName ? `Patient: ${profile.displayName}` : "Patient Consultation Profile"}
                {profile.ageGroup ? ` · Age: ${profile.ageGroup}` : ""}
                {profile.gender ? ` · ${profile.gender[0].toUpperCase() + profile.gender.slice(1)}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Location: {district || state ? `${district || "Any district"}, ${state || "India"}` : "No area specified yet"} · Used for targeted disease prediction & cost-saving diagnostic tests
              </p>
            </div>
          </div>
          <Link
            to="/health-profile"
            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            Edit profile & location <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!result && <Card id="local-context" className="scroll-mt-6 overflow-hidden rounded-2xl border-border bg-card shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border bg-card px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><HeartPulse className="h-5 w-5" /></span>
              <div><CardTitle className="text-xl text-foreground sm:text-2xl">Describe your symptoms</CardTitle><CardDescription className="mt-1 leading-6 text-muted-foreground">Include when they started and anything else that may be helpful. Please avoid names, phone numbers, and exact addresses.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-5 py-5 sm:px-7 sm:py-7">
            <div className="space-y-2">
              <label htmlFor="symptom-text" className="text-sm font-semibold text-foreground">What are you experiencing?</label>
              <VoiceInput value={text} onChange={(value) => { setText(value); setDemoScenario(false); setStructured(false); }} />
              <Textarea id="symptom-text" value={text} onChange={(event) => { setText(event.target.value); setDemoScenario(false); setStructured(false); }} maxLength={2000} placeholder="For example: I have had a fever and headache for two days…" className="min-h-36 resize-y rounded-xl border-border bg-secondary/30 p-4 text-base leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring" />
              <p className="text-right text-xs text-muted-foreground">{text.length}/2000 characters</p>
            </div>
            {!structured ? <Button onClick={handleStructure} disabled={!acknowledged || !text.trim() || structure.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {structure.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Review symptom summary
            </Button> : <>
              <section className="space-y-4 rounded-2xl border border-primary/25 bg-secondary/30 p-4 sm:p-5" aria-labelledby="summary-title">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 id="summary-title" className="text-base font-semibold text-foreground">Review your symptoms</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Check the list and edit anything that does not look right.</p></div>
                  <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">{draftSymptoms.length} found</span>
                </div>
                {draftSymptoms.length === 0 && <p className="rounded-xl border border-border bg-card p-3 text-sm leading-5 text-muted-foreground">We could not identify symptoms automatically. Add them below, or continue with your original description.</p>}
                {draftSymptoms.map((symptom, index) => <div key={`${index}-${symptom.name}`} className="grid gap-2 rounded-xl border border-border bg-card p-2 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]">
                  <Input aria-label={`Reported symptom ${index + 1}`} value={symptom.name} onChange={(event) => updateSymptom(index, event.target.value)} maxLength={80} className="border-0 bg-transparent text-foreground shadow-none focus-visible:ring-ring" />
                  <Input type="number" min={0} max={365} step={1} aria-label={`Duration in days for symptom ${index + 1} (optional)`} placeholder="Days (optional)" value={symptom.duration_days ?? ""} onChange={(event) => updateDuration(index, event.target.value)} className="border-border bg-secondary/40 text-foreground focus-visible:ring-ring" />
                  <select aria-label={`Severity for symptom ${index + 1} (optional)`} value={symptom.severity ?? ""} onChange={(event) => updateSeverity(index, event.target.value)} className="min-h-10 rounded-md border border-border bg-secondary/40 px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="" className="bg-card text-foreground">Severity</option><option value="mild" className="bg-card text-foreground">Mild</option><option value="moderate" className="bg-card text-foreground">Moderate</option><option value="severe" className="bg-card text-foreground">Severe</option></select>
                  <Button type="button" variant="ghost" onClick={() => removeSymptom(index)} aria-label={`Remove symptom ${index + 1}`} className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">Remove</Button>
                </div>)}
                <Button type="button" variant="outline" onClick={addSymptom} className="border-border text-foreground hover:bg-secondary">Add a symptom</Button>
                {invalidDuration && <p role="alert" className="text-sm text-destructive">Enter a whole number of days from 0 to 365, or leave the duration blank.</p>}
              </section>

              <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="area-title">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 id="area-title" className="text-sm font-semibold text-foreground">Your area <span className="text-destructive">(required)</span></h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Enter your state and district to view any matching area reports. A street address is not needed.</p></div><span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">State + district</span></div>
                <p className="text-sm leading-5 text-muted-foreground">These records are historical background, not current outbreak data. They cannot determine your personal chance of having a disease or identify the cause of your symptoms.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><label htmlFor="state" className="text-sm font-medium text-foreground">State / Union Territory <span aria-hidden="true" className="text-destructive">*</span></label><Input id="state" required aria-required="true" value={state} onChange={(event) => { setState(event.target.value); setDemoScenario(false); }} maxLength={100} placeholder="e.g. Delhi" className="rounded-xl border-border bg-secondary/40 text-foreground focus-visible:ring-ring" /></div>
                  <div className="space-y-1.5"><label htmlFor="district" className="text-sm font-medium text-foreground">District <span aria-hidden="true" className="text-destructive">*</span></label><Input id="district" required aria-required="true" value={district} onChange={(event) => { setDistrict(event.target.value); setDemoScenario(false); }} maxLength={100} placeholder="e.g. New Delhi" className="rounded-xl border-border bg-secondary/40 text-foreground focus-visible:ring-ring" /></div>
                </div>
                {demoScenario && <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs leading-5 text-foreground"><strong>Sample location:</strong> Wardha, Maharashtra · selected for the demo, not detected from your device.</p>}
              </section>
              <Button onClick={() => submitTriage()} disabled={triage.isPending || invalidDuration} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                {triage.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing your guidance…</> : <>Get my guidance <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </>}
            {(structure.error || triage.error) && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>We couldn’t complete this step</AlertTitle><AlertDescription>Please try again. Your report has not been saved. If the issue continues, reload the page and start again.</AlertDescription></Alert>}
          </CardContent>
        </Card>}

        {result && <div className="space-y-5" aria-live="polite">
          {triage.error && <Alert variant="destructive"><AlertTitle>Could not check your answers</AlertTitle><AlertDescription>{triage.error.message} Your input was not saved by this request.</AlertDescription></Alert>}
          {result.urgent ? <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-5 w-5" /><AlertTitle>Seek urgent medical care now</AlertTitle>
            <AlertDescription><p>{result.message}</p><ul className="mt-2 list-disc pl-5">{result.next_steps?.map((step) => <li key={step}>{step}</li>)}</ul><p className="mt-3 text-xs">This rule-based screen can miss warning signs. If you feel seriously unwell, seek care even if the assistant did not flag your symptoms.</p></AlertDescription>
          </Alert> : !hasArea ? <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-card)]"><CardHeader><CardTitle className="text-foreground">Add your area to continue</CardTitle><CardDescription className="text-muted-foreground">State and district are required to show local area context. Emergency guidance is shown without waiting for a location.</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">We use this coarse location to look for historical district reports. This prototype does not calculate your personal disease probability, and historical reports do not show current outbreak activity. No street address is needed.</p><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="result-state" className="text-sm font-medium text-foreground">State / Union Territory <span aria-hidden="true" className="text-destructive">*</span></label><Input id="result-state" required aria-required="true" value={state} onChange={(event) => { setState(event.target.value); setDemoScenario(false); }} maxLength={100} placeholder="e.g. Delhi" className="border-border bg-secondary/40 text-foreground" /></div><div className="space-y-1.5"><label htmlFor="result-district" className="text-sm font-medium text-foreground">District <span aria-hidden="true" className="text-destructive">*</span></label><Input id="result-district" required aria-required="true" value={district} onChange={(event) => { setDistrict(event.target.value); setDemoScenario(false); }} maxLength={100} placeholder="e.g. New Delhi" className="border-border bg-secondary/40 text-foreground" /></div></div></CardContent></Card> : <>
            
            {/* 1. Disease Prediction & Probability Breakdown */}
            {result.predicted_diseases && result.predicted_diseases.length > 0 && (
              <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-[var(--shadow-card)]">
                <CardHeader className="border-b border-border bg-secondary/30 px-5 py-4 sm:px-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Activity className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-lg text-foreground sm:text-xl">
                          Differential Disease Likelihood
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                          Algorithmic match based on your symptoms, duration, age/gender profile, and district records
                        </CardDescription>
                      </div>
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {result.predicted_diseases.length} Probable Causes Analyzed
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Notice: This analysis narrows down probable infectious etiologies so you can request <strong>specific targeted tests</strong> instead of paying for expensive all-in-one panels. Confirm with a physician before acting.
                  </p>
                  <div className="grid gap-3.5 sm:grid-cols-1">
                    {result.predicted_diseases.map((disease, idx) => {
                      const isTop = idx === 0;
                      const scoreColor =
                        disease.match_score >= 65
                          ? "bg-emerald-500"
                          : disease.match_score >= 40
                          ? "bg-amber-500"
                          : "bg-cyan-500";
                      const badgeClass =
                        disease.confidence_level === "High"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : disease.confidence_level === "Moderate"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-border bg-secondary/40 text-muted-foreground";

                      return (
                        <div
                          key={disease.id}
                          className={`rounded-xl border p-4 transition-all ${
                            isTop
                              ? "border-primary/40 bg-secondary/40 ring-1 ring-primary/20"
                              : "border-border bg-secondary/20"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground text-base">
                                  {disease.name}
                                </h3>
                                {isTop && (
                                  <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    Primary match
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {disease.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {disease.regional_risk === "Elevated in district" && (
                                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                                  District historical alert
                                </span>
                              )}
                              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                                {disease.confidence_level} Confidence
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
                              <span>Symptom alignment</span>
                              <span className="font-semibold text-foreground">{disease.match_score}% likelihood</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${scoreColor}`}
                                style={{ width: `${disease.match_score}%` }}
                              />
                            </div>
                          </div>

                          <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
                            {disease.description}
                          </p>

                          {disease.matching_symptoms && disease.matching_symptoms.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
                              <span className="text-[11px] font-medium text-muted-foreground">Matching symptoms:</span>
                              {disease.matching_symptoms.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-primary capitalize"
                                >
                                  {s.replaceAll("_", " ")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 2. Targeted Diagnostic Tests Checklist to Save Costs */}
            {result.targeted_tests && result.targeted_tests.length > 0 && (
              <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-[var(--shadow-card)]">
                <CardHeader className="border-b border-border bg-secondary/30 px-5 py-4 sm:px-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Stethoscope className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-lg text-foreground sm:text-xl">
                          Targeted Diagnostic Tests (Cost-Saving Protocol)
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                          Take only these focused tests instead of commercial full-body panels
                        </CardDescription>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      Recommended for Your Doctor Visit
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.targeted_tests.map((test) => (
                      <div
                        key={test.test_name}
                        className="flex flex-col justify-between rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                              {test.priority} Priority
                            </span>
                            <span className="font-semibold text-sm text-foreground">
                              {test.estimated_cost_inr}
                            </span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-foreground">
                            {test.test_name}
                          </h4>
                          <p className="mt-0.5 text-[11px] font-medium text-primary">
                            For: {test.for_condition}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {test.purpose}
                          </p>
                          <p className="mt-2 rounded-lg bg-card/60 p-2 text-[11px] text-muted-foreground border border-border/50">
                            <strong className="text-foreground">Optimal Timing: </strong>
                            {test.timing}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-[11px]">
                          <span className="text-muted-foreground">Turnaround: {test.turnaround_time}</span>
                          {test.free_in_government && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                              <BadgeCheck className="h-3.5 w-3.5" /> Free in Govt Centers
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discuss these specific tests with the treating physician. If clinically indicated, having a targeted test saves money and delivers faster actionable results.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 3. Cost Comparison & Avoided Blanket Panel */}
            {result.cost_optimization && (
              <Card className="overflow-hidden rounded-2xl border-emerald-500/30 bg-card shadow-[var(--shadow-card)]">
                <CardHeader className="border-b border-border bg-emerald-500/10 px-5 py-4 sm:px-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <PiggyBank className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-lg text-foreground sm:text-xl">
                          Cost Optimization: Targeted vs Blanket Testing
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                          Estimated savings by taking condition-specific tests rather than blanket fever panels
                        </CardDescription>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                      Save ~{result.cost_optimization.estimated_savings_percentage}% ({result.cost_optimization.estimated_savings_inr})
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Targeted Tests Total</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{result.cost_optimization.targeted_cost_range_inr}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Only tests matching your symptom profile</p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blanket Commercial Panel</p>
                      <p className="mt-1 text-2xl font-bold text-muted-foreground line-through decoration-destructive/80">{result.cost_optimization.blanket_panel_cost_inr}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Generic 20+ pathogen hospital package</p>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                      <p className="text-xs font-medium text-primary uppercase tracking-wide">Your Net Cost Reduction</p>
                      <p className="mt-1 text-2xl font-bold text-primary">~{result.cost_optimization.estimated_savings_percentage}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">Approx {result.cost_optimization.estimated_savings_inr} retained</p>
                    </div>
                  </div>

                  {result.cost_optimization.avoided_unnecessary_tests && (
                    <div className="rounded-xl border border-border bg-secondary/25 p-4">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-emerald-400" /> Unnecessary Lab Tests Avoided
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {result.cost_optimization.avoided_unnecessary_tests.map((avoided) => (
                          <div key={avoided} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive font-bold text-[10px]">✕</span>
                            <span>{avoided}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4 text-xs">
                    <p className="text-foreground max-w-xl">
                      {result.cost_optimization.subsidized_note}
                    </p>
                    <Link
                      to="/health-schemes"
                      className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      View Government Health Schemes <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. Clinical Guidance & Followup Questions */}
            <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-card)]"><CardHeader className="border-b border-border bg-card"><CardTitle className="text-foreground">Your report and next steps</CardTitle><CardDescription className="text-muted-foreground">General information · not a diagnosis</CardDescription></CardHeader><CardContent className="space-y-3 p-5">
              <p className="text-foreground">{result.guidance?.summary}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.guidance?.next_steps.map((step) => <li key={step}>{step}</li>)}</ul>
                {result.follow_up_questions && result.follow_up_questions.length > 0 && <div className="space-y-3 border-t border-border pt-4"><h2 className="text-sm font-semibold text-foreground">A few questions to help organize your report</h2>{result.follow_up_questions.map((question) => <div key={question.id} className="space-y-1"><label htmlFor={question.id} className="text-sm text-foreground">{question.text}</label><Input id={question.id} value={answers[question.id] ?? ""} maxLength={300} onChange={(event) => setAnswers((old) => ({ ...old, [question.id]: event.target.value }))} className="border-border bg-secondary/40 text-foreground" /></div>)}<div className="flex flex-wrap gap-2"><Button onClick={() => submitTriage()} variant="outline" disabled={triage.isPending} className="border-border text-foreground hover:bg-secondary">{triage.isPending ? "Checking…" : "Submit answers"}</Button><Button onClick={() => submitTriage({ ...Object.fromEntries(Object.entries(answers).map(([id, answer]) => [id, answer || null])), ...Object.fromEntries(result.follow_up_questions!.map((question) => [question.id, null])) })} variant="ghost" disabled={triage.isPending} className="text-muted-foreground hover:bg-secondary">Skip remaining questions</Button></div></div>}
                {result.follow_up_questions?.length === 0 && storageConsent && <div className="border-t border-border pt-4"><p className="mb-2 text-xs text-muted-foreground">Only save this entry if you want it in your history.</p><Button onClick={saveCurrentEntry} disabled={createEntry.isPending || Boolean(createEntry.data)} className="bg-primary text-primary-foreground hover:bg-primary/90">{createEntry.isPending ? "Saving…" : createEntry.data ? "Saved to my history" : "Save this response to my history"}</Button>{createEntry.error && <p role="alert" className="mt-2 text-sm text-destructive">{createEntry.error.message}</p>}</div>}
            </CardContent></Card>
            {context.isFetching && <p className="text-sm text-muted-foreground">Loading historical area context…</p>}
            {context.error && <Alert><Info className="h-4 w-4" /><AlertTitle>Historical context unavailable</AlertTitle><AlertDescription>This does not affect your guidance. No local data is being substituted.</AlertDescription></Alert>}
            {context.data && <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-[var(--shadow-card)]"><CardHeader className="border-b border-border bg-secondary/30"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-foreground"><HeartPulse className="h-5 w-5 text-primary" />District health reports</CardTitle><CardDescription className="mt-1 leading-6 text-muted-foreground">{context.data.location.district}, {context.data.location.state} · Archived public-health observations</CardDescription></div><span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">Historical data{archiveThrough ? ` · through ${archiveThrough}` : ""}</span></div></CardHeader><CardContent className="space-y-4 p-5">
              <p className="text-sm leading-6 text-muted-foreground">The records below show diseases reported in this district during the periods listed. They provide background only; historical reports cannot show today’s case levels or determine what is causing your symptoms.</p>
              {context.data.status === "unavailable" ? <p className="text-sm text-muted-foreground">No matching historical records are available for this district. This does not mean there are no cases.</p> : context.data.items.map((item) => <div className="rounded-xl border border-border bg-secondary/30 p-4" key={item.disease}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-foreground">{item.disease}</strong><span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">Historical record</span></div><p className="mt-1 text-sm text-muted-foreground">Observed period: {item.data_period} · Source: {item.source}</p></div>)}
              {context.data.status === "available" && <p className="text-xs leading-5 text-muted-foreground">Source records may be incomplete. A month without a report does not mean there were zero cases.</p>}
              <div className="rounded-xl border border-border bg-secondary/30 p-4"><p className="text-sm leading-6 text-muted-foreground">Area reports can provide background for a healthcare professional, but they cannot identify the cause of an individual’s symptoms. A clinician can advise whether testing is appropriate after assessment.</p></div>
              <a href="https://ncdc.mohfw.gov.in/includes/About/CentresAndDivision/IDSP.php" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4">Open official NCDC / IDSP surveillance information <ArrowRight className="h-4 w-4" /></a>
            </CardContent></Card>}
            <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-card)]"><CardHeader className="border-b border-border bg-card"><CardTitle className="text-foreground">Testing to discuss with a clinician</CardTitle><CardDescription className="text-muted-foreground">The right test depends on your symptoms, how long you have had them, examination findings and current local guidance.</CardDescription></CardHeader><CardContent className="space-y-4 p-5">
              <p className="text-sm leading-6 text-muted-foreground">Area reports can add background, but they cannot identify the cause of an individual illness or determine which test is appropriate. A healthcare professional can assess you and explain whether testing is useful.</p>
              <div><h3 className="text-sm font-semibold text-foreground">Helpful details to share</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">When symptoms began, how they have changed, any temperature you measured, medicines you have taken, and relevant travel or exposure.</p></div>
              <div><h3 className="text-sm font-semibold text-foreground">Questions you could ask</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-5 text-muted-foreground">{(result.guidance?.testing_guidance?.questions ?? ["What possible causes fit my symptoms and examination?", "Would testing change the next step in my care?", "If testing is appropriate, which test and timing fit my situation?"]).map((question) => <li key={question}>{question}</li>)}</ul></div>
            </CardContent></Card>
          </>}
          <Button variant="outline" onClick={startOver} className="border-border text-foreground hover:bg-secondary"><RotateCcw className="mr-2 h-4 w-4" />Start over</Button>
        </div>}

        {storageConsent && sessionToken && <Card id="history" className="mt-6 rounded-2xl border-border bg-card shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border"><CardTitle className="text-foreground">My health history</CardTitle><CardDescription className="text-muted-foreground">Saved only because you opted in. Entries expire no later than 30 days after you enabled storage; each entry shows its expiry. Symptom follow-up is basic tracking, not clinical monitoring.</CardDescription></CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={handleExport} disabled={!entries.data?.length} className="border-border text-foreground hover:bg-secondary">Export JSON</Button><Button variant="destructive" onClick={() => void handleDeleteAll()}>Delete all saved data</Button></div>
            {entries.isLoading && <p className="text-sm text-muted-foreground">Loading saved entries…</p>}
            {entries.error && <Alert variant="destructive"><AlertDescription>{entries.error.message}</AlertDescription></Alert>}
            {entries.data?.length === 0 && <p className="text-sm text-muted-foreground">No saved entries. You can use the assistant without saving anything.</p>}
            {entries.data?.map((entry) => <HistoryEntryCard key={entry.id} entry={entry} token={sessionToken} onDelete={(id) => deleteEntry.mutate(id)} />)}
            {deleteEntry.error && <Alert variant="destructive"><AlertDescription>{deleteEntry.error.message}</AlertDescription></Alert>}
          </CardContent>
        </Card>}
        {(!storageConsent || !sessionToken) && <Card id="history" className="mt-6 scroll-mt-6 rounded-2xl border-border bg-card shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border"><CardTitle className="text-foreground">My health history</CardTitle><CardDescription className="text-muted-foreground">History is optional. Enable storage consent above to create a temporary browser session, then choose which responses to save.</CardDescription></CardHeader>
          <CardContent className="p-5"><p className="text-sm text-muted-foreground">No entries are saved unless you opt in and explicitly save a response. Saved records expire within 30 days and can be exported or deleted here.</p></CardContent>
        </Card>}

        <p className="mt-8 text-center text-xs text-muted-foreground">For general information only. A healthcare professional can assess your symptoms and recommend next steps.</p>
        <p className="mt-2 text-center text-xs text-muted-foreground">Local clinics and test prices aren’t listed because verified current details aren’t available.</p>
      </main>
    </HealthPortalLayout>
  );
}
