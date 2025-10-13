import type { Vehicle, ListingLifecycle, ListingRefresh } from '../types';
import { LISTING_EXPIRY_DAYS, AUTO_REFRESH_DAYS } from '../constants';

// ============================================
// LISTING EXPIRY MANAGEMENT
// ============================================

// Calculate expiry date for a new listing
export function calculateExpiryDate(daysFromNow: number = LISTING_EXPIRY_DAYS): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

// Check if listing is expired
export function isListingExpired(vehicle: Vehicle): boolean {
  if (!vehicle.listingExpiresAt) return false;
  return new Date(vehicle.listingExpiresAt) < new Date();
}

// Get days until expiry
export function getDaysUntilExpiry(vehicle: Vehicle): number {
  if (!vehicle.listingExpiresAt) return -1;
  
  const expiryDate = new Date(vehicle.listingExpiresAt);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Filter expired listings
export function filterExpiredListings(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter(v => isListingExpired(v));
}

// Filter active listings
export function filterActiveListings(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter(v => !isListingExpired(v) && v.status === 'published');
}

// ============================================
// AUTO-REFRESH MANAGEMENT
// ============================================

// Check if listing needs refresh
export function needsRefresh(vehicle: Vehicle): boolean {
  if (!vehicle.listingLastRefreshed) return true;
  
  const lastRefresh = new Date(vehicle.listingLastRefreshed);
  const daysSinceRefresh = Math.floor(
    (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceRefresh >= AUTO_REFRESH_DAYS;
}

// Refresh listing (updates timestamp)
export function refreshListing(vehicle: Vehicle): Vehicle {
  return {
    ...vehicle,
    listingLastRefreshed: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// RENEWAL MANAGEMENT
// ============================================

// Renew expired listing
export function renewListing(vehicle: Vehicle, autoRenew: boolean = false): Vehicle {
  const renewalCount = (vehicle.listingRenewalCount || 0) + 1;
  
  return {
    ...vehicle,
    listingExpiresAt: calculateExpiryDate(),
    listingRenewalCount: renewalCount,
    listingAutoRenew: autoRenew,
    listingLastRefreshed: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'published',
  };
}

// Auto-renew listings that have auto-renew enabled
export function autoRenewListings(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.map(vehicle => {
    if (vehicle.listingAutoRenew && isListingExpired(vehicle)) {
      return renewListing(vehicle, true);
    }
    return vehicle;
  });
}

// ============================================
// LISTING ANALYTICS
// ============================================

// Get listing lifecycle info
export function getListingLifecycle(vehicle: Vehicle): ListingLifecycle {
  return {
    vehicleId: vehicle.id,
    createdAt: vehicle.createdAt || new Date().toISOString(),
    expiresAt: vehicle.listingExpiresAt || calculateExpiryDate(),
    lastRefreshedAt: vehicle.listingLastRefreshed,
    autoRenew: vehicle.listingAutoRenew || false,
    renewalCount: vehicle.listingRenewalCount || 0,
    status: isListingExpired(vehicle) ? 'expired' : 'active',
  };
}

// Get listings expiring soon (within X days)
export function getExpiringListings(
  vehicles: Vehicle[],
  daysThreshold: number = 7
): Vehicle[] {
  return vehicles.filter(vehicle => {
    const daysUntilExpiry = getDaysUntilExpiry(vehicle);
    return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
  });
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

// Check if seller should be notified about expiry
export function shouldNotifyExpiry(vehicle: Vehicle): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(vehicle);
  // Notify at 7, 3, and 1 day before expiry
  return [7, 3, 1].includes(daysUntilExpiry);
}

// Get notification message for expiry
export function getExpiryNotificationMessage(vehicle: Vehicle): string {
  const daysUntilExpiry = getDaysUntilExpiry(vehicle);
  const vehicleName = `${vehicle.make} ${vehicle.model}`;
  
  if (daysUntilExpiry === 1) {
    return `⚠️ Your listing "${vehicleName}" expires tomorrow! Renew now to keep it active.`;
  } else if (daysUntilExpiry <= 7) {
    return `⏰ Your listing "${vehicleName}" expires in ${daysUntilExpiry} days. Renew to continue receiving inquiries.`;
  } else if (daysUntilExpiry === 0) {
    return `🔴 Your listing "${vehicleName}" has expired. Renew now to make it visible again.`;
  }
  
  return `Your listing "${vehicleName}" is active.`;
}

// ============================================
// STORAGE HELPERS (LocalStorage)
// ============================================

const REFRESH_LOG_KEY = 'reride_listing_refreshes';

// Log listing refresh
export function logListingRefresh(refresh: ListingRefresh): void {
  try {
    const stored = localStorage.getItem(REFRESH_LOG_KEY);
    const refreshes: ListingRefresh[] = stored ? JSON.parse(stored) : [];
    
    refreshes.push(refresh);
    
    // Keep only last 100 refreshes
    const recentRefreshes = refreshes.slice(-100);
    
    localStorage.setItem(REFRESH_LOG_KEY, JSON.stringify(recentRefreshes));
  } catch (error) {
    console.error('Error logging refresh:', error);
  }
}

// Get refresh history for a vehicle
export function getRefreshHistory(vehicleId: number): ListingRefresh[] {
  try {
    const stored = localStorage.getItem(REFRESH_LOG_KEY);
    if (!stored) return [];
    
    const refreshes: ListingRefresh[] = JSON.parse(stored);
    return refreshes.filter(r => r.vehicleId === vehicleId);
  } catch (error) {
    console.error('Error getting refresh history:', error);
    return [];
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

// Refresh multiple listings
export function bulkRefreshListings(vehicles: Vehicle[]): Vehicle[] {
  const now = new Date().toISOString();
  
  return vehicles.map(vehicle => ({
    ...vehicle,
    listingLastRefreshed: now,
    updatedAt: now,
  }));
}

// Renew multiple listings
export function bulkRenewListings(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.map(vehicle => renewListing(vehicle));
}

