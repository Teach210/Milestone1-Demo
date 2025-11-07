import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const first = useMemo(() => localStorage.getItem("userFirstName") || "", []);
  const last = useMemo(() => localStorage.getItem("userLastName") || "", []);
  const displayName = `${first} ${last}`.trim() || "Administrator";

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>Welcome, {displayName}.</p>

        <div style={styles.options}>
          <button style={styles.button} onClick={() => navigate('/profile')}>View Profile</button>
          <button style={styles.button} onClick={() => alert('User management placeholder')}>Manage Users</button>
          <button style={styles.button} onClick={() => alert('Reports placeholder')}>View Reports</button>
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
    color: "#000",
    minWidth: "300px",
    maxWidth: "420px",
  },
  title: { fontSize: "28px", color: "#1976d2", marginBottom: 8 },
  subtitle: { marginBottom: 16, color: "#000" },
  options: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  button: { padding: "10px 16px", borderRadius: 6, border: "none", backgroundColor: "#1976d2", color: "#fff", cursor: "pointer" },
};
