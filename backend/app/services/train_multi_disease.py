"""Multi-disease, multi-model trainer for EpiClim surveillance data.

Run from backend/: python -m app.services.train_multi_disease

Trains Ridge, Random Forest, and Gradient Boosting models for every disease
with enough data in the EpiClim dataset.  Auto-selects the best model per
disease based on holdout MAE.
"""
from __future__ import annotations

import csv
import json
import math
import warnings
from datetime import date
from pathlib import Path

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

warnings.filterwarnings("ignore", category=FutureWarning)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA = ROOT / "app" / "data" / "datasets" / "epiclim_final_data.csv"
MODELS_DIR = ROOT / "app" / "data" / "models"

# Diseases with enough records to train on
TRAINABLE_DISEASES = [
    "Dengue",
    "Acute Diarrhoeal Disease",
    "Chikungunya",
    "Cholera",
    "Malaria",
    "Acute Encephalitis Syndrome",
]

NUMERIC_FEATURES = ["month", "month_sin", "month_cos", "latitude", "longitude", "preci", "lai", "temp"]
CATEGORICAL_FEATURES = ["state", "district"]


def load_events(path: Path, disease: str) -> list[dict]:
    """Load and aggregate outbreak records into district-month observations."""
    events = []
    with path.open(newline="", encoding="utf-8-sig") as source:
        for row in csv.DictReader(source):
            if row.get("Disease", "").strip().casefold() != disease.strip().casefold():
                continue
            try:
                observed_date = date(int(row["year"]), int(row["mon"]), int(row["day"]))
                cases = float(row["Cases"])
                if cases < 0:
                    continue
                month = observed_date.month
                events.append({
                    "date": observed_date,
                    "month_date": (observed_date.year, month),
                    "month": float(month),
                    "month_sin": math.sin(2 * math.pi * month / 12),
                    "month_cos": math.cos(2 * math.pi * month / 12),
                    "latitude": float(row["Latitude"]),
                    "longitude": float(row["Longitude"]),
                    "preci": float(row["preci"]),
                    "lai": float(row["LAI"]),
                    "temp": float(row["Temp"]),
                    "state": row["state_ut"].strip(),
                    "district": row["district"].strip(),
                    "cases": cases,
                })
            except (ValueError, TypeError, KeyError):
                continue

    # Aggregate to district-month
    grouped: dict[tuple[str, str, int, int], list[dict]] = {}
    for event in events:
        key = (event["state"], event["district"], event["month_date"][0], event["month_date"][1])
        grouped.setdefault(key, []).append(event)

    monthly = []
    for (state, district, year, month), reports in grouped.items():
        monthly.append({
            "date": max(row["date"] for row in reports),
            "month_date": (year, month),
            "month": float(month),
            "month_sin": math.sin(2 * math.pi * month / 12),
            "month_cos": math.cos(2 * math.pi * month / 12),
            "latitude": sum(row["latitude"] for row in reports) / len(reports),
            "longitude": sum(row["longitude"] for row in reports) / len(reports),
            "preci": sum(row["preci"] for row in reports) / len(reports),
            "lai": sum(row["lai"] for row in reports) / len(reports),
            "temp": sum(row["temp"] for row in reports) / len(reports),
            "state": state,
            "district": district,
            "cases": sum(row["cases"] for row in reports),
            "report_count": len(reports),
        })
    return sorted(monthly, key=lambda item: (item["date"], item["state"], item["district"]))


def _build_feature_matrix(events: list[dict]) -> tuple[np.ndarray, np.ndarray, list[str], list[str]]:
    """Build feature arrays from events."""
    numeric = np.array([[e[f] for f in NUMERIC_FEATURES] for e in events], dtype=np.float64)
    states = [e["state"] for e in events]
    districts = [e["district"] for e in events]
    targets = np.array([math.log1p(e["cases"]) for e in events], dtype=np.float64)
    return numeric, targets, states, districts


def _climate_lookup(events: list[dict]) -> dict:
    """Build a climate lookup table from training data."""
    buckets: dict[tuple[str, str, int], list[dict]] = {}
    for event in events:
        buckets.setdefault((event["state"], event["district"], int(event["month"])), []).append(event)
    return {
        f"{state}|{district}|{month}": {
            field: sum(row[field] for row in rows) / len(rows)
            for field in ("latitude", "longitude", "preci", "lai", "temp")
        }
        for (state, district, month), rows in buckets.items()
    }


