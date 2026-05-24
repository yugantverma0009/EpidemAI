"""
Anomaly detection using z-score statistical deviation analysis.
"""
import numpy as np

def detect_anomalies(values: list, threshold: float = 2.0) -> list:
    if len(values) < 3:
        return []
    arr = np.array(values, dtype=float)
    mean = np.mean(arr)
    std = np.std(arr)
    if std == 0:
        return []
    z_scores = (arr - mean) / std
    return [
        {"index": int(i), "value": float(v), "z_score": round(float(z), 2), "is_anomaly": abs(float(z)) > threshold}
        for i, (v, z) in enumerate(zip(arr, z_scores))
        if abs(float(z)) > threshold
    ]

def deviation_report(baseline: int, current: int) -> dict:
    if baseline == 0:
        return {"deviation_pct": 0, "severity": "normal"}
    pct = round(((current - baseline) / baseline) * 100)
    severity = "critical" if pct >= 40 else "warning" if pct >= 25 else "watch" if pct >= 10 else "normal"
    return {"deviation_pct": pct, "severity": severity}
