"""TinyFish collection and local persistence for disease-related news."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


TINYFISH_ENDPOINT = "https://agent.tinyfish.ai/v1/automation/run"
DB_PATH = Path(os.getenv("TINYFISH_DB_PATH") or (Path(__file__).resolve().parents[1] / "data" / "tinyfish_news.sqlite3"))
OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {"articles": {"type": "array", "maxItems": 20, "items": {
        "type": "object", "properties": {
            "title": {"type": "string"}, "source": {"type": "string"}, "url": {"type": "string"},
            "published_at": {"type": "string"}, "summary": {"type": "string"}, "disease": {"type": "string"},
            "location": {"type": "string"}, "severity": {"type": "string", "enum": ["high", "moderate", "low"]},
        }, "required": ["title", "source", "url", "summary", "disease", "location", "severity"]
    }}}, "required": ["articles"]
}


def configured_sources() -> list[str]:
    return [url.strip() for url in os.getenv("TINYFISH_SOURCE_URLS", "").split(",") if url.strip()]


def is_configured() -> bool:
    return bool(os.getenv("TINYFISH_API_KEY") and configured_sources())


def _init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as db:
        db.execute("""CREATE TABLE IF NOT EXISTS tinyfish_news (
            url TEXT PRIMARY KEY, title TEXT NOT NULL, source TEXT NOT NULL,
            published_at TEXT, summary TEXT NOT NULL, disease TEXT NOT NULL,
            location TEXT NOT NULL, severity TEXT NOT NULL, collected_at TEXT NOT NULL
        )""")


def _request_source(source_url: str, api_key: str) -> dict:
    payload = {"url": source_url, "goal": (
        "Find up to 20 recent factual public-health news articles on this site about disease outbreaks, case counts, "
        "or public-health advisories in India. Return only articles visible on the site; do not infer or invent details. "
        "For each return title, publisher, canonical article URL, publication date when available, short factual summary, "
        "disease, Indian location, and severity (high for confirmed urgent outbreak/advisory, moderate for reported "
        "increase, otherwise low). Use empty strings for unknown disease or location."
    ), "output_schema": OUTPUT_SCHEMA}
    request = Request(TINYFISH_ENDPOINT, data=json.dumps(payload).encode(), headers={
        "X-API-Key": api_key, "Content-Type": "application/json"
    }, method="POST")
    try:
        with urlopen(request, timeout=180) as response:
            result = json.loads(response.read().decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise RuntimeError("TinyFish returned an invalid JSON response") from None
    except HTTPError as exc:
        raise RuntimeError(f"TinyFish returned HTTP {exc.code}") from None
    except (URLError, TimeoutError) as exc:
        reason = exc.reason if isinstance(exc, URLError) else "timed out"
        raise RuntimeError(f"TinyFish request failed: {reason}") from None
    if result.get("status") != "COMPLETED" or not isinstance(result.get("result"), dict):
        raise RuntimeError("TinyFish run did not complete successfully")
    return result["result"]


def collect_news() -> dict:
    api_key = os.getenv("TINYFISH_API_KEY", "")
    sources = configured_sources()
    if not api_key or not sources:
        raise ValueError("Set TINYFISH_API_KEY and TINYFISH_SOURCE_URLS in the backend environment")
    _init_db()
    collected_at = datetime.now(timezone.utc).isoformat()
    saved, errors = 0, []
    for source_url in sources[:5]:
        try:
            articles = _request_source(source_url, api_key).get("articles", [])
            if not isinstance(articles, list):
                raise RuntimeError("TinyFish returned an invalid articles field")
            with sqlite3.connect(DB_PATH) as db:
                for article in articles:
                    if not isinstance(article, dict):
                        continue
                    title, url, summary = (str(article.get(k, "")).strip() for k in ("title", "url", "summary"))
                    if not title or not summary or not url.startswith("https://"):
                        continue
                    severity = str(article.get("severity", "low")).lower()
                    if severity not in {"high", "moderate", "low"}:
                        severity = "low"
                    db.execute("""INSERT INTO tinyfish_news VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(url) DO UPDATE SET title=excluded.title, source=excluded.source,
                        published_at=excluded.published_at, summary=excluded.summary, disease=excluded.disease,
                        location=excluded.location, severity=excluded.severity, collected_at=excluded.collected_at""",
                        (url, title, str(article.get("source", "TinyFish")), str(article.get("published_at", "")),
                         summary, str(article.get("disease", "")), str(article.get("location", "")), severity, collected_at))
                    saved += 1
        except RuntimeError as exc:
            errors.append({"source": source_url, "error": str(exc)})
    return {"saved": saved, "sources_checked": len(sources[:5]), "errors": errors, "collected_at": collected_at}


def get_collected_news() -> list[dict]:
    if not DB_PATH.exists():
        return []
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute("SELECT * FROM tinyfish_news ORDER BY COALESCE(published_at, collected_at) DESC").fetchall()
    return [{"id": f"tinyfish-{i}", "title": r["title"], "source": r["source"],
             "time": r["published_at"] or r["collected_at"], "disease": r["disease"] or "Public health",
             "severity": r["severity"], "url": r["url"], "summary": r["summary"], "location": r["location"],
             "collected_at": r["collected_at"]} for i, r in enumerate(rows)]
