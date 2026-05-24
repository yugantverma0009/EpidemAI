from fastapi import APIRouter
from app.services.data_service import get_trends

router = APIRouter()

@router.get("/trends")
def trends():
    return get_trends()
