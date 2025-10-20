import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Vehicle, User, Conversation, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, SupportTicket, FAQItem } from '../types';
import { View, VehicleCategory as CategoryEnum } from '../types';
import { getRatings, addRating, getSellerRatings, addSellerRating } from '../services/ratingService';
import { getConversations, saveConversations } from '../services/chatService';
import { getSettings, saveSettings } from '../services/settingsService';
import { getAuditLog, logAction, saveAuditLog } from '../services/auditLogService';
import { showNotification } from '../services/notificationService';
import { getFaqs, saveFaqs } from '../services/faqService';
import { getSupportTickets, saveSupportTickets } from '../services/supportTicketService';
import { getVehicles } from '../services/vehicleService';
import { getVehicleData } from '../services/vehicleDataService';
import { loadingManager, LOADING_OPERATIONS, withLoadingTimeout } from '../utils/loadingManager';
import { useTimeout } from '../hooks/useCleanup';

interface AppContextType {
  // State
  currentView: View;
  previousView: View;
  selectedVehicle: Vehicle | null;
  vehicles: Vehicle[];
  isLoading: boolean;
  currentUser: User | null;
  comparisonList: number[];
  ratings: { [key: string]: number[] };
  sellerRatings: { [key: string]: number[] };
  wishlist: number[];
  conversations: Conversation[];
  toasts: ToastType[];
  forgotPasswordRole: 'customer' | 'seller' | null;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  selectedCategory: VehicleCategory | 'ALL';
  publicSellerProfile: User | null;
  activeChat: Conversation | null;
  isAnnouncementVisible: boolean;
  recommendations: Vehicle[];
  initialSearchQuery: string;
  isCommandPaletteOpen: boolean;
  userLocation: string;
  selectedCity: string;
  users: User[];
  platformSettings: PlatformSettings;
  auditLog: AuditLogEntry[];
  vehicleData: VehicleData;
  faqItems: FAQItem[];
  supportTickets: SupportTicket[];
  notifications: Notification[];

