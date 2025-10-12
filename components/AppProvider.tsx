import React, { createContext, useContext, useMemo } from 'react';
import type { Vehicle, User, Conversation, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, SupportTicket, FAQItem } from '../types';

// Create context for app state
interface AppContextType {
  // Core state
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Vehicle state
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  toasts: ToastType[];
  setToasts: React.Dispatch<React.SetStateAction<ToastType[]>>;
  
  // User interactions
  comparisonList: number[];
  setComparisonList: React.Dispatch<React.SetStateAction<number[]>>;
  wishlist: number[];
  setWishlist: React.Dispatch<React.SetStateAction<number[]>>;
  
  // Conversations
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  
  // Platform data
  platformSettings: PlatformSettings;
  setPlatformSettings: React.Dispatch<React.SetStateAction<PlatformSettings>>;
  auditLog: AuditLogEntry[];
  setAuditLog: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
  vehicleData: VehicleData;
  setVehicleData: React.Dispatch<React.SetStateAction<VehicleData>>;
  faqItems: FAQItem[];
  setFaqItems: React.Dispatch<React.SetStateAction<FAQItem[]>>;
  supportTickets: SupportTicket[];
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  
  // Users
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
  value: AppContextType;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, value }) => {
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => value, [
    value.currentView,
    value.currentUser,
    value.vehicles,
    value.selectedVehicle,
    value.isLoading,
    value.toasts,
    value.comparisonList,
    value.wishlist,
    value.conversations,
    value.platformSettings,
    value.auditLog,
    value.vehicleData,
    value.faqItems,
    value.supportTickets,
    value.notifications,
    value.users
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};