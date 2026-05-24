import os

class Settings:
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:8080")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
