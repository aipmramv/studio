import express, { Express } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { connectDatabase, ensureIndexes, disconnectDatabase } from './lib/database.js';
import { blobStorageService } from './services/blob-storage.service.js';
import { authMiddleware, requireAdmin } from './middleware/auth.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import assetsRoutes from './routes/assets.js';
import uploadsRoutes from './routes/uploads.js';

const app: Express = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/assets', authMiddleware, assetsRoutes);
app.use('/api/uploads', authMiddleware, uploadsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected');

    // Create indexes
    await ensureIndexes();
    logger.info('✅ Database indexes created');

    // Initialize blob storage
    await blobStorageService.initialize();
    logger.info('✅ Blob storage initialized');

    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export default app;
