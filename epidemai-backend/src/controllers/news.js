import { newsItems } from "../data/seed.js";

export function getNews(_req, res) {
  res.json({ news: newsItems });
}
