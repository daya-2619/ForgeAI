import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ForgeAI Venture OS"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/forgeai")
    
    # Redis & Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    # JWT Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "7b6f63be1d29388df0a7b5d9338048259f9392b6a9dbd4b295f7cfa90f19c9db")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours
    
    # LLM API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "mock-openai-key")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "mock-gemini-key")
    CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "mock-claude-key")
    
    # Ollama Local LLM Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3:latest")
    
    # Vector DB
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    
    # Notifications
    EXPO_ACCESS_TOKEN: str = os.getenv("EXPO_ACCESS_TOKEN", "mock-expo-token")

    class Config:
        case_sensitive = True

settings = Settings()
