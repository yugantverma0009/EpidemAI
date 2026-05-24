from fastapi import APIRouter
from app.services.data_service import get_all_cities

router = APIRouter()

@router.get("/map-data")
def map_data():
    return get_all_cities()
