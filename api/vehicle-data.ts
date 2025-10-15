import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { VEHICLE_DATA } from '../components/vehicleData';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'reride';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const client = await connectToDatabase();
      const db = client.db(DB_NAME);
      const collection = db.collection('vehicleData');

      // Try to get from database
      const data = await collection.findOne({ _id: 'vehicleData' });
      
      if (data) {
        // Remove MongoDB's _id field and return the data
        const { _id, ...vehicleData } = data;
        return res.status(200).json(vehicleData);
      } else {
        // No data in database, return default data
        const defaultData = VEHICLE_DATA;
        
        // Save default data to database for future use
        await collection.insertOne({
          _id: 'vehicleData',
          ...defaultData
        });
        
        return res.status(200).json(defaultData);
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      // Fallback to default data
      return res.status(200).json(VEHICLE_DATA);
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const vehicleData = req.body;
      
      if (!vehicleData || typeof vehicleData !== 'object') {
        return res.status(400).json({ error: 'Invalid vehicle data' });
      }

      const client = await connectToDatabase();
      const db = client.db(DB_NAME);
      const collection = db.collection('vehicleData');

      // Upsert the vehicle data
      await collection.replaceOne(
        { _id: 'vehicleData' },
        {
          _id: 'vehicleData',
          ...vehicleData
        },
        { upsert: true }
      );

      return res.status(200).json({ success: true, message: 'Vehicle data updated successfully' });
    } catch (error) {
      console.error('Error saving vehicle data:', error);
      return res.status(500).json({ error: 'Failed to save vehicle data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
