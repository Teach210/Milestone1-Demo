import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordRequirements, validatePassword } from "./utils/passwordValidation";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setMessage("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    // Validate password strength
    const { isValid } = validatePassword(password);
    if (!isValid) {
      setMessage("Password does not meet requirements.");
      return;
    }

    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u_firstname: firstName, u_lastname: lastName, u_email: email, u_password: password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful! Check your email to verify your account.");
        // redirect to login after a short delay
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(data.message || "Error registering user.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign Up</h1>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={styles.input}
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={styles.input}
        />

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

        {password && <PasswordRequirements password={password} />}

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleRegister} style={styles.button}>
          Create Account
        </button>

        <button onClick={() => navigate("/login")} style={styles.linkButton}>
          Back to Login
        </button>

        {message && (
          <p style={{ ...styles.message, color: message.includes("successful") ? "green" : "red" }}>
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
    width: "360px",
    textAlign: "center",
  },
  title: {
    marginBottom: "16px",
    fontSize: "26px",
    color: "#1976d2",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
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
    marginTop: "12px",
    fontSize: "14px",
  },
};
