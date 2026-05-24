"""
Data access layer — retrieves city and disease data from seed data.
"""
from app.data.seed_data import cities, alerts, ai_insights, news_items, trend_data, top_risk_regions

def get_all_cities():
    return cities

def get_city_by_name(name: str):
    for c in cities:
        if c["name"].lower() == name.lower():
            return c
    return None

def get_all_alerts():
    return alerts

def get_insights():
    return ai_insights

def get_news():
    return news_items

def get_trends():
    return trend_data

def get_top_risk_regions():
    return top_risk_regions
