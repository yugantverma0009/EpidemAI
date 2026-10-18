"""Small, reviewed-status follow-up question rules (prototype copy)."""


QUESTIONS = [
    {"id": "duration", "text": "When did this start, and is it getting better, worse, or staying the same?"},
    {"id": "breathing", "text": "Are you having any difficulty breathing?"},
    {"id": "fluids", "text": "Are you able to drink fluids and keep them down?"},
]


def get_followup_questions(symptom_names: set[str], answered_ids: set[str] | None = None) -> list[dict[str, str]]:
    """Return a short set of neutral questions; red flags are checked separately first."""
    questions = list(QUESTIONS)
    if "fever" in symptom_names:
        questions[0] = {"id": "fever_duration", "text": "How long have you had the fever, and have you measured your temperature?"}
    answered = answered_ids or set()
    return [question for question in questions if question["id"] not in answered][:3]
