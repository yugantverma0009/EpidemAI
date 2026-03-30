import { cities } from "../data/seed.js";

export function getMapData(_req, res) {
  const clusters = cities.map((c) => ({
    city: c.name,
    lat: c.lat,
    lng: c.lng,
    risk_score: c.riskScore,
    risk_level: c.riskLevel,
    mentions: c.mentions,
  }));
  res.json({ clusters });
}
