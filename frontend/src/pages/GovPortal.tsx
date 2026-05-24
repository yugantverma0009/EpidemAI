import { useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Shield, Lock, AlertTriangle, FileText, BarChart3, Activity, Search, Download, Eye } from "lucide-react";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useCities, useAlerts } from "@/hooks/useApi";
import { fieldReports, anomalyData, auditLog, trendData } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";

const ACCESS_CODE = "gov2024";

function GovLogin({ onAccess }: { onAccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (code === ACCESS_CODE) onAccess();
    else setError(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Navbar />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 className="font-display text-xl font-bold mb-1">Government Access</h1>
        <p className="text-xs text-muted-foreground mb-6">Restricted area</p>
        <label className="text-xs font-semibold text-muted-foreground block text-left mb-1">Access Code</label>
        <input
          type="password"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Enter access code"
          className={`w-full h-10 rounded-lg border px-3 text-sm text-foreground bg-secondary/50 focus:outline-none mb-4 ${error ? "border-destructive" : "border-border focus:border-primary/50"}`}
        />
        {error && <p className="text-xs text-destructive mb-3">Invalid access code</p>}
        <button onClick={submit} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" /> Access Government Portal
        </button>
        <p className="text-[10px] text-muted-foreground mt-4">Demo: <span className="font-mono text-foreground">gov2024</span></p>
      </motion.div>
    </div>
  );
}

const tabs = ["Overview", "Field Reports", "Ground Truth", "Anomalies", "Reports"];

function CommandCenter() {
  const [activeTab, setActiveTab] = useState("Overview");
  const { data: cities = [] } = useCities();
  const { data: alertsData = [] } = useAlerts();
  const [auditSearch, setAuditSearch] = useState("");
  const [groundTruthValues, setGroundTruthValues] = useState<Record<string, string>>({});

  const highRiskCities = cities.filter(c => c.riskLevel === "high").length;
  const moderateRiskCities = cities.filter(c => c.riskLevel === "moderate").length;
  const highAlerts = alertsData.filter(a => a.severity === "high").length;

  // Trend chart data — actual vs predicted
  const trendChartData = trendData.map(t => ({
    month: t.month,
    actual: t.dengue,
    predicted: Math.round(t.dengue * (0.85 + Math.random() * 0.3)),
  }));

  const riskRegions = cities.filter(c => c.riskLevel === "high" || c.riskLevel === "moderate").sort((a, b) => b.riskScore - a.riskScore);

  const filteredAudit = auditLog.filter(a =>
    !auditSearch || a.event.toLowerCase().includes(auditSearch.toLowerCase()) || a.type.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const auditTypeBadge: Record<string, string> = {
    ALERT: "bg-destructive/10 text-destructive border-destructive/20",
    REPORT: "bg-primary/10 text-primary border-primary/20",
    SYSTEM: "bg-warning/10 text-warning border-warning/20",
    DATA: "bg-accent/10 text-accent border-accent/20",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold">Government Command Center</h1>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">SECURE</span>
            </div>
            <p className="text-sm text-muted-foreground">Advanced analytics, accuracy tracking, and operational controls</p>
          </div>
          <RealTimeIndicator />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${activeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "High Risk Cities", value: highRiskCities, color: "text-destructive" },
                { label: "Active High Alerts", value: highAlerts, color: "text-warning" },
                { label: "Anomalies Detected", value: anomalyData.length, color: "text-primary" },
                { label: "Audit Events (24h)", value: auditLog.length, color: "text-accent" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                  <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Disease Trend Chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disease Trend Analysis — Actual vs Predicted</h3>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">Dengue</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220,22%,10%)", border: "1px solid hsl(220,18%,18%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(168,80%,42%)" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="hsl(38,92%,50%)" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Regions Table */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">High & Moderate Risk Regions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">State</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Level</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Primary Disease</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cases</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskRegions.map(c => (
                      <tr key={c.name} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold">{c.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{c.state}</td>
                        <td className="px-3 py-2.5 font-mono font-bold">{c.riskScore}</td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${c.riskLevel === "high" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                            {c.riskLevel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">{c.diseases[0]?.name}</td>
                        <td className="px-3 py-2.5 font-mono">{c.diseases[0]?.cases}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs ${c.diseases[0]?.trend === "up" ? "text-destructive" : c.diseases[0]?.trend === "down" ? "text-accent" : "text-muted-foreground"}`}>
                            {c.diseases[0]?.trend === "up" ? "↑ Rising" : c.diseases[0]?.trend === "down" ? "↓ Falling" : "→ Stable"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Field Reports Tab */}
        {activeTab === "Field Reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-display text-2xl font-bold">{fieldReports.length}</p>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-display text-2xl font-bold text-destructive">{fieldReports.filter(r => r.severity === "high").length}</p>
                <p className="text-xs text-muted-foreground">Critical/High</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-display text-2xl font-bold text-warning">1</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Field Reports — Live from field workers</h3>
                <div className="space-y-3">
                  {fieldReports.map(r => (
                    <div key={r.id} className="rounded-lg bg-secondary/30 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{r.city} — {r.disease}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${r.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {r.cases} cases
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">By: {r.reporter} · {r.time}</p>
                      <p className="text-[11px] text-muted-foreground">{r.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Early Detection Signals</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50">
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted-foreground">Location</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted-foreground">Condition</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted-foreground">Cases</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted-foreground">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldReports.map(r => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-3 py-2 font-semibold">{r.city}</td>
                          <td className="px-3 py-2">{r.disease}</td>
                          <td className="px-3 py-2 font-mono">{r.cases}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-[10px] text-muted-foreground">
                  Field reports sync in real-time when workers go online. Offline-first design ensures zero data loss in low-connectivity areas. Reports feed directly into anomaly detection models.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ground Truth Tab */}
        {activeTab === "Ground Truth" && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-1">Ground Truth Validation</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter actual confirmed case counts to compute model accuracy (MAE/MAPE) and calibration confidence by disease and city</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">City</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Disease</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">AI Predicted</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Actual Count</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Error</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.filter(c => c.riskLevel === "high" || c.riskLevel === "moderate").slice(0, 10).map(c => {
                    const key = `${c.name}-${c.diseases[0]?.name}`;
                    const predicted = c.diseases[0]?.cases || 0;
                    const actual = groundTruthValues[key] ? parseInt(groundTruthValues[key]) : null;
                    const error = actual !== null ? Math.abs(predicted - actual) : null;
                    const accuracy = actual !== null && predicted > 0 ? Math.round((1 - Math.abs(predicted - actual) / predicted) * 100) : null;

                    return (
                      <tr key={key} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold">{c.name} <span className="text-[10px] text-muted-foreground">({c.riskLevel})</span></td>
                        <td className="px-3 py-2.5">{c.diseases[0]?.name}</td>
                        <td className="px-3 py-2.5 font-mono">{predicted}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            placeholder="Enter actual"
                            value={groundTruthValues[key] || ""}
                            onChange={(e) => setGroundTruthValues(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-24 h-8 rounded border border-border bg-secondary/50 px-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono">{error !== null ? error : "—"}</td>
                        <td className="px-3 py-2.5">
                          {accuracy !== null ? (
                            <span className={`font-mono font-semibold ${accuracy >= 80 ? "text-accent" : accuracy >= 60 ? "text-warning" : "text-destructive"}`}>{accuracy}%</span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === "Anomalies" && (
          <div className="space-y-6">
            {/* Thresholds */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Anomaly Detection Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "L1 Watch Threshold", value: "+10%", color: "text-warning" },
                  { label: "L2 Warning Threshold", value: "+25%", color: "text-destructive" },
                  { label: "L3 Critical Threshold", value: "+40%", color: "text-destructive" },
                ].map(t => (
                  <div key={t.label} className="rounded-lg bg-secondary/30 p-3 text-center">
                    <p className={`font-display text-lg font-bold ${t.color}`}>{t.value}</p>
                    <p className="text-[10px] text-muted-foreground">{t.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">Alerts active: L1, L2, L3</p>
            </div>

            {/* Active Anomalies Table */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Active Anomalies</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Location</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Severity</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Condition</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Baseline</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Current</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Δ Deviation</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Escalation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalyData.map(a => (
                      <tr key={a.location} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold">{a.location}</td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            a.severity.includes("CRITICAL") ? "bg-destructive/10 text-destructive border-destructive/20"
                            : a.severity.includes("WARNING") ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-primary/10 text-primary border-primary/20"
                          }`}>{a.severity}</span>
                        </td>
                        <td className="px-3 py-2.5">{a.disease}</td>
                        <td className="px-3 py-2.5 font-mono">{a.baseline}</td>
                        <td className="px-3 py-2.5 font-mono">{a.current}</td>
                        <td className="px-3 py-2.5 font-mono text-destructive font-semibold">{a.deviation}</td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{a.escalation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deviation Chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Deviation Chart</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={anomalyData.map(a => ({ name: `${a.location} / ${a.disease}`, baseline: a.baseline, current: a.current }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(215,15%,55%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220,22%,10%)", border: "1px solid hsl(220,18%,18%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="baseline" fill="hsl(215,15%,55%)" name="Baseline" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" fill="hsl(0,75%,55%)" name="Current" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "Reports" && (
          <div className="space-y-6">
            {/* Weekly Summary */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Summary (Last 7 Days)</h3>
                <span className="text-[10px] text-muted-foreground">Auto-generated every Monday</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Alerts", value: "8" },
                  { label: "High Priority", value: "3" },
                  { label: "Cities Monitored", value: "20" },
                  { label: "Avg Risk Score", value: "48" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-secondary/30 p-3 text-center">
                    <p className="font-display text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exportable Reports */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Exportable Reports</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Weekly Rollup Dashboard", desc: "Disease trends, top alerts, risk score changes, and prediction accuracy for the past 7 days", last: "2 days ago · 8 pages", formats: ["PDF", "CSV"] },
                  { title: "Outbreak Incident Report", desc: "Detailed city-level incident report with confidence scores, signal breakdown, and response recommendations", last: "5 days ago · 14 pages", formats: ["PDF"] },
                  { title: "Surveillance Data Export", desc: "Raw surveillance data including mentions, cases, prediction values, and ground truth entries", last: "3 days ago · 5 pages", formats: ["PDF", "CSV"] },
                ].map(r => (
                  <div key={r.title} className="rounded-lg border border-border bg-secondary/20 p-4">
                    <h4 className="text-sm font-semibold mb-1">{r.title}</h4>
                    <p className="text-[11px] text-muted-foreground mb-3">{r.desc}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Last: {r.last}</p>
                    <div className="flex gap-2">
                      {r.formats.map(f => (
                        <button key={f} className="flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Download className="h-3 w-3" /> {f}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground italic">
                Note: CSV exports download immediately. PDF reports are generated server-side and typically ready within 30 seconds. All reports are watermarked with your government credentials and audit-logged.
              </p>
            </div>

            {/* Audit Log */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Log</h3>
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search events..."
                    className="h-8 w-48 rounded border border-border bg-secondary/50 px-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {filteredAudit.map(a => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg bg-secondary/20 px-3 py-2">
                    <span className={`mt-0.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${auditTypeBadge[a.type]}`}>{a.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">{a.event}</p>
                      <p className="text-[10px] text-muted-foreground">{a.user} · {a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GovPortal() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) return <GovLogin onAccess={() => setAuthenticated(true)} />;
  return <CommandCenter />;
}
