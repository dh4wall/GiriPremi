"""
Database configuration module.
Handles MySQL connection using SQLAlchemy.
Credentials are loaded from .env via app.config.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

DATABASE_URL = settings.get_database_url()

engine = create_engine(
    DATABASE_URL,
    echo=True  # shows SQL queries in console (good for debugging)
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """
    Dependency to get DB session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()