def _district_locations(events: list[dict]) -> list[dict]:
    """Build a district location table."""
    locations: dict[tuple[str, str], list[dict]] = {}
    for event in events:
        locations.setdefault((event["state"], event["district"]), []).append(event)
    return [{
        "state": state,
        "district": district,
        "latitude": sum(row["latitude"] for row in rows) / len(rows),
        "longitude": sum(row["longitude"] for row in rows) / len(rows),
        "observed_district_months": len(rows),
        "latest_observed_month": f"{max(row['month_date'] for row in rows)[0]}-{max(row['month_date'] for row in rows)[1]:02d}",
    } for (state, district), rows in locations.items()]


def apply_training_climate_normals(train_events: list[dict], target_events: list[dict]) -> list[dict]:
    """Replace holdout-month weather with normals derived only from train data."""
    fields = ("latitude", "longitude", "preci", "lai", "temp")
    district_month: dict[tuple[str, str, int], list[dict]] = {}
    district_all: dict[tuple[str, str], list[dict]] = {}
    state_month: dict[tuple[str, int], list[dict]] = {}
    global_month: dict[int, list[dict]] = {}
    for event in train_events:
        district_month.setdefault((event["state"], event["district"], int(event["month"])), []).append(event)
        district_all.setdefault((event["state"], event["district"]), []).append(event)
        state_month.setdefault((event["state"], int(event["month"])), []).append(event)
        global_month.setdefault(int(event["month"]), []).append(event)

    def means(rows: list[dict]) -> dict:
        return {field: sum(row[field] for row in rows) / len(rows) for field in fields}

    result = []
    for event in target_events:
        key = (event["state"], event["district"], int(event["month"]))
        fallback_rows = (district_month.get(key) or district_all.get((event["state"], event["district"]))
                         or state_month.get((event["state"], int(event["month"])))
                         or global_month.get(int(event["month"])) or train_events)
        result.append({**event, **means(fallback_rows)})
    return result


def _train_sklearn_model(model_cls, model_params: dict, X_train: np.ndarray, y_train: np.ndarray,
                         cat_train: list[list[str]]) -> tuple:
    """Train a scikit-learn model with proper preprocessing."""
    # Build column transformer for numeric + categorical features
    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, list(range(len(NUMERIC_FEATURES)))),
            ("cat", categorical_transformer, [len(NUMERIC_FEATURES), len(NUMERIC_FEATURES) + 1]),
        ]
    )

    # Combine numeric and categorical into one array
    cat_array = np.array(cat_train, dtype=object)
    X_combined = np.hstack([X_train, cat_array])

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", model_cls(**model_params)),
    ])

    pipeline.fit(X_combined, y_train)
    return pipeline


def _predict_sklearn(pipeline, X_test: np.ndarray, cat_test: list[list[str]]) -> np.ndarray:
    """Predict using a trained sklearn pipeline."""
    cat_array = np.array(cat_test, dtype=object)
    X_combined = np.hstack([X_test, cat_array])
    raw = pipeline.predict(X_combined)
    return np.maximum(0, np.expm1(np.minimum(raw, 30)))