  // Actions
  setCurrentView: (view: View) => void;
  setPreviousView: (view: View) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setVehicles: (vehicles: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setComparisonList: (list: number[] | ((prev: number[]) => number[])) => void;
  setWishlist: (list: number[] | ((prev: number[]) => number[])) => void;
  setConversations: (conversations: Conversation[]) => void;
  setToasts: (toasts: ToastType[]) => void;
  setForgotPasswordRole: (role: 'customer' | 'seller' | null) => void;
  setTypingStatus: (status: { conversationId: string; userRole: 'customer' | 'seller' } | null) => void;
  setSelectedCategory: (category: VehicleCategory | 'ALL') => void;
  setPublicSellerProfile: (profile: User | null) => void;
  setActiveChat: (chat: Conversation | null) => void;
  setIsAnnouncementVisible: (visible: boolean) => void;
  setRecommendations: (recommendations: Vehicle[]) => void;
  setInitialSearchQuery: (query: string) => void;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserLocation: (location: string) => void;
  setSelectedCity: (city: string) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setPlatformSettings: (settings: PlatformSettings) => void;
  setAuditLog: (log: AuditLogEntry[]) => void;
  setVehicleData: (data: VehicleData) => void;
  setFaqItems: (items: FAQItem[]) => void;
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  setNotifications: (notifications: Notification[]) => void;
  setRatings: (ratings: { [key: string]: number[] }) => void;
  setSellerRatings: (ratings: { [key: string]: number[] } | ((prev: { [key: string]: number[] }) => { [key: string]: number[] })) => void;

  // Helper functions
  addToast: (message: string, type: ToastType['type']) => void;
  removeToast: (id: number) => void;
  handleLogout: () => void;
  navigate: (view: View, params?: { city?: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔧 AppProvider: Initializing...');
  
  // All state from App.tsx moved here
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
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'ALL'>(CategoryEnum.FOUR_WHEELER);
  const [publicSellerProfile, setPublicSellerProfile] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [recommendations, setRecommendations] = useState<Vehicle[]>([]);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('Mumbai');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getSettings());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getAuditLog());
  const [vehicleData, setVehicleData] = useState<VehicleData>(() => ({
    FOUR_WHEELER: [],
    TWO_WHEELER: [],
    THREE_WHEELER: []
  }));
  const [faqItems, setFaqItems] = useState<FAQItem[]>(() => getFaqs() || []);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => getSupportTickets() || []);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const notificationsJson = localStorage.getItem('reRideNotifications');
      return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch { 
      return []; 
    }
  });

  const addToast = useCallback((message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('reRideCurrentUser');
    setCurrentView(View.HOME);
    setActiveChat(null);
    addToast('You have been logged out.', 'info');
  }, [addToast]);

  const navigate = useCallback((view: View, params?: { city?: string }) => {
    const isNavigatingAwayFromSellerProfile = currentView === View.SELLER_PROFILE && view !== View.SELLER_PROFILE;
    if (isNavigatingAwayFromSellerProfile) { 
      window.history.pushState({}, '', window.location.pathname); 
      setPublicSellerProfile(null); 
    }
    setInitialSearchQuery('');
    const preserveSelectedVehicle = (view === View.SELLER_PROFILE && currentView === View.DETAIL) || (view === View.DETAIL && currentView === View.SELLER_PROFILE);
    if (!preserveSelectedVehicle) setSelectedVehicle(null);
    if (view === View.USED_CARS && currentView !== View.HOME) setSelectedCategory('ALL');
    if (view === View.CITY_LANDING && params?.city) {
      setSelectedCity(params.city);
    }
    if (view === View.SELLER_DASHBOARD && currentUser?.role !== 'seller') setCurrentView(View.LOGIN_PORTAL);
    else if (view === View.ADMIN_PANEL && currentUser?.role !== 'admin') setCurrentView(View.ADMIN_LOGIN);
    else if ((view === View.PROFILE || view === View.INBOX) && !currentUser) setCurrentView(View.LOGIN_PORTAL);
    else setCurrentView(view);
  }, [currentView, currentUser]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🔧 AppProvider: Loading initial data...');
        setIsLoading(true);
        
        // Load vehicles and vehicle data in parallel
        const [vehiclesData, vehicleDataData] = await Promise.all([
          getVehicles(),
          getVehicleData()
        ]);
        
        console.log('🔧 AppProvider: Loaded', vehiclesData.length, 'vehicles');
        setVehicles(vehiclesData);
        setVehicleData(vehicleDataData);
        
        // Set some recommendations (first 6 vehicles)
        setRecommendations(vehiclesData.slice(0, 6));
        
        console.log('🔧 AppProvider: Initial data loaded successfully');
      } catch (error) {
        console.error('🔧 AppProvider: Error loading initial data:', error);
        addToast('Failed to load vehicle data. Please refresh the page.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [addToast]);

  // Add navigation event listener for dashboard navigation
  useEffect(() => {
    const handleNavigationEvent = (event: CustomEvent) => {
      const { view } = event.detail;
      if (view && Object.values(View).includes(view)) {
        navigate(view as View);
      }
    };

    window.addEventListener('navigate', handleNavigationEvent as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigationEvent as EventListener);
    };
  }, [navigate]);

  const contextValue: AppContextType = {
    // State
    currentView,
    previousView,
    selectedVehicle,
    vehicles,
    isLoading,
    currentUser,
    comparisonList,
    ratings,
    sellerRatings,
    wishlist,
    conversations,
    toasts,
    forgotPasswordRole,
    typingStatus,
    selectedCategory,
    publicSellerProfile,
    activeChat,
    isAnnouncementVisible,
    recommendations,
    initialSearchQuery,
    isCommandPaletteOpen,
    userLocation,
    selectedCity,
    users,
    platformSettings,
    auditLog,
    vehicleData,
    faqItems,
    supportTickets,
    notifications,

    // Actions
    setCurrentView,
    setPreviousView,
    setSelectedVehicle,
    setVehicles: setVehicles as (vehicles: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => void,
    setIsLoading,
    setCurrentUser,
    setComparisonList: setComparisonList as (list: number[] | ((prev: number[]) => number[])) => void,
    setWishlist: setWishlist as (list: number[] | ((prev: number[]) => number[])) => void,
    setConversations,
    setToasts,
    setForgotPasswordRole,
    setTypingStatus,
    setSelectedCategory,
    setPublicSellerProfile,
    setActiveChat,
    setIsAnnouncementVisible,
    setRecommendations,
    setInitialSearchQuery,
    setIsCommandPaletteOpen,
    setUserLocation,
    setSelectedCity,
    setUsers,
    setPlatformSettings,
    setAuditLog,
    setVehicleData,
    setFaqItems,
    setSupportTickets,
    setNotifications,
    setRatings,
    setSellerRatings: setSellerRatings as (ratings: { [key: string]: number[] } | ((prev: { [key: string]: number[] }) => { [key: string]: number[] })) => void,

    // Helper functions
    addToast,
    removeToast,
    handleLogout,
    navigate,
  };

  try {
    console.log('🔧 AppProvider: Rendering with context value');
    return (
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    );
  } catch (error) {
    console.error('🔧 AppProvider: Error rendering:', error);
    throw error;
  }
};
