// Database connection utility for Vercel serverless functions
// This file doesn't export a default handler, so it won't become an API route

import mongoose from 'mongoose';
import type { Mongoose } from 'mongoose';

// Connection caching logic to prevent multiple connections in a serverless environment.
let cached = (globalThis as any).mongoose;

if (!cached) {
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!process.env.MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable.');
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;

