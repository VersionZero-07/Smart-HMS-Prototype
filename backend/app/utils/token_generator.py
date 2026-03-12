"""
Smart Token Generator — generates unique tokens with department prefix.
Format: {DeptLetter}{Number}, e.g. A47, C12
"""
import random
from datetime import datetime, timedelta
from typing import Dict

# Department letter mapping
DEPT_PREFIX: Dict[str, str] = {
    "Cardiology": "C",
    "Neurology": "N",
    "General Medicine": "G",
    "Orthopedics": "O",
    "ENT": "E",
    "Ophthalmology": "P",
}

_token_counters: Dict[str, int] = {}


def generate_token_code(department: str) -> str:
    """Generate unique token code like A47, C12."""
    prefix = DEPT_PREFIX.get(department, "X")
    if department not in _token_counters:
        _token_counters[department] = random.randint(10, 50)
    _token_counters[department] += 1
    return f"{prefix}{_token_counters[department]}"


def calculate_appointment_window(estimated_wait_mins: int) -> str:
    """Calculate appointment window based on estimated wait."""
    now = datetime.now()
    start = now + timedelta(minutes=max(estimated_wait_mins - 5, 0))
    end = start + timedelta(minutes=20)
    return f"{start.strftime('%I:%M %p')} - {end.strftime('%I:%M %p')}"


def reset_counters():
    """Reset counters (for testing)."""
    _token_counters.clear()
