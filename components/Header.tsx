import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import type { User, Notification, Toast as ToastType } from '../types';
import { View as ViewEnum } from '../types';
import NotificationCenter from './NotificationCenter';
import LocationModal from './LocationModal';
import Logo from './Logo';

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

    const DropdownLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
        <button onClick={onClick} className="block w-full text-left px-4 py-2 text-sm text-spinny-text-dark dark:text-spinny-text-dark hover:bg-spinny-off-white dark:hover:bg-brand-gray-700 transition-colors">
            {children}
        </button>
    );

    return (
        <>
            <header className="spinny-header sticky top-0 z-50">
                {/* Top Bar */}
                <div className="spinny-header-top">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#1E88E5' }}>
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                                <span className="font-medium">Trusted by 50,000+ Happy Customers</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsLocationModalOpen(true)} 
                                className="flex items-center gap-1 transition-colors font-medium" style={{ color: '#1E88E5' }}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {userLocation}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            {/* Logo */}
                            <Logo 
                                onClick={() => handleNavigate(ViewEnum.HOME)}
                                className="cursor-pointer"
                            />

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center gap-2">
                                <button onClick={() => handleNavigate(ViewEnum.USED_CARS)} className="spinny-nav-link">
                                    Buy Car
                                </button>
                                <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className="spinny-nav-link">
                                    Sell Car
                                </button>
                                <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="spinny-nav-link">
                                    New Cars
                                </button>
                                <button onClick={() => handleNavigate(ViewEnum.DEALER_PROFILES)} className="spinny-nav-link">
                                    Dealers
                                </button>
                                <button onClick={() => handleNavigate(ViewEnum.SUPPORT)} className="spinny-nav-link">
                                    Support
                                </button>
                            </nav>

                            {/* Right Side Actions */}
                            <div className="hidden md:flex items-center gap-3">
                                <button onClick={onOpenCommandPalette} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <svg className="h-6 w-6 text-spinny-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                                
                                <button onClick={() => handleNavigate(ViewEnum.WISHLIST)} className="relative p-2 rounded-full transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1A1A1A' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                    </svg>
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundcolor: '#FF6B35' }}>
                                            {wishlistCount}
                                        </span>
                                    )}
                                </button>

                                <button onClick={() => handleNavigate(ViewEnum.COMPARISON)} className="relative p-2 rounded-full transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1A1A1A' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    {compareCount > 0 && (
                                        <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundcolor: '#1E88E5' }}>
                                            {compareCount}
                                        </span>
                                    )}
                                </button>

                                {currentUser && (
                                    <div className="relative" ref={notificationsRef}>
                                        <button onClick={() => setIsNotificationsOpen(p => !p)} className="relative p-2 rounded-full transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1A1A1A' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            {unreadNotifications.length > 0 && (
                                                <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundcolor: '#FF6B35' }}>
                                                    {unreadNotifications.length}
                                                </span>
                                            )}
                                        </button>
                                        {isNotificationsOpen && (
                                            <NotificationCenter 
                                                notifications={notifications}
                                                onNotificationClick={handleNotificationItemClick}
                                                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                                            />
                                        )}
                                    </div>
                                )}

                                {currentUser ? (
                                    <div className="relative" ref={userMenuRef}>
                                        <button onClick={() => setIsUserMenuOpen(p => !p)} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-colors">
                                            <img 
                                                src={currentUser.avatarUrl || `https://i.pravatar.cc/40?u=${currentUser.email}`} 
                                                alt="User" 
                                                className="h-8 w-8 rounded-full"
                                            />
                                        </button>
                                        {isUserMenuOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border dark:border-gray-200-200 animate-fade-in z-20">
                                                <div className="p-4 border-b dark:border-gray-200-200">
                                                    <p className="font-semibold text-sm text-spinny-text-dark dark:text-white">
                                                        Hi, {currentUser.name ? currentUser.name.split(' ')[0] : ''}
                                                    </p>
                                                </div>
                                                {currentUser.role === 'customer' && <DropdownLink onClick={() => handleNavigate(ViewEnum.BUYER_DASHBOARD)}>My Dashboard</DropdownLink>}
                                                {currentUser.role === 'customer' && <DropdownLink onClick={() => handleNavigate(ViewEnum.INBOX)}>Inbox {inboxCount > 0 && `(${inboxCount})`}</DropdownLink>}
                                                {currentUser.role === 'seller' && <DropdownLink onClick={() => handleNavigate(ViewEnum.SELLER_DASHBOARD)}>Dashboard</DropdownLink>}
                                                {currentUser.role === 'admin' && <DropdownLink onClick={() => handleNavigate(ViewEnum.ADMIN_PANEL)}>Admin Panel</DropdownLink>}
                                                <DropdownLink onClick={() => handleNavigate(ViewEnum.PROFILE)}>My Profile</DropdownLink>
                                                <div className="border-t dark:border-gray-200-200">
                                                    <DropdownLink onClick={onLogout}>Logout</DropdownLink>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleNavigate(ViewEnum.LOGIN_PORTAL)} 
                                        className="spinny-button-primary text-sm"
                                    >
                                        Login
                                    </button>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="md:hidden">
                                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-spinny-text-dark">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div ref={mobileMenuRef} className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg animate-fade-in z-40">
                        <nav className="p-4 space-y-2">
                            <button onClick={() => handleNavigate(ViewEnum.USED_CARS)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Buy Car</button>
                            <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Sell Car</button>
                            <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">New Cars</button>
                            <button onClick={() => handleNavigate(ViewEnum.DEALER_PROFILES)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Dealers</button>
                            <hr className="border-gray-200"/>
                            <button onClick={() => handleNavigate(ViewEnum.COMPARISON)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Compare ({compareCount})</button>
                            <button onClick={() => handleNavigate(ViewEnum.WISHLIST)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Wishlist ({wishlistCount})</button>
                            {currentUser && currentUser.role === 'customer' && (
                                <>
                                    <button onClick={() => handleNavigate(ViewEnum.BUYER_DASHBOARD)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">My Dashboard</button>
                                    <button onClick={() => handleNavigate(ViewEnum.INBOX)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Inbox ({inboxCount})</button>
                                </>
                            )}
                            <hr className="border-gray-200"/>
                            {currentUser ? (
                                <>
                                    {currentUser.role === 'seller' && <button onClick={() => handleNavigate(ViewEnum.SELLER_DASHBOARD)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Dashboard</button>}
                                    {currentUser.role === 'admin' && <button onClick={() => handleNavigate(ViewEnum.ADMIN_PANEL)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Admin Panel</button>}
                                    <button onClick={() => handleNavigate(ViewEnum.PROFILE)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">My Profile</button>
                                    <button onClick={onLogout} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Logout</button>
                                </>
                            ) : (
                                <button onClick={() => handleNavigate(ViewEnum.LOGIN_PORTAL)} className="block w-full text-left font-semibold text-spinny-text-dark py-2 px-4 rounded-lg hover:bg-white">Login / Register</button>
                            )}
                        </nav>
                    </div>
                )}
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
