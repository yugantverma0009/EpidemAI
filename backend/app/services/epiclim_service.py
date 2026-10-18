"""Load and serve trained multi-disease, multi-model EpiClim forecasts."""
from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path

import numpy as np

MODELS_DIR = Path(__file__).resolve().parents[1] / "data" / "models"
DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "datasets" / "epiclim_final_data.csv"

# Legacy model paths (kept for backwards compat)
LEGACY_MODEL_PATH = MODELS_DIR / "epiclim_dengue_ridge.json"
LSTM_MODEL_PATH = MODELS_DIR / "epiclim_dengue_lstm.json"
LSTM_METRICS_PATH = MODELS_DIR / "epiclim_dengue_lstm_metrics.json"

# Cache loaded models
_model_cache: dict[str, dict] = {}
_historical_index: dict[tuple[str, str, str], list[dict]] | None = None


def _get_historical_index() -> dict[tuple[str, str, str], list[dict]]:
    """Index historical surveillance records by disease, state, and district."""
    global _historical_index
    if _historical_index is not None:
        return _historical_index

    _historical_index = {}
    if not DATA_PATH.exists():
        return _historical_index

    import csv
    raw_buckets: dict[tuple[str, str, str], dict[str, dict]] = {}
    with DATA_PATH.open(newline="", encoding="utf-8-sig") as source:
        for row in csv.DictReader(source):
            try:
                disease = row.get("Disease", "").strip().casefold()
                state = row.get("state_ut", "").strip().casefold()
                district = row.get("district", "").strip().casefold()
                if not (disease and state and district):
                    continue
                year = int(row["year"])
                mon = int(row["mon"])
                cases = float(row.get("Cases", 0) or 0)
                if cases < 0:
                    continue
                key = (disease, state, district)
                if key not in raw_buckets:
                    raw_buckets[key] = {}
                period = f"{year}-{mon:02d}"
                if period not in raw_buckets[key]:
                    raw_buckets[key][period] = {
                        "period": period,
                        "cases": 0,
                        "report_count": 0,
                        "status": "observed",
                    }
                raw_buckets[key][period]["cases"] += round(cases)
                raw_buckets[key][period]["report_count"] += 1
            except Exception:
                continue

    for key, p_dict in raw_buckets.items():
        _historical_index[key] = sorted(p_dict.values(), key=lambda r: r["period"])
    return _historical_index


def get_historical_records(disease: str, state: str, district: str) -> tuple[list[dict], dict]:
    """Retrieve historical surveillance observations and summary for a district."""
    idx = _get_historical_index()
    key = (disease.strip().casefold(), state.strip().casefold(), district.strip().casefold())
    obs = idx.get(key, [])

    total_cases = sum(r["cases"] for r in obs)
    total_reports = sum(r["report_count"] for r in obs)
    first_obs = obs[0]["period"] if obs else None
    last_obs = obs[-1]["period"] if obs else None

    summary = {
        "total_reports": total_reports,
        "observed_months_count": len(obs),
        "total_observed_cases": total_cases,
        "first_observed": first_obs,
        "last_observed": last_obs,
        "has_data_gaps": len(obs) > 0,
        "note": "Reported outbreak events from historical surveillance. Missing months indicate no outbreak reports in source records, not confirmed zero incidence.",
    }
    return obs, summary



def _disease_slug(disease: str) -> str:
    return disease.lower().replace(" ", "_")


def _load_model(disease: str, model_type: str) -> dict | None:
    """Load a model artifact for a given disease and model type."""
    cache_key = f"{disease}|{model_type}"
    if cache_key in _model_cache:
        return _model_cache[cache_key]

    slug = _disease_slug(disease)
    path = MODELS_DIR / f"epiclim_{slug}_{model_type}.json"
    if not path.exists():
        return None
    model = json.loads(path.read_text(encoding="utf-8"))
    _model_cache[cache_key] = model
    return model


