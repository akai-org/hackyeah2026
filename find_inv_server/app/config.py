from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # extra="ignore": .env jest wspólny dla modułów, nieznane klucze nie mogą wywalać startu.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "find_inv_server"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-haiku-4.5"
    openrouter_embed_model: str = "openai/text-embedding-3-small"

    database_url: str = "sqlite+aiosqlite:///./findinv.db"
    chroma_path: str = "./chroma_db"
    # Załączniki do fiszek pomysłów (POST /api/ideas/{id}/attachments).
    uploads_path: str = "./uploads"

    # ---------- Zasobnik wiedzy (app/zasobnik: obszary, zasoby, potrzeby) ----------
    # Osobna, synchroniczna baza SQLModel — własna zmienna, żeby nie zderzyć się z DATABASE_URL.
    zasobnik_database_url: str = "sqlite:///./zasobnik.db"
    # Token do /api/zasobnik/admin/* (nagłówek X-Admin-Token). ZMIEŃ w .env!
    admin_token: str = "change-me"
    # Czy przy starcie wgrać dane przykładowe Zasobnika, gdy jego baza jest pusta.
    seed_demo_data: bool = True


settings = Settings()
