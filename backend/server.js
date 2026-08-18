import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import './jobs/statusUpdate.js';
import apiRoutes from "./routes/index.js";
dotenv.config();

const DEFAULT_PORT = Number(process.env.PORT);
const DEFAULT_HOST = process.env.HOST;
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false,
  contentSecurityPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL;

app.use(cors({
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));


const startServer = async (port = DEFAULT_PORT) => {
  try {
    await connectDB();

    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`\n🚀 Server running on http://${DEFAULT_HOST}:${port}`);
        resolve(server);
      });
    });
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
};

startServer();