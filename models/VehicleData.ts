import mongoose from 'mongoose';

// Schema for vehicle data structure (categories, makes, models, variants)
const vehicleDataSchema = new mongoose.Schema({
  // Store vehicle data as a flexible object
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

const VehicleDataModel = mongoose.models.VehicleData || mongoose.model('VehicleData', vehicleDataSchema);

export default VehicleDataModel;

