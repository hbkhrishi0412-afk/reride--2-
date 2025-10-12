
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import Vehicle from './lib-vehicle.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET': {
        const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
        return res.status(200).json(vehicles);
      }
      case 'POST': {
        console.log('📥 POST /api/vehicles - Received vehicle data');
        const newVehicleData = req.body;
        console.log('📦 Vehicle data:', JSON.stringify(newVehicleData, null, 2));
        
        // Validate required fields
        if (!newVehicleData.sellerEmail) {
          console.error('❌ Missing sellerEmail in request');
          return res.status(400).json({ error: 'sellerEmail is required' });
        }
        
        if (!newVehicleData.make || !newVehicleData.model) {
          console.error('❌ Missing required fields:', { make: newVehicleData.make, model: newVehicleData.model });
          return res.status(400).json({ error: 'make and model are required' });
        }
        
        // Replicate frontend logic for ID generation if not provided.
        // A more robust unique ID generator is recommended for production.
        if (!newVehicleData.id) {
            newVehicleData.id = Date.now();
            console.log('🔢 Generated ID:', newVehicleData.id);
        }
        
        console.log('💾 Creating vehicle in MongoDB...');
        const vehicle = await Vehicle.create(newVehicleData);
        console.log('✅ Vehicle created successfully:', vehicle.id);
        return res.status(201).json(vehicle);
      }
      case 'PUT': {
        const { id, ...updateData } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'Vehicle ID is required for update.' });
        }
        const updatedVehicle = await Vehicle.findOneAndUpdate({ id }, updateData, { new: true });
        if (!updatedVehicle) {
            // If not found, it might be a new vehicle from an older local state, create it.
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
