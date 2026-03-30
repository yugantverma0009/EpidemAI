import { cities } from "../data/seed.js";

export function getCity(req, res) {
  const name = req.params.name.toLowerCase();
  const city = cities.find((c) => c.name.toLowerCase() === name);
  if (!city) return res.status(404).json({ error: "City not found" });
  res.json(city);
}
