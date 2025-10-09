import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import user from "./route/user.js";

const app = express();
const port = 4040;

// Middleware
app.use(bodyParser.json());

app.use(
  cors({
    origin: "http://localhost:5173", // frontend dev server
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

// Test route
app.all("/test", (req, res) => {
  res.json({ status: 200, message: "Response from all api" });
});

// Server start
app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});

export default app;
