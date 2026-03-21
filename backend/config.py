from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    tinyfish_api_key: str = ""
    falai_api_key: str = ""
    exa_api_key: str = ""
    openai_api_key: str = ""
    qwen_api_key: str = ""
    jigsawstack_api_key: str = ""
    elevenlabs_api_key: str = ""
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"

settings = Settings()
