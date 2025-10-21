import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Vehicle, User, Conversation, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, SupportTicket, FAQItem, SubscriptionPlan } from '../types';
import { View, VehicleCategory as CategoryEnum } from '../types';
import { getRatings, addRating, getSellerRatings, addSellerRating } from '../services/ratingService';
import { getConversations, saveConversations } from '../services/chatService';
import { getSettings, saveSettings } from '../services/settingsService';
import { getAuditLog, logAction, saveAuditLog } from '../services/auditLogService';
import { showNotification } from '../services/notificationService';
import { getFaqs, saveFaqs } from '../services/faqService';
import { getSupportTickets, saveSupportTickets } from '../services/supportTicketService';
import { dataService } from '../services/dataService';
import { loadingManager, LOADING_OPERATIONS, withLoadingTimeout } from '../utils/loadingManager';
import { useTimeout } from '../hooks/useCleanup';
import { VEHICLE_DATA } from './vehicleData';

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
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
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
  handleLogin: (user: User) => void;
  handleRegister: (user: User) => void;
  navigate: (view: View, params?: { city?: string }) => void;
  
  // Admin functions
  onAdminUpdateUser: (email: string, details: { name: string; mobile: string; role: User['role'] }) => void;
  onUpdateUserPlan: (email: string, plan: SubscriptionPlan) => void;
  onToggleUserStatus: (email: string) => void;
  onToggleVehicleStatus: (vehicleId: number) => void;
  onToggleVehicleFeature: (vehicleId: number) => void;
  onResolveFlag: (type: 'vehicle' | 'conversation', id: number | string) => void;
  onUpdateSettings: (settings: PlatformSettings) => void;
  onSendBroadcast: (message: string) => void;
  onExportUsers: () => void;
  onExportVehicles: () => void;
  onExportSales: () => void;
  onUpdateVehicleData: (newData: VehicleData) => void;
  onToggleVerifiedStatus: (email: string) => void;
  onUpdateSupportTicket: (ticket: SupportTicket) => void;
  onAddFaq: (faq: Omit<FAQItem, 'id'>) => void;
  onUpdateFaq: (faq: FAQItem) => void;
  onDeleteFaq: (id: number) => void;
  onCertificationApproval: (vehicleId: number, decision: 'approved' | 'rejected') => void;
  
  // Additional functions
  addRating: (vehicleId: number, rating: number) => void;
  addSellerRating: (sellerEmail: string, rating: number) => void;
  sendMessage: (conversationId: string, message: string) => void;
  markAsRead: (conversationId: string) => void;
  toggleTyping: (conversationId: string, isTyping: boolean) => void;
  flagContent: (type: 'vehicle' | 'conversation', id: number | string) => void;
  updateUser: (email: string, updates: Partial<User>) => void;
  deleteUser: (email: string) => void;
  updateVehicle: (id: number, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: number) => void;
  selectVehicle: (vehicle: Vehicle) => void;
  toggleWishlist: (vehicleId: number) => void;
  toggleCompare: (vehicleId: number) => void;
  onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
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
  
  // All state from App.tsx moved here
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [previousView, setPreviousView] = useState<View>(View.HOME);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check for existing logged-in user on app startup
    try {
      const savedUser = localStorage.getItem('reRideCurrentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        console.log('🔄 Restoring logged-in user:', user.name, user.role);
        return user;
      }
    } catch (error) {
      console.warn('Failed to load user from localStorage:', error);
    }
    return null;
  });
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
  const [vehicleData, setVehicleData] = useState<VehicleData>(() => {
    // Try to load from localStorage first, fallback to static data
    try {
      const savedVehicleData = localStorage.getItem('reRideVehicleData');
      if (savedVehicleData) {
        return JSON.parse(savedVehicleData);
      }
    } catch (error) {
      console.warn('Failed to load vehicle data from localStorage:', error);
    }
    return VEHICLE_DATA;
  });
  const [faqItems, setFaqItems] = useState<FAQItem[]>(() => getFaqs() || []);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => getSupportTickets() || []);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const notificationsJson = localStorage.getItem('reRideNotifications');
      if (notificationsJson) {
        return JSON.parse(notificationsJson);
      } else {
        // Create sample notifications for testing
        const sampleNotifications: Notification[] = [
          {
            id: 1,
            recipientEmail: 'seller@test.com',
            message: 'New message from Mock Customer: Offer: 600000',
            targetId: 'conv_1703123456789',
            targetType: 'conversation',
            isRead: false,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
          },
          {
            id: 2,
            recipientEmail: 'seller@test.com',
            message: 'New message from Mock Customer: Offer: 123444',
            targetId: 'conv_1703123456789',
            targetType: 'conversation',
            isRead: false,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
          }
        ];
        localStorage.setItem('reRideNotifications', JSON.stringify(sampleNotifications));
        return sampleNotifications;
      }
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

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('reRideCurrentUser', JSON.stringify(user));
    addToast(`Welcome back, ${user.name}!`, 'success');
    
    // Navigate based on user role
    if (user.role === 'admin') {
      setCurrentView(View.ADMIN_PANEL);
    } else if (user.role === 'seller') {
      setCurrentView(View.SELLER_DASHBOARD);
    } else {
      setCurrentView(View.HOME);
    }
  }, [addToast]);

  const handleRegister = useCallback((user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('reRideCurrentUser', JSON.stringify(user));
    addToast(`Welcome to ReRide, ${user.name}!`, 'success');
    
    // Navigate based on user role
    if (user.role === 'admin') {
      setCurrentView(View.ADMIN_PANEL);
    } else if (user.role === 'seller') {
      setCurrentView(View.SELLER_DASHBOARD);
    } else {
      setCurrentView(View.HOME);
    }
  }, [addToast]);

  const navigate = useCallback((view: View, params?: { city?: string }) => {
    const isNavigatingAwayFromSellerProfile = currentView === View.SELLER_PROFILE && view !== View.SELLER_PROFILE;
    if (isNavigatingAwayFromSellerProfile) { 
      window.history.pushState({}, '', window.location.pathname); 
      setPublicSellerProfile(null); 
    }
    setInitialSearchQuery('');
    
    // Fixed: Preserve selectedVehicle when navigating TO DETAIL view or between DETAIL and SELLER_PROFILE
    const preserveSelectedVehicle = view === View.DETAIL || 
      (view === View.SELLER_PROFILE && currentView === View.DETAIL) || 
      (view === View.DETAIL && currentView === View.SELLER_PROFILE);
    
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
        setIsLoading(true);
        
        // Load vehicles, vehicle data, users, and conversations in parallel
        const [vehiclesData, vehicleDataData, usersData, conversationsData] = await Promise.all([
          dataService.getVehicles(),
          dataService.getVehicleData(),
          dataService.getUsers(),
          Promise.resolve(getConversations()) // Load conversations from localStorage
        ]);
        
        setVehicles(vehiclesData);
        setVehicleData(vehicleDataData);
        setUsers(usersData);
        setConversations(conversationsData);
        
        // Set some recommendations (first 6 vehicles)
        setRecommendations(vehiclesData.slice(0, 6));
      } catch (error) {
        console.error('AppProvider: Error loading initial data:', error);
        addToast('Failed to load vehicle data. Please refresh the page.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [addToast]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // Sync activeChat when conversations change
  useEffect(() => {
    if (activeChat) {
      const updatedConversation = conversations.find(conv => conv.id === activeChat.id);
      if (updatedConversation && JSON.stringify(updatedConversation) !== JSON.stringify(activeChat)) {
        setActiveChat(updatedConversation);
      }
    }
  }, [conversations, activeChat]);

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

  // Add online/offline sync functionality
  useEffect(() => {
    const handleOnline = () => {
      console.log('🔄 App came online, syncing data...');
      dataService.syncWhenOnline().then(() => {
        console.log('✅ Data sync completed');
        addToast('Data synchronized successfully', 'success');
      }).catch((error) => {
        console.warn('⚠️ Data sync failed:', error);
        addToast('Data sync failed, but app is still functional', 'warning');
      });
    };

    const handleOffline = () => {
      console.log('📴 App went offline');
      addToast('You are now offline. Changes will sync when connection is restored.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

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
    setConversations: setConversations as (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void,
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
    handleLogin,
    handleRegister,
    navigate,
    
    // Admin functions
    onAdminUpdateUser: (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
      setUsers(prev => prev.map(user => 
        user.email === email ? { ...user, ...details } : user
      ));
      addToast(`User ${email} updated successfully`, 'success');
    },
    onUpdateUserPlan: (email: string, plan: SubscriptionPlan) => {
      setUsers(prev => prev.map(user => 
        user.email === email ? { ...user, subscription: { ...user.subscription, plan } } : user
      ));
      addToast(`Plan updated for ${email}`, 'success');
    },
    onToggleUserStatus: (email: string) => {
      setUsers(prev => prev.map(user => 
        user.email === email ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' } : user
      ));
      addToast(`User status toggled for ${email}`, 'success');
    },
    onToggleVehicleStatus: (vehicleId: number) => {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId ? { ...vehicle, status: vehicle.status === 'published' ? 'draft' : 'published' } : vehicle
      ));
      addToast(`Vehicle status toggled`, 'success');
    },
    onToggleVehicleFeature: (vehicleId: number) => {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId ? { ...vehicle, isFeatured: !vehicle.isFeatured } : vehicle
      ));
      addToast(`Vehicle feature status toggled`, 'success');
    },
    onResolveFlag: (type: 'vehicle' | 'conversation', id: number | string) => {
      if (type === 'vehicle') {
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === id ? { ...vehicle, isFlagged: false } : vehicle
        ));
      } else {
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, isFlagged: false } : conv
        ));
      }
      addToast(`Flag resolved for ${type}`, 'success');
    },
    onUpdateSettings: (settings: PlatformSettings) => {
      setPlatformSettings(settings);
      addToast('Platform settings updated', 'success');
    },
    onSendBroadcast: (message: string) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'broadcast',
        title: 'Platform Announcement',
        message,
        timestamp: new Date(),
        isRead: false
      }]);
      addToast('Broadcast sent to all users', 'success');
    },
    onExportUsers: () => {
      try {
        const headers = 'Name,Email,Role,Status,Mobile,Join Date\n';
        const csv = users.map(user => 
          `"${user.name}","${user.email}","${user.role}","${user.status}","${user.mobile || ''}","${user.joinDate || ''}"`
        ).join('\n');
        const fullCsv = headers + csv;
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Exported ${users.length} users successfully`, 'success');
      } catch (error) {
        console.error('Export failed:', error);
        addToast('Export failed. Please try again.', 'error');
      }
    },
    onExportVehicles: () => {
      try {
        const headers = 'Make,Model,Year,Price,Seller,Status,Mileage,Location,Features\n';
        const csv = vehicles.map(vehicle => 
          `"${vehicle.make}","${vehicle.model}","${vehicle.year}","${vehicle.price}","${vehicle.sellerEmail}","${vehicle.status}","${vehicle.mileage || ''}","${vehicle.location || ''}","${vehicle.features?.join('; ') || ''}"`
        ).join('\n');
        const fullCsv = headers + csv;
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Exported ${vehicles.length} vehicles successfully`, 'success');
      } catch (error) {
        console.error('Export failed:', error);
        addToast('Export failed. Please try again.', 'error');
      }
    },
    onExportSales: () => {
      try {
        const soldVehicles = vehicles.filter(v => v.status === 'sold');
        const headers = 'Make,Model,Year,Sale Price,Seller,Buyer,Sale Date\n';
        const csv = soldVehicles.map(vehicle => 
          `"${vehicle.make}","${vehicle.model}","${vehicle.year}","${vehicle.price}","${vehicle.sellerEmail}","${vehicle.buyerEmail || 'N/A'}","${vehicle.saleDate || 'N/A'}"`
        ).join('\n');
        const fullCsv = headers + csv;
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Exported ${soldVehicles.length} sales records successfully`, 'success');
      } catch (error) {
        console.error('Export failed:', error);
        addToast('Export failed. Please try again.', 'error');
      }
    },
    onUpdateVehicleData: async (newData: VehicleData) => {
      try {
        // Update local state first
        setVehicleData(newData);
        
        // Save to API for persistence with enhanced error handling
        const { saveVehicleData } = await import('../services/vehicleDataService');
        const success = await saveVehicleData(newData);
        
        if (success) {
          addToast('Vehicle data updated and synced successfully', 'success');
          console.log('✅ Vehicle data updated via API:', newData);
        } else {
          // Fallback to localStorage if API fails
          try {
            localStorage.setItem('reRideVehicleData', JSON.stringify(newData));
            addToast('Vehicle data updated (saved locally, will sync when online)', 'warning');
            console.warn('⚠️ API failed, saved to localStorage as fallback');
            
            // Import sync service to mark pending changes
            const { syncService } = await import('../services/syncService');
            syncService.markPendingChanges();
          } catch (error) {
            console.warn('Failed to save vehicle data to localStorage:', error);
            addToast('Failed to save vehicle data', 'error');
          }
        }
      } catch (error) {
        console.error('❌ Failed to update vehicle data:', error);
        addToast('Failed to update vehicle data. Please try again.', 'error');
      }
    },
    onToggleVerifiedStatus: (email: string) => {
      setUsers(prev => prev.map(user => 
        user.email === email ? { ...user, isVerified: !user.isVerified } : user
      ));
      addToast(`Verification status toggled for ${email}`, 'success');
    },
    onUpdateSupportTicket: (ticket: SupportTicket) => {
      setSupportTickets(prev => prev.map(t => 
        t.id === ticket.id ? ticket : t
      ));
      addToast('Support ticket updated', 'success');
    },
    onAddFaq: (faq: Omit<FAQItem, 'id'>) => {
      const newFaq: FAQItem = { ...faq, id: Date.now() };
      setFaqItems(prev => [...prev, newFaq]);
      addToast('FAQ added successfully', 'success');
    },
    onUpdateFaq: (faq: FAQItem) => {
      setFaqItems(prev => prev.map(f => f.id === faq.id ? faq : f));
      addToast('FAQ updated successfully', 'success');
    },
    onDeleteFaq: (id: number) => {
      setFaqItems(prev => prev.filter(f => f.id !== id));
      addToast('FAQ deleted successfully', 'success');
    },
    onCertificationApproval: (vehicleId: number, decision: 'approved' | 'rejected') => {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId ? { 
          ...vehicle, 
          certificationStatus: decision === 'approved' ? 'certified' : 'rejected' 
        } : vehicle
      ));
      addToast(`Certification ${decision} for vehicle`, 'success');
    },
    
    // Additional functions
    addRating: (vehicleId: number, rating: number) => {
      setRatings(prev => ({
        ...prev,
        [vehicleId]: [...(prev[vehicleId] || []), rating]
      }));
      addToast('Rating added successfully', 'success');
    },
    addSellerRating: (sellerEmail: string, rating: number) => {
      setSellerRatings(prev => ({
        ...prev,
        [sellerEmail]: [...(prev[sellerEmail] || []), rating]
      }));
      addToast('Seller rating added successfully', 'success');
    },
    sendMessage: (conversationId: string, message: string) => {
      console.log('🔧 sendMessage called:', { conversationId, message, currentUser: currentUser?.email });
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === conversationId ? {
            ...conv,
            messages: [...conv.messages, {
              id: Date.now(),
              sender: (currentUser?.role === 'seller' ? 'seller' : 'user') as 'seller' | 'user',
              text: message,
              timestamp: new Date().toISOString(),
              isRead: false,
              type: 'text'
            }],
            lastMessageAt: new Date().toISOString()
          } : conv
        );
        console.log('🔧 Updated conversations:', updated);
        return updated;
      });

      // Create notification for the recipient
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (conversation && currentUser) {
        const recipientEmail = currentUser.role === 'seller' ? conversation.customerId : conversation.sellerId;
        const senderName = currentUser.role === 'seller' ? 'Seller' : conversation.customerName;
        
        const newNotification: Notification = {
          id: Date.now(),
          recipientEmail,
          message: `New message from ${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
          targetId: conversationId,
          targetType: 'conversation',
          isRead: false,
          timestamp: new Date().toISOString()
        };

        setNotifications(prev => {
          const updated = [newNotification, ...prev];
          // Save to localStorage
          try {
            localStorage.setItem('reRideNotifications', JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to save notifications to localStorage:', error);
          }
          return updated;
        });
      }
      
      // Update activeChat if it's the same conversation
      setActiveChat(prev => {
        if (prev && prev.id === conversationId) {
          const updatedConv = conversations.find(conv => conv.id === conversationId);
          if (updatedConv) {
            return {
              ...updatedConv,
              messages: [...updatedConv.messages, {
                id: Date.now(),
                sender: (currentUser?.role === 'seller' ? 'seller' : 'user') as 'seller' | 'user',
                text: message,
                timestamp: new Date().toISOString(),
                isRead: false,
                type: 'text'
              }],
              lastMessageAt: new Date().toISOString()
            };
          }
        }
        return prev;
      });
    },
    markAsRead: (conversationId: string) => {
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? {
          ...conv,
          messages: conv.messages.map(msg => ({ ...msg, isRead: true }))
        } : conv
      ));
    },
    toggleTyping: (conversationId: string, isTyping: boolean) => {
      setTypingStatus(isTyping ? { conversationId, userRole: (currentUser?.role === 'seller' ? 'seller' : 'customer') as 'seller' | 'customer' } : null);
    },
    flagContent: (type: 'vehicle' | 'conversation', id: number | string) => {
      if (type === 'vehicle') {
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === id ? { ...vehicle, isFlagged: true } : vehicle
        ));
      } else {
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, isFlagged: true } : conv
        ));
      }
      addToast(`Content flagged for review`, 'warning');
    },
    updateUser: (email: string, updates: Partial<User>) => {
      setUsers(prev => prev.map(user => 
        user.email === email ? { ...user, ...updates } : user
      ));
      addToast('User updated successfully', 'success');
    },
    deleteUser: (email: string) => {
      setUsers(prev => prev.filter(user => user.email !== email));
      addToast('User deleted successfully', 'success');
    },
    updateVehicle: async (id: number, updates: Partial<Vehicle>) => {
      try {
        // Find the vehicle to update
        const vehicleToUpdate = vehicles.find(v => v.id === id);
        if (!vehicleToUpdate) {
          addToast('Vehicle not found', 'error');
          return;
        }

        // Create updated vehicle object
        const updatedVehicle = { ...vehicleToUpdate, ...updates };
        
        // Call API to persist changes
        const { updateVehicle: updateVehicleApi } = await import('../services/vehicleService');
        const result = await updateVehicleApi(updatedVehicle);
        
        // Update local state with the result from API
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === id ? result : vehicle
        ));
        
        addToast('Vehicle updated successfully', 'success');
        console.log('✅ Vehicle updated via API:', result);
      } catch (error) {
        console.error('❌ Failed to update vehicle:', error);
        addToast('Failed to update vehicle. Please try again.', 'error');
      }
    },
    deleteVehicle: async (id: number) => {
      try {
        // Call API to delete vehicle
        const { deleteVehicle: deleteVehicleApi } = await import('../services/vehicleService');
        const result = await deleteVehicleApi(id);
        
        if (result.success) {
          // Update local state
          setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
          addToast('Vehicle deleted successfully', 'success');
          console.log('✅ Vehicle deleted via API:', result);
        } else {
          addToast('Failed to delete vehicle', 'error');
        }
      } catch (error) {
        console.error('❌ Failed to delete vehicle:', error);
        addToast('Failed to delete vehicle. Please try again.', 'error');
      }
    },
    selectVehicle: (vehicle: Vehicle) => {
      setSelectedVehicle(vehicle);
      // Navigate to DETAIL view when a vehicle is selected
      setCurrentView(View.DETAIL);
    },
    toggleWishlist: (vehicleId: number) => {
      setWishlist(prev => 
        prev.includes(vehicleId) 
          ? prev.filter(id => id !== vehicleId)
          : [...prev, vehicleId]
      );
    },
    toggleCompare: (vehicleId: number) => {
      setComparisonList(prev => 
        prev.includes(vehicleId) 
          ? prev.filter(id => id !== vehicleId)
          : prev.length < 3 ? [...prev, vehicleId] : prev
      );
    },
    onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => {
      console.log('🔧 onOfferResponse called:', { conversationId, messageId, response, counterPrice });
      
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === conversationId) {
            const updatedMessages = conv.messages.map(msg => {
              if (msg.id === messageId) {
                const updatedPayload = {
                  ...msg.payload,
                  status: response,
                  ...(counterPrice && { counterPrice })
                };
                
                return {
                  ...msg,
                  payload: updatedPayload
                };
              }
              return msg;
            });
            
            // Add a response message
            const responseMessages = {
              accepted: `✅ Offer accepted! The deal is confirmed.`,
              rejected: `❌ Offer declined. Thank you for your interest.`,
              countered: `💰 Counter-offer made: ₹${counterPrice?.toLocaleString('en-IN')}`
            };
            
            const responseMessage = {
              id: Date.now(),
              sender: 'seller',
              text: responseMessages[response],
              timestamp: new Date().toISOString(),
              isRead: false,
              type: 'text'
            };
            
            return {
              ...conv,
              messages: [...updatedMessages, responseMessage],
              lastMessageAt: new Date().toISOString()
            };
          }
          return conv;
        });
        
        console.log('🔧 Updated conversations after offer response:', updated);
        return updated;
      });
      
      // Update activeChat if it's the same conversation
      setActiveChat(prev => {
        if (prev && prev.id === conversationId) {
          const updatedConv = conversations.find(conv => conv.id === conversationId);
          if (updatedConv) {
            return {
              ...updatedConv,
              messages: updatedConv.messages.map(msg => {
                if (msg.id === messageId) {
                  const updatedPayload = {
                    ...msg.payload,
                    status: response,
                    ...(counterPrice && { counterPrice })
                  };
                  
                  return {
                    ...msg,
                    payload: updatedPayload
                  };
                }
                return msg;
              })
            };
          }
        }
        return prev;
      });
      
      addToast(`Offer ${response} successfully`, 'success');
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
