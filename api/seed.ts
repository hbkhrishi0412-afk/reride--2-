import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db';
import User from './lib-user';
import Vehicle from './lib-vehicle';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectToDatabase();
    
    // Sample users
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        mobile: '+1234567890',
        role: 'customer',
        status: 'active',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        mobile: '+1234567891',
        role: 'seller',
        status: 'active',
        isVerified: true,
        dealershipName: 'Smith Motors',
        bio: 'Trusted car dealer with 10+ years experience',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Admin User',
        email: 'admin@reride.com',
        password: 'admin123',
        mobile: '+1234567892',
        role: 'admin',
        status: 'active',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample vehicles
    const sampleVehicles = [
      {
        make: 'Honda',
        model: 'Civic',
        year: 2020,
        price: 25000,
        mileage: 15000,
        fuelType: 'Petrol',
        transmission: 'Automatic',
        sellerEmail: 'jane@example.com',
        location: 'New York, NY',
        description: 'Well maintained Honda Civic with low mileage',
        images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500'],
        features: ['Air Conditioning', 'Power Steering', 'Bluetooth'],
        status: 'published',
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        make: 'Toyota',
        model: 'Camry',
        year: 2019,
        price: 22000,
        mileage: 25000,
        fuelType: 'Petrol',
        transmission: 'Automatic',
        sellerEmail: 'jane@example.com',
        location: 'Los Angeles, CA',
        description: 'Reliable Toyota Camry in excellent condition',
        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=500'],
        features: ['Air Conditioning', 'Power Steering', 'Backup Camera'],
        status: 'published',
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    
    console.log('🗑️ Cleared existing data');

    // Insert sample data
    const users = await User.insertMany(sampleUsers);
    const vehicles = await Vehicle.insertMany(sampleVehicles);
    
    console.log(`✅ Seeded ${users.length} users and ${vehicles.length} vehicles`);

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: users.length,
        vehicles: vehicles.length
      }
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    
    let errorMessage = 'Database seeding failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
