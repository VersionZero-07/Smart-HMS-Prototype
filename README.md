# HealthNode — Hospital Patient Intake & Triage System

A smart hospital intake system with kiosk and web portal entry points, featuring NLP-based symptom extraction, severity detection, department allocation, priority queue management, and digital token generation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Backend | FastAPI + Uvicorn |
| ML/NLP | spaCy, Sentence Transformers, scikit-learn |
| Database | PostgreSQL + SQLAlchemy + Alembic |
| Queue | Python heapq + Redis pub/sub |
| Deployment | Docker + docker-compose |

---

## Quick Start (Docker)

```bash
cd healthnode
docker-compose up --build
```

This single command starts all services:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Manual Setup (Development)

### Backend

```bash
cd healthnode/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Set environment variables
set DATABASE_URL=postgresql://healthnode:healthnode_secret@localhost:5432/healthnode
set REDIS_URL=redis://localhost:6379/0

# Run migrations
alembic upgrade head

# Train severity model
python -m app.ml.train_severity

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd healthnode/frontend

npm install
npm run dev
```

---

## ML Training Step

The severity classifier must be trained before use:

```bash
cd healthnode/backend
python -m app.ml.train_severity
```

This generates synthetic training data (4000 samples), trains a RandomForestClassifier, and saves the model to `app/ml/models/severity_model.pkl`.

---

## API Endpoints

### Register Patient
```bash
curl -X POST http://localhost:8000/api/patient/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Priya Sharma", "phone": "98765-43210", "language": "en"}'
```

### Analyze Symptoms
```bash
curl -X POST http://localhost:8000/api/symptoms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "symptom_text": "I have a severe headache and dizziness for two days",
    "symptom_chips": ["Headache", "Dizziness"],
    "language": "en"
  }'
```

### Submit Follow-Up
```bash
curl -X POST http://localhost:8000/api/symptoms/followup \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "answers": [
      {"question": "How long have you had headaches?", "answer": "Two days"},
      {"question": "Any numbness?", "answer": "No"},
      {"question": "Ever lost consciousness?", "answer": "No"}
    ]
  }'
```

### Generate Token
```bash
curl -X POST http://localhost:8000/api/token/generate \
  -H "Content-Type: application/json" \
  -d '{"patient_id": 1, "department": "Neurology", "severity": "MEDIUM"}'
```

### Get Queue Status
```bash
curl http://localhost:8000/api/queue/status/Neurology
```

### Get Queue Position
```bash
curl http://localhost:8000/api/queue/position/N12
```

### Speech Transcription (Mock)
```bash
curl -X POST http://localhost:8000/api/speech/transcribe \
  -F "audio=@recording.webm" \
  -F "language=en"
```

### Seed Demo Data
```bash
curl -X POST http://localhost:8000/demo
```

### Health Check
```bash
curl http://localhost:8000/health
```

---

## Sample POST Bodies

### POST /api/patient/register
```json
{
  "name": "Priya Sharma",
  "phone": "98765-43210",
  "language": "en"
}
```

### POST /api/symptoms/analyze
```json
{
  "patient_id": 1,
  "symptom_text": "I have chest pain and difficulty breathing since yesterday",
  "symptom_chips": ["Chest Pain", "Breathing"],
  "language": "en"
}
```

### POST /api/symptoms/followup
```json
{
  "patient_id": 1,
  "answers": [
    {"question": "Do you feel chest pressure when walking?", "answer": "Yes, especially when climbing stairs"},
    {"question": "Any irregular heartbeat?", "answer": "Sometimes at night"},
    {"question": "History of heart conditions?", "answer": "No family history"}
  ]
}
```

### POST /api/token/generate
```json
{
  "patient_id": 1,
  "department": "Cardiology",
  "severity": "HIGH"
}
```

### POST /api/token/generate (Emergency)
```json
{
  "patient_id": 1,
  "department": "Cardiology",
  "severity": "RED"
}
```

---

## Sample API Responses

### POST /api/symptoms/analyze → Response
```json
{
  "extracted_symptoms": ["chest pain", "breathing difficulty"],
  "department": "Cardiology",
  "confidence": 0.92,
  "severity": "RED",
  "needs_followup": false,
  "followup_questions": [],
  "language": "en"
}
```

### POST /api/token/generate → Response
```json
{
  "token_id": "C15",
  "department": "Cardiology",
  "department_translated": "Cardiology",
  "queue_number": 1,
  "queue_total": 3,
  "appointment_window": "10:30 AM - 10:50 AM",
  "registered_at": "10:25 AM, Mar 10 2026",
  "floor_room": "Floor 2, Room 201",
  "estimated_wait_mins": 0,
  "is_priority": true,
  "severity": "RED",
  "patient_name": "Priya Sharma",
  "patient_phone": "98765-43210",
  "symptoms": ["chest pain", "breathing difficulty"],
  "language": "en"
}
```

---

## Project Structure

```
healthnode/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HospitalKiosk.jsx      ← Main kiosk UI (all 5 screens)
│   │   │   ├── Header.jsx
│   │   │   ├── StepBar.jsx
│   │   │   ├── SOSOverlay.jsx
│   │   │   ├── TokenCard.jsx
│   │   │   └── QueueVisualizer.jsx
│   │   ├── hooks/
│   │   │   ├── useVoiceCapture.js
│   │   │   └── useQueuePolling.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── i18n/
│   │   │   └── strings.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── index.html
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── patients.py
│   │   │   ├── symptoms.py
│   │   │   ├── tokens.py
│   │   │   ├── queue.py
│   │   │   └── speech.py
│   │   ├── ml/
│   │   │   ├── nlp_engine.py
│   │   │   ├── department_router.py
│   │   │   ├── severity_classifier.py
│   │   │   ├── train_severity.py
│   │   │   └── models/
│   │   │       └── severity_model.pkl
│   │   ├── queue/
│   │   │   ├── priority_queue.py
│   │   │   └── redis_pubsub.py
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   └── schemas.py
│   │   └── utils/
│   │       ├── token_generator.py
│   │       └── translations.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## Supported Languages

| Code | Language | Flag |
|------|----------|------|
| en | English | 🇬🇧 |
| hi | Hindi | 🇮🇳 |
| bn | Bengali | 🪔 |
| ta | Tamil | 🌺 |
| te | Telugu | 🌸 |
| mr | Marathi | 🏔️ |

---

## Severity Levels

| Level | Score | Color | Behavior |
|-------|-------|-------|----------|
| LOW | 1 | Green | Normal queue |
| MEDIUM | 3 | Yellow | Normal queue |
| HIGH | 7 | Orange | Elevated priority |
| RED | 100 | Red | Emergency bypass — position 1 |

---

## License

This project is for educational and demonstration purposes.
