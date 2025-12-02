import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PasswordRequirements, validatePassword } from "./utils/passwordValidation";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // get token from URL

  const handleResetPassword = async () => {
    if (!token) {
      setMessage("Invalid or missing token.");
      return;
    }

    if (!newPassword.trim()) {
      setMessage("Please enter a new password.");
      return;
    }

    // Validate password strength
    const { isValid } = validatePassword(newPassword);
    if (!isValid) {
      setMessage("Password does not meet requirements.");
      return;
    }

    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successful! You can now log in.");
      } else {
        setMessage(data.message || "Error resetting password.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again later.");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />
        {newPassword && <PasswordRequirements password={newPassword} />}
        <button onClick={handleResetPassword} style={styles.button}>
          Reset Password
        </button>
        {message && (
          <p
            style={{
              ...styles.message,
              color: message.includes("successful") ? "green" : "red",
            }}
          >
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
    textAlign: "center",
    minWidth: "300px",
    maxWidth: "400px",
  },
  title: {
    fontSize: "28px",
    color: "#1976d2",
    marginBottom: "20px",
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
  },
  message: {
    marginTop: "15px",
    fontSize: "14px",
  },
};
