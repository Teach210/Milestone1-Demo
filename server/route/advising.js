import { Router } from "express";
import { connection } from "../database/connection.js";
import { sendEmail } from "../utils/sendmail.js";

const advising = Router();

// Ensure tables exist
const createEntriesTable = `
  CREATE TABLE IF NOT EXISTS advising_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_term VARCHAR(100),
    last_gpa DECIMAL(4,2),
    current_term VARCHAR(100),
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending'
  ) ENGINE=InnoDB;
`;

const createCoursesTable = `
  CREATE TABLE IF NOT EXISTS advising_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advising_id INT NOT NULL,
    course_level VARCHAR(100),
    course_name VARCHAR(255),
    FOREIGN KEY (advising_id) REFERENCES advising_entries(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
`;

connection.execute(createEntriesTable, (err) => {
  if (err) console.error("Error creating advising_entries table:", err.message);
  else console.log("advising_entries table ensured");
});
connection.execute(createCoursesTable, (err) => {
  if (err) console.error("Error creating advising_courses table:", err.message);
  else console.log("advising_courses table ensured");
});

// Add admin review columns if they don't exist (Milestone 3 Phase 2)
const addAdminColumns = () => {
  // Check if columns exist before adding
  connection.query("SHOW COLUMNS FROM advising_entries LIKE 'admin_message'", (err, result) => {
    if (!err && result.length === 0) {
      connection.execute("ALTER TABLE advising_entries ADD COLUMN admin_message TEXT", (err2) => {
        if (err2) console.error("Error adding admin_message:", err2.message);
        else console.log("Added admin_message column");
      });
    }
  });
  
  connection.query("SHOW COLUMNS FROM advising_entries LIKE 'admin_id'", (err, result) => {
    if (!err && result.length === 0) {
      connection.execute("ALTER TABLE advising_entries ADD COLUMN admin_id INT", (err2) => {
        if (err2) console.error("Error adding admin_id:", err2.message);
        else console.log("Added admin_id column");
      });
    }
  });
  
  connection.query("SHOW COLUMNS FROM advising_entries LIKE 'reviewed_at'", (err, result) => {
    if (!err && result.length === 0) {
      connection.execute("ALTER TABLE advising_entries ADD COLUMN reviewed_at DATETIME", (err2) => {
        if (err2) console.error("Error adding reviewed_at:", err2.message);
        else console.log("Added reviewed_at column");
      });
    }
  });
};

addAdminColumns();

// Create a new advising entry
advising.post("/", (req, res) => {
  const { userId, last_term, last_gpa, current_term, courses } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  const insert = `INSERT INTO advising_entries (user_id, last_term, last_gpa, current_term, status) VALUES (?, ?, ?, ?, 'Pending')`;
  connection.execute(insert, [userId, last_term || null, last_gpa || null, current_term || null], (err, result) => {
    if (err) {
      console.error('Error inserting advising entry:', err.message);
      return res.status(500).json({ message: err.message });
    }
    const advisingId = result.insertId;
    console.log(`Created advising entry ${advisingId} for user ${userId}`);

    // insert courses
    if (Array.isArray(courses) && courses.length > 0) {
      const values = courses.map(c => [advisingId, c.level, c.course_name]);
      const q = `INSERT INTO advising_courses (advising_id, course_level, course_name) VALUES ?`;
      connection.query(q, [values], (err2) => {
        if (err2) {
          console.error('Error inserting advising courses:', err2.message);
          return res.status(500).json({ message: err2.message });
        }
        console.log(`Inserted ${values.length} courses for advising ${advisingId}`);
        return res.status(201).json({ status: 'success', advisingId });
      });
    } else {
      return res.status(201).json({ status: 'success', advisingId });
    }
  });
});

