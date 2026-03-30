import { trendData } from "../data/seed.js";

export function getTrends(_req, res) {
  res.json({ trends: trendData });
}
