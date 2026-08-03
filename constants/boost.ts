import type { BoostPackage } from '../types.js';

/** Package id for plan-credit Featured boost (7 days). */
export const CREDIT_FEATURED_PACKAGE_ID = 'credit_featured_7';

export const BOOST_PACKAGES: BoostPackage[] = [
  {
    id: CREDIT_FEATURED_PACKAGE_ID,
    name: 'Featured - 7 Days (Plan Credit)',
    type: 'featured_badge',
    durationDays: 7,
    price: 0,
    paymentMethod: 'credit',
    features: ['Featured badge', 'Homepage eligibility', 'Uses 1 plan credit'],
  },
  {
    id: 'top_search_3',
    name: 'Top Search - 3 Days',
    type: 'top_search',
    durationDays: 3,
    price: 299,
    paymentMethod: 'razorpay',
    features: ['Top of search results', '3x more visibility', 'Priority placement'],
  },
  {
    id: 'top_search_7',
    name: 'Top Search - 7 Days',
    type: 'top_search',
    durationDays: 7,
    price: 599,
    paymentMethod: 'razorpay',
    features: ['Top of search results', '3x more visibility', 'Priority placement', 'Best Value'],
  },
  {
    id: 'homepage_spot',
    name: 'Homepage Spotlight',
    type: 'homepage_spotlight',
    durationDays: 7,
    price: 999,
    paymentMethod: 'razorpay',
    features: ['Featured on homepage', 'Maximum visibility', 'Premium badge', 'Guaranteed views'],
  },
  {
    id: 'featured_badge',
    name: 'Standout Badge',
    type: 'featured_badge',
    durationDays: 15,
    price: 499,
    paymentMethod: 'razorpay',
    features: ['Standout badge', 'Stand out from crowd', 'Trust indicator'],
  },
  {
    id: 'multi_city',
    name: 'Multi-City Promotion',
    type: 'multi_city',
    durationDays: 7,
    price: 1499,
    paymentMethod: 'razorpay',
    features: ['Visible in 3 cities', 'Maximum reach', 'Best for dealers', 'Top placement'],
  },
];
