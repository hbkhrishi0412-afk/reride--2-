import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import Vehicle from './lib-vehicle.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: MongoDB URI exists
    testResults.tests.push({
      name: 'MongoDB URI Configuration',
      status: process.env.MONGODB_URI ? 'PASS' : 'FAIL',
      details: process.env.MONGODB_URI ? 'MONGODB_URI is set' : 'MONGODB_URI is NOT set in environment variables'
    });

    if (!process.env.MONGODB_URI) {
      return res.status(500).json(testResults);
    }

    // Test 2: Database connection
    try {
      await connectToDatabase();
      testResults.tests.push({
        name: 'Database Connection',
        status: 'PASS',
        details: 'Successfully connected to MongoDB'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Database Connection',
        status: 'FAIL',
        details: error instanceof Error ? error.message : 'Connection failed'
      });
      return res.status(500).json(testResults);
    }

    // Test 3: Create a test vehicle
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

      // Test 4: Read the vehicle back
      const found = await Vehicle.findOne({ id: testVehicle.id });
      testResults.tests.push({
        name: 'Vehicle Retrieval',
        status: found ? 'PASS' : 'FAIL',
        details: found ? `Successfully retrieved vehicle: ${found.make} ${found.model}` : 'Could not find created vehicle'
      });

      // Test 5: Delete the test vehicle
      await Vehicle.deleteOne({ id: testVehicle.id });
      testResults.tests.push({
        name: 'Vehicle Deletion',
        status: 'PASS',
        details: 'Successfully deleted test vehicle'
      });

    } catch (error) {
      testResults.tests.push({
        name: 'Vehicle Creation',
        status: 'FAIL',
        details: error instanceof Error ? error.message : 'Failed to create vehicle'
      });
    }

    const allPassed = testResults.tests.every((t: any) => t.status === 'PASS');
    testResults.summary = allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';

    return res.status(allPassed ? 200 : 500).json(testResults);

  } catch (error) {
    testResults.error = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json(testResults);
  }
}

