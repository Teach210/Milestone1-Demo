import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  const handleReturn = () => {
    const localFlag = localStorage.getItem("isAdmin");
    const isAdmin = localFlag === "1" || localFlag === "true" || localFlag === "true";
    navigate(isAdmin ? "/admin" : "/dashboard");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage("Please fill out both fields.");
      setMessageType("error");
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("New password cannot be the same as current password.");
      setMessageType("error");
      return;
    }

    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setMessage("User not logged in.");
        setMessageType("error");
        // Redirect to login to prompt user to sign in
        navigate("/login");
        return;
      }

  const res = await fetch(`${apiBase}/user/change-password/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password changed successfully!");
        setMessageType("success");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setMessage(data.message || "Error changing password.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Server error. Try again later.");
      setMessageType("error");
      console.error(err);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Change Password</h1>

        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleChangePassword} style={styles.button}>
          Update Password
        </button>

        <div style={{ marginTop: 12 }}>
          <button onClick={handleReturn} style={styles.secondaryButton}>
            Return to Dashboard
          </button>
        </div>

        {message && (
          <p
            style={{
              ...styles.message,
              color: messageType === "success" ? "green" : "red",
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
    color: "red",
    fontSize: "14px",
  },
  secondaryButton: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #1976d2",
    backgroundColor: "#fff",
    color: "#1976d2",
    fontSize: "16px",
    cursor: "pointer",
  },
};
