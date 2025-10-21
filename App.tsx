import React, { Suspense, useEffect } from 'react';
import { AppProvider, useApp } from './components/AppProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import MobileDashboard from './components/MobileDashboard';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import { ChatWidget } from './components/ChatWidget';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import useIsMobileApp from './hooks/useIsMobileApp';
import { View as ViewEnum, Vehicle } from './types';

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
  // Detect if running as mobile app (standalone/installed PWA)
  const { isMobileApp } = useIsMobileApp();
  
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
    setConversations,
    toasts,
    activeChat,
    users,
    vehicleData,
    faqItems,
    platformSettings,
    auditLog,
    supportTickets,
    selectedCategory: currentCategory,
    initialSearchQuery,
    selectedCity,
    publicSellerProfile,
    typingStatus,
    removeToast,
    setActiveChat,
    isCommandPaletteOpen,
    setWishlist,
    setComparisonList,
    setPublicSellerProfile: setPublicProfile,
    setInitialSearchQuery,
    setForgotPasswordRole,
    addSellerRating,
    sendMessage,
    markAsRead,
    toggleTyping,
    flagContent,
    updateUser,
    deleteUser,
    updateVehicle,
    deleteVehicle,
    selectVehicle,
    toggleWishlist,
    toggleCompare,
    handleLogin,
    handleRegister,
    onAdminUpdateUser,
    onUpdateUserPlan,
    onToggleUserStatus,
    onToggleVehicleStatus,
    onToggleVehicleFeature,
    onResolveFlag,
    onUpdateSettings,
    onSendBroadcast,
    onExportUsers,
    onExportVehicles,
    onExportSales,
    onUpdateVehicleData,
    onToggleVerifiedStatus,
    onUpdateSupportTicket,
    onAddFaq,
    onUpdateFaq,
    onDeleteFaq,
    onCertificationApproval,
    onOfferResponse,
  } = useApp();
  
  // Redirect logged-in users to their appropriate dashboard
  useEffect(() => {
    if (currentUser && currentView === ViewEnum.HOME) {
      console.log('🔄 User is logged in, redirecting to appropriate dashboard:', currentUser.role);
      switch (currentUser.role) {
        case 'customer':
          navigate(ViewEnum.BUYER_DASHBOARD);
          break;
        case 'seller':
          navigate(ViewEnum.SELLER_DASHBOARD);
          break;
        case 'admin':
          navigate(ViewEnum.ADMIN_PANEL);
          break;
        default:
          // Keep on home page for other roles
          break;
      }
    }
  }, [currentUser, currentView, navigate]);

  // Get page title based on current view
  const getPageTitle = () => {
    switch (currentView) {
      case ViewEnum.HOME: return 'ReRide';
      case ViewEnum.USED_CARS: return 'Browse Cars';
      case ViewEnum.WISHLIST: return 'My Wishlist';
      case ViewEnum.INBOX: return 'Messages';
      case ViewEnum.SELLER_DASHBOARD: return 'Dashboard';
      case ViewEnum.BUYER_DASHBOARD: return 'My Account';
      case ViewEnum.PROFILE: return 'Profile';
      case ViewEnum.DETAIL: return selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make}` : 'Car Details';
      default: return 'ReRide';
    }
  };

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
            onSelectVehicle={selectVehicle}
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
            onSelectVehicle={selectVehicle}
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
            currentUser={currentUser}
            onSaveSearch={(search) => {
              addToast(`Search "${search.name}" saved successfully!`, 'success');
            }}
          />
        );

      case ViewEnum.DETAIL:
        // State recovery mechanism - try to recover vehicle from sessionStorage if selectedVehicle is null
        let vehicleToShow = selectedVehicle;
        if (!vehicleToShow) {
          try {
            const storedVehicle = sessionStorage.getItem('selectedVehicle');
            if (storedVehicle) {
              vehicleToShow = JSON.parse(storedVehicle);
              console.log('🔧 Recovered vehicle from sessionStorage:', vehicleToShow?.id, vehicleToShow?.make, vehicleToShow?.model);
              // Update the state with recovered vehicle
              setSelectedVehicle(vehicleToShow);
            }
          } catch (error) {
            console.warn('🔧 Failed to recover vehicle from sessionStorage:', error);
          }
        }
        
        return vehicleToShow ? (
          <VehicleDetail
            vehicle={vehicleToShow}
            onBack={() => navigate(ViewEnum.USED_CARS)}
            comparisonList={comparisonList}
            onToggleCompare={toggleCompare}
            onAddSellerRating={addSellerRating}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            currentUser={currentUser}
            onFlagContent={(type, id, _reason) => flagContent(type, id)}
            users={users}
            onViewSellerProfile={(sellerEmail: string) => {
              const seller = users.find(u => u.email === sellerEmail);
              if (seller) {
                setPublicProfile(seller);
                navigate(ViewEnum.SELLER_PROFILE);
              }
            }}
            onStartChat={(vehicle) => {
              // Start chat with seller
              if (!currentUser) {
                addToast('Please login to start a chat', 'info');
                navigate(ViewEnum.LOGIN_PORTAL);
                return;
              }
              
              // Find or create conversation
              let conversation = conversations.find(c => 
                c.vehicleId === vehicle.id && 
                c.customerId === currentUser.email
              );
              
              if (!conversation) {
                // Create new conversation
                const newConversation = {
                  id: `conv_${Date.now()}`,
                  customerId: currentUser.email,
                  customerName: currentUser.name,
                  sellerId: vehicle.sellerEmail,
                  vehicleId: vehicle.id,
                  vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                  vehiclePrice: vehicle.price,
                  messages: [],
                  lastMessageAt: new Date().toISOString(),
                  isReadBySeller: false,
                  isReadByCustomer: true,
                  isFlagged: false
                };
                
                // Add to conversations
                setConversations([...conversations, newConversation]);
                conversation = newConversation;
              }
              
              // Set active chat to open the chat widget
              setActiveChat(conversation);
              addToast('Chat started with seller', 'success');
            }}
            recommendations={recommendations}
            onSelectVehicle={selectVehicle}
          />
        ) : (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Vehicle Not Found</h2>
              <p className="text-gray-500 mb-4">Please select a vehicle to view details.</p>
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
          <Comparison 
            vehicles={vehicles.filter(v => comparisonList.includes(v.id))}
            onBack={() => navigate(ViewEnum.USED_CARS)}
            onToggleCompare={(id: number) => {
              setComparisonList(prev => 
                prev.includes(id) 
                  ? prev.filter(vId => vId !== id)
                  : [...prev, id]
              );
            }}
          />
        );

      case ViewEnum.WISHLIST:
        return (
          <VehicleList
            vehicles={vehicles.filter(v => wishlist.includes(v.id))}
            onSelectVehicle={selectVehicle}
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
            currentUser={currentUser}
            onSaveSearch={(search) => {
              addToast(`Search "${search.name}" saved successfully!`, 'success');
            }}
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
            onSellerSendMessage={(conversationId, messageText, type, payload) => sendMessage(conversationId, messageText)}
            onMarkConversationAsReadBySeller={(conversationId) => markAsRead(conversationId)}
            typingStatus={typingStatus}
            onUserTyping={(conversationId, userRole) => toggleTyping(conversationId, true)}
            onMarkMessagesAsRead={(conversationId, readerRole) => markAsRead(conversationId)}
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
            onSelectVehicle={selectVehicle}
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
          <AdminPanel 
            users={users}
            currentUser={currentUser}
            vehicles={vehicles}
            conversations={conversations}
            onAdminUpdateUser={onAdminUpdateUser}
            onToggleUserStatus={onToggleUserStatus}
            onDeleteUser={deleteUser}
            onUpdateUserPlan={onUpdateUserPlan}
            onUpdateVehicle={(vehicle: Vehicle) => {
              updateVehicle(vehicle.id, vehicle);
            }}
            onDeleteVehicle={deleteVehicle}
            onToggleVehicleStatus={onToggleVehicleStatus}
            onToggleVehicleFeature={onToggleVehicleFeature}
            onResolveFlag={onResolveFlag}
            platformSettings={platformSettings}
            onUpdateSettings={onUpdateSettings}
            onSendBroadcast={onSendBroadcast}
            auditLog={auditLog}
            onExportUsers={onExportUsers}
            onExportVehicles={onExportVehicles}
            onExportSales={onExportSales}
            onNavigate={navigate}
            vehicleData={vehicleData}
            onUpdateVehicleData={onUpdateVehicleData}
            onToggleVerifiedStatus={onToggleVerifiedStatus}
            supportTickets={supportTickets}
            onUpdateSupportTicket={onUpdateSupportTicket}
            faqItems={faqItems}
            onAddFaq={onAddFaq}
            onUpdateFaq={onUpdateFaq}
            onDeleteFaq={onDeleteFaq}
            onCertificationApproval={onCertificationApproval}
          />
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
          <Profile 
            currentUser={currentUser}
            onUpdateProfile={(details) => {
              if (currentUser) {
                updateUser(currentUser.email, details);
              }
            }}
            onUpdatePassword={async (passwords) => {
              if (currentUser) {
                updateUser(currentUser.email, { password: passwords.new });
                return true;
              }
              return false;
            }}
          />
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
          <CustomerInbox 
            conversations={conversations}
            onSendMessage={(vehicleId, messageText, type, payload) => {
              const conversation = conversations.find(c => c.vehicleId === vehicleId);
              if (conversation) {
                // Handle offer messages with proper structure
                if (type === 'offer' && payload) {
                  setConversations(prev => {
                    const updated = prev.map(conv => 
                      conv.id === conversation.id ? {
                        ...conv,
                        messages: [...conv.messages, {
                          id: Date.now(),
                          sender: 'user' as const,
                          text: messageText,
                          timestamp: new Date().toISOString(),
                          isRead: false,
                          type: 'offer' as const,
                          payload: payload
                        }],
                        lastMessageAt: new Date().toISOString()
                      } : conv
                    );
                    return updated;
                  });
                } else {
                  // Handle regular text messages
                  sendMessage(conversation.id, messageText);
                }
              }
            }}
            onMarkAsRead={markAsRead}
            users={users}
            typingStatus={typingStatus}
            onUserTyping={(conversationId: string, _userRole: 'customer' | 'seller') => {
              toggleTyping(conversationId, true);
            }}
            onMarkMessagesAsRead={markAsRead}
            onFlagContent={(type, id, _reason) => flagContent(type, id)}
            onOfferResponse={(conversationId, messageId, response, counterPrice) => {
              // Handle offer responses using the AppProvider function
              onOfferResponse(conversationId, messageId, response, counterPrice);
            }}
          />
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
          <SellerProfilePage 
            seller={publicSellerProfile}
            vehicles={vehicles.filter(v => v.sellerEmail === publicSellerProfile?.email)}
            onSelectVehicle={selectVehicle}
            comparisonList={comparisonList}
            onToggleCompare={toggleCompare}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onBack={() => navigate(ViewEnum.HOME)}
            onViewSellerProfile={(sellerEmail) => {
              const seller = users.find(u => u.email === sellerEmail);
              if (seller) {
                setPublicProfile(seller);
                navigate(ViewEnum.SELLER_PROFILE);
              }
            }}
          />
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
          <DealerProfiles 
            sellers={users.filter(user => user.role === 'seller')} 
            onViewProfile={(sellerEmail) => {
              setPublicProfile({ email: sellerEmail } as any);
              navigate(ViewEnum.SELLER_PROFILE);
            }} 
          />
        );

      case ViewEnum.PRICING:
        return (
          <PricingPage 
            currentUser={currentUser}
            onSelectPlan={(planId) => {
              // Handle plan selection
              console.log('Selected plan:', planId);
            }}
          />
        );

      case ViewEnum.SUPPORT:
        return (
          <SupportPage 
            currentUser={currentUser}
            onSubmitTicket={(ticket) => {
              // Handle support ticket submission
              console.log('Support ticket submitted:', ticket);
            }}
          />
        );

      case ViewEnum.FAQ:
        return (
          <FAQPage 
            faqItems={faqItems}
          />
        );

      case ViewEnum.CITY_LANDING:
        return (
          <CityLandingPage 
            city={selectedCity}
            vehicles={vehicles}
            onSelectVehicle={selectVehicle}
            onToggleWishlist={toggleWishlist}
            onToggleCompare={toggleCompare}
            wishlist={wishlist}
            comparisonList={comparisonList}
            onViewSellerProfile={(sellerEmail) => {
              const seller = users.find(u => u.email === sellerEmail);
              if (seller) {
                setPublicProfile(seller);
                navigate(ViewEnum.SELLER_PROFILE);
              }
            }}
          />
        );

      case ViewEnum.LOGIN_PORTAL:
        return (
          <LoginPortal onNavigate={navigate} />
        );

      case ViewEnum.CUSTOMER_LOGIN:
        return (
          <CustomerLogin 
            onLogin={handleLogin}
            onRegister={handleRegister}
            onNavigate={navigate}
            onForgotPassword={() => {
              setForgotPasswordRole('customer');
              navigate(ViewEnum.FORGOT_PASSWORD);
            }}
          />
        );

      case ViewEnum.SELLER_LOGIN:
        return (
          <Login 
            onLogin={handleLogin}
            onRegister={handleRegister}
            onNavigate={navigate}
            onForgotPassword={() => {
              setForgotPasswordRole('customer');
              navigate(ViewEnum.FORGOT_PASSWORD);
            }}
          />
        );

      case ViewEnum.ADMIN_LOGIN:
        return (
          <AdminLogin 
            onLogin={handleLogin}
            onNavigate={navigate}
          />
        );

      case ViewEnum.FORGOT_PASSWORD:
        return (
          <ForgotPassword 
            onResetRequest={(email) => {
              // Handle password reset request
              console.log('Password reset requested for:', email);
            }}
            onBack={() => navigate(ViewEnum.LOGIN_PORTAL)}
          />
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
    console.log('Notification clicked:', notification);
    
    // Navigate based on notification type
    if (notification.targetType === 'conversation') {
      // Find the conversation
      const conversation = conversations.find(conv => conv.id === notification.targetId);
      if (conversation) {
        // Set the active chat
        setActiveChat(conversation);
        
        // Navigate to appropriate dashboard based on user role
        if (currentUser?.role === 'seller') {
          navigate(ViewEnum.SELLER_DASHBOARD);
        } else if (currentUser?.role === 'customer') {
          navigate(ViewEnum.BUYER_DASHBOARD);
        }
      }
    }
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

  // Render Mobile App Layout
  if (isMobileApp) {
    // Check if we're on a dashboard view
    const isDashboardView = [
      ViewEnum.SELLER_DASHBOARD, 
      ViewEnum.BUYER_DASHBOARD, 
      ViewEnum.ADMIN_PANEL
    ].includes(currentView);

    if (isDashboardView && currentUser) {
      return (
        <div className="min-h-screen bg-gray-50">
          <MobileDashboard
            currentUser={currentUser}
            userVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email)}
            conversations={conversations}
            onNavigate={navigate}
            onEditVehicle={(vehicle) => {
              // Handle edit vehicle
              console.log('Edit vehicle:', vehicle);
            }}
            onDeleteVehicle={(vehicleId) => {
              // Handle delete vehicle
              console.log('Delete vehicle:', vehicleId);
            }}
            onMarkAsSold={(vehicleId) => {
              // Handle mark as sold
              console.log('Mark as sold:', vehicleId);
            }}
            onFeatureListing={(vehicleId) => {
              // Handle feature listing
              console.log('Feature listing:', vehicleId);
            }}
            onSendMessage={sendMessage}
            onMarkConversationAsRead={markAsRead}
            onOfferResponse={(conversationId, messageId, response, counterPrice) => {
              onOfferResponse(conversationId, messageId.toString(), response, counterPrice);
            }}
            typingStatus={typingStatus}
            onUserTyping={(conversationId, userRole) => {
              toggleTyping(conversationId, true);
            }}
            onMarkMessagesAsRead={(conversationId, readerRole) => {
              markAsRead(conversationId);
            }}
            onFlagContent={flagContent}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader
          onNavigate={navigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          title={getPageTitle()}
          showBack={currentView === ViewEnum.DETAIL}
          onBack={() => navigate(ViewEnum.USED_CARS)}
        />
        
        <main className="mobile-app-content bg-gray-50 mobile-page-transition">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {renderView()}
            </Suspense>
          </ErrorBoundary>
        </main>
        
        <MobileBottomNav
          currentView={currentView}
          onNavigate={navigate}
          currentUser={currentUser}
          wishlistCount={wishlist.length}
          inboxCount={conversations.filter(c => !c.isReadByCustomer).length}
        />
        
        {/* Mobile Global Components */}
        <ToastContainer 
          toasts={toasts} 
          onRemove={removeToast} 
        />
        {currentUser && activeChat && (
          <ChatWidget
            conversation={activeChat}
            currentUserRole={currentUser.role as 'customer' | 'seller'}
            otherUserName={currentUser?.role === 'customer' ? activeChat.sellerId : activeChat.customerName}
            onClose={() => setActiveChat(null)}
            onSendMessage={(messageText, type, payload) => {
              sendMessage(activeChat.id, messageText);
            }}
            typingStatus={typingStatus}
            onUserTyping={(conversationId, userRole) => {
              toggleTyping(conversationId, true);
            }}
            onMarkMessagesAsRead={(conversationId, readerRole) => {
              markAsRead(conversationId);
            }}
            onFlagContent={(type, id, reason) => {
              flagContent(type, id);
            }}
            onOfferResponse={(conversationId, messageId, response, counterPrice) => {
              console.log('🔧 DashboardMessages onOfferResponse called:', { conversationId, messageId, response, counterPrice });
              onOfferResponse(conversationId, messageId, response, counterPrice);
              addToast(`Offer ${response}`, 'success');
            }}
          />
        )}
      </div>
    );
  }
  
  // Render Desktop/Website Layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        compareCount={comparisonList.length}
        wishlistCount={wishlist.length}
        inboxCount={conversations.filter(c => !c.isReadByCustomer).length}
        notifications={notifications.filter(n => n.recipientEmail === currentUser?.email)}
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
      
      {/* Desktop Global Components */}
      <PWAInstallPrompt />
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast} 
      />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {currentUser && activeChat && (
        <ChatWidget
          conversation={activeChat}
          currentUserRole={currentUser.role as 'customer' | 'seller'}
          otherUserName={currentUser?.role === 'customer' ? activeChat.sellerId : activeChat.customerName}
          onClose={() => setActiveChat(null)}
          onSendMessage={(messageText, type, payload) => {
            sendMessage(activeChat.id, messageText);
          }}
          typingStatus={typingStatus}
          onUserTyping={(conversationId, userRole) => {
            toggleTyping(conversationId, true);
          }}
          onMarkMessagesAsRead={(conversationId, readerRole) => {
            markAsRead(conversationId);
          }}
          onFlagContent={(type, id, reason) => {
            flagContent(type, id);
          }}
          onOfferResponse={(conversationId, messageId, response, counterPrice) => {
            console.log('🔧 DashboardMessages onOfferResponse called:', { conversationId, messageId, response, counterPrice });
            onOfferResponse(conversationId, messageId, response, counterPrice);
            addToast(`Offer ${response}`, 'success');
          }}
        />
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
