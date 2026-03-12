"""
Severity Classifier — scikit-learn RandomForestClassifier.
Predicts severity: LOW(0), MEDIUM(1), HIGH(2), RED(3).
"""
import os
import numpy as np
import joblib
from typing import List

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "severity_model.pkl")

_classifier = None

# RED trigger symptom combinations
RED_TRIGGERS = [
    {"chest pain", "breathing difficulty"},
    {"chest pain", "shortness of breath"},
    {"unconscious"},
    {"severe bleeding"},
    {"seizure", "unconscious"},
    {"cardiac arrest"},
    {"heart attack"},
]

SEVERITY_LABELS = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "RED"}


def _get_classifier():
    global _classifier
    if _classifier is None:
        if os.path.exists(MODEL_PATH):
            _classifier = joblib.load(MODEL_PATH)
        else:
            _classifier = "rule_based"
    return _classifier


def _symptoms_to_features(symptoms: List[str]) -> np.ndarray:
    """
    Convert symptom list to a feature vector.
    Uses a fixed vocabulary of 20 symptom categories.
    """
    vocab = [
        "headache", "chest pain", "fever", "stomach pain", "joint pain",
        "breathing difficulty", "dizziness", "eye pain", "sore throat",
        "back pain", "fatigue", "nausea", "vomiting", "numbness",
        "seizure", "unconscious", "severe bleeding", "cough",
        "swelling", "rash"
    ]
    features = np.zeros(len(vocab) + 2, dtype=np.float32)  # +2 for count and intensity

    symptom_lower = [s.lower() for s in symptoms]
    for i, v in enumerate(vocab):
        if v in symptom_lower or any(v in s for s in symptom_lower):
            features[i] = 1.0

    features[-2] = min(len(symptoms) / 5.0, 1.0)  # normalized symptom count
    features[-1] = _estimate_intensity(symptom_lower)  # intensity score

    return features.reshape(1, -1)


def _estimate_intensity(symptoms: List[str]) -> float:
    """Estimate intensity based on symptom keywords."""
    high_intensity = {"chest pain", "breathing difficulty", "shortness of breath",
                      "unconscious", "severe bleeding", "seizure", "cardiac arrest"}
    medium_intensity = {"fever", "dizziness", "vomiting", "numbness", "swelling"}

    score = 0.0
    for s in symptoms:
        if s in high_intensity:
            score += 0.4
        elif s in medium_intensity:
            score += 0.2
        else:
            score += 0.1
    return min(score, 1.0)


def _check_red_triggers(symptoms: List[str]) -> bool:
    """Check if symptom combination matches RED triggers."""
    symptom_set = {s.lower() for s in symptoms}
    for trigger in RED_TRIGGERS:
        if trigger.issubset(symptom_set):
            return True
    return False


def classify_severity(symptoms: List[str]) -> str:
    """
    Classify severity based on extracted symptoms.
    Returns: LOW, MEDIUM, HIGH, or RED
    """
    if not symptoms:
        return "LOW"

    # Check RED triggers first (override)
    if _check_red_triggers(symptoms):
        return "RED"

    classifier = _get_classifier()

    if classifier == "rule_based":
        return _rule_based_severity(symptoms)

    features = _symptoms_to_features(symptoms)
    prediction = classifier.predict(features)[0]
    severity = SEVERITY_LABELS.get(prediction, "LOW")

    # Override: RED triggers always win
    if _check_red_triggers(symptoms):
        severity = "RED"

    return severity


def _rule_based_severity(symptoms: List[str]) -> str:
    """Fallback rule-based classification when model isn't available."""
    symptom_set = {s.lower() for s in symptoms}

    high_symptoms = {"chest pain", "seizure", "numbness", "severe bleeding"}
    medium_symptoms = {"fever", "dizziness", "vomiting", "breathing difficulty", "swelling"}

    high_count = len(symptom_set & high_symptoms)
    medium_count = len(symptom_set & medium_symptoms)

    if high_count >= 2:
        return "RED"
    elif high_count >= 1:
        return "HIGH"
    elif medium_count >= 2:
        return "HIGH"
    elif medium_count >= 1:
        return "MEDIUM"
    elif len(symptoms) >= 4:
        return "MEDIUM"
    else:
        return "LOW"


def get_severity_score(severity: str) -> int:
    """Get numerical score for priority queue ordering."""
    return {"LOW": 1, "MEDIUM": 3, "HIGH": 7, "RED": 100}.get(severity, 1)
