import React from "react";
import strings from "../i18n/strings";

const STEPS = ["stepLanguage", "stepId", "stepSymptoms", "stepFollowUp", "stepToken"];

export default function StepBar({ currentStep, language }) {
  const t = strings[language] || strings.en;
  const labels = STEPS.map((k) => t[k]);

  return (
    <div className="flex items-center justify-center gap-0 py-4 px-2 animate-fadeIn">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${isCompleted ? "bg-[#1A7A4A] text-white" : ""}
                  ${isCurrent ? "bg-[#2A7FBA] text-white ring-4 ring-[#2A7FBA]/30" : ""}
                  ${!isCompleted && !isCurrent ? "bg-gray-300 text-gray-500" : ""}
                `}
              >
                {isCompleted ? "✓" : stepNum}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight font-nunito
                ${isCurrent ? "text-[#2A7FBA] font-bold" : "text-gray-500"}
              `}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-[2px] min-w-[20px] mx-1 mt-[-16px] transition-all duration-300
                ${stepNum < currentStep ? "bg-[#1A7A4A]" : "bg-gray-300"}
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
