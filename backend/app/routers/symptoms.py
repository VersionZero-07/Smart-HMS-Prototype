"""
Symptoms analysis and follow-up router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, SymptomLog
from app.db.schemas import (
    SymptomAnalyzeRequest, SymptomAnalyzeResponse,
    FollowUpRequest, FollowUpResponse,
)
from app.ml.nlp_engine import extract_symptoms
from app.ml.department_router import route_to_department, get_followup_questions
from app.ml.severity_classifier import classify_severity

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.post("/analyze", response_model=SymptomAnalyzeResponse)
def analyze_symptoms(data: SymptomAnalyzeRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Extract symptoms via NLP
    extracted = extract_symptoms(data.symptom_text, data.symptom_chips)

    # Route to department
    department, confidence = route_to_department(data.symptom_text, extracted)

    # Classify severity
    severity = classify_severity(extracted)

    # Determine if follow-up needed
    needs_followup = confidence < 0.85
    followup_questions = get_followup_questions(department) if needs_followup else []

    # Log symptoms
    log = SymptomLog(
        patient_id=data.patient_id,
        raw_text=data.symptom_text,
        extracted_symptoms=extracted,
        language=data.language,
        confidence=confidence,
    )
    db.add(log)
    db.commit()

    return SymptomAnalyzeResponse(
        extracted_symptoms=extracted,
        department=department,
        confidence=confidence,
        severity=severity,
        needs_followup=needs_followup,
        followup_questions=followup_questions,
        language=patient.language,
    )


@router.post("/followup", response_model=FollowUpResponse)
def followup(data: FollowUpRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Combine all answer texts for re-analysis
    combined_text = " ".join(a["answer"] for a in data.answers if a.get("answer"))

    # Get previous symptoms from latest log
    latest_log = (
        db.query(SymptomLog)
        .filter(SymptomLog.patient_id == data.patient_id)
        .order_by(SymptomLog.created_at.desc())
        .first()
    )

    previous_symptoms = latest_log.extracted_symptoms if latest_log else []
    previous_text = latest_log.raw_text or "" if latest_log else ""

    full_text = previous_text + " " + combined_text
    extracted = extract_symptoms(full_text, [])
    all_symptoms = list(set(previous_symptoms + extracted))

    department, confidence = route_to_department(full_text, all_symptoms)
    severity = classify_severity(all_symptoms)

    # Update symptom log
    log = SymptomLog(
        patient_id=data.patient_id,
        raw_text=full_text,
        extracted_symptoms=all_symptoms,
        language=patient.language,
        confidence=confidence,
    )
    db.add(log)
    db.commit()

    return FollowUpResponse(
        department=department,
        confidence=confidence,
        severity=severity,
        language=patient.language,
    )
