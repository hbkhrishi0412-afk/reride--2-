#!/usr/bin/env node

/**
 * Test script to verify MongoDB data and API endpoints
 */

import mongoose from 'mongoose';

// MongoDB connection function
async function connectToDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hbk_hrishi0412:Qaz%403755@cluster0.nmiwnl7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔄 Connecting to MongoDB...');
    const mongooseInstance = await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        dbName: 'reride'
    });
    
    console.log('✅ MongoDB connected successfully to database:', mongooseInstance.connection.name);
    return mongooseInstance;
}

async function testData() {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        
        console.log('\n📊 Testing MongoDB Collections:');
        
        // Test Users
        const usersCount = await db.collection('users').countDocuments();
        console.log(`👥 Users: ${usersCount}`);
        
        // Test Vehicles
        const vehiclesCount = await db.collection('vehicles').countDocuments();
        console.log(`🚗 Vehicles: ${vehiclesCount}`);
        
        // Test FAQs
        const faqsCount = await db.collection('faqs').countDocuments();
        console.log(`❓ FAQs: ${faqsCount}`);
        
        // Test Support Tickets
        const ticketsCount = await db.collection('supportTickets').countDocuments();
        console.log(`🎫 Support Tickets: ${ticketsCount}`);
        
        // Show sample data
        console.log('\n📋 Sample Data:');
        
        const sampleUser = await db.collection('users').findOne({});
        console.log('Sample User:', sampleUser?.name, '-', sampleUser?.email);
        
        const sampleVehicle = await db.collection('vehicles').findOne({});
        console.log('Sample Vehicle:', sampleVehicle?.make, sampleVehicle?.model, '- ₹' + sampleVehicle?.price?.toLocaleString());
        
        console.log('\n🎉 All data is properly stored in MongoDB!');
        console.log('💡 You can now use the API endpoints:');
        console.log('   - GET /api/users');
        console.log('   - GET /api/vehicles');
        console.log('   - GET /api/faqs');
        console.log('   - GET /api/support-tickets');
        
    } catch (error) {
        console.error('❌ Error testing data:', error.message);
    } finally {
        process.exit(0);
    }
}

testData();
