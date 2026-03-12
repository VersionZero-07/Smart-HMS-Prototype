/**
 * useVoiceCapture — Mic recording logic using Web Audio API.
 */
import { useState, useRef, useCallback } from "react";
import { transcribeSpeech } from "../api/client";

export default function useVoiceCapture(language = "en") {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceState, setVoiceState] = useState("idle"); // idle | listening | captured
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());

        try {
          const result = await transcribeSpeech(audioBlob, language);
          setTranscript(result.transcript);
          setVoiceState("captured");
        } catch {
          // If API is unavailable, use mock transcript
          const mockTranscripts = {
            en: "I have been having a severe headache and dizziness for the past two days",
            hi: "मुझे दो दिनों से तेज सिर दर्द और चक्कर आ रहे हैं",
            bn: "আমার দুই দিন ধরে তীব্র মাথাব্যথা এবং মাথা ঘোরা হচ্ছে",
            ta: "எனக்கு இரண்டு நாட்களாக கடுமையான தலைவலி மற்றும் தலைச்சுற்றல் உள்ளது",
            te: "నాకు రెండు రోజులుగా తీవ్రమైన తలనొప్పి మరియు తలతిరుగుడు ఉంది",
            mr: "मला दोन दिवसांपासून तीव्र डोकेदुखी आणि चक्कर येत आहे",
          };
          setTranscript(mockTranscripts[language] || mockTranscripts.en);
          setVoiceState("captured");
        }
        setIsListening(false);
      };

      mediaRecorder.start();
      setIsListening(true);
      setVoiceState("listening");

      // Auto-stop after 8 seconds
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      }, 8000);
    } catch {
      // If mic not available, use mock
      setVoiceState("listening");
      setIsListening(true);
      setTimeout(() => {
        const mockTranscripts = {
          en: "I have been having a severe headache and dizziness for the past two days",
          hi: "मुझे दो दिनों से तेज सिर दर्द और चक्कर आ रहे हैं",
          bn: "আমার দুই দিন ধরে তীব্র মাথাব্যথা এবং মাথা ঘোরা হচ্ছে",
          ta: "எனக்கு இரண்டு நாட்களாக கடுமையான தலைவலி மற்றும் தலைச்சுற்றல் உள்ளது",
          te: "నాకు రెండు రోజులుగా తీవ్రమైన తలనొప్పి మరియు తలతిరుగుడు ఉంది",
          mr: "मला दोन दिवसांपासून तीव्र डोकेदुखी आणि चक्कर येत आहे",
        };
        setTranscript(mockTranscripts[language] || mockTranscripts.en);
        setVoiceState("captured");
        setIsListening(false);
      }, 2000);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setVoiceState("idle");
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    voiceState,
    startListening,
    stopListening,
    setTranscript,
    reset,
  };
}
