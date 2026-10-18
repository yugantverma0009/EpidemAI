"""Focused integration checks for the consent-gated assistant store."""
from __future__ import annotations

import os
import sqlite3
import tempfile
import unittest
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

from pydantic import ValidationError

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.api.routes.assistant import CheckInCreate, StorageConsent, _require_token, create_checkin
from app.main import app
from app.services.assistant import assistant_store
from app.services.assistant import local_context_service
from app.services.assistant.safety_service import check_red_flags
from app.services.assistant.symptom_service import structure_symptoms
from app.api.routes.assistant import TriageRequest, triage


@contextmanager
def _database(path: Path):
    connection = sqlite3.connect(path)
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


class AssistantPhase2Tests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "assistant.sqlite3"
        self.env = patch.dict(os.environ, {"ASSISTANT_DB_PATH": str(self.db_path), "ASSISTANT_RETENTION_DAYS": "30"})
        self.env.start()
        self.token_a, self.expires_a, self.session_a = assistant_store.create_session()
        self.token_b, self.expires_b, self.session_b = assistant_store.create_session()

    def tearDown(self):
        self.env.stop()
        self.temp_dir.cleanup()

    def create_entry(self, token):
        return assistant_store.create_entry(
            token,
            [{"name": "fever", "reported": True}],
            {},
            "general_information",
            False,
            {"summary": "prototype"},
        )

    def test_explicit_consent_is_required_for_session_creation(self):
        self.assertTrue(StorageConsent(storage_consent=True).storage_consent)
        with self.assertRaises(ValidationError):
            StorageConsent(storage_consent=False)

    def test_phase1_and_phase2_routes_are_mounted(self):
        paths = set(app.openapi()["paths"])
        expected = {
            "/api/assistant/symptoms/structure", "/api/assistant/triage", "/api/assistant/context",
            "/api/assistant/session", "/api/assistant/entries", "/api/assistant/entries/{entry_id}",
            "/api/assistant/export", "/api/assistant/checkins",
        }
        self.assertTrue(expected.issubset(paths))

    def test_tokens_are_random_and_only_hashes_are_stored(self):
        self.assertNotEqual(self.token_a, self.token_b)
        with _database(self.db_path) as connection:
            stored_hashes = {row[0] for row in connection.execute("SELECT token_hash FROM sessions")}
        self.assertNotIn(self.token_a, stored_hashes)
        self.assertNotIn(self.token_b, stored_hashes)
        self.assertEqual(self.db_path.stat().st_mode & 0o777, 0o600)

    def test_bearer_session_is_required_and_invalid_tokens_are_rejected(self):
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=self.token_a)
        self.assertEqual(_require_token(credentials), self.token_a)
        with self.assertRaises(HTTPException) as error:
            _require_token(HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid"))
        self.assertEqual(error.exception.status_code, 401)
        with self.assertRaises(HTTPException) as missing:
            _require_token(None)
        self.assertEqual(missing.exception.status_code, 401)

    def test_sessions_cannot_read_or_delete_each_others_entries(self):
        entry = self.create_entry(self.token_a)
        self.assertEqual(len(assistant_store.list_entries(self.token_a)), 1)
        self.assertEqual(assistant_store.list_entries(self.token_b), [])
        self.assertEqual(assistant_store.export_session(self.token_b)["entries"], [])
        self.assertFalse(assistant_store.delete_entry(self.token_b, entry["id"]))
        self.assertIsNone(assistant_store.list_checkins(self.token_b, entry["id"]))

    def test_session_delete_cascades_entries_and_checkins(self):
        entry = self.create_entry(self.token_a)
        assistant_store.create_checkin(self.token_a, entry["id"], "same", "", False)
        self.assertTrue(assistant_store.delete_session(self.token_a))
        with _database(self.db_path) as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM entries").fetchone()[0], 0)
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM checkins").fetchone()[0], 0)
        with self.assertRaises(KeyError):
            assistant_store.list_entries(self.token_a)

    def test_entry_delete_cascades_only_its_checkins(self):
        entry = self.create_entry(self.token_a)
        keep = self.create_entry(self.token_a)
        assistant_store.create_checkin(self.token_a, entry["id"], "same", "", False)
        assistant_store.create_checkin(self.token_a, keep["id"], "better", "", False)
        self.assertTrue(assistant_store.delete_entry(self.token_a, entry["id"]))
        self.assertIsNone(assistant_store.list_checkins(self.token_a, entry["id"]))
        self.assertEqual(len(assistant_store.list_checkins(self.token_a, keep["id"])), 1)

    def test_expired_session_is_purged_with_children(self):
        entry = self.create_entry(self.token_a)
        with _database(self.db_path) as connection:
            connection.execute("UPDATE sessions SET expires_at = '2000-01-01T00:00:00+00:00' WHERE id = ?", (self.session_a,))
        with self.assertRaises(KeyError):
            assistant_store.list_entries(self.token_a)
        with _database(self.db_path) as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM entries WHERE id = ?", (entry["id"],)).fetchone()[0], 0)

    def test_checkin_runs_red_flag_screen_and_worse_is_not_urgent_by_itself(self):
        entry = self.create_entry(self.token_a)
        worse = create_checkin(CheckInCreate(entry_id=entry["id"], status="worse"), self.token_a)
        self.assertFalse(worse["urgent"])
        self.assertIn("contacting a healthcare professional", worse["message"])

        urgent = create_checkin(CheckInCreate(entry_id=entry["id"], status="same", symptoms_text="shortness of breath"), self.token_a)
        self.assertTrue(urgent["urgent"])
        self.assertIn("urgent", urgent["message"].casefold())

    def test_phase1_safety_and_symptom_structuring_remain_available(self):
        self.assertTrue(check_red_flags("seene mein dard").urgent)
        self.assertFalse(check_red_flags("seene mein dard nahi").urgent)
        summary = structure_symptoms("no fever, mild headache")
        self.assertEqual([item["name"] for item in summary["symptoms"]], ["headache"])

    def test_phase1_red_flag_scenarios_cover_english_hindi_and_negation(self):
        scenarios = [
            ("I have chest pain", True),
            ("I have shortness of breath", True),
            ("seene mein dard ho raha hai", True),
            ("saans lene mein takleef", True),
            ("no chest pain", False),
            ("seene mein dard nahi", False),
            ("mild headache since morning", False),
        ]
        for text, expected in scenarios:
            with self.subTest(text=text):
                self.assertEqual(check_red_flags(text).urgent, expected)

    def test_phase1_triage_checks_followup_answers_before_guidance(self):
        response = triage(TriageRequest(
            original_text="mild headache",
            symptoms=[{"name": "headache"}],
            answers={"q1": "I am having difficulty breathing"},
        ))
        self.assertTrue(response["urgent"])
        self.assertEqual(response["follow_up_questions"], [])
        self.assertNotIn("guidance", response)

    def test_historical_context_labels_source_period_and_staleness(self):
        records = [{"period": "2020-01"}, {"period": "2020-03"}]
        summary = {"first_observed": "2020-01", "last_observed": "2020-03"}
        with patch.object(local_context_service, "get_historical_records", return_value=(records, summary)):
            context = local_context_service.get_local_context("Example State", "Example District")
        self.assertEqual(context["status"], "available")
        self.assertEqual(context["items"][0]["freshness"], "stale")
        self.assertEqual(context["items"][0]["data_period"], "2020-01 to 2020-03")
        self.assertEqual(context["items"][0]["source"], "EpiClim bundled dataset")

    def test_historical_context_is_unavailable_without_matching_records(self):
        with patch.object(local_context_service, "get_historical_records", return_value=([], {})):
            context = local_context_service.get_local_context("Unknown State", "Unknown District")
        self.assertEqual(context["status"], "unavailable")
        self.assertEqual(context["items"], [])


if __name__ == "__main__":
    unittest.main()
