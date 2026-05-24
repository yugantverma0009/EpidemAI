import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Beaker, RotateCcw, Droplets, Thermometer, Users, Info } from "lucide-react";
import { useCities } from "@/hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid } from "recharts";

const diseases = ["Dengue", "Malaria", "Flu", "COVID-like"];

export default function WhatIf() {
  const { data: cities = [] } = useCities();
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [selectedDisease, setSelectedDisease] = useState("Dengue");
  const [humidity, setHumidity] = useState(65);
  const [temperature, setTemperature] = useState(28);
  const [mobility, setMobility] = useState(60);

  const city = cities.find(c => c.name === selectedCity) || cities[0];

  // Simulation logic
  const simData = useMemo(() => {
    if (!city) return [];
    const baselineCases = city.diseases.find(d => d.name === selectedDisease)?.cases || 100;
    const humidityFactor = selectedDisease === "Dengue" || selectedDisease === "Malaria"
      ? 1 + Math.max(0, (humidity - 50) / 100) * 1.5
      : 1 + (humidity - 50) / 200;
    const tempFactor = temperature >= 25 && temperature <= 35
      ? 1 + (temperature - 25) / 20
      : 1;
    const mobilityFactor = selectedDisease === "Flu" || selectedDisease === "COVID-like"
      ? 1 + (mobility / 100) * 0.8
      : 1 + (mobility / 100) * 0.3;

    const multiplier = humidityFactor * tempFactor * mobilityFactor;

    return Array.from({ length: 21 }, (_, i) => {
      const day = i + 1;
      const baseGrowth = 1 + (day / 21) * 0.8;
      const baseline = Math.round(baselineCases * baseGrowth);
      const simulated = Math.round(baselineCases * baseGrowth * multiplier);
      return { day: `D${day}`, baseline, simulated };
    });
  }, [city, selectedDisease, humidity, temperature, mobility]);

  const peakBaseline = Math.max(...simData.map(d => d.baseline));
  const peakSimulated = Math.max(...simData.map(d => d.simulated));
  const changePercent = Math.round(((peakSimulated - peakBaseline) / peakBaseline) * 100);

  // City risk chart data
  const cityRiskData = useMemo(() => {
    return cities.slice(0, 8).map(c => ({
      city: c.name,
      cases: c.diseases.find(d => d.name === selectedDisease)?.cases || 0,
    }));
  }, [cities, selectedDisease]);

  const resetFactors = () => {
    setHumidity(65);
    setTemperature(28);
    setMobility(60);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Beaker className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">EpidemAI · Simulation Lab</h1>
            <h2 className="font-display text-2xl font-bold">What-If Sandbox</h2>
            <p className="text-sm text-muted-foreground">Adjust environmental factors to simulate disease spread scenarios and raise public awareness</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Setup */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Scenario Setup</h3>

              {/* City */}
              <label className="text-xs font-semibold text-muted-foreground">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-1 mb-4 w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              >
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
              </select>

              {/* Disease */}
              <label className="text-xs font-semibold text-muted-foreground">Disease</label>
              <div className="mt-1 mb-4 flex flex-wrap gap-2">
                {diseases.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDisease(d)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedDisease === d
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Environmental Factors */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Environmental Factors</h4>
                <button onClick={resetFactors} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>

              {/* Humidity */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-primary" /> Humidity</span>
                  <span className="font-mono font-semibold">{humidity}%</span>
                </div>
                <input type="range" min={0} max={100} value={humidity} onChange={(e) => setHumidity(+e.target.value)} className="w-full accent-primary" />
              </div>

              {/* Temperature */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1"><Thermometer className="h-3 w-3 text-warning" /> Temperature</span>
                  <span className="font-mono font-semibold">{temperature}°C</span>
                </div>
                <input type="range" min={15} max={45} value={temperature} onChange={(e) => setTemperature(+e.target.value)} className="w-full accent-warning" />
              </div>

              {/* Mobility */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3 text-accent" /> Population Mobility</span>
                  <span className="font-mono font-semibold">{mobility}%</span>
                </div>
                <input type="range" min={0} max={100} value={mobility} onChange={(e) => setMobility(+e.target.value)} className="w-full accent-accent" />
              </div>
            </div>

            {/* Environmental Impact Guide */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Environmental Impact Guide</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">Humidity → Dengue/Malaria</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Mosquito breeding increases sharply above 70% humidity. Each 10% rise can add ~15% more cases.</p>
                </div>
                <div className="rounded-lg bg-warning/5 border border-warning/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs font-semibold">Temperature → All Diseases</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">25-35°C is peak zone for most vectors. Cold suppresses spread; extreme heat slows mosquitoes.</p>
                </div>
                <div className="rounded-lg bg-accent/5 border border-accent/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-semibold">Mobility → Flu/COVID</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Every 10% increase in mobility can amplify respiratory disease R₀ by ~0.1, accelerating spread.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chart + Results */}
          <div className="lg:col-span-8 space-y-4">
            {/* Projection Chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-semibold">
                  {selectedCity} · {selectedDisease} — 21-Day Projection
                </h3>
                <span className="text-[10px] text-muted-foreground">Simulated vs baseline case trajectory</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={simData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220,22%,10%)", border: "1px solid hsl(220,18%,18%)", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(210,20%,90%)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="baseline" stroke="hsl(215,15%,55%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline" />
                  <Line type="monotone" dataKey="simulated" stroke="hsl(168,80%,42%)" strokeWidth={2} dot={false} name="Simulated" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Scenario Impact */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Scenario Impact</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-muted-foreground">City</span>
                  <p className="text-sm font-semibold">{selectedCity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Peak (baseline)</span>
                  <p className="text-sm font-semibold">{peakBaseline} cases</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Peak (simulated)</span>
                  <p className="text-sm font-semibold text-primary">{peakSimulated} cases</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Change</span>
                  <p className={`text-sm font-semibold ${changePercent > 0 ? "text-destructive" : "text-accent"}`}>
                    {changePercent > 0 ? "+" : ""}{peakSimulated - peakBaseline} ({changePercent > 0 ? "+" : ""}{changePercent}%)
                  </p>
                </div>
              </div>
            </div>

            {/* City Risk Chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Current {selectedDisease} Risk Across Cities
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityRiskData}>
                  <XAxis dataKey="city" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220,22%,10%)", border: "1px solid hsl(220,18%,18%)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="cases" fill="hsl(168,80%,42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">How It Works</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This sandbox uses environmental multiplier models to simulate how changes in humidity, temperature, and population mobility
                affect disease trajectories. Humidity above 70% significantly increases mosquito breeding for vector-borne diseases.
                Temperature in the 25-35°C range is optimal for most disease vectors. Higher mobility accelerates respiratory disease
                transmission. Adjust the sliders to explore different scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
