import type { ActiveBoost, Vehicle } from '../types.js';

export type FeaturedBoostType = 'featured_badge' | 'homepage_spotlight';

const FEATURED_BOOST_TYPES: readonly FeaturedBoostType[] = ['featured_badge', 'homepage_spotlight'];

/** True when a boost is marked active and has not passed expiresAt. */
export function isBoostCurrentlyActive(boost: ActiveBoost | null | undefined, now: Date = new Date()): boolean {
  if (!boost || !boost.isActive) return false;
  const expiresAt = new Date(boost.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt > now;
}

/** Active (non-expired) boosts, optionally filtered by type. */
export function getActiveBoosts(
  vehicle: Pick<Vehicle, 'activeBoosts'> | null | undefined,
  types?: ReadonlyArray<ActiveBoost['type']>,
  now: Date = new Date(),
): ActiveBoost[] {
  const boosts = vehicle?.activeBoosts;
  if (!Array.isArray(boosts) || boosts.length === 0) return [];
  return boosts.filter((boost) => {
    if (!isBoostCurrentlyActive(boost, now)) return false;
    if (types && types.length > 0 && !types.includes(boost.type)) return false;
    return true;
  });
}

export function hasActiveBoost(
  vehicle: Pick<Vehicle, 'activeBoosts'> | null | undefined,
  types?: ReadonlyArray<ActiveBoost['type']>,
  now: Date = new Date(),
): boolean {
  return getActiveBoosts(vehicle, types, now).length > 0;
}

/**
 * Buyer-facing featured eligibility:
 * - Active featured_badge or homepage_spotlight boost, OR
 * - Admin/legacy isFeatured with no featured-boost history
 * Sticky isFeatured after a featured boost expires does NOT count.
 */
export function isEffectivelyFeatured(
  vehicle: Pick<Vehicle, 'isFeatured' | 'activeBoosts'> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!vehicle) return false;
  if (hasActiveBoost(vehicle, FEATURED_BOOST_TYPES, now)) return true;
  if (!vehicle.isFeatured) return false;

  const boosts = Array.isArray(vehicle.activeBoosts) ? vehicle.activeBoosts : [];
  const featuredBoostRecords = boosts.filter((b) => FEATURED_BOOST_TYPES.includes(b.type as FeaturedBoostType));
  // Permanent admin/legacy feature (never went through a timed featured boost).
  if (featuredBoostRecords.length === 0) return true;
  // Had timed featured boosts; none are active anymore → treat as expired.
  return false;
}

/** True when isFeatured is set but featured eligibility has expired. */
export function hasStickyExpiredFeaturedFlag(
  vehicle: Pick<Vehicle, 'isFeatured' | 'activeBoosts'> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!vehicle?.isFeatured) return false;
  return !isEffectivelyFeatured(vehicle, now);
}
