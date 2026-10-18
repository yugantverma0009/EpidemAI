from fastapi import APIRouter, HTTPException, Query
from app.services.epiclim_service import (
    get_available_diseases, get_districts, get_model_forecast,
    get_model_comparison, whatif_simulation,
)

router = APIRouter()


@router.get("/epiclim/diseases")
def epiclim_diseases():
    """List all diseases with trained models."""
    return get_available_diseases()


@router.get("/epiclim/forecast")
def epiclim_forecast(
    state: str = Query(..., min_length=1),
    district: str = Query(..., min_length=1),
    horizon: int = Query(6, ge=1, le=12),
    model: str = Query("ridge_regression"),
    disease: str = Query("Dengue"),
):
    result = get_model_forecast(state, district, horizon, model, disease)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Model unavailable or district not present in training data for {disease}"
        )
    return result


@router.get("/epiclim/districts")
def epiclim_districts(disease: str = Query("Dengue")):
    return get_districts(disease)


@router.get("/epiclim/compare-models")
def epiclim_compare_models(disease: str = Query("Dengue")):
    """Compare all trained models for a disease."""
    result = get_model_comparison(disease)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No trained models found for {disease}")
    return result


@router.get("/epiclim/whatif")
def epiclim_whatif(
    disease: str = Query("Dengue"),
    state: str = Query(..., min_length=1),
    district: str = Query(..., min_length=1),
    temperature: float = Query(28.0, ge=-20, le=65),
    precipitation: float = Query(100.0, ge=0, le=2000),
    lai: float = Query(1.0, ge=0, le=20),
    model: str = Query("ridge_regression"),
    horizon: int = Query(6, ge=1, le=24),
):
    """Run a what-if simulation with modified environmental parameters."""
    result = whatif_simulation(disease, state, district, temperature, precipitation, lai, model, horizon)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Cannot run simulation for {disease} in {district}, {state}")
    return result

