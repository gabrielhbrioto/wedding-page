from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

class Base(DeclarativeBase):
    pass

# Verifique se este bloco abaixo existe no seu arquivo!
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()