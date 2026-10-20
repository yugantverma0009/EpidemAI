import { ArrowRight, Bot, CheckCircle2, HeartPulse, Landmark, ListChecks, MapPin, MapPinned, ShieldCheck, Sparkles, UserCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HealthPortalCard, HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";
import { Button } from "@/components/ui/button";

export default function HealthPortal() {
  const { profile, completion } = useHealthProfile();

  return (
    <HealthPortalLayout>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        {/* Standardized Hero Header Card */}
        <header className="mb-8 rounded-3xl border border-border bg-gradient-to-b from-card to-card/70 p-6 sm:p-8 backdrop-blur-md shadow-[var(--shadow-card)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <HeartPulse className="h-3.5 w-3.5" /> Individual Health Intelligence
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
                Your Personal{" "}
                <span className="text-primary">
                  Health Assistant
                </span>
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {profile.displayName ? `Welcome back, ${profile.displayName}. ` : ""}
                Describe your symptoms, analyze likelihood against regional surveillance data, and receive 
                <strong> targeted lab recommendations</strong> that optimize diagnostic costs.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/health-assistant"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200"
                >
                  <HeartPulse className="h-4 w-4" /> Start Symptom Assessment <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/health-profile"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-secondary hover:border-primary/40 transition-all duration-200"
                >
                  <UserRound className="h-4 w-4 text-primary" /> Manage Profile
                </Link>
              </div>
            </div>

            {/* Dynamic Patient Digital Status Card */}
            <div className="lg:w-80 rounded-2xl border border-border bg-secondary/40 p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Profile
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {completion}% Complete
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/30 to-teal-500/10 border border-primary/40 text-primary font-bold text-lg">
                  {profile.displayName ? profile.displayName[0].toUpperCase() : "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground text-sm truncate">
                    {profile.displayName || "Anonymous Patient"}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.ageGroup ? `${profile.ageGroup.replace("_", " ")} yrs` : "Age not set"}
                    {profile.gender ? ` • ${profile.gender}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {profile.district ? `${profile.district}, ${profile.state}` : "Location not configured"}
                </p>
              </div>

              <Link
                to="/health-profile"
                className="mt-3 block text-center text-xs font-semibold text-primary hover:underline"
              >
                {completion < 60 ? "Complete profile for accurate triage →" : "View & Edit Health ID Card →"}
              </Link>
            </div>
          </div>
        </header>

        {/* Disclaimer Alert */}
        <Alert className="mb-8 border-warning/30 bg-warning/10 text-foreground">
          <ShieldCheck className="h-4 w-4 text-warning" />
          <AlertTitle className="font-semibold text-warning">A Note About Your Health Information</AlertTitle>
          <AlertDescription className="text-muted-foreground leading-relaxed">
            This prototype provides general educational decision support, not a clinical diagnosis. Test recommendations and cost benchmarks must be reviewed with a registered medical practitioner. Saving history is completely optional.
          </AlertDescription>
        </Alert>

        {/* Action Tasks Grid */}
        <section className="mt-8" aria-labelledby="health-actions-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="health-actions-heading" className="text-lg font-bold text-foreground">
                What would you like to do?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Select a task to get started.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <HealthPortalCard
              icon={Bot}
              title="AI Assistance"
              description="Personal health assistant for symptoms, medical inquiries, and welfare scheme navigation."
              to="/ai-assistant"
              action="Consult AI"
            />
            <HealthPortalCard
              icon={HeartPulse}
              title="Report symptoms"
              description="Screen symptoms via typing or voice to predict probable diseases and get targeted tests."
              to="/health-assistant"
              action="Start report"
            />
            <HealthPortalCard
              icon={Landmark}
              title="Schemes & care"
              description="Explore Ayushman Bharat, Jan Aushadhi, and free diagnostic testing centers."
              to="/health-schemes"
              action="Explore support"
            />
            <HealthPortalCard
              icon={UserRound}
              title="Manage profile"
              description="Update your address, age, and clinical notes to calibrate disease predictions."
              to="/health-profile"
              action="Edit profile"
            />
            <HealthPortalCard
              icon={ListChecks}
              title="My health history"
              description="View, export, or manage session records and regional trends stored locally on your device."
              to="/health-assistant#history"
              action="View history"
            />
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-bold text-foreground text-lg">A Simple, Privacy-Preserving Flow</h2>
            <ol className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  1
                </span>
                <strong className="block text-foreground mb-1">1. Configure Profile</strong>
                Add your age and district to calibrate localized disease surveillance.
              </li>
              <li className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  2
                </span>
                <strong className="block text-foreground mb-1">2. Describe Symptoms</strong>
                Type or speak your symptoms and duration for instant clinical analysis.
              </li>
              <li className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  3
                </span>
                <strong className="block text-foreground mb-1">3. Save on Testing</strong>
                Take only targeted laboratory tests, saving up to 80% on blanket panels.
              </li>
            </ol>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-primary/30 bg-gradient-to-b from-card to-card/60 p-6 text-foreground shadow-[var(--shadow-card)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Ready to begin?</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">Tell us what you’re experiencing</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Screen for red flags, view high-probability conditions, and optimize diagnostic expenses immediately.
              </p>
            </div>
            <Link
              to="/health-assistant"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-md"
            >
              Report symptoms <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </HealthPortalLayout>
  );
}
