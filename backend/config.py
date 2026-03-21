from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    tinyfish_api_key: str = ""
    elevenlabs_api_key: str = ""
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    exa_api_key: str = ""
    openrouter_api_key: str = ""
    database_url: str = "sqlite:///./mediscrape.db"

    class Config:
        env_file = ".env"

settings = Settings()
