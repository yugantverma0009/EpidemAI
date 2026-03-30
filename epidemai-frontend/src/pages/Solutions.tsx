import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Database, Brain, MapPin, Bell, Globe, BarChart3, Shield, Cpu, Users, MessageSquare } from "lucide-react";

const modules = [
  { icon: Brain, title: "NLP Disease Detection", desc: "Named Entity Recognition on 2,400+ news & social media sources to extract disease names, locations, and symptoms in real-time.", status: "Active" as const },
  { icon: MapPin, title: "Geo-Clustering (DBSCAN)", desc: "Automatically clusters geo-tagged disease mentions to detect outbreak regions using density-based spatial analysis.", status: "Active" as const },
  { icon: BarChart3, title: "Risk Scoring Engine", desc: "Calculates outbreak probability and assigns Low/Medium/High risk levels based on multi-factor correlation analysis.", status: "Active" as const },
  { icon: Cpu, title: "Time-Series Forecasting", desc: "Prophet & LSTM models forecast disease spread 24-72 hours ahead with confidence intervals.", status: "Active" as const },
  
  { icon: Users, title: "Community Reporting", desc: "Mobile-first symptom reporting from community health workers, feeding directly into the surveillance pipeline.", status: "Planned" as const },
  { icon: Bell, title: "SMS Alert System", desc: "Automated SMS notifications to district health officers when outbreak confidence exceeds 70% threshold.", status: "Planned" as const },
  { icon: MessageSquare, title: "AI Chat Assistant", desc: "LLM-powered chatbot for health officials to query outbreak status, risk predictions, and recommendations.", status: "Planned" as const },
];

const statusConfig = {
  Active: "bg-accent/15 text-accent border-accent/30",
  Beta: "bg-[hsl(38,70%,50%)]/15 text-[hsl(38,80%,55%)] border-[hsl(38,70%,50%)]/30",
  Planned: "bg-muted/50 text-muted-foreground border-border",
};

const pipelineSteps = [
  { icon: Globe, title: "Data Sources", desc: "News APIs (GDELT, Google News), Social Media (Twitter/X, Reddit), Google Trends, IDSP Health Reports", color: "text-primary" },
  { icon: Database, title: "Data Ingestion", desc: "Python scrapers (BeautifulSoup, Scrapy, snscrape), scheduled via Airflow/Cron for continuous data collection", color: "text-accent" },
  { icon: Brain, title: "NLP Processing", desc: "Named Entity Recognition (spaCy, HuggingFace) extracts disease names, locations, and symptoms from unstructured text", color: "text-warning" },
  { icon: Shield, title: "Event Detection", desc: "Structured events from NLP output: Disease + Location + Date + Severity. Anomaly detection flags unusual patterns", color: "text-destructive" },
  { icon: MapPin, title: "Hotspot Detection", desc: "Geo-tagging (GeoPy), spatial clustering (DBSCAN/K-Means), and outbreak region identification on India's map", color: "text-primary" },
  { icon: Cpu, title: "Prediction Model", desc: "Time-series forecasting with Prophet, ARIMA, and LSTM models trained on historical epidemiological data", color: "text-accent" },
  { icon: BarChart3, title: "Risk Scoring Engine", desc: "Outbreak probability calculation, trend analysis, and risk level classification (Low/Medium/High) per region", color: "text-warning" },
  { icon: Bell, title: "Dashboard & Alerts", desc: "Interactive maps, trend charts, real-time alerts via email/SMS/push notifications", color: "text-destructive" },
];

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-2">
          <h1 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">EpidemAI Technology Stack</h1>
        </div>
        <div className="mb-10">
          <h2 className="font-display text-2xl font-bold">Solutions</h2>
          <p className="text-sm text-muted-foreground">Core AI/ML modules powering the surveillance and prediction pipeline.</p>
        </div>

        {/* Modules Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusConfig[m.status]}`}>
                  {m.status}
                </span>
              </div>
              <h3 className="font-display text-sm font-bold mb-1.5">{m.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="mb-10">
          <h2 className="mb-2 font-display text-xl font-bold">System Pipeline</h2>
          <p className="text-sm text-muted-foreground mb-8">End-to-end pipeline from raw data to predictive intelligence</p>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border lg:left-1/2" />
          <div className="space-y-8">
            {pipelineSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex items-start gap-4 lg:gap-8 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}
              >
                <div className="hidden lg:block lg:w-1/2" />
                <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-background z-10">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="ml-12 lg:ml-0 lg:w-1/2 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                    <h3 className="font-display text-sm font-bold">{step.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
