import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTrendData } from "@/hooks/useApi";

const diseaseColors: Record<string, string> = {
  dengue: "hsl(0, 75%, 55%)",
  flu: "hsl(38, 92%, 50%)",
  tb: "hsl(280, 60%, 55%)",
  covid: "hsl(210, 70%, 55%)",
  malaria: "hsl(145, 70%, 45%)",
};

interface Props {
  selectedDisease?: string;
}

export default function TrendChart({ selectedDisease }: Props) {
  const { data: trendData = [] } = useTrendData();

  const diseases = selectedDisease
    ? [selectedDisease.toLowerCase()]
    : ["dengue", "flu", "tb", "covid", "malaria"];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {diseases.map((d) => (
              <linearGradient key={d} id={`grad-${d}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={diseaseColors[d]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={diseaseColors[d]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215,15%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220,22%,10%)",
              border: "1px solid hsl(220,18%,18%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {diseases.map((d) => (
            <Area
              key={d}
              type="monotone"
              dataKey={d}
              stroke={diseaseColors[d]}
              fill={`url(#grad-${d})`}
              strokeWidth={2}
              name={d.charAt(0).toUpperCase() + d.slice(1)}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
