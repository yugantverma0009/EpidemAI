import { useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, BadgeCheck, Building2, Check, ChevronDown, ClipboardList, ExternalLink, MapPin, Search, Stethoscope } from "lucide-react";
import { HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthSchemeMatches } from "@/hooks/useHealthSchemes";
import type { NavigatorAnswer, SchemeMatchRequest, SchemeTopic } from "@/types/healthSchemes";

const field = "min-h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const topics: { value: SchemeTopic; label: string }[] = [
  { value: "hospital", label: "Hospital care" }, { value: "senior", label: "Older adults" },
  { value: "pregnancy", label: "Pregnancy" }, { value: "child", label: "Children" },
  { value: "medicines", label: "Medicines" }, { value: "diagnostics", label: "Tests and diagnosis services" },
  { value: "financial_assistance", label: "Financial support" }, { value: "worker", label: "Health and care workers" },
  { value: "government_employee", label: "Government employees and pensioners" },
  { value: "public_care", label: "General public healthcare" }, { value: "digital_health", label: "Digital health records" },
];
const states = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const answerOptions: { value: NavigatorAnswer; label: string }[] = [
  { value: "unknown", label: "Not sure" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    potential_match: "Worth checking", potential_service: "Service may be relevant", public_service: "Public service information",
    information_only: "Information", more_information_needed: "Check additional criteria", criteria_not_met_from_answers: "Some criteria may differ",
    not_applicable_to_selected_state: "Different state",
  };
  return labels[status || ""] || "Information";
}

function AnswerSelect({ label, value, onChange }: { label: string; value: NavigatorAnswer; onChange: (value: NavigatorAnswer) => void }) {
  return <label className="block space-y-1.5 text-sm font-medium text-foreground">{label}
    <select className={field} value={value} onChange={(event) => onChange(event.target.value as NavigatorAnswer)}>
      {answerOptions.map((option) => <option key={option.value} value={option.value} className="bg-card text-foreground">{option.label}</option>)}
    </select>
  </label>;
}

