from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create the SQLAlchemy engine using your database URL from config
engine = create_engine(settings.database_url)

# Create a session local class for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for your ORM models to inherit from
Base = declarative_base()

# Dependency function to get DB sessions in FastAPI endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()