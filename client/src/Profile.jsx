import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`http://localhost:4040/user/profile/${userId}`);
        const data = await res.json();
        console.log("Profile fetch response:", data);
        if (res.ok) {
          setUser(data);
        } else {
          setError(data.message || "Failed to load user.");
        }
      } catch (err) {
        console.error(err);
        setError("Server error. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) return <div style={styles.pageWrapper}><div style={styles.card}><p>Loading...</p></div></div>;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Profile</h1>
        {error && <p style={{ ...styles.message, color: "red" }}>{error}</p>}
        {user ? (
          <div style={styles.info}>
            {Object.entries(user)
              .filter(([key]) => key !== "u_password")
              .map(([key, value]) => (
                <p key={key}>
                  <strong>{formatKey(key)}:</strong> {formatValue(key, value)}
                </p>
              ))}
          </div>
        ) : (
          !error && (
            <div>
              <p>No user data available.</p>
            </div>
          )
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            style={styles.button}
            onClick={() => {
              // prefer server-fetched user role, fallback to localStorage flag
              const localFlag = localStorage.getItem('isAdmin');
              const fromUser = user && (user.is_admin === 1 || user.is_admin === '1' || user.is_admin === true);
              const isAdmin = !!fromUser || localFlag === '1';
              if (isAdmin) navigate('/admin');
              else navigate('/dashboard');
            }}
          >
            Back to Dashboard
          </button>
          <button
            style={{ ...styles.button, backgroundColor: '#e53935' }}
            onClick={() => {
              // remove user session data and navigate to login
              localStorage.removeItem('userId');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userFirstName');
              localStorage.removeItem('userLastName');
              localStorage.removeItem('pendingUserId');
              localStorage.removeItem('pendingUserEmail');
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function formatKey(key) {
  // make keys human readable
  return key
    .replace(/^u_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(key, value) {
  if (key === "is_verified" || key === "is_admin") {
    return value ? "Yes" : "No";
  }
  if (value === null) return "(null)";
  return String(value);
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
  title: {
    fontSize: "28px",
    color: "#1976d2",
    marginBottom: "12px",
  },
  info: {
    textAlign: "left",
    color: "#000",
    marginTop: "10px",
    lineHeight: 1.6,
  },
  button: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1976d2",
    color: "#fff",
    cursor: "pointer",
  },
  message: {
    marginTop: "12px",
    fontSize: "14px",
  },
};
