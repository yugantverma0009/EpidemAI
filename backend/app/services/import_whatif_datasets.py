"""Download the What-If page's requested Kaggle datasets into local raw data.

Run from backend/ after installing requirements-data.txt:
    python -m app.services.import_whatif_datasets

KaggleHub downloads public dataset files into its cache; this script copies
them into app/data/datasets/kaggle_raw so a later audit/training script can
read stable project-relative paths. It does not merge the datasets.
"""
from __future__ import annotations

import csv
import hashlib
import json
import shutil
from datetime import date
from pathlib import Path

import kagglehub

ROOT = Path(__file__).resolve().parents[2]
DESTINATION = ROOT / "app" / "data" / "datasets" / "kaggle_raw"
DATASETS = {
    "district-level-disease-and-weather-dataset-ap": {
        "handle": "swayamchaurasia/district-level-disease-and-weather-dataset-ap",
        "files": ["ML_training_dataset_comprehensive.csv"],
    },
    "daily-climate-time-series-data": {
        "handle": "sumanthvrao/daily-climate-time-series-data",
        "files": ["DailyDelhiClimateTrain.csv", "DailyDelhiClimateTest.csv"],
    },
}


def _inspect_csv(path: Path) -> dict:
    with path.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        columns = reader.fieldnames or []
        rows = list(reader)
    return {
        "file": path.name,
        "rows": len(rows),
        "column_count": len(columns),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "relevant_columns": [
            column for column in columns
            if any(term in column.casefold() for term in (
                "dengue", "weather", "temperature", "humidity", "precipitation", "wind", "pressure",
            ))
        ],
    }


def import_datasets() -> dict:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    manifest = {
        "imported_on": date.today().isoformat(),
        "datasets": {},
        "compatibility": {
            "can_train_one_delhi_21_day_case_model": False,
            "reason": (
                "The Andhra Pradesh file has monthly district health/weather rows for 2018-2019. "
                "The Delhi file has daily weather only for 2013-2017 and contains no disease-case target. "
                "The files do not overlap in place or time, so they cannot be joined into supervised Delhi training rows."
            ),
        },
    }

    for folder, config in DATASETS.items():
        target_dir = DESTINATION / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        if all((target_dir / name).is_file() for name in config["files"]):
            source_dir = target_dir
        else:
            source_dir = Path(kagglehub.dataset_download(config["handle"]))
        file_records = []
        for name in config["files"]:
            source_file = source_dir / name
            if not source_file.is_file():
                raise FileNotFoundError(f"Expected {name} in KaggleHub download {source_dir}")
            target_file = target_dir / name
            if source_file.resolve() != target_file.resolve():
                shutil.copy2(source_file, target_file)
            file_records.append(_inspect_csv(target_file))
        manifest["datasets"][config["handle"]] = {
            "local_path": str(target_dir.relative_to(ROOT)),
            "kagglehub_cache_path": str(source_dir),
            "files": file_records,
        }

    manifest_path = DESTINATION / "import_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return {"manifest_path": str(manifest_path), "datasets": manifest["datasets"], "compatibility": manifest["compatibility"]}


if __name__ == "__main__":
    print(json.dumps(import_datasets(), indent=2))
