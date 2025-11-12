import "dotenv/config";
import { createTransport } from "nodemailer";

// Support both new and legacy env var names for backwards compatibility
const SMTP_USER = process.env.SMTP_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || process.env.EMAIL;
const SMTP_PASS = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWD;

let transport = null;
if (SMTP_USER && SMTP_PASS) {
  transport = createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || false,
    requireTLS: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn("SMTP not configured (no SMTP_EMAIL/EMAIL_USER or SMTP_PASSWORD/EMAIL_PASS). Email sending will fail until configured.");
}

/**
 * Sends an email using the configured SMTP transporter.
 * Throws if no transporter is configured.
 *
 * @param {string} email
 * @param {string} mailSubject
 * @param {string} body
 */
export async function sendEmail(email, mailSubject, body) {
  if (!transport) {
    const msg = "SMTP transporter is not configured. Check SMTP_EMAIL / SMTP_PASSWORD env vars.";
    console.warn(msg);
    // Keep behavior consistent: throw so callers can catch and continue if they expect failures
    throw new Error(msg);
  }

  const mailOptions = {
    from: SMTP_USER,
    to: email,
    subject: mailSubject,
    html: body,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    if (process.env.NODE_ENV !== "production") {
      console.log("Email sent:", info && info.response ? info.response : info);
    }
    return info;
  } catch (err) {
    console.error("Error sending email:", err && err.message ? err.message : err);
    throw err;
  }
}
