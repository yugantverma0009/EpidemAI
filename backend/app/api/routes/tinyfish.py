import hmac
import os

from fastapi import APIRouter, Header, HTTPException

from app.services.tinyfish_service import (
    collect_news,
    configured_sources,
    get_collected_news,
    is_configured,
)

router = APIRouter()


@router.get("/ingest/tinyfish/status")
def tinyfish_status():
    interval = max(0, int(os.getenv("TINYFISH_COLLECTION_INTERVAL_SECONDS", "0") or 0))
    return {
        "configured": is_configured(),
        "ingestion_enabled": bool(os.getenv("INGEST_API_KEY")),
        "scheduler_enabled": interval > 0 and is_configured(),
        "collection_interval_seconds": interval,
        "sources_configured": len(configured_sources()),
        "articles_stored": len(get_collected_news()),
    }


@router.post("/ingest/tinyfish")
def run_tinyfish_ingestion(x_ingest_key: str | None = Header(default=None)):
    expected_key = os.getenv("INGEST_API_KEY", "")
    if not expected_key:
        raise HTTPException(status_code=503, detail="Set INGEST_API_KEY to enable manual collection")
    if not x_ingest_key or not hmac.compare_digest(x_ingest_key, expected_key):
        raise HTTPException(status_code=401, detail="Invalid ingestion key")
    try:
        return collect_news()
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
