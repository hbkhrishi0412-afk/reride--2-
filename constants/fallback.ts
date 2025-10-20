import type { Vehicle, User, FAQItem, SupportTicket } from '../types';
import { VehicleCategory } from '../types';

// Helper to generate past dates
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Minimal fallback data for immediate loading
export const FALLBACK_VEHICLES: Vehicle[] = [
  {
    id: 1,
    make: "Maruti Suzuki",
    model: "Swift",
    year: 2022,
    price: 650000,
    mileage: 18000,
    fuelType: "Petrol",
    transmission: "Manual",
    location: "Mumbai",
    sellerEmail: "demo@reride.com",
    images: ["https://picsum.photos/800/600?random=1"],
    description: "Well maintained Swift in excellent condition",
    status: "published",
    isFeatured: true,
    views: 150,
    inquiriesCount: 8,
    certificationStatus: "none",
    category: VehicleCategory.FOUR_WHEELER,
    features: ["Power Steering", "Air Conditioning"],
    engine: "1.2L Petrol",
    fuelEfficiency: "20 KMPL",
    color: "White",
    noOfOwners: 1,
    registrationYear: 2022,
    insuranceValidity: "Aug 2025",
    insuranceType: "Comprehensive",
    rto: "MH01",
    city: "Mumbai",
    state: "MH",
    displacement: "1200 cc",
    groundClearance: "170 mm",
    bootSpace: "300 litres"
  }
];

export const FALLBACK_USERS: User[] = [
  {
    name: 'Demo Seller',
    email: 'demo@reride.com',
    password: 'password',
    mobile: '555-123-4567',
    role: 'seller',
    status: 'active',
    createdAt: daysAgo(30),
    dealershipName: 'Demo Motors',
    bio: 'Your trusted vehicle partner',
    avatarUrl: 'https://i.pravatar.cc/150?u=demo@reride.com',
    isVerified: true,
    subscriptionPlan: 'pro',
    featuredCredits: 2,
    usedCertifications: 0
  }
];

export const FALLBACK_FAQS: FAQItem[] = [
  {
    id: 1,
    question: "How do I list my car for sale?",
    answer: "Navigate to the 'Sell' section, log in or register as a seller, and follow the on-screen instructions to create a new vehicle listing.",
    category: "Selling"
  },
  {
    id: 2,
    question: "How can I contact a seller?",
    answer: "On any vehicle detail page, you can use the 'Chat with Seller' button to start a direct conversation with the seller.",
    category: "Buying"
  }
];

export const FALLBACK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 1,
    userEmail: 'demo@reride.com',
    userName: 'Demo User',
    subject: 'General Inquiry',
    message: 'How can I get started?',
    status: 'Open',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    replies: []
  }
];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];
export const SAFETY_TIPS = [
  'Always meet in a public place during daylight hours',
  'Never share bank details or OTP with anyone',
  'Verify vehicle documents before making payment',
  'Test drive with seller present and valid documents'
];
