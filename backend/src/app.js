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

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false, // Disable for development
  // Disable content security policy for development
  contentSecurityPolicy: false,
}));

// ✅ IMPROVED CORS configuration
const allowedOrigins = process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(null, true); // Allow all in development
      // In production, use:
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// ✅ Add CORS debug middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  next();
});

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (optional)
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ✅ ADDED: Test endpoint to check CORS
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
      students: {
        base: "/api/students",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "POST/bulk", "GET/stats"]
      },
      teachers: {
        base: "/api/teachers",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "POST/bulk", "GET/stats"]
      },
      admissions: { // ✅ ADDED
        base: "/api/admissions",
        methods: ["GET", "POST", "GET/:id", "PUT/:id", "DELETE/:id", "PATCH/:id/status", "GET/stats/summary", "GET/program/:program", "GET/by-date"]
      }
    },
    docs: "Use Postman to test the API endpoints"
  });
});

// Health check with database status
app.get("/health", async (req, res) => {
  try {
    // Check database connection if mongoose is available
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
      endpoints: { // ✅ ADDED
        admissions: "/api/admissions",
        students: "/api/students"
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

// ✅ ADDED: Test CORS endpoint
app.get("/test-cors", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    origin: req.headers.origin || 'No origin',
    headers: req.headers
  });
});

// ✅ ADDED: Echo endpoint for debugging
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
// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Global Error Handler - Must be last
app.use(errorHandler);

export default app;