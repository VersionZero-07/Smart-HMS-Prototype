"""
Training script for the severity classifier.
Generates synthetic medical data and trains a RandomForestClassifier.
Run: python -m app.ml.train_severity
"""
import os
import random
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "severity_model.pkl")

# 20 symptom features + count + intensity
VOCAB = [
    "headache", "chest pain", "fever", "stomach pain", "joint pain",
    "breathing difficulty", "dizziness", "eye pain", "sore throat",
    "back pain", "fatigue", "nausea", "vomiting", "numbness",
    "seizure", "unconscious", "severe bleeding", "cough",
    "swelling", "rash"
]

# Severity profiles: which symptoms and how many for each class
PROFILES = {
    0: {  # LOW
        "common": [0, 2, 7, 8, 9, 10, 17, 19],  # headache, fever, eye, throat, back, fatigue, cough, rash
        "min_symptoms": 1, "max_symptoms": 2, "intensity_range": (0.05, 0.25),
    },
    1: {  # MEDIUM
        "common": [2, 6, 10, 11, 12, 17, 18],  # fever, dizziness, fatigue, nausea, vomiting, cough, swelling
        "min_symptoms": 2, "max_symptoms": 4, "intensity_range": (0.2, 0.5),
    },
    2: {  # HIGH
        "common": [1, 5, 6, 13, 18, 3, 12],  # chest pain, breathing, dizziness, numbness, swelling, stomach, vomiting
        "min_symptoms": 2, "max_symptoms": 5, "intensity_range": (0.4, 0.75),
    },
    3: {  # RED
        "common": [1, 5, 14, 15, 16],  # chest pain, breathing, seizure, unconscious, severe bleeding
        "min_symptoms": 2, "max_symptoms": 4, "intensity_range": (0.7, 1.0),
    },
}


def generate_sample(severity_class: int) -> np.ndarray:
    """Generate a single synthetic training sample for a given severity class."""
    profile = PROFILES[severity_class]
    features = np.zeros(len(VOCAB) + 2, dtype=np.float32)

    num_symptoms = random.randint(profile["min_symptoms"], profile["max_symptoms"])
    chosen_indices = random.sample(profile["common"], min(num_symptoms, len(profile["common"])))

    # Occasionally add random symptoms for noise
    if random.random() < 0.3:
        extra = random.choice(range(len(VOCAB)))
        if extra not in chosen_indices:
            chosen_indices.append(extra)

    for idx in chosen_indices:
        features[idx] = 1.0

    features[-2] = min(len(chosen_indices) / 5.0, 1.0)  # normalized count
    features[-1] = random.uniform(*profile["intensity_range"])  # intensity

    return features


def generate_dataset(samples_per_class: int = 500):
    """Generate synthetic training dataset."""
    X = []
    y = []
    for severity_class in range(4):
        for _ in range(samples_per_class):
            sample = generate_sample(severity_class)
            X.append(sample)
            y.append(severity_class)
    return np.array(X), np.array(y)


def train_model():
    """Train and save the severity classifier."""
    print("Generating synthetic training data...")
    X, y = generate_dataset(samples_per_class=1000)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    labels = ["LOW", "MEDIUM", "HIGH", "RED"]
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=labels))

    accuracy = clf.score(X_test, y_test)
    print(f"Accuracy: {accuracy:.4f}")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    return clf


if __name__ == "__main__":
    train_model()
