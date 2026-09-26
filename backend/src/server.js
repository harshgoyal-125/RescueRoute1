import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function startServer() {
  try {
    if (ENV.NODE_ENV === 'production' && (!ENV.MONGODB_URI || !ENV.JWT_SECRET || ENV.JWT_SECRET.length < 32 || !ENV.CLIENT_URL)) {
      throw new Error('Production requires MONGODB_URI, a strong JWT_SECRET, and CLIENT_URL.');
    }
    await connectDB();

    const server = app.listen(ENV.PORT, () => {
      console.info(`[RescueRoute Backend] Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
      console.info(`[RescueRoute Backend] REST API endpoint: http://localhost:${ENV.PORT}/api`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.info(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.info('[Server] HTTP server closed.');
        try {
          await disconnectDB();
          console.info('[MongoDB] Connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('[MongoDB] Error during disconnect:', err.message);
          process.exit(1);
        }
      });

      // Force shutdown after 10s if hanging
      setTimeout(() => {
        console.error('[Server] Forcing shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error(`[Fatal Startup Error]: ${error.message}`);
    process.exit(1);
  }
}

startServer();
