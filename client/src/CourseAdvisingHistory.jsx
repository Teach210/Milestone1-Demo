import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CourseAdvisingHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Term</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/advising/${r.id}`)}>
                  <td style={styles.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>{r.current_term || r.last_term || "-"}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(r.status)
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    background: "linear-gradient(to bottom right, #bbdefb, #64b5f6)",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    minWidth: "520px",
    textAlign: 'center',
  },
  title: { color: '#1976d2', marginBottom: 12, textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#000', margin: '0 auto' },
  th: { textAlign: 'center', padding: '8px 6px', color: '#000', borderBottom: '1px solid #ddd' },
  td: { padding: '8px 6px', color: '#000', borderBottom: '1px solid #f2f2f2', textAlign: 'center' },
  button: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  }
  ,
  secondaryButton: {
    width: '100%',
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid #1976d2",
    backgroundColor: "#fff",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "16px",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  }
};
