// Simple database seeding script with embedded data
// Run this with: node seed-simple.js

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reride';

// Helper to generate past dates
const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

// Mock users data
const MOCK_USERS = [
    { 
        name: 'Prestige Motors', 
        email: 'seller@test.com', 
        password: 'password', 
        mobile: '555-123-4567', 
        role: 'seller', 
        status: 'active', 
        createdAt: daysAgo(30), 
        dealershipName: 'Prestige Motors', 
        bio: 'Specializing in luxury and performance electric vehicles since 2020.', 
        logoUrl: 'https://i.pravatar.cc/100?u=seller', 
        avatarUrl: 'https://i.pravatar.cc/150?u=seller@test.com', 
        isVerified: true, 
        subscriptionPlan: 'premium', 
        featuredCredits: 5, 
        usedCertifications: 1 
    },
    { 
        name: 'Mock Customer', 
        email: 'customer@test.com', 
        password: 'password', 
        mobile: '555-987-6543', 
        role: 'customer', 
        status: 'active', 
        createdAt: daysAgo(15), 
        avatarUrl: 'https://i.pravatar.cc/150?u=customer@test.com' 
    },
    { 
        name: 'Mock Admin', 
        email: 'admin@test.com', 
        password: 'password', 
        mobile: '111-222-3333', 
        role: 'admin', 
        status: 'active', 
        createdAt: daysAgo(100), 
        avatarUrl: 'https://i.pravatar.cc/150?u=admin@test.com' 
    },
    { 
        name: 'Jane Doe', 
        email: 'jane.doe@customer.com', 
        password: 'password', 
        mobile: '555-111-2222', 
        role: 'customer', 
        status: 'active', 
        createdAt: daysAgo(5), 
        avatarUrl: 'https://i.pravatar.cc/150?u=jane.doe@customer.com' 
    },
    { 
        name: 'Reliable Rides', 
        email: 'john.smith@seller.com', 
        password: 'password', 
        mobile: '555-333-4444', 
        role: 'seller', 
        status: 'active', 
        createdAt: daysAgo(60), 
        dealershipName: 'Reliable Rides', 
        bio: 'Your trusted source for pre-owned family cars and SUVs.', 
        logoUrl: 'https://i.pravatar.cc/100?u=johnsmith', 
        avatarUrl: 'https://i.pravatar.cc/150?u=john.smith@seller.com', 
        isVerified: false, 
        subscriptionPlan: 'pro', 
        featuredCredits: 2, 
        usedCertifications: 0 
    }
];

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  role: { type: String, enum: ['customer', 'seller', 'admin'], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  avatarUrl: String,
  isVerified: { type: Boolean, default: false },
  dealershipName: String,
  bio: String,
  logoUrl: String,
  subscriptionPlan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  featuredCredits: { type: Number, default: 0 },
  usedCertifications: { type: Number, default: 0 },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing data');

    console.log('Seeding users...');
    await User.insertMany(MOCK_USERS);
    console.log(`✅ Seeded ${MOCK_USERS.length} users`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Admin login credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password');
    console.log('\n📋 Other test accounts:');
    console.log('   Customer: customer@test.com / password');
    console.log('   Seller: seller@test.com / password');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB username and password');
    } else if (error.message.includes('network')) {
      console.error('💡 Check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('MONGODB_URI')) {
      console.error('💡 Check your MONGODB_URI environment variable');
    }
    process.exit(1);
  }
}

seedDatabase();