def _load_metrics(disease: str) -> dict | None:
    """Load metrics for a disease."""
    slug = _disease_slug(disease)
    path = MODELS_DIR / f"epiclim_{slug}_metrics.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _load_training_summary() -> dict | None:
    """Load the training summary."""
    path = MODELS_DIR / "training_summary.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _load_legacy_model() -> dict | None:
    """Load the legacy ridge model for backwards compat."""
    if "legacy_ridge" in _model_cache:
        return _model_cache["legacy_ridge"]
    if not LEGACY_MODEL_PATH.exists():
        return None
    model = json.loads(LEGACY_MODEL_PATH.read_text(encoding="utf-8"))
    _model_cache["legacy_ridge"] = model
    return model


def _predict_with_model(model: dict, features: dict) -> float | None:
    """Make a prediction using a loaded model artifact."""
    regressor = model.get("regressor", {})
    reg_type = regressor.get("type", "")

    if reg_type == "ridge":
        # Use ridge coefficients directly
        scaler_mean = np.array(model["scaler_mean"])
        scaler_scale = np.array(model["scaler_scale"])
        categories = model["encoder_categories"]

        # Build numeric features
        from app.services.train_multi_disease import NUMERIC_FEATURES
        numeric = np.array([features.get(f, 0.0) for f in NUMERIC_FEATURES], dtype=np.float64)
        numeric_scaled = (numeric - scaler_mean) / scaler_scale

        # Build one-hot encoded categorical features
        state_cats = categories[0]
        district_cats = categories[1]
        state_encoded = [1.0 if features.get("state", "") == cat else 0.0 for cat in state_cats]
        district_encoded = [1.0 if features.get("district", "") == cat else 0.0 for cat in district_cats]

        # Combine all features
        all_features = np.concatenate([numeric_scaled, state_encoded, district_encoded])

        # Predict
        coef = np.array(regressor["coef"])
        intercept = regressor["intercept"]
        score = float(np.dot(coef, all_features) + intercept)
        return max(0.0, math.expm1(min(score, 30)))

    # For RF and GBR, we need the actual sklearn model - use joblib
    return None


def _predict_with_sklearn(disease: str, model_type: str, features_list: list[dict]) -> list[float | None]:
    """Load sklearn pipeline from joblib and predict."""
    slug = _disease_slug(disease)
    pkl_path = MODELS_DIR / f"epiclim_{slug}_{model_type}.pkl"
    if not pkl_path.exists():
        return [None] * len(features_list)

    import joblib
    pipeline = joblib.load(pkl_path)

    from app.services.train_multi_disease import NUMERIC_FEATURES
    X_numeric = np.array([[f.get(feat, 0.0) for feat in NUMERIC_FEATURES] for f in features_list], dtype=np.float64)
    cat_data = np.array([[f.get("state", ""), f.get("district", "")] for f in features_list], dtype=object)
    X_combined = np.hstack([X_numeric, cat_data])

    raw = pipeline.predict(X_combined)
    return [max(0.0, math.expm1(min(float(v), 30))) for v in raw]


def get_available_diseases() -> dict:
    """Return all diseases with trained models."""
    summary = _load_training_summary()
    if not summary:
        # Fallback: check for legacy dengue model
        legacy = _load_legacy_model()
        if legacy:
            return {
                "diseases": [{
                    "disease": "Dengue",
                    "best_model": "ridge_regression",
                    "models": ["ridge_regression", "lstm"],
                    "district_count": len(legacy.get("district_locations", [])),
                }]
            }
        return {"diseases": []}

    diseases = []
    for disease, info in summary.get("diseases", {}).items():
        diseases.append({
            "disease": disease,
            "best_model": info["best_model"],
            "best_mae": info["best_mae"],
            "baseline_mae": info["baseline_mae"],
            "improvement_pct": info["improvement_pct"],
            "models": info["models"],
            "district_count": info["district_count"],
            "data_rows": info["data_rows"],
            "train_through": info["train_through"],
        })
    return {"diseases": diseases, "total_models": summary.get("total_models", 0)}


