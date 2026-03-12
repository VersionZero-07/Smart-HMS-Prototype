"""
Token generation router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.db.models import Patient, Token, Department, QueueEntry, SymptomLog
from app.db.schemas import TokenGenerateRequest, TokenResponse
from app.ml.severity_classifier import get_severity_score
from app.ml.department_router import get_department_info
from app.queue.priority_queue import (
    enqueue, calculate_priority, get_queue_depth, get_estimated_wait
)
from app.queue.redis_pubsub import publish_new_token
from app.utils.token_generator import generate_token_code, calculate_appointment_window
from app.utils.translations import translate_department

router = APIRouter(prefix="/api/token", tags=["tokens"])


@router.post("/generate", response_model=TokenResponse)
def generate_token(data: TokenGenerateRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get or create department
    dept = db.query(Department).filter(Department.name == data.department).first()
    if not dept:
        dept_info = get_department_info(data.department)
        dept = Department(
            name=data.department,
            name_translations={},
            floor=dept_info.get("floor", "1"),
            room=dept_info.get("room", "102"),
            icon=dept_info.get("icon", "🩺"),
        )
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # Calculate priority
    severity_score = get_severity_score(data.severity)
    is_priority = data.severity == "RED"
    is_emergency = data.severity == "RED"
    priority = calculate_priority(severity_score)

    # Generate token
    token_code = generate_token_code(data.department)
    queue_depth = get_queue_depth(data.department)
    queue_number = queue_depth + 1

    floor_room = f"Floor {dept.floor}, Room {dept.room}"

    # Create token record
    token = Token(
        token_code=token_code,
        patient_id=patient.id,
        department_id=dept.id,
        severity=data.severity,
        queue_number=queue_number,
        floor_room=floor_room,
        is_priority=is_priority,
        is_emergency_bypass=is_emergency,
        status="WAITING",
    )
    db.add(token)
    db.commit()
    db.refresh(token)

    # Enqueue
    position = enqueue(data.department, token_code, priority, patient.id)
    estimated_wait = get_estimated_wait(data.department, position, dept.avg_wait_mins)
    appointment_window = calculate_appointment_window(estimated_wait)

    # Update token with appointment window
    token.appointment_window = appointment_window
    db.commit()

    # Update department queue depth
    dept.current_queue_depth = get_queue_depth(data.department)
    db.commit()

    # Create queue entry in DB
    queue_entry = QueueEntry(
        token_id=token.id,
        department_id=dept.id,
        priority_score=priority,
        position=position,
    )
    db.add(queue_entry)
    db.commit()

    # Publish to Redis
    publish_new_token(data.department, token_code, position, data.severity)

    # Get symptoms for response
    latest_log = (
        db.query(SymptomLog)
        .filter(SymptomLog.patient_id == patient.id)
        .order_by(SymptomLog.created_at.desc())
        .first()
    )
    symptoms = latest_log.extracted_symptoms if latest_log else []

    return TokenResponse(
        token_id=token_code,
        department=data.department,
        department_translated=translate_department(data.department, patient.language),
        queue_number=position,
        queue_total=get_queue_depth(data.department),
        appointment_window=appointment_window,
        registered_at=token.registered_at.strftime("%I:%M %p, %b %d %Y"),
        floor_room=floor_room,
        estimated_wait_mins=estimated_wait,
        is_priority=is_priority,
        severity=data.severity,
        patient_name=patient.name,
        patient_phone=patient.phone,
        symptoms=symptoms,
        language=patient.language,
    )
