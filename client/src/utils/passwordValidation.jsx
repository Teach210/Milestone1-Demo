// Password validation helper
export function validatePassword(password) {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const allValid = Object.values(checks).every(v => v);

  return { checks, isValid: allValid };
}

// Password strength indicator component (can be used inline)
export function PasswordRequirements({ password }) {
  const { checks } = validatePassword(password);

  const requirements = [
    { label: 'At least 8 characters', met: checks.minLength },
    { label: 'One uppercase letter (A-Z)', met: checks.hasUppercase },
    { label: 'One lowercase letter (a-z)', met: checks.hasLowercase },
    { label: 'One number (0-9)', met: checks.hasNumber },
    { label: 'One special character (!@#$%...)', met: checks.hasSpecial }
  ];

  return (
    <div style={styles.requirementsBox}>
      <p style={styles.requirementsTitle}>Password must contain:</p>
      <ul style={styles.requirementsList}>
        {requirements.map((req, idx) => (
          <li
            key={idx}
            style={{
              ...styles.requirement,
              color: req.met ? '#4caf50' : '#666'
            }}
          >
            <span style={{ marginRight: '8px' }}>
              {req.met ? '✓' : '○'}
            </span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  requirementsBox: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    textAlign: 'left',
    fontSize: '14px'
  },
  requirementsTitle: {
    margin: '0 0 8px 0',
    fontWeight: '600',
    color: '#333'
  },
  requirementsList: {
    margin: 0,
    paddingLeft: '20px',
    listStyle: 'none'
  },
  requirement: {
    marginBottom: '5px',
    transition: 'color 0.2s ease'
  }
};
