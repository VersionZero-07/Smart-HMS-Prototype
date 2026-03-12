export default function LandingPage({ onSelect }) {
  const roles = [
    {
      key: 'patient',
      title: 'Patient Kiosk',
      subtitle: 'Walk-in registration & triage',
      description: 'Register symptoms, get a token, and join the queue',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      hoverBorder: 'hover:border-blue-300',
      shadowColor: 'shadow-blue-100',
    },
    {
      key: 'doctor',
      title: 'Doctor Dashboard',
      subtitle: 'Clinical queue management',
      description: 'View patient queue, check details, and manage consultations',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-500',
      hoverBorder: 'hover:border-emerald-300',
      shadowColor: 'shadow-emerald-100',
    },
    {
      key: 'admin',
      title: 'Admin Panel',
      subtitle: 'System administration',
      description: 'Manage doctors, departments, and system settings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'from-slate-600 to-slate-800',
      hoverBorder: 'hover:border-slate-300',
      shadowColor: 'shadow-slate-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col items-center justify-center p-6">
      {/* Logo & Title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white mb-6 shadow-xl shadow-blue-200">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">HealthNode</h1>
        <p className="text-gray-500 mt-2 text-lg">Hospital Patient Intake & Triage System</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {roles.map(role => (
          <button
            key={role.key}
            onClick={() => onSelect(role.key)}
            className={`group bg-white rounded-2xl border-2 border-gray-100 ${role.hoverBorder} p-8 text-left transition-all duration-300 hover:shadow-xl ${role.shadowColor} hover:-translate-y-1`}
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
              {role.icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{role.title}</h2>
            <p className="text-sm font-medium text-gray-500 mb-3">{role.subtitle}</p>
            <p className="text-sm text-gray-400 leading-relaxed">{role.description}</p>
            <div className="mt-5 flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-600 transition">
              Enter
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-12 text-sm text-gray-300">v1.0 · Developed for Smart Healthcare</p>
    </div>
  );
}
