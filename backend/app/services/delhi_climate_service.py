"""Read-only summary of the locally imported Delhi daily climate dataset."""
from __future__ import annotations

import csv
from datetime import date
from pathlib import Path


DATA_DIR = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "datasets"
    / "kaggle_raw"
    / "daily-climate-time-series-data"
)
FILES = ("DailyDelhiClimateTrain.csv", "DailyDelhiClimateTest.csv")


def get_delhi_climate_reference() -> dict:
    """Summarize observed Delhi weather; it is not a weather forecast."""
    paths = [DATA_DIR / name for name in FILES]
    missing = [path.name for path in paths if not path.is_file()]
    if missing:
        return {
            "available": False,
            "city": "Delhi",
            "source": "Kaggle: Daily Climate Time Series Data",
            "missing_files": missing,
            "note": "Import the Delhi climate dataset locally to show historical context.",
        }

    # Test rows take precedence if a date occurs in both files.
    by_date: dict[date, dict[str, float]] = {}
    source_rows = 0
    for path in paths:
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                source_rows += 1
                day = date.fromisoformat(row["date"].strip())
                by_date[day] = {
                    "meantemp": float(row["meantemp"]),
                    "humidity": float(row["humidity"]),
                }

    if not by_date:
        return {
            "available": False,
            "city": "Delhi",
            "source": "Kaggle: Daily Climate Time Series Data",
            "note": "The imported Delhi climate files contain no observations.",
        }

    rows = list(by_date.values())
    count = len(rows)
    temperatures = [row["meantemp"] for row in rows]
    humidities = [row["humidity"] for row in rows]
    return {
        "available": True,
        "city": "Delhi",
        "source": "Kaggle: Daily Climate Time Series Data",
        "date_start": min(by_date).isoformat(),
        "date_end": max(by_date).isoformat(),
        "observation_days": count,
        "duplicate_rows_removed": source_rows - count,
        "daily_average": {
            "mean_temperature_c": round(sum(temperatures) / count, 1),
            "relative_humidity_pct": round(sum(humidities) / count, 1),
        },
        "observed_range": {
            "temperature_c": [round(min(temperatures), 1), round(max(temperatures), 1)],
            "relative_humidity_pct": [round(min(humidities), 1), round(max(humidities), 1)],
        },
        "note": (
            "Historical weather context only (2013–2017). This dataset has no disease case counts; "
            "it is not a weather forecast and is not used to generate the disease scenario curves."
        ),
    }
