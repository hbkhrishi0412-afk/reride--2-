// Development API server for testing Plan Management
import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Mock vehicle data for admin database
let mockVehicleDataDb = [
  { _id: '1', category: 'four-wheeler', make: 'Maruti Suzuki', model: 'Swift', variants: ['LXi', 'VXi', 'VXi (O)', 'ZXi', 'ZXi+'], createdAt: new Date(), updatedAt: new Date() },
  { _id: '2', category: 'four-wheeler', make: 'Maruti Suzuki', model: 'Baleno', variants: ['Sigma', 'Delta', 'Zeta', 'Alpha'], createdAt: new Date(), updatedAt: new Date() },
  { _id: '3', category: 'four-wheeler', make: 'Hyundai', model: 'i20', variants: ['Magna', 'Sportz', 'Asta', 'Asta (O)'], createdAt: new Date(), updatedAt: new Date() },
  { _id: '4', category: 'two-wheeler', make: 'Honda', model: 'Activa 6G', variants: ['Standard', 'DLX', 'Smart'], createdAt: new Date(), updatedAt: new Date() },
  { _id: '5', category: 'two-wheeler', make: 'Bajaj', model: 'Pulsar 150', variants: ['Standard', 'DTS-i', 'NS'], createdAt: new Date(), updatedAt: new Date() }
];

// Mock vehicle data (legacy format)
const mockVehicleData = {
  FOUR_WHEELER: [
    {
      name: "Maruti Suzuki",
      models: [
        { name: "Swift", variants: ["LXi", "VXi", "VXi (O)", "ZXi", "ZXi+"] },
        { name: "Baleno", variants: ["Sigma", "Delta", "Zeta", "Alpha"] },
        { name: "Dzire", variants: ["LXi", "VXi", "ZXi", "ZXi+"] }
      ]
    },
    {
      name: "Hyundai",
      models: [
        { name: "i20", variants: ["Magna", "Sportz", "Asta", "Asta (O)"] },
        { name: "Verna", variants: ["S", "SX", "SX (O)", "SX Turbo"] }
      ]
    },
    {
      name: "Tata",
      models: [
        { name: "Nexon", variants: ["XE", "XM", "XZ+", "XZ+ (O)"] },
        { name: "Safari", variants: ["XE", "XM", "XZ", "XZ+"] }
      ]
    }
  ],
  TWO_WHEELER: [
    {
      name: "Honda",
      models: [
        { name: "Activa 6G", variants: ["Standard", "DLX", "Smart"] },
        { name: "Shine", variants: ["Standard", "SP", "SP (Drum)"] }
      ]
    },
    {
      name: "Bajaj",
      models: [
        { name: "Pulsar 150", variants: ["Standard", "DTS-i", "NS"] },
        { name: "CT 100", variants: ["Standard", "X"] }
      ]
    }
  ]
};

// Mock plan data
const mockPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    listingLimit: 1,
    featuredCredits: 0,
    freeCertifications: 0,
    features: [
      '1 Active Listing',
      'Basic Seller Profile',
      'Standard Support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1999,
    listingLimit: 10,
    featuredCredits: 2,
    freeCertifications: 1,
    isMostPopular: true,
    features: [
      '10 Active Listings',
      '2 Featured Credits/month',
      '1 Free Certified Inspection/month',
      'Enhanced Seller Profile',
      'Performance Analytics',
      'Priority Support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4999,
    listingLimit: 'unlimited',
    featuredCredits: 5,
    freeCertifications: 3,
    features: [
      'Unlimited Active Listings',
      '5 Featured Credits/month',
      '3 Free Certified Inspections/month',
      'AI Listing Assistant',
      'Advanced Analytics',
      'Dedicated Support',
    ],
  },
];

// Plans API endpoint
app.get('/api/plans', (req, res) => {
  console.log('📋 GET /api/plans - Returning plans');
  res.json(mockPlans);
});

