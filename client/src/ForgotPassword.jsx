import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleForgot = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4040/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u_email: email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset email sent. Check your inbox.");
      } else {
        setMessage(data.message || "Error sending reset email.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.text}>Enter your email to receive a password reset link.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleForgot} style={styles.button}>
          Send Reset Link
        </button>

        <button onClick={() => navigate("/login")} style={styles.linkButton}>
          Back to Login
        </button>

        {message && (
          <p style={{ ...styles.message, color: message.includes("sent") ? "green" : "red" }}>
            {message}
          </p>
        )}
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
    marginBottom: "10px",
    fontSize: "26px",
    color: "#1976d2",
    fontWeight: "600",
  },
  text: {
    marginBottom: "15px",
    color: "#333",
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
    cursor: "pointer",
    marginBottom: "8px",
  },
  linkButton: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "#1976d2",
    cursor: "pointer",
    textDecoration: "underline",
  },
  message: {
    marginTop: "15px",
    fontSize: "14px",
  },
};
