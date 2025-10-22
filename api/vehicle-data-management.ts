import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../lib/mongodb';
import { VehicleData } from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('vehicleData');

    switch (req.method) {
      case 'GET':
        return await handleGetVehicleData(req, res, collection);
      case 'POST':
        return await handleCreateVehicleData(req, res, collection);
      case 'PUT':
        return await handleUpdateVehicleData(req, res, collection);
      case 'DELETE':
        return await handleDeleteVehicleData(req, res, collection);
    }
  } catch (error) {
    console.error('Vehicle data management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetVehicleData(req: NextApiRequest, res: NextApiResponse, collection: any) {
  try {
    const { category, make, model } = req.query;
    
    let query: any = {};
    
    if (category && category !== 'ALL') {
      query.category = category;
    }
    
    if (make) {
      query.make = make;
    }
    
    if (model) {
      query.model = model;
    }

    const vehicleData = await collection.find(query).toArray();
    
    // If no data found, return default structure
    if (vehicleData.length === 0) {
      const defaultData = {
        FOUR_WHEELER: [
          {
            name: "Maruti Suzuki",
            models: [
              { name: "Swift", variants: ["LXi", "VXi", "VXi (O)", "ZXi", "ZXi+"] },
              { name: "Baleno", variants: ["Sigma", "Delta", "Zeta", "Alpha"] }
            ]
          }
        ],
        TWO_WHEELER: [
          {
            name: "Honda",
            models: [
              { name: "Activa 6G", variants: ["Standard", "DLX", "Smart"] }
            ]
          }
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: defaultData,
        source: 'default'
      });
    }

    // Transform data to match expected format
    const transformedData = vehicleData.reduce((acc: any, item: any) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      
      const existingMake = acc[item.category].find((make: any) => make.name === item.make);
      if (existingMake) {
        const existingModel = existingMake.models.find((model: any) => model.name === item.model);
        if (existingModel) {
          existingModel.variants = [...new Set([...existingModel.variants, ...item.variants])];
        } else {
          existingMake.models.push({
            name: item.model,
            variants: item.variants
          });
        }
      } else {
        acc[item.category].push({
          name: item.make,
          models: [{
            name: item.model,
            variants: item.variants
          }]
        });
      }
      
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: transformedData,
      source: 'database',
      count: vehicleData.length
    });

  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch vehicle data'
    });
  }
}

async function handleCreateVehicleData(req: NextApiRequest, res: NextApiResponse, collection: any) {
  try {
    const { category, make, model, variants } = req.body;

    if (!category || !make || !model || !variants) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, make, model, variants'
      });
    }

    // Check if combination already exists
    const existing = await collection.findOne({
      category,
      make,
      model
    });

    if (existing) {
      // Update existing record with new variants
      const updatedVariants = [...new Set([...existing.variants, ...variants])];
      await collection.updateOne(
        { _id: existing._id },
        { $set: { variants: updatedVariants, updatedAt: new Date() } }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Vehicle data updated successfully',
        data: { ...existing, variants: updatedVariants }
      });
    }

    // Create new record
    const newVehicleData = {
      category,
      make,
      model,
      variants: Array.isArray(variants) ? variants : [variants],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newVehicleData);

    return res.status(201).json({
      success: true,
      message: 'Vehicle data created successfully',
      data: { ...newVehicleData, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Error creating vehicle data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create vehicle data'
    });
  }
}

async function handleUpdateVehicleData(req: NextApiRequest, res: NextApiResponse, collection: any) {
  try {
    const { id } = req.query;
    const { category, make, model, variants } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle data ID is required'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (category) updateData.category = category;
    if (make) updateData.make = make;
    if (model) updateData.model = model;
    if (variants) updateData.variants = Array.isArray(variants) ? variants : [variants];

    const result = await collection.updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle data not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle data updated successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating vehicle data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update vehicle data'
    });
  }
}

async function handleDeleteVehicleData(req: NextApiRequest, res: NextApiResponse, collection: any) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle data ID is required'
      });
    }

    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle data not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle data deleted successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting vehicle data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete vehicle data'
    });
  }
}
