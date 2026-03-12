"""
Patient registration router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib

from app.db.database import get_db
from app.db.models import Patient
from app.db.schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/api/patient", tags=["patients"])


@router.post("/register", response_model=PatientResponse)
def register_patient(data: PatientCreate, db: Session = Depends(get_db)):
    aadhaar_hash = None
    if data.aadhaar_hash:
        aadhaar_hash = hashlib.sha256(data.aadhaar_hash.encode()).hexdigest()

    patient = Patient(
        name=data.name,
        phone=data.phone,
        language=data.language,
        aadhaar_hash=aadhaar_hash,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PatientResponse(patient_id=patient.id, created_at=patient.created_at)
