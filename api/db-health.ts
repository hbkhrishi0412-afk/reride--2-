
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db';
import mongoose from 'mongoose';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  
  try {
    // Check if MONGODB_URI is configured
    const hasMongoUri = !!process.env.MONGODB_URI;
    
    if (!hasMongoUri) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'MONGODB_URI environment variable is not configured',
        details: 'Please add MONGODB_URI in Vercel dashboard under Environment Variables',
        timestamp: new Date().toISOString()
      });
    }

    // Try to connect
    await connectToDatabase();
    const connectionTime = Date.now() - startTime;
    
    // Check connection state
    const readyState = mongoose.connection.readyState;
    const stateMap: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (readyState === 1) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'Database connected successfully',
        details: {
          connectionState: stateMap[readyState],
          connectionTime: `${connectionTime}ms`,
          host: mongoose.connection.host || 'unknown',
          name: mongoose.connection.name || 'unknown'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(503).json({ 
        status: 'error', 
        message: 'Database connection failed',
        details: {
          connectionState: stateMap[readyState] || 'unknown',
          connectionTime: `${connectionTime}ms`
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in db-health endpoint:', error);
    const connectionTime = Date.now() - startTime;
    
    let errorDetails = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Provide helpful error messages
      if (error.message.includes('MONGODB_URI')) {
        errorDetails += ' - Go to Vercel dashboard → Settings → Environment Variables';
      } else if (error.message.includes('authentication') || error.message.includes('Authentication')) {
        errorDetails += ' - Check MongoDB credentials in connection string';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorDetails += ' - Check MongoDB Atlas Network Access (IP Whitelist). Allow 0.0.0.0/0 for Vercel';
      }
    }
    
    return res.status(500).json({ 
      status: 'error', 
      message: errorDetails,
      details: {
        connectionTime: `${connectionTime}ms`,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
      },
      timestamp: new Date().toISOString()
    });
  }
}
