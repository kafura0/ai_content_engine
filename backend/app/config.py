from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenRouter — optional: only needed if using direct generation fallback
    openrouter_api_key: str = ""
    openrouter_text_model: str = "anthropic/claude-3.5-haiku"
    openrouter_image_model: str = "google/gemini-2.5-flash-image"
    image_retry_count: int = 3

    database_url: str = "sqlite+aiosqlite:///./content_engine.db"

    # n8n orchestration
    n8n_webhook_url: str = ""

    # Comma-separated extra origins to allow in CORS (e.g. Vercel preview URLs)
    # Defaults always include localhost:3000 and the joat.studio production domain
    extra_allowed_origins: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
