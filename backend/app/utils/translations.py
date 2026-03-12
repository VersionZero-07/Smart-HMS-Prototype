"""
Translations utility — department names and UI strings in 6 languages.
"""
from typing import Dict

DEPARTMENT_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "Cardiology": {
        "en": "Cardiology",
        "hi": "हृदय रोग विभाग",
        "bn": "হৃদরোগ বিভাগ",
        "ta": "இதயவியல்",
        "te": "హృద్రోగ విభాగం",
        "mr": "हृदयरोग विभाग",
    },
    "Neurology": {
        "en": "Neurology",
        "hi": "तंत्रिका विज्ञान विभाग",
        "bn": "স্নায়ুবিজ্ঞান বিভাগ",
        "ta": "நரம்பியல்",
        "te": "న్యూరాలజీ విభాగం",
        "mr": "मज्जातंतू विभाग",
    },
    "General Medicine": {
        "en": "General Medicine",
        "hi": "सामान्य चिकित्सा",
        "bn": "সাধারণ চিকিৎসা",
        "ta": "பொது மருத்துவம்",
        "te": "సాధారణ వైద్యం",
        "mr": "सामान्य चिकित्सा",
    },
    "Orthopedics": {
        "en": "Orthopedics",
        "hi": "अस्थिरोग विभाग",
        "bn": "অর্থোপেডিক্স বিভাগ",
        "ta": "எலும்பியல்",
        "te": "ఆర్థోపెడిక్స్ విభాగం",
        "mr": "अस्थिरोग विभाग",
    },
    "ENT": {
        "en": "ENT",
        "hi": "कान-नाक-गला विभाग",
        "bn": "কান-নাক-গলা বিভাগ",
        "ta": "காது-மூக்கு-தொண்டை",
        "te": "చెవి-ముక్కు-గొంతు విభాగం",
        "mr": "कान-नाक-घसा विभाग",
    },
    "Ophthalmology": {
        "en": "Ophthalmology",
        "hi": "नेत्र विज्ञान विभाग",
        "bn": "চক্ষুবিজ্ঞান বিভাগ",
        "ta": "கண் மருத்துவம்",
        "te": "నేత్ర విభాగం",
        "mr": "नेत्र विभाग",
    },
}


def translate_department(department: str, language: str) -> str:
    """Translate department name to the specified language."""
    dept_trans = DEPARTMENT_TRANSLATIONS.get(department, {})
    return dept_trans.get(language, dept_trans.get("en", department))


FOLLOWUP_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "How long have you had these symptoms?": {
        "hi": "ये लक्षण कितने दिनों से हैं?",
        "bn": "এই লক্ষণগুলো কতদিন ধরে আছে?",
        "ta": "இந்த அறிகுறிகள் எத்தனை நாட்களாக உள்ளன?",
        "te": "ఈ లక్షణాలు ఎన్ని రోజులుగా ఉన్నాయి?",
        "mr": "ही लक्षणे किती दिवसांपासून आहेत?",
    },
}
