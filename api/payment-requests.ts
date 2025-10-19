import { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from './lib-db';
import User from './lib-user';
import { PaymentRequest } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    await connectDB();

    const { action } = req.query;

    // GET PAYMENT REQUESTS (Admin only)
    if (req.method === 'GET' && action === 'list') {
      const { adminEmail, status } = req.query;

      if (!adminEmail) {
        return res.status(400).json({ error: 'Admin email required' });
      }

      // Verify admin
      const admin = await User.findOne({ email: adminEmail, role: 'admin' });
      if (!admin) {
        return res.status(403).json({ error: 'Unauthorized - Admin access required' });
      }

      // Get all users with pending payment requests
      const users = await User.find({
        'pendingPlanUpgrade.status': status || 'pending',
        role: 'seller'
      }).lean();

      const paymentRequests = users
        .filter(user => user.pendingPlanUpgrade)
        .map(user => ({
          id: user.pendingPlanUpgrade!.id,
          sellerEmail: user.email,
          sellerName: user.name,
          planId: user.pendingPlanUpgrade!.planId,
          amount: user.pendingPlanUpgrade!.amount,
          status: user.pendingPlanUpgrade!.status,
          paymentProof: user.pendingPlanUpgrade!.paymentProof,
          paymentMethod: user.pendingPlanUpgrade!.paymentMethod,
          transactionId: user.pendingPlanUpgrade!.transactionId,
          requestedAt: user.pendingPlanUpgrade!.requestedAt,
          approvedAt: user.pendingPlanUpgrade!.approvedAt,
          approvedBy: user.pendingPlanUpgrade!.approvedBy,
          rejectedAt: user.pendingPlanUpgrade!.rejectedAt,
          rejectedBy: user.pendingPlanUpgrade!.rejectedBy,
          rejectionReason: user.pendingPlanUpgrade!.rejectionReason,
          notes: user.pendingPlanUpgrade!.notes
        }));

      return res.status(200).json({ paymentRequests });
    }

    // CREATE PAYMENT REQUEST
    if (req.method === 'POST' && action === 'create') {
      const { sellerEmail, planId, amount, paymentProof, paymentMethod, transactionId } = req.body;

      if (!sellerEmail || !planId || !amount) {
        return res.status(400).json({ error: 'sellerEmail, planId, and amount required' });
      }

      // Verify seller exists
      const seller = await User.findOne({ email: sellerEmail, role: 'seller' });
      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      // Check if seller already has a pending request
      if (seller.pendingPlanUpgrade && seller.pendingPlanUpgrade.status === 'pending') {
        return res.status(400).json({ error: 'You already have a pending payment request' });
      }

      // Create payment request
      const paymentRequest: PaymentRequest = {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sellerEmail,
        planId,
        amount,
        status: 'pending',
        paymentProof,
        paymentMethod,
        transactionId,
        requestedAt: new Date().toISOString()
      };

      // Update user with pending payment request
      await User.updateOne(
        { email: sellerEmail },
        { pendingPlanUpgrade: paymentRequest }
      );

      return res.status(201).json({
        message: 'Payment request created successfully',
        paymentRequest
      });
    }

    // APPROVE PAYMENT REQUEST (Admin only)
    if (req.method === 'PUT' && action === 'approve') {
      const { paymentRequestId, adminEmail, notes } = req.body;

      if (!paymentRequestId || !adminEmail) {
        return res.status(400).json({ error: 'paymentRequestId and adminEmail required' });
      }

      // Verify admin
      const admin = await User.findOne({ email: adminEmail, role: 'admin' });
      if (!admin) {
        return res.status(403).json({ error: 'Unauthorized - Admin access required' });
      }

      // Find user with this payment request
      const user = await User.findOne({ 'pendingPlanUpgrade.id': paymentRequestId });
      if (!user || !user.pendingPlanUpgrade) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      if (user.pendingPlanUpgrade.status !== 'pending') {
        return res.status(400).json({ error: 'Payment request is not pending' });
      }

      // Approve the payment request
      const updatedPaymentRequest = {
        ...user.pendingPlanUpgrade,
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        approvedBy: adminEmail,
        notes
      };

      // Update user plan and credits
      const { PLAN_DETAILS } = await import('../constants');
      const planDetails = PLAN_DETAILS[user.pendingPlanUpgrade.planId];
      
      const updatedUser = {
        subscriptionPlan: user.pendingPlanUpgrade.planId,
        featuredCredits: (user.featuredCredits || 0) + planDetails.featuredCredits,
        pendingPlanUpgrade: updatedPaymentRequest
      };

      await User.updateOne(
        { email: user.email },
        updatedUser
      );

      return res.status(200).json({
        message: 'Payment request approved successfully',
        paymentRequest: updatedPaymentRequest
      });
    }

    // REJECT PAYMENT REQUEST (Admin only)
    if (req.method === 'PUT' && action === 'reject') {
      const { paymentRequestId, adminEmail, rejectionReason } = req.body;

      if (!paymentRequestId || !adminEmail) {
        return res.status(400).json({ error: 'paymentRequestId and adminEmail required' });
      }

      // Verify admin
      const admin = await User.findOne({ email: adminEmail, role: 'admin' });
      if (!admin) {
        return res.status(403).json({ error: 'Unauthorized - Admin access required' });
      }

      // Find user with this payment request
      const user = await User.findOne({ 'pendingPlanUpgrade.id': paymentRequestId });
      if (!user || !user.pendingPlanUpgrade) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      if (user.pendingPlanUpgrade.status !== 'pending') {
        return res.status(400).json({ error: 'Payment request is not pending' });
      }

      // Reject the payment request
      const updatedPaymentRequest = {
        ...user.pendingPlanUpgrade,
        status: 'rejected' as const,
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminEmail,
        rejectionReason
      };

      // Update user with rejected payment request
      await User.updateOne(
        { email: user.email },
        { pendingPlanUpgrade: updatedPaymentRequest }
      );

      return res.status(200).json({
        message: 'Payment request rejected',
        paymentRequest: updatedPaymentRequest
      });
    }

    // GET PAYMENT STATUS (Seller)
    if (req.method === 'GET' && action === 'status') {
      const { sellerEmail } = req.query;

      if (!sellerEmail) {
        return res.status(400).json({ error: 'sellerEmail required' });
      }

      const user = await User.findOne({ email: sellerEmail, role: 'seller' });
      if (!user) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      return res.status(200).json({
        paymentRequest: user.pendingPlanUpgrade || null
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Payment requests API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
