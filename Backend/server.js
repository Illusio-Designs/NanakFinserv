const express = require("express");
var bodyParser = require("body-parser");
const path = require("path");
const fileUpload = require("express-fileupload");
var cors = require("cors");
const dotenvParseVariables = require("dotenv-parse-variables");
const { sequelize } = require("./app/models/index");
const userRoutes = require("./app/routes/users.routes");
const authRoutes = require("./src/modules/auth/auth.routes");
const fs = require("fs");
const alterTables = require("./app/config/db.migration");

let env = require("dotenv").config();
env = dotenvParseVariables(env.parsed);

const app = express();

// Middleware to handle file uploads
app.use(
  fileUpload({
    useTempFiles: false, // Use in-memory files instead of temporary files
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  })
);

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Ensure the app/uploads directory exists
const appUploadsDir = path.join(__dirname, "app", "uploads");
if (!fs.existsSync(appUploadsDir)) {
  fs.mkdirSync(appUploadsDir);
}

app.use("/uploads", express.static(uploadsDir));
app.use("/public/uploads", express.static(uploadsDir));
// Also serve files from app/uploads directory
app.use("/uploads", express.static(appUploadsDir));

const allowedOrigins = [
  "http://localhost:3000",
  "https://nanakfinserv.com",
  "https://www.nanakfinserv.com",
  "http://nanakfinserv.com",
  "http://www.nanakfinserv.com",
  "http://localhost:3001",
  "https://api.nanakfinserv.com",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS Request from origin:", origin);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        console.log("CORS: Origin allowed");
        return callback(null, true);
      } else {
        console.log("CORS: Origin blocked:", origin);
        console.log("Allowed origins:", allowedOrigins);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add basic request logging
app.use((req, res, next) => {
  console.log(`📥 [SERVER] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Error handling for invalid JSON payloads
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Invalid JSON payload:", err);
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Stack trace:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const db = require("./app/models/index");

// Sync database and run migrations
const initializeDatabase = async () => {
  try {
    // Skip date fix to avoid errors
    console.log("Skipping date fix to avoid database errors...");
    
    // Sync all models - temporarily disable alter to avoid index issues
    // await db.sequelize.sync({ alter: false });
    console.log("Database sync temporarily disabled to avoid date issues");

    // Run table alterations for new fields only
    console.log("Running table alterations for new fields...");
    await alterTables();
    console.log("Table alterations completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    // Continue with server startup even if database sync fails
    console.log("Continuing with server startup despite database sync issues...");
  }
};

// Date fix function removed to avoid database errors

// Health check route
app.get("/health", (req, res) => {
  res.json({ message: "Welcome to NanakFinserv API!" });
});

// API routes
app.get("/api", (req, res) => {
  res.json({ message: "API is running!" });
});
// Auth module routes (login / OTP verify / ping) — mounted before the legacy
// user routes as part of the incremental migration to per-domain modules.
app.use("/api", authRoutes);
app.use("/api", userRoutes);
const PORT = process.env.PORT;

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔍 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  });
}).catch((error) => {
  console.error("Failed to initialize database:", error);
  // Start server anyway, even if database initialization fails
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT} (with database issues)`);
    console.log(`🔍 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  });
});
