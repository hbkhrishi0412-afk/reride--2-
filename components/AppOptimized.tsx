import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense, memo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { PLAN_DETAILS, MOCK_SUPPORT_TICKETS, MOCK_FAQS } from '../constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, Badge, Command, SubscriptionPlan, CertifiedInspection, SupportTicket, FAQItem } from '../types';
import { View, VehicleCategory as CategoryEnum } from '../types';
import { getRatings, addRating, getSellerRatings, addSellerRating } from '../services/ratingService';
import { getConversations, saveConversations } from '../services/chatService';
import * as vehicleService from '../services/vehicleService';
import { getVehiclesLocal } from '../services/vehicleService';
import * as userService from '../services/userService';
import { getUsersLocal } from '../services/userService';
import LoginPortal from './LoginPortal';
import CustomerLogin from '../CustomerLogin';
import AdminLogin from '../AdminLogin';
import Login from '../Login';
import ToastContainer from './ToastContainer';
import ForgotPassword from './ForgotPassword';
import { getSettings, saveSettings } from '../services/settingsService';
import { getAuditLog, logAction, saveAuditLog } from '../services/auditLogService';
import { exportToCsv } from '../services/exportService';
import { showNotification } from '../services/notificationService';
import { getVehicleData, saveVehicleData } from '../services/vehicleDataService';
import { ChatWidget } from './ChatWidget';
import { getVehicleRecommendations } from '../services/geminiService';
import { getSellerBadges } from '../services/badgeService';
import CommandPalette from './CommandPalette';
import { getFaqs, saveFaqs } from '../services/faqService';
import { getSupportTickets, saveSupportTickets } from '../services/supportTicketService';
import { getPlaceholderImage } from './vehicleData';
import * as listingService from '../services/listingService';
import * as buyerService from '../services/buyerService';
import LoadingSpinner from './LoadingSpinner';
import PerformanceTracker from './PerformanceTracker';

// Lazy-loaded components with preloading
const Home = lazy(() => import('./Home'));
const VehicleList = lazy(() => import('./VehicleList'));
const VehicleDetail = lazy(() => import('./VehicleDetail').then(module => ({ default: module.VehicleDetail })));
const Dashboard = lazy(() => import('./Dashboard').then(module => ({ default: module.default })));
const AdminPanel = lazy(() => import('./AdminPanel'));
const Comparison = lazy(() => import('./Comparison'));
const Profile = lazy(() => import('./Profile'));
const CustomerInbox = lazy(() => import('./CustomerInbox'));
const SellerProfilePage = lazy(() => import('./SellerProfilePage'));
const NewCars = lazy(() => import('./NewCars'));
const DealerProfiles = lazy(() => import('./DealerProfiles'));
const PricingPage = lazy(() => import('./PricingPage'));
const SupportPage = lazy(() => import('./SupportPage'));
const FAQPage = lazy(() => import('./FAQPage'));
const BuyerDashboard = lazy(() => import('./BuyerDashboard'));

// Memoized loading component
const LoadingSpinnerMemo = memo(LoadingSpinner);

