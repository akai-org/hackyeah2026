from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "find_inv_server"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-haiku-4-5-20251001"
    openrouter_embed_model: str = "openai/text-embedding-3-small"

    database_url: str = "sqlite+aiosqlite:///./findinv.db"
    chroma_path: str = "./chroma_db"


settings = Settings()
