from fastapi import APIRouter
from app.services.data_service import get_all_alerts

router = APIRouter()

@router.get("/alerts")
def alerts():
    return get_all_alerts()
