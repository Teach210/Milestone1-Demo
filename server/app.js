import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import user from "./route/user.js";
import advising from "./route/advising.js";
import { connection } from "./database/connection.js";
import { hashPassword } from "./utils/helper.js";

const app = express();
const port = 4040;

// Middleware
app.use(bodyParser.json());

// Allow both local dev and deployed frontend
const allowedOrigins = [
  "http://localhost:5173", // local dev
  process.env.FRONTEND_URL || "https://course-advising-4040.web.app" // deployed
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error('Not allowed by CORS'), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/user", user);
app.use("/advising", advising);

// Test route
app.all("/test", (req, res) => {
  res.json({ status: 200, message: "Response from all api" });
});

// Server start
app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});

// Ensure a single admin user exists on startup
const ensureAdmin = () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminFirst = process.env.ADMIN_FIRSTNAME || "Admin";
  const adminLast = process.env.ADMIN_LASTNAME || "User";

  const query = "SELECT * FROM user_info WHERE is_admin = 1 LIMIT 1";
  connection.execute(query, [], (err, result) => {
    if (err) return console.error("Error checking admin user:", err.message);
    if (result.length > 0) return console.log("Admin user already exists.");

    // If no admin, insert one
    const hashed = hashPassword(adminPassword);
    const insert = `INSERT INTO user_info (u_firstname, u_lastname, u_email, u_password, is_verified, verification_token, is_admin) VALUES (?, ?, ?, ?, 1, NULL, 1)`;
    connection.execute(insert, [adminFirst, adminLast, adminEmail, hashed], (err2) => {
      if (err2) return console.error("Error creating admin user:", err2.message);
      console.log(`Admin user created: ${adminEmail}`);
    });
  });
};

ensureAdmin();

export default app;
