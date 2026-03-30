import { topRiskRegions } from "../data/seed.js";

export function getTopRiskRegions(_req, res) {
  res.json({ regions: topRiskRegions });
}
