import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    const collection = db.collection('vehicles');

    switch (req.method) {
      case 'GET':
        return await handleGetVehicles(req, res, collection);
      case 'POST':
        return await handleCreateVehicle(req, res, collection);
      case 'PUT':
        return await handleUpdateVehicle(req, res, collection);
      case 'DELETE':
        return await handleDeleteVehicle(req, res, collection);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vehicles API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleGetVehicles(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const { 
      category, 
      make, 
      model, 
      sellerEmail, 
      status, 
      minPrice, 
      maxPrice, 
      limit, 
      skip 
    } = req.query;
    
    let query: any = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (make) {
      query.make = make;
    }
    
    if (model) {
      query.model = model;
    }
    
    if (sellerEmail) {
      query.sellerEmail = sellerEmail;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice as string);
      if (maxPrice) query.price.$lte = parseInt(maxPrice as string);
    }

    const limitNum = limit ? parseInt(limit as string) : 0;
    const skipNum = skip ? parseInt(skip as string) : 0;
    
    const vehicles = await collection
      .find(query)
      .skip(skipNum)
      .limit(limitNum)
      .toArray();
    
    const totalCount = await collection.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      vehicles: vehicles,
      count: vehicles.length,
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch vehicles' 
    });
  }
}

async function handleCreateVehicle(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const vehicleData = req.body;
    
    if (!vehicleData.make || !vehicleData.model || !vehicleData.price || !vehicleData.sellerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: make, model, price, sellerEmail'
      });
    }

    const result = await collection.insertOne({
      ...vehicleData,
      createdAt: new Date().toISOString(),
      status: 'published',
      views: 0,
      inquiriesCount: 0,
      isFeatured: false
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle: { ...vehicleData, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create vehicle'
    });
  }
}

async function handleUpdateVehicle(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle ID is required'
      });
    }

    const result = await collection.updateOne(
      { _id: id },
      { $set: { ...updateData, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update vehicle'
    });
  }
}

async function handleDeleteVehicle(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle ID is required'
      });
    }

    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete vehicle'
    });
  }
}
