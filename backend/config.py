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
    insights_model: str = "qwen/qwen-2.5-72b-instruct"
    brightdata_proxy_url: str = ""
    # OpenRouter model selection (configurable without code changes)
    openrouter_ocr_model: str = "openai/gpt-4o"
    openrouter_normalization_model: str = "qwen/qwen-2.5-72b-instruct"
    openrouter_fallback_model: str = "anthropic/claude-sonnet-4-20250514"
    supermemory_api_key: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    twilio_to_number: str = ""
    cors_origins: str = "http://localhost:3005,http://localhost:3000,http://localhost:3001,http://localhost:3333"
    database_url: str = "sqlite:///./megladon_md.db"

    class Config:
        env_file = _env_file

settings = Settings()
