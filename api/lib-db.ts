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
  // Return existing connection if available
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection');
    return cached.conn;
  }

  // Check if MONGODB_URI is defined
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not defined');
    throw new Error('Please define the MONGODB_URI environment variable in Vercel dashboard.');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      dbName: 'reride' // Explicitly specify database name
    };

    console.log('🔄 Creating new MongoDB connection...');
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then(async (mongooseInstance) => {
        console.log('✅ MongoDB connected successfully to database:', mongooseInstance.connection.name);
        
        // Ensure collections exist
        const db = mongooseInstance.connection.db;
        if (db) {
          const collections = await db.listCollections().toArray();
          console.log('📋 Existing collections:', collections.map(c => c.name).join(', ') || 'none');
          
          // Collections will be created automatically when first document is inserted
          // But we can check if they exist
          const hasUsers = collections.some(c => c.name === 'users');
          const hasVehicles = collections.some(c => c.name === 'vehicles');
          
          if (!hasUsers) console.log('ℹ️  Users collection will be created on first insert');
          if (!hasVehicles) console.log('ℹ️  Vehicles collection will be created on first insert');
        }
        
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        cached.promise = null; // Reset on error
        throw error;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on error
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export default connectToDatabase;

