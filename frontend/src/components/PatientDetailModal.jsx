import { useState } from 'react';

export default function PatientDetailModal({ patient, onClose, onComplete }) {
  const [completing, setCompleting] = useState(false);

  if (!patient) return null;

  const severityConfig = {
    RED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Critical' },
    ORANGE: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'High' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'High' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Medium' },
    LOW: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Low' },
  };
  const sev = severityConfig[patient.severity] || severityConfig.LOW;

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(patient.token_id);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Patient Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Token & Severity Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${sev.bg} ${sev.border} border`}>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Token</p>
              <p className="text-xl font-bold text-gray-900">{patient.token_id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${sev.bg} ${sev.text}`}>
              {patient.severity} — {sev.label}
            </span>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Patient Name" value={patient.patient_name} />
            <InfoCard label="Phone" value={patient.patient_phone} />
            <InfoCard label="Department" value={patient.department} />
            <InfoCard label="Registered At" value={patient.registered_at} />
            <InfoCard label="Wait Time" value={`${patient.wait_mins} min`} />
            <InfoCard label="Queue Position" value={`#${patient.position}`} />
          </div>

          {/* Symptoms */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Reported Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {patient.symptoms && patient.symptoms.length > 0 ? (
                patient.symptoms.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No symptoms recorded</p>
              )}
            </div>
          </div>

          {/* Raw Text */}
          {patient.raw_text && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Patient's Description</h3>
              <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                "{patient.raw_text}"
              </p>
            </div>
          )}

          {/* Follow-up Answers */}
          {patient.followup_answers && patient.followup_answers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Follow-up Responses</h3>
              <div className="space-y-2">
                {patient.followup_answers.map((a, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">{a.question || `Question ${i + 1}`}</p>
                    <p className="text-sm text-gray-700 mt-0.5">{a.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {patient.status !== 'completed' && (
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-lg shadow-green-200 disabled:opacity-50"
            >
              {completing ? 'Marking Complete...' : '✓ Mark Consultation Complete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
      <p className="text-xs text-gray-400 font-medium uppercase">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}
