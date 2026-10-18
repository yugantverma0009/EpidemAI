from fastapi import APIRouter
from app.services.data_service import get_news
from app.services.tinyfish_service import get_collected_news

router = APIRouter()

@router.get("/news")
def get_news_items():
    live_items = get_collected_news()
    known_urls = {item.get("url") for item in live_items}
    return live_items + [item for item in get_news() if item.get("url") not in known_urls]
