import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CourseAdvisingHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "#4caf50";
      case "Rejected": return "#f44336";
      case "Pending": return "#ff9800";
      default: return "#757575";
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return navigate('/login');
      try {
        const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
        const res = await fetch(`${apiBase}/advising/history/${userId}`);
        const data = await res.json();
        setRecords(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

  if (loading) return <div style={styles.pageWrapper}><div style={styles.card}><p>Loading...</p></div></div>;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Course Advising History</h1>
        {records.length === 0 ? (
          <p>No advising records found.</p>
        ) : (
          <div style={styles.listContainer}>
            {records.map(r => (
              <div key={r.id} style={styles.recordCard}>
                <div 
                  style={styles.recordHeader}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div style={styles.recordInfo}>
                    <div style={styles.recordDate}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                    <div style={styles.recordTerm}>{r.current_term || r.last_term || "-"}</div>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(r.status)
                  }}>
                    {r.status}
                  </span>
                </div>
                
                {expandedId === r.id && (
                  <div style={styles.recordDetails}>
                    {r.admin_message && (r.status === 'Approved' || r.status === 'Rejected') && (
                      <div style={styles.feedbackSection}>
                        <h4 style={styles.feedbackTitle}>Admin Feedback:</h4>
                        <p style={styles.feedbackText}>{r.admin_message}</p>
                        {r.reviewed_at && (
                          <p style={styles.reviewDate}>
                            Reviewed on {new Date(r.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {r.courses && r.courses.length > 0 && (
                      <div style={styles.coursesSection}>
                        <h4 style={styles.coursesTitle}>Courses:</h4>
                        <ul style={styles.coursesList}>
                          {r.courses.map((c, idx) => (
                            <li key={idx} style={styles.courseItem}>
                              {c.course_level}: {c.course_name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <button 
                      style={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/advising/${r.id}`);
                      }}
                    >
                      View Full Details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
          <button style={styles.secondaryButton} onClick={() => {
            const localFlag = localStorage.getItem('isAdmin');
            const isAdmin = localFlag === '1' || localFlag === 'true';
            navigate(isAdmin ? '/admin' : '/dashboard');
          }}>Return to Dashboard</button>
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
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "800px",
  },
  title: { 
    color: '#1976d2', 
    marginBottom: 24, 
    textAlign: 'center',
    fontSize: '28px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px',
  },
  recordCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  recordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    transition: 'background-color 0.2s',
  },
  recordInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  recordDate: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  recordTerm: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '600',
  },
  recordDetails: {
    padding: '20px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
  },
  feedbackSection: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  feedbackTitle: {
    margin: '0 0 8px 0',
    color: '#1976d2',
    fontSize: '16px',
  },
  feedbackText: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  reviewDate: {
    margin: 0,
    color: '#666',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  coursesSection: {
    marginBottom: '16px',
  },
  coursesTitle: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '16px',
  },
  coursesList: {
    margin: 0,
    paddingLeft: '20px',
  },
  courseItem: {
    color: '#555',
    fontSize: '14px',
    marginBottom: '4px',
  },
  viewButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: '500',
  },
  secondaryButton: {
    width: '100%',
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid #1976d2",
    backgroundColor: "#fff",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: '500',
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    display: "inline-block",
  }
};
