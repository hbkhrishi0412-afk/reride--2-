import React, { useState, useEffect } from 'react';
import type { Vehicle, User } from '../types';
import {
  getDaysUntilExpiry,
  isListingExpired,
} from '../services/listingLifecycleService';

interface ListingLifecycleIndicatorProps {
  vehicle: Vehicle;
  onRefresh?: () => void;
  onRenew?: () => void;
  compact?: boolean;
  seller?: User; // Add seller info to check plan expiry for Premium plans
}

const ListingLifecycleIndicator: React.FC<ListingLifecycleIndicatorProps> = ({
  vehicle,
  onRefresh,
  onRenew,
  compact = false,
  seller,
}) => {
  // Real-time update state for expiry dates
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute for real-time expiry calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Pass seller plan info to consider Premium plan expiry
  const sellerPlan = seller ? {
    subscriptionPlan: seller.subscriptionPlan,
    planExpiryDate: seller.planExpiryDate
  } : undefined;
  
  // Recalculate expiry based on current time (for real-time updates)
  const daysUntilExpiry = getDaysUntilExpiry(vehicle, sellerPlan, currentTime);
  const isExpired = isListingExpired(vehicle, sellerPlan, currentTime);
  const isUnpublished = vehicle.status === 'unpublished' || vehicle.status === 'archived';
  const isSold = vehicle.status === 'sold' || vehicle.listingStatus === 'sold';
  const isExpiringSoon = !isExpired && !isSold && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  const hasNoExpiry = !isExpired && !isSold && !isUnpublished && daysUntilExpiry === -1;

  const getStatusColor = () => {
    if (isSold) return { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' };
    if (isExpired) return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
    if (isUnpublished) return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
    if (hasNoExpiry) return { bg: '#E0F2FE', text: '#0277BD', border: '#81D4FA' };
    if (isExpiringSoon) return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
    return { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' };
  };

  const colors = getStatusColor();

  const getStatusIcon = () => {
    if (isSold) return '●';
    if (isExpired) return '●';
    if (isUnpublished) return '●';
    if (hasNoExpiry) return '●';
    if (isExpiringSoon) return '●';
    return '●';
  };

  const getStatusText = () => {
    if (isSold) return 'Sold';
    if (isExpired) return 'Expired';
    if (isUnpublished) return 'Unpublished';
    if (hasNoExpiry) return 'Active (No expiry)';
    
    // For Premium plans, show plan expiry info
    if (seller?.subscriptionPlan === 'premium' && seller?.planExpiryDate && new Date(seller.planExpiryDate) > new Date()) {
      return `Active (Plan expires in ${daysUntilExpiry} days)`;
    }
    
    if (isExpiringSoon) return `Expires in ${daysUntilExpiry} days`;
    return `Active (${daysUntilExpiry} days left)`;
  };

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg border-2"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className="font-semibold" style={{ color: colors.text }}>
              {getStatusText()}
            </h3>
            {vehicle.listingExpiresAt && daysUntilExpiry !== -1 && (
              <p className="text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                Expires: {new Date(vehicle.listingExpiresAt).toLocaleDateString()}
              </p>
            )}
            {!vehicle.listingExpiresAt && daysUntilExpiry === -1 && (
              <p className="text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                No expiry date set
              </p>
            )}
          </div>
        </div>

        {vehicle.listingAutoRenew && (
          <div className="flex items-center gap-1 px-2 py-1 bg-white/50 rounded text-xs font-medium">
            <span>🔄</span>
            <span>Auto-renew ON</span>
          </div>
        )}
      </div>

      {vehicle.listingLastRefreshed && (
        <p className="text-xs mb-3" style={{ color: colors.text, opacity: 0.7 }}>
          Last refreshed: {new Date(vehicle.listingLastRefreshed).toLocaleDateString()}
        </p>
      )}

      {(isExpired || isExpiringSoon) && (
        <div className="flex gap-2 mt-3">
          {onRefresh && !isExpired && (
            <button
              onClick={onRefresh}
              className="flex-1 px-4 py-2 bg-white rounded-lg text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ color: colors.text }}
            >
              🔄 Refresh Now
            </button>
          )}
          {onRenew && (
            <button
              onClick={onRenew}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: colors.text }}
            >
              {isExpired ? '♻️ Renew Listing' : '🔄 Renew Early'}
            </button>
          )}
        </div>
      )}

      {isExpiringSoon && !isExpired && (
        <div className="mt-3 p-2 bg-white/50 rounded text-xs" style={{ color: colors.text }}>
          <p className="font-medium">💡 Tip: Renew early to maintain visibility!</p>
        </div>
      )}

      {isExpired && (
        <div className="mt-3 p-2 bg-white/50 rounded text-xs" style={{ color: colors.text }}>
          <p className="font-medium">⚠️ Your listing is not visible to buyers. Renew now to activate it.</p>
        </div>
      )}
    </div>
  );
};

export default ListingLifecycleIndicator;