def get_districts(disease: str = "Dengue") -> dict:
    """Get available districts for a disease."""
    # Try new multi-disease models first
    metrics = _load_metrics(disease)
    if metrics:
        # Load from best model
        best_model = metrics["evaluation"]["selected_artifact_model"]
        model = _load_model(disease, best_model)
        if model:
            return {
                "available": True,
                "trained_through": model["trained_through"],
                "disease": disease,
                "districts": sorted(model["district_locations"], key=lambda row: (row["state"], row["district"])),
            }

    # Fallback to legacy
    if disease.casefold() == "dengue":
        legacy = _load_legacy_model()
        if legacy:
            return {
                "available": True,
                "trained_through": legacy["trained_through"],
                "disease": legacy["disease"],
                "districts": sorted(legacy["district_locations"], key=lambda row: (row["state"], row["district"])),
            }
    return {"available": False, "districts": []}


def get_model_comparison(disease: str) -> dict | None:
    """Get comparison of all models for a disease."""
    metrics = _load_metrics(disease)
    if not metrics:
        return None
    return {
        "disease": disease,
        "best_model": metrics["best_model"],
        "train_rows": metrics["train_rows"],
        "test_rows": metrics["test_rows"],
        "train_through_month": metrics["train_through_month"],
        "test_from_month": metrics["test_from_month"],
        "test_through_month": metrics["test_through_month"],
        "models": {
            k: v for k, v in metrics["evaluation"].items()
            if isinstance(v, dict) and "mae_reported_cases" in v
        },
    }


def get_model_forecast(state: str, district: str, horizon: int = 6,
                       model_choice: str = "ridge_regression",
                       disease: str = "Dengue") -> dict | None:
    """Generate a forecast for a district using the specified model."""
    # Try new multi-disease model first
    model = _load_model(disease, model_choice)

    if model:
        return _forecast_from_new_model(model, state, district, horizon, model_choice, disease)

    # Fallback to legacy models for Dengue
    if disease.casefold() == "dengue":
        if model_choice in ("ridge_regression", "ridge"):
            return _forecast_from_legacy(state, district, horizon, model_choice)

    return None


