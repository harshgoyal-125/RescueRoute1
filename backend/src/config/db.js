import mongoose from 'mongoose';
import { ENV } from './env.js';

let isConnected = false;

export async function connectDB(customUri = null) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = customUri || ENV.MONGODB_URI;

  // Never include a connection URI in logs: passwords may contain @ or other delimiters.

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: ENV.NODE_ENV !== 'production'
    });

    isConnected = true;
    console.info(`[MongoDB] Connected to database host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error('[MongoDB] Connection failed. Check database connectivity and server logs.');
    throw new Error('Database connection failed. Please ensure MongoDB is running.');
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
