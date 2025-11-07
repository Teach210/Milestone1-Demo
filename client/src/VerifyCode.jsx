import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyCode() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const pendingUserId = localStorage.getItem("pendingUserId");
  const pendingUserEmail = localStorage.getItem("pendingUserEmail");

  const handleVerify = async () => {
    if (!code.trim()) {
      setMessage("Please enter the code.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("http://localhost:4040/user/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, code }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        // Complete login: persist user info
        localStorage.setItem("userId", String(data.result.u_id));
        localStorage.setItem("userEmail", data.result.u_email);
        localStorage.setItem("userFirstName", data.result.u_firstname || "");
        localStorage.setItem("userLastName", data.result.u_lastname || "");
        // cleanup pending
        localStorage.removeItem("pendingUserId");
        localStorage.removeItem("pendingUserEmail");
        // show success message in green and redirect shortly
        setMessage("Verification successful! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          if (data.result.is_admin) {
            navigate("/admin", { state: { userEmail: data.result.u_email } });
          } else {
            navigate("/dashboard", { state: { userEmail: data.result.u_email } });
          }
        }, 1500);
      } else {
        setMessage(data.message || "Invalid code");
        setMessageType("error");
        setIsVerifying(false);
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
      setMessageType("error");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("http://localhost:4040/user/resend-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Code resent");
        setMessageType("success");
      } else {
        setMessage(data.message || "Failed to resend code");
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
      setMessageType("error");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Verify Code</h1>
        <p style={styles.text}>A verification code was sent to {pendingUserEmail || "your email"}.</p>
        <input
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={styles.input}
        />
  <button onClick={handleVerify} style={styles.button} disabled={isVerifying}>{isVerifying ? "Verifying..." : "Verify"}</button>
  <button onClick={handleResend} style={styles.linkButton} disabled={isVerifying}>Resend code</button>
  {message && <p style={{ ...styles.message, color: messageType === "success" ? "green" : "red" }}>{message}</p>}
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
  title: { fontSize: "26px", color: "#1976d2", marginBottom: 12 },
  text: { marginBottom: 12 },
  input: { width: "100%", padding: 12, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" },
  button: { width: "100%", padding: 12, borderRadius: 6, border: "none", backgroundColor: "#1976d2", color: "#fff", cursor: "pointer", marginBottom: 8 },
  linkButton: { background: "transparent", color: "#1976d2", border: "none", cursor: "pointer", textDecoration: "underline" },
  message: { marginTop: 12 },
};