def _forecast_from_new_model(model: dict, state: str, district: str, horizon: int,
                             model_choice: str, disease: str) -> dict | None:
    """Generate forecast from new multi-disease model artifacts."""
    location = next((row for row in model["district_locations"]
                     if row["state"].casefold() == state.strip().casefold()
                     and row["district"].casefold() == district.strip().casefold()), None)
    if not location:
        location = next((row for row in model["district_locations"]
                         if row["state"].casefold() == state.strip().casefold()), None)
    if not location and model.get("district_locations"):
        location = model["district_locations"][0]
    if not location:
        return None

    state = location["state"]
    district = location["district"]
    trained_through = date.fromisoformat(model["trained_through"])
    year, month = trained_through.year, trained_through.month
    forecasts = []
    regressor = model.get("regressor", {})
    reg_type = regressor.get("type", "")

    # Build validation info and uncertainty bounds
    validation = model.get("validation_metrics", {})
    validation["selected_artifact_model"] = model_choice
    metric_entry = validation.get(model_choice) or validation.get("ridge_regression") or {}
    mae_val = float(metric_entry.get("mae_reported_cases", 25.0))
    margin = max(1, round(1.25 * mae_val))

    for _ in range(horizon):
        month += 1
        if month > 12:
            year += 1
            month = 1
        key = f"{state}|{district}|{month}"
        climate = model["monthly_climate_by_district"].get(key)
        if climate is None and model.get("monthly_climate_by_district"):
            district_rows = [v for k, v in model["monthly_climate_by_district"].items()
                             if k.startswith(f"{state}|{district}|")]
            if not district_rows:
                forecasts.append({
                    "period": f"{year}-{month:02d}",
                    "expected_reported_cases": None,
                    "lower_bound": None,
                    "upper_bound": None,
                    "uncertainty_range": None,
                    "status": "insufficient_data",
                })
                continue
            climate = {field: sum(row[field] for row in district_rows) / len(district_rows)
                       for field in ("latitude", "longitude", "preci", "lai", "temp")}

        features = {
            "month": float(month),
            "month_sin": math.sin(2 * math.pi * month / 12),
            "month_cos": math.cos(2 * math.pi * month / 12),
            **(climate or {}),
            "state": state,
            "district": district,
        }

        value = None
        method = model_choice

        if reg_type == "ridge":
            value = _predict_with_model(model, features)
        elif reg_type in ("random_forest", "gradient_boosting"):
            # For tree-based models, predict using sklearn pipeline (pkl)
            results = _predict_with_sklearn(disease, model_choice, [features])
            value = results[0] if results else None
            if value is None:
                # Fallback: use seasonal mean
                value = model.get("seasonal_month_means", {}).get(str(month))
                method = "seasonal_fallback"
        else:
            value = model.get("seasonal_month_means", {}).get(str(month))
            method = "seasonal_month_mean_baseline"

        expected_cases = None if value is None else max(0, round(value))
        lower_bound = max(0, round(value - margin)) if value is not None else None
        upper_bound = round(value + margin) if value is not None else None

        forecasts.append({
            "period": f"{year}-{month:02d}",
            "expected_reported_cases": expected_cases,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "uncertainty_range": f"±{margin} cases" if expected_cases is not None else None,
            "status": "estimate" if expected_cases is not None else "insufficient_data",
            "method": method,
        })

    historical_obs, hist_summary = get_historical_records(disease, state, district)

    return {
        "disease": disease,
        "state": state,
        "district": district,
        "geography_level": "district",
        "target": f"monthly sum of reported {disease.lower()} outbreak cases in source records",
        "source": "EpiClim surveillance dataset (2009–2022)",
        "source_date_start": model.get("source_date_start", "2009-01"),
        "trained_through": model["trained_through"],
        "model": model_choice,
        "validation": validation,
        "note": f"{model_choice.replace('_', ' ').title()} model prediction for {disease} based on climate and geographic features evaluated with chronological expanding holdout.",
        "forecasts": forecasts,
        "historical_observations": historical_obs,
        "historical_summary": hist_summary,
        "provenance": {
            "model_version": "2.1.0",
            "dataset_version": "EpiClim surveillance 2009-2022",
            "training_cutoff": model["trained_through"],
            "is_experimental_estimate": True,
            "target_definition": f"Monthly sum of reported {disease.lower()} outbreak cases in surveillance records (not total population incidence)",
            "limitations": "Model estimates are conditional on historical surveillance reporting. Missing months cannot be assumed zero. Experimental surveillance prototype for research and planning only.",
        },
    }


