"""Stateless public discovery for government health schemes and services."""
from __future__ import annotations

from typing import Literal
import hmac
import os

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.services.health_navigator import list_schemes, match_schemes
from app.services import scheme_sync_db, scheme_sync_engine

router = APIRouter(prefix="/health/schemes", tags=["individual health scheme navigator"])

Topic = Literal[
    "all", "public_care", "hospital", "senior", "pregnancy", "child",
    "medicines", "diagnostics", "digital_health", "financial_assistance", "worker", "government_employee",
]
Answer = Literal["yes", "no", "unknown", "prefer_not_to_say"]


class SchemeMatchRequest(BaseModel):
    """Only coarse optional eligibility details; never accept identity documents."""

    model_config = ConfigDict(str_strip_whitespace=True)

    state: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    topics: list[Topic] = Field(default_factory=lambda: ["all"], max_length=12)
    age_group: Literal["unknown", "under18", "18_59", "60_69", "70_plus"] = "unknown"
    age: int | None = Field(default=None, ge=0, le=120)
    gender: Literal["unknown", "male", "female", "other"] = "unknown"
    income_band: Literal["unknown", "under_1_lakh", "1_3_lakh", "3_5_lakh", "5_10_lakh", "above_10_lakh"] = "unknown"
    occupation: Literal[
        "unknown", "govt_central", "govt_state", "pensioner_central", "ex_serviceman",
        "organised_private", "unorganised", "gig_worker", "farmer", "student", "none",
    ] = "unknown"
    area: Literal["unknown", "urban", "rural"] = "unknown"
    pregnant: Literal["yes", "no", "unknown", "prefer_not_to_say"] = "unknown"
    child_under_one: Answer = "unknown"
    pmjay_beneficiary: Answer = "unknown"
    worker_group: Literal["none", "asha", "anganwadi_worker", "anganwadi_helper", "other", "unknown"] = "unknown"
    government_employment: Literal["unknown", "none", "delhi_employee", "delhi_pensioner", "other"] = "unknown"
    nfsc_card: Answer = "unknown"
    delhi_residence_years: int | None = Field(default=None, ge=0, le=100)
    government_hospital_treatment: Answer = "unknown"
    bpl_or_secc: Answer = "unknown"
    tb_patient: Answer = "unknown"
    disability: Answer = "unknown"
    sc_st: Answer = "unknown"


@router.get("")
def get_scheme_catalog(state: str | None = None, topic: str | None = None):
    """Return source-linked national records; state records are explicitly partial."""
    results = list_schemes(state=state, topic=topic)
    return {
        "results": results,
        "state_catalog": "partial" if (state or "").strip().casefold() == "delhi" else "not_available" if state else "national",
        "state_scheme_search_url": "https://www.myscheme.gov.in/",
        "catalog_status": "source_linked_prototype",
    }


@router.post("/match")
def post_scheme_matches(request: SchemeMatchRequest):
    """Match broad answers to information; this does not make eligibility decisions."""
    answers = request.model_dump()
    answers["state"] = answers["state"] or ""
    answers["district"] = answers["district"] or ""
    return match_schemes(answers)


def _require_sync_key(key: str | None) -> str:
    expected = os.getenv("SCHEME_SYNC_ADMIN_KEY", "").strip()
    if not expected or expected == "change-this-before-enabling-admin-sync":
        raise HTTPException(status_code=503, detail="Scheme sync administration is not configured")
    if not key or not hmac.compare_digest(key, expected):
        raise HTTPException(status_code=403, detail="Invalid scheme sync key")
    return "configured-admin"


@router.get("/sync/status")
def get_sync_status():
    """Expose sync health and counts; never expose source text or user data."""
    return scheme_sync_engine.sync_status()


@router.get("/sync/sources")
def get_sync_sources():
    return {"sources": scheme_sync_engine.source_summary()}


@router.post("/sync/run")
def run_scheme_sync(x_scheme_admin_key: str | None = Header(default=None)):
    _require_sync_key(x_scheme_admin_key)
    return {"runs": scheme_sync_engine.run_all()}


@router.post("/sync/sources/{source_id}/run")
def run_one_source(source_id: int, x_scheme_admin_key: str | None = Header(default=None)):
    _require_sync_key(x_scheme_admin_key)
    try:
        return scheme_sync_engine.sync_source(source_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/sync/review")
def get_pending_scheme_reviews(x_scheme_admin_key: str | None = Header(default=None)):
    _require_sync_key(x_scheme_admin_key)
    return {"pending": scheme_sync_db.list_pending()}


@router.post("/sync/review/{version_id}/{decision}")
def decide_scheme_review(version_id: int, decision: Literal["approve", "reject"],
                         x_scheme_admin_key: str | None = Header(default=None)):
    reviewer = _require_sync_key(x_scheme_admin_key)
    changed = scheme_sync_db.review(version_id, decision == "approve", reviewer)
    if not changed:
        raise HTTPException(status_code=404, detail="Pending scheme version not found")
    return {"ok": True, "version_id": version_id, "decision": decision}
