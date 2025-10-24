const mongoose = require('mongoose');

async function testVehicleDataSync() {
  try {
    // Connect to MongoDB
    const uri = 'mongodb+srv://hbk_hrishi0412:Qaz%403755@re-ride.69dzn4v.mongodb.net/?appName=Re-ride';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // Define VehicleData schema
    const vehicleDataSchema = new mongoose.Schema({
      data: mongoose.Schema.Types.Mixed
    }, { timestamps: true });
    
    const VehicleDataModel = mongoose.model('VehicleData', vehicleDataSchema);
    
    console.log('🔍 Checking VehicleData collection...');
    const vehicleData = await VehicleDataModel.findOne();
    
    if (vehicleData) {
      console.log('✅ Vehicle data found in MongoDB:');
      console.log('📅 Last updated:', vehicleData.updatedAt);
      console.log('📊 Categories:', Object.keys(vehicleData.data || {}).length);
      console.log('📋 Sample categories:', Object.keys(vehicleData.data || {}).slice(0, 3));
      
      // Show sample data structure
      if (vehicleData.data) {
        const firstCategory = Object.keys(vehicleData.data)[0];
        if (firstCategory && vehicleData.data[firstCategory]) {
          console.log(`📝 Sample data for "${firstCategory}":`, 
            vehicleData.data[firstCategory].length, 'makes');
        }
      }
    } else {
      console.log('❌ No vehicle data found in MongoDB');
      console.log('💡 This means sync hasn\'t happened yet or data needs to be seeded');
    }
    
    // Test creating/updating vehicle data
    console.log('\n🧪 Testing sync functionality...');
    const testData = {
      'TEST_CATEGORY': [
        { name: 'Test Make', models: [{ name: 'Test Model', variants: ['Test Variant'] }] }
      ]
    };
    
    const result = await VehicleDataModel.findOneAndUpdate(
      {},
      { data: testData },
      { upsert: true, new: true }
    );
    
    console.log('✅ Test sync successful!');
    console.log('📅 Updated at:', result.updatedAt);
    
    // Clean up test data
    await VehicleDataModel.deleteOne({ _id: result._id });
    console.log('🧹 Test data cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testVehicleDataSync();
