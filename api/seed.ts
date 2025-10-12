
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import User from './lib-user.js';
import Vehicle from './lib-vehicle.js';
import { MOCK_USERS, MOCK_VEHICLES } from '../constants';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    // Allow both GET and POST for convenience
    if (request.method !== 'GET' && request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
    }

    console.log('🌱 Starting database seeding...');
    await connectToDatabase();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    const deletedUsers = await User.deleteMany({});
    const deletedVehicles = await Vehicle.deleteMany({});
    console.log(`   Deleted ${deletedUsers.deletedCount} users`);
    console.log(`   Deleted ${deletedVehicles.deletedCount} vehicles`);

    // Insert new data
    console.log('📥 Inserting new data...');
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
    return response.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in seed endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return response.status(500).json({ 
      success: false,
      error: 'Failed to seed database.', 
      details: errorMessage,
      help: 'Check that MONGODB_URI is set in Vercel environment variables and MongoDB Atlas network access is configured.'
    });
  }
}