app.post('/api/plans', (req, res) => {
  console.log('➕ POST /api/plans - Creating new plan');
  const newPlan = {
    id: `custom_${Date.now()}`,
    ...req.body,
  };
  mockPlans.push(newPlan);
  res.status(201).json(newPlan);
});

app.put('/api/plans', (req, res) => {
  console.log('✏️ PUT /api/plans - Updating plan');
  const { planId, ...updateData } = req.body;
  const planIndex = mockPlans.findIndex(p => p.id === planId);
  
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  mockPlans[planIndex] = { ...mockPlans[planIndex], ...updateData };
  res.json(mockPlans[planIndex]);
});

app.delete('/api/plans', (req, res) => {
  console.log('🗑️ DELETE /api/plans - Deleting plan');
  const { planId } = req.query;
  
  if (!planId || ['free', 'pro', 'premium'].includes(planId)) {
    return res.status(400).json({ error: 'Cannot delete base plans' });
  }
  
  const planIndex = mockPlans.findIndex(p => p.id === planId);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  mockPlans.splice(planIndex, 1);
  res.json({ success: true, message: 'Plan deleted successfully' });
});

// Admin API endpoint
app.get('/api/admin', (req, res) => {
  console.log('🔧 GET /api/admin - Admin health check');
  res.json({
    status: 'ok',
    message: 'Admin panel is accessible',
    timestamp: new Date().toISOString(),
    details: {
      connectionState: 'connected',
      plansCount: mockPlans.length,
      availableActions: ['health', 'seed', 'test-connection']
    }
  });
});

// Vehicle Data API endpoints
app.get('/api/vehicles', (req, res) => {
  const { type } = req.query;
  
  if (type === 'data') {
    console.log('🚗 GET /api/vehicles?type=data - Returning vehicle data');
    res.json(mockVehicleData);
  } else {
    console.log('🚗 GET /api/vehicles - Returning empty vehicle list');
    res.json([]);
  }
});

app.post('/api/vehicles', (req, res) => {
  const { type } = req.query;
  
  if (type === 'data') {
    console.log('🚗 POST /api/vehicles?type=data - Updating vehicle data');
    // In a real app, this would save to database
    // For now, just return success
    res.json({
      success: true,
      data: req.body,
      message: 'Vehicle data updated successfully',
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('🚗 POST /api/vehicles - Creating new vehicle');
    const newVehicle = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    res.status(201).json(newVehicle);
  }
});

app.get('/api/vehicle-data', (req, res) => {
  console.log('🚗 GET /api/vehicle-data - Returning vehicle data');
  res.json(mockVehicleData);
});

app.post('/api/vehicle-data', (req, res) => {
  console.log('🚗 POST /api/vehicle-data - Updating vehicle data');
  // In a real app, this would save to database
  // For now, just return success
  res.json({
    success: true,
    data: req.body,
    message: 'Vehicle data updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Vehicle Data Management API (Admin Database)
app.get('/api/vehicle-data-management', (req, res) => {
  console.log('🚗 GET /api/vehicle-data-management - Returning vehicle data from admin database');
  
  const { category, make, model } = req.query;
  let filteredData = mockVehicleDataDb;
  
  if (category && category !== 'ALL') {
    filteredData = filteredData.filter(item => item.category === category);
  }
  
  if (make) {
    filteredData = filteredData.filter(item => item.make === make);
  }
  
  if (model) {
    filteredData = filteredData.filter(item => item.model === model);
  }
  
  // Transform data to match expected format
  const transformedData = filteredData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    
    const existingMake = acc[item.category].find(make => make.name === item.make);
    if (existingMake) {
      const existingModel = existingMake.models.find(model => model.name === item.model);
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

  res.json({
    success: true,
    data: transformedData,
    source: 'admin-database',
    count: filteredData.length
  });
});

app.post('/api/vehicle-data-management', (req, res) => {
  console.log('🚗 POST /api/vehicle-data-management - Creating vehicle data in admin database');
  
  const { category, make, model, variants } = req.body;
  
  if (!category || !make || !model || !variants) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: category, make, model, variants'
    });
  }
  
  // Check if combination already exists
  const existing = mockVehicleDataDb.find(item => 
    item.category === category && item.make === make && item.model === model
  );
  
  if (existing) {
    // Update existing record with new variants
    existing.variants = [...new Set([...existing.variants, ...variants])];
    existing.updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Vehicle data updated successfully',
      data: existing
    });
  } else {
    // Create new record
    const newItem = {
      _id: Date.now().toString(),
      category,
      make,
      model,
      variants: Array.isArray(variants) ? variants : [variants],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockVehicleDataDb.push(newItem);
    
    res.status(201).json({
      success: true,
      message: 'Vehicle data created successfully',
      data: newItem
    });
  }
});

app.put('/api/vehicle-data-management', (req, res) => {
  console.log('🚗 PUT /api/vehicle-data-management - Updating vehicle data in admin database');
  
  const { id } = req.query;
  const { category, make, model, variants } = req.body;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle data ID is required'
    });
  }
  
  const itemIndex = mockVehicleDataDb.findIndex(item => item._id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Vehicle data not found'
    });
  }
  
  const updateData = {
    updatedAt: new Date()
  };
  
  if (category) updateData.category = category;
  if (make) updateData.make = make;
  if (model) updateData.model = model;
  if (variants) updateData.variants = Array.isArray(variants) ? variants : [variants];
  
  mockVehicleDataDb[itemIndex] = { ...mockVehicleDataDb[itemIndex], ...updateData };
  
  res.json({
    success: true,
    message: 'Vehicle data updated successfully',
    data: mockVehicleDataDb[itemIndex]
  });
});

