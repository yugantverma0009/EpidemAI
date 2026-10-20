"""Clinical disease prediction and targeted cost-saving diagnostic test recommendation engine."""
from __future__ import annotations

import re
from typing import Any


DISEASE_PROFILES = [
    {
        "id": "dengue",
        "name": "Dengue Fever",
        "description": "Acute mosquito-borne viral infection transmitted by Aedes mosquitoes, common in urban and semi-urban tropical areas.",
        "cardinal_symptoms": ["fever", "headache", "eye_pain", "body_ache", "joint_pain"],
        "supporting_symptoms": ["rash", "nausea", "vomiting", "fatigue"],
        "typical_duration_days": (1, 10),
        "regional_keys": ["dengue"],
        "urgency": "moderate",
        "primary_tests": [
            {
                "test_name": "Dengue NS1 Antigen (Rapid/ELISA)",
                "purpose": "Detects viral NS1 protein during early phase (Days 1–5 of fever)",
                "estimated_cost_inr": 450,
                "priority": "Primary",
                "sample_type": "Blood (Serum)",
                "turnaround_time": "1–3 hours",
            },
            {
                "test_name": "Complete Blood Count (CBC) with Platelet Count",
                "purpose": "Monitors thrombocytopenia (platelet drop) and hematocrit concentration",
                "estimated_cost_inr": 200,
                "priority": "Essential",
                "sample_type": "Blood (Whole Blood EDTA)",
                "turnaround_time": "1–2 hours",
            },
        ],
        "late_tests": [
            {
                "test_name": "Dengue IgM / IgG Antibody ELISA",
                "purpose": "Detects immune response after Day 5 of fever onset",
                "estimated_cost_inr": 550,
                "priority": "Primary",
                "sample_type": "Blood (Serum)",
                "turnaround_time": "3–6 hours",
            },
        ],
        "blanket_panel_comparables": ["Tropical Fever Comprehensive PCR Panel", "Widal Agglutination", "Malaria PCR", "Typhidot", "Blood Culture", "Liver Function Test", "Renal Function Test"],
        "blanket_cost_inr": 4800,
    },
    {
        "id": "malaria",
        "name": "Malaria",
        "description": "Parasitic blood infection transmitted by female Anopheles mosquitoes, characterized by cyclical high-grade fevers with shaking chills.",
        "cardinal_symptoms": ["fever", "chills", "sweating", "headache"],
        "supporting_symptoms": ["fatigue", "body_ache", "nausea", "vomiting"],
        "typical_duration_days": (2, 21),
        "regional_keys": ["malaria"],
        "urgency": "moderate",
        "primary_tests": [
            {
                "test_name": "Rapid Malarial Antigen Detection (RDT for Pf & Pv)",
                "purpose": "Quick detection of P. falciparum (HRP-2) and P. vivax (LDH) antigens",
                "estimated_cost_inr": 300,
                "priority": "Primary",
                "sample_type": "Fingerstick / Venous Blood",
                "turnaround_time": "20–30 mins",
            },
            {
                "test_name": "Peripheral Blood Smear for Malarial Parasite (Giemsa Stain)",
                "purpose": "Gold standard microscopy to quantify parasite density and determine species",
                "estimated_cost_inr": 180,
                "priority": "Essential",
                "sample_type": "Blood Smear",
                "turnaround_time": "2–4 hours",
            },
        ],
        "blanket_panel_comparables": ["Full Tropical Fever Screening Panel", "Dengue NS1/IgM", "Widal", "Scrub Typhus IgM", "Chikungunya PCR"],
        "blanket_cost_inr": 4500,
    },
    {
        "id": "typhoid",
        "name": "Typhoid Fever (Enteric Fever)",
        "description": "Bacterial systemic infection caused by Salmonella Typhi spread via contaminated food or water, characterized by step-ladder prolonged fever.",
        "cardinal_symptoms": ["fever", "abdominal_pain", "headache", "loss_of_appetite"],
        "supporting_symptoms": ["diarrhea", "fatigue", "body_ache", "vomiting"],
        "typical_duration_days": (4, 28),
        "regional_keys": ["typhoid", "enteric", "cholera"],
        "urgency": "moderate",
        "primary_tests": [
            {
                "test_name": "Typhidot / IgM Antibody Rapid Test",
                "purpose": "Rapid screening for acute Salmonella Typhi outer membrane protein antibodies",
                "estimated_cost_inr": 350,
                "priority": "Primary",
                "sample_type": "Blood (Serum)",
                "turnaround_time": "1–2 hours",
            },
            {
                "test_name": "Blood Culture & Sensitivity (BACTEC)",
                "purpose": "Gold standard confirmation to isolate bacteria and check antibiotic sensitivity",
                "estimated_cost_inr": 700,
                "priority": "Essential",
                "sample_type": "Venous Blood",
                "turnaround_time": "24–48 hours",
            },
        ],
        "blanket_panel_comparables": ["Complete Febrile Illness Panel", "Dengue Serology", "Malaria Smear", "Liver Enzymes", "Electrolytes Panel"],
        "blanket_cost_inr": 4900,
    },
    {
        "id": "chikungunya",
        "name": "Chikungunya",
        "description": "Viral illness marked by sudden high fever and severe, often debilitating symmetrical joint pain and stiffness in extremities.",
        "cardinal_symptoms": ["fever", "joint_pain", "rash", "headache"],
        "supporting_symptoms": ["body_ache", "fatigue", "nausea"],
        "typical_duration_days": (1, 14),
        "regional_keys": ["chikungunya"],
        "urgency": "moderate",
        "primary_tests": [
            {
                "test_name": "Chikungunya IgM Antibody (MAC-ELISA)",
                "purpose": "Confirms specific antibodies against Chikungunya virus",
                "estimated_cost_inr": 650,
                "priority": "Primary",
                "sample_type": "Blood (Serum)",
                "turnaround_time": "4–8 hours",
            },
            {
                "test_name": "C-Reactive Protein (CRP) / ESR",
                "purpose": "Measures systemic joint inflammation severity",
                "estimated_cost_inr": 250,
                "priority": "Essential",
                "sample_type": "Blood (Serum)",
                "turnaround_time": "2–3 hours",
            },
        ],
        "blanket_panel_comparables": ["Autoimmune Arthritis Battery", "Rheumatoid Factor", "Anti-CCP", "Full Tropical Panel", "Dengue Tests"],
        "blanket_cost_inr": 4600,
    },
    {
        "id": "viral_uri",
        "name": "Acute Viral Respiratory Infection / Influenza",
        "description": "Self-limiting viral upper respiratory tract infection affecting throat, nasal passages, and airways.",
        "cardinal_symptoms": ["cough", "sore_throat", "running_nose", "fever"],
        "supporting_symptoms": ["headache", "body_ache", "fatigue", "chills"],
        "typical_duration_days": (1, 7),
        "regional_keys": [],
        "urgency": "low",
        "primary_tests": [
            {
                "test_name": "Clinical Physician Evaluation (No Blood Test Routine)",
                "purpose": "Observation & supportive care; routine blood testing usually unnecessary",
                "estimated_cost_inr": 0,
                "priority": "Primary",
                "sample_type": "Clinical Examination",
                "turnaround_time": "Immediate",
            },
            {
                "test_name": "Complete Blood Count (CBC) - Only if fever > 7 days",
                "purpose": "Checks for secondary bacterial infection or elevated white blood cell count",
                "estimated_cost_inr": 200,
                "priority": "Secondary",
                "sample_type": "Blood (EDTA)",
                "turnaround_time": "1–2 hours",
            },
        ],
        "blanket_panel_comparables": ["Respiratory Multi-Viral PCR Panel", "Chest X-Ray", "Inflammatory Biomarkers Panel", "Procalcitonin", "Blood Cultures"],
        "blanket_cost_inr": 3800,
    },
    {
        "id": "gastroenteritis",
        "name": "Acute Gastroenteritis",
        "description": "Gastrointestinal tract inflammation causing acute diarrhea, vomiting, and abdominal cramps.",
        "cardinal_symptoms": ["diarrhea", "vomiting", "nausea", "abdominal_pain"],
        "supporting_symptoms": ["fever", "chills", "fatigue"],
        "typical_duration_days": (1, 5),
        "regional_keys": ["cholera", "diarrhoeal"],
        "urgency": "moderate",
        "primary_tests": [
            {
                "test_name": "Routine Stool Examination & Microscopy",
                "purpose": "Examines for ova, cyst, parasites, and pus cells to differentiate bacterial from parasitic infection",
                "estimated_cost_inr": 180,
                "priority": "Primary",
                "sample_type": "Fresh Stool Sample",
                "turnaround_time": "2–4 hours",
            },
            {
                "test_name": "Serum Electrolytes (Na+, K+, Cl-)",
                "purpose": "Detects electrolyte depletion caused by fluid loss",
                "estimated_cost_inr": 300,
                "priority": "Essential",
                "sample_type": "Blood (Serum)",
                "turnaround_time": "1–2 hours",
            },
        ],
        "blanket_panel_comparables": ["Abdominal Ultrasound", "Comprehensive Stool Culture", "Stool Viral Multiplex PCR", "Full Blood Chemistry Panel"],
        "blanket_cost_inr": 4200,
    },
]


