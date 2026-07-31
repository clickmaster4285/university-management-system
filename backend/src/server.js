import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import './jobs/statusUpdate.js';
dotenv.config();

const DEFAULT_PORT = Number(process.env.PORT || 4005);

const startServer = async (port = DEFAULT_PORT) => {
  try {
    await connectDB();

    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`\n🚀 Server running on http://localhost:${port}`);
        console.log(`📚 API Base URL: http://localhost:${port}/api`);
        console.log(`💚 Health Check: http://localhost:${port}/health`);
        console.log(`\n📋 Available Endpoints:`);
        console.log(`   Students:`);
        console.log(`   ├── GET    /api/students`);
        console.log(`   ├── POST   /api/students`);
        console.log(`   ├── GET    /api/students/:id`);
        console.log(`   ├── PUT    /api/students/:id`);
        console.log(`   ├── DELETE /api/students/:id`);
        console.log(`   ├── POST   /api/students/bulk`);
        console.log(`   └── GET    /api/students/stats`);
        console.log(`\n   Teachers:`);
        console.log(`   ├── GET    /api/teachers`);
        console.log(`   ├── POST   /api/teachers`);
        console.log(`   ├── GET    /api/teachers/:id`);
        console.log(`   ├── PUT    /api/teachers/:id`);
        console.log(`   ├── DELETE /api/teachers/:id`);
        console.log(`   ├── POST   /api/teachers/bulk`);
        console.log(`   └── GET    /api/teachers/stats`);
        console.log(`\n🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 Database: MongoDB Connected ✅`);
        resolve(server);
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.warn(`⚠️ Port ${port} is busy. Trying ${port + 1}...`);
          server.close(() => {
            resolve(startServer(port + 1));
          });
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

startServer();