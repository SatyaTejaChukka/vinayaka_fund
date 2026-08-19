import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vinayaka Chavithi Fund Transparency System"
    SECRET_KEY: str = "vinayaka-chavithi-super-secret-key-2026-god-ganesha-blessings"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    DATABASE_URL: str = "sqlite:///./vinayaka.db"
    
    ADMIN_EMAIL: str = "admin@vinayaka.org"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_NAME: str = "Committee Admin"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
