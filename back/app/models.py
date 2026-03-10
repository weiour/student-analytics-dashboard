import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from .db import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    title = Column(String, nullable=False)
    template = Column(String, nullable=False)

    context_mode = Column(String, nullable=False)  # "group" | "student"
    context_id = Column(String, nullable=False)    # "g1" | "s3"

    question = Column(Text, nullable=True)
    content_md = Column(Text, nullable=False)

    pinned = Column(Boolean, default=False, nullable=False)
    tags = Column(String, default="", nullable=False)  # храним "tag1,tag2"
