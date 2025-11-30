import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 👈 import for navigation

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // 👈 used to go to the welcome page

const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    // Use Vite env var for API base URL when running in production
    const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
    const response = await fetch(`${apiBase}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

      if (response.ok && data.status === "success") {
      // ✅ Login successful (no 2FA required): persist id and email and navigate to appropriate dashboard
      localStorage.setItem("userId", String(data.result.u_id));
      localStorage.setItem("userEmail", data.result.u_email);
      localStorage.setItem("userFirstName", data.result.u_firstname || "");
      localStorage.setItem("userLastName", data.result.u_lastname || "");
  // persist admin flag for client-side routing (store as '1' or '0')
  const isAdminFlag = !!(data.result && (data.result.is_admin === 1 || data.result.is_admin === '1' || data.result.is_admin === true));
  localStorage.setItem('isAdmin', isAdminFlag ? '1' : '0');
      // coerce is_admin to a boolean (handles 0/1, '0'/'1', true/false)
      const isAdmin = !!(data.result && (data.result.is_admin === 1 || data.result.is_admin === '1' || data.result.is_admin === true));
      if (isAdmin) {
        navigate("/admin", { state: { userEmail: data.result.u_email } });
      } else {
        navigate("/dashboard", { state: { userEmail: data.result.u_email } });
      }
    } else if (response.ok && data.status === "2fa_required") {
      // 2FA step required: store pending info and navigate to code verification
      localStorage.setItem("pendingUserId", String(data.userId));
      localStorage.setItem("pendingUserEmail", data.email || "");
      navigate("/verify-code");
    } else {
      // ❌ Login failed, show error message from backend
      alert(data.message);
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("An error occurred. Please try again later.");
  }
};


  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleLogin} style={styles.button}>
          Sign In
        </button>
        <button
          onClick={() => navigate("/forgot-password")}
          style={styles.forgotLink}
        >
          Forgot password?
        </button>
        <button
          onClick={() => navigate("/register")}
          style={styles.forgotLink}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    background: "linear-gradient(to bottom right, #bbdefb, #64b5f6)",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    width: "350px",
    textAlign: "center",
  },
  title: {
    marginBottom: "25px",
    fontSize: "26px",
    color: "#1976d2",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "18px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1976d2",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  forgotLink: {
    marginTop: "12px",
    background: "transparent",
    color: "#1976d2",
    border: "none",
    textDecoration: "underline",
    cursor: "pointer",
  },
};
