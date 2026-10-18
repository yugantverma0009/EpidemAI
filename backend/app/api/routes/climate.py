from fastapi import APIRouter

from app.services.delhi_climate_service import get_delhi_climate_reference

router = APIRouter()


@router.get("/climate/delhi-reference")
def delhi_climate_reference():
    """Return historical Delhi weather context from locally imported CSV files."""
    return get_delhi_climate_reference()
