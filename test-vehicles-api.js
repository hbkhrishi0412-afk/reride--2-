#!/usr/bin/env node

/**
 * Test script to check if the vehicles API is working
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://hbk_hrishi0412:Qaz%403755@cluster0.nmiwnl7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testVehiclesAPI() {
    try {
        console.log('🔄 Testing Vehicles API...');
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
            dbName: 'reride'
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Test direct database query
        const db = mongoose.connection.db;
        const vehicles = await db.collection('vehicles').find({}).limit(5).toArray();
        
        console.log(`📊 Found ${vehicles.length} vehicles in database`);
        
        if (vehicles.length > 0) {
            console.log('Sample vehicle:', {
                id: vehicles[0].id,
                make: vehicles[0].make,
                model: vehicles[0].model,
                price: vehicles[0].price,
                status: vehicles[0].status
            });
        }
        
        // Test API endpoint
        console.log('\n🌐 Testing API endpoint...');
        try {
            const response = await fetch('http://localhost:5175/api/vehicles');
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API endpoint working!');
                console.log(`📊 API returned ${Array.isArray(data) ? data.length : 'unknown'} vehicles`);
            } else {
                console.log(`❌ API returned status: ${response.status}`);
                const errorText = await response.text();
                console.log('Error details:', errorText.substring(0, 200));
            }
        } catch (apiError) {
            console.log('❌ API test failed:', apiError.message);
            console.log('💡 Make sure the development server is running on port 5175');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testVehiclesAPI();
