

import { ChartData } from 'chart.js';
import React from 'react';
import type { VehicleCategoryData } from './components/vehicleData';

export enum VehicleCategory {
  FOUR_WHEELER = 'Four Wheeler',
  TWO_WHEELER = 'Two Wheeler',
  THREE_WHEELER = 'Three Wheeler',
  FARM = 'Farm Vehicle',
  COMMERCIAL = 'Commercial Vehicle',
  CONSTRUCTION = 'Construction Vehicle',
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
