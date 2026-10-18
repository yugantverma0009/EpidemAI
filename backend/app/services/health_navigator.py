"""Source-linked, stateless scheme discovery for the public Individual Health Portal."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "health_navigator" / "schemes.json"
PUBLIC_TOPICS = {"public_care", "medicines", "diagnostics", "pregnancy", "child", "senior"}
STATE_NAMES = {"andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat",
               "haryana", "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh",
               "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab",
               "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand",
               "west bengal", "andaman and nicobar islands", "chandigarh",
               "dadra and nagar haveli and daman and diu", "delhi", "jammu and kashmir", "ladakh",
               "lakshadweep", "puducherry"}


def _load_catalog() -> list[dict[str, Any]]:
    # The SQLite catalogue is the runtime source of truth. A bundled JSON seed
    # remains available for first boot and for environments with read-only disks.
    try:
        from app.services import scheme_sync_db
        records = scheme_sync_db.list_current()
        if records:
            return records
    except (OSError, RuntimeError, ValueError):
        pass
    try:
        data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    return data if isinstance(data, list) else []


def list_schemes(state: str | None = None, topic: str | None = None) -> list[dict[str, Any]]:
    state_key = (state or "").strip().casefold()
    topic_key = (topic or "").strip().casefold()
    results = []
    for scheme in _load_catalog():
        jurisdiction = str(scheme.get("jurisdiction", "")).casefold()
        topics = {str(value).casefold() for value in scheme.get("topics", [])}
        # National programmes stay visible; a state programme is only shown in its state.
        if state_key and jurisdiction in STATE_NAMES and state_key != jurisdiction:
            continue
        if topic_key and topic_key not in topics:
            continue
        results.append(scheme)
    return results


def _match_status(scheme: dict[str, Any], answers: dict[str, Any]) -> tuple[str, list[str]]:
    scheme_id = scheme["scheme_id"]
    topics = set(answers.get("topics", []))
    state = str(answers.get("state", "")).strip().casefold()
    age = answers.get("age_group", "unknown")
    pregnancy = answers.get("pregnant", "unknown")
    infant = answers.get("child_under_one", "unknown")
    reasons: list[str] = []

    if scheme_id == "pmjay":
        if age == "70_plus":
            return "potential_match", ["You selected age 70 or above, which is relevant to the Ayushman Vay Vandana route.", "The official beneficiary portal must still verify and complete enrolment."]
        if answers.get("pmjay_beneficiary") == "yes":
            return "potential_match", ["You indicated that someone in the household already has PM-JAY beneficiary status. Confirm current member/card details through the official portal."]
        if answers.get("worker_group") in {"asha", "anganwadi_worker", "anganwadi_helper"}:
            return "potential_match", ["You selected a worker group included in a PM-JAY expansion. Official beneficiary verification is still required."]
        return "more_information_needed", ["For most households, eligibility is determined through official beneficiary records and applicable State/UT rules; these details cannot be established from age or income alone."]

    if scheme_id == "delhi-arogya-nidhi":
        if state != "delhi":
            return "not_applicable_to_selected_state", ["This scheme is listed for Delhi residents only."]
        required = [
            answers.get("nfsc_card") == "yes",
            isinstance(answers.get("delhi_residence_years"), int) and answers["delhi_residence_years"] >= 3,
            answers.get("government_hospital_treatment") == "yes",
        ]
        known_no = answers.get("nfsc_card") == "no" or answers.get("government_hospital_treatment") == "no" or (
            isinstance(answers.get("delhi_residence_years"), int) and answers["delhi_residence_years"] < 3
        )
        if all(required):
            return "potential_match", ["Your answers match the high-level criteria listed by myScheme: NFSC card, at least three years of Delhi residence, and treatment at a government hospital.", "The Delhi authority makes the final decision and may require additional documents or conditions."]
        if known_no:
            return "criteria_not_met_from_answers", ["At least one answer does not match a criterion shown on the linked scheme page. This is not an official ineligibility decision; confirm with the Delhi authority if your circumstances differ."]
        return "more_information_needed", ["The scheme record lists NFSC card status, three years of Delhi residence, and government-hospital treatment. Answer what you can, then verify through the official scheme page."]

    if scheme_id == "delhi-pmjay-topup":
        if state != "delhi":
            return "not_applicable_to_selected_state", ["This state top-up is described for Delhi implementation only."]
        if answers.get("pmjay_beneficiary") == "yes":
            return "potential_match", ["You indicated existing PM-JAY beneficiary status, which is relevant to the Delhi top-up announcement.", "Confirm the current Delhi rules and beneficiary record through the official PM-JAY service."]
        return "more_information_needed", ["The additional cover described in the announcement is for eligible PM-JAY families. Check beneficiary status and current Delhi rules."]

    if scheme_id == "dgehs":
        if state != "delhi":
            return "not_applicable_to_selected_state", ["DGEHS is a Delhi government employee and pensioner scheme."]
        if answers.get("government_employment") in {"delhi_employee", "delhi_pensioner"}:
            return "potential_match", ["Your selected employment category is listed among DGEHS beneficiary groups. Confirm membership, dependent rules and current terms with the Delhi authority."]
        if answers.get("government_employment") in {"none", "other"}:
            return "criteria_not_met_from_answers", ["The selected employment category does not match the high-level DGEHS beneficiary groups shown on the official page."]
        return "more_information_needed", ["DGEHS is intended for eligible Delhi government employees, pensioners and family members. Check the official membership rules."]

    if scheme_id == "rbsk":
        if age == "under18":
            return "potential_service", ["You selected a child under 18; ask a local public health facility about RBSK screening and referral arrangements."]
        return "information_only", ["RBSK is child-focused. Local screening scope and age-specific pathways should be confirmed with the public health system."]

    if scheme_id == "up-nhm":
        return "public_service", ["This is an official state portal for discovering Uttar Pradesh health programmes, not a personal benefit decision."]

    if scheme_id == "jsy":
        if pregnancy == "yes":
            return "more_information_needed", ["Pregnancy may make this programme relevant, but cash eligibility varies by state category, facility and beneficiary criteria. Check the current state rules."]
        if pregnancy in {"unknown", "prefer_not_to_say"} and "pregnancy" in topics:
            return "more_information_needed", ["This programme may be relevant to pregnancy-related support. You can review the official criteria without sharing personal details."]
        return "information_only", ["This programme has state- and beneficiary-specific criteria. Review the official NHM guidance if relevant."]

    if scheme_id == "jssk":
        if pregnancy == "yes" or infant == "yes":
            reasons = ["Your selected life-stage information may be relevant to JSSK public-facility entitlements.", "Confirm local service availability and the current process with the public facility or ASHA."]
            return "potential_service", reasons
        return "information_only", ["This public-facility programme may be relevant to delivery care and eligible sick newborns/infants; review the official NHM details."]

    if scheme_id == "uip":
        if pregnancy == "yes" or infant == "yes" or age == "under18":
            return "potential_service", ["The programme includes eligible children and pregnant women. A health worker can check the applicable schedule and prior records."]
        return "information_only", ["Review official immunisation information and ask a public health facility about the schedule applicable to the person."]

    if scheme_id in {"aam", "pmbjp", "ntep", "abha"}:
        return "public_service" if scheme["kind"] != "digital_tool" else "information_only", ["This is shown as a public service or digital-health resource, not as a personalized eligibility decision."]

    return "information_only", ["Review the linked official source for current eligibility and benefit details."]


def _generic_match_status(scheme: dict[str, Any], answers: dict[str, Any]) -> tuple[str, list[str]] | None:
    """Apply only source-extracted structured conditions; None means a known mismatch."""
    rule = scheme.get("eligibility") or {}
    if not rule:
        return None
    constrained_fields = ("min_age", "max_age", "genders", "pregnant_only", "child_scheme",
                          "max_annual_income", "occupations", "excluded_occupations", "requires",
                          "states", "area", "other_conditions")
    if not any(rule.get(field) for field in constrained_fields):
        return "information_only", ["The source page did not provide enough structured eligibility criteria for a personal match. Review the official scheme details."]
    missing: list[str] = []
    reasons: list[str] = []

    min_age, max_age = rule.get("min_age"), rule.get("max_age")
    group_bounds = {"under18": (0, 17), "18_59": (18, 59), "60_69": (60, 69), "70_plus": (70, 120)}
    age = answers.get("age")
    if min_age is not None or max_age is not None:
        if age is not None:
            if (min_age is not None and age < min_age) or (max_age is not None and age > max_age):
                return None
            reasons.append("Your age is within the age range stated by the source.")
        else:
            bounds = group_bounds.get(answers.get("age_group"))
            if not bounds:
                missing.append("age")
            elif (max_age is not None and bounds[0] > max_age) or (min_age is not None and bounds[1] < min_age):
                return None
            else:
                missing.append("exact age")

    genders = rule.get("genders") or []
    if genders:
        gender = answers.get("gender", "unknown")
        if gender == "unknown":
            missing.append("gender")
        elif gender not in genders:
            return None
        else:
            reasons.append("Your selected gender is included in the source criteria.")

    if rule.get("pregnant_only"):
        if answers.get("pregnant") in {"unknown", "prefer_not_to_say"}:
            missing.append("pregnancy relevance")
        elif answers.get("pregnant") != "yes":
            return None
        else:
            reasons.append("You indicated pregnancy-related support is relevant.")

    if rule.get("child_scheme"):
        age = answers.get("age")
        age_group = answers.get("age_group", "unknown")
        if age is not None:
            if age >= 18:
                return None
        elif age_group == "unknown":
            missing.append("age")
        elif age_group != "under18":
            return None

    income_limit = rule.get("max_annual_income")
    if income_limit is not None:
        band_edges = {"under_1_lakh": (0, 100000), "1_3_lakh": (100000, 300000),
                      "3_5_lakh": (300000, 500000), "5_10_lakh": (500000, 1000000),
                      "above_10_lakh": (1000000, None)}
        band = answers.get("income_band", "unknown")
        bounds = band_edges.get(band)
        if not bounds:
            missing.append("household income band")
        elif bounds[0] > income_limit:
            return None
        elif bounds[1] is None or bounds[1] > income_limit:
            missing.append("exact income eligibility confirmation")
        else:
            reasons.append("Your selected household income band is within the limit stated by the source.")

    occupations = rule.get("occupations") or []
    excluded = rule.get("excluded_occupations") or []
    if occupations or excluded:
        occupation = answers.get("occupation", "unknown")
        if occupation == "unknown":
            worker = answers.get("worker_group", "unknown")
            if worker == "asha": occupation = "unorganised"
            elif worker in {"anganwadi_worker", "anganwadi_helper"}: occupation = "unorganised"
            elif answers.get("government_employment") == "delhi_employee": occupation = "govt_state"
            elif answers.get("government_employment") == "delhi_pensioner": occupation = "pensioner_central"
        if occupation == "unknown":
            missing.append("occupation")
        elif occupation in excluded or (occupations and occupation not in occupations):
            return None
        else:
            reasons.append("Your occupation is consistent with the source criteria.")

    states = [str(value).casefold() for value in rule.get("states", [])]
    state = str(answers.get("state", "")).strip().casefold()
    if states:
        if not state:
            missing.append("state")
        elif state not in states:
            return None
        else:
            reasons.append("Your selected state is included in the source criteria.")

    area_rule = rule.get("area")
    if area_rule:
        area = answers.get("area", "unknown")
        if area == "unknown": missing.append("urban or rural area")
        elif area != area_rule: return None

    flag_answers = {"bpl_or_secc": "bpl_or_secc", "tb_patient": "tb_patient",
                    "disability": "disability", "sc_st": "sc_st"}
    for flag in rule.get("requires", []):
        value = answers.get(flag_answers.get(flag, flag), "unknown")
        if value in {"unknown", "prefer_not_to_say"}:
            missing.append(flag.replace("_", " / "))
        elif value != "yes":
            return None

    conditions = rule.get("other_conditions")
    if conditions:
        missing.append("additional conditions")
        reasons.append(str(conditions))
    if missing:
        reasons.append("Some source-listed criteria still need to be checked: " + ", ".join(missing) + ".")
        return "more_information_needed", reasons
    return "potential_match", reasons or ["Your answers are consistent with the structured criteria extracted from the linked source."]


def match_schemes(answers: dict[str, Any]) -> dict[str, Any]:
    requested_topics = set(answers.get("topics") or [])
    show_all = not requested_topics or "all" in requested_topics
    state = str(answers.get("state", "")).strip()
    matched = []

    for scheme in _load_catalog():
        scheme_topics = set(scheme.get("topics", []))
        if not show_all and not scheme_topics.intersection(requested_topics):
            continue
        jurisdiction_key = scheme.get("jurisdiction", "").casefold()
        if jurisdiction_key in STATE_NAMES and state.casefold() != jurisdiction_key:
            continue
        if scheme["scheme_id"] == "jsy" and not show_all and "pregnancy" not in requested_topics and answers.get("pregnant") != "yes":
            continue
        generic_status = _generic_match_status(scheme, answers)
        if scheme.get("eligibility") and generic_status is None:
            continue
        status, reasons = generic_status or _match_status(scheme, answers)
        matched.append({**scheme, "match_status": status, "match_reasons": reasons})

    state_catalog_available = any(scheme.get("jurisdiction", "").casefold() == state.casefold()
                                  for scheme in _load_catalog()) if state else False
    return {
        "results": matched,
        "state": state or None,
        "state_catalog": "partial" if state_catalog_available else ("not_selected" if not state else "not_available"),
        "state_catalog_note": (
            f"Showing available source-linked options for {state}. Listings may be incomplete; check the official state portal for more programmes."
            if state_catalog_available else
            f"No state-specific listings are currently available for {state}. Browse the official portal for programmes in your state."
            if state else
            "Showing national information. Choose a State/UT to explore local programmes."
        ),
        "state_scheme_search_url": "https://www.myscheme.gov.in/",
        "disclaimer": "These are information and potential matches only, not an official eligibility decision or guarantee of a benefit. Confirm current rules with the responsible government authority.",
        "catalog_status": "source_linked_prototype",
    }
