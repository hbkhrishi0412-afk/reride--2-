import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Global Setup...');
  
  // Start the development server if not already running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✅ Application is ready for testing');
    
    // Seed test data if needed
    await seedTestData(page);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

async function seedTestData(page: any) {
  console.log('🌱 Seeding test data...');
  
  // Create test users in localStorage
  const testUsers = [
    {
      id: 'test-admin-1',
      email: 'admin@test.com',
      password: 'password',
      name: 'Test Admin',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-seller-1',
      email: 'seller@test.com',
      password: 'password',
      name: 'Test Seller',
      role: 'seller',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-customer-1',
      email: 'customer@test.com',
      password: 'password',
      name: 'Test Customer',
      role: 'customer',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  // Create test vehicles
  const testVehicles = [
    {
      id: 1,
      make: 'Honda',
      model: 'City',
      year: 2020,
      price: 850000,
      mileage: 25000,
      category: 'FOUR_WHEELER',
      sellerEmail: 'seller@test.com',
      status: 'published',
      images: ['https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=Honda+City'],
      features: ['Air Conditioning', 'Power Steering', 'Central Locking'],
      description: 'Well maintained Honda City in excellent condition.',
      city: 'Mumbai',
      state: 'MH',
      fuelType: 'Petrol',
      transmission: 'Manual',
      engine: '1.5L',
      color: 'White'
    },
    {
      id: 2,
      make: 'Maruti',
      model: 'Swift',
      year: 2019,
      price: 650000,
      mileage: 30000,
      category: 'FOUR_WHEELER',
      sellerEmail: 'seller@test.com',
      status: 'published',
      images: ['https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=Maruti+Swift'],
      features: ['Air Conditioning', 'Power Steering', 'Music System'],
      description: 'Low mileage Maruti Swift in good condition.',
      city: 'Delhi',
      state: 'DL',
      fuelType: 'Petrol',
      transmission: 'Manual',
      engine: '1.2L',
      color: 'Red'
    }
  ];

  // Create test conversations
  const testConversations = [
    {
      id: 'conv-test-1',
      customerId: 'customer@test.com',
      customerName: 'Test Customer',
      sellerId: 'seller@test.com',
      vehicleId: 1,
      vehicleName: 'Honda City',
      messages: [
        {
          id: 1,
          sender: 'customer',
          text: 'Is this vehicle still available?',
          timestamp: new Date().toISOString(),
          isRead: true,
          type: 'text'
        },
        {
          id: 2,
          sender: 'seller',
          text: 'Yes, it is available. Would you like to schedule a viewing?',
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'text'
        }
      ],
      lastMessageAt: new Date().toISOString(),
      isReadBySeller: false,
      isReadByCustomer: true
    }
  ];

  // Store test data in localStorage
  await page.evaluate(({ users, vehicles, conversations }) => {
    localStorage.setItem('reRideUsers', JSON.stringify(users));
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    localStorage.setItem('reRideConversations', JSON.stringify(conversations));
  }, { users: testUsers, vehicles: testVehicles, conversations: testConversations });

  console.log('✅ Test data seeded successfully');
}

export default globalSetup;
