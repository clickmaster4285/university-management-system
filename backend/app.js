// backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import departmentRoutes from "./routes/department.routes.js";
import courseRoutes from "./routes/course.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import admissionRoutes from "./routes/admission.routes.js"; 
import assignmentRoutes from './routes/assignment.routes.js';
import examRoutes from './routes/exam.routes.js';
import bookRoutes from './routes/book.routes.js';
import transportRoutes from './routes/transport.routes.js';
import eventRoutes from './routes/event.routes.js';
import feeRoutes from './routes/fee.routes.js';
import feeStructureRoutes from './routes/feeStructure.routes.js';
import financeRoutes from './routes/finance.routes.js';
import hrRoutes from './routes/hr.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import authRoutes from './routes/auth.routes.js';
import academicSessionRoutes from './routes/academicSession.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import batchRoutes from './routes/batch.routes.js';
import universityRoutes from "./routes/university.routes.js"; // Fixed: Added routes/ prefix
import settingsRoutes from './routes/settings.routes.js';
import reportRoutes from './routes/report.routes.js';
import campusRoutes from "./routes/campus.routes.js";
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false,
  contentSecurityPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

// CORS debug middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  next();
});

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Test endpoint for CORS
app.options('/api/*', cors());

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Campus Compass backend is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.MONGODB_URI ? 'MongoDB Connected' : 'MongoDB Not Connected',
    allowedOrigins: allowedOrigins,
    endpoints: {
      universities: {
        base: "/api/universities",
        methods: ["POST", "GET", "GET/:id", "GET/code/:code", "GET/:id/stats", "PUT/:id", "DELETE/:id", "GET/check-code/:code"]
      },
      students: {
        base: "/api/students",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "POST/bulk", "GET/stats"]
      },
      teachers: {
        base: "/api/teachers",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "POST/bulk", "GET/stats"]
      },
      departments: {
        base: "/api/departments",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "GET/stats"]
      },
      courses: {
        base: "/api/courses",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      attendance: {
        base: "/api/attendance",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      admissions: {
        base: "/api/admissions",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "PATCH/:id/status", "GET/stats/summary", "GET/program/:program", "GET/by-date"]
      },
      assignments: {
        base: "/api/assignments",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      exams: {
        base: "/api/exams",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      books: {
        base: "/api/books",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      transport: {
        base: "/api/transport",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      events: {
        base: "/api/events",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      fees: {
        base: "/api/fees",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      "fee-structures": {
        base: "/api/fee-structures",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      finance: {
        base: "/api/finance",
        methods: ["GET", "GET/summary", "PUT/monthly", "POST/invoices", "PUT/invoices/:invoiceId", "DELETE/invoices/:invoiceId", "PUT/budget"]
      },
      hr: {
        base: "/api/hr",
        methods: {
          employees: ["GET", "GET/stats", "GET/:id", "POST", "PUT/:id", "DELETE/:id"],
          leaves: ["GET", "GET/stats", "GET/employees-on-leave", "GET/:id", "POST", "PUT/:id", "PUT/:id/status", "DELETE/:id", "POST/daily-update"],
          payroll: ["GET", "GET/stats", "POST", "PUT/:id", "DELETE/:id"],
          recruitment: ["GET", "GET/stats", "POST", "PUT/:id", "DELETE/:id"]
        }
      },
      auth: {
        base: "/api/auth",
        methods: ["POST/login", "POST/register", "POST/logout", "POST/refresh-token", "POST/forgot-password", "POST/reset-password"]
      },
      "academic-sessions": {
        base: "/api/academic-sessions",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      semesters: {
        base: "/api/semesters",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      batches: {
        base: "/api/batches",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      settings: {
        base: "/api/settings",
        methods: ["GET", "PUT"]
      },
      reports: {
        base: "/api/reports",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id"]
      },
      dashboard: {
        base: "/api/dashboard",
        methods: ["GET"]
      },
      notifications: {
        base: "/api/notifications",
        methods: ["GET", "POST", "GET/:id", "PUT/:id/read", "DELETE/:id"]
      }
    },
    docs: "Use Postman to test the API endpoints"
  });
});

// Health check with database status
app.get("/health", async (req, res) => {
  try {
    let dbStatus = 'Not Connected';
    let dbName = 'N/A';
    
    try {
      const mongoose = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        dbStatus = 'Connected';
        dbName = mongoose.connection.name || 'N/A';
      }
    } catch (err) {
      // mongoose not installed or not connected
    }

    res.json({
      success: true,
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: dbName
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      cors: {
        allowedOrigins: allowedOrigins
      },
      endpoints: {
        universities: "/api/universities",
        admissions: "/api/admissions",
        students: "/api/students",
        teachers: "/api/teachers",
        departments: "/api/departments",
        courses: "/api/courses",
        attendance: "/api/attendance",
        assignments: "/api/assignments",
        exams: "/api/exams",
        books: "/api/books",
        transport: "/api/transport",
        events: "/api/events",
        fees: "/api/fees",
        "fee-structures": "/api/fee-structures",
        finance: "/api/finance",
        hr: "/api/hr",
        auth: "/api/auth",
        "academic-sessions": "/api/academic-sessions",
        semesters: "/api/semesters",
        batches: "/api/batches",
        settings: "/api/settings",
        reports: "/api/reports",
        dashboard: "/api/dashboard",
        notifications: "/api/notifications"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      error: error.message
    });
  }
});

// Test CORS endpoint
app.get("/test-cors", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    origin: req.headers.origin || 'No origin',
    headers: req.headers
  });
});

// Echo endpoint for debugging
app.post("/api/echo", (req, res) => {
  res.json({
    success: true,
    message: "Echo received",
    data: req.body,
    headers: req.headers
  });
});

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admissions", admissionRoutes); 
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academic-sessions', academicSessionRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/batches', batchRoutes);
app.use("/api/universities", universityRoutes); 
app.use("/api/campuses", campusRoutes);
// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Global Error Handler - Must be last
app.use(errorHandler);

export default app;