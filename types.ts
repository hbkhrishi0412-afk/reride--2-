

import { ChartData } from 'chart.js';
import React from 'react';
import type { VehicleCategoryData } from './components/vehicleData';

export enum VehicleCategory {
  FOUR_WHEELER = 'four-wheeler',
  TWO_WHEELER = 'two-wheeler',
  THREE_WHEELER = 'three-wheeler',
  COMMERCIAL = 'commercial'
}

export type BadgeType = 'verified' | 'top_seller' | 'high_rating';

export interface Badge {
    type: BadgeType;
    label: string;
    description: string;
}

export interface CertifiedInspection {
    reportId: string;
    summary: string;
    date: string; // ISO String
    inspector: string;
    scores: Record<string, number>; // e.g., { Engine: 85, Exterior: 92, ... }
    details: Record<string, string>; // e.g., { Engine: "No leaks found...", ... }
}

export interface ServiceRecord {
  date: string; // ISO string
  service: string;
  mileage: number;
  location: string;
}

export interface AccidentRecord {
  date: string; // ISO string
  description: string;
  severity: 'Minor' | 'Moderate' | 'Major';
}

export interface VehicleDocument {
    name: 'Registration Certificate (RC)' | 'Insurance' | 'Pollution Under Control (PUC)' | 'Service Record' | 'Other';
    url: string; // base64 data URL
    fileName: string;
}

export interface Vehicle {
  id: number;
  category: VehicleCategory;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  mileage: number;
  images: string[];
  features: string[];
  description: string;
  sellerEmail: string;
  sellerName?: string;
  engine: string;
  transmission: string;
  fuelType: string;
  fuelEfficiency: string;
  color: string;
  status: 'published' | 'unpublished' | 'sold';
  isFeatured: boolean;
  views?: number;
  inquiriesCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedAt?: string;
  averageRating?: number;
  ratingCount?: number;
  sellerAverageRating?: number;
  sellerRatingCount?: number;
  sellerBadges?: Badge[];
  // New detailed fields
  registrationYear: number;
  insuranceValidity: string;
  insuranceType: string;
  rto: string;
  city: string;
  state: string; // 2-letter state code
  noOfOwners: number;
  displacement: string; // e.g., "1086 cc"
  groundClearance: string; // e.g., "165 mm"
  bootSpace: string; // e.g., "235 litres"
  qualityReport?: {
    summary: string;
    fixesDone: string[];
  };
  certifiedInspection?: CertifiedInspection | null;
  certificationStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  // New features
  videoUrl?: string;
  serviceRecords?: ServiceRecord[];
  accidentHistory?: AccidentRecord[];
  documents?: VehicleDocument[];
  
  // NEW: Contact & Communication for Listing Platform
  sellerPhone?: string;
  sellerWhatsApp?: string;
  showPhoneNumber?: boolean;
  preferredContactMethod?: 'chat' | 'phone' | 'both';
  
  // NEW: Listing Lifecycle Management
  createdAt?: string; // ISO String
  updatedAt?: string; // ISO String
  listingExpiresAt?: string; // ISO String
  listingLastRefreshed?: string; // ISO String
  listingStatus?: 'active' | 'expired' | 'sold' | 'suspended' | 'draft';
  listingAutoRenew?: boolean;
  listingRenewalCount?: number;
  daysActive?: number;
  
  // NEW: Visibility & Promotion
  isPremiumListing?: boolean;
  isUrgentSale?: boolean;
  isBestPrice?: boolean;
  boostExpiresAt?: string;
  
  // NEW: Performance Tracking
  viewsLast7Days?: number;
  viewsLast30Days?: number;
  uniqueViewers?: number;
  phoneViews?: number;
  shareCount?: number;
  
  // NEW: Search & Discovery
  keywords?: string[];
  nearbyLandmarks?: string[];
  exactLocation?: {
    lat: number;
    lng: number;
    showExact: boolean;
  };
  distanceFromUser?: number;
  
  // NEW: Quality Indicators
  photoQuality?: 'low' | 'medium' | 'high';
  hasMinimumPhotos?: boolean;
  descriptionQuality?: number; // 0-100 score
  
  // ENHANCED: Additional Fields (from new features)
  activeBoosts?: ActiveBoost[];
  hideExactLocation?: boolean;
  listingExpiresAt?: string;
  listingAutoRenew?: boolean;
  listingRenewalCount?: number;
  listingLastRefreshed?: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    price: number; // per month
    features: string[];
    listingLimit: number | 'unlimited';
    featuredCredits: number;
    freeCertifications: number;
    isMostPopular?: boolean;
}

