
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import User from './lib-user.js';
import Vehicle from './lib-vehicle.js';
import mongoose from 'mongoose';
// Constants will be imported dynamically when needed

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const { action } = req.query;

  try {
    // DATABASE HEALTH CHECK
    if (action === 'health') {
      const startTime = Date.now();
      
      const hasMongoUri = !!process.env.MONGODB_URI;
      
      if (!hasMongoUri) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'MONGODB_URI environment variable is not configured',
          details: 'Please add MONGODB_URI in Vercel dashboard under Environment Variables',
          timestamp: new Date().toISOString()
        });
      }

      await connectToDatabase();
      const connectionTime = Date.now() - startTime;
      
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
    }

    // DATABASE SEEDING
    if (action === 'seed') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
      }

      console.log('🌱 Starting database seeding...');
      await connectToDatabase();

      console.log('🗑️  Clearing existing data...');
      const deletedUsers = await User.deleteMany({});
      const deletedVehicles = await Vehicle.deleteMany({});
      console.log(`   Deleted ${deletedUsers.deletedCount} users`);
      console.log(`   Deleted ${deletedVehicles.deletedCount} vehicles`);

      console.log('📥 Inserting new data...');
      const { MOCK_USERS, MOCK_VEHICLES } = await import('../constants');
      const insertedUsers = await User.insertMany(MOCK_USERS);
      const insertedVehicles = await Vehicle.insertMany(MOCK_VEHICLES);
      console.log(`   Inserted ${insertedUsers.length} users`);
      console.log(`   Inserted ${insertedVehicles.length} vehicles`);

      const result = {
        success: true,
        message: 'Database seeded successfully! 🎉',
        data: {
          users: {
            deleted: deletedUsers.deletedCount,
            inserted: insertedUsers.length,
            total: insertedUsers.length
          },
          vehicles: {
            deleted: deletedVehicles.deletedCount,
            inserted: insertedVehicles.length,
            total: insertedVehicles.length
          }
        },
        credentials: {
          admin: { email: 'admin@test.com', password: 'password' },
          sellers: [
            { email: 'seller@test.com', password: 'password', name: 'Prestige Motors' },
            { email: 'john.smith@seller.com', password: 'password', name: 'Reliable Rides' }
          ],
          customers: [
            { email: 'customer@test.com', password: 'password' },
            { email: 'jane.doe@customer.com', password: 'password' }
          ]
        }
      };

      console.log('✅ Database seeded successfully!');
      return res.status(200).json(result);
    }

    // TEST MONGODB CONNECTION
    if (action === 'test-connection') {
      console.log('🔍 Testing MongoDB connection...');
      
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not defined');
        return res.status(500).json({
          error: 'MONGODB_URI not configured',
          message: 'Please set MONGODB_URI in Vercel environment variables',
          tests: [
            { name: 'MongoDB URI Configuration', status: 'FAIL', details: 'MONGODB_URI environment variable not found' }
          ]
        });
      }
      
      console.log('✅ MONGODB_URI is configured');
      
      try {
        await connectToDatabase();
        console.log('✅ Database connection successful');
      } catch (connectionError: any) {
        console.error('❌ Database connection failed:', connectionError);
        return res.status(500).json({
          error: 'Database connection failed',
          message: connectionError.message,
          tests: [
            { name: 'MongoDB URI Configuration', status: 'PASS' },
            { name: 'Database Connection', status: 'FAIL', details: connectionError.message }
          ]
        });
      }
      
      try {
        const db = mongoose.connection.db;
        
        if (!db) {
          throw new Error('Database connection object is null');
        }
        
        const collections = await db.listCollections().toArray();
        console.log('✅ Database access successful, collections:', collections.map(c => c.name));
        
        return res.status(200).json({
          success: true,
          message: 'MongoDB connection test successful',
          tests: [
            { name: 'MongoDB URI Configuration', status: 'PASS' },
            { name: 'Database Connection', status: 'PASS' },
            { name: 'Database Access', status: 'PASS', details: `Found ${collections.length} collections: ${collections.map(c => c.name).join(', ') || 'none'}` }
          ],
          collections: collections.map(c => c.name),
          databaseName: db.databaseName
        });
        
      } catch (accessError: any) {
        console.error('❌ Database access failed:', accessError);
        return res.status(500).json({
          error: 'Database access failed',
          message: accessError.message,
          tests: [
            { name: 'MongoDB URI Configuration', status: 'PASS' },
            { name: 'Database Connection', status: 'PASS' },
            { name: 'Database Access', status: 'FAIL', details: accessError.message }
          ]
        });
      }
    }

    // TEST VEHICLE SAVE
    if (action === 'test-vehicle') {
      const testResults: any = {
        timestamp: new Date().toISOString(),
        tests: []
      };

      testResults.tests.push({
        name: 'MongoDB URI Configuration',
        status: process.env.MONGODB_URI ? 'PASS' : 'FAIL',
        details: process.env.MONGODB_URI ? 'MONGODB_URI is set' : 'MONGODB_URI is NOT set in environment variables'
      });

      if (!process.env.MONGODB_URI) {
        return res.status(500).json(testResults);
      }

      try {
        await connectToDatabase();
        testResults.tests.push({
          name: 'Database Connection',
          status: 'PASS',
          details: 'Successfully connected to MongoDB'
        });
      } catch (error: any) {
        testResults.tests.push({
          name: 'Database Connection',
          status: 'FAIL',
          details: error instanceof Error ? error.message : 'Connection failed'
        });
        return res.status(500).json(testResults);
      }

      const testVehicle = {
        id: Date.now(),
        category: 'four-wheeler',
        make: 'TestMake',
        model: 'TestModel',
        year: 2024,
        price: 100000,
        mileage: 0,
        sellerEmail: 'test@test.com',
        status: 'published',
        isFeatured: false,
        views: 0,
        inquiriesCount: 0,
        certificationStatus: 'none',
        images: [],
        features: [],
        description: 'Test vehicle for diagnostic purposes'
      };

      try {
        const created = await Vehicle.create(testVehicle);
        testResults.tests.push({
          name: 'Vehicle Creation',
          status: 'PASS',
          details: `Created test vehicle with ID: ${created.id}`
        });

        const found = await Vehicle.findOne({ id: testVehicle.id });
        testResults.tests.push({
          name: 'Vehicle Retrieval',
          status: found ? 'PASS' : 'FAIL',
          details: found ? `Successfully retrieved vehicle: ${found.make} ${found.model}` : 'Could not find created vehicle'
        });

        await Vehicle.deleteOne({ id: testVehicle.id });
        testResults.tests.push({
          name: 'Vehicle Deletion',
          status: 'PASS',
          details: 'Successfully deleted test vehicle'
        });

      } catch (error: any) {
        testResults.tests.push({
          name: 'Vehicle Creation',
          status: 'FAIL',
          details: error instanceof Error ? error.message : 'Failed to create vehicle'
        });
      }

      const allPassed = testResults.tests.every((t: any) => t.status === 'PASS');
      testResults.summary = allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';

      return res.status(allPassed ? 200 : 500).json(testResults);
    }

    // DEBUG VEHICLE SAVE
    if (action === 'debug-vehicle') {
      console.log('🔍 DEBUG: Starting vehicle save debug...');
      
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
        
        const requiredFields = ['id', 'category', 'make', 'model', 'year', 'price', 'mileage', 'sellerEmail'];
        const missingFields = requiredFields.filter(field => !(testVehicleData as any)[field]);
        
        if (missingFields.length > 0) {
          console.error('❌ Missing required fields:', missingFields);
          return res.status(400).json({ 
            error: 'Missing required fields', 
            missing: missingFields,
            provided: testVehicleData 
          });
        }
        
        console.log('✅ All required fields present');
        
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
        } catch (createError: any) {
          console.error('❌ Vehicle creation failed:', createError);
          
          if (createError.name === 'ValidationError') {
            console.error('Validation errors:', createError.errors);
            return res.status(400).json({
              error: 'Validation failed',
              details: createError.errors,
              provided: testVehicleData
            });
          }
          
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
    }

    // If no valid action specified
    return res.status(400).json({ 
      error: 'Invalid action parameter',
      message: 'Please specify an action: health, seed, test-connection, test-vehicle, or debug-vehicle',
      availableActions: ['health', 'seed', 'test-connection', 'test-vehicle', 'debug-vehicle']
    });

  } catch (error) {
    console.error('Admin API Error:', error);
    
    let errorDetails = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorDetails = error.message;
      
      if (error.message.includes('MONGODB_URI')) {
        errorDetails += ' - Go to Vercel dashboard → Settings → Environment Variables';
      } else if (error.message.includes('authentication') || error.message.includes('Authentication')) {
        errorDetails += ' - Check MongoDB credentials in connection string';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorDetails += ' - Check MongoDB Atlas Network Access (IP Whitelist). Allow 0.0.0.0/0 for Vercel';
      }
    }
    
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return res.status(500).json({ 
      error: message,
      details: errorDetails,
      action: action || 'none'
    });
  }
}

