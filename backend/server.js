import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { execSync } from "node:child_process";
import connectDB from "./config/database.js";
import "./jobs/statusUpdate.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
const DEFAULT_PORT = Number(process.env.PORT) || 5010;
const DEFAULT_HOST = process.env.HOST === "localhost" ? "127.0.0.1" : (process.env.HOST || "127.0.0.1");

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const getPortPids = (port) => {
  if (process.platform !== "win32") {
    return [];
  }

  try {
    const output = execSync(
      `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique 2>$null`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );

    return [...new Set(
      output
        .split(/\s+/)
        .map((value) => Number(value.trim()))
        .filter((pid) => Number.isFinite(pid) && pid > 0 && pid !== process.pid)
    )];
  } catch {
    return [];
  }
};

const isPortInUse = (port) => getPortPids(port).length > 0;

const killStaleProcessOnPort = (port) => {
  if (process.platform !== "win32") return false;

  const pids = getPortPids(port);
  let killed = false;

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
      killed = true;
      console.warn(`🧹 Stale process ${pid} on port ${port} was terminated.`);
    } catch {
      // Ignore access issues on unrelated system processes.
    }
  }

  return killed;
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
    contentSecurityPolicy: false,
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (NODE_ENV === "development" && process.env.ALLOW_ALL_ORIGINS === "true") {
        return callback(null, true);
      }

      console.error(`❌ CORS blocked: ${origin} (${NODE_ENV})`);
      return callback(new Error(`CORS policy: ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400,
  })
);

app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await connectDB();

    const port = DEFAULT_PORT;
    const host = DEFAULT_HOST;

    const listen = () => {
      const server = app.listen(port, host, () => {
        console.log(`\n🚀 Server running on http://${host}:${port}`);
        console.log(`📦 Environment: ${NODE_ENV}`);
        console.log(`❤️  Health: http://${host}:${port}/health\n`);
      });

      server.on("error", async (error) => {
        if (error.code === "EADDRINUSE") {
          const pids = getPortPids(port);

          if (process.platform === "win32" && pids.length > 0) {
            console.warn(`⚠️ Port ${port} is in use. Clearing stale process...`);
            const cleaned = killStaleProcessOnPort(port);

            if (cleaned) {
              await new Promise((resolve) => setTimeout(resolve, 400));
              listen();
              return;
            }
          }

          console.error(`❌ Port ${port} is already in use. Stop the existing process or change PORT.`);
          process.exit(1);
        } else {
          console.error("❌ Server error:", error.message);
          process.exit(1);
        }
      });
    };

    if (isPortInUse(port)) {
      console.warn(`⚠️ Port ${port} is in use. Clearing stale process...`);
      const cleaned = killStaleProcessOnPort(port);

      if (!cleaned) {
        console.error(`❌ Port ${port} is already in use. Stop the existing process or change PORT.`);
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    listen();
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();