"""
HealthNode — FastAPI Application Entry Point.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db.database import engine, get_db, SessionLocal
from app.db.models import Base, Patient, Department, Token, QueueEntry, SymptomLog, Doctor, Admin
from app.routers import patients, symptoms, tokens, queue, speech, doctors, admin
from app.ml.department_router import DEPARTMENT_DESCRIPTIONS
from app.ml.severity_classifier import get_severity_score
from app.queue.priority_queue import enqueue, calculate_priority, clear_all
from app.utils.token_generator import generate_token_code, calculate_appointment_window
from app.queue.redis_pubsub import publish_new_token

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HealthNode",
    description="Hospital Patient Intake & Triage System",
    version="1.0.0",
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(patients.router)
app.include_router(symptoms.router)
app.include_router(tokens.router)
app.include_router(queue.router)
app.include_router(speech.router)
app.include_router(doctors.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"service": "HealthNode", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/demo")
def seed_demo_data():
    """
    Seeds the database with sample departments, patients, queue entries,
    and tokens for testing and demo purposes.
    """
    db: Session = SessionLocal()
    try:
        clear_all()

        # Seed departments
        departments = {}
        for dept_name, info in DEPARTMENT_DESCRIPTIONS.items():
            existing = db.query(Department).filter(Department.name == dept_name).first()
            if not existing:
                dept = Department(
                    name=dept_name,
                    name_translations={},
                    floor=info["floor"],
                    room=info["room"],
                    icon=info["icon"],
                    current_queue_depth=0,
                    avg_wait_mins=15,
                )
                db.add(dept)
                db.commit()
                db.refresh(dept)
                departments[dept_name] = dept
            else:
                departments[dept_name] = existing

        # Seed sample patients
        sample_patients = [
            {"name": "Priya Sharma", "phone": "98765-43210", "language": "en"},
            {"name": "Rahul Kumar", "phone": "87654-32109", "language": "hi"},
            {"name": "Ananya Das", "phone": "76543-21098", "language": "bn"},
            {"name": "Suresh Reddy", "phone": "65432-10987", "language": "te"},
            {"name": "Meera Nair", "phone": "54321-09876", "language": "en"},
            {"name": "Vikram Singh", "phone": "43210-98765", "language": "hi"},
            {"name": "Lakshmi Iyer", "phone": "32109-87654", "language": "ta"},
        ]

        created_patients = []
        for sp in sample_patients:
            p = Patient(name=sp["name"], phone=sp["phone"], language=sp["language"])
            db.add(p)
            db.commit()
            db.refresh(p)
            created_patients.append(p)

        # Assign patients to departments with different severities
        assignments = [
            (0, "Cardiology", "HIGH", ["chest pain", "shortness of breath"]),
            (1, "Neurology", "MEDIUM", ["headache", "dizziness"]),
            (2, "General Medicine", "LOW", ["fever", "cough"]),
            (3, "Orthopedics", "MEDIUM", ["joint pain", "back pain"]),
            (4, "Cardiology", "RED", ["chest pain", "breathing difficulty"]),
            (5, "ENT", "LOW", ["sore throat"]),
            (6, "Ophthalmology", "LOW", ["eye pain", "blurred vision"]),
        ]

        created_tokens = []
        for idx, dept_name, severity, syms in assignments:
            patient = created_patients[idx]
            dept = departments[dept_name]

            # Create symptom log
            log = SymptomLog(
                patient_id=patient.id,
                raw_text=" and ".join(syms),
                extracted_symptoms=syms,
                language=patient.language,
                confidence=0.9,
            )
            db.add(log)
            db.commit()

            # Generate token
            token_code = generate_token_code(dept_name)
            severity_score = get_severity_score(severity)
            is_priority = severity == "RED"
            priority = calculate_priority(severity_score)

            token = Token(
                token_code=token_code,
                patient_id=patient.id,
                department_id=dept.id,
                severity=severity,
                queue_number=idx + 1,
                appointment_window="10:00 AM - 10:20 AM",
                floor_room=f"Floor {dept.floor}, Room {dept.room}",
                is_priority=is_priority,
                is_emergency_bypass=is_priority,
                status="WAITING",
            )
            db.add(token)
            db.commit()
            db.refresh(token)
            created_tokens.append(token)

            # Add to priority queue
            position = enqueue(dept_name, token_code, priority, patient.id)

            # Queue entry in DB
            qe = QueueEntry(
                token_id=token.id,
                department_id=dept.id,
                priority_score=priority,
                position=position,
            )
            db.add(qe)
            db.commit()

            publish_new_token(dept_name, token_code, position, severity)

        # Seed sample doctors
        import hashlib
        sample_doctors = [
            {"doctor_id": "DOC001", "name": "Dr. Anil Mehta", "department": "Cardiology", "specialization": "Interventional Cardiology", "phone": "99887-76655", "email": "anil.mehta@healthnode.in"},
            {"doctor_id": "DOC002", "name": "Dr. Sunita Roy", "department": "Neurology", "specialization": "Clinical Neurophysiology", "phone": "99776-65544", "email": "sunita.roy@healthnode.in"},
            {"doctor_id": "DOC003", "name": "Dr. Rajesh Iyer", "department": "General Medicine", "specialization": "Internal Medicine", "phone": "99665-54433", "email": "rajesh.iyer@healthnode.in"},
            {"doctor_id": "DOC004", "name": "Dr. Kavitha Nair", "department": "Orthopedics", "specialization": "Joint Replacement", "phone": "99554-43322", "email": "kavitha.nair@healthnode.in"},
            {"doctor_id": "DOC005", "name": "Dr. Arjun Patel", "department": "ENT", "specialization": "Otology", "phone": "99443-32211", "email": "arjun.patel@healthnode.in"},
            {"doctor_id": "DOC006", "name": "Dr. Deepa Sharma", "department": "Ophthalmology", "specialization": "Retinal Surgery", "phone": "99332-21100", "email": "deepa.sharma@healthnode.in"},
        ]
        for sd in sample_doctors:
            existing = db.query(Doctor).filter(Doctor.doctor_id == sd["doctor_id"]).first()
            if not existing:
                doc = Doctor(**sd)
                db.add(doc)
        db.commit()

        # Seed default admin (username: admin, password: admin123)
        existing_admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not existing_admin:
            adm = Admin(
                username="admin",
                password_hash=hashlib.sha256("admin123".encode()).hexdigest(),
                name="System Administrator",
                role="super_admin"
            )
            db.add(adm)
            db.commit()

        return {
            "message": "Demo data seeded successfully",
            "patients_created": len(created_patients),
            "tokens_created": len(created_tokens),
            "departments": list(departments.keys()),
            "doctors_seeded": len(sample_doctors),
            "admin_credentials": {"username": "admin", "password": "admin123"}
        }
    finally:
        db.close()
