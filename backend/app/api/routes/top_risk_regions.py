from fastapi import APIRouter
from app.services.data_service import get_top_risk_regions

router = APIRouter()


@router.get("/top-risk-regions")
def top_risk_regions():
    return get_top_risk_regions()
