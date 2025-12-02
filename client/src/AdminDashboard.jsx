import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [advisingForms, setAdvisingForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const first = useMemo(() => localStorage.getItem("userFirstName") || "", []);
  const last = useMemo(() => localStorage.getItem("userLastName") || "", []);
  const displayName = `${first} ${last}`.trim() || "Administrator";

  useEffect(() => {
    fetchAdvisingForms();
  }, []);

  const fetchAdvisingForms = async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/advising/admin/all`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch advising forms");
      }
      
      const data = await response.json();
      setAdvisingForms(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching advising forms:", err);
      setError("Failed to load advising forms");
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "#4caf50";
      case "Rejected": return "#f44336";
      case "Pending": return "#ff9800";
      default: return "#757575";
    }
  };

  const handleReviewClick = (advisingId) => {
    navigate(`/admin/review/${advisingId}`);
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {displayName}</p>
          <button style={styles.profileButton} onClick={() => navigate('/profile')}>
            View Profile
          </button>
        </div>

        <div style={styles.tableContainer}>
          <h2 style={styles.sectionTitle}>All Advising Forms</h2>
          
          {loading && <p style={styles.message}>Loading...</p>}
          {error && <p style={{ ...styles.message, color: "#f44336" }}>{error}</p>}
          
          {!loading && !error && advisingForms.length === 0 && (
            <p style={styles.message}>No advising forms found</p>
          )}
          
          {!loading && !error && advisingForms.length > 0 && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Term</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Submitted</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {advisingForms.map((form) => (
                    <tr key={form.id} style={styles.tr}>
                      <td style={styles.td}>{form.student_name}</td>
                      <td style={styles.td}>{form.student_email}</td>
                      <td style={styles.td}>{form.current_term || "N/A"}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(form.status)
                        }}>
                          {form.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(form.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.reviewButton}
                          onClick={() => handleReviewClick(form.id)}
                        >
                          {form.status === "Pending" ? "Review" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "100vh",
    width: "100vw",
    background: "linear-gradient(to bottom right, #bbdefb, #64b5f6)",
    padding: "40px 20px",
  },
  container: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "1200px",
    padding: "30px",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "20px",
  },
  title: {
    fontSize: "32px",
    color: "#1976d2",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#666",
    marginBottom: "15px",
  },
  profileButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #1976d2",
    backgroundColor: "transparent",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "14px",
  },
  tableContainer: {
    marginTop: "20px",
  },
  sectionTitle: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
  message: {
    textAlign: "center",
    fontSize: "16px",
    color: "#666",
    padding: "20px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
  },
  th: {
    backgroundColor: "#1976d2",
    color: "#fff",
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
  },
  tr: {
    borderBottom: "1px solid #e0e0e0",
  },
  td: {
    padding: "12px",
    fontSize: "14px",
    color: "#333",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  },
  reviewButton: {
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1976d2",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
};
