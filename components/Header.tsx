import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import type { User, Notification, Toast as ToastType } from '../types';
import { View as ViewEnum } from '../types';
import NotificationCenter from './NotificationCenter';
import LocationModal from './LocationModal';

interface HeaderProps {
    onNavigate: (view: ViewEnum) => void;
    currentUser: User | null;
    onLogout: () => void;
    compareCount: number;
    wishlistCount: number;
    inboxCount: number;
    isHomePage?: boolean;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMarkNotificationsAsRead: (ids: number[]) => void;
    onMarkAllNotificationsAsRead: () => void;
    onOpenCommandPalette: () => void;
    userLocation: string;
    onLocationChange: (location: string) => void;
    addToast: (message: string, type: ToastType['type']) => void;
}

const Header: React.FC<HeaderProps> = memo(({
    onNavigate,
    currentUser,
    onLogout,
    compareCount,
    wishlistCount,
    inboxCount,
    notifications,
    onNotificationClick,
    onMarkNotificationsAsRead,
    onMarkAllNotificationsAsRead,
    onOpenCommandPalette,
    userLocation,
    onLocationChange,
    addToast
}) => {
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

    const unreadNotifications = useMemo(() => 
        notifications.filter(n => !n.isRead), [notifications]
    );

    const handleNotificationItemClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkNotificationsAsRead([notification.id]);
        }
        onNotificationClick(notification);
        setIsNotificationsOpen(false);
    };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
            setIsMobileMenuOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleNavigate = (view: ViewEnum) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
        setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
  };
  
  return (
    <>
            <header className="sticky top-0 z-50" id="main-header">
                {/* Top Bar - CarAndBike style */}
                <div className="cb-header-top">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-8">
                        <div className="flex items-center gap-x-6">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(ViewEnum.SUPPORT) }} className="hover:text-gray-300 transition-colors">Support</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(ViewEnum.FAQ) }} className="hover:text-gray-300 transition-colors">FAQ</a>
              </div>
              <div className="flex items-center gap-x-4">
                            <button onClick={() => setIsLocationModalOpen(true)} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg> 
                    {userLocation}
                  </button>
              </div>
          </div>
      </div>

                {/* Main Navigation Bar - CarAndBike style */}
                <div className="cb-header-main">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
                                <button onClick={() => handleNavigate(ViewEnum.HOME)} className="text-2xl font-bold text-white">
                ReRide
                </button>
                                <div className="flex-1 max-w-lg mx-8">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search for Cars or Bikes, Eg: Nexon, or BMW"
                                            className="w-full cb-search-bar"
                                            onClick={onOpenCommandPalette}
                                            readOnly
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button className="bg-white text-gray-900 px-4 py-2 rounded text-sm font-medium">
                                        {userLocation}
                                            </button>
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Secondary Navigation */}
                <div className="cb-header-main">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex items-center space-x-8">
                            <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="cb-nav-link active">
                                New Cars
                            </button>
                            <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="cb-nav-link">
                                New Bikes
                            </button>
                            <button onClick={() => handleNavigate(ViewEnum.SUPPORT)} className="cb-nav-link">
                                News & Reviews
                            </button>
                            <button onClick={() => handleNavigate(ViewEnum.USED_CARS)} className="cb-nav-link">
                                Used Cars
                            </button>
                            <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="cb-nav-link">
                                Go Green with EV
                </button>
                            <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="cb-nav-link">
                                Trending on c&b
                </button>
                            <button onClick={() => handleNavigate(ViewEnum.SUPPORT)} className="cb-nav-link">
                                Car services
                    </button>
                            <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className="cb-nav-link">
                                Sell Your Car
                    </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Location Modal */}
    <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
                currentLocation={userLocation}
        onLocationChange={onLocationChange}
        addToast={addToast}
    />
    </>
  );
});

Header.displayName = 'Header';

export default Header;