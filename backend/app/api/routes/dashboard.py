from fastapi import APIRouter
from app.services.data_service import get_all_cities, get_all_alerts

router = APIRouter()

@router.get("/dashboard")
def dashboard():
    cities = get_all_cities()
    alerts = get_all_alerts()
    total_cases = sum(sum(d["cases"] for d in c["diseases"]) for c in cities)
    high_risk = [c for c in cities if c["risk_level"] == "high"]
    avg_risk = round(sum(c["risk_score"] for c in cities) / max(len(cities), 1))
    return {
        "total_cities": len(cities),
        "active_alerts": len(alerts),
        "high_risk_count": len(high_risk),
        "avg_risk_score": avg_risk,
        "total_cases": total_cases,
        "diseases_tracked": 5,
    }
