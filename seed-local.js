// Local database seeding script
// Run this with: node seed-local.js

import mongoose from 'mongoose';
import { MOCK_USERS, MOCK_VEHICLES } from './constants.ts';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reride';

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
  usedCertifications: { type: Number, default: 0 }
}, { timestamps: true });

// Vehicle schema (simplified)
const vehicleSchema = new mongoose.Schema({
  id: Number,
  category: String,
  make: String,
  model: String,
  variant: String,
  year: Number,
  price: Number,
  mileage: Number,
  images: [String],
  videoUrl: String,
  features: [String],
  description: String,
  sellerEmail: String,
  engine: String,
  transmission: String,
  fuelType: String,
  fuelEfficiency: String,
  color: String,
  status: String,
  isFeatured: Boolean,
  views: Number,
  inquiriesCount: Number,
  isFlagged: Boolean,
  registrationYear: Number,
  insuranceValidity: String,
  insuranceType: String,
  rto: String,
  city: String,
  state: String,
  noOfOwners: Number,
  displacement: String,
  groundClearance: String,
  bootSpace: String,
  certificationStatus: String,
  certifiedInspection: Object,
  serviceRecords: [Object],
  accidentHistory: [Object]
});

const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('Cleared existing data');

    console.log('Seeding users...');
    await User.insertMany(MOCK_USERS);
    console.log(`Seeded ${MOCK_USERS.length} users`);

    console.log('Seeding vehicles...');
    await Vehicle.insertMany(MOCK_VEHICLES);
    console.log(`Seeded ${MOCK_VEHICLES.length} vehicles`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nAdmin login credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: password');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
