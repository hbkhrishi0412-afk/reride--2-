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
import { dataService } from '../services/dataService';
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

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('reRideCurrentUser', JSON.stringify(user));
    addToast(`Welcome back, ${user.name}!`, 'success');
    
    // Navigate based on user role
    if (user.role === 'admin') {
      setCurrentView(View.ADMIN_PANEL);
    } else if (user.role === 'seller') {
      setCurrentView(View.DASHBOARD);
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
      setCurrentView(View.DASHBOARD);
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
        
        // Load vehicles, vehicle data, and conversations in parallel
        const [vehiclesData, vehicleDataData, conversationsData] = await Promise.all([
          dataService.getVehicles(),
          dataService.getVehicleData(),
          Promise.resolve(getConversations()) // Load conversations from localStorage
        ]);
        
        setVehicles(vehiclesData);
        setVehicleData(vehicleDataData);
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
    onUpdateVehicleData: (newData: VehicleData) => {
      setVehicleData(newData);
      addToast('Vehicle data updated', 'success');
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
              sender: currentUser?.role === 'seller' ? 'seller' : 'user',
              text: message,
              timestamp: new Date().toISOString(),
              isRead: false,
              type: 'text'
            }]
          } : conv
        );
        console.log('🔧 Updated conversations:', updated);
        return updated;
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
      setTypingStatus(isTyping ? { conversationId, userRole: currentUser?.role || 'customer' } : null);
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
    updateVehicle: (id: number, updates: Partial<Vehicle>) => {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      ));
      addToast('Vehicle updated successfully', 'success');
    },
    deleteVehicle: (id: number) => {
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      addToast('Vehicle deleted successfully', 'success');
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
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
