import { cities } from "../data/seed.js";

export function compareCities(req, res) {
  const { cityA, cityB } = req.query;
  const a = cities.find((c) => c.name.toLowerCase() === (cityA || "").toLowerCase());
  const b = cities.find((c) => c.name.toLowerCase() === (cityB || "").toLowerCase());
  if (!a || !b) return res.status(400).json({ error: "Both cityA and cityB are required" });
  res.json({ cityA: a, cityB: b });
}
