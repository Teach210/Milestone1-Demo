import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// small static catalog for demo purposes
const COURSE_CATALOG = {
  "100": ["ENG 101", "MATH 101", "HIST 101"],
  "200": ["ENG 201", "MATH 201", "CS 201"],
  "300": ["CS 301", "MATH 301"],
};

export default function CourseAdvising() {
  const { id } = useParams(); // 'new' or existing id
  const navigate = useNavigate();
  const [lastTerm, setLastTerm] = useState("");
  const [lastGPA, setLastGPA] = useState("");
  const [currentTerm, setCurrentTerm] = useState("");
  const [courses, setCourses] = useState([{ level: "100", course_name: "ENG 101" }]);
  const [status, setStatus] = useState('Pending');
  const [readonly, setReadonly] = useState(false);

  useEffect(() => {
    const fetchIfEditing = async () => {
      if (!id || id === 'new') return;
      try {
        const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
        const res = await fetch(`${apiBase}/advising/${id}`);
        const data = await res.json();
        setLastTerm(data.last_term || '');
        setLastGPA(data.last_gpa ?? '');
        setCurrentTerm(data.current_term || '');
        setCourses((data.courses || []).map(c => ({ level: c.course_level, course_name: c.course_name })));
        setStatus(data.status || 'Pending');
        setReadonly(data.status === 'Approved' || data.status === 'Rejected');
      } catch (err) {
        console.error(err);
      }
    };
    fetchIfEditing();
  }, [id]);

  // helper: get list of already-taken courses for the last term from history
  const fetchTakenCoursesForLastTerm = async (term) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return [];
    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/advising/history/${userId}`);
      const data = await res.json();
      // find entries where last_term equals term and pull their course names
      const sameTerm = (data || []).filter(e => e.last_term === term || e.current_term === term);
      const names = [];
      sameTerm.forEach(e => (e.courses || []).forEach(c => names.push(c.course_name)));
      return names;
    } catch (err) {
      return [];
    }
  };

  const addRow = async () => {
    // before adding, we could optionally check rules — but rule checks happen on select change
    setCourses(prev => [...prev, { level: "100", course_name: COURSE_CATALOG["100"][0] }]);
  };

  const removeRow = (idx) => setCourses(prev => prev.filter((_, i) => i !== idx));

  const updateCourse = (idx, field, value) => {
    setCourses(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return navigate('/login');

    // basic validation
    if (!currentTerm) {
      alert('Please enter current term');
      return;
    }

    // prevent adding courses already taken in last term
    const taken = await fetchTakenCoursesForLastTerm(lastTerm);
    const duplicate = courses.find(c => taken.includes(c.course_name));
    if (duplicate) {
      alert(`You already took ${duplicate.course_name} in your last term and cannot add it.`);
      return;
    }

    const payload = {
      userId,
      last_term: lastTerm,
      last_gpa: lastGPA || null,
      current_term: currentTerm,
      courses
    };

    try {
      const apiBase = (import.meta.env.VITE_API_KEY || "http://localhost:4040").replace(/\/$/, "");
      if (!id || id === 'new') {
        const res = await fetch(`${apiBase}/advising`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          navigate('/advising');
        } else {
          const d = await res.json();
          alert(d.message || 'Failed to create advising entry');
        }
      } else {
        const res = await fetch(`${apiBase}/advising/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          navigate('/advising');
        } else {
          const d = await res.json();
          alert(d.message || 'Failed to update advising entry');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  const handleReturn = () => {
    const localFlag = localStorage.getItem("isAdmin");
    const isAdmin = localFlag === "1" || localFlag === "true";
    navigate(isAdmin ? "/admin" : "/dashboard");
  };

  const levelOptions = Object.keys(COURSE_CATALOG);

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Course Advising Form</h1>

        <div style={styles.headerRow}>
          <div style={styles.fieldBox}>
            <label style={styles.fieldLabel}>Last Term</label>
            <input value={lastTerm} onChange={(e) => setLastTerm(e.target.value)} disabled={readonly} style={styles.fieldInput} />
          </div>
          <div style={styles.fieldBox}>
            <label style={styles.fieldLabel}>Last GPA</label>
            <input value={lastGPA} onChange={(e) => setLastGPA(e.target.value)} disabled={readonly} style={styles.fieldInput} />
          </div>
          <div style={styles.fieldBox}>
            <label style={styles.fieldLabel}>Advising Term</label>
            <input value={currentTerm} onChange={(e) => setCurrentTerm(e.target.value)} disabled={readonly} style={styles.fieldInput} />
          </div>
        </div>

        <div style={{ ...styles.section, marginTop: 18 }}>
          <div style={styles.planHeader}>
            <h3 style={{ margin: 0 }}>Course Plan</h3>
            {!readonly && (
              <button onClick={addRow} style={styles.addCircle} aria-label="Add course">+</button>
            )}
          </div>

          <div style={styles.tableHeader}>
            <div style={{ width: 120, fontWeight: 600 }}>Level</div>
            <div style={{ flex: 1, fontWeight: 600 }}>Course Name</div>
            <div style={{ width: 90 }}></div>
          </div>

          {courses.map((r, idx) => (
            <div key={idx} style={styles.courseRow}>
              <select value={r.level} onChange={(e) => updateCourse(idx, 'level', e.target.value)} disabled={readonly} style={styles.selectBlue}>
                {levelOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={r.course_name} onChange={(e) => updateCourse(idx, 'course_name', e.target.value)} disabled={readonly} style={{ ...styles.selectBlue, flex: 1 }}>
                {(COURSE_CATALOG[r.level] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {!readonly ? (
                <button onClick={() => removeRow(idx)} style={styles.smallButton}>Remove</button>
              ) : (
                <div style={{ width: 90 }} />
              )}
            </div>
          ))}

          {/* '+' button next to the Course Plan header is the primary add control; duplicate Add Course button removed */}
        </div>

        <div style={{ marginTop: 18 }}>
          {!readonly && (
            <button onClick={handleSubmit} style={styles.button}>{id && id !== 'new' ? 'Save Changes' : 'Submit Advising'}</button>
          )}

          <div style={{ marginTop: 12 }}>
            <button onClick={handleReturn} style={styles.secondaryButton}>Return to Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'linear-gradient(to bottom right, #bbdefb, #64b5f6)' },
  card: { background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', minWidth: 520 },
  title: { color: '#1976d2', marginBottom: 12 },
  section: { marginBottom: 12 },
  input: { display: 'block', marginBottom: 8, padding: 8, width: '100%' },
  button: { backgroundColor: '#1976d2', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' },
  secondaryButton: { width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #1976d2', backgroundColor: '#fff', color: '#1976d2', fontSize: 16, cursor: 'pointer', marginTop: 12 },
  smallButton: { backgroundColor: '#e0e0e0', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' },
  headerRow: { display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
  fieldBox: { display: 'flex', flexDirection: 'column', flex: 1, marginRight: 8 },
  fieldLabel: { fontSize: 14, marginBottom: 6, color: '#333' },
  fieldInput: { padding: 8, borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff7043', color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' },
  tableHeader: { display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #e0e0e0', marginBottom: 8 },
  courseRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  selectBlue: { backgroundColor: '#1976d2', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, minWidth: 120 },
};
