"""
NLP Engine — spaCy-based symptom extraction with custom EntityRuler.
"""
import spacy
from spacy.language import Language
from typing import List, Dict

# Canonical symptom list
SYMPTOM_PATTERNS = [
    {"label": "SYMPTOM", "pattern": "headache"},
    {"label": "SYMPTOM", "pattern": "head pain"},
    {"label": "SYMPTOM", "pattern": "migraine"},
    {"label": "SYMPTOM", "pattern": "chest pain"},
    {"label": "SYMPTOM", "pattern": "chest tightness"},
    {"label": "SYMPTOM", "pattern": "heart palpitations"},
    {"label": "SYMPTOM", "pattern": "palpitations"},
    {"label": "SYMPTOM", "pattern": "fever"},
    {"label": "SYMPTOM", "pattern": "high temperature"},
    {"label": "SYMPTOM", "pattern": "chills"},
    {"label": "SYMPTOM", "pattern": "stomach pain"},
    {"label": "SYMPTOM", "pattern": "stomach ache"},
    {"label": "SYMPTOM", "pattern": "abdominal pain"},
    {"label": "SYMPTOM", "pattern": "nausea"},
    {"label": "SYMPTOM", "pattern": "vomiting"},
    {"label": "SYMPTOM", "pattern": "joint pain"},
    {"label": "SYMPTOM", "pattern": "knee pain"},
    {"label": "SYMPTOM", "pattern": "hip pain"},
    {"label": "SYMPTOM", "pattern": "ankle pain"},
    {"label": "SYMPTOM", "pattern": "wrist pain"},
    {"label": "SYMPTOM", "pattern": "bone pain"},
    {"label": "SYMPTOM", "pattern": "fracture"},
    {"label": "SYMPTOM", "pattern": "breathing difficulty"},
    {"label": "SYMPTOM", "pattern": "shortness of breath"},
    {"label": "SYMPTOM", "pattern": "breathlessness"},
    {"label": "SYMPTOM", "pattern": "wheezing"},
    {"label": "SYMPTOM", "pattern": "cough"},
    {"label": "SYMPTOM", "pattern": "dizziness"},
    {"label": "SYMPTOM", "pattern": "vertigo"},
    {"label": "SYMPTOM", "pattern": "lightheadedness"},
    {"label": "SYMPTOM", "pattern": "fainting"},
    {"label": "SYMPTOM", "pattern": "eye pain"},
    {"label": "SYMPTOM", "pattern": "blurred vision"},
    {"label": "SYMPTOM", "pattern": "eye redness"},
    {"label": "SYMPTOM", "pattern": "sore throat"},
    {"label": "SYMPTOM", "pattern": "throat pain"},
    {"label": "SYMPTOM", "pattern": "difficulty swallowing"},
    {"label": "SYMPTOM", "pattern": "ear pain"},
    {"label": "SYMPTOM", "pattern": "hearing loss"},
    {"label": "SYMPTOM", "pattern": "nasal congestion"},
    {"label": "SYMPTOM", "pattern": "runny nose"},
    {"label": "SYMPTOM", "pattern": "back pain"},
    {"label": "SYMPTOM", "pattern": "lower back pain"},
    {"label": "SYMPTOM", "pattern": "upper back pain"},
    {"label": "SYMPTOM", "pattern": "fatigue"},
    {"label": "SYMPTOM", "pattern": "tiredness"},
    {"label": "SYMPTOM", "pattern": "weakness"},
    {"label": "SYMPTOM", "pattern": "insomnia"},
    {"label": "SYMPTOM", "pattern": "rash"},
    {"label": "SYMPTOM", "pattern": "skin irritation"},
    {"label": "SYMPTOM", "pattern": "itching"},
    {"label": "SYMPTOM", "pattern": "swelling"},
    {"label": "SYMPTOM", "pattern": "numbness"},
    {"label": "SYMPTOM", "pattern": "tingling"},
    {"label": "SYMPTOM", "pattern": "seizure"},
    {"label": "SYMPTOM", "pattern": "unconscious"},
    {"label": "SYMPTOM", "pattern": "bleeding"},
    {"label": "SYMPTOM", "pattern": "severe bleeding"},
    {"label": "SYMPTOM", "pattern": "blood in stool"},
    {"label": "SYMPTOM", "pattern": "blood in urine"},
    {"label": "SYMPTOM", "pattern": "weight loss"},
    {"label": "SYMPTOM", "pattern": "loss of appetite"},
    {"label": "SYMPTOM", "pattern": "dehydration"},
    {"label": "SYMPTOM", "pattern": "cold"},
    {"label": "SYMPTOM", "pattern": "flu"},
    {"label": "SYMPTOM", "pattern": "body ache"},
]

# Transliteration fallback for Hindi/regional symptom keywords
TRANSLITERATION_MAP: Dict[str, str] = {
    "sar dard": "headache",
    "sir dard": "headache",
    "bukhar": "fever",
    "bukhaar": "fever",
    "pet dard": "stomach pain",
    "seena dard": "chest pain",
    "chakkar": "dizziness",
    "ulti": "vomiting",
    "ji machlana": "nausea",
    "kamar dard": "back pain",
    "gathiya": "joint pain",
    "khasi": "cough",
    "khansi": "cough",
    "sans lene mein taklif": "breathing difficulty",
    "thakaan": "fatigue",
    "gala dard": "sore throat",
    "aankh dard": "eye pain",
    "kaan dard": "ear pain",
    "sujan": "swelling",
    "kamzori": "weakness",
}

# Symptom chip label to canonical symptom mapping
CHIP_TO_SYMPTOM: Dict[str, str] = {
    "Headache": "headache",
    "Chest Pain": "chest pain",
    "Fever": "fever",
    "Stomach": "stomach pain",
    "Joint Pain": "joint pain",
    "Breathing": "breathing difficulty",
    "Dizziness": "dizziness",
    "Eye Issues": "eye pain",
    "Sore Throat": "sore throat",
    "Back Pain": "back pain",
    "Fatigue": "fatigue",
    "Nausea": "nausea",
}

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            _nlp = spacy.blank("en")
        ruler = _nlp.add_pipe("entity_ruler", before="ner" if "ner" in _nlp.pipe_names else None)
        ruler.add_patterns(SYMPTOM_PATTERNS)
    return _nlp


def transliterate_text(text: str) -> str:
    """Replace regional/transliterated symptom words with English equivalents."""
    lower = text.lower()
    for regional, english in TRANSLITERATION_MAP.items():
        if regional in lower:
            lower = lower.replace(regional, english)
    return lower


def extract_symptoms(symptom_text: str, symptom_chips: List[str] = None) -> List[str]:
    """
    Extract canonical symptom names from free text + selected chips.
    Uses spaCy EntityRuler for NER-based extraction and chip mapping.
    """
    symptoms = set()

    # Process free text
    if symptom_text and symptom_text.strip():
        processed_text = transliterate_text(symptom_text)
        nlp = get_nlp()
        doc = nlp(processed_text)
        for ent in doc.ents:
            if ent.label_ == "SYMPTOM":
                symptoms.add(ent.text.lower())

        # Fallback: direct keyword matching if NER missed common terms
        text_lower = processed_text.lower()
        for pattern in SYMPTOM_PATTERNS:
            if pattern["pattern"] in text_lower:
                symptoms.add(pattern["pattern"])

    # Process chips
    if symptom_chips:
        for chip in symptom_chips:
            canonical = CHIP_TO_SYMPTOM.get(chip, chip.lower())
            symptoms.add(canonical)

    return sorted(list(symptoms))
