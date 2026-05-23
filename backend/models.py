from sqlalchemy import Column, String, JSON, DateTime
from sqlalchemy.sql import func
from .database import Base

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    questions = Column(JSON, nullable=False)
    translations = Column(JSON, nullable=True)
    createdAt = Column(String, nullable=False)

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True, index=True)
    surveyId = Column(String, index=True, nullable=False)
    answers = Column(JSON, nullable=False)
    submittedAt = Column(String, nullable=False)
