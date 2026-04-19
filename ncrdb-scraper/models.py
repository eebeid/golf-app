import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    facility_name = Column(String)
    city = Column(String)
    state = Column(String)
    source = Column(String) # e.g., 'ncrdb', 'state_va'
    source_url = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tees = relationship("Tee", back_populates="course", cascade="all, delete-orphan")

class Tee(Base):
    __tablename__ = 'tees'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id'), nullable=False)
    tee_name = Column(String, nullable=False)
    gender = Column(String(1)) # M / F
    par = Column(Integer)
    yardage = Column(Integer)
    course_rating = Column(Float)
    slope_rating = Column(Integer)
    effective_date = Column(DateTime)

    course = relationship("Course", back_populates="tees")

class ScrapeLog(Base):
    __tablename__ = 'scrape_log'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_name = Column(String, nullable=False)
    status = Column(String, nullable=False) # 'success', 'fail', 'fallback'
    source_used = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    error_message = Column(Text)
