"""Consent-gated SQLite storage for the Phase 2 assistant history."""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.isoformat(timespec="seconds")


def _retention_days() -> int:
    try:
        value = int(os.getenv("ASSISTANT_RETENTION_DAYS", "30"))
    except ValueError:
        value = 30
    return max(1, min(value, 30))


def _database_path() -> Path:
    configured = os.getenv("ASSISTANT_DB_PATH", "").strip()
    path = Path(configured).expanduser() if configured else Path(__file__).resolve().parents[2] / "data" / "assistant.sqlite3"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    path = _database_path()
    connection = sqlite3.connect(path, timeout=10)
    try:
        os.chmod(path, 0o600)
    except OSError:
        connection.close()
        raise
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


@contextmanager
def _connection():
    connection = _connect()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_store() -> None:
    with _connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                token_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                consent_storage INTEGER NOT NULL CHECK (consent_storage = 1)
            );
            CREATE TABLE IF NOT EXISTS entries (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                symptoms_json TEXT NOT NULL,
                answers_json TEXT NOT NULL,
                care_level TEXT,
                urgent INTEGER NOT NULL,
                guidance_json TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_entries_session_created
                ON entries(session_id, created_at DESC);
            CREATE TABLE IF NOT EXISTS checkins (
                id TEXT PRIMARY KEY,
                entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('better', 'same', 'worse')),
                symptoms_text TEXT NOT NULL DEFAULT '',
                urgent INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_checkins_entry_created
                ON checkins(entry_id, created_at);
            """
        )
    purge_expired()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def purge_expired() -> int:
    now = _iso(_utc_now())
    with _connection() as connection:
        cursor = connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (now,))
        return cursor.rowcount


def create_session() -> tuple[str, str, str]:
    initialize_store()
    token = secrets.token_urlsafe(32)
    session_id = str(uuid.uuid4())
    now = _utc_now()
    expires = now + timedelta(days=_retention_days())
    with _connection() as connection:
        connection.execute(
            "INSERT INTO sessions (id, token_hash, created_at, expires_at, consent_storage) VALUES (?, ?, ?, ?, 1)",
            (session_id, _hash_token(token), _iso(now), _iso(expires)),
        )
    return token, _iso(expires), session_id


def _authorized_session(connection: sqlite3.Connection, token: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT id, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?",
        (_hash_token(token), _iso(_utc_now())),
    ).fetchone()


def require_session(token: str) -> sqlite3.Row:
    purge_expired()
    with _connection() as connection:
        session = _authorized_session(connection, token)
        if session is None:
            raise KeyError("invalid_session")
        return session


def create_entry(token: str, symptoms: list[dict], answers: dict[str, Any], care_level: str | None, urgent: bool, guidance: dict) -> dict:
    purge_expired()
    now = _iso(_utc_now())
    entry_id = str(uuid.uuid4())
    with _connection() as connection:
        session = _authorized_session(connection, token)
        if session is None:
            raise KeyError("invalid_session")
        connection.execute(
            "INSERT INTO entries (id, session_id, created_at, symptoms_json, answers_json, care_level, urgent, guidance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (entry_id, session["id"], now, json.dumps(symptoms), json.dumps(answers), care_level, int(urgent), json.dumps(guidance)),
        )
    return {"id": entry_id, "created_at": now, "expires_at": session["expires_at"], "urgent": urgent}


def _decode_entry(row: sqlite3.Row) -> dict:
    item = dict(row)
    item["symptoms"] = json.loads(item.pop("symptoms_json"))
    item["answers"] = json.loads(item.pop("answers_json"))
    item["guidance"] = json.loads(item.pop("guidance_json"))
    item["urgent"] = bool(item["urgent"])
    return item


def list_entries(token: str) -> list[dict]:
    purge_expired()
    with _connection() as connection:
        session = _authorized_session(connection, token)
        if session is None:
            raise KeyError("invalid_session")
        rows = connection.execute(
            "SELECT entries.id, entries.created_at, sessions.expires_at, entries.symptoms_json, entries.answers_json, entries.care_level, entries.urgent, entries.guidance_json FROM entries JOIN sessions ON sessions.id = entries.session_id WHERE entries.session_id = ? ORDER BY entries.created_at DESC",
            (session["id"],),
        ).fetchall()
        return [_decode_entry(row) for row in rows]


def delete_entry(token: str, entry_id: str) -> bool:
    purge_expired()
    with _connection() as connection:
        session = _authorized_session(connection, token)
        if session is None:
            raise KeyError("invalid_session")
        cursor = connection.execute("DELETE FROM entries WHERE id = ? AND session_id = ?", (entry_id, session["id"]))
        return cursor.rowcount > 0


def delete_session(token: str) -> bool:
    purge_expired()
    with _connection() as connection:
        cursor = connection.execute("DELETE FROM sessions WHERE token_hash = ?", (_hash_token(token),))
        return cursor.rowcount > 0


def export_session(token: str) -> dict:
    session = require_session(token)
    return {"exported_at": _iso(_utc_now()), "expires_at": session["expires_at"], "entries": list_entries(token)}


def create_checkin(token: str, entry_id: str, status: str, symptoms_text: str, urgent: bool) -> dict:
    purge_expired()
    now = _iso(_utc_now())
    checkin_id = str(uuid.uuid4())
    with _connection() as connection:
        session = _authorized_session(connection, token)
        if session is None:
            raise KeyError("invalid_session")
        owned = connection.execute(
            "SELECT entries.id FROM entries JOIN sessions ON sessions.id = entries.session_id WHERE entries.id = ? AND sessions.id = ?",
            (entry_id, session["id"]),
        ).fetchone()
        if owned is None:
            return None
        connection.execute(
            "INSERT INTO checkins (id, entry_id, created_at, status, symptoms_text, urgent) VALUES (?, ?, ?, ?, ?, ?)",
            (checkin_id, entry_id, now, status, symptoms_text, int(urgent)),
        )
    return {"id": checkin_id, "entry_id": entry_id, "created_at": now, "status": status, "urgent": urgent}


def list_checkins(token: str, entry_id: str) -> list[dict] | None:
    purge_expired()
    with _connection() as connection:
        session = _authorized_session(connection, token)
        if session is None:
            raise KeyError("invalid_session")
        owned = connection.execute(
            "SELECT entries.id FROM entries JOIN sessions ON sessions.id = entries.session_id WHERE entries.id = ? AND sessions.id = ?",
            (entry_id, session["id"]),
        ).fetchone()
        if owned is None:
            return None
        rows = connection.execute(
            "SELECT id, entry_id, created_at, status, symptoms_text, urgent FROM checkins WHERE entry_id = ? ORDER BY created_at",
            (entry_id,),
        ).fetchall()
        return [{**dict(row), "urgent": bool(row["urgent"])} for row in rows]
