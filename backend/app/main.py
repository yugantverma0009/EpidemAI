import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import dashboard, map_data, city, compare, alerts, trends, insights, news, top_risk_regions

app = FastAPI(title="EpidemAI API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(map_data.router, prefix="/api")
app.include_router(city.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(trends.router, prefix="/api")
app.include_router(insights.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(top_risk_regions.router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "epidemai-backend"}
