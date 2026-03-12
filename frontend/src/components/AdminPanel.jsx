import { useState, useEffect } from 'react';

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'General Medicine',
  'Orthopedics', 'ENT', 'Ophthalmology'
];

export default function AdminPanel({ adminInfo, onLogout, api }) {
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ total_doctors: 0, active_doctors: 0, departments: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    doctor_id: '', name: '', department: '', specialization: '', phone: '', email: ''
  });
  const [formError, setFormError] = useState('');

  const fetchDoctors = async () => {
    try {
      const [docRes, statRes] = await Promise.all([
        api.getAdminDoctors(),
        api.getAdminStats()
      ]);
      setDoctors(docRes.data);
      setStats(statRes.data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const resetForm = () => {
    setForm({ doctor_id: '', name: '', department: '', specialization: '', phone: '', email: '' });
    setEditingDoctor(null);
    setShowForm(false);
    setFormError('');
  };

  const handleEdit = (doc) => {
    setForm({
      doctor_id: doc.doctor_id,
      name: doc.name,
      department: doc.department,
      specialization: doc.specialization || '',
      phone: doc.phone || '',
      email: doc.email || ''
    });
    setEditingDoctor(doc);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.name || !form.department) {
      setFormError('Doctor ID, Name, and Department are required');
      return;
    }
    setFormError('');
    try {
      if (editingDoctor) {
        await api.updateDoctor(editingDoctor.id, {
          name: form.name,
          department: form.department,
          specialization: form.specialization || null,
          phone: form.phone || null,
          email: form.email || null
        });
      } else {
        await api.addDoctor(form);
      }
      resetForm();
      fetchDoctors();
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this doctor?')) return;
    try {
      await api.deleteDoctor(id);
      fetchDoctors();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggleActive = async (doc) => {
    try {
      await api.updateDoctor(doc.id, { is_active: !doc.is_active });
      fetchDoctors();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
              H
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">HealthNode</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{adminInfo.name}</p>
              <p className="text-xs text-slate-500 capitalize">{adminInfo.role}</p>
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{stats.total_doctors}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase">Total Doctors</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{stats.active_doctors}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{stats.departments}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase">Departments</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Manage Doctors</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-200"
          >
            + Add Doctor
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-md font-bold text-gray-900 mb-4">
              {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Doctor ID (e.g. DOC007)"
                value={form.doctor_id}
                onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                disabled={!!editingDoctor}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white disabled:opacity-50"
              />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
              />
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                type="text"
                placeholder="Specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
              />
              <input
                type="text"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
              />
              <div className="md:col-span-2 lg:col-span-3 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
                >
                  {editingDoctor ? 'Update' : 'Add Doctor'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
              {formError && (
                <div className="md:col-span-2 lg:col-span-3 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                  {formError}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Doctors Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No doctors registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Specialization</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">{doc.doctor_id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.specialization || '—'}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{doc.phone || '—'}</p>
                        <p className="text-xs text-gray-400">{doc.email || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(doc)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                            doc.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {doc.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium"
                          >
                            Remove
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
    </div>
  );
}
