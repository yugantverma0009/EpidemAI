"""Clearly labelled historical local context backed by the bundled EpiClim CSV."""
from __future__ import annotations

from app.services.epiclim_service import get_historical_records


DISEASES = ("Dengue", "Malaria", "Chikungunya", "Cholera", "Acute Diarrhoeal Disease", "Acute Encephalitis Syndrome")


def get_local_context(state: str, district: str) -> dict:
    items = []
    for disease in DISEASES:
        observations, summary = get_historical_records(disease, state, district)
        if not observations:
            continue
        items.append({
            "disease": disease,
            "type": "historical_observation",
            "source": "EpiClim bundled dataset",
            "data_period": f"{summary['first_observed']} to {summary['last_observed']}",
            "freshness": "stale",
            "observed_months": len(observations),
            "note": "Historical reported observations only; not current incidence or an individual's diagnosis. Missing months do not mean zero cases.",
        })
    return {
        "location": {"state": state, "district": district},
        "items": items,
        "status": "available" if items else "unavailable",
        "limitations": [
            "Area-level historical data does not indicate an individual's diagnosis.",
            "The bundled observations are stale and must not be interpreted as current local risk.",
            "Missing months mean no report in the source, not zero cases.",
        ],
    }