def train_disease(data_path: Path, disease: str, test_fraction: float = 0.2) -> dict | None:
    """Train all models for a single disease. Returns metrics dict or None if insufficient data."""
    events = load_events(data_path, disease)
    months = sorted({event["month_date"] for event in events})

    if len(events) < 20 or len(months) < 4:
        print(f"  ⚠ Skipping {disease}: only {len(events)} rows, {len(months)} months")
        return None

    # Chronological split
    split_index = max(1, min(len(months) - 1, int(len(months) * (1 - test_fraction))))
    cutoff = months[split_index]
    train_events = [event for event in events if event["month_date"] < cutoff]
    test_events = [event for event in events if event["month_date"] >= cutoff]

    if len(train_events) < 10 or len(test_events) < 5:
        print(f"  ⚠ Skipping {disease}: insufficient train ({len(train_events)}) or test ({len(test_events)}) rows")
        return None

    # Apply climate normals to test set (no future leakage)
    test_features = apply_training_climate_normals(train_events, test_events)

    # Build feature matrices
    X_train, y_train, states_train, districts_train = _build_feature_matrix(train_events)
    X_test, _, states_test, districts_test = _build_feature_matrix(test_features)
    actual = np.array([e["cases"] for e in test_events])

    cat_train = [[s, d] for s, d in zip(states_train, districts_train)]
    cat_test = [[s, d] for s, d in zip(states_test, districts_test)]

    # Define models
    model_configs = {
        "ridge_regression": (Ridge, {"alpha": 10.0}),
        "random_forest": (RandomForestRegressor, {
            "n_estimators": 100,
            "max_depth": 12,
            "min_samples_leaf": 3,
            "random_state": 42,
            "n_jobs": -1,
        }),
        "gradient_boosting": (GradientBoostingRegressor, {
            "n_estimators": 150,
            "max_depth": 5,
            "learning_rate": 0.1,
            "min_samples_leaf": 3,
            "random_state": 42,
        }),
    }

    results = {}
    best_model_name = None
    best_mae = float("inf")
    pipelines = {}

    for model_name, (model_cls, model_params) in model_configs.items():
        try:
            pipeline = _train_sklearn_model(model_cls, model_params, X_train, y_train, cat_train)
            preds = _predict_sklearn(pipeline, X_test, cat_test)
            mae_val = float(mean_absolute_error(actual, preds))
            rmse_val = float(np.sqrt(mean_squared_error(actual, preds)))
            results[model_name] = {
                "mae_reported_cases": round(mae_val, 2),
                "rmse_reported_cases": round(rmse_val, 2),
            }
            pipelines[model_name] = pipeline
            if mae_val < best_mae:
                best_mae = mae_val
                best_model_name = model_name
            print(f"  ✓ {model_name}: MAE={mae_val:.1f}, RMSE={rmse_val:.1f}")
        except Exception as e:
            print(f"  ✗ {model_name} failed: {e}")
            results[model_name] = {"mae_reported_cases": None, "rmse_reported_cases": None, "error": str(e)}

    # Seasonal baseline
    month_history: dict[int, list[float]] = {}
    for event in train_events:
        month_history.setdefault(int(event["month"]), []).append(event["cases"])
    overall_mean = sum(e["cases"] for e in train_events) / len(train_events)
    baseline_preds = [
        sum(month_history.get(int(e["month"]), [overall_mean])) / len(month_history.get(int(e["month"]), [overall_mean]))
        for e in test_events
    ]
    baseline_mae = float(mean_absolute_error(actual, baseline_preds))
    baseline_rmse = float(np.sqrt(mean_squared_error(actual, baseline_preds)))
    results["seasonal_month_mean_baseline"] = {
        "mae_reported_cases": round(baseline_mae, 2),
        "rmse_reported_cases": round(baseline_rmse, 2),
    }
    print(f"  ✓ seasonal_baseline: MAE={baseline_mae:.1f}, RMSE={baseline_rmse:.1f}")

    # Train final models on all data for production
    X_all, y_all, states_all, districts_all = _build_feature_matrix(events)
    cat_all = [[s, d] for s, d in zip(states_all, districts_all)]
    all_month_means: dict[int, list[float]] = {}
    for event in events:
        all_month_means.setdefault(int(event["month"]), []).append(event["cases"])

    final_pipelines = {}
    for model_name, (model_cls, model_params) in model_configs.items():
        if model_name in pipelines:
            try:
                final_pipelines[model_name] = _train_sklearn_model(model_cls, model_params, X_all, y_all, cat_all)
            except Exception:
                final_pipelines[model_name] = pipelines[model_name]

    # Save model artifacts
    disease_slug = disease.lower().replace(" ", "_")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    for model_name, pipeline in final_pipelines.items():
        artifact = _serialize_pipeline(pipeline, model_name, disease, events, results, best_model_name, all_month_means)
        model_path = MODELS_DIR / f"epiclim_{disease_slug}_{model_name}.json"
        model_path.write_text(json.dumps(artifact, indent=2, default=str), encoding="utf-8")
        # Also save sklearn pipeline as pickle for tree-based models
        import joblib
        pkl_path = MODELS_DIR / f"epiclim_{disease_slug}_{model_name}.pkl"
        joblib.dump(pipeline, pkl_path)

    # Save metrics
    metrics = {
        "disease": disease,
        "data_file": data_path.name,
        "observed_district_month_rows": len(events),
        "district_count": len({event["district"] for event in events}),
        "source_date_start": events[0]["date"].isoformat(),
        "source_date_end": events[-1]["date"].isoformat(),
        "train_rows": len(train_events),
        "test_rows": len(test_events),
        "train_through_month": f"{train_events[-1]['month_date'][0]}-{train_events[-1]['month_date'][1]:02d}",
        "test_from_month": f"{test_events[0]['month_date'][0]}-{test_events[0]['month_date'][1]:02d}",
        "test_through_month": f"{test_events[-1]['month_date'][0]}-{test_events[-1]['month_date'][1]:02d}",
        "best_model": best_model_name,
        "evaluation": {
            "split": "chronological holdout by calendar month",
            "future_weather": "held-out rows use climate normals from training period only",
            "selected_artifact_model": best_model_name,
            **results,
        },
        "target": f"sum of reported {disease.lower()} outbreak cases in observed district-months",
        "available_models": list(final_pipelines.keys()),
    }
    metrics_path = MODELS_DIR / f"epiclim_{disease_slug}_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    return metrics


