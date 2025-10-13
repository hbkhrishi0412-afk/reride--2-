// Vehicle model for MongoDB
// This file doesn't export a default handler, so it won't become an API route

import mongoose from 'mongoose';

// VehicleCategory enum inline to avoid external dependency
export enum VehicleCategory {
  TWO_WHEELER = 'two-wheeler',
  THREE_WHEELER = 'three-wheeler',
  FOUR_WHEELER = 'four-wheeler',
  COMMERCIAL = 'commercial'
}

const vehicleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  category: { type: String, enum: Object.values(VehicleCategory), required: true, default: VehicleCategory.FOUR_WHEELER },
  make: { type: String, required: true, index: true },
  model: { type: String, required: true, index: true },
  variant: String,
  year: { type: Number, required: true, index: true },
  price: { type: Number, required: true, index: true },
  mileage: { type: Number, required: true },
  images: [String],
  features: [String],
  description: String,
  sellerEmail: { type: String, required: true, index: true },
  engine: String,
  transmission: String,
  fuelType: String,
  fuelEfficiency: String,
  color: String,
  status: { type: String, enum: ['published', 'unpublished', 'sold'], default: 'published', required: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  views: { type: Number, default: 0 },
  inquiriesCount: { type: Number, default: 0 },
  isFlagged: Boolean,
  flagReason: String,
  flaggedAt: String,
  registrationYear: Number,
  insuranceValidity: String,
  insuranceType: String,
  rto: String,
  city: { type: String, index: true },
  state: { type: String, index: true },
  noOfOwners: Number,
  displacement: String,
  groundClearance: String,
  bootSpace: String,
  qualityReport: { type: mongoose.Schema.Types.Mixed },
  certifiedInspection: { type: mongoose.Schema.Types.Mixed, default: null },
  certificationStatus: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
  videoUrl: String,
  serviceRecords: [mongoose.Schema.Types.Mixed],
  accidentHistory: [mongoose.Schema.Types.Mixed],
  documents: [mongoose.Schema.Types.Mixed],
  
  // Location & Discovery
  exactLocation: {
    type: {
      lat: Number,
      lng: Number,
    },
    default: null,
  },
  hideExactLocation: { type: Boolean, default: true },
  nearbyLandmarks: [String],
  
  // Listing Lifecycle
  listingExpiresAt: { type: Date, index: true },
  listingAutoRenew: { type: Boolean, default: false },
  listingRenewalCount: { type: Number, default: 0 },
  listingLastRefreshed: Date,
  
  // Promotion & Monetization
  isPremiumListing: { type: Boolean, default: false },
  isUrgentSale: { type: Boolean, default: false },
  isBestPrice: { type: Boolean, default: false },
  boostExpiresAt: Date,
  activeBoosts: [mongoose.Schema.Types.Mixed],
  
  // Analytics
  viewsLast7Days: { type: Number, default: 0 },
  viewsLast30Days: { type: Number, default: 0 },
  uniqueViewers: { type: Number, default: 0 },
  phoneViews: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
}, {
  timestamps: true
});

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;

