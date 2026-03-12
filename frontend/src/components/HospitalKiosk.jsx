import React, { useState, useRef, useEffect } from "react";
import strings from "../i18n/strings";
import StepBar from "./StepBar";
import Header from "./Header";
import SOSOverlay from "./SOSOverlay";
import TokenCard from "./TokenCard";
import useVoiceCapture from "../hooks/useVoiceCapture";
import {
  registerPatient,
  analyzeSymptoms,
  submitFollowUp,
  generateToken,
} from "../api/client";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🪔" },
  { code: "ta", label: "தமிழ்", flag: "🌺" },
  { code: "te", label: "తెలుగు", flag: "🌸" },
  { code: "mr", label: "मराठी", flag: "🏔️" },
];

const SYMPTOM_CHIPS = [
  { key: "Headache", emoji: "🧠" },
  { key: "Chest Pain", emoji: "❤️" },
  { key: "Fever", emoji: "🌡️" },
  { key: "Stomach", emoji: "🫃" },
  { key: "Joint Pain", emoji: "🦴" },
  { key: "Breathing", emoji: "🫁" },
  { key: "Dizziness", emoji: "😵" },
  { key: "Eye Issues", emoji: "👁️" },
  { key: "Sore Throat", emoji: "🗣️" },
  { key: "Back Pain", emoji: "🚶" },
  { key: "Fatigue", emoji: "😴" },
  { key: "Nausea", emoji: "🤢" },
];

const CHIP_I18N_KEYS = {
  Headache: "headache",
  "Chest Pain": "chestPain",
  Fever: "fever",
  Stomach: "stomach",
  "Joint Pain": "jointPain",
  Breathing: "breathing",
  Dizziness: "dizziness",
  "Eye Issues": "eyeIssues",
  "Sore Throat": "soreThroat",
  "Back Pain": "backPain",
  Fatigue: "fatigue",
  Nausea: "nausea",
};

