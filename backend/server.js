import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { seedDefaultAdmin } from './scripts/seed.js';
import { seedCourses } from './scripts/seedCourses.js';
import apiRoutes from './routes/index.js';
import './jobs/statusUpdate.js';

dotenv.config();

const port = Number(process.env.PORT);
const host = process.env.HOST;
const allowedOrigins = (process.env.FRONTEND_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    await seedDefaultAdmin();
    await seedCourses();

    app.listen(port, host, () => {
      console.log(`🚀 Server running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error(`❌ Error starting server: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();