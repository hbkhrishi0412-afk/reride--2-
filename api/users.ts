import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    switch (req.method) {
      case 'GET':
        return await handleGetUsers(req, res, collection);
      case 'POST':
        return await handleCreateUser(req, res, collection);
      case 'PUT':
        return await handleUpdateUser(req, res, collection);
      case 'DELETE':
        return await handleDeleteUser(req, res, collection);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleGetUsers(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const { role, email, limit } = req.query;
    
    let query: any = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (email) {
      query.email = email;
    }

    const limitNum = limit ? parseInt(limit as string) : 0;
    const users = await collection.find(query).limit(limitNum).toArray();
    
    return res.status(200).json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
}

async function handleCreateUser(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const userData = req.body;
    
    if (!userData.email || !userData.name || !userData.role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, name, role'
      });
    }

    // Check if user already exists
    const existingUser = await collection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    const result = await collection.insertOne({
      ...userData,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { ...userData, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
}

async function handleUpdateUser(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await collection.updateOne(
      { _id: id },
      { $set: { ...updateData, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
}

async function handleDeleteUser(req: VercelRequest, res: VercelResponse, collection: any) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
}
