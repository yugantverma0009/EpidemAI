import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Map, BarChart3, Brain, Bell, Shield, ArrowRight, Zap, Globe, TrendingUp, Clock, Database } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cities, alerts } from "@/data/mockData";

const capabilities = [
  { icon: Brain, title: "Real-time NLP Processing", desc: "Monitors 2,400+ news and social media sources using Named Entity Recognition to detect disease mentions.", to: "/dashboard" },
  { icon: Map, title: "Hotspot Detection", desc: "Geo-tags and clusters disease mentions using DBSCAN to identify outbreak regions across India.", to: "/disease-map" },
  { icon: BarChart3, title: "Predictive Forecasting", desc: "Prophet & LSTM models forecast disease spread 24-72 hours ahead with confidence intervals.", to: "/predictive" },
  { icon: Shield, title: "Risk Scoring Engine", desc: "Calculates outbreak probability and risk levels (Low/Medium/High) for each monitored region.", to: "/solutions" },
];

const topCluster = cities.reduce((a, b) => a.riskScore > b.riskScore ? a : b);
const regionsAboveThreshold = cities.filter(c => c.riskScore >= 40).length;

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(168,80%,42%) 1px, transparent 1px), linear-gradient(90deg, hsl(168,80%,42%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="container relative mx-auto px-4 py-24 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Disease Surveillance</span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Epidem<span className="text-primary text-glow">AI</span>
            </h1>

            {/* Today at a Glance */}
            <div className="mx-auto mt-6 max-w-lg rounded-xl border border-border bg-card/50 p-4 text-left backdrop-blur-sm">
              <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Today at a Glance</h2>
              <p className="text-sm text-foreground mb-1">Detect outbreaks before they spread.</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Regions above Risk Threshold: <span className="font-semibold text-foreground">{regionsAboveThreshold}</span> <span className="text-destructive">(+5 since morning)</span></p>
                <p>Most affected cluster: <span className="font-semibold text-foreground">East {topCluster.name} — {topCluster.diseases[0]?.name}</span></p>
                <p>Social media + news dominant</p>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground italic">Updated continuously from news feeds, social media, and model inference</p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 glow-primary">
                <Zap className="h-4 w-4" /> Open Live Dashboard
              </Link>
              <Link to="/solutions" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                Explore Approach <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Stats ribbon */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="mx-auto mt-12 grid max-w-3xl grid-cols-4 gap-3 rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
            {[
              { label: "States Monitored", value: "14", icon: Globe },
              { label: "Data Sources", value: "2.4K", icon: Database },
              { label: "Real-time Tracking", value: "24/7", icon: Clock },
              { label: "Active Alerts", value: alerts.length.toString(), icon: Bell },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-1 text-center font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Capabilities</h2>
        <p className="mx-auto mb-10 max-w-md text-center text-sm text-muted-foreground">AI-powered surveillance at every layer</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link to={c.to} className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-sm font-bold">{c.title}</h3>
                <p className="mt-1.5 flex-1 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-2 font-display text-2xl font-bold">Ready to monitor disease outbreaks?</h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
            EpidemAI helps health authorities detect outbreaks early, predict spread, and respond faster.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 glow-primary">
              Open Dashboard
            </Link>
            <Link to="/alerts" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              View Alerts
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-center">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-bold">Epidem<span className="text-primary">AI</span></span>
          </div>
          <p className="text-xs text-muted-foreground">AI-Powered Public Health Surveillance & Prediction System</p>
        </div>
      </footer>
    </div>
  );
}
