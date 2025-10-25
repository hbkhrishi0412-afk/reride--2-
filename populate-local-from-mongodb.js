#!/usr/bin/env node

/**
 * Script to populate localStorage with MongoDB data for development
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://hbk_hrishi0412:Qaz%403755@cluster0.nmiwnl7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectToDatabase() {
    console.log('🔄 Connecting to MongoDB...');
    const mongooseInstance = await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        dbName: 'reride'
    });
    
    console.log('✅ MongoDB connected successfully');
    return mongooseInstance;
}

async function populateLocalStorage() {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        
        console.log('\n📊 Fetching data from MongoDB...');
        
        // Get all vehicles
        const vehicles = await db.collection('vehicles').find({}).toArray();
        console.log(`🚗 Found ${vehicles.length} vehicles`);
        
        // Get all users
        const users = await db.collection('users').find({}).toArray();
        console.log(`👥 Found ${users.length} users`);
        
        // Create localStorage data files
        const fs = await import('fs');
        const path = await import('path');
        
        // Create localStorage directory if it doesn't exist
        const localStorageDir = path.join(process.cwd(), 'localStorage');
        if (!fs.existsSync(localStorageDir)) {
            fs.mkdirSync(localStorageDir);
        }
        
        // Write vehicles to localStorage file
        const vehiclesFile = path.join(localStorageDir, 'reRideVehicles.json');
        fs.writeFileSync(vehiclesFile, JSON.stringify(vehicles, null, 2));
        console.log(`✅ Vehicles saved to ${vehiclesFile}`);
        
        // Write users to localStorage file
        const usersFile = path.join(localStorageDir, 'reRideUsers.json');
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log(`✅ Users saved to ${usersFile}`);
        
        console.log('\n🎉 localStorage populated successfully!');
        console.log('💡 The frontend should now display vehicles from MongoDB data.');
        
    } catch (error) {
        console.error('❌ Error populating localStorage:', error.message);
    } finally {
        process.exit(0);
    }
}

populateLocalStorage();
