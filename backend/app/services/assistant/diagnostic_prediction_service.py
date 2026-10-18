"""Differential disease likelihood prediction and cost-saving targeted testing advisor.

Analyzes reported symptoms, duration, age, gender, and regional district disease history
to predict probable conditions and recommend minimal, high-yield diagnostic tests instead of
wasteful blanket screening panels.
"""
from __future__ import annotations

from typing import Any
from app.services.epiclim_service import get_historical_records


DISEASE_PROFILES: list[dict[str, Any]] = [
    {
        "id": "dengue",
        "name": "Dengue Fever",
        "category": "Vector-Borne (Aedes Aegypti)",
        "typical_incubation_days": "3 to 7 days",
        "epiclim_name": "Dengue",
        "symptoms": {
            "fever": 3.0,
            "headache": 2.0,
            "retro_orbital_pain": 3.5,
            "eye_pain": 3.0,
            "body_ache": 2.5,
            "joint_pain": 2.5,
            "rash": 2.5,
            "nausea": 1.5,
            "vomiting": 1.5,
            "fatigue": 1.5,
        },
        "description": "Acute viral infection characterized by sudden high fever, retro-orbital pain, severe musculoskeletal aches, and potential thrombocytopenia.",
        "tests": [
            {
                "test_name": "Dengue NS1 Antigen (ELISA/Rapid)",
                "timing": "Recommended within Days 1 to 5 of fever onset",
                "purpose": "Detects viral protein early before antibody titers rise",
                "priority": "High",
                "estimated_cost_inr": "₹400 - ₹750",
                "turnaround_time": "2 to 4 hours",
                "free_in_government": True,
            },
            {
                "test_name": "Complete Blood Count (CBC) with Platelets",
                "timing": "At presentation, repeat every 24-48h if fever persists",
                "purpose": "Monitors platelet drop (thrombocytopenia) and hematocrit concentration",
                "priority": "High",
                "estimated_cost_inr": "₹150 - ₹300",
                "turnaround_time": "1 to 2 hours",
                "free_in_government": True,
            },
            {
                "test_name": "Dengue IgM / IgG Antibody (MAC-ELISA)",
                "timing": "Recommended after Day 5 of symptoms",
                "purpose": "Detects immune response in subacute or secondary phase",
                "priority": "Secondary",
                "estimated_cost_inr": "₹500 - ₹850",
                "turnaround_time": "4 to 6 hours",
                "free_in_government": True,
            },
        ],
    },
    {
        "id": "malaria",
        "name": "Malaria (P. vivax / P. falciparum)",
        "category": "Vector-Borne (Anopheles)",
        "typical_incubation_days": "7 to 14 days",
        "epiclim_name": "Malaria",
        "symptoms": {
            "fever": 3.0,
            "chills": 3.5,
            "shivering": 3.5,
            "sweating": 3.0,
            "headache": 2.0,
            "fatigue": 2.0,
            "body_ache": 2.0,
            "nausea": 1.5,
            "vomiting": 1.5,
        },
        "description": "Parasitic protozoan infection presenting with paroxysmal chills, shivering rigors, high fever spikes, and drenching sweats.",
        "tests": [
            {
                "test_name": "Rapid Malarial Antigen Detection (Pf/Pv RDT)",
                "timing": "During or immediately after a fever/chills spike",
                "purpose": "Rapidly distinguishes P. falciparum vs P. vivax antigens",
                "priority": "High",
                "estimated_cost_inr": "₹200 - ₹450",
                "turnaround_time": "30 to 60 mins",
                "free_in_government": True,
            },
            {
                "test_name": "Peripheral Blood Smear (PBS) Microscopy",
                "timing": "Ideal when body temperature is rising",
                "purpose": "Gold standard microscopy for parasite speciation and density",
                "priority": "High",
                "estimated_cost_inr": "₹150 - ₹300",
                "turnaround_time": "2 to 4 hours",
                "free_in_government": True,
            },
        ],
    },
    {
        "id": "typhoid",
        "name": "Typhoid / Enteric Fever",
        "category": "Bacterial (Salmonella enterica)",
        "typical_incubation_days": "7 to 14 days",
        "epiclim_name": "Acute Diarrhoeal Disease",
        "symptoms": {
            "fever": 3.0,
            "abdominal_pain": 3.0,
            "headache": 2.0,
            "loss_of_appetite": 2.5,
            "fatigue": 2.5,
            "diarrhea": 2.0,
            "constipation": 1.5,
            "nausea": 1.5,
            "vomiting": 1.5,
        },
        "description": "Systemic bacterial infection characterized by stepwise escalating fever, gastrointestinal symptoms, coated tongue, and malaise.",
        "tests": [
            {
                "test_name": "Typhidot IgM Rapid / Blood Culture",
                "timing": "Optimal during Week 1 of unremitting fever",
                "purpose": "Detects specific outer membrane protein antibodies or isolates organism",
                "priority": "High",
                "estimated_cost_inr": "₹350 - ₹750",
                "turnaround_time": "2 to 24 hours",
                "free_in_government": True,
            },
            {
                "test_name": "Widal Slide/Tube Agglutination",
                "timing": "Week 2 onward (less reliable in early days)",
                "purpose": "Measures O and H agglutinin titers",
                "priority": "Secondary",
                "estimated_cost_inr": "₹150 - ₹350",
                "turnaround_time": "2 to 4 hours",
                "free_in_government": True,
            },
        ],
    },
    {
        "id": "chikungunya",
        "name": "Chikungunya Fever",
        "category": "Vector-Borne (Aedes Aegypti)",
        "typical_incubation_days": "3 to 7 days",
        "epiclim_name": "Chikungunya",
        "symptoms": {
            "fever": 3.0,
            "joint_pain": 4.0,
            "joint_swelling": 3.5,
            "headache": 2.0,
            "rash": 2.5,
            "fatigue": 2.0,
            "body_ache": 2.5,
        },
        "description": "Alphaviral disease featuring sudden fever followed by acute, severe, symmetric polyarthralgia predominantly in hands, wrists, and ankles.",
        "tests": [
            {
                "test_name": "Chikungunya IgM ELISA / Rapid Card",
                "timing": "After Day 4-5 of acute joint pain onset",
                "purpose": "Confirms circulating IgM antibodies against Chikungunya virus",
                "priority": "High",
                "estimated_cost_inr": "₹500 - ₹900",
                "turnaround_time": "4 to 6 hours",
                "free_in_government": True,
            },
            {
                "test_name": "Complete Blood Count (CBC) with ESR / CRP",
                "timing": "During acute inflammatory phase",
                "purpose": "Differentiates viral polyarthritis from acute bacterial/autoimmune conditions",
                "priority": "Secondary",
                "estimated_cost_inr": "₹200 - ₹400",
                "turnaround_time": "2 hours",
                "free_in_government": True,
            },
        ],
    },
    {
        "id": "viral_uri",
        "name": "Acute Upper Respiratory Infection / Viral Flu",
        "category": "Respiratory Viral",
        "typical_incubation_days": "1 to 4 days",
        "epiclim_name": None,
        "symptoms": {
            "cough": 3.5,
            "sore_throat": 3.5,
            "runny_nose": 3.0,
            "sneezing": 2.5,
            "fever": 2.0,
            "headache": 1.5,
            "fatigue": 1.5,
            "body_ache": 1.5,
        },
        "description": "Common seasonal viral infection involving the upper airways with rhinitis, pharyngitis, cough, and low to moderate grade fever.",
        "tests": [
            {
                "test_name": "Complete Blood Count (CBC) with Differential",
                "timing": "Only if fever lasts > 3-4 days or symptoms worsen",
                "purpose": "Confirms typical viral lymphocytosis and rules out acute bacterial superinfection",
                "priority": "Standard",
                "estimated_cost_inr": "₹150 - ₹300",
                "turnaround_time": "1 to 2 hours",
                "free_in_government": True,
            },
        ],
    },
    {
        "id": "gastroenteritis",
        "name": "Acute Infectious Gastroenteritis",
        "category": "Enteric Infection",
        "typical_incubation_days": "12 to 48 hours",
        "epiclim_name": "Acute Diarrhoeal Disease",
        "symptoms": {
            "diarrhea": 4.0,
            "vomiting": 3.5,
            "nausea": 3.0,
            "abdominal_pain": 2.5,
            "fever": 1.5,
            "fatigue": 2.0,
        },
        "description": "Gastrointestinal tract inflammation caused by viral, bacterial, or parasitic contamination leading to frequent loose stools and emesis.",
        "tests": [
            {
                "test_name": "Stool Routine & Microscopy Examination",
                "timing": "Fresh sample at acute onset of loose stools",
                "purpose": "Detects ova, cysts, occult blood, and pus cells to guide targeted therapy",
                "priority": "High",
                "estimated_cost_inr": "₹150 - ₹300",
                "turnaround_time": "2 to 3 hours",
                "free_in_government": True,
            },
            {
                "test_name": "Serum Electrolytes (Na+, K+, Cl-)",
                "timing": "If dehydration, oral intolerance, or dizziness is noted",
                "purpose": "Rules out hypokalemia or hyponatremia due to fluid loss",
                "priority": "Secondary",
                "estimated_cost_inr": "₹300 - ₹500",
                "turnaround_time": "1 to 2 hours",
                "free_in_government": True,
            },
        ],
    },
    {
        "id": "uti",
        "name": "Urinary Tract Infection (UTI)",
        "category": "Urogenital Bacterial",
        "typical_incubation_days": "Variable",
        "epiclim_name": None,
        "symptoms": {
            "burning_urination": 4.0,
            "frequent_urination": 3.5,
            "abdominal_pain": 2.5,
            "fever": 2.0,
            "chills": 2.0,
            "fatigue": 1.5,
        },
        "description": "Bacterial colonization of the lower urinary tract presenting with dysuria, frequency, urgency, and supra-pubic discomfort.",
        "tests": [
            {
                "test_name": "Urine Routine & Microscopic Examination (R/M)",
                "timing": "Clean-catch midstream morning urine",
                "purpose": "Checks for pus cells, bacteria, nitrites, and red blood cells",
                "priority": "High",
                "estimated_cost_inr": "₹100 - ₹250",
                "turnaround_time": "1 hour",
                "free_in_government": True,
            },
            {
                "test_name": "Urine Culture & Sensitivity (Urine C/S)",
                "timing": "Before starting broad-spectrum antibiotics",
                "purpose": "Isolates pathogen and determines precise antibiotic sensitivity",
                "priority": "Secondary",
                "estimated_cost_inr": "₹400 - ₹650",
                "turnaround_time": "24 to 48 hours",
                "free_in_government": True,
            },
        ],
    },
]


