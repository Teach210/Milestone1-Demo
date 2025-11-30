import { Router } from "express";
import { connection } from "../database/connection.js";
import { hashPassword, comparePassword } from "../utils/helper.js";
import { sendEmail } from "../utils/sendmail.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
// NOTE: email sending is handled by ../utils/sendmail.js
// transporter removed to centralize email logic in the sendmail helper

const user = Router();

// In-memory two-factor store: userId -> { code, expiresAt }
const twoFactorStore = new Map();

function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// --------- Registration ----------
user.post("/register", (req, res) => {
  const { u_firstname, u_lastname, u_email, u_password } = req.body;

  if (!u_firstname || !u_lastname || !u_email || !u_password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const queryCheck = "SELECT * FROM user_info WHERE u_email = ?";
  connection.execute(queryCheck, [u_email], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length > 0)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = hashPassword(u_password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const queryInsert = `
      INSERT INTO user_info 
      (u_firstname, u_lastname, u_email, u_password, is_verified, verification_token, is_admin)
      VALUES (?, ?, ?, ?, 0, ?, 0)
    `;
    connection.execute(
      queryInsert,
      [u_firstname, u_lastname, u_email, hashedPassword, verificationToken],
      async (error, result) => {
        if (error) return res.status(500).json({ message: error.message });

        // Send verification email (don't let email failures prevent registration)
        const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4040';
        const verificationLink = `${BACKEND_URL}/user/verify?token=${verificationToken}`;
        const subject = "Verify your email";
        const htmlBody = `<p>Hi ${u_firstname},</p>
          <p>Click the link below to verify your account:</p>
          <a href="${verificationLink}">Verify Email</a>`;

        try {
          await sendEmail(u_email, subject, htmlBody);
        } catch (emailErr) {
          console.error('Registration email error:', emailErr && emailErr.message ? emailErr.message : emailErr);
          // continue — registration succeeded in DB, but email failed to send
        }

        return res.status(201).json({
          status: "success",
          message: "Registration successful! Please verify your email.",
        });
      }
    );
  });
});