def _serialize_pipeline(pipeline, model_name: str, disease: str, events: list[dict],
                        validation_results: dict, best_model: str,
                        monthly_means: dict[int, list[float]]) -> dict:
    """Serialize a trained pipeline to a JSON-friendly dict."""
    # Extract preprocessing parameters
    preprocessor = pipeline.named_steps["preprocessor"]
    num_transformer = preprocessor.transformers_[0][1]  # StandardScaler
    cat_transformer = preprocessor.transformers_[1][1]  # OneHotEncoder

    regressor = pipeline.named_steps["regressor"]

    # Serialize regressor weights based on type
    regressor_data = {}
    if isinstance(regressor, Ridge):
        regressor_data = {
            "type": "ridge",
            "coef": regressor.coef_.tolist(),
            "intercept": float(regressor.intercept_),
            "alpha": regressor.alpha,
        }
    elif isinstance(regressor, RandomForestRegressor):
        # For RF, we can't easily serialize trees - store enough info to identify
        regressor_data = {
            "type": "random_forest",
            "n_estimators": regressor.n_estimators,
            "max_depth": regressor.max_depth,
            "feature_importances": regressor.feature_importances_.tolist(),
        }
    elif isinstance(regressor, GradientBoostingRegressor):
        regressor_data = {
            "type": "gradient_boosting",
            "n_estimators": regressor.n_estimators,
            "max_depth": regressor.max_depth,
            "learning_rate": regressor.learning_rate,
            "feature_importances": regressor.feature_importances_.tolist(),
        }

    return {
        "model_type": model_name,
        "disease": disease,
        "feature_fields": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "trained_through": events[-1]["date"].isoformat(),
        "source_date_start": events[0]["date"].isoformat(),
        "data_file": "epiclim_final_data.csv",
        "selected_after_holdout": best_model,
        "scaler_mean": num_transformer.mean_.tolist(),
        "scaler_scale": num_transformer.scale_.tolist(),
        "encoder_categories": [cat.tolist() for cat in cat_transformer.categories_],
        "regressor": regressor_data,
        "monthly_climate_by_district": _climate_lookup(events),
        "district_locations": _district_locations(events),
        "seasonal_month_means": {str(month): sum(values) / len(values) for month, values in monthly_means.items()},
        "validation_metrics": {k: v for k, v in validation_results.items()},
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--diseases", nargs="*", default=TRAINABLE_DISEASES)
    parser.add_argument("--test-fraction", type=float, default=0.2)
    args = parser.parse_args()

    print("=" * 60)
    print("EpidemAI Multi-Disease Model Training")
    print("=" * 60)

    all_metrics = {}
    for disease in args.diseases:
        print(f"\n{'─' * 40}")
        print(f"Training: {disease}")
        print(f"{'─' * 40}")
        result = train_disease(args.data, disease, args.test_fraction)
        if result:
            all_metrics[disease] = result

    # Save summary
    summary_path = MODELS_DIR / "training_summary.json"
    summary = {
        "trained_diseases": list(all_metrics.keys()),
        "total_models": sum(len(m.get("available_models", [])) for m in all_metrics.values()),
        "diseases": {
            disease: {
                "best_model": m["best_model"],
                "best_mae": m["evaluation"][m["best_model"]]["mae_reported_cases"],
                "baseline_mae": m["evaluation"]["seasonal_month_mean_baseline"]["mae_reported_cases"],
                "improvement_pct": round(
                    (1 - m["evaluation"][m["best_model"]]["mae_reported_cases"] /
                     m["evaluation"]["seasonal_month_mean_baseline"]["mae_reported_cases"]) * 100, 1
                ) if m["evaluation"]["seasonal_month_mean_baseline"]["mae_reported_cases"] > 0 else 0,
                "models": m["available_models"],
                "district_count": m["district_count"],
                "data_rows": m["observed_district_month_rows"],
                "train_through": m["train_through_month"],
            }
            for disease, m in all_metrics.items()
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"\n{'=' * 60}")
    print("TRAINING SUMMARY")
    print(f"{'=' * 60}")
    for disease, info in summary["diseases"].items():
        print(f"\n  {disease}:")
        print(f"    Best model: {info['best_model']} (MAE: {info['best_mae']})")
        print(f"    Baseline MAE: {info['baseline_mae']}")
        print(f"    Improvement: {info['improvement_pct']}%")
        print(f"    Models trained: {', '.join(info['models'])}")
    print(f"\n  Total models: {summary['total_models']}")
    print(f"  Saved to: {MODELS_DIR}")


if __name__ == "__main__":
    main()
