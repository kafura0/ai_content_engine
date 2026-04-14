from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_text_model: str = "anthropic/claude-3.5-haiku"
    openrouter_image_model: str = "google/gemini-2.5-flash-image"
    database_url: str = "sqlite+aiosqlite:///./content_engine.db"
    image_retry_count: int = 3

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
