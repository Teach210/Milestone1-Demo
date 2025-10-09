// Load environment variables from .env file
import "dotenv/config";
import { createTransport } from "nodemailer";

/**
 * Sends an email using SMTP (Gmail in this case)
 * 
 * @param {string} email - Recipient's email address
 * @param {string} mailSubject - Subject of the email
 * @param {string} body - HTML content of the email
 */
export async function sendEmail(email, mailSubject, body) {
  try {
    // Create a transporter object using SMTP transport
    const transport = createTransport({
      host: "smtp.gmail.com",    // Gmail SMTP server
      port: 587,                 // TLS port for Gmail
      secure: false,             // Use TLS, not SSL
      requireTLS: true,          // Force TLS
      auth: {
        user: process.env.SMTP_EMAIL,     // Fixed typo
        pass: process.env.SMTP_PASSWORD,  // Your Gmail app password
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.SMTP_EMAIL, // Sender address
      to: email,                    // Recipient email
      subject: mailSubject,         // Email subject
      html: body,                   // Email body as HTML
    };

    // Send the email
    const info = await transport.sendMail(mailOptions);
    console.log("Email has been sent:", info.response);
    return info;
  } catch (err) {
    console.error("Error in sending email:", err.message);
    throw err; // so the calling function can handle it
  }
}
