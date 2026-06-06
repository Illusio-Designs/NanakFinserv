const express = require("express");
var bodyParser = require("body-parser");
const path = require("path");
const fileUpload = require("express-fileupload");
var cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const dotenvParseVariables = require("dotenv-parse-variables");
const { sequelize } = require("./app/models/index");
const apiRoutes = require("./src/routes");
const fs = require("fs");
const logger = require("./src/config/logger");

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

// Prometheus metrics: record every request, expose /metrics.
const { metricsMiddleware, metricsHandler } = require("./src/config/metrics");
app.use(metricsMiddleware);
app.get("/metrics", metricsHandler);

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

// Access control: blog images are public; all other uploaded files (customer
// documents) require a valid JWT (header or ?token=).
const uploadsAccess = require("./src/middleware/uploadsAccess");
app.use("/uploads", uploadsAccess, express.static(uploadsDir));
app.use("/public/uploads", uploadsAccess, express.static(uploadsDir));
// Also serve files from app/uploads directory
app.use("/uploads", uploadsAccess, express.static(appUploadsDir));

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
app.use(cookieParser());

// Request logging (debug level so it can be silenced in production via LOG_LEVEL)
app.use((req, res, next) => {
  logger.debug({ method: req.method, path: req.path }, "request");
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

// Verify the DB connection, then auto-sync the schema. Fail-fast: if the
// database is unreachable we must NOT start serving traffic.
//
// Schema management is automatic on boot via sequelize.sync({ alter: true }):
// missing tables are created and existing tables are altered to match the
// current models. Set DB_SYNC=off to disable (e.g. to fall back to manual
// `npm run db:migrate`).
const initializeDatabase = async () => {
  await db.sequelize.authenticate(); // throws if the DB is unreachable
  logger.info("Database connection established");

  const fs = require("fs");
  const path = require("path");
  // Persist any DB-init error to a stable file too — the host rotates stderr.log
  // away, so this is the reliable place to read what went wrong (via FTP).
  const errFile = path.join(__dirname, "tmp", "db-init-error.log");
  const recordErr = (label, err) => {
    const msg = `[${new Date().toISOString()}] ${label}: ${err && err.stack ? err.stack : err}\n`;
    try { fs.appendFileSync(errFile, msg); } catch (e) { /* ignore */ }
    logger.error({ err }, label);
  };

  if (process.env.DB_SYNC !== "off") {
    // One-time hard reset: drop & recreate every table. Needed when column types
    // change in ways `alter` can't handle (e.g. INT primary keys -> UUID).
    // Triggered by DB_SYNC=force OR the presence of tmp/force-sync.once.
    const forceFlag = path.join(__dirname, "tmp", "force-sync.once");
    const force = process.env.DB_SYNC === "force" || fs.existsSync(forceFlag);

    // IMPORTANT: consume the flag BEFORE doing the heavy work. If the drop/sync
    // crashes or times out, we must NOT retry it on every boot (that would loop
    // and keep the app down). One attempt only.
    if (force && process.env.DB_SYNC !== "force") {
      try { fs.unlinkSync(forceFlag); } catch (e) { /* may not exist */ }
    }

    // Best-effort: schema problems are logged but must NOT stop the server from
    // starting — otherwise we get a 503 with no way to read the error.
    try {
      if (force) {
        await db.sequelize.getQueryInterface().dropAllTables(); // disables FK checks internally
        await db.sequelize.sync(); // recreate all tables fresh
        logger.warn("Database schema RECREATED (force) — all tables dropped & rebuilt");
        try { fs.appendFileSync(errFile, `[${new Date().toISOString()}] OK: schema recreated\n`); } catch (e) {}
      } else {
        await db.sequelize.sync({ alter: true });
        logger.info("Database schema synced (alter: true)");
      }
    } catch (err) {
      recordErr("Schema sync failed (server still starting)", err);
    }
  }

  // Seed default data (lookup tables + default admin user). Best-effort.
  if (process.env.SEED_DEFAULTS !== "off") {
    try {
      const { seedDefaults } = require("./src/bootstrap/seedDefaults");
      await seedDefaults(logger);
      try { fs.appendFileSync(errFile, `[${new Date().toISOString()}] OK: seed complete\n`); } catch (e) {}
    } catch (err) {
      recordErr("Default seeding failed", err);
    }
  }
};

// Liveness: process is up.
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Readiness: can we reach the database? (for load-balancer / k8s probes)
app.get("/ready", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ status: "ready" });
  } catch (e) {
    logger.warn({ err: e }, "Readiness check failed");
    res.status(503).json({ status: "not-ready" });
  }
});

// API routes
app.get("/api", (req, res) => {
  res.json({ message: "API is running!" });
});
// All API routes, split into per-domain modules under src/modules and
// aggregated in src/routes/index.js (replaces the legacy users.routes.js).
app.use("/api", apiRoutes);

// Unmatched routes -> JSON 404 (instead of Express' default HTML page).
app.use((req, res) => {
  res.status(404).json({ message: "Not found", status: false });
});

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
  logger.error({ err, path: req.path }, "Unhandled error");
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT;

// Initialize database, then start the server. Fail-fast on DB errors.
initializeDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, "Server is running");
    });

    // Graceful shutdown.
    const shutdown = (signal) => {
      logger.info({ signal }, "Shutting down");
      server.close(() => {
        db.sequelize.close().finally(() => process.exit(0));
      });
      // Force-exit if connections don't drain in time.
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((error) => {
    logger.fatal({ err: error }, "Failed to connect to the database; exiting");
    process.exit(1);
  });
