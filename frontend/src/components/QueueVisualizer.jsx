import React from "react";
import strings from "../i18n/strings";

export default function QueueVisualizer({ position, total, language }) {
  const t = strings[language] || strings.en;
  const slots = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-[3px] h-10">
        {slots.map((slot) => {
          const isDone = slot < position;
          const isYou = slot === position;
          return (
            <div key={slot} className="flex flex-col items-center">
              {isYou && (
                <div className="text-[10px] font-bold text-[#FF8C00] mb-0.5 animate-you-pulse">
                  {t.you}
                </div>
              )}
              <div
                className={`w-4 rounded-t transition-all duration-300
                  ${isDone ? "bg-[#2A7FBA]/30 h-5" : ""}
                  ${isYou ? "bg-[#FF8C00] h-8 animate-you-pulse" : ""}
                  ${!isDone && !isYou ? "bg-[#2A7FBA] h-6" : ""}
                `}
              />
            </div>
          );
        })}
      </div>
      <span className="text-sm font-bold text-[#FF8C00]">
        #{position} / {total}
      </span>
    </div>
  );
}
