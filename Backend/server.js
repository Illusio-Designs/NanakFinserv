const express = require("express");
var bodyParser = require("body-parser");
const path = require("path");
const fileUpload = require("express-fileupload");
var cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenvParseVariables = require("dotenv-parse-variables");
const { sequelize } = require("./app/models/index");
const apiRoutes = require("./src/routes");
const fs = require("fs");
const alterTables = require("./app/config/db.migration");

let env = require("dotenv").config();
env = dotenvParseVariables(env.parsed);

const app = express();

// Security headers. This API serves file downloads to a separate frontend
// origin, so allow cross-origin resource loading and skip COEP/CSP (this is a
// JSON+files API, not an HTML app).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// Behind a proxy/load balancer (needed for correct client IPs in rate limiting)
app.set("trust proxy", 1);

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

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser clients (no Origin header) and whitelisted origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "token"],
  credentials: true,
};

// Apply the SAME options to preflight requests (the previous `cors()` wildcard
// reflected every origin and defeated the allow-list).
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add basic request logging
app.use((req, res, next) => {
  console.log(`📥 [SERVER] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rate limiting: a general cap for the whole API, and a stricter cap on the
// login endpoint to blunt OTP/credential brute-forcing.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later.", status: false },
});

app.use("/api/user/login", loginLimiter);
app.use("/api", apiLimiter);

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
// All API routes, split into per-domain modules under src/modules and
// aggregated in src/routes/index.js (replaces the legacy users.routes.js).
app.use("/api", apiRoutes);

// ── Error handlers (must be registered AFTER all routes) ──────────────────
// Invalid JSON payloads from body-parser.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  return next(err);
});

// CORS rejections -> 403 rather than a generic 500.
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed", status: false });
  }
  return next(err);
});

// Catch-all: log server-side, return a safe message to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Stack trace:", err && err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

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
