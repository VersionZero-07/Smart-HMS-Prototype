import { useState, useEffect, useCallback } from 'react';
import PatientDetailModal from './PatientDetailModal';

export default function DoctorDashboard({ doctor, onLogout, api }) {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total_in_queue: 0, consulted_today: 0, critical_count: 0, avg_wait_mins: 0 });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        api.getDoctorQueue(doctor.department),
        api.getDoctorStats(doctor.department)
      ]);
      setQueue(queueRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [doctor.department, api]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleViewPatient = async (tokenId) => {
    try {
      const res = await api.getPatientDetail(tokenId);
      const patient = queue.find(p => p.token_id === tokenId);
      setDetailData({ ...res.data, position: patient?.position, wait_mins: patient?.wait_mins });
      setSelectedPatient(tokenId);
    } catch (err) {
      console.error('Failed to fetch patient details:', err);
    }
  };

  const handleComplete = async (tokenId) => {
    try {
      await api.completePatient(tokenId);
      setSelectedPatient(null);
      setDetailData(null);
      fetchData();
    } catch (err) {
      console.error('Failed to complete patient:', err);
    }
  };

  const severityOrder = { RED: 0, ORANGE: 1, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedQueue = [...queue].sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  const severityRowClass = (sev) => {
    if (sev === 'RED') return 'bg-red-50 border-l-4 border-l-red-500';
    if (sev === 'ORANGE' || sev === 'HIGH') return 'bg-orange-50 border-l-4 border-l-orange-400';
    if (sev === 'MEDIUM') return 'bg-yellow-50 border-l-4 border-l-yellow-400';
    return '';
  };

  const severityBadge = (sev) => {
    const config = {
      RED: 'bg-red-100 text-red-700',
      ORANGE: 'bg-orange-100 text-orange-700',
      HIGH: 'bg-orange-100 text-orange-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-green-100 text-green-700',
    };
    return config[sev] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              H
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">HealthNode</h1>
              <p className="text-xs text-gray-400">Clinical Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{doctor.name}</p>
              <p className="text-xs text-blue-600">{doctor.department}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Patients in Queue"
            value={stats.total_in_queue}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            label="Consulted Today"
            value={stats.consulted_today}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            label="Critical Cases"
            value={stats.critical_count}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
            color="red"
          />
          <StatCard
            label="Avg Wait (min)"
            value={stats.avg_wait_mins}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Patient Queue</h2>
              <p className="text-sm text-gray-400">{doctor.department} Department</p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading queue...</div>
          ) : sortedQueue.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 font-medium">No patients in queue</p>
              <p className="text-gray-300 text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Token</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Symptoms</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wait</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedQueue.map((p, idx) => (
                    <tr key={p.token_id} className={`hover:bg-blue-50/50 transition ${severityRowClass(p.severity)}`}>
                      <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-gray-900">{p.token_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{p.patient_name}</p>
                        <p className="text-xs text-gray-400">{p.patient_phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${severityBadge(p.severity)}`}>
                          {p.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.symptoms.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">{s}</span>
                          ))}
                          {p.symptoms.length > 3 && (
                            <span className="text-xs text-gray-400">+{p.symptoms.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.wait_mins}m</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPatient(p.token_id)}
                            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleComplete(p.token_id)}
                            className="px-3 py-1.5 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition font-medium"
                          >
                            Done
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Patient Detail Modal */}
      {selectedPatient && detailData && (
        <PatientDetailModal
          patient={detailData}
          onClose={() => { setSelectedPatient(null); setDetailData(null); }}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium uppercase">{label}</p>
    </div>
  );
}