// --------- Email Verification ----------
user.get("/verify", (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send("Verification token is missing");

  const query = "SELECT * FROM user_info WHERE verification_token = ?";
  connection.execute(query, [token], (err, result) => {
    if (err) return res.status(500).send("Database error");
    if (result.length === 0)
      return res.status(400).send("Invalid or expired verification token");

    const userEmail = result[0].u_email;
    const userFirstName = result[0].u_firstname;

    const updateQuery =
      "UPDATE user_info SET is_verified = 1, verification_token = NULL WHERE verification_token = ?";
    connection.execute(updateQuery, [token], async (err) => {
      if (err) return res.status(500).send("Database error");

      // 🎉 Send verification success email
        try {
        await sendEmail(
          userEmail,
          "Your Email Has Been Verified!",
          `
          <h2>Congratulations, ${userFirstName}!</h2>
          <p>Your email has been successfully verified.</p>
          <p>You may now log in using your account credentials.</p>
        `
        );

        // Redirect to login page
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${FRONTEND_URL}/login`);      } catch (emailErr) {
        console.error("EMAIL SEND ERROR:", emailErr);
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.send(`
          <h2>Your account is verified, but we couldn't send a confirmation email.</h2>
          <p>You can still <a href="${FRONTEND_URL}/login">log in</a> now.</p>
        `);
      }
    });
  });
});



// --------- Login ----------
user.post("/login", async (req, res) => {
  const { email, password } = req.body;

  connection.execute(
    "SELECT * FROM user_info WHERE u_email = ?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0)
        return res.status(401).json({ message: "Invalid email or password" });

      const user = result[0];

      if (!user.is_verified)
        return res
          .status(403)
          .json({ message: "Please verify your email first" });

      const isMatch = await bcrypt.compare(password, user.u_password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid email or password" });

      // Generate and send 2FA code via email instead of completing login immediately
      const code = generate2FACode();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      twoFactorStore.set(user.u_id, { code, expiresAt });

      const subject = "Your login verification code";
      const htmlBody = `<p>Your verification code is <strong>${code}</strong>. It will expire in 5 minutes.</p>`;
      // Development: also log the code to the server console so devs can see it when email is not available
      if (process.env.NODE_ENV !== "production") {
        console.log(`2FA code for ${user.u_email} (id ${user.u_id}): ${code}`);
      }
      try {
        await sendEmail(user.u_email, subject, htmlBody);
      } catch (emailErr) {
        console.error("2FA EMAIL ERROR:", emailErr);
        // don't reveal email error details to client
      }

      // Tell client that 2FA is required and return the user id so client can verify
      return res.status(200).json({ status: "2fa_required", message: "2FA code sent", userId: user.u_id, email: user.u_email });
    }
  );
});

// Verify 2FA code
user.post("/verify-2fa", (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ message: "userId and code are required" });

  const record = twoFactorStore.get(Number(userId));
  if (!record) return res.status(401).json({ message: "No pending 2FA for this user" });
  if (Date.now() > record.expiresAt) {
    twoFactorStore.delete(Number(userId));
    return res.status(401).json({ message: "2FA code expired" });
  }

  if (record.code !== String(code).trim()) {
    return res.status(401).json({ message: "Invalid 2FA code" });
  }

  // Verified - cleanup and return full user object so client can finish login
  twoFactorStore.delete(Number(userId));
  connection.execute("SELECT * FROM user_info WHERE u_id = ?", [userId], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ status: "success", message: "2FA verified", result: result[0] });
  });
});

// Resend 2FA code
user.post("/resend-2fa", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  connection.execute("SELECT * FROM user_info WHERE u_id = ?", [userId], async (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: "User not found" });
    const user = result[0];
    const code = generate2FACode();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    twoFactorStore.set(user.u_id, { code, expiresAt });
    const subject = "Your login verification code (resend)";
    const htmlBody = `<p>Your verification code is <strong>${code}</strong>. It will expire in 5 minutes.</p>`;
    if (process.env.NODE_ENV !== "production") {
      console.log(`2FA code (resend) for ${user.u_email} (id ${user.u_id}): ${code}`);
    }
    try {
      await sendEmail(user.u_email, subject, htmlBody);
      return res.json({ status: "ok", message: "2FA code resent" });
    } catch (emailErr) {
      console.error("2FA RESEND EMAIL ERROR:", emailErr);
      return res.status(500).json({ message: "Failed to send code" });
    }
  });
});


// --------- Get all users ----------
user.get("/", (req, res) => {
  connection.execute("SELECT * FROM user_info", (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ status: 200, result });
  });
});

// --------- Get user by ID ----------
user.get("/:id", (req, res) => {
  const query = "SELECT * FROM user_info WHERE u_id = ?";
  connection.execute(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ status: 200, result: result[0] });
  });
});

// --------- Get user profile (returns user object directly) ----------
user.get("/profile/:id", (req, res) => {
  const query = "SELECT u_id, u_firstname, u_lastname, u_email, is_verified, is_admin, verification_token, reset_token FROM user_info WHERE u_id = ?";
  connection.execute(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: "User not found" });
    // return the user object directly (not wrapped)
    res.json(result[0]);
  });
});

// --------- Update user ----------
user.put("/:id", (req, res) => {
  const { u_firstname, u_lastname, u_email } = req.body;
  const query = `
    UPDATE user_info
    SET u_firstname = ?, u_lastname = ?, u_email = ?
    WHERE u_id = ?
  `;
  connection.execute(
    query,
    [u_firstname, u_lastname, u_email, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ status: 200, message: "User updated", result });
    }
  );
});

// --------- Delete user ----------
user.delete("/:id", (req, res) => {
  const query = "DELETE FROM user_info WHERE u_id = ?";
  connection.execute(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ status: 200, message: "User deleted", result });
  });
});

// --------- Forgot Password ----------
user.post("/forgot-password", async (req, res) => {
  const { u_email } = req.body;

  if (!u_email) return res.status(400).json({ message: "Email is required" });

  const query = "SELECT * FROM user_info WHERE u_email = ?";
  connection.execute(query, [u_email], async (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const updateQuery = "UPDATE user_info SET reset_token = ? WHERE u_email = ?";
    connection.execute(updateQuery, [resetToken, u_email], async (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      // Send email
      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
      const subject = "Password Reset Request";
      const htmlBody = `<p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>`;

      await sendEmail(u_email, subject, htmlBody);

      res.json({ status: "success", message: "Password reset email sent" });
    });
  });
});


// --------- Reset Password ----------
user.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ message: "Token and new password are required" });

  const query = "SELECT * FROM user_info WHERE reset_token = ?";
  connection.execute(query, [token], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = hashPassword(newPassword);

    const updateQuery = "UPDATE user_info SET u_password = ?, reset_token = NULL WHERE reset_token = ?";
    connection.execute(updateQuery, [hashedPassword, token], (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ status: "success", message: "Password has been reset" });
    });
  });
});

// --------- Change Password (After Login) ----------
user.post("/change-password/:id", (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both current and new passwords are required." });
  }

  // Get the user from the database
  const query = "SELECT * FROM user_info WHERE u_id = ?";
  connection.execute(query, [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error: " + err.message });
    if (result.length === 0) return res.status(404).json({ message: "User not found." });

    const user = result[0];

    // Verify the current password
    const isMatch = comparePassword(currentPassword, user.u_password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Hash and update the new password
    const hashedPassword = hashPassword(newPassword);
    const updateQuery = "UPDATE user_info SET u_password = ? WHERE u_id = ?";
    connection.execute(updateQuery, [hashedPassword, userId], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error: " + err.message });

      res.json({ status: "success", message: "Password has been successfully changed." });
    });
  });
});





export default user;
