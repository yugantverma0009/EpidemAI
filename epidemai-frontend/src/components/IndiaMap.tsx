import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CityData } from "@/data/mockData";
import { useCities } from "@/hooks/useApi";
import RegionDetail from "./RegionDetail";
import { Play, Pause, RotateCcw } from "lucide-react";
import indiaSatellite from "@/assets/india-satellite.png";

// Map image coordinates: the satellite image covers approx India bounding box
// We map lat/lng to percentage positions on the image
function toPercent(lat: number, lng: number): { left: string; top: string } {
  // Image bounds (approximate for the satellite image)
  const minLng = 67, maxLng = 98;
  const minLat = 6, maxLat = 38;
  const left = ((lng - minLng) / (maxLng - minLng)) * 100;
  const top = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return { left: `${left}%`, top: `${top}%` };
}

function riskColor(level: string) {
  if (level === "high") return "hsl(0, 75%, 55%)";
  if (level === "moderate") return "hsl(38, 92%, 50%)";
  return "hsl(145, 70%, 45%)";
}

function riskGlow(level: string) {
  if (level === "high") return "0 0 30px 10px hsla(0, 75%, 55%, 0.5), 0 0 60px 20px hsla(0, 75%, 55%, 0.2)";
  if (level === "moderate") return "0 0 25px 8px hsla(38, 92%, 50%, 0.45), 0 0 50px 18px hsla(38, 92%, 50%, 0.15)";
  return "0 0 20px 6px hsla(145, 70%, 45%, 0.4), 0 0 40px 15px hsla(145, 70%, 45%, 0.12)";
}