export default function HealthSchemes() {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<SchemeTopic[]>(["all"]);
  const [age, setAge] = useState<SchemeMatchRequest["age_group"]>("unknown");
  const [gender, setGender] = useState<SchemeMatchRequest["gender"]>("unknown");
  const [incomeBand, setIncomeBand] = useState<SchemeMatchRequest["income_band"]>("unknown");
  const [occupation, setOccupation] = useState<SchemeMatchRequest["occupation"]>("unknown");
  const [area, setArea] = useState<SchemeMatchRequest["area"]>("unknown");
  const [bpl, setBpl] = useState<NavigatorAnswer>("unknown");
  const [pregnant, setPregnant] = useState<NavigatorAnswer>("unknown");
  const [infant, setInfant] = useState<NavigatorAnswer>("unknown");
  const [pmjay, setPmjay] = useState<NavigatorAnswer>("unknown");
  const [worker, setWorker] = useState<SchemeMatchRequest["worker_group"]>("unknown");
  const [governmentEmployment, setGovernmentEmployment] = useState<SchemeMatchRequest["government_employment"]>("unknown");
  const [nfsc, setNfsc] = useState<NavigatorAnswer>("unknown");
  const [residence, setResidence] = useState("");
  const [govtHospital, setGovtHospital] = useState<NavigatorAnswer>("unknown");
  const [didSearch, setDidSearch] = useState(false);
  const mutation = useHealthSchemeMatches();

  const isDelhi = state.trim().toLocaleLowerCase() === "delhi";
  const hasTopic = (...values: SchemeTopic[]) => selectedTopics.includes("all") || values.some((value) => selectedTopics.includes(value));
  const mapQueries = useMemo(() => {
    const place = [district.trim(), state.trim(), "India"].filter(Boolean).join(", ");
    const suffix = place ? ` near ${place}` : " near me";
    return [
      { title: "Government hospital or health centre", query: `government hospital primary health centre${suffix}` },
      { title: "Affordable diagnostic services", query: `government diagnostic laboratory${suffix}` },
      { title: "Janaushadhi medicine centre", query: `Pradhan Mantri Bhartiya Janaushadhi Kendra${suffix}` },
    ];
  }, [district, state]);

  const toggleTopic = (topic: SchemeTopic) => {
    setSelectedTopics((current) => {
      if (topic === "all") return ["all"];
      const withoutAll = current.filter((item) => item !== "all");
      const next = withoutAll.includes(topic) ? withoutAll.filter((item) => item !== topic) : [...withoutAll, topic];
      return next.length ? next : ["all"];
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setDidSearch(true);
    mutation.mutate({
      state: state.trim() || null,
      district: district.trim() || null,
      topics: selectedTopics,
      age_group: age,
      age: null,
      gender,
      income_band: incomeBand,
      occupation,
      area,
      pregnant,
      child_under_one: infant,
      pmjay_beneficiary: pmjay,
      worker_group: worker,
      government_employment: governmentEmployment,
      nfsc_card: nfsc,
      delhi_residence_years: isDelhi && residence !== "" ? Number(residence) : null,
      government_hospital_treatment: isDelhi ? govtHospital : "unknown",
      bpl_or_secc: bpl,
      tb_patient: "unknown",
      disability: "unknown",
      sc_st: "unknown",
    });
  };

  const clear = () => {
    setState(""); setDistrict(""); setSelectedTopics(["all"]); setAge("unknown"); setGender("unknown"); setIncomeBand("unknown"); setOccupation("unknown"); setArea("unknown"); setBpl("unknown"); setPregnant("unknown"); setInfant("unknown");
    setPmjay("unknown"); setWorker("unknown"); setGovernmentEmployment("unknown"); setNfsc("unknown"); setResidence(""); setGovtHospital("unknown"); setDidSearch(false); mutation.reset();
  };

  return <HealthPortalLayout>
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary"><ClipboardList className="h-3.5 w-3.5" /> Individual Health Portal</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Find health schemes and care</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">Explore public health benefits and services that may fit your needs. Filter by location or topic, then follow official links for details.</p>
        </div>
        <div className="relative z-10 mt-7 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
          {[{ n: "01", title: "Choose a location", body: "Optional state and district" }, { n: "02", title: "Select a topic", body: "Share only what is relevant" }, { n: "03", title: "Explore options", body: "Review sources and services" }].map((step) => <div key={step.n} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">{step.n}</span><div><p className="text-sm font-semibold text-foreground">{step.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.body}</p></div></div>)}
        </div>
      </header>

      <form onSubmit={submit} className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="location-heading">
            <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><MapPin className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Refine your search</p><h2 id="location-heading" className="mt-1 font-semibold text-foreground">Where should we look?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Add a state or district to surface relevant local programmes. You can also browse national information.</p></div></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-foreground">State / Union Territory <span className="font-normal text-muted-foreground">(optional)</span>
                <select className={field} value={state} onChange={(event) => setState(event.target.value)}><option value="" className="bg-card text-foreground">Browse national information</option>{states.map((item) => <option key={item} className="bg-card text-foreground">{item}</option>)}</select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">District or city <span className="font-normal text-muted-foreground">(optional)</span>
                <input className={field} value={district} maxLength={100} onChange={(event) => setDistrict(event.target.value)} placeholder="e.g. New Delhi" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="topics-heading">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><Stethoscope className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Browse by need</p><h2 id="topics-heading" className="mt-1 font-semibold text-foreground">What are you looking for?</h2><p className="mt-1 text-sm text-muted-foreground">Choose any topics that matter to you.</p></div></div><span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">{selectedTopics.includes("all") ? "All topics" : `${selectedTopics.length} selected`}</span></div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" aria-pressed={selectedTopics.includes("all")} onClick={() => toggleTopic("all")} className={`min-h-10 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedTopics.includes("all") ? "border-primary bg-primary/15 text-primary shadow-sm" : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>All topics</button>
              {topics.map((topic) => <button key={topic.value} type="button" aria-pressed={selectedTopics.includes(topic.value)} onClick={() => toggleTopic(topic.value)} className={`min-h-10 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedTopics.includes(topic.value) ? "border-primary bg-primary/15 text-primary shadow-sm" : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>{topic.label}</button>)}
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Optional filters</p><h2 className="mt-1 font-semibold text-foreground">Personalise your results</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Answer only what you know. Leave any field blank to see broader information.</p>
          <div className="mt-5 space-y-4">
            <label className="block space-y-1.5 text-sm font-medium text-foreground">Age group
              <select className={field} value={age} onChange={(event) => setAge(event.target.value as SchemeMatchRequest["age_group"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="under18" className="bg-card text-foreground">Under 18</option><option value="18_59" className="bg-card text-foreground">18–59</option><option value="60_69" className="bg-card text-foreground">60–69</option><option value="70_plus" className="bg-card text-foreground">70 or older</option></select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">Gender
              <select className={field} value={gender} onChange={(event) => setGender(event.target.value as SchemeMatchRequest["gender"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="female" className="bg-card text-foreground">Female</option><option value="male" className="bg-card text-foreground">Male</option><option value="other" className="bg-card text-foreground">Other</option></select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">Annual household income band (optional)
              <select className={field} value={incomeBand} onChange={(event) => setIncomeBand(event.target.value as SchemeMatchRequest["income_band"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="under_1_lakh" className="bg-card text-foreground">Under ₹1 lakh</option><option value="1_3_lakh" className="bg-card text-foreground">₹1–3 lakh</option><option value="3_5_lakh" className="bg-card text-foreground">₹3–5 lakh</option><option value="5_10_lakh" className="bg-card text-foreground">₹5–10 lakh</option><option value="above_10_lakh" className="bg-card text-foreground">Above ₹10 lakh</option></select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">Occupation (or parent/guardian for a child)
              <select className={field} value={occupation} onChange={(event) => setOccupation(event.target.value as SchemeMatchRequest["occupation"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="none" className="bg-card text-foreground">Not applicable</option><option value="govt_central" className="bg-card text-foreground">Central government employee</option><option value="govt_state" className="bg-card text-foreground">State government employee</option><option value="pensioner_central" className="bg-card text-foreground">Government pensioner</option><option value="ex_serviceman" className="bg-card text-foreground">Ex-serviceman</option><option value="organised_private" className="bg-card text-foreground">Organised private sector</option><option value="unorganised" className="bg-card text-foreground">Unorganised sector</option><option value="gig_worker" className="bg-card text-foreground">Gig worker</option><option value="farmer" className="bg-card text-foreground">Farmer</option><option value="student" className="bg-card text-foreground">Student</option></select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">Area type
              <select className={field} value={area} onChange={(event) => setArea(event.target.value as SchemeMatchRequest["area"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="urban" className="bg-card text-foreground">Urban</option><option value="rural" className="bg-card text-foreground">Rural</option></select>
            </label>
            <AnswerSelect label="BPL / SECC category applies?" value={bpl} onChange={setBpl} />
            {hasTopic("pregnancy") && <AnswerSelect label="Is pregnancy-related information relevant?" value={pregnant} onChange={setPregnant} />}
            {hasTopic("child") && <AnswerSelect label="Is care for a child under one relevant?" value={infant} onChange={setInfant} />}
            {hasTopic("hospital", "senior") && <AnswerSelect label="Does anyone already have PM-JAY beneficiary status?" value={pmjay} onChange={setPmjay} />}
            {hasTopic("worker") && <label className="block space-y-1.5 text-sm font-medium text-foreground">Worker category
              <select className={field} value={worker} onChange={(event) => setWorker(event.target.value as SchemeMatchRequest["worker_group"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="none" className="bg-card text-foreground">Not applicable</option><option value="asha" className="bg-card text-foreground">ASHA worker</option><option value="anganwadi_worker" className="bg-card text-foreground">Anganwadi Worker</option><option value="anganwadi_helper" className="bg-card text-foreground">Anganwadi Helper</option><option value="other" className="bg-card text-foreground">Other</option></select>
            </label>}
            {isDelhi && hasTopic("government_employee") && <label className="block space-y-1.5 text-sm font-medium text-foreground">Government employment category
              <select className={field} value={governmentEmployment} onChange={(event) => setGovernmentEmployment(event.target.value as SchemeMatchRequest["government_employment"])}><option value="unknown" className="bg-card text-foreground">Prefer not to say</option><option value="none" className="bg-card text-foreground">Not applicable</option><option value="delhi_employee" className="bg-card text-foreground">Serving Delhi government employee</option><option value="delhi_pensioner" className="bg-card text-foreground">Delhi government pensioner</option><option value="other" className="bg-card text-foreground">Other government employment</option></select>
            </label>}
            {isDelhi && hasTopic("hospital", "financial_assistance") && <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-sm font-semibold text-foreground">Delhi Arogya Nidhi criteria</p>
              <AnswerSelect label="Does the person have a National Food Security Card?" value={nfsc} onChange={setNfsc} />
              <label className="block space-y-1.5 text-sm font-medium text-foreground">Years of continuous Delhi residence
                <input className={field} type="number" min="0" max="100" inputMode="numeric" value={residence} onChange={(event) => setResidence(event.target.value)} placeholder="Skip if unsure" />
              </label>
              <AnswerSelect label="Is treatment at a Delhi government hospital involved?" value={govtHospital} onChange={setGovtHospital} />
              <p className="text-xs leading-5 text-muted-foreground">Use the official scheme link to review the full criteria.</p>
            </div>}
          </div>
          <div className="mt-6 space-y-2 border-t border-border pt-5">
            <button type="submit" disabled={mutation.isPending} className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70">{mutation.isPending ? "Finding relevant options…" : <><Search className="h-4 w-4" /> Find schemes and services</>}</button>
            {(didSearch || mutation.data) && <button type="button" onClick={clear} className="min-h-10 w-full cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Clear answers</button>}
          </div>
        </aside>
      </form>

      {mutation.isError && <div role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><strong>We couldn’t load scheme information.</strong> Check your connection and try again.<button type="button" onClick={() => mutation.mutate({ state: state.trim() || null, district: district.trim() || null, topics: selectedTopics, age_group: age, age: null, gender, income_band: incomeBand, occupation, area, bpl_or_secc: bpl, tb_patient: "unknown", disability: "unknown", sc_st: "unknown", pregnant, child_under_one: infant, pmjay_beneficiary: pmjay, worker_group: worker, government_employment: governmentEmployment, nfsc_card: nfsc, delhi_residence_years: isDelhi && residence !== "" ? Number(residence) : null, government_hospital_treatment: isDelhi ? govtHospital : "unknown" })} className="ml-2 cursor-pointer font-semibold underline underline-offset-2">Try again</button></div>}

      {mutation.data && <section className="mt-10" aria-labelledby="results-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Search results</p><h2 id="results-heading" className="mt-1 text-2xl font-bold tracking-tight text-foreground">Options to explore</h2><p className="mt-1 text-sm text-muted-foreground">{mutation.data.results.length} {mutation.data.results.length === 1 ? "scheme or service" : "schemes and services"} based on your selections</p></div><a href={mutation.data.state_scheme_search_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Browse government schemes <ExternalLink className="h-4 w-4" /></a></div>
        <p className="mt-3 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm leading-6 text-muted-foreground">{mutation.data.state_catalog_note}</p>
        {mutation.data.results.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-primary"><Search className="h-5 w-5" /></span><h3 className="mt-3 font-semibold text-foreground">No matches for these filters</h3><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Try choosing more topics or clearing some eligibility details. You can also browse national and state programmes through the official portal.</p><a href={mutation.data.state_scheme_search_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary underline underline-offset-4">Browse official scheme listings <ExternalLink className="h-4 w-4" /></a></div> : <div className="mt-5 grid gap-4 xl:grid-cols-2">{mutation.data.results.map((scheme) => <article key={scheme.scheme_id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:border-primary/40 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{scheme.jurisdiction}</p><h3 className="mt-1 text-lg font-bold text-foreground">{scheme.name}</h3></div><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><BadgeCheck className="h-3.5 w-3.5" />{statusLabel(scheme.match_status)}</span></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{scheme.summary}</p>
          <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Benefit or service</p><p className="mt-1 text-sm leading-6 text-foreground">{scheme.benefit}</p></div>
          {scheme.match_reasons && <ul className="mt-4 space-y-2">{scheme.match_reasons.map((reason) => <li key={reason} className="flex gap-2 text-sm leading-6 text-muted-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{reason}</li>)}</ul>}
          <details className="group mt-4 rounded-xl border border-border bg-secondary/20"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50">Eligibility and documents <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary><div className="border-t border-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key criteria</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{scheme.criteria.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents listed by the source</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{scheme.documents.map((item) => <li key={item}>{item}</li>)}</ul></div></details>
          <div className="mt-4 flex flex-wrap gap-2">{scheme.actions.map((action) => <a key={action.url + action.label} href={action.url} target={action.url.startsWith("tel:") ? undefined : "_blank"} rel={action.url.startsWith("tel:") ? undefined : "noreferrer"} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{action.label}<ArrowUpRight className="h-4 w-4" /></a>)}</div>
          {scheme.source_availability === "possibly_discontinued" && <p role="status" className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-warning">The source page could not be reached recently. Confirm the current scheme details with the official department.</p>}
          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Source: <a href={scheme.source_url} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">{scheme.source_label}</a>{scheme.source_date ? ` · Source date: ${scheme.source_date}` : " · Publication date not listed"}{scheme.checked_date ? ` · Link checked: ${scheme.checked_date}` : ""}</p>
        </article>)}</div>}
      </section>}

      <section className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="nearby-heading">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><Building2 className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Care access</p><h2 id="nearby-heading" className="mt-1 font-semibold text-foreground">Find public services nearby</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Open a map search for hospitals, health centres, diagnostic services, or Janaushadhi medicine centres{district || state ? ` near ${[district.trim(), state.trim()].filter(Boolean).join(", ")}` : ""}.</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{mapQueries.map((item) => {
          const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.query)}`;
          return <a key={item.title} href={href} target="_blank" rel="noreferrer" className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span>{item.title}</span><ExternalLink className="h-4 w-4 shrink-0 text-primary" /></a>;
        })}</div>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Map listings open in Google Maps. Contact a facility to confirm services and opening hours. Check PM-JAY participation through the official NHA portal.</p>
      </section>
    </div>
  </HealthPortalLayout>;
}
