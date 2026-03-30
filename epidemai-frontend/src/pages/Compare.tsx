import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useCities } from "@/hooks/useApi";
import type { CityData } from "@/data/mockData";
import { motion } from "framer-motion";
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

function RiskGaugeSmall({ score, label }: { score: number; label: string }) {
  const strokeColor = score >= 70 ? "hsl(0,75%,55%)" : score >= 40 ? "hsl(38,92%,50%)" : "hsl(145,70%,45%)";
  const circumference = Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 120 70">
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="hsl(220,18%,18%)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={offset} />
        <text x="60" y="55" textAnchor="middle" fill={strokeColor} fontSize="20" fontWeight="bold" fontFamily="var(--font-display)">{score}</text>
      </svg>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Compare() {
  const { data: cities = [] } = useCities();
  const [cityA, setCityA] = useState<CityData | null>(null);
  const [cityB, setCityB] = useState<CityData | null>(null);

  // Set defaults when cities load
  const effectiveCityA = cityA || cities[0];
  const effectiveCityB = cityB || cities[1];

  if (!effectiveCityA || !effectiveCityB) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 pt-20"><p className="text-muted-foreground">Loading cities...</p></div></div>;
  }

  const diff = effectiveCityA.riskScore - effectiveCityB.riskScore;
  const mentionDiff = effectiveCityA.mentions - effectiveCityB.mentions;

  const symptomsA = new Set(effectiveCityA.symptoms);
  const symptomsB = new Set(effectiveCityB.symptoms);
  const onlyA = effectiveCityA.symptoms.filter(s => !symptomsB.has(s));
  const onlyB = effectiveCityB.symptoms.filter(s => !symptomsA.has(s));
  const shared = effectiveCityA.symptoms.filter(s => symptomsB.has(s));

  const maxPredA = Math.max(...effectiveCityA.prediction7d);
  const maxPredB = Math.max(...effectiveCityB.prediction7d);
  const maxPred = Math.max(maxPredA, maxPredB);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">City Comparison</h1>
          <p className="text-sm text-muted-foreground">Compare risk scores, symptoms, and outbreak trends between two cities side by side.</p>
        </div>

        {/* City selectors */}
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City A</span>
            <select value={effectiveCityA.name} onChange={(e) => setCityA(cities.find(c => c.name === e.target.value)!)} className="h-10 rounded-lg border border-border bg-secondary/50 px-4 text-sm font-semibold text-foreground focus:border-primary/50 focus:outline-none">
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difference</span>
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-lg font-display font-bold ${diff > 0 ? "border-destructive/30 text-destructive" : diff < 0 ? "border-accent/30 text-accent" : "border-border text-muted-foreground"}`}>
              <ArrowRightLeft className="h-4 w-4" />
              {diff > 0 ? "+" : ""}{diff}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City B</span>
            <select value={effectiveCityB.name} onChange={(e) => setCityB(cities.find(c => c.name === e.target.value)!)} className="h-10 rounded-lg border border-border bg-secondary/50 px-4 text-sm font-semibold text-foreground focus:border-primary/50 focus:outline-none">
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Risk Score Comparison */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 mb-6">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Score Comparison</h3>
          <div className="flex items-center justify-around">
            <RiskGaugeSmall score={effectiveCityA.riskScore} label={`${effectiveCityA.name}: ${effectiveCityA.riskScore}/100`} />
            <div className="text-center">
              <span className="text-2xl font-display font-bold text-primary">VS</span>
            </div>
            <RiskGaugeSmall score={effectiveCityB.riskScore} label={`${effectiveCityB.name}: ${effectiveCityB.riskScore}/100`} />
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Disease & Mentions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Disease & Mentions</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">{effectiveCityA.name}</h4>
                {effectiveCityA.diseases.map(d => (
                  <div key={d.name} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-sm mb-1">
                    <span>{d.name}</span>
                    <span className="font-mono text-xs">{d.cases}</span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-muted-foreground"><span className="font-mono text-foreground">{effectiveCityA.mentions.toLocaleString()}</span> mentions</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">{effectiveCityB.name}</h4>
                {effectiveCityB.diseases.map(d => (
                  <div key={d.name} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-sm mb-1">
                    <span>{d.name}</span>
                    <span className="font-mono text-xs">{d.cases}</span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-muted-foreground"><span className="font-mono text-foreground">{effectiveCityB.mentions.toLocaleString()}</span> mentions</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Mention difference: <span className={`font-mono font-semibold ${mentionDiff > 0 ? "text-destructive" : "text-accent"}`}>{mentionDiff > 0 ? "+" : ""}{mentionDiff}</span></p>
          </motion.div>

          {/* Symptoms Comparison */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Symptom Comparison</h3>
            {shared.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Shared</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {shared.map(s => <span key={s} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary">{s}</span>)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Only {effectiveCityA.name}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {onlyA.map(s => <span key={s} className="rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-0.5 text-xs text-destructive">{s}</span>)}
                  {onlyA.length === 0 && <span className="text-xs text-muted-foreground">None unique</span>}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Only {effectiveCityB.name}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {onlyB.map(s => <span key={s} className="rounded-full border border-warning/20 bg-warning/5 px-2.5 py-0.5 text-xs text-warning">{s}</span>)}
                  {onlyB.length === 0 && <span className="text-xs text-muted-foreground">None unique</span>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 7-Day Prediction Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">7-Day Prediction Trend</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold mb-2">{effectiveCityA.name} — {effectiveCityA.diseases[0]?.name}</h4>
              <div className="flex items-end gap-1 h-20">
                {effectiveCityA.prediction7d.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground">{v}</span>
                    <div className="w-full rounded-sm bg-destructive/60" style={{ height: `${(v / maxPred) * 56}px` }} />
                    <span className="text-[8px] text-muted-foreground">D{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-2">{effectiveCityB.name} — {effectiveCityB.diseases[0]?.name}</h4>
              <div className="flex items-end gap-1 h-20">
                {effectiveCityB.prediction7d.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground">{v}</span>
                    <div className="w-full rounded-sm bg-warning/60" style={{ height: `${(v / maxPred) * 56}px` }} />
                    <span className="text-[8px] text-muted-foreground">D{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* News Comparison */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {[effectiveCityA, effectiveCityB].map((city) => (
            <motion.div key={city.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{city.name} — Latest News</h3>
              {city.news.length > 0 ? (
                <div className="space-y-2">
                  {city.news.map((n, i) => (
                    <div key={i} className="rounded-md bg-secondary/30 px-3 py-2">
                      <p className="text-xs leading-relaxed">{n.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{n.source} · {n.time}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No recent news available</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
