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
            "status": "reviewed_pathway_unavailable",
            "message": "A clinician can decide whether testing is appropriate after considering your symptoms, timing, examination, and current local guidance. This assistant does not select or rule out tests.",
            "questions": [
                "What possible causes should we consider based on my symptoms and examination?",
                "Would a test change the next step in my care?",
                "If testing is appropriate, which test and timing fit my situation?",
            ],
        },
        "sources": [],
        "content_review_status": "prototype_not_clinically_reviewed",
    }
