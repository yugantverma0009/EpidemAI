"""Train an experimental LSTM on observed district-month dengue reports.

Run from backend/: python -m app.services.train_epiclim_lstm
The source is sparse; this is an evaluation experiment and will not replace the
production-demo ridge artifact unless it beats it on the same holdout rows.
"""
from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
from torch import nn

from app.services.train_epiclim_fallback import (
    DEFAULT_DATA, apply_training_climate_normals, fit_ridge, load_events, predict as ridge_predict,
)

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "app" / "data" / "models" / "epiclim_dengue_lstm.json"
METRICS_PATH = ROOT / "app" / "data" / "models" / "epiclim_dengue_lstm_metrics.json"
SEQ_LEN = 3
FEATURES_PER_STEP = 6  # log cases, month sin/cos, elapsed months, latitude, longitude
QUERY_FEATURES = 3  # target month sin/cos and elapsed months from latest report


class DistrictLSTM(nn.Module):
    def __init__(self, input_size: int = FEATURES_PER_STEP, hidden_size: int = 16):
        super().__init__()
        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, batch_first=True)
        self.head = nn.Sequential(nn.Linear(hidden_size + QUERY_FEATURES, 16), nn.Tanh(), nn.Linear(16, 1))

    def forward(self, sequence, query):
        _, (hidden, _) = self.lstm(sequence)
        return self.head(torch.cat([hidden[-1], query], dim=1)).squeeze(1)


def month_index(pair: tuple[int, int]) -> int:
    return pair[0] * 12 + pair[1]


def build_examples(events: list[dict]):
    groups = defaultdict(list)
    for row in events:
        groups[(row["state"], row["district"])].append(row)
    examples = []
    for (state, district), rows in groups.items():
        rows.sort(key=lambda row: row["month_date"])
        for target_idx in range(SEQ_LEN, len(rows)):
            history = rows[target_idx - SEQ_LEN:target_idx]
            target = rows[target_idx]
            sequence = []
            for index, row in enumerate(history):
                previous = history[index - 1] if index else None
                gap = max(1, month_index(row["month_date"]) - month_index(previous["month_date"])) if previous else 1
                m = int(row["month"])
                sequence.append([
                    math.log1p(row["cases"]), math.sin(2 * math.pi * m / 12), math.cos(2 * math.pi * m / 12),
                    float(gap), row["latitude"], row["longitude"],
                ])
            target_month = int(target["month"])
            target_gap = max(1, month_index(target["month_date"]) - month_index(history[-1]["month_date"]))
            query = [math.sin(2 * math.pi * target_month / 12), math.cos(2 * math.pi * target_month / 12), float(target_gap)]
            examples.append({
                "sequence": sequence, "query": query, "cases": target["cases"], "month": target_month,
                "month_date": target["month_date"], "state": state, "district": district,
                "target": target,
            })
    return sorted(examples, key=lambda row: (row["month_date"], row["state"], row["district"]))


def normalize(train_rows, rows):
    x = np.asarray([row["sequence"] for row in train_rows], dtype=np.float32)
    q = np.asarray([row["query"] for row in train_rows], dtype=np.float32)
    x_mean = x.reshape(-1, x.shape[-1]).mean(axis=0)
    x_std = x.reshape(-1, x.shape[-1]).std(axis=0)
    x_std[x_std < 1e-6] = 1.0
    q_mean = q.mean(axis=0)
    q_std = q.std(axis=0)
    q_std[q_std < 1e-6] = 1.0
    def transform(items):
        xi = (np.asarray([row["sequence"] for row in items], dtype=np.float32) - x_mean) / x_std
        qi = (np.asarray([row["query"] for row in items], dtype=np.float32) - q_mean) / q_std
        return xi, qi
    return transform, {"x_mean": x_mean.tolist(), "x_std": x_std.tolist(), "q_mean": q_mean.tolist(), "q_std": q_std.tolist()}


