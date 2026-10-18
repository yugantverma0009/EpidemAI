"""Dependency-free ridge regression trainer for EpiClim report counts.

Run from backend/: python -m app.services.train_epiclim_fallback
Uses only Python's standard library so a model can be generated offline.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA = ROOT / "app" / "data" / "datasets" / "epiclim_final_data.csv"
DEFAULT_MODEL = ROOT / "app" / "data" / "models" / "epiclim_dengue_ridge.json"
DEFAULT_METRICS = ROOT / "app" / "data" / "models" / "epiclim_dengue_ridge_metrics.json"
# These features are available when making a calendar-based forecast. Climate
# fields in the source are report-date observations and are excluded here.
NUMERIC_FIELDS = ("month_sin", "month_cos")


def load_events(path: Path, disease: str) -> list[dict]:
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
    # Aggregate distinct outbreak records into an observed district-month
    # target. Missing district-months remain missing; they are never made zero.
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


def solve_linear(matrix: list[list[float]], vector: list[float]) -> list[float]:
    """Gaussian elimination with partial pivoting."""
    n = len(vector)
    augmented = [list(matrix[i]) + [vector[i]] for i in range(n)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda row: abs(augmented[row][col]))
        if abs(augmented[pivot][col]) < 1e-12:
            continue
        augmented[col], augmented[pivot] = augmented[pivot], augmented[col]
        scale = augmented[col][col]
        augmented[col] = [value / scale for value in augmented[col]]
        for row in range(n):
            if row == col:
                continue
            factor = augmented[row][col]
            augmented[row] = [a - factor * b for a, b in zip(augmented[row], augmented[col])]
    return [augmented[i][-1] for i in range(n)]


def fit_encoder(events: list[dict], alpha: float) -> dict:
    means, scales = {}, {}
    for field in NUMERIC_FIELDS:
        values = [event[field] for event in events]
        means[field] = sum(values) / len(values)
        variance = sum((value - means[field]) ** 2 for value in values) / max(1, len(values))
        scales[field] = math.sqrt(variance) or 1.0
    states = sorted({event["state"] for event in events})
    districts = sorted({(event["state"], event["district"]) for event in events})
    columns = ["intercept"] + [f"num:{field}" for field in NUMERIC_FIELDS]
    columns += [f"state:{state}" for state in states]
    columns += [f"district:{state}|{district}" for state, district in districts]
    return {"means": means, "scales": scales, "states": states, "districts": districts, "columns": columns, "alpha": alpha}


def encode(event: dict, encoder: dict) -> list[float]:
    values = [1.0]
    values += [(event[field] - encoder["means"][field]) / encoder["scales"][field] for field in NUMERIC_FIELDS]
    values += [1.0 if event["state"] == state else 0.0 for state in encoder["states"]]
    values += [1.0 if (event["state"], event["district"]) == pair else 0.0 for pair in encoder["districts"]]
    return values


def fit_ridge(events: list[dict], alpha: float = 10.0) -> dict:
    encoder = fit_encoder(events, alpha)
    vectors = [encode(event, encoder) for event in events]
    targets = [math.log1p(event["cases"]) for event in events]
    width = len(encoder["columns"])
    xtx = [[0.0] * width for _ in range(width)]
    xty = [0.0] * width
    for row, target in zip(vectors, targets):
        for i, value in enumerate(row):
            xty[i] += value * target
            for j, other in enumerate(row):
                xtx[i][j] += value * other
    for i in range(1, width):
        xtx[i][i] += alpha
    return {"encoder": encoder, "coefficients": solve_linear(xtx, xty)}


def predict(event: dict, model: dict) -> float:
    score = sum(a * b for a, b in zip(model["coefficients"], encode(event, model["encoder"])))
    return max(0.0, math.expm1(min(score, 30)))


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


def mae(actual: list[float], predicted: list[float]) -> float:
    return sum(abs(a - p) for a, p in zip(actual, predicted)) / len(actual)


def rmse(actual: list[float], predicted: list[float]) -> float:
    return math.sqrt(sum((a - p) ** 2 for a, p in zip(actual, predicted)) / len(actual))


def _seasonal_predictions(train_events: list[dict], target_events: list[dict]) -> list[float]:
    """Same-district seasonal means, with district then global fallback."""
    district_month: dict[tuple[str, str, int], list[float]] = {}
    district_all: dict[tuple[str, str], list[float]] = {}
    month_all: dict[int, list[float]] = {}
    overall = [event["cases"] for event in train_events]
    for event in train_events:
        district_month.setdefault((event["state"], event["district"], int(event["month"])), []).append(event["cases"])
        district_all.setdefault((event["state"], event["district"]), []).append(event["cases"])
        month_all.setdefault(int(event["month"]), []).append(event["cases"])
    result = []
    for event in target_events:
        values = (district_month.get((event["state"], event["district"], int(event["month"])))
                  or district_all.get((event["state"], event["district"]))
                  or month_all.get(int(event["month"])) or overall)
        result.append(sum(values) / len(values))
    return result


def _score(actual: list[float], predicted: list[float]) -> dict:
    return {"mae_reported_cases": mae(actual, predicted), "rmse_reported_cases": rmse(actual, predicted)}


def _aggregate_fold_scores(folds: list[dict], key: str) -> dict:
    total = sum(fold["test_rows"] for fold in folds)
    mae_value = sum(fold[key]["mae_reported_cases"] * fold["test_rows"] for fold in folds) / total
    mse_value = sum(fold[key]["rmse_reported_cases"] ** 2 * fold["test_rows"] for fold in folds) / total
    return {"mae_reported_cases": mae_value, "rmse_reported_cases": math.sqrt(mse_value)}


def _rolling_origin_splits(months: list[tuple[int, int]], min_train_months: int = 60,
                           test_window_months: int = 12) -> list[tuple[tuple[int, int], tuple[int, int]]]:
    """Non-overlapping 12-month test windows after an initial 5-year train."""
    starts = list(range(min_train_months, len(months), test_window_months))
    return [(months[start - 1], months[min(start + test_window_months - 1, len(months) - 1)])
            for start in starts if start < len(months)]


def train(data_path: Path, model_path: Path, metrics_path: Path, disease: str = "Dengue", test_fraction: float = 0.2) -> dict:
    if not 0.05 <= test_fraction <= 0.5:
        raise ValueError("test_fraction must be between 0.05 and 0.5")
    events = load_events(data_path, disease)
    months = sorted({event["month_date"] for event in events})
    if len(events) < 30 or len(months) < 5:
        raise ValueError("Not enough source reports/months for training and chronological evaluation")
    split_index = max(1, min(len(months) - 1, int(len(months) * (1 - test_fraction))))
    cutoff = months[split_index]
    train_events = [event for event in events if event["month_date"] < cutoff]
    test_events = [event for event in events if event["month_date"] >= cutoff]

    # Rolling-origin evaluation for stable model comparison. Each test window
    # uses only earlier observations; test windows do not supply training data.
    folds = []
    for train_through, test_through in _rolling_origin_splits(months):
        fold_train = [event for event in events if event["month_date"] <= train_through]
        fold_test = [event for event in events if train_through < event["month_date"] <= test_through]
        if len(fold_train) < 30 or not fold_test:
            continue
        fold_model = fit_ridge(fold_train)
        fold_actual = [event["cases"] for event in fold_test]
        fold_preds = [predict(event, fold_model) for event in fold_test]
        fold_baseline = _seasonal_predictions(fold_train, fold_test)
        folds.append({
            "train_through_month": f"{train_through[0]}-{train_through[1]:02d}",
            "test_from_month": f"{fold_test[0]['month_date'][0]}-{fold_test[0]['month_date'][1]:02d}",
            "test_through_month": f"{test_through[0]}-{test_through[1]:02d}",
            "train_rows": len(fold_train), "test_rows": len(fold_test),
            "ridge_regression": _score(fold_actual, fold_preds),
            "seasonal_district_mean_baseline": _score(fold_actual, fold_baseline),
        })
    if not folds:
        raise ValueError("Not enough chronological coverage for rolling-origin evaluation")

    # A final chronological holdout is retained as a clearly reported summary.
    validation_model = fit_ridge(train_events)
    actual = [event["cases"] for event in test_events]
    model_preds = [predict(event, validation_model) for event in test_events]
    baseline_preds = _seasonal_predictions(train_events, test_events)
    ridge_scores = _score(actual, model_preds)
    baseline_scores = _score(actual, baseline_preds)
    selection = "ridge_regression" if ridge_scores["mae_reported_cases"] < baseline_scores["mae_reported_cases"] else "seasonal_month_mean"
    final_model = fit_ridge(events)
    all_month_means: dict[int, list[float]] = {}
    for event in events:
        all_month_means.setdefault(int(event["month"]), []).append(event["cases"])
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
        "evaluation": {
            "split": "expanding-window rolling-origin evaluation with 12-month test windows, plus final chronological holdout",
            "feature_availability": "calendar month, state, and district are known at forecast time; report-date climate observations are excluded from this model",
            "ridge_regression": ridge_scores,
            "seasonal_district_mean_baseline": baseline_scores,
            "rolling_origin_folds": folds,
            "rolling_origin_weighted": {
                "ridge_regression": _aggregate_fold_scores(folds, "ridge_regression"),
                "seasonal_district_mean_baseline": _aggregate_fold_scores(folds, "seasonal_district_mean_baseline"),
            },
            "selected_artifact_model": selection,
        },
        "target": "sum of reported dengue outbreak cases in observed district-months",
        "limitations": [
            "The source is irregular outbreak-event reporting, not a complete district-time panel.",
            "The model estimates reported cases in observed district-months, not all infections.",
            "No-report periods are not assumed to have zero cases.",
            "Holdout performance is not prospective or independent validation.",
            "Experimental use only; not an operational public-health alert.",
        ],
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model_type": "ridge_regression",
        "disease": disease,
        "feature_fields": list(NUMERIC_FIELDS) + ["state", "district"],
        "trained_through": events[-1]["date"].isoformat(),
        "source_date_start": events[0]["date"].isoformat(),
        "data_file": data_path.name,
        "selected_after_holdout": selection,
        "pipeline": final_model,
        "monthly_climate_by_district": {},
        "district_locations": _district_locations(events),
        "seasonal_month_means": {str(month): sum(values) / len(values) for month, values in all_month_means.items()},
        "validation_metrics": metrics["evaluation"],
    }
    model_path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def _climate_lookup(events: list[dict]) -> dict:
    buckets: dict[tuple[str, str, int], list[dict]] = {}
    for event in events:
        buckets.setdefault((event["state"], event["district"], int(event["month"])), []).append(event)
    return {f"{state}|{district}|{month}": {
        field: sum(row[field] for row in rows) / len(rows)
        for field in ("latitude", "longitude", "preci", "lai", "temp")
    } for (state, district, month), rows in buckets.items()}


def _district_locations(events: list[dict]) -> list[dict]:
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--metrics", type=Path, default=DEFAULT_METRICS)
    parser.add_argument("--disease", default="Dengue")
    parser.add_argument("--test-fraction", type=float, default=0.2)
    args = parser.parse_args()
    result = train(args.data, args.model, args.metrics, args.disease, args.test_fraction)
    print(json.dumps(result, indent=2))
    print(f"\nSaved model: {args.model}")
    print(f"Saved metrics: {args.metrics}")


if __name__ == "__main__":
    main()
