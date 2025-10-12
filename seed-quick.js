#!/usr/bin/env node

/**
 * Quick Database Seeding Script
 * 
 * This script seeds your MongoDB database with mock data.
 * Works for both local development and production.
 * 
 * Usage:
 *   node seed-quick.js
 *   node seed-quick.js <mongodb-uri>
 */

const readline = require('readline');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60) + '\n');
}

// Get MongoDB URI from command line, env, or prompt
async function getMongoUri() {
    // Check command line argument
    if (process.argv[2]) {
        return process.argv[2];
    }
    
    // Check environment variable
    if (process.env.MONGODB_URI) {
        log(`Using MONGODB_URI from environment`, 'cyan');
        return process.env.MONGODB_URI;
    }
    
    // Prompt user
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question('Enter MongoDB URI (or press Enter for localhost): ', (answer) => {
            rl.close();
            resolve(answer.trim() || 'mongodb://localhost:27017/reride');
        });
    });
}

async function seedDatabase() {
    try {
        logSection('🌱 RERIDE DATABASE SEEDING TOOL');
        
        // Import mongoose dynamically
        log('Loading dependencies...', 'cyan');
        const mongoose = await import('mongoose');
        
        // Get MongoDB URI
        const MONGODB_URI = await getMongoUri();
        const maskedUri = MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@');
        
        log(`\n📡 Connecting to: ${maskedUri}`, 'blue');
        
        // Connect to database
        await mongoose.default.connect(MONGODB_URI);
        log('✅ Connected successfully!\n', 'green');
        
        // Define schemas
        const userSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            password: { type: String, required: true },
            mobile: { type: String, required: true },
            role: { type: String, required: true },
            status: { type: String, default: 'active' },
            avatarUrl: String,
            isVerified: { type: Boolean, default: false },
            dealershipName: String,
            bio: String,
            logoUrl: String,
            subscriptionPlan: { type: String, default: 'free' },
            featuredCredits: { type: Number, default: 0 },
            usedCertifications: { type: Number, default: 0 },
            createdAt: String
        });
        
        const vehicleSchema = new mongoose.Schema({
            id: { type: Number, required: true, unique: true },
            category: String,
            make: { type: String, required: true },
            model: { type: String, required: true },
            variant: String,
            year: { type: Number, required: true },
            price: { type: Number, required: true },
            mileage: Number,
            images: [String],
            features: [String],
            description: String,
            sellerEmail: { type: String, required: true },
            engine: String,
            transmission: String,
            fuelType: String,
            fuelEfficiency: String,
            color: String,
            status: { type: String, default: 'published' },
            isFeatured: { type: Boolean, default: false },
            views: { type: Number, default: 0 },
            inquiriesCount: { type: Number, default: 0 },
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
            certifiedInspection: mongoose.Schema.Types.Mixed,
            videoUrl: String,
            serviceRecords: [mongoose.Schema.Types.Mixed],
            accidentHistory: [mongoose.Schema.Types.Mixed]
        });
        
        const User = mongoose.models.User || mongoose.model('User', userSchema);
        const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
        
        // Clear existing data
        log('🗑️  Clearing existing data...', 'yellow');
        const deletedUsers = await User.deleteMany({});
        const deletedVehicles = await Vehicle.deleteMany({});
        log(`   Deleted ${deletedUsers.deletedCount} users`, 'yellow');
        log(`   Deleted ${deletedVehicles.deletedCount} vehicles`, 'yellow');
        
        // Load mock data from constants
        log('\n📦 Loading mock data...', 'cyan');
        const { MOCK_USERS, MOCK_VEHICLES } = await import('./constants.ts');
        
        // Insert data
        log('📥 Inserting new data...', 'cyan');
        const insertedUsers = await User.insertMany(MOCK_USERS);
        const insertedVehicles = await Vehicle.insertMany(MOCK_VEHICLES);
        
        log(`   ✅ Inserted ${insertedUsers.length} users`, 'green');
        log(`   ✅ Inserted ${insertedVehicles.length} vehicles`, 'green');
        
        // Success summary
        logSection('🎉 DATABASE SEEDED SUCCESSFULLY!');
        
        log('📊 Summary:', 'bright');
        console.log(`   Total Users:    ${insertedUsers.length}`);
        console.log(`   Total Vehicles: ${insertedVehicles.length}`);
        
        logSection('🔑 TEST LOGIN CREDENTIALS');
        
        log('Admin Account:', 'red');
        console.log('   Email:    admin@test.com');
        console.log('   Password: password\n');
        
        log('Seller Accounts:', 'blue');
        console.log('   Email:    seller@test.com');
        console.log('   Name:     Prestige Motors');
        console.log('   Password: password\n');
        console.log('   Email:    john.smith@seller.com');
        console.log('   Name:     Reliable Rides');
        console.log('   Password: password\n');
        
        log('Customer Accounts:', 'green');
        console.log('   Email:    customer@test.com');
        console.log('   Password: password\n');
        console.log('   Email:    jane.doe@customer.com');
        console.log('   Password: password\n');
        
        log('✨ You can now use these credentials to log in!', 'magenta');
        
        await mongoose.disconnect();
        process.exit(0);
        
    } catch (error) {
        log('\n❌ ERROR SEEDING DATABASE', 'red');
        console.error(error.message);
        
        log('\n💡 Troubleshooting Tips:', 'yellow');
        console.log('   • Check your MongoDB URI is correct');
        console.log('   • Verify MongoDB Atlas network access (IP whitelist)');
        console.log('   • Ensure database credentials are valid');
        console.log('   • Check if MONGODB_URI environment variable is set');
        
        process.exit(1);
    }
}

// Run the seeding
seedDatabase();

