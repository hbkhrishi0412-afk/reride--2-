import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    // Test 1: Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not defined');
      return res.status(500).json({
        error: 'MONGODB_URI not configured',
        message: 'Please set MONGODB_URI in Vercel environment variables',
        tests: [
          { name: 'MongoDB URI Configuration', status: 'FAIL', details: 'MONGODB_URI environment variable not found' }
        ]
      });
    }
    
    console.log('✅ MONGODB_URI is configured');
    
    // Test 2: Try to connect to database
    try {
      await connectToDatabase();
      console.log('✅ Database connection successful');
    } catch (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return res.status(500).json({
        error: 'Database connection failed',
        message: connectionError.message,
        tests: [
          { name: 'MongoDB URI Configuration', status: 'PASS' },
          { name: 'Database Connection', status: 'FAIL', details: connectionError.message }
        ]
      });
    }
    
    // Test 3: Check if we can access the database
    try {
      const mongoose = await import('mongoose');
      const db = mongoose.default.connection.db;
      
      if (!db) {
        throw new Error('Database connection object is null');
      }
      
      // List collections
      const collections = await db.listCollections().toArray();
      console.log('✅ Database access successful, collections:', collections.map(c => c.name));
      
      return res.status(200).json({
        success: true,
        message: 'MongoDB connection test successful',
        tests: [
          { name: 'MongoDB URI Configuration', status: 'PASS' },
          { name: 'Database Connection', status: 'PASS' },
          { name: 'Database Access', status: 'PASS', details: `Found ${collections.length} collections: ${collections.map(c => c.name).join(', ') || 'none'}` }
        ],
        collections: collections.map(c => c.name),
        databaseName: db.databaseName
      });
      
    } catch (accessError) {
      console.error('❌ Database access failed:', accessError);
      return res.status(500).json({
        error: 'Database access failed',
        message: accessError.message,
        tests: [
          { name: 'MongoDB URI Configuration', status: 'PASS' },
          { name: 'Database Connection', status: 'PASS' },
          { name: 'Database Access', status: 'FAIL', details: accessError.message }
        ]
      });
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      tests: [
        { name: 'General Test', status: 'FAIL', details: error.message }
      ]
    });
  }
}
