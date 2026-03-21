import os
from pydantic_settings import BaseSettings

_env_file = os.path.join(os.path.dirname(__file__), "..", ".env")

class Settings(BaseSettings):
    tinyfish_api_key: str = ""
    elevenlabs_api_key: str = ""
    discord_webhook_url: str = ""
    exa_api_key: str = ""
    openrouter_api_key: str = ""
    openai_api_key: str = ""
    brightdata_proxy_url: str = ""
    # OpenRouter model selection (configurable without code changes)
    openrouter_ocr_model: str = "openai/gpt-4o"
    openrouter_normalization_model: str = "qwen/qwen-2.5-72b-instruct"
    openrouter_fallback_model: str = "anthropic/claude-sonnet-4-20250514"
    supermemory_api_key: str = ""
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    database_url: str = "sqlite:///./mediscrape.db"

    class Config:
        env_file = _env_file

settings = Settings()
