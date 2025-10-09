import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  function handleInputChange(identifier, value) {
    if (identifier === "email") setEnteredEmail(value);
    else setEnteredPassword(value);
  }

  const handleLogin = async () => {
    setSubmitted(true);

    // Simple validation
    if (!enteredEmail || !enteredPassword) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_KEY + "user/login", {
        method: "POST",
        body: JSON.stringify({ Email: enteredEmail, Password: enteredPassword }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data);

        // Save user info to localStorage
        localStorage.setItem("userId", data.result.u_id);
        localStorage.setItem("userFirstName", data.result.u_firstname);
        localStorage.setItem("userEmail", data.result.u_email);

        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Server error. Please try again later.");
      console.error(err);
    }
  };

  const emailNotValid = submitted && !enteredEmail.includes("@");
  const passwordNotValid = submitted && enteredPassword.trim().length < 8;

  return (
    <div id="login">
      <div className="controls">
        <p>
          <label>Email</label>
          <input
            type="email"
            className={emailNotValid ? "invalid" : undefined}
            onChange={(event) => handleInputChange("email", event.target.value)}
            value={enteredEmail}
          />
        </p>
        <p>
          <label>Password</label>
          <input
            type="password"
            className={passwordNotValid ? "invalid" : undefined}
            onChange={(event) => handleInputChange("password", event.target.value)}
            value={enteredPassword}
          />
        </p>
      </div>
      <div className="actions">
        <button type="button" className="button">Create a new account</button>
        <button className="button" onClick={handleLogin}>Sign In</button>
      </div>
    </div>
  );
}
