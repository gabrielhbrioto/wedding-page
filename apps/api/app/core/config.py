from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str
    APP_ENV: str
    APP_PORT: int
    DATABASE_URL: str
    FRONTEND_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_DURATION: int = 60
    REFRESH_TOKEN_DURATION_DAYS: int = 30
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]
