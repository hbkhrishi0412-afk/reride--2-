
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './lib-db.js';
import User from './lib-user.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    await connectToDatabase();

    // Handle authentication actions (POST with action parameter)
    if (req.method === 'POST') {
      const { action, email, password, role, name, mobile, firebaseUid, authProvider, avatarUrl } = req.body;

      // LOGIN
      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ success: false, reason: 'Email and password are required.' });
        }
        
        const user = await User.findOne({ email, password }).lean() as any;

        if (!user) {
          return res.status(401).json({ success: false, reason: 'Invalid credentials.' });
        }
        if (role && user.role !== role) {
          return res.status(403).json({ success: false, reason: `User is not a registered ${role}.` });
        }
        if (user.status === 'inactive') {
          return res.status(403).json({ success: false, reason: 'Your account has been deactivated.' });
        }

        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ success: true, user: userWithoutPassword });
      }

      // REGISTER
      if (action === 'register') {
        if (!email || !password || !name || !mobile || !role) {
          return res.status(400).json({ success: false, reason: 'All fields are required for registration.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ success: false, reason: 'An account with this email already exists.' });
        }

        const newUserDoc = {
          email,
          password,
          name,
          mobile,
          role,
          status: 'active',
          authProvider: 'email',
          avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
          subscriptionPlan: role === 'seller' ? 'free' : undefined,
          featuredCredits: role === 'seller' ? 0 : undefined,
          usedCertifications: role === 'seller' ? 0 : undefined,
        };

        const newUser = await User.create(newUserDoc);
        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return res.status(201).json({ success: true, user: userWithoutPassword });
      }

      // OAUTH LOGIN
      if (action === 'oauth-login') {
        if (!firebaseUid || !role) {
          return res.status(400).json({ success: false, reason: 'Firebase UID and role are required.' });
        }

        let user = await User.findOne({ firebaseUid }).lean() as any;

        if (user) {
          if (user.status === 'inactive') {
            return res.status(403).json({ success: false, reason: 'Your account has been deactivated.' });
          }
          
          const { password: _, ...userWithoutPassword } = user;
          return res.status(200).json({ success: true, user: userWithoutPassword });
        }

        const newUserDoc = {
          firebaseUid,
          email: email || '',
          name: name || 'User',
          mobile: mobile || '',
          role,
          authProvider: authProvider || 'google',
          status: 'active',
          avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${firebaseUid}`,
          isVerified: true,
          subscriptionPlan: role === 'seller' ? 'free' : undefined,
          featuredCredits: role === 'seller' ? 0 : undefined,
          usedCertifications: role === 'seller' ? 0 : undefined,
        };

        const newUser = await User.create(newUserDoc);
        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return res.status(201).json({ success: true, user: userWithoutPassword });
      }

      return res.status(400).json({ success: false, reason: 'Invalid action specified.' });
    }

    // TRUST SCORE ENDPOINT
    if (req.method === 'GET') {
      const { action: queryAction, email: queryEmail } = req.query;
      
      if (queryAction === 'trust-score' && queryEmail && typeof queryEmail === 'string') {
        const user = await User.findOne({ email: queryEmail }).lean();
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Calculate trust score
        let score = 0;
        
        // Verification points (max 30)
        const verificationStatus = (user as any).verificationStatus || {};
        let verificationCount = 0;
        if (verificationStatus.phoneVerified) verificationCount++;
        if (verificationStatus.emailVerified) verificationCount++;
        if (verificationStatus.govtIdVerified) verificationCount++;
        score += verificationCount * 10;
        
        // Response rate points (max 25)
        const responseRate = (user as any).responseRate || 0;
        score += (responseRate / 100) * 25;
        
        // Positive reviews points (max 20)
        const averageRating = (user as any).averageRating || 0;
        const ratingCount = (user as any).ratingCount || 0;
        if (ratingCount > 0) {
          score += (averageRating / 5) * 20;
        }
        
        // Account age points (max 15)
        if ((user as any).createdAt) {
          const accountAgeDays = Math.floor(
            (Date.now() - new Date((user as any).createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          score += Math.min((accountAgeDays / 30) * 1, 15);
        }
        
        // Successful deals points (max 10)
        const soldListings = (user as any).soldListings || 0;
        score += Math.min(soldListings, 10);
        
        const trustScore = Math.min(Math.round(score), 100);

        const trustScoreData = {
          userId: queryEmail,
          score: trustScore,
          factors: {
            verificationsComplete: verificationCount,
            responseRate: Math.round(responseRate),
            positiveReviews: ratingCount,
            accountAge: (user as any).createdAt ? Math.floor(
              (Date.now() - new Date((user as any).createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ) : 0,
            successfulDeals: soldListings,
          },
          lastCalculated: new Date().toISOString(),
        };

        // Get trust badge
        let badge;
        if (trustScore >= 90) {
          badge = { label: 'Highly Trusted', color: '#10B981', icon: '✓✓✓' };
        } else if (trustScore >= 70) {
          badge = { label: 'Trusted', color: '#3B82F6', icon: '✓✓' };
        } else if (trustScore >= 50) {
          badge = { label: 'Verified', color: '#F59E0B', icon: '✓' };
        } else {
          badge = { label: 'New Seller', color: '#6B7280', icon: '○' };
        }

        return res.status(200).json({ 
          trustScore: trustScoreData,
          badge
        });
      }
    }

    // Handle user management (GET, PUT, DELETE)
    switch (req.method) {
      case 'GET': {
        const users = await User.find({}).select('-password');
        return res.status(200).json(users);
      }
      
      case 'PUT': {
        const { email, ...updateData } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email is required for update.' });
        }
        const updatedUser = await User.findOneAndUpdate({ email }, updateData, { new: true }).select('-password');
        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json(updatedUser);
      }
      
      case 'DELETE': {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email is required for deletion.' });
        }
        const result = await User.deleteOne({ email });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json({ success: true, email });
      }
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Users Error:', error);
    
    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return res.status(500).json({ 
        success: false, 
        reason: 'Database configuration error. Please check MONGODB_URI environment variable.',
        details: 'The application is configured to use MongoDB but the connection string is not properly configured.'
      });
    }
    
    if (error instanceof Error && (error.message.includes('connect') || error.message.includes('timeout'))) {
      return res.status(500).json({ 
        success: false, 
        reason: 'Database connection failed. Please ensure the database is running and accessible.',
        details: 'Unable to connect to MongoDB database. Please check your database configuration and network connectivity.'
      });
    }
    
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return res.status(500).json({ success: false, reason: message, error: message });
  }
}