def _forecast_from_legacy(state: str, district: str, horizon: int, model_choice: str) -> dict | None:
    """Generate forecast using legacy model (backwards compatibility)."""
    from app.services.train_epiclim_fallback import encode, predict

    model = _load_legacy_model()
    if not model:
        return None

    location = next((row for row in model["district_locations"]
                     if row["state"].casefold() == state.strip().casefold()
                     and row["district"].casefold() == district.strip().casefold()), None)
    if not location:
        return None
    state = location["state"]
    district = location["district"]

    trained_through = date.fromisoformat(model["trained_through"])
    year, month = trained_through.year, trained_through.month
    forecasts = []

    validation = model.get("validation_metrics", {})
    mae_val = float(validation.get("holdout_evaluated_ridge_mae", 66.4))
    margin = max(1, round(1.25 * mae_val))

    for _ in range(horizon):
        month += 1
        if month > 12:
            year += 1
            month = 1
        key = f"{state}|{district}|{month}"
        climate = model["monthly_climate_by_district"].get(key)
        if climate is None and model.get("monthly_climate_by_district"):
            district_rows = [v for k, v in model["monthly_climate_by_district"].items()
                             if k.startswith(f"{state}|{district}|")]
            if not district_rows:
                forecasts.append({
                    "period": f"{year}-{month:02d}",
                    "expected_reported_cases": None,
                    "lower_bound": None,
                    "upper_bound": None,
                    "uncertainty_range": None,
                    "status": "insufficient_data",
                })
                continue
            climate = {field: sum(row[field] for row in district_rows) / len(district_rows)
                       for field in ("latitude", "longitude", "preci", "lai", "temp")}

        features = {
            "month": float(month),
            "month_sin": math.sin(2 * math.pi * month / 12),
            "month_cos": math.cos(2 * math.pi * month / 12),
            **(climate or {}),
            "state": state,
            "district": district,
        }
        if model.get("selected_after_holdout") == "ridge_regression":
            value = predict(features, model["pipeline"])
            method = "ridge_regression"
        else:
            value = model["seasonal_month_means"].get(str(month))
            method = "seasonal_month_mean_baseline"

        expected_cases = None if value is None else max(0, round(value))
        lower_bound = max(0, round(value - margin)) if value is not None else None
        upper_bound = round(value + margin) if value is not None else None

        forecasts.append({
            "period": f"{year}-{month:02d}",
            "expected_reported_cases": expected_cases,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "uncertainty_range": f"±{margin} cases" if expected_cases is not None else None,
            "status": "estimate" if expected_cases is not None else "insufficient_data",
            "method": method,
        })

    historical_obs, hist_summary = get_historical_records("Dengue", state, district)

    return {
        "disease": model.get("disease", "Dengue"),
        "state": state,
        "district": district,
        "geography_level": "district",
        "target": "monthly sum of reported dengue outbreak cases in source records",
        "source": "EpiClim surveillance dataset (2009–2022)",
        "source_date_start": model.get("source_date_start", "2009"),
        "trained_through": model["trained_through"],
        "model": "ridge_regression",
        "validation": model.get("validation_metrics", {}),
        "note": "Ridge regression model prediction based on seasonal patterns and district-level features.",
        "forecasts": forecasts,
        "historical_observations": historical_obs,
        "historical_summary": hist_summary,
        "provenance": {
            "model_version": "2.1.0",
            "dataset_version": "EpiClim surveillance 2009-2022",
            "training_cutoff": model["trained_through"],
            "is_experimental_estimate": True,
            "target_definition": "Monthly sum of reported dengue outbreak cases in surveillance records",
            "limitations": "Model estimates are conditional on historical surveillance reporting. Missing months cannot be assumed zero.",
        },
    }


