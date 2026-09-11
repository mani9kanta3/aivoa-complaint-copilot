import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.config import DATABASE_URL


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()


def now():
    return datetime.now(timezone.utc)


class Complaint(Base):
    __tablename__ = 'complaints'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String(30), nullable=False, default='Draft')
    version = Column(Integer, nullable=False, default=1)
    data = Column(JSON, nullable=False, default=dict)
    risk = Column(JSON, nullable=False, default=dict)
    messages = Column(JSON, nullable=False, default=list)
    history = Column(JSON, nullable=False, default=list)
    missing_fields = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now, nullable=False)


def serialize(row):
    return {
        'id': row.id,
        'reference': 'CC-' + row.id[:8].upper(),
        'status': row.status,
        'version': row.version,
        'data': row.data,
        'risk': row.risk,
        'messages': row.messages,
        'history': row.history,
        'missing_fields': row.missing_fields,
        'created_at': row.created_at.isoformat(),
        'updated_at': row.updated_at.isoformat(),
    }