app.delete('/api/vehicle-data-management', (req, res) => {
  console.log('🚗 DELETE /api/vehicle-data-management - Deleting vehicle data from admin database');
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle data ID is required'
    });
  }
  
  const itemIndex = mockVehicleDataDb.findIndex(item => item._id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Vehicle data not found'
    });
  }
  
  mockVehicleDataDb.splice(itemIndex, 1);
  
  res.json({
    success: true,
    message: 'Vehicle data deleted successfully'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      plans: '/api/plans',
      admin: '/api/admin',
      vehicles: '/api/vehicles',
      vehicleData: '/api/vehicle-data',
      vehicleDataManagement: '/api/vehicle-data-management',
      health: '/api/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   - GET  /api/plans - Get all plans`);
  console.log(`   - POST /api/plans - Create new plan`);
  console.log(`   - PUT  /api/plans - Update plan`);
  console.log(`   - DELETE /api/plans - Delete plan`);
  console.log(`   - GET  /api/vehicles?type=data - Get vehicle data`);
  console.log(`   - POST /api/vehicles?type=data - Update vehicle data`);
  console.log(`   - GET  /api/vehicle-data - Get vehicle data`);
  console.log(`   - POST /api/vehicle-data - Update vehicle data`);
  console.log(`   - GET  /api/vehicle-data-management - Get vehicle data from admin database`);
  console.log(`   - POST /api/vehicle-data-management - Create vehicle data in admin database`);
  console.log(`   - PUT  /api/vehicle-data-management - Update vehicle data in admin database`);
  console.log(`   - DELETE /api/vehicle-data-management - Delete vehicle data from admin database`);
  console.log(`   - GET  /api/admin - Admin health check`);
  console.log(`   - GET  /api/health - Server health check`);
  console.log(`\n🔗 Test the API:`);
  console.log(`   curl http://localhost:${PORT}/api/plans`);
  console.log(`   curl http://localhost:${PORT}/api/vehicles?type=data`);
  console.log(`   curl http://localhost:${PORT}/api/vehicle-data`);
  console.log(`   curl http://localhost:${PORT}/api/vehicle-data-management`);
  console.log(`   curl http://localhost:${PORT}/api/admin`);
});
