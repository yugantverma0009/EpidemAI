import { ArrowRight, HeartPulse, Landmark, ListChecks, MapPinned, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HealthPortalCard, HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";

export default function HealthPortal() {
  const { profile } = useHealthProfile();
  return <HealthPortalLayout>
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"><HeartPulse className="h-3.5 w-3.5" /> Individual Health Portal</p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Your Personal Health Assistant</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{profile.displayName ? `Hello, ${profile.displayName}. ` : ""}Describe what you’re experiencing, review the information you share, and get general guidance on possible next steps.</p>
      </div>

      <Alert className="mt-7 max-w-3xl border-warning/30 bg-warning/10 text-foreground">
        <ShieldCheck className="h-4 w-4 text-warning" />
        <AlertTitle className="font-semibold text-warning">A note about your health information</AlertTitle>
        <AlertDescription className="text-muted-foreground">This prototype provides general information, not a diagnosis. Clinical content has not been reviewed by a qualified clinician. Saving history is optional and requires your separate consent.</AlertDescription>
      </Alert>

      <section className="mt-9" aria-labelledby="health-actions-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><h2 id="health-actions-heading" className="text-lg font-semibold text-foreground">What would you like to do?</h2><p className="mt-1 text-sm text-muted-foreground">Choose a task to get started.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <HealthPortalCard icon={HeartPulse} title="Report symptoms" description="Share symptoms by typing or optional voice input, then review before continuing." to="/health-assistant" action="Start report" />
          <HealthPortalCard icon={MapPinned} title="Local health trends" description="See historical district observations when matching source data is available." to="/health-assistant#local-context" action="Explore context" />
          <HealthPortalCard icon={ListChecks} title="My health history" description="View, export, or delete entries only after choosing to save them." to="/health-assistant#history" action="View history" />
          <HealthPortalCard icon={ListChecks} title="Previous reports" description="Review entries saved for this browser session. No account or cross-device history is available." to="/health-assistant#history" action="Review reports" />
          <HealthPortalCard icon={Landmark} title="Schemes & care" description="Explore government health benefits, public services, and nearby care options." to="/health-schemes" action="Explore support" />
        </div>
      </section>

      <Link to="/health-profile" className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><UserRound className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">My profile and approximate location</strong><span className="mt-1 block text-sm text-muted-foreground">{profile.state || profile.district ? `Saved for this visit: ${[profile.district, profile.state].filter(Boolean).join(", ")}. ` : ""}Add optional visit-only details; no street address or account is required.</span></span>
        <ArrowRight className="h-4 w-4 text-primary" />
      </Link>

      <section className="mt-9 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-semibold text-foreground">A simple, private-by-choice flow</h2>
          <ol className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <li><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">1</span><strong className="block text-foreground">Describe</strong>Type or dictate your symptoms. Typed input is always available.</li>
            <li><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">2</span><strong className="block text-foreground">Review</strong>Check and edit the structured summary before you continue.</li>
            <li><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">3</span><strong className="block text-foreground">Choose</strong>Use without saving, or separately opt in to short-term history.</li>
          </ol>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-primary/25 bg-card p-5 text-foreground shadow-[var(--shadow-card)] sm:p-6">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Need to begin?</p><h2 className="mt-2 text-xl font-semibold text-foreground">Tell us what you’re experiencing</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The assistant will screen for a small set of warning signs and show clear limitations.</p></div>
          <Link to="/health-assistant" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Report symptoms <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  </HealthPortalLayout>;
}