// Spread animation timeline
const spreadTimeline = [
  { day: 1, label: "Day 1", activeCities: ["Delhi"] },
  { day: 2, label: "Day 2", activeCities: ["Delhi", "Lucknow"] },
  { day: 3, label: "Day 3", activeCities: ["Delhi", "Lucknow", "Jaipur"] },
  { day: 4, label: "Day 4", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai"] },
  { day: 5, label: "Day 5", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai", "Kolkata", "Patna"] },
  { day: 6, label: "Day 6", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai", "Kolkata", "Patna", "Hyderabad", "Pune"] },
  { day: 7, label: "Day 7", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai", "Kolkata", "Patna", "Hyderabad", "Pune", "Chennai", "Guwahati", "Ahmedabad", "Bangalore"] },
];

const spreadConnections: { from: string; to: string; day: number }[] = [
  { from: "Delhi", to: "Lucknow", day: 2 },
  { from: "Delhi", to: "Jaipur", day: 3 },
  { from: "Lucknow", to: "Patna", day: 5 },
  { from: "Delhi", to: "Mumbai", day: 4 },
  { from: "Lucknow", to: "Kolkata", day: 5 },
  { from: "Mumbai", to: "Pune", day: 6 },
  { from: "Mumbai", to: "Hyderabad", day: 6 },
  { from: "Hyderabad", to: "Chennai", day: 7 },
  { from: "Hyderabad", to: "Bangalore", day: 7 },
  { from: "Kolkata", to: "Guwahati", day: 7 },
  { from: "Jaipur", to: "Ahmedabad", day: 7 },
];

interface Props {
  filteredCities?: CityData[];
  onSelectCity?: (city: CityData | null) => void;
  selectedCity?: CityData | null;
  compact?: boolean;
}

export default function IndiaMap({ filteredCities, onSelectCity, selectedCity, compact }: Props) {
  const { data: allCities = [] } = useCities();
  const [internalSelected, setInternalSelected] = useState<CityData | null>(null);
  const [hovered, setHovered] = useState<CityData | null>(null);

  // Spread animation state
  const [spreadMode, setSpreadMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const sel = selectedCity !== undefined ? selectedCity : internalSelected;
  const setSel = onSelectCity || setInternalSelected;
  const displayCities = filteredCities || allCities;

  // Animate through timeline
  useEffect(() => {
    if (!playing || !spreadMode) return;
    if (currentStep >= spreadTimeline.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 1200);
    return () => clearTimeout(timer);
  }, [playing, currentStep, spreadMode]);

  const toggleSpreadMode = useCallback(() => {
    if (spreadMode) {
      setSpreadMode(false);
      setPlaying(false);
      setCurrentStep(0);
    } else {
      setSpreadMode(true);
      setCurrentStep(0);
      setPlaying(true);
    }
  }, [spreadMode]);

  const resetSpread = () => {
    setCurrentStep(0);
    setPlaying(true);
  };

  const activeFrame = spreadTimeline[currentStep];
  const activeCityNames = new Set(activeFrame?.activeCities ?? []);

  // Particle positions (random floating dots for data activity feel)
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: 15 + Math.random() * 70,
      top: 10 + Math.random() * 80,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 1 + Math.random() * 2,
    }));
  }, []);

  // Get city percentage position by name
  const cityPercent = (name: string) => {
    const c = allCities.find((ci) => ci.name === name);
    return c ? toPercent(c.lat, c.lng) : { left: "0%", top: "0%" };
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className={`relative flex-1 rounded-xl border border-border overflow-hidden ${compact ? "min-h-[400px]" : "min-h-[600px]"}`}>
        {/* Satellite map background */}
        <img
          src={indiaSatellite}
          alt="India satellite map"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-background/30" />

        {/* Scanning grid effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(168, 80%, 42%) 1px, transparent 1px), linear-gradient(90deg, hsl(168, 80%, 42%) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Scan line animation */}
        <div className="absolute inset-0 pointer-events-none scan-line opacity-30" />

        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              backgroundColor: "hsl(168, 80%, 42%)",
              opacity: 0.4,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        {/* Spread Animation Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={toggleSpreadMode}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all backdrop-blur-sm ${
              spreadMode
                ? "border-primary/40 bg-primary/20 text-primary"
                : "border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {spreadMode ? "Exit Spread View" : "▶ Spread Animation"}
          </button>
        </div>

        {/* Timeline Controls */}
        <AnimatePresence>
          {spreadMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-12 right-3 z-20 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-2 backdrop-blur-md">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={resetSpread}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <div className="ml-1 flex items-center gap-1">
                  {spreadTimeline.map((frame, i) => (
                    <button
                      key={frame.day}
                      onClick={() => { setCurrentStep(i); setPlaying(false); }}
                      className={`h-2 w-2 rounded-full transition-all ${
                        i <= currentStep ? "bg-primary scale-110" : "bg-muted-foreground/30"
                      } ${i === currentStep ? "ring-2 ring-primary/30" : ""}`}
                    />
                  ))}
                </div>
                <span className="ml-2 font-mono text-xs font-bold text-primary">
                  {activeFrame?.label}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card/90 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur-md">
                <span className="font-semibold text-foreground">{activeCityNames.size}</span> cities affected · Dengue outbreak simulation
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spread connection lines (SVG overlay) */}
        {spreadMode && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
            {spreadConnections
              .filter((conn) => conn.day <= activeFrame.day)
              .map((conn) => {
                const from = cityPercent(conn.from);
                const to = cityPercent(conn.to);
                const isNew = conn.day === activeFrame.day;
                return (
                  <line
                    key={`${conn.from}-${conn.to}`}
                    x1={from.left} y1={from.top}
                    x2={to.left} y2={to.top}
                    stroke="hsl(0, 75%, 55%)"
                    strokeWidth={isNew ? 2 : 1}
                    strokeOpacity={isNew ? 0.6 : 0.2}
                    strokeDasharray={isNew ? "6 4" : "3 5"}
                  >
                    {isNew && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />}
                  </line>
                );
              })}
          </svg>
        )}

        {/* City clusters overlay */}
        {displayCities.map((city) => {
          const pos = toPercent(city.lat, city.lng);
          const isSelected = sel?.name === city.name;
          const isHovered = hovered?.name === city.name;
          const isActive = !spreadMode || activeCityNames.has(city.name);
          if (!isActive) return null;

          const clusterSize = Math.max(20, city.riskScore * 0.6);
          const expanded = isSelected || isHovered;

          return (
            <div
              key={city.name}
              className="absolute z-10 cursor-pointer"
              style={{
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => setSel(isSelected ? null : city)}
              onMouseEnter={() => setHovered(city)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Outer radial glow (heatmap blob) */}
              <div
                className="absolute rounded-full"
                style={{
                  width: clusterSize * 3,
                  height: clusterSize * 3,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${riskColor(city.riskLevel).replace(")", ", 0.3)")} 0%, transparent 70%)`,
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
              />

              {/* Medium glow ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: clusterSize * 1.8,
                  height: clusterSize * 1.8,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${riskColor(city.riskLevel).replace(")", ", 0.2)")} 0%, transparent 60%)`,
                }}
              />

              {/* Core marker */}
              <div
                className="relative rounded-full transition-all duration-300"
                style={{
                  width: expanded ? clusterSize + 8 : clusterSize,
                  height: expanded ? clusterSize + 8 : clusterSize,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: riskColor(city.riskLevel).replace(")", ", 0.7)"),
                  boxShadow: riskGlow(city.riskLevel),
                }}
              >
                {/* White center dot */}
                <div
                  className="absolute rounded-full bg-white/80"
                  style={{
                    width: 4,
                    height: 4,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>

              {/* Pulse ring for high risk */}
              {city.riskLevel === "high" && (
                <div
                  className="absolute rounded-full border-2"
                  style={{
                    width: clusterSize * 2,
                    height: clusterSize * 2,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    borderColor: riskColor(city.riskLevel).replace(")", ", 0.4)"),
                    animation: "pulse-glow 2s ease-in-out infinite",
                  }}
                />
              )}

              {/* Tooltip on hover */}
              <AnimatePresence>
                {(isHovered || isSelected) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute left-[calc(50%+16px)] -top-3 z-30 whitespace-nowrap rounded-lg border border-primary/20 bg-card/95 px-3 py-2 backdrop-blur-md"
                    style={{ boxShadow: "0 4px 20px hsla(220, 25%, 6%, 0.6)" }}
                  >
                    <p className="text-xs font-bold text-foreground">{city.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {city.diseases[0]?.name} · Score: <span className="font-mono font-bold text-foreground">{city.riskScore}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{city.mentions.toLocaleString()} mentions</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-20 flex gap-4 rounded-lg border border-border bg-card/80 px-3 py-2 text-xs backdrop-blur-md">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive glow-danger" /> High</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning glow-warning" /> Moderate</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent glow-safe" /> Low</span>
        </div>
      </div>

      {/* Region Detail Panel */}
      <AnimatePresence>
        {sel && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="w-full lg:w-96"
          >
            <RegionDetail city={sel} onClose={() => setSel(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
