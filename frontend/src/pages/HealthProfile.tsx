import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  Droplet,
  HeartPulse,
  Info,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";
import {
  BLOOD_GROUPS,
  COMMON_CONDITIONS,
  INDIAN_STATES,
  POPULAR_DISTRICTS,
} from "@/data/indiaLocations";

const fieldClass =
  "min-h-11 rounded-xl border border-border bg-secondary/40 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all";

export default function HealthProfile() {
  const { profile, completion, setProfile, clearProfile } = useHealthProfile();
  const [draft, setDraft] = useState(profile);
  const [savedNotice, setSavedNotice] = useState(false);
  const navigate = useNavigate();

  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((old) => ({ ...old, [key]: value }));
    setSavedNotice(false);
  };

  const toggleCondition = (condition: string) => {
    setDraft((old) => {
      const exists = old.chronicConditions.includes(condition);
      const updated = exists
        ? old.chronicConditions.filter((c) => c !== condition)
        : [...old.chronicConditions, condition];
      return { ...old, chronicConditions: updated };
    });
    setSavedNotice(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfile(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 4000);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your saved profile details?")) {
      clearProfile();
      setDraft({
        displayName: "",
        ageGroup: "",
        gender: "",
        bloodGroup: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        district: "",
        pincode: "",
        chronicConditions: [],
        allergies: "",
        preferredLanguage: "en",
      });
      setSavedNotice(false);
    }
  };

  const populateDemoProfile = () => {
    const demo = {
      displayName: "Rahul Sharma",
      ageGroup: "30-44",
      gender: "Male",
      bloodGroup: "B+",
      phone: "+91 98765 43210",
      address: "142, Wardha Road, Civil Lines",
      city: "Wardha",
      state: "Maharashtra",
      district: "Wardha",
      pincode: "442001",
      chronicConditions: ["Hypertension"],
      allergies: "None",
      preferredLanguage: "en",
    };
    setDraft(demo);
    setProfile(demo);
    setSavedNotice(true);
  };

  const stateDistricts = draft.state ? POPULAR_DISTRICTS[draft.state] || [] : [];
  const initials = draft.displayName
    ? draft.displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "P";

  return (
    <HealthPortalLayout>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* Standardized Hero Header Card */}
        <header className="mb-8 rounded-3xl border border-border bg-gradient-to-b from-card to-card/70 p-6 sm:p-8 backdrop-blur-md shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <User className="h-3.5 w-3.5" /> Patient Digital Health Profile
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Personal Profile &{" "}
                <span className="text-primary">
                  Address Details
                </span>
              </h1>
              <p className="mt-3 text-sm leading-6 sm:text-base sm:leading-7 text-muted-foreground">
                Configure your demographic context and residential location once. This information is dynamically
                injected into the clinical triage engine to predict regional outbreak conditions and recommend targeted,
                cost-saving diagnostic tests.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={populateDemoProfile}
                className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all rounded-xl"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Load Sample Profile
              </Button>
            </div>
          </div>
        </header>

        {/* Saved Toast Notification */}
        <AnimatePresence>
          {savedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-sm text-emerald-200"
            >
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
                <span>
                  <strong>Profile updated successfully!</strong> Details are saved to your browser and linked to the
                  Diagnostic Assistant.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/health-assistant")}
                className="border-emerald-500/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
              >
                Go to Symptom Triage <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-Column Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr] items-start">
          {/* LEFT COLUMN: LIVE PATIENT ID CARD */}
          <div className="sticky top-20 space-y-4">
            <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-card/60 p-6 shadow-[var(--shadow-card)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Health Pass
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active on Device
                </span>
              </div>

              {/* Avatar & Patient Name */}
              <div className="mt-5 flex flex-col items-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/30 to-teal-500/10 border-2 border-primary/40 text-xl font-bold text-primary shadow-lg">
                  {initials}
                  {draft.bloodGroup && (
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-950 border border-red-500/50 text-[10px] font-bold text-red-400">
                      {draft.bloodGroup}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-lg font-bold text-foreground">
                  {draft.displayName || "Patient Name"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {draft.ageGroup ? `${draft.ageGroup.replace("_", " ")} yrs` : "Age not specified"}
                  {draft.gender ? ` • ${draft.gender}` : ""}
                </p>
              </div>

              {/* Profile Completion Bar */}
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Profile Readiness</span>
                  <span className={completion >= 75 ? "text-emerald-400" : "text-primary"}>
                    {completion}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Patient Attributes Quick View */}
              <div className="mt-5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-2.5">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> District & State
                  </span>
                  <span className="font-semibold text-foreground text-right truncate max-w-[160px]">
                    {draft.district ? `${draft.district}, ${draft.state}` : "Not set"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-2.5">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Droplet className="h-3.5 w-3.5 text-red-400" /> Blood Group
                  </span>
                  <span className="font-semibold text-foreground">
                    {draft.bloodGroup || "Not specified"}
                  </span>
                </div>

                {draft.chronicConditions.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5">
                    <span className="block text-muted-foreground font-medium mb-1">
                      Clinical Conditions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {draft.chronicConditions.map((c) => (
                        <span
                          key={c}
                          className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Start Triage Direct Button */}
              <div className="mt-6">
                <Button
                  onClick={() => navigate("/health-assistant")}
                  className="w-full min-h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-md"
                >
                  Start Symptom Assessment <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Privacy Card */}
            <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Zero Server Profiling:</strong> Your health and address data remains strictly in your browser&apos;s
                local storage. It is never logged or sold to third parties.
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: MULTI-SECTION FORM */}
          <form onSubmit={submit} className="space-y-6">
            {/* SECTION 1: PERSONAL IDENTITY */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2.5 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <UserCheck className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold">1. Personal Identity & Demographics</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Age and gender influence clinical differential probabilities (e.g. pediatric vs adult febrile risks).
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Full Name / Preferred Name
                  <Input
                    className={fieldClass}
                    value={draft.displayName}
                    maxLength={80}
                    autoComplete="name"
                    onChange={(event) => update("displayName", event.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Age Group
                  <select
                    className={fieldClass + " w-full"}
                    value={draft.ageGroup}
                    onChange={(event) => update("ageGroup", event.target.value)}
                  >
                    <option value="" className="bg-card text-foreground">Select age category</option>
                    <option value="under-18" className="bg-card text-foreground">Child / Adolescent (&lt; 18 yrs)</option>
                    <option value="18-29" className="bg-card text-foreground">Young Adult (18–29 yrs)</option>
                    <option value="30-44" className="bg-card text-foreground">Adult (30–44 yrs)</option>
                    <option value="45-59" className="bg-card text-foreground">Middle-aged Adult (45–59 yrs)</option>
                    <option value="60-plus" className="bg-card text-foreground">Senior Citizen (60+ yrs)</option>
                  </select>
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Gender
                  <select
                    className={fieldClass + " w-full"}
                    value={draft.gender}
                    onChange={(event) => update("gender", event.target.value)}
                  >
                    <option value="" className="bg-card text-foreground">Select gender</option>
                    <option value="Male" className="bg-card text-foreground">Male</option>
                    <option value="Female" className="bg-card text-foreground">Female</option>
                    <option value="Non-binary / Other" className="bg-card text-foreground">Non-binary / Other</option>
                    <option value="Prefer not to say" className="bg-card text-foreground">Prefer not to say</option>
                  </select>
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Preferred Language
                  <select
                    className={fieldClass + " w-full"}
                    value={draft.preferredLanguage}
                    onChange={(event) => update("preferredLanguage", event.target.value)}
                  >
                    <option value="en" className="bg-card text-foreground">English</option>
                    <option value="hi" className="bg-card text-foreground">Hindi (हिंदी)</option>
                  </select>
                </label>
              </div>

              {/* Blood Group Chips Selector */}
              <div className="mt-5 border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Blood Group <span className="text-xs text-muted-foreground">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((bg) => {
                    const selected = draft.bloodGroup === bg;
                    return (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => update("bloodGroup", selected ? "" : bg)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-secondary/30 text-foreground hover:bg-secondary hover:border-primary/40"
                        }`}
                      >
                        {bg}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SECTION 2: RESIDENTIAL ADDRESS & LOCAL SURVEILLANCE LOCATION */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2.5 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold">2. Residential Address & Epidemiological Area</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                State & District are mapped to local IDSP / NCDC disease surveillance records to calibrate prediction models.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  State / Union Territory <span className="text-destructive">*</span>
                  <select
                    className={fieldClass + " w-full"}
                    value={draft.state}
                    onChange={(event) => {
                      const newState = event.target.value;
                      update("state", newState);
                      // Auto-reset district if state changes
                      update("district", "");
                    }}
                  >
                    <option value="" className="bg-card text-foreground">Select State / UT</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-card text-foreground">
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  District / City <span className="text-destructive">*</span>
                  {stateDistricts.length > 0 ? (
                    <select
                      className={fieldClass + " w-full"}
                      value={draft.district}
                      onChange={(event) => update("district", event.target.value)}
                    >
                      <option value="" className="bg-card text-foreground">Select District</option>
                      {stateDistricts.map((d) => (
                        <option key={d} value={d} className="bg-card text-foreground">
                          {d}
                        </option>
                      ))}
                      <option value="Other" className="bg-card text-foreground">Other / Manual</option>
                    </select>
                  ) : (
                    <Input
                      className={fieldClass}
                      value={draft.district}
                      maxLength={100}
                      onChange={(event) => update("district", event.target.value)}
                      placeholder="e.g. Wardha"
                    />
                  )}
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground sm:col-span-2">
                  Locality / Street Address
                  <Input
                    className={fieldClass}
                    value={draft.address}
                    maxLength={200}
                    onChange={(event) => update("address", event.target.value)}
                    placeholder="e.g. Sector 4, Civil Lines, Main Market Road"
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  City / Town / Tehsil
                  <Input
                    className={fieldClass}
                    value={draft.city}
                    maxLength={100}
                    onChange={(event) => update("city", event.target.value)}
                    placeholder="e.g. Wardha"
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Pincode
                  <Input
                    className={fieldClass}
                    value={draft.pincode}
                    maxLength={10}
                    onChange={(event) => update("pincode", event.target.value)}
                    placeholder="e.g. 442001"
                  />
                </label>
              </div>
            </section>

            {/* SECTION 3: CLINICAL BACKGROUND & MEDICAL HISTORY */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2.5 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Stethoscope className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold">3. Clinical Background & Medical Notes</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: helps flag specific safety advisories and medication contraindications during diagnosis.
              </p>

              <div className="mt-5">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Known Pre-Existing Conditions
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CONDITIONS.map((cond) => {
                    const active = draft.chronicConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleCondition(cond)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? "border-primary bg-primary/20 text-primary font-semibold"
                            : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <label className="space-y-1.5 text-sm font-medium text-foreground block">
                  Known Drug Allergies
                  <Input
                    className={fieldClass}
                    value={draft.allergies}
                    maxLength={150}
                    onChange={(event) => update("allergies", event.target.value)}
                    placeholder="e.g. Penicillin, Sulfa antibiotics, NSAIDs (leave blank if none)"
                  />
                </label>
              </div>
            </section>

            {/* Form Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  className="min-h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Check className="mr-2 h-4 w-4" /> Save Profile Details
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="min-h-11 rounded-xl border-border text-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Profile
                </Button>
              </div>

              <Link
                to="/health-assistant"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Proceed to Symptom Triage <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </div>
      </div>
    </HealthPortalLayout>
  );
}
