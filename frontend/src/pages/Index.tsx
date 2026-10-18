import { ArrowRight, BarChart3, FileText, HeartPulse, Landmark, Map, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const governmentTools = [
  { to: "/disease-map", label: "Disease map", description: "Explore sample geographic indicators and available historical records.", icon: Map },
  { to: "/dashboard", label: "Public health dashboard", description: "Review bundled example signals, charts and data limitations.", icon: BarChart3 },
  { to: "/alerts", label: "Alert examples", description: "See how a signal review queue could be organized.", icon: ShieldCheck },
  { to: "/predictive", label: "Forecast experiments", description: "Inspect experimental estimates, input periods and assumptions.", icon: Sparkles },
  { to: "/what-if", label: "Scenario analysis", description: "Adjust assumptions and compare modelled scenarios.", icon: BarChart3 },
  { to: "/reporter", label: "Field reporting demo", description: "Explore a local, temporary reporting workflow.", icon: FileText },
];

export default function Index() {
  return <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main id="main-content" tabIndex={-1}>
      <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_75%_10%,hsl(var(--primary)/0.13),transparent_45%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 text-xs font-semibold uppercase tracking-wide text-primary"><Landmark className="h-4 w-4" />Public health intelligence</p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">Turning health signals into <span className="text-primary">public health action</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">EpidemAI brings together public health indicators, experimental analysis and individual symptom reporting to support informed health decisions.</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">The platform is a demonstration and decision-support prototype. It provides general information and analytical examples; it does not replace medical professionals or official surveillance systems.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/gov-portal" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Government Portal <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/health-portal" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><HeartPulse className="h-4 w-4 text-primary" />Individual Health Portal</Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/gov-portal" className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
              <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><Landmark className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">For public health teams</p><h2 className="mt-1 text-xl font-semibold">Government Portal</h2></div></div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Review geographic indicators, trends, example alerts, forecasts and reporting workflows. Sample and historical content is labeled in the workspace.</p>
              <span className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary">Open workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
            <Link to="/health-portal" className="group rounded-2xl border border-primary/25 bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
              <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><HeartPulse className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">For individuals and families</p><h2 className="mt-1 text-xl font-semibold">Individual Health</h2></div></div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Report symptoms, review general next steps, explore historical district records and find government health scheme information.</p>
              <span className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary">Open health portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </div>
      </section>

      <section id="platform-capabilities" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16" aria-labelledby="capabilities-heading">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Platform capabilities</p><h2 id="capabilities-heading" className="mt-2 text-2xl font-bold sm:text-3xl">A connected set of public health tools</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Each tool keeps its scope visible. Analytics are exploratory, individual guidance is general, and scheme eligibility is confirmed by the responsible authority.</p></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {governmentTools.map(({ to, label, description, icon: Icon }) => <Link key={to} to={to} className="group flex min-h-36 gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
            <span><strong className="text-sm">{label}</strong><span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span><span className="mt-3 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-primary">Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></span>
          </Link>)}
        </div>
      </section>

      <section id="about-epidemai" className="border-y border-border bg-secondary/25">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div><h2 className="font-semibold">About EpidemAI</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A public health technology prototype connecting individual-facing information tools with population-level analysis demonstrations.</p></div>
          <div><h2 className="font-semibold">Data limitations</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bundled surveillance indicators, alert examples and news examples are not live official counts. Check each page for sources, dates and coverage limits.</p></div>
          <div><h2 className="font-semibold">Privacy and health information</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Symptom text is processed by the assistant API. History is separately opt-in and temporary. General guidance is not a diagnosis; seek professional care for medical advice.</p><Link to="/health-assistant" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">Review health information choices <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>
    </main>
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>EpidemAI · Public health information prototype</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2"><a href="#about-epidemai" className="min-h-10 inline-flex items-center hover:text-foreground">About</a><a href="#platform-capabilities" className="min-h-10 inline-flex items-center hover:text-foreground">Platform capabilities</a><Link to="/health-profile" className="min-h-10 inline-flex items-center hover:text-foreground">Privacy choices</Link><Link to="/health-assistant" className="min-h-10 inline-flex items-center hover:text-foreground">Health information</Link></div>
      </div>
    </footer>
  </div>;
}
