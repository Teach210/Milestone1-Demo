import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UpdateInfo() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUpdate = async () => {
    if (!firstName || !lastName) {
      setMessage("Please fill out all fields.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setMessage("User not logged in.");
        navigate("/login");
        return;
      }

      // The backend expects PUT /user/:id and fields u_firstname, u_lastname, u_email
      const userEmail = localStorage.getItem("userEmail") || "";
      const res = await fetch(`http://localhost:4040/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u_firstname: firstName, u_lastname: lastName, u_email: userEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Info updated successfully!");
        localStorage.setItem("userFirstName", firstName);
        localStorage.setItem("userLastName", lastName);
      } else {
        setMessage(data.message || "Error updating info.");
      }
    } catch (err) {
      setMessage("Server error. Try again later.");
      console.error(err);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Update Info</h1>

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
        {/* Email is not editable here; only first and last name are updateable */}

        <button onClick={handleUpdate} style={styles.button}>
          Update Info
        </button>

        {message && <p style={styles.message}>{message}</p>}
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
  },
  message: {
    marginTop: "15px",
    color: "#c2185b",
    fontWeight: "500",
  },
};
