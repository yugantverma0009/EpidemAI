"""SQLite persistence for source-linked scheme sync and human review."""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.services.health_navigator import CATALOG_PATH

DEFAULT_DB = CATALOG_PATH.with_name("schemes.sqlite3")
DB_PATH = Path(os.getenv("SCHEME_SYNC_DB_PATH", str(DEFAULT_DB)))
if not DB_PATH.is_absolute():
    DB_PATH = Path(__file__).resolve().parents[2] / DB_PATH


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL,
  state TEXT,
  listing_url TEXT,
  url_list_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  last_success_at TEXT,
  last_error TEXT
);
CREATE TABLE IF NOT EXISTS raw_pages (
  url TEXT PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  content_hash TEXT NOT NULL,
  cleaned_text TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS current_schemes (
  scheme_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheme_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_quote TEXT,
  content_hash TEXT NOT NULL,
  review_status TEXT NOT NULL,
  changes_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);
CREATE TABLE IF NOT EXISTS source_availability (
  scheme_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  availability TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  PRIMARY KEY(scheme_id, source_url)
);
CREATE INDEX IF NOT EXISTS idx_versions_pending ON versions(review_status, created_at);
"""


def init() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
        count = conn.execute("SELECT COUNT(*) FROM current_schemes").fetchone()[0]
        if count == 0:
            try:
                seed = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                seed = []
            for record in seed if isinstance(seed, list) else []:
                conn.execute(
                    "INSERT OR IGNORE INTO current_schemes(scheme_id,data_json,updated_at) VALUES(?,?,?)",
                    (record["scheme_id"], json.dumps(record, ensure_ascii=False), now()),
                )


def replace_sources(rows: list[dict[str, Any]]) -> None:
    init()
    with connect() as conn:
        for source in rows:
            previous = conn.execute("SELECT url_list_json FROM sources WHERE name=?", (source["name"],)).fetchone()
            urls = list(source.get("url_list", []))
            if previous:
                urls = list(dict.fromkeys([*json.loads(previous["url_list_json"]), *urls]))
            conn.execute(
                """INSERT INTO sources(name,level,state,listing_url,url_list_json,active) VALUES(?,?,?,?,?,?)
                ON CONFLICT(name) DO UPDATE SET level=excluded.level,state=excluded.state,
                listing_url=excluded.listing_url,url_list_json=excluded.url_list_json,active=excluded.active""",
                (source["name"], source["level"], source.get("state"), source.get("listing_url"),
                 json.dumps(urls), int(bool(source.get("active", True)))),
            )


def remember_urls(source_id: int, urls: list[str]) -> None:
    with connect() as conn:
        row = conn.execute("SELECT url_list_json FROM sources WHERE id=?", (source_id,)).fetchone()
        if row:
            known = json.loads(row["url_list_json"])
            merged = list(dict.fromkeys([*known, *urls]))
            conn.execute("UPDATE sources SET url_list_json=? WHERE id=?", (json.dumps(merged), source_id))


def rotate_source_urls(source_id: int, pinned_url: str | None, visited: set[str]) -> None:
    """Move visited detail pages behind unvisited pages so large catalogs progress."""
    with connect() as conn:
        row = conn.execute("SELECT url_list_json FROM sources WHERE id=?", (source_id,)).fetchone()
        if not row:
            return
        urls = json.loads(row["url_list_json"])
        pinned = [url for url in urls if url == pinned_url]
        rest = [url for url in urls if url != pinned_url]
        updated = pinned + [url for url in rest if url not in visited] + [url for url in rest if url in visited]
        conn.execute("UPDATE sources SET url_list_json=? WHERE id=?", (json.dumps(updated), source_id))


def list_sources() -> list[dict[str, Any]]:
    init()
    with connect() as conn:
        rows = conn.execute("SELECT * FROM sources ORDER BY name").fetchall()
    return [{**dict(row), "url_list": json.loads(row["url_list_json"])} for row in rows]


def set_source_status(source_id: int, success: bool, error: str | None = None) -> None:
    with connect() as conn:
        if success:
            conn.execute("UPDATE sources SET last_success_at=?,last_error=NULL WHERE id=?", (now(), source_id))
        else:
            conn.execute("UPDATE sources SET last_error=? WHERE id=?", ((error or "sync failed")[:1000], source_id))


def last_hash(url: str) -> str | None:
    with connect() as conn:
        row = conn.execute("SELECT content_hash FROM raw_pages WHERE url=?", (url,)).fetchone()
    return row["content_hash"] if row else None


def save_page(source_id: int, url: str, content_hash: str, text: str) -> None:
    with connect() as conn:
        conn.execute(
            """INSERT INTO raw_pages(url,source_id,content_hash,cleaned_text,fetched_at) VALUES(?,?,?,?,?)
            ON CONFLICT(url) DO UPDATE SET source_id=excluded.source_id,content_hash=excluded.content_hash,
            cleaned_text=excluded.cleaned_text,fetched_at=excluded.fetched_at""",
            (url, source_id, content_hash, text[:250000], now()),
        )


def get_current(scheme_id: str) -> dict[str, Any] | None:
    init()
    with connect() as conn:
        row = conn.execute("SELECT data_json FROM current_schemes WHERE scheme_id=?", (scheme_id,)).fetchone()
    if not row:
        return None
    record = json.loads(row["data_json"])
    record["source_availability"] = availability_for(scheme_id, record.get("source_url"))
    return record


def list_current() -> list[dict[str, Any]]:
    init()
    with connect() as conn:
        rows = conn.execute("SELECT data_json FROM current_schemes ORDER BY scheme_id").fetchall()
    records = [json.loads(row["data_json"]) for row in rows]
    with connect() as conn:
        statuses = {(row["scheme_id"], row["source_url"]): row["availability"]
                    for row in conn.execute("SELECT scheme_id,source_url,availability FROM source_availability")}
    for record in records:
        record["source_availability"] = statuses.get((record["scheme_id"], record.get("source_url")), "current")
    return records


def availability_for(scheme_id: str, source_url: str | None) -> str:
    if not source_url:
        return "current"
    with connect() as conn:
        row = conn.execute("SELECT availability FROM source_availability WHERE scheme_id=? AND source_url=?",
                           (scheme_id, source_url)).fetchone()
    return row["availability"] if row else "current"


def set_source_availability(source_url: str, availability: str) -> None:
    if availability not in {"current", "possibly_discontinued"}:
        raise ValueError("unsupported source availability")
    with connect() as conn:
        rows = conn.execute("SELECT scheme_id,data_json FROM current_schemes").fetchall()
        for row in rows:
            record = json.loads(row["data_json"])
            if record.get("source_url") == source_url:
                conn.execute(
                    """INSERT INTO source_availability(scheme_id,source_url,availability,checked_at) VALUES(?,?,?,?)
                    ON CONFLICT(scheme_id,source_url) DO UPDATE SET availability=excluded.availability,checked_at=excluded.checked_at""",
                    (row["scheme_id"], source_url, availability, now()),
                )


def add_version(record: dict[str, Any], source_url: str, content_hash: str,
                status: str, changes: list[dict[str, Any]]) -> int:
    with connect() as conn:
        cursor = conn.execute(
            """INSERT INTO versions(scheme_id,data_json,source_url,source_quote,content_hash,
            review_status,changes_json,created_at) VALUES(?,?,?,?,?,?,?,?)""",
            (record["scheme_id"], json.dumps(record, ensure_ascii=False), source_url,
             record.get("source_quote"), content_hash, status,
             json.dumps(changes, ensure_ascii=False), now()),
        )
        version_id = int(cursor.lastrowid)
        if status == "auto_published":
            conn.execute(
                "INSERT INTO current_schemes(scheme_id,data_json,updated_at) VALUES(?,?,?) "
                "ON CONFLICT(scheme_id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at",
                (record["scheme_id"], json.dumps(record, ensure_ascii=False), now()),
            )
        return version_id


def list_pending() -> list[dict[str, Any]]:
    init()
    with connect() as conn:
        rows = conn.execute("SELECT * FROM versions WHERE review_status='pending' ORDER BY created_at").fetchall()
    return [{**dict(row), "record": json.loads(row["data_json"]), "changes": json.loads(row["changes_json"])} for row in rows]


def review(version_id: int, approve: bool, reviewer: str) -> bool:
    init()
    with connect() as conn:
        row = conn.execute("SELECT * FROM versions WHERE id=? AND review_status='pending'", (version_id,)).fetchone()
        if not row:
            return False
        status = "approved" if approve else "rejected"
        conn.execute("UPDATE versions SET review_status=?,reviewed_at=?,reviewed_by=? WHERE id=?",
                     (status, now(), reviewer[:100], version_id))
        if approve:
            conn.execute(
                "INSERT INTO current_schemes(scheme_id,data_json,updated_at) VALUES(?,?,?) "
                "ON CONFLICT(scheme_id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at",
                (row["scheme_id"], row["data_json"], now()),
            )
        return True


def page_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

