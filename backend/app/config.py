from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Nastavitve aplikacije, preberejo se iz okoljskih spremenljivk ali .env datoteke."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "BookShelf API"
    # Naslovi frontenda, ki lahko klicejo API (locene z vejico)
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