export interface User {
  name: string;
  email: string;
  // FIX: Made password optional to align with auth services that strip the password before returning user data.
  password?: string;
  mobile: string;
  role: 'seller' | 'customer' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string; // ISO String
  avatarUrl?: string;
  isVerified?: boolean;
  // Authentication fields
  firebaseUid?: string;
  authProvider?: 'email' | 'google' | 'phone';
  // Seller-specific profile info
  dealershipName?: string;
  bio?: string;
  logoUrl?: string;
  averageRating?: number;
  ratingCount?: number;
  badges?: Badge[];
  // New monetization fields for sellers
  subscriptionPlan?: SubscriptionPlan;
  featuredCredits?: number;
  usedCertifications?: number;
  
  // NEW: Trust & Verification for Listing Platform
  phoneVerified?: boolean;
  emailVerified?: boolean;
  govtIdVerified?: boolean;
  verificationDate?: string; // ISO String
  
  // NEW: Payment Request System
  pendingPlanUpgrade?: PaymentRequest;
  
  // NEW: Activity & Reputation
  responseTime?: number; // in minutes
  responseRate?: number; // percentage 0-100
  joinedDate?: string; // ISO String
  lastActiveAt?: string; // ISO String
  activeListings?: number;
  soldListings?: number;
  totalViews?: number;
  
  // NEW: Safety
  reportedCount?: number;
  isBanned?: boolean;
  trustScore?: number; // 0-100
  
  // NEW: Contact Preferences
  alternatePhone?: string;
  preferredContactHours?: string;
  showEmailPublicly?: boolean;
  
  // ENHANCED: Trust & Safety
  verificationStatus?: VerificationStatus;
  trustScore?: number; // 0-100
  responseTimeMinutes?: number;
  responseRate?: number; // 0-100
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'seller' | 'system';
  text: string;
  timestamp: string;
  isRead: boolean;
  type?: 'text' | 'test_drive_request' | 'offer';
  payload?: {
    // for test drive
    date?: string;
    time?: string;
    // for offer
    offerPrice?: number;
    /** If this message is a counter-offer, this field holds the price of the offer it is countering. */
    counterPrice?: number;
    status?: 'pending' | 'accepted' | 'rejected' | 'countered' | 'confirmed';
  };
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  vehicleId: number;
  vehicleName: string;
  vehiclePrice?: number;
  messages: ChatMessage[];
  lastMessageAt: string;
  isReadBySeller: boolean;
  isReadByCustomer: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedAt?: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export enum View {
  HOME = 'HOME',
  USED_CARS = 'USED_CARS',
  NEW_CARS = 'NEW_CARS',
  DEALER_PROFILES = 'DEALER_PROFILES',
  DETAIL = 'DETAIL',
  SELLER_DASHBOARD = 'SELLER_DASHBOARD',
  ADMIN_PANEL = 'ADMIN_PANEL',
  LOGIN_PORTAL = 'LOGIN_PORTAL',
  CUSTOMER_LOGIN = 'CUSTOMER_LOGIN',
  SELLER_LOGIN = 'SELLER_LOGIN',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  COMPARISON = 'COMPARISON',
  WISHLIST = 'WISHLIST',
  PROFILE = 'PROFILE',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  INBOX = 'INBOX',
  SELLER_PROFILE = 'SELLER_PROFILE',
  PRICING = 'PRICING',
  SUPPORT = 'SUPPORT',
  FAQ = 'FAQ',
  BUYER_DASHBOARD = 'BUYER_DASHBOARD',
  CITY_LANDING = 'CITY_LANDING',
}

export interface ProsAndCons {
    pros: string[];
    cons: string[];
}

export interface SearchFilters {
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    features?: string[];
}

export interface PlatformSettings {
    listingFee: number;
    siteAnnouncement: string;
}

export interface AuditLogEntry {
    id: number;
    timestamp: string; // ISO String
    actor: string; // email of the admin
    action: string;
    target: string; // e.g., user email or vehicle ID
    details?: string;
}

export type VehicleData = Record<string, VehicleCategoryData>;

export interface Suggestion {
  type: 'pricing' | 'listing_quality' | 'urgent_inquiry';
  title: string;
  description: string;
  targetId: number | string;
  priority: 'high' | 'medium' | 'low';
}

export interface Notification {
  id: number;
  recipientEmail: string;
  message: string;
  targetId: string | number;
  targetType: 'vehicle' | 'conversation' | 'price_drop' | 'insurance_expiry' | 'general_admin';
  isRead: boolean;
  timestamp: string; // ISO String
}

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  section: 'Navigation' | 'Actions' | 'Theme';
}