BLANKET_PANEL_DETAILS = {
    "name": "Indiscriminate Acute Febrile Illness / Broad Hospital Panel",
    "typical_commercial_cost": "₹4,800 - ₹7,200",
    "common_unnecessary_inclusions": [
        "Broad Multi-Gene Respiratory Viral PCR Panel (₹3,000+)",
        "Whole Blood Culture prior to basic clinical localization (₹1,200)",
        "Extensive Autoimmune Screen (ANA/Rheumatoid Factor) during acute fever",
        "Complete Contrast Computed Tomography (CT) without focal signs",
        "Broad-spectrum Procalcitonin testing for mild home-managed illness",
    ],
}


def predict_diseases_and_tests(
    symptoms: list[str],
    duration_days: int | None = None,
    state: str | None = None,
    district: str | None = None,
    age_group: str | None = None,
    gender: str | None = None,
) -> dict[str, Any]:
    """Score disease profiles against reported symptoms and return targeted test priorities."""
    if not symptoms:
        return {
            "predicted_diseases": [],
            "targeted_tests": [],
            "cost_optimization": None,
            "blanket_panel_avoided": BLANKET_PANEL_DETAILS,
        }

    normalized_symptoms = {s.casefold().replace(" ", "_").replace("-", "_") for s in symptoms}

    # Fetch district epidemiological context if state & district are available
    regional_counts: dict[str, int] = {}
    if state and district:
        for profile in DISEASE_PROFILES:
            epiclim_disease = profile.get("epiclim_name")
            if epiclim_disease:
                records, _ = get_historical_records(epiclim_disease, state, district)
                if records:
                    regional_counts[profile["id"]] = len(records)

    scored_diseases = []
    for profile in DISEASE_PROFILES:
        profile_symptoms = profile["symptoms"]
        matched_symptoms = []
        raw_score = 0.0
        max_possible_score = sum(profile_symptoms.values())

        for sym, weight in profile_symptoms.items():
            # Check direct or loose matching
            if sym in normalized_symptoms or any(sym in user_s or user_s in sym for user_s in normalized_symptoms):
                matched_symptoms.append(sym.replace("_", " ").title())
                raw_score += weight

        if not matched_symptoms:
            continue

        # Calculate baseline match percentage (0 to 100)
        percentage = round((raw_score / max_possible_score) * 100)

        # Regional epidemiology multiplier
        regional_boost = 0
        if profile["id"] in regional_counts:
            regional_boost = min(15, regional_counts[profile["id"]] * 2)
            percentage = min(96, percentage + regional_boost)

        # Duration adjustments (e.g. Dengue vs Typhoid vs Malaria)
        if duration_days is not None:
            if profile["id"] == "dengue" and duration_days <= 5 and "fever" in normalized_symptoms:
                percentage = min(96, percentage + 5)
            elif profile["id"] == "typhoid" and duration_days >= 6:
                percentage = min(94, percentage + 8)

        confidence_level = "High" if percentage >= 65 else "Moderate" if percentage >= 40 else "Low"

        scored_diseases.append({
            "id": profile["id"],
            "name": profile["name"],
            "category": profile["category"],
            "match_score": percentage,
            "confidence_level": confidence_level,
            "matching_symptoms": matched_symptoms,
            "description": profile["description"],
            "regional_risk": "Elevated in district" if regional_boost > 0 else "Standard",
            "regional_records_count": regional_counts.get(profile["id"], 0),
            "profile_tests": profile["tests"],
        })

    # Sort diseases by likelihood percentage descending
    scored_diseases.sort(key=lambda d: d["match_score"], reverse=True)
    top_candidates = scored_diseases[:3]

    # Collect targeted diagnostic tests from top 2 predicted diseases
    collected_tests: list[dict[str, Any]] = []
    seen_test_names: set[str] = set()

    # Determine timing guidance
    for candidate in top_candidates[:2]:
        for test in candidate["profile_tests"]:
            name = test["test_name"]
            if name not in seen_test_names:
                seen_test_names.add(name)
                # Adjust timing guidance if duration is known
                custom_timing = test["timing"]
                if candidate["id"] == "dengue" and duration_days is not None:
                    if duration_days <= 5 and "NS1" in name:
                        custom_timing = f"Optimal today (Day {duration_days} of fever is ideal for NS1 detection)"
                    elif duration_days > 5 and "IgM" in name:
                        custom_timing = f"Optimal today (Day {duration_days} of fever is ideal for IgM antibody detection)"

                collected_tests.append({
                    "test_name": name,
                    "for_condition": candidate["name"],
                    "timing": custom_timing,
                    "purpose": test["purpose"],
                    "priority": test["priority"],
                    "estimated_cost_inr": test["estimated_cost_inr"],
                    "turnaround_time": test["turnaround_time"],
                    "free_in_government": test["free_in_government"],
                })

    # Calculate financial optimization
    targeted_lower = 300
    targeted_upper = 950
    if len(collected_tests) == 1:
        targeted_lower, targeted_upper = 150, 400
    elif len(collected_tests) >= 3:
        targeted_lower, targeted_upper = 550, 1150

    blanket_avg = 5800
    targeted_avg = (targeted_lower + targeted_upper) / 2
    savings_pct = round(((blanket_avg - targeted_avg) / blanket_avg) * 100)

    cost_optimization = {
        "targeted_cost_range_inr": f"₹{targeted_lower} - ₹{targeted_upper}",
        "blanket_panel_cost_inr": BLANKET_PANEL_DETAILS["typical_commercial_cost"],
        "estimated_savings_percentage": savings_pct,
        "estimated_savings_inr": f"₹{blanket_avg - int(targeted_avg):,}",
        "avoided_unnecessary_tests": [
            "Comprehensive Multi-Pathogen PCR Array (~₹3,500)",
            "Automatic Blood Culture without primary symptom localization (~₹1,200)",
            "Extensive Autoimmune / Arthritis battery (~₹2,000)",
            "Indiscriminate Chest / Abdomen CT scan (~₹3,000)",
        ],
        "subsidized_note": "Many prioritized tests (Dengue NS1, Malaria RDT, Stool R/M, CBC) are provided free or at minimal charge at Government District Hospitals, CHCs, and Ayushman Arogya Mandirs.",
    }

    return {
        "predicted_diseases": top_candidates,
        "targeted_tests": collected_tests[:4],
        "cost_optimization": cost_optimization,
        "blanket_panel_avoided": BLANKET_PANEL_DETAILS,
        "patient_context": {
            "symptoms_evaluated": len(symptoms),
            "duration_days": duration_days,
            "district": district,
            "state": state,
            "age_group": age_group,
            "gender": gender,
        },
    }
