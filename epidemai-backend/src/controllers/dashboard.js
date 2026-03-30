import { cities } from "../data/seed.js";

export function getDashboard(_req, res) {
  const totalMentions = cities.reduce((sum, c) => sum + c.mentions, 0);
  const totalCases = cities.reduce((sum, c) => sum + c.diseases.reduce((s, d) => s + d.cases, 0), 0);
  const highRisk = cities.filter((c) => c.riskLevel === "high").length;
  const avgRisk = Math.round(cities.reduce((s, c) => s + c.riskScore, 0) / cities.length);

  res.json({
    cities,
    summary: { totalMentions, totalCases, highRiskZones: highRisk, avgRiskScore: avgRisk, citiesMonitored: cities.length },
  });
}