export interface TicketReply {
  author: string; // 'user' or admin email
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: number;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

// NEW: Listing Platform Specific Interfaces

export interface ListingBoost {
  id: string;
  vehicleId: number;
  type: 'top_search' | 'homepage_spotlight' | 'featured_badge';
  startDate: string;
  expiresAt: string;
  price: number;
  isActive: boolean;
}

export interface SavedSearch {
  id: number;
  userId: string;
  name: string;
  filters: {
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    category?: VehicleCategory;
    fuelType?: string;
    transmission?: string;
    location?: string;
    radius?: number; // km
  };
  emailAlerts: boolean;
  createdAt: string;
}

export interface BuyerActivity {
  userId: string;
  recentlyViewed: number[]; // vehicle IDs
  savedSearches: SavedSearch[];
  notifications: {
    priceDrops: number[];
    newMatches: number[];
  };
}

export interface ListingStats {
  vehicleId: number;
  date: string;
  views: number;
  uniqueViews: number;
  phoneViews: number;
  chatStarts: number;
  shares: number;
  favorites: number;
}

export interface SafetyWarning {
  id: number;
  title: string;
  message: string;
  icon: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SortOption {
  label: string;
  value: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'most_viewed';
}

// ============================================
// PAYMENT REQUEST SYSTEM
// ============================================
export interface PaymentRequest {
  id: string;
  sellerEmail: string;
  planId: SubscriptionPlan;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentProof?: string; // Screenshot URL, UPI reference, etc.
  paymentMethod?: 'upi' | 'bank_transfer' | 'card' | 'other';
  transactionId?: string; // UPI reference, transaction ID, etc.
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string; // Admin email
  rejectedAt?: string;
  rejectedBy?: string; // Admin email
  rejectionReason?: string;
  notes?: string;
}

// ============================================
// LOCATION & DISCOVERY FEATURES
// ============================================
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface PopularSearch {
  id: number;
  query: string;
  count: number;
  city?: string;
  state?: string;
  category?: VehicleCategory;
  createdAt: string;
}

export interface NearbyLandmark {
  id: number;
  name: string;
  type: 'metro' | 'railway' | 'airport' | 'mall' | 'landmark';
  location: LocationCoordinates;
  city: string;
  state: string;
}

export interface CityStats {
  cityName: string;
  stateCode: string;
  totalListings: number;
  averagePrice: number;
  popularMakes: string[];
  popularCategories: VehicleCategory[];
}

export interface RadiusSearchParams {
  center: LocationCoordinates;
  radiusKm: number;
  filters?: SearchFilters;
}

// ============================================
// LISTING LIFECYCLE MANAGEMENT
// ============================================
export interface ListingLifecycle {
  vehicleId: number;
  createdAt: string;
  expiresAt: string;
  lastRefreshedAt?: string;
  autoRenew: boolean;
  renewalCount: number;
  status: 'active' | 'expired' | 'suspended';
}

export interface ListingRefresh {
  vehicleId: number;
  refreshedAt: string;
  refreshType: 'manual' | 'auto' | 'boost';
  cost?: number;
}

// ============================================
// BUYER ENGAGEMENT TOOLS
// ============================================
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  emailAlerts: boolean;
  smsAlerts: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  createdAt: string;
  lastNotifiedAt?: string;
}

export interface PriceDropAlert {
  id: string;
  userId: string;
  vehicleId: number;
  originalPrice: number;
  currentPrice: number;
  percentageDropped: number;
  notified: boolean;
  createdAt: string;
}

export interface FollowedSeller {
  id: string;
  userId: string;
  sellerEmail: string;
  followedAt: string;
  notifyOnNewListing: boolean;
}

export interface VehicleView {
  vehicleId: number;
  userId?: string;
  viewedAt: string;
  sessionId: string;
  source?: string;
}

// ============================================
// TRUST & SAFETY
// ============================================
export interface VerificationStatus {
  phoneVerified: boolean;
  phoneVerifiedAt?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  govtIdVerified: boolean;
  govtIdVerifiedAt?: string;
  govtIdType?: 'aadhaar' | 'pan' | 'driving_license';
  govtIdNumber?: string; // Encrypted/hashed
}

export interface TrustScore {
  userId: string;
  score: number; // 0-100
  factors: {
    verificationsComplete: number;
    responseRate: number;
    positiveReviews: number;
    accountAge: number;
    successfulDeals: number;
  };
  lastCalculated: string;
}

export interface SafetyReport {
  id: string;
  reportedBy: string;
  targetType: 'vehicle' | 'user' | 'conversation';
  targetId: string | number;
  reason: 'scam' | 'fake_listing' | 'inappropriate' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  action?: string;
}

export interface ResponseTimeStats {
  userId: string;
  averageResponseMinutes: number;
  responseRate: number; // percentage 0-100
  totalQueries: number;
  respondedQueries: number;
  lastCalculated: string;
}

// ============================================
// ENHANCED SELLER FEATURES
// ============================================
export interface ListingAnalytics {
  vehicleId: number;
  views: number;
  uniqueViews: number;
  phoneReveals: number;
  chatStarts: number;
  testDriveRequests: number;
  offers: number;
  shares: number;
  favorites: number;
  viewsByHour: Record<string, number>;
  viewsByDay: Record<string, number>;
  viewsBySource: Record<string, number>;
}

export interface CompetitorPricing {
  vehicleId: number;
  yourPrice: number;
  marketAverage: number;
  lowestPrice: number;
  highestPrice: number;
  competitorCount: number;
  pricePosition: 'low' | 'average' | 'high';
  suggestedPrice?: number;
}

export interface ListingQualityScore {
  vehicleId: number;
  overallScore: number; // 0-100
  photoQuality: number;
  photoCount: number;
  descriptionLength: number;
  descriptionQuality: number;
  responseTime: number;
  priceCompetitiveness: number;
  suggestions: string[];
}

// ============================================
// MONETIZATION FEATURES
// ============================================
export interface BoostPackage {
  id: string;
  name: string;
  type: 'top_search' | 'homepage_spotlight' | 'featured_badge' | 'multi_city';
  durationDays: number;
  price: number;
  features: string[];
}

export interface ActiveBoost {
  id: string;
  vehicleId: number;
  packageId: string;
  type: 'top_search' | 'homepage_spotlight' | 'featured_badge' | 'multi_city';
  startDate: string;
  expiresAt: string;
  isActive: boolean;
  impressions?: number;
  clicks?: number;
}

export interface ListingPromotion {
  vehicleId: number;
  isPremium: boolean;
  isUrgentSale: boolean;
  isBestPrice: boolean;
  promotionExpiresAt?: string;
}

// ============================================
// MOBILE FEATURES
// ============================================
export interface CallMaskingSession {
  id: string;
  buyerId: string;
  sellerId: string;
  vehicleId: number;
  maskedNumber: string;
  actualNumber: string;
  createdAt: string;
  expiresAt: string;
  callCount: number;
}

export interface SMSAlert {
  id: string;
  userId: string;
  type: 'price_drop' | 'new_match' | 'message' | 'offer';
  message: string;
  vehicleId?: number;
  sent: boolean;
  sentAt?: string;
  createdAt: string;
}

// Type guard functions
export const isVehicle = (obj: any): obj is Vehicle => {
  return obj && 
    typeof obj.id === 'number' &&
    typeof obj.make === 'string' &&
    typeof obj.model === 'string' &&
    typeof obj.year === 'number' &&
    typeof obj.price === 'number' &&
    typeof obj.mileage === 'number' &&
    typeof obj.sellerEmail === 'string' &&
    Array.isArray(obj.images) &&
    Array.isArray(obj.features);
};

export const isUser = (obj: any): obj is User => {
  return obj &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.password === 'string' &&
    typeof obj.mobile === 'string' &&
    ['customer', 'seller', 'admin'].includes(obj.role);
};

export const isConversation = (obj: any): obj is Conversation => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.customerId === 'string' &&
    typeof obj.sellerId === 'string' &&
    typeof obj.vehicleId === 'number' &&
    Array.isArray(obj.messages);
};

export const isApiResponse = <T>(obj: any): obj is { data: T; success: boolean } => {
  return obj && typeof obj === 'object' && 'success' in obj;
};

export const isChatMessage = (obj: any): obj is ChatMessage => {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.sender === 'string' &&
    typeof obj.text === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.isRead === 'boolean';
};

export const isNotification = (obj: any): obj is Notification => {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.recipientEmail === 'string' &&
    typeof obj.isRead === 'boolean';
};
