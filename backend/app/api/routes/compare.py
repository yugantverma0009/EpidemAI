from fastapi import APIRouter, Query
from app.services.data_service import get_city_by_name

router = APIRouter()

@router.get("/compare")
def compare(cities: str = Query(..., description="Comma-separated city names")):
    names = [n.strip() for n in cities.split(",")]
    results = []
    for name in names:
        city = get_city_by_name(name)
        if city:
            results.append(city)
    return {"cities": results}
