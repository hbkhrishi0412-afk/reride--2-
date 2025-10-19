import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db';
import Vehicle from './lib-vehicle';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing MongoDB connection and collection...');
    
    // Connect to database
    await connectToDatabase();
    
    // Test the Vehicle model and collection
    const vehicleCount = await Vehicle.countDocuments();
    console.log(`📊 Found ${vehicleCount} vehicles in the 'vehicles' collection`);
    
    // Get collection info
    const db = Vehicle.db;
    const collections = await db.listCollections().toArray();
    const vehiclesCollection = collections.find(c => c.name === 'vehicles');
    
    // Get a sample vehicle if any exist
    let sampleVehicle = null;
    if (vehicleCount > 0) {
      sampleVehicle = await Vehicle.findOne().lean();
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'MongoDB connection and collection verified',
      database: db.databaseName,
      collection: 'vehicles',
      vehicleCount: vehicleCount,
      collections: collections.map(c => c.name),
      vehiclesCollectionInfo: vehiclesCollection,
      sampleVehicle: sampleVehicle,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
