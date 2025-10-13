import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './lib-db';
import VehicleDataModel from '../models/VehicleData';
import type { VehicleData } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      // Get vehicle data
      let vehicleDataDoc = await VehicleDataModel.findOne();
      
      if (!vehicleDataDoc) {
        // If no data exists, create default structure
        vehicleDataDoc = await VehicleDataModel.create({
          data: {}
        });
      }

      const vehicleData: VehicleData = {};
      
      // Convert MongoDB Map to plain object
      if (vehicleDataDoc.data) {
        for (const [key, value] of vehicleDataDoc.data.entries()) {
          vehicleData[key] = value;
        }
      }

      return res.status(200).json(vehicleData);
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Update vehicle data
      const newData: VehicleData = req.body;

      // Find existing document or create new one
      let vehicleDataDoc = await VehicleDataModel.findOne();
      
      if (!vehicleDataDoc) {
        vehicleDataDoc = new VehicleDataModel({ data: new Map() });
      }

      // Update the data
      vehicleDataDoc.data = new Map(Object.entries(newData));
      await vehicleDataDoc.save();

      return res.status(200).json({ 
        success: true, 
        message: 'Vehicle data updated successfully',
        data: newData 
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error in vehicle-data API:', error);
    return res.status(500).json({ 
      error: 'Failed to manage vehicle data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

