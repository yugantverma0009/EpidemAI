import { alerts } from "../data/seed.js";

export function getAlerts(req, res) {
  let result = [...alerts];
  const { severity, dismissed } = req.query;
  if (severity) result = result.filter((a) => a.severity === severity);
  if (dismissed !== undefined) result = result.filter((a) => String(a.dismissed) === dismissed);
  res.json({ alerts: result, count: result.length });
}
