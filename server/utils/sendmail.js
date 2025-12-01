import "dotenv/config";
import sgMail from "@sendgrid/mail";

// Use SendGrid REST API instead of SMTP to avoid port blocking issues on cloud platforms
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
const FROM_EMAIL = process.env.SMTP_EMAIL || process.env.EMAIL_USER || "noreply@example.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("SendGrid API configured");
} else {
  console.warn("SendGrid API key not configured. Set SENDGRID_API_KEY or SMTP_PASSWORD env var. Email sending will fail.");
}

/**
 * Sends an email using SendGrid REST API.
 * Throws if API key is not configured or if sending fails.
 *
 * @param {string} email - Recipient email address
 * @param {string} mailSubject - Email subject
 * @param {string} body - HTML email body
 */
export async function sendEmail(email, mailSubject, body) {
  if (!SENDGRID_API_KEY) {
    const msg = "SendGrid API key is not configured. Check SENDGRID_API_KEY or SMTP_PASSWORD env var.";
    console.warn(msg);
    throw new Error(msg);
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: mailSubject,
    html: body,
  };

  try {
    const response = await sgMail.send(msg);
    if (process.env.NODE_ENV !== "production") {
      console.log("Email sent via SendGrid:", response[0].statusCode);
    }
    return response;
  } catch (err) {
    console.error("Error sending email via SendGrid:", err && err.message ? err.message : err);
    if (err.response) {
      console.error("SendGrid error details:", err.response.body);
    }
    throw err;
  }
}
