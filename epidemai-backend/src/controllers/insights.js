import { insights } from "../data/seed.js";

export function getInsights(_req, res) {
  res.json({ insights });
}
