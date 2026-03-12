from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib

from ..db.database import get_db
from ..db.models import Admin, Doctor
from ..db.schemas import (
    AdminLoginRequest, AdminLoginResponse,
    DoctorCreate, DoctorUpdate, DoctorResponse
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(req: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == req.username).first()
    if not admin or admin.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AdminLoginResponse(success=True, name=admin.name, role=admin.role)


@router.get("/doctors", response_model=list[DoctorResponse])
def list_doctors(db: Session = Depends(get_db)):
    return db.query(Doctor).order_by(Doctor.created_at.desc()).all()


@router.post("/doctors", response_model=DoctorResponse)
def add_doctor(req: DoctorCreate, db: Session = Depends(get_db)):
    existing = db.query(Doctor).filter(Doctor.doctor_id == req.doctor_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Doctor ID already exists")
    doctor = Doctor(
        doctor_id=req.doctor_id,
        name=req.name,
        department=req.department,
        specialization=req.specialization,
        phone=req.phone,
        email=req.email
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, req: DoctorUpdate, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"message": "Doctor removed"}


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db)):
    total_doctors = db.query(Doctor).count()
    active_doctors = db.query(Doctor).filter(Doctor.is_active == True).count()
    departments = db.query(Doctor.department).distinct().count()
    return {
        "total_doctors": total_doctors,
        "active_doctors": active_doctors,
        "departments": departments
    }
