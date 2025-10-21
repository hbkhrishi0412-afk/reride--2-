import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db';

// This file consolidates payment processing functionality
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
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Route to appropriate payment service
    if (pathname.includes('/payment-requests') || pathname.endsWith('/payment-requests')) {
      return await handlePaymentRequests(req, res);
    } else {
      return res.status(404).json({ success: false, reason: 'Payment endpoint not found' });
    }

  } catch (error) {
    console.error('Payments API Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return res.status(500).json({ success: false, reason: message, error: message });
  }
}

// Payment requests handler - preserves exact functionality from payment-requests.ts
async function handlePaymentRequests(req: VercelRequest, res: VercelResponse) {
  await connectToDatabase();

  const { action } = req.query;

  if (action === 'create') {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, reason: 'Method not allowed' });
    }

    try {
      const { sellerEmail, amount, plan, packageId } = req.body;
      
      if (!sellerEmail || !amount || !plan) {
        return res.status(400).json({ 
          success: false, 
          reason: 'Seller email, amount, and plan are required' 
        });
      }

      // Create payment request (simplified for demo)
      const paymentRequest = {
        id: Date.now(),
        sellerEmail,
        amount,
        plan,
        packageId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      return res.status(201).json({
        success: true,
        paymentRequest,
        message: 'Payment request created successfully'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        reason: 'Failed to create payment request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (action === 'status') {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, reason: 'Method not allowed' });
    }

    try {
      const { sellerEmail } = req.query;
      
      if (!sellerEmail) {
        return res.status(400).json({ 
          success: false, 
          reason: 'Seller email is required' 
        });
      }

      // Get payment status (simplified for demo)
      const paymentStatus = {
        sellerEmail: sellerEmail as string,
        status: 'pending',
        lastPayment: null,
        nextDue: null
      };

      return res.status(200).json({
        success: true,
        paymentStatus
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        reason: 'Failed to get payment status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (action === 'approve') {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, reason: 'Method not allowed' });
    }

    try {
      const { paymentRequestId } = req.body;
      
      if (!paymentRequestId) {
        return res.status(400).json({ 
          success: false, 
          reason: 'Payment request ID is required' 
        });
      }

      // Approve payment (simplified for demo)
      return res.status(200).json({
        success: true,
        message: 'Payment request approved successfully',
        paymentRequestId
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        reason: 'Failed to approve payment request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (action === 'reject') {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, reason: 'Method not allowed' });
    }

    try {
      const { paymentRequestId, reason } = req.body;
      
      if (!paymentRequestId) {
        return res.status(400).json({ 
          success: false, 
          reason: 'Payment request ID is required' 
        });
      }

      // Reject payment (simplified for demo)
      return res.status(200).json({
        success: true,
        message: 'Payment request rejected',
        paymentRequestId,
        reason: reason || 'No reason provided'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        reason: 'Failed to reject payment request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all payment requests
  if (req.method === 'GET') {
    try {
      // Return empty array for demo (in real implementation, fetch from database)
      const paymentRequests = [];
      
      return res.status(200).json({
        success: true,
        paymentRequests
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        reason: 'Failed to get payment requests',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(400).json({ success: false, reason: 'Invalid payment action' });
}
