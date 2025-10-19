import React, { Suspense, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './components/AppProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import { ChatWidget } from './components/ChatWidget';
import { View, User, SupportTicket, Vehicle } from './types';
import { getConversations, saveConversations } from './services/chatService';
import { getRatings, getSellerRatings } from './services/ratingService';
import { saveSettings } from './services/settingsService';
import { saveAuditLog } from './services/auditLogService';
import { saveFaqs } from './services/faqService';
import { saveSupportTickets } from './services/supportTicketService';
import { loadingManager, LOADING_OPERATIONS, withLoadingTimeout } from './utils/loadingManager';

// Lazy-loaded components
const Home = React.lazy(() => import('./components/Home'));
const VehicleList = React.lazy(() => import('./components/VehicleList'));
const VehicleDetail = React.lazy(() => import('./components/VehicleDetail').then(module => ({ default: module.VehicleDetail })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.default })));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.default })));
const Comparison = React.lazy(() => import('./components/Comparison'));
const Profile = React.lazy(() => import('./components/Profile'));
const CustomerInbox = React.lazy(() => import('./components/CustomerInbox'));
const SellerProfilePage = React.lazy(() => import('./components/SellerProfilePage'));
const NewCars = React.lazy(() => import('./components/NewCars'));
const DealerProfiles = React.lazy(() => import('./components/DealerProfiles'));
const PricingPage = React.lazy(() => import('./components/PricingPage'));
const SupportPage = React.lazy(() => import('./components/SupportPage'));
const FAQPage = React.lazy(() => import('./components/FAQPage'));
const BuyerDashboard = React.lazy(() => import('./components/BuyerDashboard'));
const CityLandingPage = React.lazy(() => import('./components/CityLandingPage'));
const LoginPortal = React.lazy(() => import('./components/LoginPortal'));
const CustomerLogin = React.lazy(() => import('./CustomerLogin'));
const AdminLogin = React.lazy(() => import('./AdminLogin'));
const Login = React.lazy(() => import('./Login'));
const ForgotPassword = React.lazy(() => import('./components/ForgotPassword'));

const LoadingSpinner: React.FC = () => (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-spinny-orange"></div>
            <span className="text-xl font-semibold text-brand-gray-600 dark:text-brand-gray-300">Loading...</span>
        </div>
    </div>
);

