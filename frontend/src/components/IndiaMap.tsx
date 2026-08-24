import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";
import type { CityData } from "@/data/mockData";
import { useCities } from "@/hooks/useApi";
import RegionDetail from "./RegionDetail";
import { Play, Pause, RotateCcw } from "lucide-react";
import "leaflet/dist/leaflet.css";

const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
// Leave enough room around the country for a smaller map viewport to pan fully
// into the Northeast (including Arunachal Pradesh and the Seven Sisters).
const INDIA_BOUNDS: [[number, number], [number, number]] = [[3, 58], [43, 110]];

const spreadTimeline = [
  { day: 1, label: "Day 1", activeCities: ["Delhi"] },
  { day: 2, label: "Day 2", activeCities: ["Delhi", "Lucknow"] },
  { day: 3, label: "Day 3", activeCities: ["Delhi", "Lucknow", "Jaipur"] },
  { day: 4, label: "Day 4", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai"] },
  { day: 5, label: "Day 5", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai", "Kolkata", "Patna"] },
  { day: 6, label: "Day 6", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai", "Kolkata", "Patna", "Hyderabad", "Pune"] },
  { day: 7, label: "Day 7", activeCities: ["Delhi", "Lucknow", "Jaipur", "Mumbai", "Kolkata", "Patna", "Hyderabad", "Pune", "Chennai", "Guwahati", "Ahmedabad", "Bangalore"] },
];

const spreadConnections = [
  { from: "Delhi", to: "Lucknow", day: 2 }, { from: "Delhi", to: "Jaipur", day: 3 }, { from: "Lucknow", to: "Patna", day: 5 }, { from: "Delhi", to: "Mumbai", day: 4 }, { from: "Lucknow", to: "Kolkata", day: 5 }, { from: "Mumbai", to: "Pune", day: 6 }, { from: "Mumbai", to: "Hyderabad", day: 6 }, { from: "Hyderabad", to: "Chennai", day: 7 }, { from: "Hyderabad", to: "Bangalore", day: 7 }, { from: "Kolkata", to: "Guwahati", day: 7 }, { from: "Jaipur", to: "Ahmedabad", day: 7 },
];

const riskStyles = {
  high: { color: "#ef4444", fillColor: "#ef4444" },
  moderate: { color: "#f59e0b", fillColor: "#f59e0b" },
  low: { color: "#22c55e", fillColor: "#22c55e" },
};

interface Props {
  filteredCities?: CityData[];
  onSelectCity?: (city: CityData | null) => void;
  selectedCity?: CityData | null;
  compact?: boolean;
}

export default function IndiaMap({ filteredCities, onSelectCity, selectedCity, compact }: Props) {
  const { data: allCities = [] } = useCities();
  const [internalSelected, setInternalSelected] = useState<CityData | null>(null);
  const [spreadMode, setSpreadMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const selected = selectedCity !== undefined ? selectedCity : internalSelected;
  const setSelected = onSelectCity || setInternalSelected;
  const displayCities = filteredCities || allCities;
  const activeFrame = spreadTimeline[currentStep];
  const activeCityNames = new Set(activeFrame.activeCities);

  useEffect(() => {
    if (!playing || !spreadMode || currentStep >= spreadTimeline.length - 1) return;
    const timer = window.setTimeout(() => setCurrentStep((step) => step + 1), 1200);
    return () => window.clearTimeout(timer);
  }, [playing, spreadMode, currentStep]);

  useEffect(() => { if (currentStep >= spreadTimeline.length - 1) setPlaying(false); }, [currentStep]);

  const toggleSpreadMode = useCallback(() => {
    setSpreadMode((enabled) => { setPlaying(!enabled); setCurrentStep(0); return !enabled; });
  }, []);
  const cityByName = (name: string) => allCities.find((city) => city.name === name);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className={`relative flex-1 overflow-hidden rounded-xl border border-border ${compact ? "min-h-[400px]" : "min-h-[600px]"}`}>
        <MapContainer center={INDIA_CENTER} zoom={5} minZoom={4} maxZoom={11} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={0.8} className="h-full w-full epidemai-leaflet-map" scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {spreadMode && spreadConnections.filter((connection) => connection.day <= activeFrame.day).map((connection) => {
            const from = cityByName(connection.from); const to = cityByName(connection.to);
            return from && to ? <Polyline key={`${connection.from}-${connection.to}`} positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: "#ef4444", weight: connection.day === activeFrame.day ? 3 : 1.5, opacity: connection.day === activeFrame.day ? 0.8 : 0.35, dashArray: "6 8" }} /> : null;
          })}
          {displayCities.map((city) => {
            if (spreadMode && !activeCityNames.has(city.name)) return null;
            const isSelected = selected?.name === city.name;
            return <CircleMarker key={city.name} center={[city.lat, city.lng]} radius={Math.max(8, city.riskScore * 0.18) + (isSelected ? 3 : 0)} pathOptions={{ ...riskStyles[city.riskLevel], fillOpacity: 0.78, weight: isSelected ? 4 : 2, opacity: 1 }} eventHandlers={{ click: () => setSelected(isSelected ? null : city) }}>
              <Tooltip direction="top" offset={[0, -8]} opacity={1} className="epidemai-map-tooltip"><strong>{city.name}</strong><br />{city.diseases[0]?.name ?? "Disease signal"} · Score: {city.riskScore}<br />{city.mentions.toLocaleString()} mentions</Tooltip>
            </CircleMarker>;
          })}
        </MapContainer>
        <div className="pointer-events-none absolute inset-0 bg-background/15" />
        <div className="absolute right-3 top-3 z-[500]"><button onClick={toggleSpreadMode} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all ${spreadMode ? "border-primary/40 bg-primary/20 text-primary" : "border-border bg-card/90 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{spreadMode ? "Exit Spread View" : "▶ Spread Animation"}</button></div>
        <AnimatePresence>{spreadMode && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-3 top-12 z-[500] flex flex-col gap-2"><div className="flex items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 backdrop-blur-md"><button onClick={() => setPlaying((value) => !value)} className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20">{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button><button onClick={() => { setCurrentStep(0); setPlaying(true); }} className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button><div className="ml-1 flex items-center gap-1">{spreadTimeline.map((frame, index) => <button key={frame.day} aria-label={frame.label} onClick={() => { setCurrentStep(index); setPlaying(false); }} className={`h-2 w-2 rounded-full ${index <= currentStep ? "bg-primary" : "bg-muted-foreground/30"}`} />)}</div><span className="ml-2 font-mono text-xs font-bold text-primary">{activeFrame.label}</span></div><div className="rounded-lg border border-border bg-card/95 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur-md"><span className="font-semibold text-foreground">{activeCityNames.size}</span> cities affected · Dengue outbreak simulation</div></motion.div>}</AnimatePresence>
        <div className="absolute bottom-3 left-3 z-[500] flex gap-4 rounded-lg border border-border bg-card/90 px-3 py-2 text-xs backdrop-blur-md"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> High</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Moderate</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Low</span></div>
      </div>
      <AnimatePresence>{selected && <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="w-full lg:w-96"><RegionDetail city={selected} onClose={() => setSelected(null)} /></motion.div>}</AnimatePresence>
    </div>
  );
}
