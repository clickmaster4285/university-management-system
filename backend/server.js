import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { seedDefaultAdmin } from './scripts/seedAdmin.js';
import { seedPlatformRoles } from './scripts/seedPlatformRoles.js';
import { seedTestRoleUsers } from './scripts/seedTestRoleUsers.js';
import { migrateUsersToPlatformRoleRef } from './utils/userPlatformRole.js';
import { UPLOAD_ROOT } from './utils/uploadPaths.js';
import apiRoutes from './routes/index.js';
import './jobs/statusUpdate.js';

dotenv.config();

const port = Number(process.env.PORT);
const host = process.env.HOST;
const frontendUrl = process.env.FRONTEND_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT));
app.use(morgan('dev'));
app.use('/api', apiRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    await seedPlatformRoles();
    await migrateUsersToPlatformRoleRef();
    await seedDefaultAdmin();
    await seedTestRoleUsers();

    app.listen(port, host, () => {
      console.log(`🚀 Server running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error(`❌ Error starting server: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();