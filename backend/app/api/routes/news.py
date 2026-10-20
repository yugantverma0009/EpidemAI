from fastapi import APIRouter
from app.services.data_service import get_news

router = APIRouter()

@router.get("/news")
def get_news_items():
    return get_news()
