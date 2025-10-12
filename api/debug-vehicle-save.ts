import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import Vehicle from './lib-vehicle.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    console.log('🔍 DEBUG: Starting vehicle save debug...');
    
    // Test database connection
    await connectToDatabase();
    console.log('✅ Database connected');
    
    if (req.method === 'POST') {
      const testVehicleData = {
        id: Date.now(),
        category: 'four-wheeler',
        make: 'Honda',
        model: 'City',
        variant: 'VX',
        year: 2023,
        price: 800000,
        mileage: 15000,
        sellerEmail: 'test@example.com',
        status: 'published',
        isFeatured: false,
        description: 'Test vehicle for debugging',
        engine: '1.5L Petrol',
        transmission: 'Manual',
        fuelType: 'Petrol',
        fuelEfficiency: '17 km/l',
        color: 'White',
        features: ['ABS', 'Airbags'],
        images: [],
        registrationYear: 2023,
        insuranceValidity: '2024-12-31',
        insuranceType: 'Comprehensive',
        rto: 'MH-12',
        city: 'Mumbai',
        state: 'Maharashtra',
        noOfOwners: 1,
        displacement: '1498cc',
        groundClearance: '165mm',
        bootSpace: '506L',
        views: 0,
        inquiriesCount: 0,
        documents: [],
        serviceRecords: [],
        accidentHistory: [],
        qualityReport: null,
        certifiedInspection: null,
        certificationStatus: 'none',
        videoUrl: null,
        isFlagged: false,
        flagReason: null,
        flaggedAt: null
      };
      
      console.log('🧪 Test vehicle data:', JSON.stringify(testVehicleData, null, 2));
      
      // Validate required fields
      const requiredFields = ['id', 'category', 'make', 'model', 'year', 'price', 'mileage', 'sellerEmail'];
      const missingFields = requiredFields.filter(field => !testVehicleData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return res.status(400).json({ 
          error: 'Missing required fields', 
          missing: missingFields,
          provided: testVehicleData 
        });
      }
      
      console.log('✅ All required fields present');
      
      // Try to create the vehicle
      try {
        console.log('💾 Attempting to create vehicle in MongoDB...');
        const vehicle = await Vehicle.create(testVehicleData);
        console.log('✅ Vehicle created successfully:', vehicle.id);
        
        return res.status(201).json({
          success: true,
          message: 'Test vehicle created successfully',
          vehicle: {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            price: vehicle.price
          }
        });
      } catch (createError) {
        console.error('❌ Vehicle creation failed:', createError);
        
        // Check if it's a validation error
        if (createError.name === 'ValidationError') {
          console.error('Validation errors:', createError.errors);
          return res.status(400).json({
            error: 'Validation failed',
            details: createError.errors,
            provided: testVehicleData
          });
        }
        
        // Check if it's a duplicate key error
        if (createError.code === 11000) {
          console.error('Duplicate key error:', createError.keyValue);
          return res.status(409).json({
            error: 'Duplicate vehicle ID',
            duplicate: createError.keyValue
          });
        }
        
        throw createError;
      }
    }
    
    if (req.method === 'GET') {
      // Get all vehicles
      const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
      console.log(`📋 Found ${vehicles.length} vehicles in database`);
      
      return res.status(200).json({
        count: vehicles.length,
        vehicles: vehicles.map(v => ({
          id: v.id,
          make: v.make,
          model: v.model,
          price: v.price,
          sellerEmail: v.sellerEmail,
          createdAt: v.createdAt
        }))
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('🚨 DEBUG API Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    const stack = error instanceof Error ? error.stack : undefined;
    
    return res.status(500).json({ 
      error: message,
      stack: stack,
      type: error.name || 'UnknownError'
    });
  }
}
