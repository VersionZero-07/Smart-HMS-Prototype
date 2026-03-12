from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    language = Column(String(10), nullable=False, default="en")
    aadhaar_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    symptom_logs = relationship("SymptomLog", back_populates="patient")
    tokens = relationship("Token", back_populates="patient")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    name_translations = Column(JSON, nullable=False, default=dict)
    floor = Column(String(10), nullable=False, default="1")
    room = Column(String(20), nullable=False, default="101")
    icon = Column(String(10), nullable=False, default="🩺")
    current_queue_depth = Column(Integer, nullable=False, default=0)
    avg_wait_mins = Column(Integer, nullable=False, default=15)

    tokens = relationship("Token", back_populates="department")
    queue_entries = relationship("QueueEntry", back_populates="department")


class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    raw_text = Column(Text, nullable=True)
    extracted_symptoms = Column(JSON, nullable=True)
    language = Column(String(10), nullable=False, default="en")
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="symptom_logs")


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_code = Column(String(10), nullable=False, unique=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    severity = Column(String(10), nullable=False, default="LOW")
    queue_number = Column(Integer, nullable=False)
    appointment_window = Column(String(50), nullable=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    floor_room = Column(String(50), nullable=True)
    is_priority = Column(Boolean, nullable=False, default=False)
    is_emergency_bypass = Column(Boolean, nullable=False, default=False)
    status = Column(String(20), nullable=False, default="WAITING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="tokens")
    department = relationship("Department", back_populates="tokens")
    queue_entry = relationship("QueueEntry", back_populates="token", uselist=False)


class QueueEntry(Base):
    __tablename__ = "queue"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    priority_score = Column(Float, nullable=False, default=0.0)
    position = Column(Integer, nullable=False)
    entered_at = Column(DateTime(timezone=True), server_default=func.now())
    called_at = Column(DateTime(timezone=True), nullable=True)

    token = relationship("Token", back_populates="queue_entry")
    department = relationship("Department", back_populates="queue_entries")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String(20), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    specialization = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    consulted_today = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
