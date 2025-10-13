import React, { useState, useEffect } from 'react';
import type { User, TrustScore } from '../types';

interface TrustBadgeDisplayProps {
  user: User;
  showDetails?: boolean;
}

const TrustBadgeDisplay: React.FC<TrustBadgeDisplayProps> = ({ user, showDetails = false }) => {
  const [trustScore, setTrustScore] = useState<number>(user.trustScore || 0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Calculate trust score if not available
    if (user.trustScore === undefined) {
      let score = 0;
      
      // Verification
      const verificationStatus = user.verificationStatus;
      if (verificationStatus) {
        if (verificationStatus.phoneVerified) score += 10;
        if (verificationStatus.emailVerified) score += 10;
        if (verificationStatus.govtIdVerified) score += 10;
      }
      
      // Response rate
      if (user.responseRate) {
        score += (user.responseRate / 100) * 25;
      }
      
      // Ratings
      if (user.averageRating && user.ratingCount) {
        score += (user.averageRating / 5) * 20;
      }
      
      // Account age
      if (user.createdAt) {
        const days = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        score += Math.min((days / 30), 15);
      }
      
      // Sold listings
      if (user.soldListings) {
        score += Math.min(user.soldListings, 10);
      }
      
      setTrustScore(Math.min(Math.round(score), 100));
    }
  }, [user]);

  const getBadgeInfo = () => {
    if (trustScore >= 90) {
      return { label: 'Highly Trusted', color: '#10B981', bgColor: '#D1FAE5', icon: '✓✓✓' };
    } else if (trustScore >= 70) {
      return { label: 'Trusted', color: '#3B82F6', bgColor: '#DBEAFE', icon: '✓✓' };
    } else if (trustScore >= 50) {
      return { label: 'Verified', color: '#F59E0B', bgColor: '#FEF3C7', icon: '✓' };
    } else {
      return { label: 'New Seller', color: '#6B7280', bgColor: '#F3F4F6', icon: '○' };
    }
  };

  const badge = getBadgeInfo();
  const verificationStatus = user.verificationStatus;

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-transform hover:scale-105"
        style={{ backgroundColor: badge.bgColor, color: badge.color }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-sm font-semibold">{badge.icon}</span>
        <span className="text-sm font-semibold">{badge.label}</span>
        <span className="text-xs font-medium ml-1">({trustScore})</span>
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Trust Score</h4>
            <span className="text-lg font-bold" style={{ color: badge.color }}>
              {trustScore}/100
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Verifications</span>
              <span className="font-semibold">
                {(verificationStatus?.phoneVerified ? 1 : 0) + 
                 (verificationStatus?.emailVerified ? 1 : 0) + 
                 (verificationStatus?.govtIdVerified ? 1 : 0)}/3
              </span>
            </div>

            {user.responseRate !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                <span className="font-semibold">{Math.round(user.responseRate)}%</span>
              </div>
            )}

            {user.responseTimeMinutes !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Response</span>
                <span className="font-semibold">
                  {user.responseTimeMinutes < 60 
                    ? `${user.responseTimeMinutes}m` 
                    : `${Math.round(user.responseTimeMinutes / 60)}h`}
                </span>
              </div>
            )}

            {user.ratingCount && user.ratingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Reviews</span>
                <span className="font-semibold">
                  ⭐ {user.averageRating?.toFixed(1)} ({user.ratingCount})
                </span>
              </div>
            )}

            {user.soldListings !== undefined && user.soldListings > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Successful Sales</span>
                <span className="font-semibold">{user.soldListings}</span>
              </div>
            )}
          </div>

          {/* Verification Badges */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Verified:</p>
            <div className="flex flex-wrap gap-1">
              {verificationStatus?.phoneVerified && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                  📱 Phone
                </span>
              )}
              {verificationStatus?.emailVerified && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                  ✉️ Email
                </span>
              )}
              {verificationStatus?.govtIdVerified && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                  🆔 ID
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TrustBadgeDisplay;

