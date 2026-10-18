"""Phase 1 stateless guidance and Phase 2 consent-gated record API."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.services.assistant import assistant_store
from app.services.assistant.diagnostic_prediction_service import predict_diseases_and_tests
from app.services.assistant.followup_service import get_followup_questions
from app.services.assistant.guidance_service import get_guidance
from app.services.assistant.local_context_service import get_local_context
from app.services.assistant.safety_service import check_red_flags
from app.services.assistant.symptom_service import structure_symptoms

router = APIRouter(prefix="/assistant", tags=["personal health assistant"])
bearer = HTTPBearer(auto_error=False)


class StructureRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=2000)


class Symptom(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    duration_days: int | None = Field(default=None, ge=0, le=365)
    severity: Literal["mild", "moderate", "severe"] | None = None


class TriageRequest(BaseModel):
    symptoms: list[Symptom] = Field(default_factory=list, max_length=20)
    answers: dict[str, str | None] = Field(default_factory=dict)
    original_text: str = Field(default="", max_length=2000)
    state: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    age_group: str | None = Field(default=None, max_length=50)
    gender: str | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def validate_answers(self):
        if len(self.answers) > 20 or any(len(key) > 80 or (value is not None and len(value) > 300) for key, value in self.answers.items()):
            raise ValueError("Answers must contain at most 20 short responses")
        return self


class ContextRequest(BaseModel):
    state: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)


class StorageConsent(BaseModel):
    storage_consent: Literal[True]


class EntryCreate(BaseModel):
    symptoms: list[Symptom] = Field(default_factory=list, max_length=20)
    answers: dict[str, str | None] = Field(default_factory=dict)
    care_level: str | None = Field(default=None, max_length=80)
    urgent: bool = False
    guidance: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_payload_size(self):
        if len(self.answers) > 20 or any(len(key) > 80 or (value is not None and len(value) > 300) for key, value in self.answers.items()):
            raise ValueError("Answers must contain at most 20 short responses")
        if len(str(self.guidance)) > 4000:
            raise ValueError("Guidance payload is too large")
        return self


class CheckInCreate(BaseModel):
    entry_id: str = Field(min_length=1, max_length=64)
    status: Literal["better", "same", "worse"]
    symptoms_text: str = Field(default="", max_length=1200)


def _require_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials is None or credentials.scheme.casefold() != "bearer" or not credentials.credentials:
        raise HTTPException(status_code=401, detail="A valid assistant session is required")
    try:
        assistant_store.require_session(credentials.credentials)
    except KeyError:
        raise HTTPException(status_code=401, detail="A valid assistant session is required") from None
    return credentials.credentials


def _store_call(call, *args):
    try:
        return call(*args)
    except KeyError:
        raise HTTPException(status_code=401, detail="A valid assistant session is required") from None


def _disclaimer() -> str:
    return "General information only. This is not a diagnosis or a substitute for professional care. If you may be having an emergency, contact local emergency services or go to the nearest hospital."


@router.post("/symptoms/structure")
def structure(request: StructureRequest):
    return structure_symptoms(request.text)


@router.post("/triage")
def triage(request: TriageRequest):
    texts = [request.original_text]
    texts.extend(symptom.name for symptom in request.symptoms)
    texts.extend(answer or "" for answer in request.answers.values())
    safety = check_red_flags(texts)
    if safety.urgent:
        return {
            "urgent": True,
            "rule_id": safety.rule_id,
            "message": safety.message,
            "next_steps": ["Seek urgent medical care now. Do not wait for this assistant."],
            "follow_up_questions": [],
            "disclaimer": _disclaimer(),
            "content_review_status": "prototype_not_clinically_reviewed",
        }

    symptom_names = [symptom.name for symptom in request.symptoms]
    durations = [symptom.duration_days for symptom in request.symptoms if symptom.duration_days is not None]
    max_duration = max(durations) if durations else None
    guidance = get_guidance(symptom_names, max_duration)

    prediction = predict_diseases_and_tests(
        symptoms=symptom_names,
        duration_days=max_duration,
        state=request.state,
        district=request.district,
        age_group=request.age_group,
        gender=request.gender,
    )

    return {
        "urgent": False,
        "care_level": guidance["care_level"],
        "follow_up_questions": get_followup_questions(set(symptom_names), set(request.answers)),
        "guidance": guidance,
        "predicted_diseases": prediction["predicted_diseases"],
        "targeted_tests": prediction["targeted_tests"],
        "cost_optimization": prediction["cost_optimization"],
        "blanket_panel_avoided": prediction["blanket_panel_avoided"],
        "patient_context": prediction["patient_context"],
        "disclaimer": _disclaimer(),
    }


@router.get("/context")
def context(state: str, district: str):
    state, district = state.strip(), district.strip()
    if not state or not district or len(state) > 100 or len(district) > 100:
        raise HTTPException(status_code=422, detail="State and district must be 1 to 100 characters")
    return get_local_context(state, district)


@router.post("/session", status_code=201)
def create_session(consent: StorageConsent):
    """Create a storage session only after explicit affirmative consent."""
    token, expires_at, session_id = assistant_store.create_session()
    return {"session_id": session_id, "access_token": token, "token_type": "bearer", "expires_at": expires_at}


@router.post("/entries", status_code=201)
def create_entry(request: EntryCreate, token: str = Depends(_require_token)):
    return _store_call(
        assistant_store.create_entry,
        token,
        [symptom.model_dump() for symptom in request.symptoms],
        request.answers,
        request.care_level,
        request.urgent,
        request.guidance,
    )


@router.get("/entries")
def get_entries(token: str = Depends(_require_token)):
    return _store_call(assistant_store.list_entries, token)


@router.delete("/entries/{entry_id}", status_code=204)
def remove_entry(entry_id: str, token: str = Depends(_require_token)):
    removed = _store_call(assistant_store.delete_entry, token, entry_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Entry not found")
    return None


@router.delete("/session", status_code=204)
def remove_session(token: str = Depends(_require_token)):
    removed = _store_call(assistant_store.delete_session, token)
    if not removed:
        raise HTTPException(status_code=404, detail="Session not found")
    return None


@router.get("/export")
def export_entries(token: str = Depends(_require_token)):
    data = _store_call(assistant_store.export_session, token)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": "attachment; filename=epidemai-health-history.json"},
    )


@router.post("/checkins", status_code=201)
def create_checkin(request: CheckInCreate, token: str = Depends(_require_token)):
    safety = check_red_flags(request.symptoms_text)
    entry = _store_call(
        assistant_store.create_checkin,
        token,
        request.entry_id,
        request.status,
        request.symptoms_text,
        safety.urgent,
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {
        **entry,
        "message": safety.message if safety.urgent else (
            "You reported feeling worse. Consider contacting a healthcare professional promptly."
            if request.status == "worse" else None
        ),
        "next_steps": ["Seek urgent medical care now."] if safety.urgent else [],
        "disclaimer": _disclaimer(),
    }


@router.get("/checkins")
def get_checkins(entry_id: str, token: str = Depends(_require_token)):
    result = _store_call(assistant_store.list_checkins, token, entry_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return result