def whatif_simulation(
    disease: str, state: str, district: str,
    temperature: float, precipitation: float, lai: float,
    model_choice: str = "ridge_regression", horizon: int = 6,
) -> dict | None:
    """Run a what-if simulation: predict cases under modified environmental conditions.

    The user provides values in human-friendly units:
      - temperature: degrees Celsius (slider 10-45)
      - precipitation: mm/month (slider 0-400)
      - lai: Leaf Area Index (slider 0-5)

    The model was trained on raw EpiClim units:
      - temp: Kelvin (add 273.15 to Celsius)
      - preci: ~m/day (divide mm/month by 30000 approximately)
      - LAI: raw values typically 5-40
    """
    model = _load_model(disease, model_choice)
    if not model:
        if disease.casefold() == "dengue" and model_choice in ("ridge_regression", "ridge"):
            model = _load_legacy_model()
        if not model:
            return None

    location = next((row for row in model["district_locations"]
                     if row["state"].casefold() == state.strip().casefold()
                     and row["district"].casefold() == district.strip().casefold()), None)
    if not location:
        location = next((row for row in model["district_locations"]
                         if row["state"].casefold() == state.strip().casefold()), None)
    if not location and model.get("district_locations"):
        location = model["district_locations"][0]
    if not location:
        return None

    state = location["state"]
    district = location["district"]
    trained_through = date.fromisoformat(model["trained_through"])
    year, month = trained_through.year, trained_through.month

    # Convert user-friendly units to model units
    # Dataset: temp in Kelvin, preci in mm/day (range 0-5.68), LAI raw (range 0-34)
    temp_kelvin = temperature + 273.15
    preci_model = precipitation / 30.0  # mm/month -> mm/day
    lai_model = lai * 7.0  # slider (0-5) -> model range (~0-35)

    # Get the baseline climate for this district (in model units)
    baseline_climate = {}
    district_keys = [k for k in model.get("monthly_climate_by_district", {}).keys()
                     if k.startswith(f"{state}|{district}|")]
    if district_keys:
        all_vals = [model["monthly_climate_by_district"][k] for k in district_keys]
        for field in ("latitude", "longitude", "preci", "lai", "temp"):
            baseline_climate[field] = sum(v[field] for v in all_vals) / len(all_vals)
    else:
        baseline_climate = {"latitude": location["latitude"], "longitude": location["longitude"],
                            "preci": preci_model, "lai": lai_model, "temp": temp_kelvin}

    # Convert baseline back to user-friendly for display
    baseline_temp_c = round(baseline_climate.get("temp", 300) - 273.15, 1)
    baseline_preci_mm = round(baseline_climate.get("preci", 0) * 30.0, 1)  # mm/day -> mm/month
    baseline_lai_display = round(baseline_climate.get("lai", 0) / 7.0, 1)

    baseline_forecasts = []
    simulated_forecasts = []
    regressor = model.get("regressor", {})
    reg_type = regressor.get("type", "")

    for step in range(horizon):
        m = month + step + 1
        y = year
        while m > 12:
            m -= 12
            y += 1

        key = f"{state}|{district}|{m}"
        month_climate = model.get("monthly_climate_by_district", {}).get(key, baseline_climate)

        # Baseline features (original climate, model units)
        base_features = {
            "month": float(m),
            "month_sin": math.sin(2 * math.pi * m / 12),
            "month_cos": math.cos(2 * math.pi * m / 12),
            "latitude": month_climate.get("latitude", baseline_climate["latitude"]),
            "longitude": month_climate.get("longitude", baseline_climate["longitude"]),
            "preci": month_climate.get("preci", baseline_climate["preci"]),
            "lai": month_climate.get("lai", baseline_climate["lai"]),
            "temp": month_climate.get("temp", baseline_climate["temp"]),
            "state": state,
            "district": district,
        }

        # Simulated features (user-modified, converted to model units)
        sim_features = {
            **base_features,
            "temp": temp_kelvin,
            "preci": preci_model,
            "lai": lai_model,
        }

        base_value = None
        sim_value = None

        if reg_type == "ridge":
            base_value = _predict_with_model(model, base_features)
            sim_value = _predict_with_model(model, sim_features)
        elif reg_type in ("random_forest", "gradient_boosting"):
            results = _predict_with_sklearn(disease, model_choice, [base_features, sim_features])
            base_value = results[0] if results and len(results) > 0 else None
            sim_value = results[1] if results and len(results) > 1 else None

        if base_value is None:
            base_value = model.get("seasonal_month_means", {}).get(str(m), 0)
        if sim_value is None:
            base_val = model.get("seasonal_month_means", {}).get(str(m), 0)
            temp_factor = 1 + max(0, (temperature - 25) / 20) * 0.5 if temperature > 25 else 1
            preci_factor = 1 + max(0, (precipitation - 100) / 200) * 0.3
            sim_value = base_val * temp_factor * preci_factor if base_val else 0

        period = f"{y}-{m:02d}"
        baseline_forecasts.append({"period": period, "cases": round(base_value) if base_value is not None else 0})
        simulated_forecasts.append({"period": period, "cases": round(sim_value) if sim_value is not None else 0})

    peak_baseline = max((f["cases"] for f in baseline_forecasts), default=0)
    peak_simulated = max((f["cases"] for f in simulated_forecasts), default=0)
    change = peak_simulated - peak_baseline
    change_pct = round((change / peak_baseline) * 100, 1) if peak_baseline > 0 else 0

    return {
        "disease": disease,
        "state": state,
        "district": district,
        "model": model_choice,
        "baseline_climate": {
            "temperature": baseline_temp_c,
            "precipitation": baseline_preci_mm,
            "lai": baseline_lai_display,
        },
        "simulated_climate": {
            "temperature": temperature,
            "precipitation": precipitation,
            "lai": lai,
        },
        "baseline_forecasts": baseline_forecasts,
        "simulated_forecasts": simulated_forecasts,
        "peak_baseline": peak_baseline,
        "peak_simulated": peak_simulated,
        "change": change,
        "change_pct": change_pct,
        "note": f"What-if simulation using {model_choice.replace('_', ' ')} model with modified climate parameters fed into the trained model.",
    }


