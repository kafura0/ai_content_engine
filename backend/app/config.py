from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenRouter — optional: only needed if using direct generation fallback
    openrouter_api_key: str = ""
    openrouter_text_model: str = "google/gemini-2.5-flash-lite"
    openrouter_image_model: str = "google/gemini-2.5-flash-image"
    image_retry_count: int = 3

    database_url: str = "sqlite+aiosqlite:///./content_engine.db"

    # n8n orchestration
    n8n_webhook_url: str = ""

    # Supabase JWT secret (Settings → API → JWT Secret in Supabase dashboard)
    supabase_jwt_secret: str = ""

    # CORS — comma-separated list of allowed origins (frontend URLs)
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://frontend-theta-steel-79.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
