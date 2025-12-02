import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdvisingReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [advising, setAdvising] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdvisingDetails();
  }, [id]);

  const fetchAdvisingDetails = async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/advising/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch advising details");
      }
      
      const data = await response.json();
      setAdvising(data);
      
      // Pre-fill message if already reviewed
      if (data.admin_message) {
        setAdminMessage(data.admin_message);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching advising details:", err);
      setError("Failed to load advising details");
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (!adminMessage.trim()) {
      alert("Please provide feedback message");
      return;
    }

    setSubmitting(true);
    
    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const adminId = localStorage.getItem("userId");
      
      const response = await fetch(`${apiBase}/advising/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_message: adminMessage,
          admin_id: parseInt(adminId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Advising form ${status.toLowerCase()} successfully!`);
        navigate("/admin");
      } else {
        alert(data.message || "Error updating advising form");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Server error. Please try again.");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <p style={styles.message}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !advising) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <p style={{ ...styles.message, color: "#f44336" }}>{error || "Advising form not found"}</p>
          <button style={styles.backButton} onClick={() => navigate("/admin")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isReviewed = advising.status !== "Pending";

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Advising Form Review</h1>
          <button style={styles.backButton} onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Student Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>User ID:</strong> {advising.user_id}
            </div>
            <div style={styles.infoItem}>
              <strong>Submitted:</strong> {new Date(advising.created_at).toLocaleString()}
            </div>
            <div style={styles.infoItem}>
              <strong>Status:</strong>{" "}
              <span style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(advising.status)
              }}>
                {advising.status}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Academic Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Current Term:</strong> {advising.current_term || "N/A"}
            </div>
            <div style={styles.infoItem}>
              <strong>Last Term:</strong> {advising.last_term || "N/A"}
            </div>
            <div style={styles.infoItem}>
              <strong>Last GPA:</strong> {advising.last_gpa || "N/A"}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Requested Courses</h2>
          {advising.courses && advising.courses.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Course Level</th>
                  <th style={styles.th}>Course Name</th>
                </tr>
              </thead>
              <tbody>
                {advising.courses.map((course, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{course.course_level}</td>
                    <td style={styles.td}>{course.course_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={styles.message}>No courses listed</p>
          )}
        </div>

        {isReviewed && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Review Information</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <strong>Reviewed By Admin ID:</strong> {advising.admin_id}
              </div>
              <div style={styles.infoItem}>
                <strong>Reviewed At:</strong> {advising.reviewed_at ? new Date(advising.reviewed_at).toLocaleString() : "N/A"}
              </div>
            </div>
            <div style={styles.messageBox}>
              <strong>Admin Feedback:</strong>
              <p>{advising.admin_message}</p>
            </div>
          </div>
        )}

        {!isReviewed && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Review Form</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Feedback Message:</label>
              <textarea
                style={styles.textarea}
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Provide feedback to the student..."
                rows="6"
              />
            </div>
            <div style={styles.buttonGroup}>
              <button
                style={{ ...styles.actionButton, backgroundColor: "#4caf50" }}
                onClick={() => handleReview("Approved")}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Approve"}
              </button>
              <button
                style={{ ...styles.actionButton, backgroundColor: "#f44336" }}
                onClick={() => handleReview("Rejected")}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Reject"}
              </button>
            </div>
          </div>
        )}
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
    maxWidth: "900px",
    padding: "30px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "20px",
  },
  title: {
    fontSize: "28px",
    color: "#1976d2",
    margin: 0,
  },
  backButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #1976d2",
    backgroundColor: "transparent",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "14px",
  },
  section: {
    marginBottom: "30px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
  },
  sectionTitle: {
    fontSize: "20px",
    color: "#333",
    marginBottom: "15px",
    marginTop: 0,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },
  infoItem: {
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
  message: {
    textAlign: "center",
    fontSize: "16px",
    color: "#666",
    padding: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
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
  messageBox: {
    marginTop: "15px",
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },
  buttonGroup: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  actionButton: {
    padding: "12px 30px",
    borderRadius: "6px",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    minWidth: "120px",
  },
};
