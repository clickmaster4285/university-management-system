import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import './jobs/statusUpdate.js';
dotenv.config();

const DEFAULT_PORT = Number(process.env.PORT);

const startServer = async (port = DEFAULT_PORT) => {
  try {
    await connectDB();

    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`\n🚀 Server running on http://localhost:${port}`);
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

startServer();