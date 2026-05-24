import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CityData } from "@/data/mockData";

function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? "text-destructive" : score >= 40 ? "text-warning" : "text-accent";
  const strokeColor = score >= 70 ? "hsl(0,75%,55%)" : score >= 40 ? "hsl(38,92%,50%)" : "hsl(145,70%,45%)";
  const circumference = Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 120 70">
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="hsl(220,18%,18%)" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
        <text x="60" y="55" textAnchor="middle" fill={strokeColor} fontSize="20" fontWeight="bold" fontFamily="var(--font-display)">{score}</text>
      </svg>
      <span className={`text-xs font-semibold ${color}`}>
        {score >= 70 ? "HIGH RISK" : score >= 40 ? "MODERATE" : "LOW RISK"}
      </span>
    </div>
  );
}

const trendIcon = (t: string) => {
  if (t === "up") return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
  if (t === "down") return <TrendingDown className="h-3.5 w-3.5 text-accent" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

export default function RegionDetail({ city, onClose }: { city: CityData; onClose: () => void }) {
  const maxPred = Math.max(...city.prediction7d);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">{city.name}</h3>
          <p className="text-xs text-muted-foreground">{city.state} · Pop. {city.population}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
      </div>

      <RiskGauge score={city.riskScore} />

      {/* Diseases */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Diseases</h4>
        <div className="space-y-1.5">
          {city.diseases.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-sm">
              <span>{d.name}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs">{d.cases} cases</span>
                {trendIcon(d.trend)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Symptoms</h4>
        <div className="flex flex-wrap gap-1.5">
          {city.symptoms.map((s) => (
            <span key={s} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary">{s}</span>
          ))}
        </div>
      </div>

      {/* 7-day Prediction */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">7-Day Prediction</h4>
        <div className="flex items-end gap-1 h-16">
          {city.prediction7d.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm bg-primary/60"
                style={{ height: `${(v / maxPred) * 48}px` }}
              />
              <span className="text-[9px] text-muted-foreground">D{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      {city.news.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent News</h4>
          <div className="space-y-2">
            {city.news.map((n, i) => (
              <div key={i} className="rounded-md bg-secondary/30 px-3 py-2">
                <p className="text-xs leading-relaxed">{n.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{n.source} · {n.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
