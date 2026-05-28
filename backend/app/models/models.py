# MIT License • Copyright (c) 2026 Pathfinder

from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_name = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    career_stage = Column(String, nullable=True)  # student, early, mid, senior
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)   # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="messages")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), unique=True, nullable=False)
    education_level = Column(String, nullable=True)
    field_of_study = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    current_role = Column(String, nullable=True)
    skills = Column(JSON, nullable=True)        # list of skills
    interests = Column(JSON, nullable=True)     # list of interests
    goals = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    session = relationship("Session", back_populates="profile")
