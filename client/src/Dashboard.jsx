import { useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const firstName = localStorage.getItem("userFirstName");
  const lastName = localStorage.getItem("userLastName");
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : location.state?.userEmail || "User";

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
  <h1 style={styles.title}>Welcome, {displayName}!</h1>
        <p style={styles.text}>You’ve successfully logged in.</p>

        <div style={styles.options}>
          <button
            style={styles.button}
            onClick={() => navigate("/change-password")}
          >
            Change Password
          </button>
          <button
            style={styles.button}
            onClick={() => navigate("/update-info")}
          >
            Update Info
          </button>
          <button
            style={styles.button}
            onClick={() => navigate("/profile")}
          >
            View Profile
          </button>
          <button
            style={styles.button}
            onClick={() => navigate("/advising/new")}
          >
            New Advising Entry
          </button>
          <button
            style={styles.button}
            onClick={() => navigate("/advising")}
          >
            Advising History
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",   // full viewport height
    width: "100vw",    // full viewport width
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
    marginBottom: "10px",
  },
  text: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "30px",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "12px",
    marginTop: "10px",
  },
  button: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
};
