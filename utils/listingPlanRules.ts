import { LISTING_EXPIRY_DAYS, PLAN_DETAILS } from '../constants/plans.js';
import type { PlanDetails, SubscriptionPlan, Vehicle } from '../types.js';

export interface SellerPlanContext {
  subscriptionPlan?: SubscriptionPlan | string;
  planExpiryDate?: string;
}

export interface ListingRenewalValidation {
  allowed: boolean;
  reason?: string;
  planExpired?: boolean;
  limitReached?: boolean;
  limit?: number;
  activeListings?: number;
  expiredOn?: string;
}

export function isSellerPlanExpired(seller: SellerPlanContext, now: Date = new Date()): boolean {
  if (!seller.planExpiryDate) return false;
  const expiry = new Date(seller.planExpiryDate);
  return !Number.isNaN(expiry.getTime()) && expiry < now;
}

/**
 * When a paid plan has lapsed, continue under free-tier listing rules
 * instead of hard-locking the seller out of renewals/publishes.
 */
export function effectiveSellerPlanForListings(
  seller: SellerPlanContext,
  now: Date = new Date(),
): SellerPlanContext {
  if (!isSellerPlanExpired(seller, now)) return seller;
  return { subscriptionPlan: 'free', planExpiryDate: undefined };
}

/**
 * Listing expiry aligned with plan rules.
 * Every listing MUST have an expiry date — no infinite listings.
 * Premium listings expire when the plan expires.
 * Free/Pro listings expire after LISTING_EXPIRY_DAYS (30 days).
 */
export function computeListingExpiresAtForSeller(seller: SellerPlanContext): string {
  const effective = effectiveSellerPlanForListings(seller);
  const plan = effective.subscriptionPlan || 'free';

  // Active Premium: listing expires when the plan expires
  if (plan === 'premium' && effective.planExpiryDate) {
    const planExpiry = new Date(effective.planExpiryDate);
    if (!Number.isNaN(planExpiry.getTime()) && planExpiry > new Date()) {
      return effective.planExpiryDate;
    }
  }

  // All plans (including lapsed premium): default 30-day window
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + LISTING_EXPIRY_DAYS);
  return expiryDate.toISOString();
}

export function planDetailsForSeller(
  seller: SellerPlanContext,
  override?: PlanDetails | null,
): PlanDetails {
  if (override) return override;
  const effective = effectiveSellerPlanForListings(seller);
  const planKey = (effective.subscriptionPlan || 'free') as SubscriptionPlan;
  return PLAN_DETAILS[planKey] || PLAN_DETAILS.free;
}

/** @deprecated Use planDetailsForSeller — kept for existing imports. */
export function getSellerPlanDetails(seller: SellerPlanContext) {
  return planDetailsForSeller(seller);
}

export function countPublishedListings(vehicles: Vehicle[]): number {
  return vehicles.filter((v) => v && v.status === 'published').length;
}

export function isListingLimitReached(
  seller: SellerPlanContext,
  sellerVehicles: Vehicle[],
  planDetailsOverride?: PlanDetails | null,
): boolean {
  const planDetails = planDetailsForSeller(seller, planDetailsOverride);
  if (planDetails.listingLimit === 'unlimited') return false;
  const numericLimit = Number(planDetails.listingLimit) || 0;
  return countPublishedListings(sellerVehicles) >= numericLimit;
}

function validatePublishSlot(
  seller: SellerPlanContext,
  sellerVehicles: Vehicle[],
  planDetails: PlanDetails,
  excludeVehicleId?: number,
): ListingRenewalValidation {
  // Lapsed paid plans fall back to free-tier limits (handled via planDetailsForSeller).
  // Keep planExpired in the payload so the UI can nudge upgrade, but do not hard-block.
  const planExpired = isSellerPlanExpired(seller);
  const listingLimit = planDetails.listingLimit;
  if (listingLimit !== 'unlimited') {
    const numericLimit = Number(listingLimit) || 0;
    const publishedExcluding = sellerVehicles.filter(
      (v) => v && v.status === 'published' && (excludeVehicleId == null || v.id !== excludeVehicleId),
    ).length;
    const activeAfterPublish = publishedExcluding + 1;

    if (activeAfterPublish > numericLimit) {
      return {
        allowed: false,
        reason: planExpired
          ? `Your subscription has expired and the free plan allows only ${listingLimit} active listing(s). Unpublish or sell another listing, or renew your plan.`
          : `Listing limit reached for your ${planDetails.name} plan. You can have up to ${listingLimit} active listing(s). Unpublish or sell another listing first.`,
        planExpired,
        limitReached: true,
        activeListings: countPublishedListings(sellerVehicles),
        limit: numericLimit,
        expiredOn: planExpired ? seller.planExpiryDate : undefined,
      };
    }
  }

  return {
    allowed: true,
    ...(planExpired
      ? { planExpired: true, expiredOn: seller.planExpiryDate }
      : {}),
  };
}

export function validateNewListingCreation(
  seller: SellerPlanContext,
  sellerVehicles: Vehicle[],
  planDetailsOverride?: PlanDetails | null,
): ListingRenewalValidation {
  const planDetails = planDetailsForSeller(seller, planDetailsOverride);
  return validatePublishSlot(seller, sellerVehicles, planDetails);
}

export function validateListingRenewal(
  seller: SellerPlanContext,
  vehicle: Vehicle,
  sellerVehicles: Vehicle[],
  planDetailsOverride?: PlanDetails | null,
): ListingRenewalValidation {
  const planDetails = planDetailsForSeller(seller, planDetailsOverride);
  return validatePublishSlot(seller, sellerVehicles, planDetails, vehicle.id);
}

export function buildListingRenewalUpdates(
  seller: SellerPlanContext,
  vehicle: Vehicle,
): Partial<Vehicle> {
  return {
    listingExpiresAt: computeListingExpiresAtForSeller(seller),
    listingStatus: 'active',
    status: 'published',
    listingLastRefreshed: new Date().toISOString(),
    listingRenewalCount: (vehicle.listingRenewalCount || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}
