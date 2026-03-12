"""
Speech transcription router (mock endpoint).
Simulates Whisper/AI4Bharat speech-to-text.
"""
from fastapi import APIRouter, UploadFile, File, Form
from app.db.schemas import TranscriptResponse

router = APIRouter(prefix="/api/speech", tags=["speech"])

# Mock transcriptions per language
MOCK_TRANSCRIPTS = {
    "en": "I have been having a severe headache and dizziness for the past two days",
    "hi": "मुझे दो दिनों से तेज सिर दर्द और चक्कर आ रहे हैं",
    "bn": "আমার দুই দিন ধরে তীব্র মাথাব্যথা এবং মাথা ঘোরা হচ্ছে",
    "ta": "எனக்கு இரண்டு நாட்களாக கடுமையான தலைவலி மற்றும் தலைச்சுற்றல் உள்ளது",
    "te": "నాకు రెండు రోజులుగా తీవ్రమైన తలనొప్పి మరియు తలతిరుగుడు ఉంది",
    "mr": "मला दोन दिवसांपासून तीव्र डोकेदुखी आणि चक्कर येत आहे",
}


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe_speech(
    audio: UploadFile = File(...),
    language: str = Form("en"),
):
    """
    Mock speech-to-text endpoint.
    In production, replace with Whisper or AI4Bharat model inference.
    """
    # Read and discard audio bytes (mock)
    await audio.read()

    transcript = MOCK_TRANSCRIPTS.get(language, MOCK_TRANSCRIPTS["en"])

    return TranscriptResponse(
        transcript=transcript,
        confidence=0.92,
    )
