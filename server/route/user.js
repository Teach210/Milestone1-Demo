import { Router } from "express";
import { connection } from "../database/connection.js";
import { hashPassword, comparePassword } from "../utils/helper.js";
import { sendEmail } from "../utils/sendmail.js";
import crypto from "crypto";

const user = Router();

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

        // Send verification email
        const verificationLink = `http://localhost:4040/user/verify?token=${verificationToken}`;
        const subject = "Verify your email";
        const htmlBody = `<p>Hi ${u_firstname},</p>
          <p>Click the link below to verify your account:</p>
          <a href="${verificationLink}">Verify Email</a>`;
        await sendEmail(u_email, subject, htmlBody);

        res.status(201).json({
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

    const updateQuery =
      "UPDATE user_info SET is_verified = 1, verification_token = NULL WHERE verification_token = ?";
    connection.execute(updateQuery, [token], (err, result) => {
      if (err) return res.status(500).send("Database error");

      res.send(
        "Your account has been successfully verified! You can now log in."
      );
    });
  });
});

// --------- Login ----------
user.post("/login", (req, res) => {
  const { Email, Password } = req.body;

  connection.execute(
    "SELECT * FROM user_info WHERE u_email = ?",
    [Email],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0)
        return res.status(401).json({ message: "Invalid email or password" });

      const user = result[0];
      if (!user.is_verified)
        return res
          .status(403)
          .json({ message: "Please verify your email first" });

      const isMatch = comparePassword(Password, user.u_password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid email or password" });

      res
        .status(200)
        .json({ status: "success", message: "Login successful", result: user });
    }
  );
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
      const resetLink = `http://localhost:5173/resetPassword.html?token=${resetToken}`;
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
