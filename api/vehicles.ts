
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import Vehicle from './lib-vehicle.js';
import VehicleDataModel from '../models/VehicleData';
import type { VehicleData } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    await connectToDatabase();

    // Check if this is a vehicle-data request (using query parameter)
    const { type } = req.query;

    // VEHICLE DATA ENDPOINTS (brands, models, variants)
    if (type === 'data') {
      if (req.method === 'GET') {
        let vehicleDataDoc = await VehicleDataModel.findOne();
        
        if (!vehicleDataDoc) {
          vehicleDataDoc = await VehicleDataModel.create({ data: {} });
        }

        const vehicleData: VehicleData = {};
        
        if (vehicleDataDoc.data) {
          for (const [key, value] of vehicleDataDoc.data.entries()) {
            vehicleData[key] = value;
          }
        }

        return res.status(200).json(vehicleData);
      }
      
      if (req.method === 'POST' || req.method === 'PUT') {
        const newData: VehicleData = req.body;

        let vehicleDataDoc = await VehicleDataModel.findOne();
        
        if (!vehicleDataDoc) {
          vehicleDataDoc = new VehicleDataModel({ data: new Map() });
        }

        vehicleDataDoc.data = new Map(Object.entries(newData));
        await vehicleDataDoc.save();

        return res.status(200).json({ 
          success: true, 
          message: 'Vehicle data updated successfully',
          data: newData 
        });
      }
      
      return res.status(405).json({ error: 'Method not allowed for vehicle data' });
    }

    // VEHICLE LISTINGS ENDPOINTS (actual vehicles)
    switch (req.method) {
      case 'GET': {
        const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
        return res.status(200).json(vehicles);
      }

      case 'POST': {
        console.log('📥 POST /api/vehicles - Received vehicle data');
        const newVehicleData = req.body;
        console.log('📦 Vehicle data:', JSON.stringify(newVehicleData, null, 2));
        
        console.log('🔍 Field type check:', {
          price: { value: newVehicleData.price, type: typeof newVehicleData.price },
          year: { value: newVehicleData.year, type: typeof newVehicleData.year },
          mileage: { value: newVehicleData.mileage, type: typeof newVehicleData.mileage }
        });
        
        if (!newVehicleData.sellerEmail) {
          console.error('❌ Missing sellerEmail in request');
          return res.status(400).json({ error: 'sellerEmail is required' });
        }
        
        if (!newVehicleData.make || !newVehicleData.model) {
          console.error('❌ Missing required fields:', { make: newVehicleData.make, model: newVehicleData.model });
          return res.status(400).json({ error: 'make and model are required' });
        }
        
        if (!newVehicleData.price || typeof newVehicleData.price !== 'number' || newVehicleData.price <= 0) {
          console.error('❌ Invalid price:', newVehicleData.price, 'Type:', typeof newVehicleData.price);
          return res.status(400).json({ error: 'Valid price (number > 0) is required' });
        }
        
        if (typeof newVehicleData.year !== 'number' || newVehicleData.year < 1900) {
          console.error('❌ Invalid year:', newVehicleData.year, 'Type:', typeof newVehicleData.year);
          return res.status(400).json({ error: 'Valid year (number) is required' });
        }
        
        if (typeof newVehicleData.mileage !== 'number' || newVehicleData.mileage < 0) {
          console.error('❌ Invalid mileage:', newVehicleData.mileage, 'Type:', typeof newVehicleData.mileage);
          return res.status(400).json({ error: 'Valid mileage (number >= 0) is required' });
        }
        
        if (!newVehicleData.id) {
          newVehicleData.id = Date.now();
          console.log('🔢 Generated ID:', newVehicleData.id);
        }
        
        console.log('💾 Creating vehicle in MongoDB...');
        console.log('📋 Vehicle data being saved:', JSON.stringify(newVehicleData, null, 2));
        
        try {
          const vehicle = await Vehicle.create(newVehicleData);
          console.log('✅ Vehicle created successfully:', vehicle.id);
          return res.status(201).json(vehicle);
        } catch (createError: any) {
          console.error('❌ Vehicle creation failed:', createError);
          
          if (createError.name === 'ValidationError') {
            console.error('MongoDB Validation errors:', createError.errors);
            const errorMessages = Object.keys(createError.errors).map(key => 
              `${key}: ${createError.errors[key].message}`
            ).join(', ');
            return res.status(400).json({
              error: `Validation failed: ${errorMessages}`,
              details: createError.errors,
              provided: newVehicleData
            });
          }
          
          if (createError.code === 11000) {
            console.error('Duplicate key error:', createError.keyValue);
            newVehicleData.id = Date.now() + Math.floor(Math.random() * 1000);
            console.log('🔄 Retrying with new ID:', newVehicleData.id);
            const vehicle = await Vehicle.create(newVehicleData);
            console.log('✅ Vehicle created successfully on retry:', vehicle.id);
            return res.status(201).json(vehicle);
          }
          
          throw createError;
        }
      }

      case 'PUT': {
        const { id, ...updateData } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'Vehicle ID is required for update.' });
        }
        const updatedVehicle = await Vehicle.findOneAndUpdate({ id }, updateData, { new: true });
        if (!updatedVehicle) {
          const newVehicle = await Vehicle.create({ id, ...updateData });
          return res.status(201).json(newVehicle);
        }
        return res.status(200).json(updatedVehicle);
      }

      case 'DELETE': {
        const { id } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'Vehicle ID is required for deletion.' });
        }
        const result = await Vehicle.deleteOne({ id });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Vehicle not found.' });
        }
        return res.status(200).json({ success: true, id });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Vehicles Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return res.status(500).json({ error: message });
  }
}
