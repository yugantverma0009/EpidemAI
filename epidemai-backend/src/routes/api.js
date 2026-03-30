import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.js";
import { getMapData } from "../controllers/mapData.js";
import { getCity } from "../controllers/city.js";
import { compareCities } from "../controllers/compare.js";
import { getAlerts } from "../controllers/alerts.js";
import { getTrends } from "../controllers/trends.js";
import { getInsights } from "../controllers/insights.js";
import { getNews } from "../controllers/news.js";
import { getTopRiskRegions } from "../controllers/topRiskRegions.js";

const router = Router();

router.get("/dashboard", getDashboard);
router.get("/map-data", getMapData);
router.get("/city/:name", getCity);
router.get("/compare", compareCities);
router.get("/alerts", getAlerts);
router.get("/trends", getTrends);
router.get("/insights", getInsights);
router.get("/news", getNews);
router.get("/top-risk-regions", getTopRiskRegions);

export default router;
