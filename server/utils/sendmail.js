import "dotenv/config";
import { createTransport } from "nodemailer";

/**
 * Sends an email using SMTP (Gmail in this case)
 * 
 * @param {string} email 
 * @param {string} mailSubject 
 * @param {string} body -
 */
export async function sendEmail(email, mailSubject, body) {
  try {
    
    const transport = createTransport({
      host: "smtp.gmail.com",    
      port: 587,                 
      secure: false,            
      requireTLS: true,         
      auth: {
        user: process.env.SMTP_EMAIL,    
        pass: process.env.SMTP_PASSWORD,  
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.SMTP_EMAIL, 
      to: email,                    
      subject: mailSubject,        
      html: body,                   
    };

    // Send the email
    const info = await transport.sendMail(mailOptions);
    console.log("Email has been sent:", info.response);
    return info;
  } catch (err) {
    console.error("Error in sending email:", err.message);
    throw err; 
  }
}
