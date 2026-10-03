from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfiguracja aplikacji. Wartości można nadpisać w pliku .env lub zmiennymi środowiskowymi."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "find_inv_server"
    # Adresy frontendu (Next.js z ../find_inv), które mogą wołać API z przeglądarki.
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()
