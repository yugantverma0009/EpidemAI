"""Conservative keyword-based symptom structuring for user confirmation."""
from __future__ import annotations

import re
from app.services.assistant.safety_service import is_negated_match


SYMPTOMS: dict[str, tuple[str, ...]] = {
    "fever": ("fever", "high temperature", "bukhar", "bukhār"),
    "headache": ("headache", "head pain", "sir dard", "sar dard"),
    "cough": ("cough", "khansi", "khaansi"),
    "fatigue": ("fatigue", "tiredness", "weakness", "thakaan", "kamzori"),
    "chills": ("chills", "shivering", "kampkapi", "thand lagna", "rigors"),
    "body_ache": ("body ache", "body pain", "jism dard", "shareer dard", "muscle pain"),
    "joint_pain": ("joint pain", "joint ache", "jodon mein dard", "arthralgia", "joint swelling"),
    "eye_pain": ("eye pain", "pain behind eyes", "retro orbital pain", "aankhon mein dard"),
    "sweating": ("sweating", "sweats", "paseena", "night sweats"),
    "rash": ("rash", "skin rash", "daane", "chakatte"),
    "nausea": ("nausea", "feeling sick", "ji machlana", "matli"),
    "vomiting": ("vomiting", "vomit", "ulti"),
    "diarrhea": ("diarrhea", "diarrhoea", "loose motions", "dast"),
    "abdominal_pain": ("abdominal pain", "stomach pain", "stomach ache", "pet dard", "belly pain", "cramps"),
    "loss_of_appetite": ("loss of appetite", "not feeling hungry", "bhookh na lagna", "anorexia"),
    "sore_throat": ("sore throat", "throat pain", "gale mein kharash", "gala kharab"),
    "running_nose": ("running nose", "runny nose", "cold", "sneezing", "congestion", "band naak"),
    "difficulty_breathing": ("difficulty breathing", "shortness of breath", "trouble breathing", "saans lene mein takleef"),
}

_DURATION = re.compile(r"\b(\d{1,3})\s*(day|days|din|week|weeks|hafta|hafte|month|months|mahina|mahine)\b", re.IGNORECASE)
_SEVERITY = {
    "mild": ("mild", "slight", "halka", "halki"),
    "moderate": ("moderate", "medium", "madhyam"),
    "severe": ("severe", "very bad", "intense", "bahut zyada", "bohot zyada"),
}


def structure_symptoms(text: str) -> dict:
    normalized = re.sub(r"\s+", " ", text.casefold()).strip()
    symptoms = []
    for name, phrases in SYMPTOMS.items():
        matches = [
            match for phrase in phrases
            for match in re.finditer(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", normalized)
        ]
        if any(not is_negated_match(normalized, match.start(), match.end()) for match in matches):
            symptoms.append({"name": name, "reported": True})

    duration_days = None
    duration_match = _DURATION.search(normalized)
    if duration_match:
        amount = int(duration_match.group(1))
        unit = duration_match.group(2).casefold()
        duration_days = amount * (7 if unit in {"week", "weeks", "hafta", "hafte"} else 30 if unit in {"month", "months", "mahina", "mahine"} else 1)

    severity = next(
        (level for level, words in _SEVERITY.items() if any(re.search(r"(?<!\w)" + re.escape(word) + r"(?!\w)", normalized) for word in words)),
        None,
    )
    for symptom in symptoms:
        if duration_days is not None:
            symptom["duration_days"] = duration_days
        if severity is not None:
            symptom["severity"] = severity
    return {"symptoms": symptoms, "duration_days": duration_days, "severity": severity}
