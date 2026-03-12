"""
Department Router — Sentence Transformer-based semantic matching.
Maps symptom text to the most appropriate hospital department using cosine similarity.
"""
import numpy as np
from typing import Tuple, List, Dict, Optional

_model = None
_dept_embeddings: Optional[Dict[str, np.ndarray]] = None

DEPARTMENT_DESCRIPTIONS: Dict[str, Dict] = {
    "Cardiology": {
        "description": "chest pain, heart palpitations, shortness of breath, chest tightness, heart attack, irregular heartbeat, high blood pressure, cardiac arrest",
        "icon": "❤️",
        "floor": "2",
        "room": "201",
    },
    "Neurology": {
        "description": "headache, dizziness, seizure, numbness, tingling, migraine, vertigo, fainting, lightheadedness, unconscious, stroke, paralysis",
        "icon": "🧠",
        "floor": "3",
        "room": "301",
    },
    "General Medicine": {
        "description": "fever, cold, flu, fatigue, tiredness, weakness, nausea, vomiting, body ache, weight loss, loss of appetite, dehydration, chills, cough, rash",
        "icon": "🩺",
        "floor": "1",
        "room": "102",
    },
    "Orthopedics": {
        "description": "joint pain, bone pain, fracture, back pain, lower back pain, knee pain, hip pain, ankle pain, wrist pain, swelling, sprain",
        "icon": "🦴",
        "floor": "2",
        "room": "205",
    },
    "ENT": {
        "description": "sore throat, throat pain, ear pain, hearing loss, nasal congestion, runny nose, difficulty swallowing, tonsillitis, sinusitis",
        "icon": "🗣️",
        "floor": "1",
        "room": "108",
    },
    "Ophthalmology": {
        "description": "eye pain, blurred vision, eye redness, itching eyes, vision loss, dry eyes, watery eyes",
        "icon": "👁️",
        "floor": "3",
        "room": "310",
    },
}

FOLLOWUP_QUESTIONS_MAP: Dict[str, List[str]] = {
    "Cardiology": [
        "Do you feel chest pressure or tightness when walking or exercising?",
        "Have you noticed any irregular heartbeat or racing heart recently?",
        "Do you have a history of high blood pressure or heart conditions?",
    ],
    "Neurology": [
        "How long have you been experiencing headaches or dizziness?",
        "Do you feel numbness or tingling in any part of your body?",
        "Have you ever had a seizure or lost consciousness?",
    ],
    "General Medicine": [
        "How many days have you had these symptoms?",
        "Have you been in contact with anyone who was sick recently?",
        "Do you have any chronic conditions or take regular medication?",
    ],
    "Orthopedics": [
        "Did the pain start after an injury or fall?",
        "Does the pain get worse with movement?",
        "Is there any visible swelling or bruising in the affected area?",
    ],
    "ENT": [
        "Do you have difficulty hearing or ringing in your ears?",
        "Is your throat pain accompanied by difficulty swallowing?",
        "How long have you had nasal congestion or sinus pressure?",
    ],
    "Ophthalmology": [
        "Has your vision become blurry recently?",
        "Do you experience pain when looking at bright lights?",
        "Have you noticed any discharge or redness in your eyes?",
    ],
}


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _model = "mock"
    return _model


def _get_dept_embeddings():
    global _dept_embeddings
    if _dept_embeddings is None:
        model = _get_model()
        _dept_embeddings = {}
        if model == "mock":
            for dept in DEPARTMENT_DESCRIPTIONS:
                _dept_embeddings[dept] = np.random.rand(384).astype(np.float32)
        else:
            for dept, info in DEPARTMENT_DESCRIPTIONS.items():
                _dept_embeddings[dept] = model.encode(info["description"])
    return _dept_embeddings


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)


def route_to_department(symptom_text: str, extracted_symptoms: List[str]) -> Tuple[str, float]:
    """
    Encode the patient's symptom text and compare against department descriptions.
    Returns (department_name, confidence_score).
    """
    combined_text = symptom_text
    if extracted_symptoms:
        combined_text += " " + " ".join(extracted_symptoms)

    if not combined_text.strip():
        return "General Medicine", 0.5

    model = _get_model()
    dept_embeddings = _get_dept_embeddings()

    if model == "mock":
        # Mock mode: use keyword matching for deterministic results
        return _keyword_route(combined_text, extracted_symptoms)

    query_embedding = model.encode(combined_text)

    scores = {}
    for dept, dept_emb in dept_embeddings.items():
        scores[dept] = cosine_similarity(query_embedding, dept_emb)

    best_dept = max(scores, key=scores.get)
    confidence = scores[best_dept]

    return best_dept, round(confidence, 4)


def _keyword_route(text: str, symptoms: List[str]) -> Tuple[str, float]:
    """Keyword-based fallback routing for mock mode or when model isn't available."""
    text_lower = text.lower()
    all_terms = text_lower + " " + " ".join(s.lower() for s in symptoms)

    keyword_map = {
        "Cardiology": ["chest pain", "heart", "palpitation", "chest tightness", "cardiac"],
        "Neurology": ["headache", "dizziness", "seizure", "numbness", "migraine", "vertigo", "fainting", "unconscious"],
        "Orthopedics": ["joint pain", "bone", "fracture", "back pain", "knee", "hip", "ankle", "wrist", "sprain"],
        "ENT": ["sore throat", "throat", "ear pain", "hearing", "nasal", "congestion", "tonsil"],
        "Ophthalmology": ["eye", "vision", "blurred", "redness"],
        "General Medicine": ["fever", "cold", "flu", "fatigue", "nausea", "vomiting", "cough", "weakness", "tiredness"],
    }

    scores = {}
    for dept, keywords in keyword_map.items():
        score = sum(1 for kw in keywords if kw in all_terms)
        scores[dept] = score

    max_score = max(scores.values())
    if max_score == 0:
        return "General Medicine", 0.5

    best_dept = max(scores, key=scores.get)
    confidence = min(0.5 + (max_score * 0.15), 0.98)
    return best_dept, round(confidence, 4)


def get_followup_questions(department: str) -> List[str]:
    """Return follow-up questions for the given department."""
    return FOLLOWUP_QUESTIONS_MAP.get(department, FOLLOWUP_QUESTIONS_MAP["General Medicine"])


def get_department_info(department: str) -> Dict:
    """Get department metadata (icon, floor, room)."""
    return DEPARTMENT_DESCRIPTIONS.get(department, {
        "description": "",
        "icon": "🩺",
        "floor": "1",
        "room": "102",
    })
