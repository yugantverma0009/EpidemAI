"""Prototype rule-based red-flag screening.

This intentionally favors explainable phrase matching over clinical claims. It
is not a complete triage system and requires qualified review before use as a
medical safety feature.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class SafetyResult:
    urgent: bool
    rule_id: str | None = None
    message: str | None = None


RULES: tuple[tuple[str, tuple[str, ...], str], ...] = (
    (
        "RF_BREATHING",
        ("difficulty breathing", "shortness of breath", "trouble breathing", "saans lene mein takleef", "saans nahi aa rahi"),
        "Breathing difficulty can be serious. Seek urgent medical care now.",
    ),
    (
        "RF_CHEST_PAIN",
        ("chest pain", "chest tightness", "seene mein dard", "seene me dard"),
        "Chest pain can be serious. Seek urgent medical care now.",
    ),
    (
        "RF_CONSCIOUSNESS_OR_SEIZURE",
        ("unconscious", "loss of consciousness", "confusion", "seizure", "behosh", "daura", "fits"),
        "Confusion, a seizure, or loss of consciousness needs urgent medical care.",
    ),
    (
        "RF_BLEEDING",
        ("blood in vomit", "vomiting blood", "blood in stool", "bloody stool", "uncontrolled bleeding", "khoon ki ulti", "stool mein khoon"),
        "Unexplained or uncontrolled bleeding needs urgent medical assessment.",
    ),
)

_NEGATION = re.compile(
    r"\b(?:no|not|without|never|don't|dont|doesn't|doesnt|isn't|isnt|aren't|arent|"
    r"nahi|nahin|mat|bilkul nahi|nahi hai|nahin hai)\b",
    re.IGNORECASE,
)


def is_negated_match(text: str, start: int, end: int | None = None) -> bool:
    """Recognize simple negation immediately before or after a matched phrase."""
    prefix = text[max(0, start - 48):start]
    # A clause boundary resets the scope of the simple negation rule.
    prefix = re.split(r"[.!?;,\n]|\bbut\b|\blekin\b|\bpar\b", prefix, flags=re.IGNORECASE)[-1]
    matches = list(_NEGATION.finditer(prefix))
    if matches and len(prefix) - matches[-1].end() <= 28:
        return True

    if end is not None:
        suffix = text[end:end + 36]
        suffix = re.split(r"[.!?;,\n]|\bbut\b|\blekin\b|\bpar\b", suffix, flags=re.IGNORECASE)[0]
        return bool(re.match(r"\s*(?:no|not|nahi|nahin|nahi hai|nahin hai|nahi ho raha|nahin ho raha)\b", suffix, re.IGNORECASE))
    return False


def check_red_flags(texts: str | list[str] | tuple[str, ...]) -> SafetyResult:
    """Check one or more user-supplied strings, preserving simple negations."""
    items = [texts] if isinstance(texts, str) else list(texts)
    for text in items:
        normalized = re.sub(r"\s+", " ", str(text or "").casefold())
        for rule_id, phrases, message in RULES:
            for phrase in phrases:
                for match in re.finditer(re.escape(phrase), normalized):
                    if not is_negated_match(normalized, match.start(), match.end()):
                        return SafetyResult(True, rule_id, message)
    return SafetyResult(False)