// Admin endpoint: Get all advising forms with student names
advising.get('/admin/all', (req, res) => {
  const query = `
    SELECT 
      ae.id,
      ae.user_id,
      ae.created_at,
      ae.current_term,
      ae.last_term,
      ae.last_gpa,
      ae.status,
      ae.admin_message,
      ae.admin_id,
      ae.reviewed_at,
      CONCAT(ui.u_firstname, ' ', ui.u_lastname) AS student_name,
      ui.u_email AS student_email
    FROM advising_entries ae
    JOIN user_info ui ON ae.user_id = ui.u_id
    ORDER BY ae.created_at DESC
    `;
  
  connection.query(query, (err, entries) => {
    if (err) {
      console.error('Error fetching all advising entries:', err.message);
      return res.status(500).json({ message: err.message });
    }
    
    if (!entries || entries.length === 0) {
      return res.json([]);
    }
    
    // Fetch courses for all entries
    const ids = entries.map(e => e.id);
    const coursesQuery = `SELECT * FROM advising_courses WHERE advising_id IN (${ids.map(() => '?').join(',')})`;
    
    connection.execute(coursesQuery, ids, (err2, courses) => {
      if (err2) {
        console.error('Error fetching courses:', err2.message);
        return res.status(500).json({ message: err2.message });
      }
      
      // Map courses to entries
      const coursesMap = {};
      courses.forEach(c => {
        if (!coursesMap[c.advising_id]) coursesMap[c.advising_id] = [];
        coursesMap[c.advising_id].push(c);
      });
      
      const result = entries.map(entry => ({
        ...entry,
        courses: coursesMap[entry.id] || []
      }));
      
      res.json(result);
    });
  });
});// Admin endpoint: Review advising form (approve/reject)
advising.post('/:id/review', (req, res) => {
  const advisingId = req.params.id;
  const { status, admin_message, admin_id } = req.body;
  
  // Validate inputs
  if (!status || !admin_message || !admin_id) {
    return res.status(400).json({ message: 'status, admin_message, and admin_id are required' });
  }
  
  if (status !== 'Approved' && status !== 'Rejected') {
    return res.status(400).json({ message: 'status must be either "Approved" or "Rejected"' });
  }
  
  if (!admin_message.trim()) {
    return res.status(400).json({ message: 'admin_message cannot be empty' });
  }
  
  // Update advising entry
  const updateQuery = `
    UPDATE advising_entries 
    SET status = ?, admin_message = ?, admin_id = ?, reviewed_at = NOW()
    WHERE id = ?
  `;
  
  connection.execute(updateQuery, [status, admin_message, admin_id, advisingId], (err, result) => {
    if (err) {
      console.error('Error updating advising entry:', err.message);
      return res.status(500).json({ message: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Advising entry not found' });
    }
    
    // Fetch updated entry with student info and courses for email
    const detailQuery = `
      SELECT 
        ae.*,
        ui.u_email,
        ui.u_firstname,
        ui.u_lastname
      FROM advising_entries ae
      JOIN user_info ui ON ae.user_id = ui.u_id
      WHERE ae.id = ?
    `;
    
    connection.execute(detailQuery, [advisingId], (err2, rows) => {
      if (err2) {
        return res.status(500).json({ message: err2.message });
      }
      
      const entry = rows[0];
      
      // Fetch courses for email
      connection.execute('SELECT * FROM advising_courses WHERE advising_id = ?', [advisingId], (err3, courses) => {
        if (err3) {
          return res.status(500).json({ message: err3.message });
        }
        
        // Send email notification to student
        const studentEmail = entry.u_email;
        const studentName = `${entry.u_firstname} ${entry.u_lastname}`;
        const statusColor = status === 'Approved' ? '#4caf50' : '#f44336';
        
        const coursesList = courses.map(c => `<li>${c.course_level}: ${c.course_name}</li>`).join('');
        
        const emailSubject = `Course Advising Request ${status}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Course Advising Update</h2>
            <p>Hello ${studentName},</p>
            <p>Your course advising request for <strong>${entry.current_term}</strong> has been reviewed.</p>
            
            <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0;">Status: ${status}</h3>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Admin Feedback:</h4>
              <p style="margin: 0;">${admin_message}</p>
            </div>
            
            <h4>Requested Courses:</h4>
            <ul>${coursesList}</ul>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `;
        
        sendEmail(studentEmail, emailSubject, emailBody)
          .then(() => {
            console.log(`Email sent to ${studentEmail} for advising ${advisingId}`);
          })
          .catch(emailErr => {
            console.error('Error sending email:', emailErr.message);
            // Don't fail the request if email fails
          });
        
        res.json({ 
          status: 'success', 
          message: `Advising entry ${status.toLowerCase()}`,
          entry: entry
        });
      });
    });
  });
});

// Debug endpoint: list advising tables and counts
advising.get('/debug/tables', (req, res) => {
  connection.query("SHOW TABLES LIKE 'advising_%'", (err, tables) => {
    if (err) return res.status(500).json({ message: err.message });
    const names = (tables || []).map(r => Object.values(r)[0]);
    // fetch counts for each table
    const tasks = names.map(n => new Promise((resolve) => {
      connection.query(`SELECT COUNT(*) as cnt FROM ${n}`, (err2, rows) => {
        if (err2) return resolve({ table: n, error: err2.message });
        resolve({ table: n, count: rows[0].cnt });
      });
    }));
    Promise.all(tasks).then(results => res.json(results)).catch(e => res.status(500).json({ message: e.message }));
  });
});

// Debug endpoint: sample rows from advising_entries (show user_id and created_at)
advising.get('/debug/rows', (req, res) => {
  connection.query('SELECT id, user_id, created_at, current_term, last_term, status FROM advising_entries ORDER BY created_at DESC LIMIT 50', (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// Get advising history for a user
advising.get('/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const q = 'SELECT * FROM advising_entries WHERE user_id = ? ORDER BY created_at DESC';
  connection.execute(q, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows || rows.length === 0) return res.json([]);

    // fetch courses for each entry
    const ids = rows.map(r => r.id);
    const q2 = `SELECT * FROM advising_courses WHERE advising_id IN (${ids.map(()=>'?').join(',')})`;
    connection.execute(q2, ids, (err2, courses) => {
      if (err2) return res.status(500).json({ message: err2.message });
      const map = {};
      courses.forEach(c => {
        if (!map[c.advising_id]) map[c.advising_id] = [];
        map[c.advising_id].push(c);
      });
      const result = rows.map(r => ({ ...r, courses: map[r.id] || [] }));
      res.json(result);
    });
  });
});

// Get single advising entry
advising.get('/:id', (req, res) => {
  const id = req.params.id;
  const q = 'SELECT * FROM advising_entries WHERE id = ?';
  connection.execute(q, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const entry = rows[0];
    connection.execute('SELECT * FROM advising_courses WHERE advising_id = ?', [id], (err2, courses) => {
      if (err2) return res.status(500).json({ message: err2.message });
      entry.courses = courses || [];
      res.json(entry);
    });
  });
});

// Update advising entry (only if Pending)
advising.put('/:id', (req, res) => {
  const id = req.params.id;
  const { last_term, last_gpa, current_term, courses } = req.body;

  connection.execute('SELECT status FROM advising_entries WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const status = rows[0].status;
    if (status !== 'Pending') return res.status(403).json({ message: 'Only pending entries can be edited' });

    const update = 'UPDATE advising_entries SET last_term = ?, last_gpa = ?, current_term = ? WHERE id = ?';
    connection.execute(update, [last_term || null, last_gpa || null, current_term || null, id], (err2) => {
      if (err2) return res.status(500).json({ message: err2.message });

      // delete existing courses and insert new ones
      connection.execute('DELETE FROM advising_courses WHERE advising_id = ?', [id], (err3) => {
        if (err3) return res.status(500).json({ message: err3.message });
        if (Array.isArray(courses) && courses.length > 0) {
          const values = courses.map(c => [id, c.level, c.course_name]);
          const q = `INSERT INTO advising_courses (advising_id, course_level, course_name) VALUES ?`;
          connection.query(q, [values], (err4) => {
            if (err4) return res.status(500).json({ message: err4.message });
            return res.json({ status: 'success' });
          });
        } else {
          return res.json({ status: 'success' });
        }
      });
    });
  });
});

export default advising;
