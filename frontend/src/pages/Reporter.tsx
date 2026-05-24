import { useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { MapPin, Wifi, Send, FileText, Info, Shield, Clock, Navigation } from "lucide-react";
import { useCities } from "@/hooks/useApi";
import { allDiseases } from "@/data/mockData";
import { toast } from "sonner";

const symptomOptions = ["Fever", "Cough", "Headache", "Joint Pain", "Rash", "Chills", "Fatigue", "Nausea", "Vomiting", "Difficulty Breathing"];
const severityOptions = ["Mild (1-5 cases)", "Moderate (6-20 cases)", "Severe (21-50 cases)", "Critical (50+ cases)"];

interface Report {
  id: string;
  name: string;
  city: string;
  disease: string;
  cases: number;
  severity: string;
  location: string;
  symptoms: string[];
  notes: string;
  time: string;
}

export default function Reporter() {
  const { data: cities = [] } = useCities();
  const [tab, setTab] = useState<"new" | "reports">("new");
  const [name, setName] = useState("");
  const [contactId, setContactId] = useState("");
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [selectedDisease, setSelectedDisease] = useState("Dengue");
  const [caseCount, setCaseCount] = useState("");
  const [severity, setSeverity] = useState("Moderate (6-20 cases)");
  const [gpsLocation, setGpsLocation] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [reports, setReports] = useState<Report[]>(() => {
    try { return JSON.parse(localStorage.getItem("epidem_reports") || "[]"); } catch { return []; }
  });

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const getGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setGpsLocation("28.6139, 77.2090 (simulated)")
      );
    } else {
      setGpsLocation("28.6139, 77.2090 (simulated)");
    }
  };

  const submitReport = () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!caseCount) { toast.error("Please enter case count"); return; }

    const report: Report = {
      id: `FR${Date.now()}`,
      name,
      city: selectedCity,
      disease: selectedDisease,
      cases: parseInt(caseCount) || 0,
      severity,
      location: gpsLocation || "Not provided",
      symptoms: Array.from(selectedSymptoms),
      notes,
      time: "Just now",
    };

    const updated = [report, ...reports];
    setReports(updated);
    localStorage.setItem("epidem_reports", JSON.stringify(updated));
    toast.success("Report submitted to surveillance system");

    // Reset
    setName("");
    setContactId("");
    setCaseCount("");
    setGpsLocation("");
    setSelectedSymptoms(new Set());
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold">Disease Reporter</h1>
            <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
              <Wifi className="h-3 w-3" /> Online — live sync active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Submit cluster reports from the field. Works offline — auto-syncs when connected.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          <button onClick={() => setTab("new")} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${tab === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            New Report
          </button>
          <button onClick={() => setTab("reports")} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${tab === "reports" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            My Reports ({reports.length})
          </button>
        </div>

        {tab === "new" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Reporter Info */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Reporter Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Your Name *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Field worker name" className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Contact / Worker ID</label>
                    <input value={contactId} onChange={(e) => setContactId(e.target.value)} placeholder="Phone or ID" className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Cluster Details */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Cluster Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">City</label>
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Disease / Condition</label>
                    <select value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                      {allDiseases.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Case Count *</label>
                    <input type="number" value={caseCount} onChange={(e) => setCaseCount(e.target.value)} placeholder="Number of cases" className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Severity Assessment</label>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                      {severityOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* GPS */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">GPS / Location Tag</h3>
                <div className="flex gap-2">
                  <input value={gpsLocation} onChange={(e) => setGpsLocation(e.target.value)} placeholder="Lat, Lng or area description" className="flex-1 h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                  <button onClick={getGPS} className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                    <Navigation className="h-3.5 w-3.5" /> GPS
                  </button>
                </div>
              </div>

              {/* Symptoms */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Observed Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedSymptoms.has(s)
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Additional Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe the situation, patient demographics, local conditions, recent events..."
                  className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <button onClick={submitReport} className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 glow-primary">
                <Send className="h-4 w-4" /> Submit to Surveillance System
              </button>
            </div>

            {/* Field Guide */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Field Guide</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">What to report</h4>
                      <p className="text-[11px] text-muted-foreground">Any suspected cluster of 3+ similar illness cases within a localized area</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">Location tagging</h4>
                      <p className="text-[11px] text-muted-foreground">Use GPS button or enter neighborhood/ward name for accurate geo-mapping</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Wifi className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">Offline mode</h4>
                      <p className="text-[11px] text-muted-foreground">Reports save locally when offline and auto-sync when you regain connectivity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <Shield className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">Priority</h4>
                      <p className="text-[11px] text-muted-foreground">Cases with suspected outbreak potential are automatically flagged for immediate review</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* My Reports */
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">No reports submitted yet.</p>
              </div>
            ) : (
              reports.map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{r.disease}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time}</span>
                  </div>
                  <p className="text-sm font-semibold">{r.city} — {r.cases} cases ({r.severity})</p>
                  {r.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.symptoms.map(s => <span key={s} className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>)}
                    </div>
                  )}
                  {r.notes && <p className="mt-2 text-xs text-muted-foreground">{r.notes}</p>}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
