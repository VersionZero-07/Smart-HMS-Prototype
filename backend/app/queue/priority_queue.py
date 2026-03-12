"""
Priority Queue — heapq-based per-department queue management.
Priority tuple: (-priority_score, timestamp, patient_id)
RED patients: priority_score = 100 → always front.
"""
import heapq
import time
from typing import Dict, List, Tuple, Optional
from threading import Lock

# Thread-safe queue storage: department_name → min-heap
_queues: Dict[str, List[Tuple]] = {}
_lock = Lock()


def _ensure_queue(department: str):
    if department not in _queues:
        _queues[department] = []


def calculate_priority(severity_score: int, wait_minutes: float = 0, age: int = 30) -> float:
    """
    Priority = (severity_score * 10) + (wait_penalty) - (age_bonus)
    Higher priority score → closer to front.
    We negate in the heap so that highest priority comes first.
    """
    wait_penalty = min(wait_minutes * 0.5, 20)  # cap wait bonus at 20
    age_bonus = max((age - 30) * 0.1, 0) if age > 60 else 0
    return (severity_score * 10) + wait_penalty + age_bonus


def enqueue(department: str, token_id: str, priority_score: float, patient_id: int) -> int:
    """
    Add patient to department queue. Returns queue position (1-indexed).
    """
    with _lock:
        _ensure_queue(department)
        entry = (-priority_score, time.time(), patient_id, token_id)
        heapq.heappush(_queues[department], entry)
        # Calculate position
        position = _get_position(department, token_id)
        return position


def dequeue(department: str) -> Optional[str]:
    """Remove and return the highest-priority token_id from queue."""
    with _lock:
        _ensure_queue(department)
        if _queues[department]:
            entry = heapq.heappop(_queues[department])
            return entry[3]  # token_id
        return None


def _get_position(department: str, token_id: str) -> int:
    """Get 1-indexed position of token in queue. Must be called with lock held."""
    if department not in _queues:
        return 0
    sorted_queue = sorted(_queues[department])
    for i, entry in enumerate(sorted_queue):
        if entry[3] == token_id:
            return i + 1
    return 0


def get_position(department: str, token_id: str) -> int:
    """Thread-safe position lookup."""
    with _lock:
        return _get_position(department, token_id)


def get_queue_depth(department: str) -> int:
    """Return current queue depth for a department."""
    with _lock:
        _ensure_queue(department)
        return len(_queues[department])


def get_queue_status(department: str) -> List[Dict]:
    """Return ordered list of all entries in a department queue."""
    with _lock:
        _ensure_queue(department)
        sorted_queue = sorted(_queues[department])
        result = []
        for i, entry in enumerate(sorted_queue):
            neg_score, timestamp, patient_id, token_id = entry
            result.append({
                "token_id": token_id,
                "position": i + 1,
                "priority_score": -neg_score,
                "patient_id": patient_id,
                "entered_at": timestamp,
            })
        return result


def get_estimated_wait(department: str, position: int, avg_wait_per_patient: int = 15) -> int:
    """Estimate wait time in minutes based on position."""
    return max((position - 1) * avg_wait_per_patient, 0)


def clear_queue(department: str):
    """Clear a department queue (for testing/demo)."""
    with _lock:
        _queues[department] = []


def clear_all():
    """Clear all queues."""
    with _lock:
        _queues.clear()
