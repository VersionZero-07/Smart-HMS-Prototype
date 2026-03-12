from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Patient Schemas ──

class PatientCreate(BaseModel):
    name: str
    phone: str
    language: str = "en"
    aadhaar_hash: Optional[str] = None


class PatientResponse(BaseModel):
    patient_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Symptom Schemas ──

class SymptomAnalyzeRequest(BaseModel):
    patient_id: int
    symptom_text: str = ""
    symptom_chips: List[str] = []
    language: str = "en"


class SymptomAnalyzeResponse(BaseModel):
    extracted_symptoms: List[str]
    department: str
    confidence: float
    severity: str
    needs_followup: bool
    followup_questions: List[str] = []
    language: str = "en"


class FollowUpRequest(BaseModel):
    patient_id: int
    answers: List[Dict[str, str]]


class FollowUpResponse(BaseModel):
    department: str
    confidence: float
    severity: str
    language: str = "en"


# ── Token Schemas ──

class TokenGenerateRequest(BaseModel):
    patient_id: int
    department: str
    severity: str


class TokenResponse(BaseModel):
    token_id: str
    department: str
    department_translated: str
    queue_number: int
    queue_total: int
    appointment_window: str
    registered_at: str
    floor_room: str
    estimated_wait_mins: int
    is_priority: bool
    severity: str
    patient_name: str = ""
    patient_phone: str = ""
    symptoms: List[str] = []
    language: str = "en"


# ── Queue Schemas ──

class QueueItem(BaseModel):
    token_id: str
    position: int
    severity: str
    wait: int


class QueueStatusResponse(BaseModel):
    queue: List[QueueItem]
    total: int


class QueuePositionResponse(BaseModel):
    position: int
    total: int
    estimated_wait_mins: int
    department: str


# ── Speech Schema ──

class TranscriptResponse(BaseModel):
    transcript: str
    confidence: float


# ── Doctor Schemas ──

class DoctorLoginRequest(BaseModel):
    doctor_id: str
    name: str
    department: str


class DoctorCreate(BaseModel):
    doctor_id: str
    name: str
    department: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class DoctorResponse(BaseModel):
    id: int
    doctor_id: str
    name: str
    department: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    consulted_today: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorQueuePatient(BaseModel):
    token_id: str
    patient_name: str
    patient_phone: str
    age: Optional[int] = None
    severity: str
    symptoms: List[str] = []
    department: str
    position: int
    wait_mins: int
    registered_at: str
    status: str = "waiting"


class DoctorStatsResponse(BaseModel):
    total_in_queue: int
    consulted_today: int
    critical_count: int
    avg_wait_mins: int


class CompletePatientRequest(BaseModel):
    notes: Optional[str] = None


# ── Admin Schemas ──

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    name: str
    role: str
    token: str = "mock-admin-token"