const AppContent: React.FC = () => {
  const {
    currentView,
    selectedVehicle,
    vehicles,
    isLoading,
    currentUser,
    comparisonList,
    wishlist,
    conversations,
    toasts,
    activeChat,
    users,
    platformSettings,
    auditLog,
    vehicleData,
    faqItems,
    supportTickets,
    notifications,
    forgotPasswordRole,
    selectedCategory,
    initialSearchQuery,
    userLocation,
    selectedCity,
    publicSellerProfile,
    recommendations,
    removeToast,
    handleLogout,
    navigate,
    addToast,
    setActiveChat,
    setIsCommandPaletteOpen,
    isCommandPaletteOpen,
    setUserLocation,
    setCurrentUser,
    setUsers,
    setVehicles,
    setIsLoading,
    setConversations,
    setRatings,
    setSellerRatings,
    setWishlist,
    setComparisonList,
    setPlatformSettings,
    setAuditLog,
    setVehicleData,
    setFaqItems,
    setSupportTickets,
    setNotifications,
    setForgotPasswordRole,
    setPublicSellerProfile,
    setSelectedVehicle,
    setPreviousView,
    setSelectedCategory,
    setInitialSearchQuery,
    setRecommendations,
  } = useApp();

  // Vehicle operation handlers
  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean = false) => {
    try {
      const { addVehicle } = await import('./services/vehicleService');
      const newVehicle = await addVehicle({
        ...vehicleData,
        id: Date.now(),
        averageRating: 0,
        ratingCount: 0,
        isFeatured: isFeaturing,
        status: 'published'
      } as Vehicle);
      (setVehicles as any)((prev: Vehicle[]) => [...prev, newVehicle]);
      addToast('Vehicle added successfully!', 'success');
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      addToast('Failed to add vehicle. Please try again.', 'error');
    }
  };

  const handleUpdateVehicle = async (vehicleData: Vehicle) => {
    try {
      const { updateVehicle } = await import('./services/vehicleService');
      const updatedVehicle = await updateVehicle(vehicleData);
      (setVehicles as any)((prev: Vehicle[]) => prev.map((v: Vehicle) => v.id === vehicleData.id ? updatedVehicle : v));
      addToast('Vehicle updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      addToast('Failed to update vehicle. Please try again.', 'error');
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    try {
      const { deleteVehicle } = await import('./services/vehicleService');
      await deleteVehicle(vehicleId);
      (setVehicles as any)((prev: Vehicle[]) => prev.filter((v: Vehicle) => v.id !== vehicleId));
      addToast('Vehicle deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      addToast('Failed to delete vehicle. Please try again.', 'error');
    }
  };

  const handleMarkAsSold = async (vehicleId: number) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        await handleUpdateVehicle({ ...vehicle, status: 'sold' });
        addToast('Vehicle marked as sold!', 'success');
      }
    } catch (error) {
      console.error('Failed to mark vehicle as sold:', error);
      addToast('Failed to mark vehicle as sold. Please try again.', 'error');
    }
  };

  const handleFeatureListing = async (vehicleId: number) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        await handleUpdateVehicle({ ...vehicle, isFeatured: true });
        addToast('Listing featured successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to feature listing:', error);
      addToast('Failed to feature listing. Please try again.', 'error');
    }
  };

  const handleRequestCertification = async (vehicleId: number) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        await handleUpdateVehicle({ ...vehicle, certificationStatus: 'requested' });
        addToast('Certification request submitted!', 'success');
      }
    } catch (error) {
      console.error('Failed to request certification:', error);
      addToast('Failed to request certification. Please try again.', 'error');
    }
  };

  const handleAddMultipleVehicles = async (vehiclesData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>[]) => {
    try {
      const { addVehicle } = await import('./services/vehicleService');
      const newVehicles = await Promise.all(
        vehiclesData.map(async (vehicleData) => {
          return await addVehicle({
            ...vehicleData,
            id: Date.now() + Math.random(),
            averageRating: 0,
            ratingCount: 0,
            status: 'published'
          } as Vehicle);
        })
      );
      (setVehicles as any)((prev: Vehicle[]) => [...prev, ...newVehicles]);
      addToast(`${newVehicles.length} vehicles added successfully!`, 'success');
    } catch (error) {
      console.error('Failed to add multiple vehicles:', error);
      addToast('Failed to add vehicles. Please try again.', 'error');
    }
  };

  const handleViewSellerProfile = (sellerEmail: string) => {
    console.log('🔍 Viewing seller profile for:', sellerEmail);
    const seller = users.find(u => u.email === sellerEmail);
    if (seller) {
      console.log('✅ Seller found:', seller.name);
      setPublicSellerProfile(seller);
      navigate(View.SELLER_PROFILE);
    } else {
      console.log('❌ Seller not found with email:', sellerEmail);
      addToast('Seller profile not found', 'error');
    }
  };

  const handleToggleCompare = (vehicleId: number) => {
    (setComparisonList as any)((prev: number[]) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id: number) => id !== vehicleId);
      } else if (prev.length < 4) {
        return [...prev, vehicleId];
      } else {
        addToast('You can compare up to 4 vehicles at a time', 'info');
        return prev;
      }
    });
  };

  const handleToggleWishlist = (vehicleId: number) => {
    (setWishlist as any)((prev: number[]) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id: number) => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  const handleClearCompare = () => {
    setComparisonList([]);
  };

  const handleAddSellerRating = (sellerEmail: string, rating: number) => {
    (setSellerRatings as any)((prev: { [key: string]: number[] }) => ({
      ...prev,
      [sellerEmail]: [...(prev[sellerEmail] || []), rating]
    }));
    addToast('Rating added successfully!', 'success');
  };

  const handleFlagContent = (type: 'vehicle' | 'conversation', id: number | string, reason: string) => {
    console.log('Flagging content:', { type, id, reason });
    addToast('Content has been flagged for review', 'success');
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    console.log('🚗 Selecting vehicle:', vehicle.id, vehicle.make, vehicle.model);
    setSelectedVehicle(vehicle);
    navigate(View.DETAIL);
  };

  // Initialize data loading
  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(false);
        
        try {
            console.log("Loading initial data in background...");
            
            // Lazy load services
            const [vehicleService, userService, vehicleDataService] = await Promise.all([
                import('./services/vehicleService'),
                import('./services/userService'),
                import('./services/vehicleDataService')
            ]);
            
            // Load critical data with timeout protection
            const [vehiclesData, usersData] = await Promise.all([
                withLoadingTimeout(LOADING_OPERATIONS.VEHICLES, vehicleService.getVehicles(), 10000),
                withLoadingTimeout(LOADING_OPERATIONS.USERS, userService.getUsers(), 10000)
            ]);
            
            console.log("Successfully loaded critical data:", { vehicles: vehiclesData.length, users: usersData.length });
            setVehicles(vehiclesData);
            setUsers(usersData);
            
            // Load non-critical data in background
            vehicleDataService.getVehicleData().then(vehicleDataFromAPI => {
                setVehicleData(vehicleDataFromAPI);
                loadingManager.completeLoading(LOADING_OPERATIONS.VEHICLE_DATA);
            }).catch(error => {
                console.warn("Failed to load vehicle data:", error);
                loadingManager.failLoading(LOADING_OPERATIONS.VEHICLE_DATA, error.message);
            });
            
        } catch (error) {
            console.error("Failed to load initial data:", error);
            console.warn("Using fallback data due to loading error");
        }
    };

    loadInitialData();
  }, [setVehicles, setUsers, setIsLoading, setVehicleData]);

  // Load user session
  useEffect(() => {
    console.log('🔄 Initial load effect running');
    
    const localUserJson = localStorage.getItem('reRideCurrentUser');
    const sessionUserJson = sessionStorage.getItem('currentUser');
    const userJson = localUserJson || sessionUserJson;
    if (userJson) {
      const user = JSON.parse(userJson);
      console.log('✅ Restored user from storage:', user.email, 'Role:', user.role);
      setCurrentUser(user);
      
      // Auto-navigate to appropriate dashboard based on user role
      if (user.role === 'seller' && currentView === View.HOME) {
        console.log('🔄 Auto-navigating seller to dashboard');
        navigate(View.SELLER_DASHBOARD);
      } else if (user.role === 'customer' && currentView === View.HOME) {
        console.log('🔄 Auto-navigating customer to home');
        navigate(View.HOME);
      } else if (user.role === 'admin' && currentView === View.HOME) {
        console.log('🔄 Auto-navigating admin to panel');
        navigate(View.ADMIN_PANEL);
      }
      
      if (!localUserJson && sessionUserJson) {
        localStorage.setItem('reRideCurrentUser', sessionUserJson);
        console.log('🔄 Migrated session to localStorage');
      }
    } else {
      console.log('ℹ️ No saved user session found');
    }
    
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    
    const loadedConversations = getConversations();
    setConversations(loadedConversations.map(c => ({ 
      ...c, 
      isReadByCustomer: c.isReadByCustomer ?? true, 
      messages: (c.messages || []).map(m => ({ ...m, isRead: m.isRead ?? true })), 
      isFlagged: c.isFlagged || false, 
      flagReason: c.flagReason || undefined, 
      flaggedAt: c.flaggedAt || undefined 
    })));
  }, [setCurrentUser, setWishlist, setConversations, currentView, navigate]);

  // Load ratings
  useEffect(() => {
    setRatings(getRatings());
    setSellerRatings(getSellerRatings());
  }, [setRatings, setSellerRatings]);

  // Save data when it changes
   useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveSettings(platformSettings);
  }, [platformSettings]);

  useEffect(() => {
    saveAuditLog(auditLog);
  }, [auditLog]);

  useEffect(() => {
    saveFaqs(faqItems);
  }, [faqItems]);
  
  useEffect(() => {
    saveSupportTickets(supportTickets);
  }, [supportTickets]);

  useEffect(() => {
    try {
      localStorage.setItem('reRideNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save notifications", error); 
    }
  }, [notifications]);

  // Handle seller profile URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sellerEmail = urlParams.get('seller');
    if (sellerEmail && users.length > 0) {
      const sellerUser = users.find(u => u.email === sellerEmail && u.role === 'seller');
      if (sellerUser) {
        setPublicSellerProfile(sellerUser);
        navigate(View.SELLER_PROFILE);
    } else {
        addToast('Seller profile not found.', 'error');
        window.history.pushState({}, '', window.location.pathname);
      }
    }
  }, [addToast, users, setPublicSellerProfile, navigate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { 
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') { 
        event.preventDefault(); 
        setIsCommandPaletteOpen(prev => !prev); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  const renderContent = () => {
    if (isLoading && currentView === View.HOME) return <LoadingSpinner />;
    
    const authViews = [View.LOGIN_PORTAL, View.CUSTOMER_LOGIN, View.SELLER_LOGIN, View.ADMIN_LOGIN, View.FORGOT_PASSWORD];
    if (authViews.includes(currentView)) {
      const AuthWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gradient-main p-4">
          {children}
        </div>
      );
      
      switch (currentView) {
        case View.LOGIN_PORTAL: 
          return <AuthWrapper><LoginPortal onNavigate={navigate} /></AuthWrapper>;
        case View.CUSTOMER_LOGIN: 
          return <AuthWrapper><CustomerLogin onLogin={(user) => { 
            setCurrentUser(user); 
            const userJson = JSON.stringify(user);
            localStorage.setItem('reRideCurrentUser', userJson);
            sessionStorage.setItem('currentUser', userJson);
            navigate(View.HOME); 
          }} onRegister={(user) => { 
            setUsers(prev => [...prev, user]); 
            setCurrentUser(user); 
            const userJson = JSON.stringify(user);
            localStorage.setItem('reRideCurrentUser', userJson);
            sessionStorage.setItem('currentUser', userJson);
            navigate(View.HOME); 
            addToast('Registration successful!', 'success'); 
          }} onNavigate={navigate} onForgotPassword={() => { setForgotPasswordRole('customer'); navigate(View.FORGOT_PASSWORD); }} /></AuthWrapper>;
        case View.SELLER_LOGIN: 
          return <AuthWrapper><Login onLogin={(user) => { 
            setCurrentUser(user); 
            const userJson = JSON.stringify(user);
            localStorage.setItem('reRideCurrentUser', userJson);
            sessionStorage.setItem('currentUser', userJson);
            navigate(View.SELLER_DASHBOARD); 
          }} onRegister={(user) => { 
            setUsers(prev => [...prev, user]); 
            setCurrentUser(user); 
            const userJson = JSON.stringify(user);
            localStorage.setItem('reRideCurrentUser', userJson);
            sessionStorage.setItem('currentUser', userJson);
            navigate(View.SELLER_DASHBOARD); 
            addToast('Registration successful!', 'success'); 
          }} onNavigate={navigate} onForgotPassword={() => { setForgotPasswordRole('seller'); navigate(View.FORGOT_PASSWORD); }}/></AuthWrapper>;
        case View.ADMIN_LOGIN: 
          return <AuthWrapper><AdminLogin onLogin={(user) => { 
            setCurrentUser(user); 
            const userJson = JSON.stringify(user);
            localStorage.setItem('reRideCurrentUser', userJson);
            sessionStorage.setItem('currentUser', userJson);
            navigate(View.ADMIN_PANEL); 
          }} onNavigate={navigate} /></AuthWrapper>;
        case View.FORGOT_PASSWORD: 
          return <AuthWrapper><ForgotPassword onResetRequest={(email) => { console.log(`Password reset for ${email} as a ${forgotPasswordRole}.`); }} onBack={() => navigate(forgotPasswordRole === 'customer' ? View.CUSTOMER_LOGIN : View.SELLER_LOGIN)}/></AuthWrapper>;
      }
    }
    
    switch (currentView) {
      case View.SUPPORT: 
        return <SupportPage currentUser={currentUser} onSubmitTicket={(ticketData) => { 
          const newTicket = { ...ticketData, id: Date.now(), status: 'Open' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), replies: [] };
          setSupportTickets(prev => [newTicket, ...prev]);
          addToast('Support ticket submitted!', 'success');
          navigate(View.HOME);
        }} />;
      case View.FAQ: 
        return <FAQPage faqItems={faqItems} />;
      case View.PRICING: 
        return <PricingPage currentUser={currentUser} onSelectPlan={async (planId) => {
      if (!currentUser || currentUser.role !== 'seller') return;
      const { PLAN_DETAILS } = await import('./constants');
      const planDetails = PLAN_DETAILS[planId];
      if (planId === 'free') {
          const updatedUser = { ...currentUser, subscriptionPlan: planId };
            const userService = await import('./services/userService');
          const savedUser = await userService.updateUser(updatedUser);
            setUsers(prev => prev.map(u => u.email === currentUser.email ? savedUser : u));
          setCurrentUser(savedUser);
          const userJson = JSON.stringify(savedUser);
          sessionStorage.setItem('currentUser', userJson);
          localStorage.setItem('reRideCurrentUser', userJson);
          addToast(`Successfully switched to the ${planDetails.name} plan!`, 'success');
            navigate(View.SELLER_DASHBOARD);
          }
        }} />;
      case View.SELLER_PROFILE: 
        return publicSellerProfile && <SellerProfilePage 
          seller={users.find(u => u.email === publicSellerProfile.email)!} 
          vehicles={vehicles.filter(v => v.sellerEmail === publicSellerProfile.email && v.status === 'published')} 
          onSelectVehicle={handleSelectVehicle} 
          comparisonList={comparisonList} 
          onToggleCompare={handleToggleCompare} 
          wishlist={wishlist} 
          onToggleWishlist={handleToggleWishlist} 
          onBack={() => navigate(View.HOME)} 
          onViewSellerProfile={handleViewSellerProfile} 
        />;
      case View.DETAIL: 
        return selectedVehicle && <VehicleDetail 
          vehicle={selectedVehicle} 
          onBack={() => navigate(View.USED_CARS)} 
          comparisonList={comparisonList} 
          onToggleCompare={handleToggleCompare} 
          onAddSellerRating={handleAddSellerRating} 
          wishlist={wishlist} 
          onToggleWishlist={handleToggleWishlist} 
          currentUser={currentUser} 
          onFlagContent={handleFlagContent} 
          users={users} 
          onViewSellerProfile={handleViewSellerProfile} 
          onStartChat={() => {}} 
          recommendations={recommendations} 
          onSelectVehicle={handleSelectVehicle} 
        />;
      case View.SELLER_DASHBOARD: {
        if (!currentUser || currentUser.role !== 'seller') {
          navigate(View.HOME);
          return null;
        }
        return <Dashboard 
          seller={users.find(u => u.email === currentUser.email)!} 
          sellerVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email)} 
          reportedVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email && v.isFlagged)} 
          onAddVehicle={handleAddVehicle} 
          onAddMultipleVehicles={handleAddMultipleVehicles} 
          onUpdateVehicle={handleUpdateVehicle} 
          onDeleteVehicle={handleDeleteVehicle} 
          onMarkAsSold={handleMarkAsSold} 
          conversations={conversations.filter(c => c.sellerId === currentUser.email)} 
          onSellerSendMessage={() => {}} 
          onMarkConversationAsReadBySeller={() => {}} 
          typingStatus={null} 
          onUserTyping={() => {}} 
          onMarkMessagesAsRead={() => {}} 
          onUpdateSellerProfile={() => {}} 
          vehicleData={vehicleData} 
          onFeatureListing={handleFeatureListing} 
          onRequestCertification={handleRequestCertification} 
          onNavigate={navigate} 
          allVehicles={vehicles.filter(v => v.status === 'published')} 
          onOfferResponse={() => {}} 
        />;
      }
      case View.ADMIN_PANEL: 
        return currentUser?.role === 'admin' ? <AdminPanel 
          users={users} 
          currentUser={currentUser} 
          vehicles={vehicles} 
          conversations={conversations} 
          onToggleUserStatus={() => {}} 
          onDeleteUser={() => {}} 
          onAdminUpdateUser={() => {}} 
          onUpdateUserPlan={() => {}} 
          onUpdateVehicle={() => {}} 
          onDeleteVehicle={() => {}} 
          onToggleVehicleStatus={() => {}} 
          onToggleVehicleFeature={() => {}} 
          onResolveFlag={() => {}} 
          platformSettings={platformSettings} 
          onUpdateSettings={setPlatformSettings} 
          onSendBroadcast={() => {}} 
          auditLog={auditLog} 
          onExportUsers={() => {}} 
          onExportVehicles={() => {}} 
          onExportSales={() => {}} 
          vehicleData={vehicleData} 
          onUpdateVehicleData={setVehicleData} 
          onToggleVerifiedStatus={() => {}} 
          supportTickets={supportTickets} 
          onUpdateSupportTicket={() => {}} 
          faqItems={faqItems} 
          onAddFaq={() => {}} 
          onUpdateFaq={() => {}} 
          onDeleteFaq={() => {}} 
          onCertificationApproval={() => {}} 
        /> : <LoadingSpinner />;
      case View.COMPARISON: 
        return <Comparison 
          vehicles={vehicles.filter(v => comparisonList.includes(v.id))} 
          onBack={() => navigate(View.USED_CARS)} 
          onToggleCompare={handleToggleCompare} 
        />;
      case View.PROFILE: 
        return currentUser && <Profile 
          currentUser={currentUser} 
          onUpdateProfile={() => {}} 
          onUpdatePassword={() => Promise.resolve(false)} 
        />;
      case View.INBOX: 
        return currentUser && <CustomerInbox 
          conversations={conversations.filter(c => c.customerId === currentUser.email)} 
          onSendMessage={() => {}} 
          onMarkAsRead={() => {}} 
          users={users} 
          typingStatus={null} 
          onUserTyping={() => {}} 
          onMarkMessagesAsRead={() => {}} 
          onFlagContent={handleFlagContent} 
          onOfferResponse={() => {}} 
        />;
      case View.BUYER_DASHBOARD: 
        return currentUser?.role === 'customer' ? <BuyerDashboard 
          currentUser={currentUser} 
          vehicles={vehicles.filter(v => v.status === 'published')} 
          wishlist={wishlist} 
          conversations={conversations.filter(c => c.customerId === currentUser.email)} 
          onNavigate={navigate} 
          onSelectVehicle={handleSelectVehicle} 
          onToggleWishlist={handleToggleWishlist} 
          onToggleCompare={handleToggleCompare} 
          comparisonList={comparisonList} 
          onViewSellerProfile={handleViewSellerProfile} 
        /> : <LoadingSpinner />;
      case View.USED_CARS: 
        return <VehicleList 
          vehicles={vehicles.filter(v => v.status === 'published')} 
          isLoading={isLoading} 
          onSelectVehicle={handleSelectVehicle} 
          comparisonList={comparisonList} 
          onToggleCompare={handleToggleCompare} 
          onClearCompare={handleClearCompare} 
          wishlist={wishlist} 
          onToggleWishlist={handleToggleWishlist} 
          categoryTitle="All Used Cars" 
          initialCategory={selectedCategory} 
          initialSearchQuery={initialSearchQuery} 
          onViewSellerProfile={handleViewSellerProfile} 
          userLocation={userLocation} 
        />;
      case View.NEW_CARS: 
        return <NewCars />;
      case View.DEALER_PROFILES: 
        return <DealerProfiles 
          sellers={users.filter(u => u.role === 'seller')} 
          onViewProfile={handleViewSellerProfile} 
        />;
      case View.WISHLIST: 
        return <VehicleList 
          vehicles={vehicles.filter(v => wishlist.includes(v.id))} 
          isLoading={isLoading} 
          onSelectVehicle={handleSelectVehicle} 
          comparisonList={comparisonList} 
          onToggleCompare={handleToggleCompare} 
          onClearCompare={handleClearCompare} 
          wishlist={wishlist} 
          onToggleWishlist={handleToggleWishlist} 
          categoryTitle="My Wishlist" 
          isWishlistMode={true} 
          onViewSellerProfile={handleViewSellerProfile} 
          userLocation={userLocation} 
        />;
      case View.CITY_LANDING: 
        return selectedCity && <CityLandingPage 
          city={selectedCity} 
          vehicles={vehicles.filter(v => v.status === 'published')} 
          onSelectVehicle={handleSelectVehicle} 
          onToggleWishlist={handleToggleWishlist} 
          onToggleCompare={handleToggleCompare} 
          wishlist={wishlist} 
          comparisonList={comparisonList} 
          onViewSellerProfile={handleViewSellerProfile} 
        />;
      case View.HOME:
      default: 
        return <Home 
          onSearch={(query) => { setInitialSearchQuery(query); navigate(View.USED_CARS); }} 
          onSelectCategory={(category) => { setSelectedCategory(category); navigate(View.USED_CARS); }} 
          featuredVehicles={vehicles.filter(v => v.isFeatured && v.status === 'published').slice(0, 4)} 
          onSelectVehicle={handleSelectVehicle} 
          onToggleCompare={handleToggleCompare} 
          comparisonList={comparisonList} 
          onToggleWishlist={handleToggleWishlist} 
          wishlist={wishlist} 
          onViewSellerProfile={handleViewSellerProfile} 
          recommendations={recommendations} 
          allVehicles={vehicles.filter(v => v.status === 'published')} 
          onNavigate={navigate} 
        />;
    }
  };

  const inboxCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer') return 0;
    return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length;
  }, [conversations, currentUser]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onNavigate={navigate} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        compareCount={comparisonList.length} 
        wishlistCount={wishlist.length} 
        inboxCount={inboxCount} 
        isHomePage={currentView === View.HOME} 
        notifications={notifications.filter(n => n.recipientEmail === currentUser?.email)} 
        onNotificationClick={() => {}} 
        onMarkNotificationsAsRead={() => {}} 
        onMarkAllNotificationsAsRead={() => {}} 
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} 
        userLocation={userLocation} 
        onLocationChange={setUserLocation} 
        addToast={addToast} 
      />
      <main className="flex-grow pt-16">
        <Suspense fallback={<LoadingSpinner />}>
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
          typingStatus={null} 
          onUserTyping={() => {}} 
          onMarkMessagesAsRead={() => {}} 
          onFlagContent={handleFlagContent} 
          onOfferResponse={() => {}} 
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Footer onNavigate={navigate} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onNavigate={(view) => { navigate(view); setIsCommandPaletteOpen(false); }} 
        currentUser={currentUser} 
        onLogout={() => { handleLogout(); setIsCommandPaletteOpen(false); }} 
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;