import { Routes, Route } from "react-router-dom";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import ChangePassword from "./ChangePassword.jsx";
import UpdateInfo from "./UpdateInfo.jsx"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/update-info" element={<UpdateInfo />} />
    </Routes>
  );
}
