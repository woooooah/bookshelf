from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Nastavitve aplikacije, preberejo se iz okoljskih spremenljivk ali .env datoteke."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "BookShelf API"
    # Naslovi frontenda, ki lahko klicejo API (locene z vejico)
    cors_origins: str = "http://localhost:5173"
    # Povezava do PostgreSQL (Supabase), glej .env.example
    database_url: str
    # Kljuc Firebase service account (Project settings -> Service accounts), pot glede na backend/
    firebase_credentials: str = "firebase-service-account.json"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        # Supabase da URL oblike postgresql://..., SQLAlchemy pa potrebuje gonilnik (psycopg 3)
        url = self.database_url
        for prefix in ("postgresql://", "postgres://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url


settings = Settings()
