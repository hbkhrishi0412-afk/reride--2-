
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import Vehicle from './lib-vehicle.js';
import VehicleDataModel from '../models/VehicleData.js';
import type { VehicleData } from '../types';
// Constants will be imported dynamically when needed

// Helper: Calculate distance between coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    await connectToDatabase();

    // Check action type from query parameter
    const { type, action } = req.query;

    // VEHICLE DATA ENDPOINTS (brands, models, variants)
    if (type === 'data') {
      if (req.method === 'GET') {
        let vehicleDataDoc = await VehicleDataModel.findOne();
        
        if (!vehicleDataDoc) {
          vehicleDataDoc = await VehicleDataModel.create({ data: {} });
        }

        const vehicleData: VehicleData = {};
        
        if (vehicleDataDoc.data) {
          for (const [key, value] of vehicleDataDoc.data.entries()) {
            vehicleData[key] = value;
          }
        }

        return res.status(200).json(vehicleData);
      }
      
      if (req.method === 'POST' || req.method === 'PUT') {
        const newData: VehicleData = req.body;

        let vehicleDataDoc = await VehicleDataModel.findOne();
        
        if (!vehicleDataDoc) {
          vehicleDataDoc = new VehicleDataModel({ data: new Map() });
        }

        vehicleDataDoc.data = new Map(Object.entries(newData));
        await vehicleDataDoc.save();

        return res.status(200).json({ 
          success: true, 
          message: 'Vehicle data updated successfully',
          data: newData 
        });
      }
      
      return res.status(405).json({ error: 'Method not allowed for vehicle data' });
    }

    // CITY STATS ENDPOINT
    if (action === 'city-stats' && req.method === 'GET') {
      const { city } = req.query;
      if (!city || typeof city !== 'string') {
        return res.status(400).json({ error: 'City parameter required' });
      }

      const vehicles = await Vehicle.find({ city, status: 'published' }).lean();
      if (vehicles.length === 0) {
        return res.status(404).json({ error: 'No vehicles found in this city' });
      }

      const totalPrice = vehicles.reduce((sum: number, v: any) => sum + v.price, 0);
      const makeCount: Record<string, number> = {};
      const categoryCount: Record<string, number> = {};

      vehicles.forEach((v: any) => {
        makeCount[v.make] = (makeCount[v.make] || 0) + 1;
        categoryCount[v.category] = (categoryCount[v.category] || 0) + 1;
      });

      const stats = {
        cityName: city,
        stateCode: vehicles[0]?.state || '',
        totalListings: vehicles.length,
        averagePrice: Math.round(totalPrice / vehicles.length),
        popularMakes: Object.entries(makeCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([make]) => make),
        popularCategories: Object.entries(categoryCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat]) => cat),
      };

      return res.status(200).json(stats);
    }

    // RADIUS SEARCH ENDPOINT
    if (action === 'radius-search' && req.method === 'POST') {
      const { lat, lng, radiusKm = 10, filters = {} } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
      }

      let query: any = { 
        status: 'published',
        exactLocation: { $exists: true, $ne: null }
      };

      if (filters.category) query.category = filters.category;
      if (filters.make) query.make = filters.make;
      if (filters.model) query.model = filters.model;
      if (filters.minPrice) query.price = { $gte: filters.minPrice };
      if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };

      const vehicles = await Vehicle.find(query).lean();

      const results = vehicles
        .filter((v: any) => {
          if (!v.exactLocation) return false;
          const distance = calculateDistance(lat, lng, v.exactLocation.lat, v.exactLocation.lng);
          return distance <= radiusKm;
        })
        .map((v: any) => ({
          ...v,
          distanceFromUser: Math.round(
            calculateDistance(lat, lng, v.exactLocation.lat, v.exactLocation.lng) * 10
          ) / 10,
        }))
        .sort((a: any, b: any) => a.distanceFromUser - b.distanceFromUser);

      return res.status(200).json({ vehicles: results, count: results.length });
    }

    // LISTING REFRESH/RENEW ENDPOINT
    if (action === 'refresh' && req.method === 'POST') {
      const { vehicleId, refreshAction, sellerEmail } = req.body;

      if (!vehicleId || !refreshAction || !sellerEmail) {
        return res.status(400).json({ error: 'vehicleId, refreshAction, and sellerEmail required' });
      }

      if (!['refresh', 'renew'].includes(refreshAction)) {
        return res.status(400).json({ error: 'refreshAction must be refresh or renew' });
      }

      const vehicle = await Vehicle.findOne({ id: vehicleId });
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      if (vehicle.sellerEmail !== sellerEmail) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (refreshAction === 'refresh') {
        vehicle.listingLastRefreshed = new Date();
        vehicle.updatedAt = new Date();
      } else if (refreshAction === 'renew') {
        const newExpiryDate = new Date();
        const { LISTING_EXPIRY_DAYS } = await import('../constants');
        newExpiryDate.setDate(newExpiryDate.getDate() + LISTING_EXPIRY_DAYS);
        
        vehicle.listingExpiresAt = newExpiryDate;
        vehicle.listingRenewalCount = (vehicle.listingRenewalCount || 0) + 1;
        vehicle.listingLastRefreshed = new Date();
        vehicle.updatedAt = new Date();
        vehicle.status = 'published';
      }

      await vehicle.save();
      return res.status(200).json({ 
        message: `Listing ${refreshAction}ed successfully`,
        vehicle: vehicle.toObject()
      });
    }

    // BOOST LISTING ENDPOINT
    if (action === 'boost') {
      if (req.method === 'GET') {
        const { BOOST_PACKAGES } = await import('../constants');
        return res.status(200).json({ packages: BOOST_PACKAGES });
      }

      if (req.method === 'POST') {
        const { vehicleId, packageId, sellerEmail } = req.body;

        if (!vehicleId || !packageId || !sellerEmail) {
          return res.status(400).json({ error: 'vehicleId, packageId, and sellerEmail required' });
        }

        const vehicle = await Vehicle.findOne({ id: vehicleId });
        if (!vehicle) {
          return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (vehicle.sellerEmail !== sellerEmail) {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        const { BOOST_PACKAGES } = await import('../constants');
        const boostPackage = BOOST_PACKAGES.find(p => p.id === packageId);
        if (!boostPackage) {
          return res.status(404).json({ error: 'Boost package not found' });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + boostPackage.durationDays);

        const activeBoost = {
          id: `boost_${Date.now()}`,
          vehicleId,
          packageId,
          type: boostPackage.type,
          startDate: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          isActive: true,
          impressions: 0,
          clicks: 0,
        };

        if (!vehicle.activeBoosts) {
          vehicle.activeBoosts = [];
        }
        vehicle.activeBoosts.push(activeBoost);
        vehicle.boostExpiresAt = expiresAt;

        if (boostPackage.type === 'homepage_spotlight') {
          vehicle.isPremiumListing = true;
        }
        if (boostPackage.type === 'featured_badge') {
          vehicle.isFeatured = true;
        }

        await vehicle.save();

        return res.status(200).json({ 
          message: 'Listing boosted successfully',
          boost: activeBoost,
          vehicle: vehicle.toObject()
        });
      }

      return res.status(405).json({ error: 'Method not allowed for boost' });
    }

    // VEHICLE LISTINGS ENDPOINTS (actual vehicles)
    switch (req.method) {
      case 'GET': {
        const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
        
        // Update vehicles that don't have expiry dates
        const vehiclesToUpdate = vehicles.filter(v => !v.listingExpiresAt);
        if (vehiclesToUpdate.length > 0) {
          console.log(`🔄 Updating ${vehiclesToUpdate.length} vehicles with expiry dates`);
          
          for (const vehicle of vehiclesToUpdate) {
            const expiryDate = new Date();
            const { LISTING_EXPIRY_DAYS } = await import('../constants');
            expiryDate.setDate(expiryDate.getDate() + LISTING_EXPIRY_DAYS);
            
            await Vehicle.findOneAndUpdate(
              { id: vehicle.id },
              {
                listingExpiresAt: expiryDate.toISOString(),
                listingRenewalCount: 0,
                listingAutoRenew: false,
                createdAt: vehicle.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            );
          }
          
          // Fetch updated vehicles
          const updatedVehicles = await Vehicle.find({}).sort({ createdAt: -1 });
          return res.status(200).json(updatedVehicles);
        }
        
        return res.status(200).json(vehicles);
      }

      case 'POST': {
        console.log('📥 POST /api/vehicles - Received vehicle data');
        const newVehicleData = req.body;
        console.log('📦 Vehicle data:', JSON.stringify(newVehicleData, null, 2));
        
        console.log('🔍 Field type check:', {
          price: { value: newVehicleData.price, type: typeof newVehicleData.price },
          year: { value: newVehicleData.year, type: typeof newVehicleData.year },
          mileage: { value: newVehicleData.mileage, type: typeof newVehicleData.mileage }
        });
        
        if (!newVehicleData.sellerEmail) {
          console.error('❌ Missing sellerEmail in request');
          return res.status(400).json({ error: 'sellerEmail is required' });
        }
        
        if (!newVehicleData.make || !newVehicleData.model) {
          console.error('❌ Missing required fields:', { make: newVehicleData.make, model: newVehicleData.model });
          return res.status(400).json({ error: 'make and model are required' });
        }
        
        if (!newVehicleData.price || typeof newVehicleData.price !== 'number' || newVehicleData.price <= 0) {
          console.error('❌ Invalid price:', newVehicleData.price, 'Type:', typeof newVehicleData.price);
          return res.status(400).json({ error: 'Valid price (number > 0) is required' });
        }
        
        if (typeof newVehicleData.year !== 'number' || newVehicleData.year < 1900) {
          console.error('❌ Invalid year:', newVehicleData.year, 'Type:', typeof newVehicleData.year);
          return res.status(400).json({ error: 'Valid year (number) is required' });
        }
        
        if (typeof newVehicleData.mileage !== 'number' || newVehicleData.mileage < 0) {
          console.error('❌ Invalid mileage:', newVehicleData.mileage, 'Type:', typeof newVehicleData.mileage);
          return res.status(400).json({ error: 'Valid mileage (number >= 0) is required' });
        }
        
        if (!newVehicleData.id) {
          newVehicleData.id = Date.now();
          console.log('🔢 Generated ID:', newVehicleData.id);
        }
        
        // Set listing lifecycle fields for new vehicles
        const now = new Date();
        newVehicleData.createdAt = now.toISOString();
        newVehicleData.updatedAt = now.toISOString();
        
        // Set expiry date (30 days from now)
        const expiryDate = new Date();
        const { LISTING_EXPIRY_DAYS } = await import('../constants');
        expiryDate.setDate(expiryDate.getDate() + LISTING_EXPIRY_DAYS);
        newVehicleData.listingExpiresAt = expiryDate.toISOString();
        
        // Initialize lifecycle fields
        newVehicleData.listingRenewalCount = 0;
        newVehicleData.listingAutoRenew = false;
        
        console.log('💾 Creating vehicle in MongoDB...');
        console.log('📋 Vehicle data being saved:', JSON.stringify(newVehicleData, null, 2));
        
        try {
          const vehicle = await Vehicle.create(newVehicleData);
          console.log('✅ Vehicle created successfully:', vehicle.id);
          return res.status(201).json(vehicle);
        } catch (createError: any) {
          console.error('❌ Vehicle creation failed:', createError);
          
          if (createError.name === 'ValidationError') {
            console.error('MongoDB Validation errors:', createError.errors);
            const errorMessages = Object.keys(createError.errors).map(key => 
              `${key}: ${createError.errors[key].message}`
            ).join(', ');
            return res.status(400).json({
              error: `Validation failed: ${errorMessages}`,
              details: createError.errors,
              provided: newVehicleData
            });
          }
          
          if (createError.code === 11000) {
            console.error('Duplicate key error:', createError.keyValue);
            newVehicleData.id = Date.now() + Math.floor(Math.random() * 1000);
            console.log('🔄 Retrying with new ID:', newVehicleData.id);
            const vehicle = await Vehicle.create(newVehicleData);
            console.log('✅ Vehicle created successfully on retry:', vehicle.id);
            return res.status(201).json(vehicle);
          }
          
          throw createError;
        }
      }

      case 'PUT': {
        const { id, ...updateData } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'Vehicle ID is required for update.' });
        }
        const updatedVehicle = await Vehicle.findOneAndUpdate({ id }, updateData, { new: true });
        if (!updatedVehicle) {
          const newVehicle = await Vehicle.create({ id, ...updateData });
          return res.status(201).json(newVehicle);
        }
        return res.status(200).json(updatedVehicle);
      }

      case 'DELETE': {
        const { id } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'Vehicle ID is required for deletion.' });
        }
        const result = await Vehicle.deleteOne({ id });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Vehicle not found.' });
        }
        return res.status(200).json({ success: true, id });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Vehicles Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return res.status(500).json({ error: message });
  }
}
