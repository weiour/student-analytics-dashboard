import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from .db import Base

class VsokoProgram(Base):
    __tablename__ = "vsoko_programs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, unique=True)  # как в списке ОП

class VsokoQuestion(Base):
    __tablename__ = "vsoko_questions"
    id = Column(Integer, primary_key=True)  # 1..32
    text = Column(String, nullable=False)

class VsokoOption(Base):
    __tablename__ = "vsoko_options"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(Integer, ForeignKey("vsoko_questions.id"), nullable=False)
    label = Column(String, nullable=False)  # текст варианта ("1", "2", ..., "да", "нет" и т.д.)
    order_index = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("question_id", "label", name="uq_vsoko_option_question_label"),
    )

class VsokoDataset(Base):
    __tablename__ = "vsoko_datasets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id = Column(String, ForeignKey("vsoko_programs.id"), nullable=False)
    year = Column(Integer, nullable=False, default=2026)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("program_id", "year", name="uq_vsoko_dataset_program_year"),
    )

class VsokoAnswer(Base):
    __tablename__ = "vsoko_answers"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("vsoko_datasets.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("vsoko_questions.id"), nullable=False)
    option_id = Column(String, ForeignKey("vsoko_options.id"), nullable=False)
    count = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("dataset_id", "option_id", name="uq_vsoko_answer_dataset_option"),
    )