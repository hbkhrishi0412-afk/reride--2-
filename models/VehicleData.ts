import mongoose from 'mongoose';

// Schema for vehicle data structure (categories, makes, models, variants)
const vehicleDataSchema = new mongoose.Schema({
  // We'll use a single document with _id to store all vehicle data
  data: {
    type: Map,
    of: [{
      name: { type: String, required: true },
      models: [{
        name: { type: String, required: true },
        variants: [String]
      }]
    }],
    required: true
  }
}, {
  timestamps: true
});

const VehicleDataModel = mongoose.models.VehicleData || mongoose.model('VehicleData', vehicleDataSchema);

export default VehicleDataModel;

