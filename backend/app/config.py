"""
Application configuration — reads from .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    db_user: str = ""
    db_password: str = ""
    db_host: str = ""
    db_port: int = 3306
    db_name: str = ""
    database_url: str = ""

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    frontend_origins: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_database_url(self) -> str:
        """Build the database URL from components if not explicitly set."""
        if self.database_url:
            return self.database_url
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
