import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongoDatabase: process.env.MONGODB_DATABASE || 'kti_assets',

  // JWT
  jwtSecret: process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long!!',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',

  // Azure Storage
  azure: {
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'kti-assets',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Features
  features: {
    fileUpload: process.env.ENABLE_FILE_UPLOAD === 'true',
    notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    auditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
  },

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
