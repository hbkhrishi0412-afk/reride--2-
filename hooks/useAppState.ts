import { useState, useCallback, useMemo, useRef } from 'react';
import type { Vehicle, User, Conversation, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, SupportTicket, FAQItem } from '../types';

// Custom hook for optimized state management
export const useAppState = () => {
  // Core state
  const [currentView, setCurrentView] = useState<string>('HOME');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comparisonList, setComparisonList] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number[] }>({});
  const [sellerRatings, setSellerRatings] = useState<{ [key: string]: number[] }>({});
  const [recommendations, setRecommendations] = useState<Vehicle[]>([]);
  const [userLocation, setUserLocation] = useState<string>('Mumbai');

  // Memoized callbacks to prevent unnecessary re-renders
  const addToast = useCallback((message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toggleWishlist = useCallback((vehicleId: number) => {
    setWishlist(prev => {
      const isAdding = !prev.includes(vehicleId);
      const newWishlist = isAdding ? [...prev, vehicleId] : prev.filter(id => id !== vehicleId);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  }, []);

  const toggleCompare = useCallback((vehicleId: number) => {
    setComparisonList(prev => {
      if (!prev.includes(vehicleId) && prev.length >= 4) {
        addToast("You can only compare up to 4 vehicles.", 'error');
        return prev;
      }
      return prev.includes(vehicleId) ? prev.filter(id => id !== vehicleId) : [...prev, vehicleId];
    });
  }, [addToast]);

  const clearCompare = useCallback(() => {
    setComparisonList([]);
  }, []);

  // Memoized expensive computations
  const usersWithRatingsAndBadges = useMemo(() => users.map(user => {
    if (user.role !== 'seller') return user;
    const sellerRatingsList = sellerRatings[user.email] || [];
    const ratingCount = sellerRatingsList.length;
    const averageRating = ratingCount > 0 ? sellerRatingsList.reduce((acc, curr) => acc + curr, 0) / ratingCount : 0;
    const allSellerVehicles = vehicles.filter(v => v.sellerEmail === user.email);
    // Simplified badge calculation for performance
    const badges = [];
    if (averageRating >= 4.5) badges.push({ id: 'high-rated', name: 'High Rated', color: 'green' });
    if (ratingCount >= 10) badges.push({ id: 'experienced', name: 'Experienced', color: 'blue' });
    if (allSellerVehicles.length >= 5) badges.push({ id: 'volume-seller', name: 'Volume Seller', color: 'purple' });
    
    return { ...user, averageRating, ratingCount, badges };
  }), [users, sellerRatings, vehicles]);

  const vehiclesWithRatings = useMemo(() => vehicles.map(vehicle => {
    const vehicleRatings = ratings[vehicle.id] || [];
    const ratingCount = vehicleRatings.length;
    const averageRating = ratingCount > 0 ? vehicleRatings.reduce((acc, curr) => acc + curr, 0) / ratingCount : 0;
    const seller = usersWithRatingsAndBadges.find(u => u.email === vehicle.sellerEmail);
    return { 
      ...vehicle, 
      averageRating, 
      ratingCount, 
      sellerName: seller?.dealershipName || seller?.name || 'Private Seller', 
      sellerAverageRating: seller?.averageRating, 
      sellerRatingCount: seller?.ratingCount, 
      sellerBadges: seller?.badges 
    };
  }), [vehicles, ratings, usersWithRatingsAndBadges]);

  // Memoized filtered data
  const allPublishedVehicles = useMemo(() => 
    vehiclesWithRatings.filter(v => v.status === 'published'), 
    [vehiclesWithRatings]
  );

  const featuredVehicles = useMemo(() => 
    vehiclesWithRatings.filter(v => v.isFeatured && v.status === 'published').slice(0, 4), 
    [vehiclesWithRatings]
  );

  const vehiclesToCompare = useMemo(() => 
    vehiclesWithRatings.filter(v => comparisonList.includes(v.id)), 
    [vehiclesWithRatings, comparisonList]
  );

  const vehiclesInWishlist = useMemo(() => 
    vehiclesWithRatings.filter(v => wishlist.includes(v.id)), 
    [vehiclesWithRatings, wishlist]
  );

  const selectedVehicleWithRating = useMemo(() => { 
    if (!selectedVehicle) return null; 
    return vehiclesWithRatings.find(v => v.id === selectedVehicle.id) || selectedVehicle; 
  }, [selectedVehicle, vehiclesWithRatings]);

  const inboxCount = useMemo(() => { 
    if(!currentUser || currentUser.role !== 'customer') return 0; 
    return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length; 
  }, [conversations, currentUser]);

  const isHomePage = currentView === 'HOME';

  return {
    // State
    currentView,
    setCurrentView,
    selectedVehicle,
    setSelectedVehicle,
    vehicles,
    setVehicles,
    isLoading,
    setIsLoading,
    currentUser,
    setCurrentUser,
    comparisonList,
    wishlist,
    conversations,
    setConversations,
    toasts,
    users,
    setUsers,
    ratings,
    setRatings,
    sellerRatings,
    setSellerRatings,
    recommendations,
    setRecommendations,
    userLocation,
    setUserLocation,

    // Computed values
    usersWithRatingsAndBadges,
    vehiclesWithRatings,
    allPublishedVehicles,
    featuredVehicles,
    vehiclesToCompare,
    vehiclesInWishlist,
    selectedVehicleWithRating,
    inboxCount,
    isHomePage,

    // Actions
    addToast,
    removeToast,
    toggleWishlist,
    toggleCompare,
    clearCompare
  };
};