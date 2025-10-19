import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking database health...');
    
    // Try to connect to database
    await connectToDatabase();
    
    console.log('✅ Database connection successful');
    
    return res.status(200).json({
      status: 'ok',
      message: 'Database connected successfully.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    let errorMessage = 'Database connection failed';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('MONGODB_URI')) {
        errorMessage += ' - Check MONGODB_URI environment variable in Vercel dashboard';
      } else if (error.message.includes('authentication') || error.message.includes('Authentication')) {
        errorMessage += ' - Check MongoDB credentials in connection string';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage += ' - Check MongoDB Atlas Network Access (IP Whitelist). Allow 0.0.0.0/0 for Vercel';
      }
    }
    
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}
