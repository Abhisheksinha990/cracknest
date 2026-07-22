from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)
    role = Column(String, default="USER")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    interviews = relationship("InterviewResult", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")


class InterviewResult(Base):
    __tablename__ = "interview_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    company = Column(String)
    role = Column(String)
    rating = Column(Float)
    feedback = Column(Text)
    improvements = Column(Text) # Stored as JSON string
    weakest_area = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="interviews")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String)
    details = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activities")
