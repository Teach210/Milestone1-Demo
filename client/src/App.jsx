import './App.css';
import Dashboard from './Dashboard';
import Login from './Login';
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";

function App() {
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("userId");

  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* Dashboard route */}
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
