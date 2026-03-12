import React from "react";
import strings from "../i18n/strings";
import QueueVisualizer from "./QueueVisualizer";

const DEPT_ICONS = {
  Cardiology: "❤️",
  Neurology: "🧠",
  "General Medicine": "🩺",
  Orthopedics: "🦴",
  ENT: "🗣️",
  Ophthalmology: "👁️",
};

export default function TokenCard({ tokenData, language }) {
  const t = strings[language] || strings.en;
  if (!tokenData) return null;

  const isPriority = tokenData.is_priority || tokenData.severity === "RED";
  const bannerColor = isPriority ? "bg-[#D0021B]" : "bg-[#1A7A4A]";
  const severityEmoji = isPriority ? "🔴" : "🟢";
  const severityLabel = isPriority ? `RED — ${t.priority}` : t.standard;
  const icon = DEPT_ICONS[tokenData.department] || "🩺";

  // QR code SVG pattern (pixel art)
  const qrPattern = () => (
    <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto">
      <rect width="80" height="80" fill="white" />
      {/* Top-left finder */}
      <rect x="4" y="4" width="24" height="24" fill="#0F2B4B" />
      <rect x="8" y="8" width="16" height="16" fill="white" />
      <rect x="12" y="12" width="8" height="8" fill="#0F2B4B" />
      {/* Top-right finder */}
      <rect x="52" y="4" width="24" height="24" fill="#0F2B4B" />
      <rect x="56" y="8" width="16" height="16" fill="white" />
      <rect x="60" y="12" width="8" height="8" fill="#0F2B4B" />
      {/* Bottom-left finder */}
      <rect x="4" y="52" width="24" height="24" fill="#0F2B4B" />
      <rect x="8" y="56" width="16" height="16" fill="white" />
      <rect x="12" y="60" width="8" height="8" fill="#0F2B4B" />
      {/* Data modules */}
      <rect x="32" y="8" width="4" height="4" fill="#0F2B4B" />
      <rect x="40" y="8" width="4" height="4" fill="#0F2B4B" />
      <rect x="36" y="16" width="4" height="4" fill="#0F2B4B" />
      <rect x="32" y="36" width="4" height="4" fill="#0F2B4B" />
      <rect x="40" y="36" width="4" height="4" fill="#0F2B4B" />
      <rect x="48" y="36" width="4" height="4" fill="#0F2B4B" />
      <rect x="36" y="44" width="4" height="4" fill="#0F2B4B" />
      <rect x="56" y="36" width="4" height="4" fill="#0F2B4B" />
      <rect x="64" y="36" width="4" height="4" fill="#0F2B4B" />
      <rect x="36" y="52" width="4" height="4" fill="#0F2B4B" />
      <rect x="44" y="56" width="4" height="4" fill="#0F2B4B" />
      <rect x="52" y="60" width="4" height="4" fill="#0F2B4B" />
      <rect x="60" y="52" width="4" height="4" fill="#0F2B4B" />
      <rect x="48" y="48" width="4" height="4" fill="#0F2B4B" />
      <rect x="68" y="48" width="4" height="4" fill="#0F2B4B" />
    </svg>
  );

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
      {/* Top Banner */}
      <div className={`${bannerColor} text-white px-5 py-3 flex justify-between items-center`}>
        <div className="text-sm font-bold font-nunito">
          {severityEmoji} {severityLabel}
        </div>
        <div className="text-right text-xs font-nunito opacity-90">
          <div>{t.registeredAt}</div>
          <div className="font-bold">{tokenData.registered_at}</div>
        </div>
      </div>

      {/* Department Highlight Card */}
      <div className="p-4">
        <div
          className="rounded-xl p-5 text-center animate-dept-glow"
          style={{
            background: "linear-gradient(135deg, #EBF4FC, #daeef9)",
            border: "2.5px solid #2A7FBA",
          }}
        >
          <div className="text-4xl mb-2">{icon}</div>
          <h2 className="font-dm-serif text-2xl text-[#0F2B4B] mb-1">
            {tokenData.department_translated || tokenData.department}
          </h2>
          <p className="text-sm text-gray-600 font-nunito">{tokenData.floor_room}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
              <div className="text-[10px] text-gray-500 uppercase font-nunito">{t.appointmentWindow}</div>
              <div className="text-sm font-bold text-[#0F2B4B] font-nunito">{tokenData.appointment_window}</div>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
              <div className="text-[10px] text-gray-500 uppercase font-nunito">{t.approxWait}</div>
              <div className="text-sm font-bold text-[#0F2B4B] font-nunito">
                {tokenData.estimated_wait_mins} {t.minutes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token + Queue Section */}
      <div className="mx-4 mb-4 border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-shrink-0 text-center">
          <div className="text-[10px] text-gray-500 uppercase font-nunito">{t.tokenNumber}</div>
          <div className="font-dm-serif text-[52px] leading-none text-[#0F2B4B]">
            {tokenData.token_id}
          </div>
        </div>
        <div className="flex-1 border-l-2 border-dashed border-gray-300 pl-4">
          <div className="text-[10px] text-gray-500 uppercase font-nunito mb-1">{t.queuePosition}</div>
          <QueueVisualizer
            position={tokenData.queue_number}
            total={tokenData.queue_total}
            language={language}
          />
        </div>
      </div>

      {/* Patient Info */}
      <div className="mx-4 mb-3 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-500 font-nunito">👤 {t.patientName}</span>
          <p className="text-sm font-bold text-[#0F2B4B] font-nunito">{tokenData.patient_name}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-500 font-nunito">📱 {t.patientPhone}</span>
          <p className="text-sm font-bold text-[#0F2B4B] font-nunito">{tokenData.patient_phone}</p>
        </div>
      </div>

      {/* Symptoms */}
      {tokenData.symptoms && tokenData.symptoms.length > 0 && (
        <div className="mx-4 mb-3 bg-[#EBF4FC] rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-500 font-nunito">{t.symptomsReported}</span>
          <p className="text-sm text-[#0F2B4B] font-nunito">
            {tokenData.symptoms.join(", ")}
          </p>
        </div>
      )}

      {/* QR Code */}
      <div className="mx-4 mb-4 text-center">
        {qrPattern()}
        <p className="text-[10px] text-gray-400 mt-1 font-nunito">{t.scanQR}</p>
      </div>

      {/* Stripe Footer */}
      <div className="h-3 w-full bg-stripe-animated" />
    </div>
  );
}