def predict_diseases_and_tests(
    symptoms: list[str | dict[str, Any]],
    duration_days: int | None = None,
    state: str | None = None,
    district: str | None = None,
    age_group: str | None = None,
    gender: str | None = None,
    historical_context_items: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Evaluates symptoms, duration, and patient profile to predict probable conditions and recommend targeted cost-saving diagnostic tests."""
    symptom_set: set[str] = set()
    for s in symptoms:
        if isinstance(s, dict):
            name = str(s.get("name", "")).strip().lower().replace(" ", "_")
        else:
            name = str(s).strip().lower().replace(" ", "_")
        if name:
            symptom_set.add(name)

    if not symptom_set:
        return {
            "predictions": [],
            "recommended_tests": [],
            "cost_summary": {
                "blanket_panel_cost_inr": 0,
                "targeted_cost_inr": 0,
                "estimated_savings_inr": 0,
                "savings_percentage": 0,
            },
        }

    # Historical district diseases matching
    regional_diseases = set()
    if historical_context_items:
        for item in historical_context_items:
            dis_name = item.get("disease", "").lower()
            regional_diseases.add(dis_name)

    predictions = []
    all_recommended_tests = []
    primary_test_costs = 0
    max_blanket_cost = 4500

    for profile in DISEASE_PROFILES:
        cardinals = [s for s in profile["cardinal_symptoms"] if s in symptom_set]
        supportings = [s for s in profile["supporting_symptoms"] if s in symptom_set]

        # Cardinal match is weighted 2.5x
        raw_score = (len(cardinals) * 2.5) + (len(supportings) * 1.0)
        max_possible = (len(profile["cardinal_symptoms"]) * 2.5) + (len(profile["supporting_symptoms"]) * 1.0)

        if not cardinals and len(supportings) < 2:
            continue

        base_probability = (raw_score / max_possible) * 100

        # Timing adjustment
        dur_min, dur_max = profile["typical_duration_days"]
        if duration_days is not None:
            if dur_min <= duration_days <= dur_max:
                base_probability += 8
            elif duration_days > dur_max:
                base_probability -= 12

        # Regional outbreak boost
        has_regional_boost = False
        regional_note = None
        for key in profile["regional_keys"]:
            if any(key in d for d in regional_diseases):
                base_probability += 12
                has_regional_boost = True
                loc = f"{district}, {state}" if district and state else "your district"
                regional_note = f"Elevated local risk: matching historical surveillance reports documented in {loc}."
                break

        # Calculate finalized probability between 15% and 94%
        probability = int(min(max(base_probability, 15), 94))

        # Select tests depending on fever duration
        tests = list(profile["primary_tests"])
        if duration_days is not None and duration_days > 5 and "late_tests" in profile:
            tests = list(profile["late_tests"]) + [t for t in tests if t["priority"] == "Essential"]

        predictions.append({
            "id": profile["id"],
            "disease": profile["name"],
            "probability": probability,
            "urgency": profile["urgency"],
            "matched_symptoms": cardinals + supportings,
            "key_indicators": f"Matched {len(cardinals)} cardinal symptom(s)" + (f" and {len(supportings)} supporting sign(s)" if supportings else ""),
            "description": profile["description"],
            "regional_boost": has_regional_boost,
            "regional_note": regional_note,
            "targeted_tests": tests,
            "blanket_cost_inr": profile["blanket_cost_inr"],
        })

    # Sort descending by probability
    predictions.sort(key=lambda x: x["probability"], reverse=True)
    top_predictions = predictions[:3]

    if not top_predictions:
        # Fallback general viral illness
        top_predictions = [{
            "id": "general_viral",
            "disease": "Undifferentiated Viral Fever",
            "probability": 45,
            "urgency": "low",
            "matched_symptoms": list(symptom_set),
            "key_indicators": "General non-specific fever profile",
            "description": "Common viral fever requiring hydration, fever control, and clinical watch.",
            "regional_boost": False,
            "regional_note": None,
            "targeted_tests": [
                {
                    "test_name": "Complete Blood Count (CBC) with Platelets",
                    "purpose": "Basic screening to verify white cell and platelet counts",
                    "estimated_cost_inr": 200,
                    "priority": "Primary",
                    "sample_type": "Blood (EDTA)",
                    "turnaround_time": "1–2 hours",
                }
            ],
            "blanket_cost_inr": 3500,
        }]

    # Compute aggregate cost optimization
    seen_tests = set()
    unique_tests = []
    for pred in top_predictions:
        for t in pred["targeted_tests"]:
            if t["test_name"] not in seen_tests:
                seen_tests.add(t["test_name"])
                unique_tests.append(t)
                primary_test_costs += t["estimated_cost_inr"]

    blanket_panel_cost = max(p.get("blanket_cost_inr", 4500) for p in top_predictions)
    targeted_cost = max(primary_test_costs, 200) if any(t["estimated_cost_inr"] > 0 for t in unique_tests) else 0
    estimated_savings = max(blanket_panel_cost - targeted_cost, 0)
    savings_pct = int((estimated_savings / blanket_panel_cost) * 100) if blanket_panel_cost > 0 else 0

    return {
        "predictions": top_predictions,
        "recommended_tests": unique_tests,
        "cost_optimization": {
            "blanket_panel_cost_inr": blanket_panel_cost,
            "targeted_tests_cost_inr": targeted_cost,
            "estimated_savings_inr": estimated_savings,
            "savings_percentage": savings_pct,
            "cost_rationale": (
                f"Taking only the targeted tests (approx. ₹{targeted_cost}) for your highest probability "
                f"conditions saves approximately ₹{estimated_savings:,} (~{savings_pct}%) compared to an unguided "
                f"blanket febrile panel (approx. ₹{blanket_panel_cost:,})."
            ),
        },
        "disclaimer": "Diagnostic estimates and cost benchmarks are for educational and clinical discussion only. All laboratory tests must be confirmed and ordered by a qualified medical doctor.",
    }
