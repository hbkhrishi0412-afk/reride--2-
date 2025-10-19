import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, Document } from 'mongodb';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      // Try to connect to database, but don't fail if it's not available
      let client;
      try {
        client = await connectToDatabase();
      } catch (dbError) {
        console.warn('Database connection failed, using fallback data:', dbError);
        // Return fallback data
        return res.status(200).json({
          categories: ['four-wheeler', 'two-wheeler', 'three-wheeler'],
          makes: ['Honda', 'Toyota', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Bajaj', 'TVS', 'Hero', 'Yamaha']
        });
      }
      const db = client.db(DB_NAME);
      const collection = db.collection<Document>('vehicleData');

      // Try to get from database using a type field instead of custom _id
      const data = await collection.findOne({ type: 'vehicleData' } as any);
      
      if (data) {
        // Remove MongoDB's _id field and return the data
        const { _id, type, ...vehicleData } = data;
        return res.status(200).json(vehicleData);
      } else {
        // No data in database, return default data
        const defaultData = {
          categories: ['four-wheeler', 'two-wheeler', 'three-wheeler'],
          makes: ['Honda', 'Toyota', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Bajaj', 'TVS', 'Hero', 'Yamaha']
        };
        
        // Save default data to database for future use
        await collection.insertOne({
          type: 'vehicleData',
          ...defaultData
        } as any);
        
        return res.status(200).json(defaultData);
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      // Fallback to default data
      return res.status(200).json({
        categories: ['four-wheeler', 'two-wheeler', 'three-wheeler'],
        makes: ['Honda', 'Toyota', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Bajaj', 'TVS', 'Hero', 'Yamaha']
      });
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
      const collection = db.collection<Document>('vehicleData');

      // Upsert the vehicle data
      await collection.replaceOne(
        { type: 'vehicleData' } as any,
        {
          type: 'vehicleData',
          ...vehicleData
        } as any,
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
