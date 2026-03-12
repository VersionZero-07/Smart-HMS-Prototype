/**
 * HealthNode API Client — Axios instance + all API calls.
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

/** POST /api/patient/register */
export async function registerPatient({ name, phone, language }) {
  const { data } = await api.post("/api/patient/register", {
    name,
    phone,
    language,
  });
  return data;
}

/** POST /api/symptoms/analyze */
export async function analyzeSymptoms({
  patient_id,
  symptom_text,
  symptom_chips,
  language,
}) {
  const { data } = await api.post("/api/symptoms/analyze", {
    patient_id,
    symptom_text,
    symptom_chips,
    language,
  });
  return data;
}

/** POST /api/symptoms/followup */
export async function submitFollowUp({ patient_id, answers }) {
  const { data } = await api.post("/api/symptoms/followup", {
    patient_id,
    answers,
  });
  return data;
}

/** POST /api/token/generate */
export async function generateToken({ patient_id, department, severity }) {
  const { data } = await api.post("/api/token/generate", {
    patient_id,
    department,
    severity,
  });
  return data;
}

/** GET /api/queue/status/:department */
export async function getQueueStatus(department) {
  const { data } = await api.get(
    `/api/queue/status/${encodeURIComponent(department)}`
  );
  return data;
}

/** GET /api/queue/position/:tokenId */
export async function getQueuePosition(tokenId) {
  const { data } = await api.get(
    `/api/queue/position/${encodeURIComponent(tokenId)}`
  );
  return data;
}

/** POST /api/speech/transcribe */
export async function transcribeSpeech(audioBlob, language) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", language);
  const { data } = await api.post("/api/speech/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** POST /demo */
export async function seedDemo() {
  const { data } = await api.post("/demo");
  return data;
}

// ── Doctor APIs ──

/** POST /api/doctor/login */
export function doctorLogin({ doctor_id, name, department }) {
  return api.post("/api/doctor/login", { doctor_id, name, department });
}

/** GET /api/doctor/queue/:department */
export function getDoctorQueue(department) {
  return api.get(`/api/doctor/queue/${encodeURIComponent(department)}`);
}

/** GET /api/doctor/stats/:department */
export function getDoctorStats(department) {
  return api.get(`/api/doctor/stats/${encodeURIComponent(department)}`);
}

/** POST /api/doctor/complete/:tokenId */
export function completePatient(tokenId) {
  return api.post(`/api/doctor/complete/${encodeURIComponent(tokenId)}`, {});
}

/** GET /api/doctor/patient/:tokenId */
export function getPatientDetail(tokenId) {
  return api.get(`/api/doctor/patient/${encodeURIComponent(tokenId)}`);
}

// ── Admin APIs ──

/** POST /api/admin/login */
export function adminLogin({ username, password }) {
  return api.post("/api/admin/login", { username, password });
}

/** GET /api/admin/doctors */
export function getAdminDoctors() {
  return api.get("/api/admin/doctors");
}

/** POST /api/admin/doctors */
export function addDoctor(doctor) {
  return api.post("/api/admin/doctors", doctor);
}

/** PUT /api/admin/doctors/:id */
export function updateDoctor(id, updates) {
  return api.put(`/api/admin/doctors/${id}`, updates);
}

/** DELETE /api/admin/doctors/:id */
export function deleteDoctor(id) {
  return api.delete(`/api/admin/doctors/${id}`);
}

/** GET /api/admin/stats */
export function getAdminStats() {
  return api.get("/api/admin/stats");
}

export default api;
