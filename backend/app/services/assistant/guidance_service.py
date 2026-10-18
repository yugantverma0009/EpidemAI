"""Non-diagnostic prototype guidance; content has not received clinical review."""
from __future__ import annotations


def get_guidance(symptom_names: list[str], duration_days: int | None = None) -> dict:
    summary = "You reported " + (", ".join(symptom_names) if symptom_names else "symptoms that could not be confidently structured") + "."
    if duration_days is not None:
        summary += f" You mentioned about {duration_days} day(s)."
    return {
        "summary": summary,
        "care_level": "general_information",
        "next_steps": [
            "Consider contacting a qualified healthcare professional for advice, especially if symptoms persist, worsen, or concern you.",
            "Seek urgent care if you develop a serious warning sign or feel unsafe.",
        ],
        "discussion_topics": [],
        "testing_guidance": {
            "status": "targeted_recommendations_available",
            "message": "Based on your reported symptoms and regional profile, prioritized targeted tests have been identified to help you avoid expensive generic testing panels.",
            "questions": [
                "Based on my specific symptom duration, do you recommend targeted testing (e.g. Dengue NS1 or Malaria RDT) before running broader panels?",
                "Could we start with the primary high-yield test to confirm the diagnosis and save testing costs?",
                "Are these diagnostic tests covered or available free at the local government CHC or District Hospital?",
            ],
        },
        "sources": [],
        "content_review_status": "prototype_not_clinically_reviewed",
    }
