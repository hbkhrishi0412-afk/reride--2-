// Test MongoDB connection
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reride';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connection successful!');
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   1. Username and password are correct');
      console.log('   2. Database user exists in MongoDB Atlas');
      console.log('   3. User has read/write permissions');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Network error. Please check:');
      console.log('   1. Internet connection');
      console.log('   2. MongoDB Atlas network access settings');
      console.log('   3. IP address is whitelisted (or use 0.0.0.0/0 for development)');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS resolution failed. Please check:');
      console.log('   1. Connection string format is correct');
      console.log('   2. Cluster name is correct');
      console.log('   3. Special characters in password are URL encoded');
    }
  }
}

testConnection();