export default function HospitalKiosk({ onBack }) {
  // Navigation
  const [screen, setScreen] = useState(1);
  const [showSOS, setShowSOS] = useState(false);

  // Language
  const [language, setLanguage] = useState("en");
  const t = strings[language] || strings.en;

  // Patient data
  const [patientId, setPatientId] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  // ID Screen
  const [showManualForm, setShowManualForm] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Symptoms
  const [selectedChips, setSelectedChips] = useState([]);
  const [symptomText, setSymptomText] = useState("");
  const voice = useVoiceCapture(language);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Follow-up
  const [chatMessages, setChatMessages] = useState([]);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [followUpAnswers, setFollowUpAnswers] = useState([]);

  // Token
  const [tokenData, setTokenData] = useState(null);

  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Sync voice transcript to symptom text
  useEffect(() => {
    if (voice.transcript && voice.voiceState === "captured") {
      setSymptomText(voice.transcript);
    }
  }, [voice.transcript, voice.voiceState]);

  // ── SCREEN 1: Welcome & Language ──
  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn"
      style={{ background: "linear-gradient(135deg, #0F2B4B 0%, #1a4a7a 50%, #2A7FBA 100%)" }}>
      {/* SOS Button */}
      <button onClick={() => setShowSOS(true)}
        className="mb-8 px-6 py-3 bg-[#D0021B] text-white rounded-full font-bold text-lg
          animate-sos-pulse shadow-lg font-nunito">
        🚨 {t.sos}
      </button>

      <h1 className="font-dm-serif text-4xl md:text-5xl text-white text-center mb-3 leading-snug">
        {t.welcome}
      </h1>
      <p className="text-white/70 text-lg mb-10 font-nunito">{t.subtitle}</p>

      <p className="text-white/80 text-sm mb-4 font-nunito">{t.selectLanguage}</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-8">
        {LANGUAGES.map((lang) => (
          <button key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`py-3 px-2 rounded-xl text-center font-bold transition-all duration-300 font-nunito text-sm
              ${language === lang.code
                ? "bg-white text-[#0F2B4B] scale-105 shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20 backdrop-blur"
              }`}>
            <span className="text-xl block mb-1">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>

      <button onClick={() => setScreen(2)}
        className="px-10 py-3 bg-[#2A7FBA] text-white rounded-full font-bold text-lg
          hover:bg-[#1e6da3] transition-all duration-300 shadow-lg font-nunito">
        {t.continue}
      </button>
    </div>
  );

  // ── SCREEN 2: Identification ──
  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setPatientName("Priya Sharma");
      setPatientPhone("98765-43210");
      setScanning(false);
      setShowManualForm(true);
    }, 2000);
  };

  const handleRegister = async () => {
    if (!patientName.trim() || !patientPhone.trim()) return;
    setLoading(true);
    try {
      const result = await registerPatient({
        name: patientName,
        phone: patientPhone,
        language,
      });
      setPatientId(result.patient_id);
      setScreen(3);
    } catch {
      // Fallback: use mock ID
      setPatientId(1);
      setScreen(3);
    }
    setLoading(false);
  };

  const renderIdentification = () => (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col animate-fadeIn">
      <Header />
      <StepBar currentStep={2} language={language} />
      {/* SOS */}
      <div className="text-center mb-4">
        <button onClick={() => setShowSOS(true)}
          className="px-4 py-2 bg-[#D0021B] text-white rounded-full text-sm font-bold
            animate-sos-pulse font-nunito">
          🚨 {t.sos}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <h2 className="font-dm-serif text-2xl text-[#0F2B4B] mb-6">{t.scanTitle}</h2>

        {/* Scanner Frame */}
        {!showManualForm && (
          <div className="relative w-64 h-40 border-2 border-[#2A7FBA] rounded-xl mb-6 overflow-hidden bg-white">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#2A7FBA] rounded-tl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#2A7FBA] rounded-tr" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#2A7FBA] rounded-bl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#2A7FBA] rounded-br" />
            {/* Laser line */}
            {scanning && (
              <div className="absolute left-4 right-4 h-0.5 bg-[#2A7FBA] animate-laser-sweep shadow-[0_0_8px_#2A7FBA]" />
            )}
            <p className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-nunito">
              {scanning ? t.scanningText : t.scanSubtitle}
            </p>
          </div>
        )}

        {!showManualForm && !scanning && (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={handleSimulateScan}
              className="py-3 bg-[#2A7FBA] text-white rounded-xl font-bold font-nunito
                hover:bg-[#1e6da3] transition-all">
              {t.simulateScan}
            </button>
            <button onClick={() => setShowManualForm(true)}
              className="py-3 bg-white text-[#2A7FBA] border-2 border-[#2A7FBA] rounded-xl
                font-bold font-nunito hover:bg-[#EBF4FC] transition-all">
              {t.enterManually}
            </button>
          </div>
        )}

        {scanning && (
          <div className="flex flex-col items-center gap-2">
            <div className="dual-ring-spinner" />
            <p className="text-[#2A7FBA] font-nunito text-sm">{t.scanningText}</p>
          </div>
        )}

        {showManualForm && (
          <div className="w-full max-w-xs animate-slideUp">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1 font-nunito">{t.nameLabel}</label>
              <input type="text" value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2A7FBA]
                  outline-none font-nunito transition-all" />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-1 font-nunito">{t.phoneLabel}</label>
              <input type="tel" value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2A7FBA]
                  outline-none font-nunito transition-all" />
            </div>
            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 bg-[#2A7FBA] text-white rounded-xl font-bold font-nunito
                hover:bg-[#1e6da3] transition-all disabled:opacity-50">
              {loading ? "..." : t.submitId}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── SCREEN 3: Symptoms (Voice First) ──
  const toggleChip = (chipKey) => {
    setSelectedChips((prev) =>
      prev.includes(chipKey) ? prev.filter((c) => c !== chipKey) : [...prev, chipKey]
    );
  };

  const handleSubmitSymptoms = async () => {
    setLoading(true);
    try {
      const result = await analyzeSymptoms({
        patient_id: patientId,
        symptom_text: symptomText,
        symptom_chips: selectedChips,
        language,
      });
      setAnalysisResult(result);
      if (result.needs_followup && result.followup_questions?.length > 0) {
        setFollowUpQuestions(result.followup_questions);
        setChatMessages([
          { sender: "system", text: result.followup_questions[0] },
        ]);
        setCurrentQuestion(0);
        setScreen(4);
      } else {
        // Skip follow-up, go to token
        await handleGenerateToken(result.department, result.severity);
      }
    } catch {
      // Mock fallback
      const mock = {
        extracted_symptoms: selectedChips.length > 0
          ? selectedChips.map((c) => c.toLowerCase())
          : ["headache", "dizziness"],
        department: "Neurology",
        confidence: 0.72,
        severity: "MEDIUM",
        needs_followup: true,
        followup_questions: [
          "How long have you been experiencing headaches or dizziness?",
          "Do you feel numbness or tingling in any part of your body?",
          "Have you ever had a seizure or lost consciousness?",
        ],
      };
      setAnalysisResult(mock);
      setFollowUpQuestions(mock.followup_questions);
      setChatMessages([{ sender: "system", text: mock.followup_questions[0] }]);
      setCurrentQuestion(0);
      setScreen(4);
    }
    setLoading(false);
  };

  const handleMicClick = () => {
    if (voice.voiceState === "listening") {
      voice.stopListening();
    } else {
      voice.reset();
      voice.startListening();
    }
  };

  const renderSymptoms = () => (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col animate-fadeIn">
      <Header />
      <StepBar currentStep={3} language={language} />
      <div className="text-center mb-2">
        <button onClick={() => setShowSOS(true)}
          className="px-4 py-2 bg-[#D0021B] text-white rounded-full text-sm font-bold
            animate-sos-pulse font-nunito">
          🚨 {t.sos}
        </button>
      </div>

      <div className="flex-1 px-4 pb-6 max-w-md mx-auto w-full overflow-y-auto">
        {/* Greeting */}
        <div className="bg-white rounded-[4px_18px_18px_18px] p-4 shadow-sm mb-4 flex items-start gap-3">
          <span className="text-2xl">🩺</span>
          <p className="text-sm text-[#0F2B4B] font-nunito">
            {t.greeting.replace("{name}", patientName || "Patient")}
          </p>
        </div>

        {/* Mic Button — PRIMARY */}
        <div className="flex flex-col items-center my-6">
          <p className="text-xs text-gray-500 mb-3 font-nunito">{t.micPrompt}</p>
          <div className="relative">
            {voice.voiceState === "listening" && (
              <>
                <div className="absolute inset-0 w-[92px] h-[92px] rounded-full bg-[#D0021B]/20 animate-ripple-1" />
                <div className="absolute inset-0 w-[92px] h-[92px] rounded-full bg-[#D0021B]/10 animate-ripple-2" />
              </>
            )}
            <button onClick={handleMicClick}
              className={`relative z-10 w-[92px] h-[92px] rounded-full flex items-center justify-center
                text-white text-3xl transition-all duration-300 shadow-xl
                ${voice.voiceState === "idle" ? "bg-[#2A7FBA] hover:bg-[#1e6da3]" : ""}
                ${voice.voiceState === "listening" ? "bg-[#D0021B] scale-110" : ""}
                ${voice.voiceState === "captured" ? "bg-[#1A7A4A]" : ""}
              `}>
              {voice.voiceState === "idle" && "🎤"}
              {voice.voiceState === "listening" && (
                <div className="flex items-end gap-[2px] h-8">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-1 bg-white rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s`, height: `${12 + Math.random() * 16}px` }} />
                  ))}
                </div>
              )}
              {voice.voiceState === "captured" && "✓"}
            </button>
          </div>
          <p className="text-xs mt-2 font-nunito text-center
            ${voice.voiceState === 'listening' ? 'text-[#D0021B] font-bold' : ''}
            ${voice.voiceState === 'captured' ? 'text-[#1A7A4A] font-bold' : 'text-gray-500'}">
            {voice.voiceState === "listening" && t.listening}
            {voice.voiceState === "captured" && t.voiceCaptured}
          </p>
        </div>

        {/* Text Area (secondary) */}
        <textarea
          value={symptomText}
          onChange={(e) => setSymptomText(e.target.value)}
          placeholder={t.textPlaceholder}
          rows={3}
          className={`w-full px-4 py-3 border-2 rounded-xl outline-none font-nunito text-sm
            resize-none transition-all mb-4
            ${voice.voiceState === "captured" ? "border-[#1A7A4A]/30 bg-[#1A7A4A]/5" : "border-gray-200"}
          `}
        />

        {/* Symptom Chips 4x3 grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {SYMPTOM_CHIPS.map((chip) => {
            const isSelected = selectedChips.includes(chip.key);
            const chipLabel = t[CHIP_I18N_KEYS[chip.key]] || chip.key;
            return (
              <button key={chip.key} onClick={() => toggleChip(chip.key)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-nunito
                  transition-all duration-200 border-2
                  ${isSelected
                    ? "border-[#2A7FBA] bg-[#EBF4FC] text-[#0F2B4B] font-bold shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#2A7FBA]/30"
                  }
                `}>
                <span className="text-lg mb-0.5">{chip.emoji}</span>
                {chipLabel}
              </button>
            );
          })}
        </div>

        {/* Selected chips tags */}
        {selectedChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedChips.map((chip) => (
              <span key={chip}
                className="px-3 py-1 bg-[#2A7FBA] text-white text-xs rounded-full font-nunito flex items-center gap-1">
                {t[CHIP_I18N_KEYS[chip]] || chip}
                <button onClick={() => toggleChip(chip)} className="ml-1 hover:text-white/70">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmitSymptoms} disabled={loading || (!symptomText.trim() && selectedChips.length === 0)}
          className="w-full py-3 bg-[#2A7FBA] text-white rounded-xl font-bold font-nunito
            hover:bg-[#1e6da3] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="dual-ring-spinner-sm" /> {t.reviewing}
            </span>
          ) : t.submitSymptoms}
        </button>
      </div>
    </div>
  );

  // ── SCREEN 4: Follow-Up Chat ──
  const handleQuickReply = async (answer) => {
    await handleChatAnswer(answer);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    await handleChatAnswer(chatInput.trim());
    setChatInput("");
  };

  const handleChatAnswer = async (answer) => {
    const question = followUpQuestions[currentQuestion];
    const newMessages = [
      ...chatMessages,
      { sender: "user", text: answer },
    ];
    setChatMessages(newMessages);

    const newAnswers = [...followUpAnswers, { question, answer }];
    setFollowUpAnswers(newAnswers);

    const nextQ = currentQuestion + 1;

    if (nextQ < followUpQuestions.length && nextQ < 3) {
      setCurrentQuestion(nextQ);
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { sender: "system", text: followUpQuestions[nextQ] },
        ]);
      }, 800);
    } else {
      // All questions answered — submit follow-up
      setLoading(true);
      setChatMessages((prev) => [
        ...prev,
        { sender: "system", text: t.reviewing },
      ]);

      try {
        const result = await submitFollowUp({
          patient_id: patientId,
          answers: newAnswers,
        });
        await handleGenerateToken(result.department, result.severity);
      } catch {
        // Fallback
        const dept = analysisResult?.department || "General Medicine";
        const sev = analysisResult?.severity || "LOW";
        await handleGenerateToken(dept, sev);
      }
    }
  };

  const handleGenerateToken = async (department, severity) => {
    try {
      const result = await generateToken({
        patient_id: patientId,
        department,
        severity,
      });
      setTokenData(result);
    } catch {
      // Mock token
      setTokenData({
        token_id: "A47",
        department,
        department_translated: department,
        queue_number: 2,
        queue_total: 7,
        appointment_window: "10:30 AM - 10:50 AM",
        registered_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", " + new Date().toLocaleDateString(),
        floor_room: "Floor 2, Room 201",
        estimated_wait_mins: 15,
        is_priority: severity === "RED",
        severity,
        patient_name: patientName || "Priya Sharma",
        patient_phone: patientPhone || "98765-43210",
        symptoms: analysisResult?.extracted_symptoms || ["headache", "dizziness"],
      });
    }
    setLoading(false);
    setScreen(5);
  };

  const quickReplies = [
    "Yes",
    "No",
    "Not sure",
    "Since yesterday",
    "A few days",
    "Just today",
  ];

  const renderFollowUp = () => (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col animate-fadeIn">
      <Header />
      <StepBar currentStep={4} language={language} />
      <div className="text-center mb-2">
        <button onClick={() => setShowSOS(true)}
          className="px-4 py-2 bg-[#D0021B] text-white rounded-full text-sm font-bold
            animate-sos-pulse font-nunito">
          🚨 {t.sos}
        </button>
      </div>

      <div className="flex-1 px-4 pb-4 max-w-md mx-auto w-full flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-slideUp`}>
              {msg.sender === "system" && (
                <div className="flex items-start gap-2 max-w-[85%]">
                  <span className="text-lg mt-1">🩺</span>
                  <div className="bg-white rounded-[4px_18px_18px_18px] p-3 shadow-sm">
                    <p className="text-sm text-[#0F2B4B] font-nunito">
                      {msg.text === t.reviewing ? (
                        <span className="flex items-center gap-2">
                          <div className="dual-ring-spinner-sm" />
                          {msg.text}
                        </span>
                      ) : msg.text}
                    </p>
                  </div>
                </div>
              )}
              {msg.sender === "user" && (
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="rounded-[18px_4px_18px_18px] p-3 text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, #2A7FBA, #1e6da3)" }}>
                    <p className="text-sm font-nunito">{msg.text}</p>
                  </div>
                  <span className="text-lg mt-1">👤</span>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick replies */}
        {!loading && currentQuestion < followUpQuestions.length && (
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReplies.map((reply) => (
              <button key={reply} onClick={() => handleQuickReply(reply)}
                className="px-4 py-2 bg-white border-2 border-[#2A7FBA] text-[#2A7FBA] rounded-full
                  text-xs font-bold font-nunito hover:bg-[#EBF4FC] transition-all">
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Text input */}
        {!loading && (
          <div className="flex gap-2">
            <input type="text" value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
              placeholder={t.typeReply}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl outline-none
                font-nunito text-sm focus:border-[#2A7FBA] transition-all" />
            <button onClick={handleChatSend}
              className="px-5 py-3 bg-[#2A7FBA] text-white rounded-xl font-bold font-nunito
                hover:bg-[#1e6da3] transition-all">
              {t.send}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── SCREEN 5: Digital Token ──
  const handleDone = () => {
    // Reset everything
    setScreen(1);
    setLanguage("en");
    setPatientId(null);
    setPatientName("");
    setPatientPhone("");
    setShowManualForm(false);
    setSelectedChips([]);
    setSymptomText("");
    setAnalysisResult(null);
    setTokenData(null);
    setChatMessages([]);
    setFollowUpQuestions([]);
    setFollowUpAnswers([]);
    setCurrentQuestion(0);
    voice.reset();
  };

  const renderToken = () => (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col animate-fadeIn">
      <Header />
      <StepBar currentStep={5} language={language} />
      <div className="text-center mb-2">
        <button onClick={() => setShowSOS(true)}
          className="px-4 py-2 bg-[#D0021B] text-white rounded-full text-sm font-bold
            animate-sos-pulse font-nunito">
          🚨 {t.sos}
        </button>
      </div>

      <div className="flex-1 px-4 pb-8 flex flex-col items-center justify-start">
        <h2 className="font-dm-serif text-2xl text-[#0F2B4B] mb-4">{t.tokenTitle}</h2>
        <TokenCard tokenData={tokenData} language={language} />
        <button onClick={handleDone}
          className="mt-6 px-8 py-3 border-2 border-[#0F2B4B] text-[#0F2B4B] rounded-full
            font-bold font-nunito hover:bg-[#0F2B4B] hover:text-white transition-all">
          {t.done}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {onBack && screen === 1 && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-50 px-4 py-2 text-sm text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-lg transition backdrop-blur-sm"
        >
          ← Home
        </button>
      )}
      {showSOS && <SOSOverlay language={language} onClose={() => setShowSOS(false)} />}
      {screen === 1 && renderWelcome()}
      {screen === 2 && renderIdentification()}
      {screen === 3 && renderSymptoms()}
      {screen === 4 && renderFollowUp()}
      {screen === 5 && renderToken()}
    </div>
  );
}
