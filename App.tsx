import React, { Suspense } from 'react';
import { AppProvider, useApp } from './components/AppProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
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

// Lazy load only the essential components
const Home = React.lazy(() => import('./components/Home'));

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
    setPublicSellerProfile
  } = useApp();

  const renderView = () => {
    switch (currentView) {
      case ViewEnum.HOME:
        return (
          <Home 
            onSearch={(query) => {
              // Handle search
              console.log('Search:', query);
            }}
            onSelectCategory={setSelectedCategory}
            featuredVehicles={vehicles.slice(0, 6)} // First 6 vehicles as featured
            onSelectVehicle={setSelectedVehicle}
            onToggleCompare={(id) => {
              // Toggle compare functionality
              console.log('Toggle compare:', id);
            }}
            comparisonList={comparisonList}
            onToggleWishlist={(id) => {
              // Toggle wishlist functionality
              console.log('Toggle wishlist:', id);
            }}
            wishlist={wishlist}
            onViewSellerProfile={(sellerEmail) => {
              setPublicSellerProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
            recommendations={recommendations}
            allVehicles={vehicles}
            onNavigate={navigate}
          />
        );
      default:
        return (
          <Home 
            onSearch={(query) => {
              console.log('Search:', query);
            }}
            onSelectCategory={setSelectedCategory}
            featuredVehicles={vehicles.slice(0, 6)}
            onSelectVehicle={setSelectedVehicle}
            onToggleCompare={(id) => {
              console.log('Toggle compare:', id);
            }}
            comparisonList={comparisonList}
            onToggleWishlist={(id) => {
              console.log('Toggle wishlist:', id);
            }}
            wishlist={wishlist}
            onViewSellerProfile={(sellerEmail) => {
              setPublicSellerProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }}
            recommendations={recommendations}
            allVehicles={vehicles}
            onNavigate={navigate}
          />
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
        inboxCount={0} // You may want to calculate this from conversations
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
