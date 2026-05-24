from fastapi import APIRouter, HTTPException
from app.services.data_service import get_city_by_name

router = APIRouter()

@router.get("/city/{name}")
def city_detail(name: str):
    city = get_city_by_name(name)
    if not city:
        raise HTTPException(status_code=404, detail=f"City '{name}' not found")
    return city