def score(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.maximum(0, np.asarray(predicted, dtype=float))
    return {"mae_reported_cases": float(np.mean(np.abs(actual - predicted))), "rmse_reported_cases": float(np.sqrt(np.mean((actual - predicted) ** 2)))}


def main():
    torch.manual_seed(41)
    np.random.seed(41)
    torch.set_num_threads(1)
    events = load_events(DEFAULT_DATA, "Dengue")
    examples = build_examples(events)
    month_dates = sorted({row["month_date"] for row in events})
    cutoff = month_dates[max(1, min(len(month_dates) - 1, int(len(month_dates) * 0.8)))]
    train_rows = [row for row in examples if row["month_date"] < cutoff]
    test_rows = [row for row in examples if row["month_date"] >= cutoff]
    if len(train_rows) < 50 or len(test_rows) < 10:
        raise ValueError(f"Sparse sequence data: only {len(train_rows)} train and {len(test_rows)} holdout windows")

    transform, scaler = normalize(train_rows, examples)
    x_train, q_train = transform(train_rows)
    x_test, q_test = transform(test_rows)
    y_train = np.log1p(np.asarray([row["cases"] for row in train_rows], dtype=np.float32))
    actual = np.asarray([row["cases"] for row in test_rows], dtype=np.float32)

    model = DistrictLSTM()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.008, weight_decay=0.01)
    loss_fn = nn.MSELoss()
    x_tensor = torch.from_numpy(x_train)
    q_tensor = torch.from_numpy(q_train)
    y_tensor = torch.from_numpy(y_train)
    model.train()
    for epoch in range(180):
        permutation = torch.randperm(len(train_rows))
        for start in range(0, len(train_rows), 32):
            batch = permutation[start:start + 32]
            optimizer.zero_grad()
            output = model(x_tensor[batch], q_tensor[batch])
            loss = loss_fn(output, y_tensor[batch])
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

    model.eval()
    with torch.no_grad():
        pred_log = model(torch.from_numpy(x_test), torch.from_numpy(q_test)).numpy()
    lstm_pred = np.maximum(0, np.expm1(pred_log))

    # Compare ridge and seasonal baseline on these exact same eligible holdout rows.
    ridge_train = [event for event in events if event["month_date"] < cutoff]
    ridge_model = fit_ridge(ridge_train)
    ridge_test_events = [row["target"] for row in test_rows]
    ridge_test_features = apply_training_climate_normals(ridge_train, ridge_test_events)
    ridge_pred = [ridge_predict(row, ridge_model) for row in ridge_test_features]
    month_values = defaultdict(list)
    for row in train_rows:
        month_values[row["month"]].append(row["cases"])
    overall = float(np.mean([row["cases"] for row in train_rows]))
    seasonal_pred = [float(np.mean(month_values[row["month"]])) if month_values[row["month"]] else overall for row in test_rows]

    metrics = {
        "model": "LSTM",
        "target": "sum of reported dengue outbreak cases in observed district-months after three previous observed district-months",
        "sequence_length": SEQ_LEN,
        "eligible_windows": len(examples),
        "train_windows": len(train_rows),
        "holdout_windows": len(test_rows),
        "train_through_month": f"{train_rows[-1]['month_date'][0]}-{train_rows[-1]['month_date'][1]:02d}",
        "holdout_from_month": f"{test_rows[0]['month_date'][0]}-{test_rows[0]['month_date'][1]:02d}",
        "holdout_through_month": f"{test_rows[-1]['month_date'][0]}-{test_rows[-1]['month_date'][1]:02d}",
        "holdout": {
            "lstm": score(actual, lstm_pred),
            "ridge_regression": score(actual, ridge_pred),
            "seasonal_month_mean": score(actual, seasonal_pred),
        },
        "limitations": [
            "Only districts with at least four observed district-month reports can contribute sequence windows.",
            "The source is irregular outbreak reporting, not a complete district-month panel.",
            "Evaluation predicts the next observed district-month record, not verified complete monthly incidence.",
            "Single chronological holdout is preliminary; dataset ends in June 2022.",
        ],
    }
    selected = min(metrics["holdout"], key=lambda key: metrics["holdout"][key]["mae_reported_cases"])
    metrics["best_on_holdout"] = selected
    artifact = {
        "model_type": "LSTM",
        "disease": "Dengue",
        "sequence_length": SEQ_LEN,
        "features_per_step": FEATURES_PER_STEP,
        "query_features": QUERY_FEATURES,
        "scaler": scaler,
        "state_dict": {key: value.detach().cpu().tolist() for key, value in model.state_dict().items()},
        "trained_through": str(events[-1]["date"]),
        "training_examples": len(examples),
        "holdout_metrics": metrics["holdout"],
        "best_on_holdout": selected,
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.write_text(json.dumps(artifact), encoding="utf-8")
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    print(f"\nSaved experimental LSTM: {MODEL_PATH}")
    print(f"Saved metrics: {METRICS_PATH}")
    print("Active API remains ridge unless LSTM is validated and explicitly selected.")


if __name__ == "__main__":
    main()
