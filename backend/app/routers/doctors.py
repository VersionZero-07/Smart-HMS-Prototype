from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime, timedelta
import math

from ..db.database import get_db
from ..db.models import Doctor, Token, QueueEntry, Patient, SymptomLog, Department
from ..db.schemas import (
    DoctorLoginRequest, DoctorResponse, DoctorQueuePatient,
    DoctorStatsResponse, CompletePatientRequest
)

router = APIRouter(prefix="/api/doctor", tags=["doctor"])


@router.post("/login", response_model=DoctorResponse)
def doctor_login(req: DoctorLoginRequest, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(
        Doctor.doctor_id == req.doctor_id,
        Doctor.name == req.name,
        Doctor.department == req.department
    ).first()
    if not doctor:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not doctor.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return doctor


@router.get("/queue/{department}", response_model=list[DoctorQueuePatient])
def get_doctor_queue(department: str, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.name == department).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    entries = (
        db.query(QueueEntry, Token, Patient)
        .join(Token, QueueEntry.token_id == Token.id)
        .join(Patient, Token.patient_id == Patient.id)
        .filter(QueueEntry.department_id == dept.id, QueueEntry.called_at.is_(None))
        .order_by(QueueEntry.priority_score.desc(), QueueEntry.entered_at.asc())
        .all()
    )

    result = []
    for idx, (qe, token, patient) in enumerate(entries, 1):
        symptom_log = db.query(SymptomLog).filter(
            SymptomLog.patient_id == patient.id
        ).order_by(SymptomLog.created_at.desc()).first()

        symptoms = symptom_log.extracted_symptoms if symptom_log else []
        wait = int((datetime.utcnow() - qe.entered_at.replace(tzinfo=None)).total_seconds() / 60)

        result.append(DoctorQueuePatient(
            token_id=token.token_id,
            patient_name=patient.name,
            patient_phone=patient.phone,
            severity=token.severity,
            symptoms=symptoms,
            department=department,
            position=idx,
            wait_mins=max(0, wait),
            registered_at=token.created_at.strftime("%I:%M %p"),
            status="waiting"
        ))

    return result


@router.get("/stats/{department}", response_model=DoctorStatsResponse)
def get_doctor_stats(department: str, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.name == department).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    total_in_queue = db.query(QueueEntry).filter(
        QueueEntry.department_id == dept.id,
        QueueEntry.called_at.is_(None)
    ).count()

    consulted_today = db.query(QueueEntry).filter(
        QueueEntry.department_id == dept.id,
        QueueEntry.called_at.isnot(None),
        sql_func.date(QueueEntry.called_at) == datetime.utcnow().date()
    ).count()

    critical_count = (
        db.query(QueueEntry)
        .join(Token, QueueEntry.token_id == Token.id)
        .filter(
            QueueEntry.department_id == dept.id,
            QueueEntry.called_at.is_(None),
            Token.severity.in_(["RED", "ORANGE"])
        )
        .count()
    )

    entries = db.query(QueueEntry).filter(
        QueueEntry.department_id == dept.id,
        QueueEntry.called_at.is_(None)
    ).all()

    if entries:
        total_wait = sum(
            (datetime.utcnow() - e.entered_at.replace(tzinfo=None)).total_seconds() / 60
            for e in entries
        )
        avg_wait = int(total_wait / len(entries))
    else:
        avg_wait = 0

    return DoctorStatsResponse(
        total_in_queue=total_in_queue,
        consulted_today=consulted_today,
        critical_count=critical_count,
        avg_wait_mins=avg_wait
    )


@router.post("/complete/{token_id}")
def complete_patient(token_id: str, req: CompletePatientRequest, db: Session = Depends(get_db)):
    token = db.query(Token).filter(Token.token_id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    qe = db.query(QueueEntry).filter(QueueEntry.token_id == token.id).first()
    if not qe:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    qe.called_at = datetime.utcnow()
    db.commit()

    remaining = (
        db.query(QueueEntry)
        .filter(QueueEntry.department_id == qe.department_id, QueueEntry.called_at.is_(None))
        .count()
    )

    return {"message": "Patient marked as completed", "remaining_in_queue": remaining}


@router.get("/patient/{token_id}")
def get_patient_detail(token_id: str, db: Session = Depends(get_db)):
    token = db.query(Token).filter(Token.token_id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    patient = db.query(Patient).filter(Patient.id == token.patient_id).first()
    symptom_log = db.query(SymptomLog).filter(
        SymptomLog.patient_id == patient.id
    ).order_by(SymptomLog.created_at.desc()).first()

    qe = db.query(QueueEntry).filter(QueueEntry.token_id == token.id).first()
    wait = 0
    if qe and qe.called_at is None:
        wait = int((datetime.utcnow() - qe.entered_at.replace(tzinfo=None)).total_seconds() / 60)

    return {
        "token_id": token.token_id,
        "patient_name": patient.name,
        "patient_phone": patient.phone,
        "language": patient.language,
        "severity": token.severity,
        "department": token.department,
        "queue_number": token.queue_number,
        "registered_at": token.created_at.strftime("%I:%M %p"),
        "wait_mins": max(0, wait),
        "symptoms": symptom_log.extracted_symptoms if symptom_log else [],
        "raw_text": symptom_log.raw_text if symptom_log else "",
        "followup_answers": symptom_log.followup_answers if symptom_log else [],
        "status": "completed" if (qe and qe.called_at) else "waiting"
    }
