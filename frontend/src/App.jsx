import { useState } from "react";
import LandingPage from "./components/LandingPage";
import HospitalKiosk from "./components/HospitalKiosk";
import DoctorLogin from "./components/DoctorLogin";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import * as api from "./api/client";
import "./index.css";

export default function App() {
  const [view, setView] = useState("landing");
  const [doctorData, setDoctorData] = useState(null);
  const [adminData, setAdminData] = useState(null);

  const handleRoleSelect = (role) => {
    if (role === "patient") setView("patient");
    else if (role === "doctor") setView("doctorLogin");
    else if (role === "admin") setView("adminLogin");
  };

  const handleDoctorLogin = async (credentials) => {
    const res = await api.doctorLogin(credentials);
    setDoctorData(res.data);
    setView("doctorDashboard");
  };

  const handleAdminLogin = async (credentials) => {
    const res = await api.adminLogin(credentials);
    setAdminData(res.data);
    setView("adminPanel");
  };

  const goHome = () => {
    setView("landing");
    setDoctorData(null);
    setAdminData(null);
  };

  switch (view) {
    case "patient":
      return <HospitalKiosk onBack={goHome} />;
    case "doctorLogin":
      return <DoctorLogin onLogin={handleDoctorLogin} onBack={goHome} />;
    case "doctorDashboard":
      return <DoctorDashboard doctor={doctorData} onLogout={goHome} api={api} />;
    case "adminLogin":
      return <AdminLogin onLogin={handleAdminLogin} onBack={goHome} />;
    case "adminPanel":
      return <AdminPanel adminInfo={adminData} onLogout={goHome} api={api} />;
    default:
      return <LandingPage onSelect={handleRoleSelect} />;
  }
}
