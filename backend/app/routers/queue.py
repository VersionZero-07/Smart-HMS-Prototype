"""
Queue status router.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Token, QueueEntry, Department
from app.db.schemas import QueueStatusResponse, QueuePositionResponse, QueueItem
from app.queue.priority_queue import get_queue_status, get_queue_depth, get_estimated_wait

router = APIRouter(prefix="/api/queue", tags=["queue"])


@router.get("/status/{department}", response_model=QueueStatusResponse)
def queue_status(department: str, db: Session = Depends(get_db)):
    entries = get_queue_status(department)
    dept = db.query(Department).filter(Department.name == department).first()
    avg_wait = dept.avg_wait_mins if dept else 15

    items = []
    for entry in entries:
        token = db.query(Token).filter(Token.token_code == entry["token_id"]).first()
        severity = token.severity if token else "LOW"
        wait = get_estimated_wait(department, entry["position"], avg_wait)
        items.append(QueueItem(
            token_id=entry["token_id"],
            position=entry["position"],
            severity=severity,
            wait=wait,
        ))

    return QueueStatusResponse(queue=items, total=len(items))


@router.get("/position/{token_id}", response_model=QueuePositionResponse)
def queue_position(token_id: str, db: Session = Depends(get_db)):
    token = db.query(Token).filter(Token.token_code == token_id).first()
    if not token:
        return QueuePositionResponse(position=0, total=0, estimated_wait_mins=0, department="Unknown")

    dept = db.query(Department).filter(Department.id == token.department_id).first()
    dept_name = dept.name if dept else "General Medicine"

    from app.queue.priority_queue import get_position
    position = get_position(dept_name, token_id)
    total = get_queue_depth(dept_name)
    avg_wait = dept.avg_wait_mins if dept else 15
    wait = get_estimated_wait(dept_name, position, avg_wait)

    return QueuePositionResponse(
        position=position,
        total=total,
        estimated_wait_mins=wait,
        department=dept_name,
    )
