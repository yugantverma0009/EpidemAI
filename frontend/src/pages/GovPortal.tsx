import { useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Shield, FileText, BarChart3, Activity, Search, Eye, Download } from "lucide-react";
import RealTimeIndicator from "@/components/RealTimeIndicator";
import { useCities, useAlerts } from "@/hooks/useApi";
import { fieldReports, anomalyData, auditLog, trendData } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";

function GovLogin({ onAccess }: { onAccess: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Navbar />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="mb-2 flex items-center justify-center gap-2"><h1 className="font-display text-xl font-bold">Government Portal</h1><span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Preview</span></div>
        <p className="mb-5 text-sm leading-6 text-muted-foreground">Explore public health trends, alerts, and reports in the EpidemAI dashboard.</p>
        <p className="mb-5 rounded-lg bg-secondary/70 px-3 py-2 text-xs text-muted-foreground">Sample data · Open preview · No sign-in</p>
        <button onClick={onAccess} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
          Open dashboard
        </button>
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

  // Bundled trend rows are examples, not current surveillance records.
  const trendChartData = trendData.map(t => ({
    month: t.month,
    demonstration: t.dengue,
  }));

  const riskRegions = cities.filter(c => c.riskLevel === "high" || c.riskLevel === "moderate").sort((a, b) => b.riskScore - a.riskScore);

  const filteredAudit = auditLog.filter(a =>
    !auditSearch || a.event.toLowerCase().includes(auditSearch.toLowerCase()) || a.type.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const reportLocations = new Set(alertsData.map(alert => alert.region || alert.location).filter(Boolean));
  const averageRiskScore = cities.length
    ? Math.round(cities.reduce((total, city) => total + city.riskScore, 0) / cities.length)
    : 0;

  const exportAlertReport = (format: "csv" | "json") => {
    const timestamp = new Date().toISOString();
    const rows = alertsData.map(({ id, severity, title, location, region, confidence, time, description }) => ({
      id, severity, title, location, region, confidence, time, description,
    }));
    const content = format === "json"
      ? JSON.stringify({ generated_at: timestamp, report: "Bundled example alert snapshot", records: rows }, null, 2)
      : [
          ["id", "severity", "title", "location", "region", "confidence", "time", "description"],
          ...rows.map(row => Object.values(row)),
        ].map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `epidemai-alert-snapshot-${timestamp.slice(0, 10)}.${format}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const auditTypeBadge: Record<string, string> = {
    ALERT: "bg-destructive/10 text-destructive border-destructive/20",
    REPORT: "bg-primary/10 text-primary border-primary/20",
    SYSTEM: "bg-warning/10 text-warning border-warning/20",
    DATA: "bg-accent/10 text-accent border-accent/20",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pt-20 pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold">Government Command Center</h1>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">PREVIEW</span>
            </div>
            <p className="text-sm text-muted-foreground">Public health trends, alerts, and reporting tools</p>
          </div>
          <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Sample data · Not live</span><RealTimeIndicator /></div>
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demonstration disease trend</h3><p className="mt-1 text-xs text-warning">Bundled sample values · not current case counts</p></div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">Dengue</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220,22%,10%)", border: "1px solid hsl(220,18%,18%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="demonstration" stroke="hsl(168,80%,42%)" strokeWidth={2} name="Sample series" />
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
                <p className="text-xs text-muted-foreground">Example reports</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-display text-2xl font-bold text-destructive">{fieldReports.filter(r => r.severity === "high").length}</p>
                <p className="text-xs text-muted-foreground">High-labelled examples</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-display text-2xl font-bold text-warning">1</p>
                <p className="text-xs text-muted-foreground">Flagged examples</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Bundled field report examples</h3>
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
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Illustrative signals</h3>
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
                  These are bundled demonstration rows. This prototype does not persist field reports, sync offline submissions, or feed individual reports into anomaly detection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ground Truth Tab */}
        {activeTab === "Ground Truth" && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-1">Ground Truth Validation</h3>
            <p className="mb-4 text-xs text-warning">Demonstration-only comparison using bundled sample values. It does not validate model accuracy or calibration.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">City</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Disease</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Sample value</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Entered comparison</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Difference</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Relative closeness*</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.filter(c => c.riskLevel === "high" || c.riskLevel === "moderate").slice(0, 10).map(c => {
                    const key = `${c.name}-${c.diseases[0]?.name}`;
                    const predicted = c.diseases[0]?.cases || 0;
                    const actual = groundTruthValues[key] ? parseInt(groundTruthValues[key]) : null;
                    const error = actual !== null ? Math.abs(predicted - actual) : null;
                    const closeness = actual !== null && predicted > 0 ? Math.max(0, Math.round((1 - Math.abs(predicted - actual) / predicted) * 100)) : null;

                    return (
                      <tr key={key} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold">{c.name} <span className="text-[10px] text-muted-foreground">({c.riskLevel})</span></td>
                        <td className="px-3 py-2.5">{c.diseases[0]?.name}</td>
                        <td className="px-3 py-2.5 font-mono">{predicted}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Enter a comparison value for ${c.name} ${c.diseases[0]?.name}`}
                            placeholder="Optional"
                            value={groundTruthValues[key] || ""}
                            onChange={(e) => setGroundTruthValues(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-24 h-8 rounded border border-border bg-secondary/50 px-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono">{error !== null ? error : "—"}</td>
                        <td className="px-3 py-2.5">
                          {closeness !== null ? (
                            <span className={`font-mono font-semibold ${closeness >= 80 ? "text-accent" : closeness >= 60 ? "text-warning" : "text-destructive"}`}>{closeness}%</span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">*Calculated in this browser from demonstration values. This is not a model evaluation metric.</p>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === "Anomalies" && (
          <div className="space-y-6">
            {/* Thresholds */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Illustrative anomaly thresholds</h3>
              <p className="mb-4 text-xs text-warning">Illustrative threshold examples only; no anomaly alerting is active in this prototype.</p>
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
              <p className="mt-3 text-[10px] text-muted-foreground">Threshold values shown for discussion; not connected to an alert service.</p>
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
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Demonstration deviation chart</h3><p className="mb-4 text-xs text-warning">Bundled sample values · not current surveillance</p>
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
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><h2 className="font-display text-base font-semibold">Dashboard snapshot</h2><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground">Current view</span></div><p className="mt-1 text-xs text-muted-foreground">Calculated from the bundled example records currently shown; this is not an official report.</p></div>
                <div className="flex gap-2"><button type="button" onClick={() => exportAlertReport("csv")} disabled={!alertsData.length} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" />Download CSV</button><button type="button" onClick={() => exportAlertReport("json")} disabled={!alertsData.length} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" />Download JSON</button></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Alert records", value: alertsData.length, tone: "text-foreground" },
                  { label: "High priority", value: highAlerts, tone: "text-warning" },
                  { label: "Regions represented", value: reportLocations.size, tone: "text-primary" },
                  { label: "Average area index", value: averageRiskScore, tone: "text-accent" },
                ].map(metric => <div key={metric.label} className="rounded-xl border border-border bg-secondary/30 p-4"><p className={`font-display text-2xl font-bold ${metric.tone}`}>{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.label}</p></div>)}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold">Example alert records</h2><p className="mt-1 text-xs text-muted-foreground">Download the bundled example records currently available in this preview.</p></div><FileText className="h-5 w-5 text-muted-foreground" /></div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[640px] text-left text-xs"><thead className="bg-secondary/50 text-muted-foreground"><tr><th className="px-3 py-2.5 font-medium">Alert</th><th className="px-3 py-2.5 font-medium">Region</th><th className="px-3 py-2.5 font-medium">Priority</th><th className="px-3 py-2.5 font-medium">Reported</th></tr></thead><tbody>{alertsData.slice(0, 8).map(alert => <tr key={alert.id} className="border-t border-border"><td className="px-3 py-3 font-medium text-foreground">{alert.title}</td><td className="px-3 py-3 text-muted-foreground">{alert.region || alert.location || "—"}</td><td className="px-3 py-3 capitalize text-muted-foreground">{alert.severity}</td><td className="px-3 py-3 text-muted-foreground">{alert.time || "—"}</td></tr>)}{alertsData.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No alert records are available.</td></tr>}</tbody></table></div>
            </section>

            {/* Audit Log */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity log</h3><p className="mt-1 text-[10px] text-muted-foreground">Recent dashboard preview activity</p></div>
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
      </main>
    </div>
  );
}

export default function GovPortal() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) return <GovLogin onAccess={() => setAuthenticated(true)} />;
  return <CommandCenter />;
}
