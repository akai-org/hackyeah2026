from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfiguracja aplikacji. Wartości można nadpisać w pliku .env lub zmiennymi środowiskowymi."""

    # extra="ignore": .env jest wspólny dla modułów, nieznane klucze (np. OPENROUTER_*) nie mogą wywalać startu.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "find_inv_server"
    # Adresy frontendu (Next.js z ../find_inv), które mogą wołać API z przeglądarki.
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ---------- Zasobnik wiedzy (obszary, zasoby, potrzeby, admin) ----------
    # Osobna, synchroniczna baza SQLModel. Własna nazwa zmiennej, żeby nie zderzyć się
    # z DATABASE_URL (sqlite+aiosqlite) z rdzenia aplikacji.
    zasobnik_database_url: str = "sqlite:///./zasobnik.db"
    # Token do endpointów /api/admin/* (nagłówek X-Admin-Token). ZMIEŃ w .env!
    admin_token: str = "change-me"
    # Czy przy starcie wgrać dane przykładowe, gdy baza jest pusta.
    seed_demo_data: bool = True


settings = Settings()
