import { Routes, Route } from "react-router-dom";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import ChangePassword from "./ChangePassword.jsx";
import ResetPassword from "./ResetPassword.jsx"; // 👈 import the new component
import UpdateInfo from "./UpdateInfo.jsx"; 
import ForgotPassword from "./ForgotPassword.jsx";
import Register from "./Register.jsx";
import Profile from "./Profile.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import VerifyCode from "./VerifyCode.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/reset-password" element={<ResetPassword />} /> {/* 👈 new route */}
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/register" element={<Register />} />
  <Route path="/verify-code" element={<VerifyCode />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/update-info" element={<UpdateInfo />} />
    </Routes>
  );
}
