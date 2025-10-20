import React, { Suspense } from 'react';
import { AppProvider, useApp } from './components/AppProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import { ChatWidget } from './components/ChatWidget';
import { View as ViewEnum } from './types';

// Simple loading component
const LoadingSpinner: React.FC = () => (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-orange-500"></div>
            <span className="text-xl font-semibold text-gray-600">Loading...</span>
        </div>
    </div>
);

// Lazy-loaded components
const Home = React.lazy(() => import('./components/Home'));
const VehicleList = React.lazy(() => import('./components/VehicleList'));
const VehicleDetail = React.lazy(() => import('./components/VehicleDetail'));
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

const AppContent: React.FC = () => {
  const { 
    currentView, 
    navigate, 
    currentUser, 
    handleLogout, 
    comparisonList, 
    wishlist, 
    notifications,
    userLocation,
    setUserLocation,
    addToast,
    setIsCommandPaletteOpen,
    vehicles,
    setSelectedVehicle,
    setSelectedCategory,
    recommendations,
    selectedVehicle,
    isLoading,
    conversations,
    toasts,
    activeChat,
    users,
    platformSettings,
    auditLog,
    vehicleData,
    faqItems,
    supportTickets,
    forgotPasswordRole,
    selectedCategory: currentCategory,
    initialSearchQuery,
    selectedCity,
    publicSellerProfile,
    typingStatus,
    removeToast,
    setActiveChat,
    isCommandPaletteOpen,
    setCurrentUser,
    setUsers,
    setVehicles,
    setWishlist,
    setComparisonList,
    setPlatformSettings,
    setVehicleData,
    setSupportTickets,
    setFaqItems,
    setAuditLog,
    setForgotPasswordRole,
    setPublicSellerProfile: setPublicProfile,
    setInitialSearchQuery
  } = useApp();

  const renderView = () => {
    switch (currentView) {
      case ViewEnum.HOME:
        return (
          <Home 
            onSearch={(query) => {
              setInitialSearchQuery(query);
              navigate(ViewEnum.USED_CARS);
            }}
            onSelectCategory={setSelectedCategory}
            featuredVehicles={vehicles.slice(0, 6)}
            onSelectVehicle={setSelectedVehicle}
            onToggleCompare={(id) => {
              setComparisonList(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            comparisonList={comparisonList}
            onToggleWishlist={(id) => {
              setWishlist(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            wishlist={wishlist}
            onViewSellerProfile={(sellerEmail) => {
              setPublicProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
            recommendations={recommendations}
            allVehicles={vehicles}
            onNavigate={navigate}
          />
        );

      case ViewEnum.USED_CARS:
        return (
          <VehicleList
            vehicles={vehicles}
            onSelectVehicle={setSelectedVehicle}
            isLoading={isLoading}
            comparisonList={comparisonList}
            onToggleCompare={(id) => {
              setComparisonList(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            onClearCompare={() => setComparisonList([])}
            wishlist={wishlist}
            onToggleWishlist={(id) => {
              setWishlist(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            categoryTitle="Used Cars"
            initialCategory={currentCategory}
            initialSearchQuery={initialSearchQuery}
            onViewSellerProfile={(sellerEmail) => {
              setPublicProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
            userLocation={userLocation}
          />
        );

      case ViewEnum.DETAIL:
        return selectedVehicle ? (
          <VehicleDetail
            vehicle={selectedVehicle}
            onBack={() => navigate(ViewEnum.USED_CARS)}
            onToggleCompare={(id: number) => {
              setComparisonList(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            onToggleWishlist={(id: number) => {
              setWishlist(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            onViewSellerProfile={(sellerEmail: string) => {
              setPublicProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
            currentUser={currentUser}
          />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Vehicle Not Found</h2>
              <button 
                onClick={() => navigate(ViewEnum.USED_CARS)}
                className="btn-brand-primary"
              >
                Browse Vehicles
              </button>
            </div>
          </div>
        );

      case ViewEnum.NEW_CARS:
        return (
          <NewCars />
        );

      case ViewEnum.COMPARISON:
        return (
          <Comparison />
        );

      case ViewEnum.WISHLIST:
        return (
          <VehicleList
            vehicles={vehicles.filter(v => wishlist.includes(v.id))}
            onSelectVehicle={setSelectedVehicle}
            isLoading={isLoading}
            comparisonList={comparisonList}
            onToggleCompare={(id) => {
              setComparisonList(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            onClearCompare={() => setComparisonList([])}
            wishlist={wishlist}
            onToggleWishlist={(id) => {
              setWishlist(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            categoryTitle="My Wishlist"
            isWishlistMode={true}
            onViewSellerProfile={(sellerEmail) => {
              setPublicProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
            userLocation={userLocation}
          />
        );

      case ViewEnum.SELLER_DASHBOARD:
        return currentUser?.role === 'seller' ? (
          <Dashboard
            seller={currentUser}
            sellerVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email)}
            reportedVehicles={[]}
            onAddVehicle={() => {}}
            onAddMultipleVehicles={() => {}}
            onUpdateVehicle={() => {}}
            onDeleteVehicle={() => {}}
            onMarkAsSold={() => {}}
            conversations={conversations}
            onSellerSendMessage={() => {}}
            onMarkConversationAsReadBySeller={() => {}}
            typingStatus={typingStatus}
            onUserTyping={() => {}}
            onMarkMessagesAsRead={() => {}}
            onUpdateSellerProfile={() => {}}
            vehicleData={vehicleData}
            onFeatureListing={() => {}}
            onRequestCertification={() => {}}
            onNavigate={navigate}
            onTestDriveResponse={() => {}}
            allVehicles={vehicles}
            onOfferResponse={() => {}}
          />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Access Denied</h2>
              <p className="text-gray-500 mb-4">You need to be logged in as a seller to access this page.</p>
              <button 
                onClick={() => navigate(ViewEnum.SELLER_LOGIN)}
                className="btn-brand-primary"
              >
                Login as Seller
              </button>
            </div>
          </div>
        );

      case ViewEnum.BUYER_DASHBOARD:
        return currentUser?.role === 'customer' ? (
          <BuyerDashboard
            currentUser={currentUser}
            vehicles={vehicles}
            wishlist={wishlist}
            conversations={conversations}
            onNavigate={navigate}
            onSelectVehicle={setSelectedVehicle}
            onToggleWishlist={(id) => {
              setWishlist(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            onToggleCompare={(id) => {
              setComparisonList(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
            comparisonList={comparisonList}
            onViewSellerProfile={(sellerEmail) => {
              setPublicProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
          />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Access Denied</h2>
              <p className="text-gray-500 mb-4">You need to be logged in as a customer to access this page.</p>
              <button 
                onClick={() => navigate(ViewEnum.CUSTOMER_LOGIN)}
                className="btn-brand-primary"
              >
                Login as Customer
              </button>
            </div>
          </div>
        );

      case ViewEnum.ADMIN_PANEL:
        return currentUser?.role === 'admin' ? (
          <AdminPanel />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Access Denied</h2>
              <p className="text-gray-500 mb-4">You need to be logged in as an admin to access this page.</p>
              <button 
                onClick={() => navigate(ViewEnum.ADMIN_LOGIN)}
                className="btn-brand-primary"
              >
                Login as Admin
              </button>
            </div>
          </div>
        );

      case ViewEnum.PROFILE:
        return currentUser ? (
          <Profile />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Please Login</h2>
              <p className="text-gray-500 mb-4">You need to be logged in to view your profile.</p>
              <button 
                onClick={() => navigate(ViewEnum.LOGIN_PORTAL)}
                className="btn-brand-primary"
              >
                Login
              </button>
            </div>
          </div>
        );

      case ViewEnum.INBOX:
        return currentUser ? (
          <CustomerInbox />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Please Login</h2>
              <p className="text-gray-500 mb-4">You need to be logged in to view your inbox.</p>
              <button 
                onClick={() => navigate(ViewEnum.LOGIN_PORTAL)}
                className="btn-brand-primary"
              >
                Login
              </button>
            </div>
          </div>
        );

      case ViewEnum.SELLER_PROFILE:
        return publicSellerProfile ? (
          <SellerProfilePage />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Seller Not Found</h2>
              <button 
                onClick={() => navigate(ViewEnum.USED_CARS)}
                className="btn-brand-primary"
              >
                Browse Vehicles
              </button>
            </div>
          </div>
        );

      case ViewEnum.DEALER_PROFILES:
        return (
          <DealerProfiles />
        );

      case ViewEnum.PRICING:
        return (
          <PricingPage />
        );

      case ViewEnum.SUPPORT:
        return (
          <SupportPage />
        );

      case ViewEnum.FAQ:
        return (
          <FAQPage />
        );

      case ViewEnum.CITY_LANDING:
        return (
          <CityLandingPage />
        );

      case ViewEnum.LOGIN_PORTAL:
        return (
          <LoginPortal />
        );

      case ViewEnum.CUSTOMER_LOGIN:
        return (
          <CustomerLogin />
        );

      case ViewEnum.SELLER_LOGIN:
        return (
          <Login />
        );

      case ViewEnum.ADMIN_LOGIN:
        return (
          <AdminLogin />
        );

      case ViewEnum.FORGOT_PASSWORD:
        return (
          <ForgotPassword />
        );

      default:
        return (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Page Not Found</h2>
              <p className="text-gray-500 mb-4">The page you're looking for doesn't exist.</p>
              <button 
                onClick={() => navigate(ViewEnum.HOME)}
                className="btn-brand-primary"
              >
                Go Home
              </button>
            </div>
          </div>
        );
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Handle notification click
    console.log('Notification clicked:', notification);
  };

  const handleMarkNotificationsAsRead = (ids: number[]) => {
    // Handle marking notifications as read
    console.log('Mark notifications as read:', ids);
  };

  const handleMarkAllNotificationsAsRead = () => {
    // Handle marking all notifications as read
    console.log('Mark all notifications as read');
  };

  const handleOpenCommandPalette = () => {
    setIsCommandPaletteOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        compareCount={comparisonList.length}
        wishlistCount={wishlist.length}
        inboxCount={conversations.filter(c => !c.isReadByCustomer).length}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onOpenCommandPalette={handleOpenCommandPalette}
        userLocation={userLocation}
        onLocationChange={setUserLocation}
        addToast={addToast}
      />
      <main className="min-h-[calc(100vh-140px)]">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {renderView()}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer onNavigate={navigate} />
      
      {/* Global Components */}
      <ToastContainer />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {currentUser && (
        <ChatWidget />
      )}
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