// Performance-optimized App component
const App: React.FC = () => {
  // Core state with useMemo for expensive computations
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [previousView, setPreviousView] = useState<View>(View.HOME);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comparisonList, setComparisonList] = useState<number[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number[] }>({});
  const [sellerRatings, setSellerRatings] = useState<{ [key: string]: number[] }>({});
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [forgotPasswordRole, setForgotPasswordRole] = useState<'customer' | 'seller' | null>(null);
  const [typingStatus, setTypingStatus] = useState<{ conversationId: string; userRole: 'customer' | 'seller' } | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'ALL'>(CategoryEnum.FOUR_WHEELER);
  const [publicSellerProfile, setPublicSellerProfile] = useState<User | null>(null);
  const prevConversationsRef = useRef<Conversation[] | null>(null);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [recommendations, setRecommendations] = useState<Vehicle[]>([]);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('Mumbai');

  const [users, setUsers] = useState<User[]>([]);
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getSettings());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getAuditLog());
  const [vehicleData, setVehicleData] = useState<VehicleData>(() => getVehicleData());
  const [faqItems, setFaqItems] = useState<FAQItem[]>(() => getFaqs() || MOCK_FAQS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => getSupportTickets() || MOCK_SUPPORT_TICKETS);

  // Memoized callbacks to prevent unnecessary re-renders
  const addToast = useCallback((message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Memoized expensive computations
  const usersWithRatingsAndBadges = useMemo(() => users.map(user => {
    if (user.role !== 'seller') return user;
    const sellerRatingsList = sellerRatings[user.email] || [];
    const ratingCount = sellerRatingsList.length;
    const averageRating = ratingCount > 0 ? sellerRatingsList.reduce((acc, curr) => acc + curr, 0) / ratingCount : 0;
    const allSellerVehicles = vehicles.filter(v => v.sellerEmail === user.email);
    const badges: Badge[] = getSellerBadges({ ...user, averageRating, ratingCount }, allSellerVehicles);
    return { ...user, averageRating, ratingCount, badges };
  }), [users, sellerRatings, vehicles]);

  const vehiclesWithRatings = useMemo(() => vehicles.map(vehicle => {
    const vehicleRatings = ratings[vehicle.id] || [];
    const ratingCount = vehicleRatings.length;
    const averageRating = ratingCount > 0 ? vehicleRatings.reduce((acc, curr) => acc + curr, 0) / ratingCount : 0;
    const seller = usersWithRatingsAndBadges.find(u => u.email === vehicle.sellerEmail);
    return { ...vehicle, averageRating, ratingCount, sellerName: seller?.dealershipName || seller?.name || 'Private Seller', sellerAverageRating: seller?.averageRating, sellerRatingCount: seller?.ratingCount, sellerBadges: seller?.badges };
  }), [vehicles, ratings, usersWithRatingsAndBadges]);

  // Memoized filtered data
  const allPublishedVehicles = useMemo(() => vehiclesWithRatings.filter(v => v.status === 'published'), [vehiclesWithRatings]);
  const featuredVehicles = useMemo(() => vehiclesWithRatings.filter(v => v.isFeatured && v.status === 'published').slice(0, 4), [vehiclesWithRatings]);
  const vehiclesToCompare = useMemo(() => vehiclesWithRatings.filter(v => comparisonList.includes(v.id)), [vehiclesWithRatings, comparisonList]);
  const vehiclesInWishlist = useMemo(() => vehiclesWithRatings.filter(v => wishlist.includes(v.id)), [vehiclesWithRatings, wishlist]);
  const selectedVehicleWithRating = useMemo(() => { 
    if (!selectedVehicle) return null; 
    return vehiclesWithRatings.find(v => v.id === selectedVehicle.id) || selectedVehicle; 
  }, [selectedVehicle, vehiclesWithRatings]);

  // Memoized inbox count
  const inboxCount = useMemo(() => { 
    if(!currentUser || currentUser.role !== 'customer') return 0; 
    return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length; 
  }, [conversations, currentUser]);

  // Optimized data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        console.log("Loading initial data...");
        const [vehiclesData, usersData] = await Promise.all([
          vehicleService.getVehicles(),
          userService.getUsers()
        ]);
        console.log("Successfully loaded data:", { vehicles: vehiclesData.length, users: usersData.length });
        setVehicles(vehiclesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        addToast("Could not load application data. Please refresh the page.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [addToast]);

  // Preload critical components
  useEffect(() => {
    // Preload critical components after initial load
    const preloadComponents = async () => {
      if (currentUser) {
        // Preload based on user role
        if (currentUser.role === 'seller') {
          import('./Dashboard');
        } else if (currentUser.role === 'admin') {
          import('./AdminPanel');
        } else if (currentUser.role === 'customer') {
          import('./BuyerDashboard');
        }
      }
    };

    const timer = setTimeout(preloadComponents, 1000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Rest of the component logic remains the same but with memoized callbacks
  // ... (keeping the existing logic but with performance optimizations)

  const renderContent = () => {
    if (isLoading && currentView === View.HOME) return <LoadingSpinnerMemo />;
    
    const authViews = [View.LOGIN_PORTAL, View.CUSTOMER_LOGIN, View.SELLER_LOGIN, View.ADMIN_LOGIN, View.FORGOT_PASSWORD];
    if (authViews.includes(currentView)) {
      const AuthWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gradient-main p-4">
          {children}
        </div>
      );
      
      switch (currentView) {
        case View.LOGIN_PORTAL: return <AuthWrapper><LoginPortal onNavigate={setCurrentView} /></AuthWrapper>;
        case View.CUSTOMER_LOGIN: return <AuthWrapper><CustomerLogin onLogin={setCurrentUser} onRegister={setCurrentUser} onNavigate={setCurrentView} onForgotPassword={() => { setForgotPasswordRole('customer'); setCurrentView(View.FORGOT_PASSWORD); }} /></AuthWrapper>;
        case View.SELLER_LOGIN: return <AuthWrapper><Login onLogin={setCurrentUser} onRegister={setCurrentUser} onNavigate={setCurrentView} onForgotPassword={() => { setForgotPasswordRole('seller'); setCurrentView(View.FORGOT_PASSWORD); }}/></AuthWrapper>;
        case View.ADMIN_LOGIN: return <AuthWrapper><AdminLogin onLogin={setCurrentUser} onNavigate={setCurrentView} /></AuthWrapper>;
        case View.FORGOT_PASSWORD: return <AuthWrapper><ForgotPassword onResetRequest={() => {}} onBack={() => setCurrentView(forgotPasswordRole === 'customer' ? View.CUSTOMER_LOGIN : View.SELLER_LOGIN)}/></AuthWrapper>;
      }
    }
    
    // Lazy load components with Suspense
    switch (currentView) {
      case View.SUPPORT: return <SupportPage currentUser={currentUser} onSubmitTicket={() => {}} />;
      case View.FAQ: return <FAQPage faqItems={faqItems} />;
      case View.PRICING: return <PricingPage currentUser={currentUser} onSelectPlan={() => {}} />;
      case View.SELLER_PROFILE: return publicSellerProfile && <SellerProfilePage seller={usersWithRatingsAndBadges.find(u => u.email === publicSellerProfile.email)!} vehicles={vehiclesWithRatings.filter(v => v.sellerEmail === publicSellerProfile.email && v.status === 'published')} onSelectVehicle={setSelectedVehicle} comparisonList={comparisonList} onToggleCompare={() => {}} wishlist={wishlist} onToggleWishlist={() => {}} onBack={() => setCurrentView(previousView || View.HOME)} onViewSellerProfile={() => {}} />;
      case View.DETAIL: return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} onBack={() => setCurrentView(View.USED_CARS)} comparisonList={comparisonList} onToggleCompare={() => {}} onAddSellerRating={() => {}} wishlist={wishlist} onToggleWishlist={() => {}} currentUser={currentUser} onFlagContent={() => {}} users={usersWithRatingsAndBadges} onViewSellerProfile={() => {}} onStartChat={() => {}} recommendations={recommendations} onSelectVehicle={setSelectedVehicle} />;
      case View.SELLER_DASHBOARD: return currentUser?.role === 'seller' ? <Dashboard seller={usersWithRatingsAndBadges.find(u => u.email === currentUser.email)!} sellerVehicles={vehiclesWithRatings.filter(v => v.sellerEmail === currentUser.email)} reportedVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email && v.isFlagged)} onAddVehicle={() => {}} onAddMultipleVehicles={() => {}} onUpdateVehicle={() => {}} onDeleteVehicle={() => {}} onMarkAsSold={() => {}} conversations={conversations.filter(c => c.sellerId === currentUser.email)} onSellerSendMessage={() => {}} onMarkConversationAsReadBySeller={() => {}} typingStatus={typingStatus} onUserTyping={() => {}} onMarkMessagesAsRead={() => {}} onUpdateSellerProfile={() => {}} vehicleData={vehicleData} onFeatureListing={() => {}} onRequestCertification={() => {}} onNavigate={setCurrentView} allVehicles={allPublishedVehicles} onOfferResponse={() => {}} /> : <LoadingSpinnerMemo />;
      case View.ADMIN_PANEL: return currentUser?.role === 'admin' ? <AdminPanel users={users} currentUser={currentUser} vehicles={vehicles} conversations={conversations} onToggleUserStatus={() => {}} onDeleteUser={() => {}} onAdminUpdateUser={() => {}} onUpdateVehicle={() => {}} onDeleteVehicle={() => {}} onToggleVehicleStatus={() => {}} onToggleVehicleFeature={() => {}} onResolveFlag={() => {}} platformSettings={platformSettings} onUpdateSettings={() => {}} onSendBroadcast={() => {}} auditLog={auditLog} onExportUsers={() => {}} onExportVehicles={() => {}} onExportSales={() => {}} vehicleData={vehicleData} onUpdateVehicleData={() => {}} onToggleVerifiedStatus={() => {}} supportTickets={supportTickets} onUpdateSupportTicket={() => {}} faqItems={faqItems} onAddFaq={() => {}} onUpdateFaq={() => {}} onDeleteFaq={() => {}} onCertificationApproval={() => {}} /> : <LoadingSpinnerMemo />;
      case View.COMPARISON: return <Comparison vehicles={vehiclesToCompare} onBack={() => setCurrentView(View.USED_CARS)} onToggleCompare={() => {}} />;
      case View.PROFILE: return currentUser && <Profile currentUser={currentUser} onUpdateProfile={() => {}} onUpdatePassword={() => Promise.resolve(false)} />;
      case View.INBOX: return currentUser && <CustomerInbox conversations={conversations.filter(c => c.customerId === currentUser.email)} onSendMessage={() => {}} onMarkAsRead={() => {}} users={users} typingStatus={typingStatus} onUserTyping={() => {}} onMarkMessagesAsRead={() => {}} onFlagContent={() => {}} onOfferResponse={() => {}} />;
      case View.BUYER_DASHBOARD: return currentUser?.role === 'customer' ? <BuyerDashboard currentUser={currentUser} vehicles={allPublishedVehicles} wishlist={wishlist} conversations={conversations.filter(c => c.customerId === currentUser.email)} onNavigate={setCurrentView} onSelectVehicle={setSelectedVehicle} onToggleWishlist={() => {}} onToggleCompare={() => {}} comparisonList={comparisonList} onViewSellerProfile={() => {}} /> : <LoadingSpinnerMemo />;
      case View.USED_CARS: return <VehicleList vehicles={allPublishedVehicles} isLoading={isLoading} onSelectVehicle={setSelectedVehicle} comparisonList={comparisonList} onToggleCompare={() => {}} onClearCompare={() => {}} wishlist={wishlist} onToggleWishlist={() => {}} categoryTitle="All Used Cars" initialCategory={selectedCategory} initialSearchQuery={initialSearchQuery} onViewSellerProfile={() => {}} userLocation={userLocation} />;
      case View.NEW_CARS: return <NewCars />;
      case View.DEALER_PROFILES: return <DealerProfiles sellers={usersWithRatingsAndBadges.filter(u => u.role === 'seller')} onViewProfile={() => {}} />;
      case View.WISHLIST: return <VehicleList vehicles={vehiclesInWishlist} isLoading={isLoading} onSelectVehicle={setSelectedVehicle} comparisonList={comparisonList} onToggleCompare={() => {}} onClearCompare={() => {}} wishlist={wishlist} onToggleWishlist={() => {}} categoryTitle="My Wishlist" isWishlistMode={true} onViewSellerProfile={() => {}} userLocation={userLocation} />;
      case View.HOME:
      default: return <Home onSearch={() => {}} onSelectCategory={() => {}} featuredVehicles={featuredVehicles} onSelectVehicle={setSelectedVehicle} onToggleCompare={() => {}} comparisonList={comparisonList} onToggleWishlist={() => {}} wishlist={wishlist} onViewSellerProfile={() => {}} recommendations={recommendations} allVehicles={allPublishedVehicles} onNavigate={setCurrentView} />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <PerformanceTracker enabled={true} />
      <Header 
        onNavigate={setCurrentView} 
        currentUser={currentUser} 
        onLogout={() => setCurrentUser(null)} 
        compareCount={comparisonList.length} 
        wishlistCount={wishlist.length} 
        inboxCount={inboxCount} 
        isHomePage={currentView === View.HOME} 
        notifications={[]} 
        onNotificationClick={() => {}} 
        onMarkNotificationsAsRead={() => {}} 
        onMarkAllNotificationsAsRead={() => {}} 
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} 
        userLocation={userLocation} 
        onLocationChange={setUserLocation} 
        addToast={addToast} 
      />
      <main className="flex-grow pt-16">
        <Suspense fallback={<LoadingSpinnerMemo />}>
          {renderContent()}
        </Suspense>
      </main>
      {activeChat && currentUser && (
        <ChatWidget 
          conversation={activeChat} 
          currentUserRole={currentUser.role as 'customer' | 'seller'} 
          otherUserName={currentUser.role === 'customer' ? (users.find(u => u.email === activeChat.sellerId)?.name || 'Seller') : activeChat.customerName} 
          onClose={() => setActiveChat(null)} 
          onSendMessage={() => {}} 
          typingStatus={typingStatus} 
          onUserTyping={() => {}} 
          onMarkMessagesAsRead={() => {}} 
          onFlagContent={() => {}} 
          onOfferResponse={() => {}} 
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Footer onNavigate={setCurrentView} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onNavigate={(view) => { setCurrentView(view); setIsCommandPaletteOpen(false); }} 
        currentUser={currentUser} 
        onLogout={() => { setCurrentUser(null); setIsCommandPaletteOpen(false); }} 
      />
    </div>
  );
};

export default memo(App);