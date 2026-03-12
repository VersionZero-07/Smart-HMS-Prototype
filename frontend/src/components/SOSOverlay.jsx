import React from "react";
import strings from "../i18n/strings";

export default function SOSOverlay({ language, onClose }) {
  const t = strings[language] || strings.en;
  return (
    <div className="fixed inset-0 bg-[#D0021B] z-50 flex flex-col items-center justify-center text-white animate-fadeIn">
      <div className="text-8xl mb-6 animate-bounce">🚨</div>
      <h1 className="font-dm-serif text-4xl mb-4 text-center px-4">{t.sosTitle}</h1>
      <p className="text-lg text-center max-w-md mb-6 px-6 font-nunito opacity-90">
        {t.sosBody}
      </p>
      <div className="bg-white/20 rounded-xl px-6 py-3 mb-3 text-center">
        <p className="font-bold">{t.sosRoom}</p>
      </div>
      <div className="bg-white/20 rounded-xl px-6 py-3 mb-8 text-center">
        <p className="font-bold">{t.sosPhone}</p>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-3 border-2 border-white rounded-full text-lg font-bold
          hover:bg-white hover:text-[#D0021B] transition-all duration-300 font-nunito"
      >
        {t.sosBack}
      </button>
    </div>
  );
}
