import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from app.config import settings

logger = logging.getLogger(__name__)

# Connect arguments
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

# Build self-healing engine
try:
    # Test creating the engine
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        connect_args=connect_args
    )
    # Perform a test connection check
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to primary database.")
except (OperationalError, Exception) as e:
    logger.warning(
        f"Primary database connection failed ({e}). Falling back to local SQLite 'forgeai.db'."
    )
    fallback_url = "sqlite:///forgeai.db"
    engine = create_engine(
        fallback_url,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
