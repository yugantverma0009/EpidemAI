import os
import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env for local runs; hosted services use their configured env vars.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import dashboard, map_data, city, compare, alerts, trends, insights, news, top_risk_regions, tinyfish, epiclim, climate, assistant, health_navigator

logger = logging.getLogger(__name__)


async def _tinyfish_scheduler() -> None:
    interval = max(0, int(os.getenv("TINYFISH_COLLECTION_INTERVAL_SECONDS", "0") or 0))
    if interval <= 0:
        return

    from app.services.tinyfish_service import collect_news, is_configured

    if not is_configured():
        logger.warning("TinyFish scheduler is enabled, but TinyFish credentials or sources are missing")
        return

    logger.info("TinyFish scheduled collection enabled (interval: %s seconds)", interval)
    while True:
        await asyncio.sleep(interval)
        try:
            result = await asyncio.to_thread(collect_news)
            logger.info("TinyFish scheduled collection finished: %s", result)
        except Exception:
            logger.exception("TinyFish scheduled collection failed")


async def _scheme_sync_scheduler() -> None:
    interval = max(0, int(os.getenv("SCHEME_SYNC_INTERVAL_SECONDS", "604800") or 0))
    if interval <= 0:
        return
    if not os.getenv("ANTHROPIC_API_KEY", "").strip() or not os.getenv("LLM_MODEL", "").strip():
        logger.info("Scheme sync scheduler is paused until ANTHROPIC_API_KEY and LLM_MODEL are configured")
        return
    from app.services.scheme_sync_engine import run_all

    logger.info("Government scheme sync enabled (interval: %s seconds)", interval)
    while True:
        try:
            result = await asyncio.to_thread(run_all)
            logger.info("Government scheme sync finished: %s source runs", len(result))
        except Exception:
            logger.exception("Government scheme sync failed")
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(_: FastAPI):
    interval = max(0, int(os.getenv("TINYFISH_COLLECTION_INTERVAL_SECONDS", "0") or 0))
    task = asyncio.create_task(_tinyfish_scheduler()) if interval > 0 else None
    from app.services import scheme_sync_db
    from app.services.scheme_sync_engine import load_sources
    scheme_sync_db.init()
    load_sources()
    scheme_interval = max(0, int(os.getenv("SCHEME_SYNC_INTERVAL_SECONDS", "604800") or 0))
    scheme_task = asyncio.create_task(_scheme_sync_scheduler()) if scheme_interval > 0 else None
    try:
        yield
    finally:
        for background_task in (task, scheme_task):
            if background_task:
                background_task.cancel()
                with suppress(asyncio.CancelledError):
                    await background_task


app = FastAPI(title="EpidemAI API", version="1.0.0", lifespan=lifespan)

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080",
).split(",")
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
app.include_router(tinyfish.router, prefix="/api")
app.include_router(epiclim.router, prefix="/api")
app.include_router(climate.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")
app.include_router(health_navigator.router, prefix="/api")

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "epidemai-backend",
        "data_mode": "demonstration",
        "data_source": "bundled seed records",
    }
