import React from 'react';
import type { User } from '../types';
import { View as ViewEnum } from '../types';

interface MobileBottomNavProps {
  currentView: ViewEnum;
  onNavigate: (view: ViewEnum) => void;
  currentUser: User | null;
  wishlistCount?: number;
  inboxCount?: number;
}

/**
 * Mobile Bottom Navigation - Native app style navigation
 * Fixed at bottom, compact icons, active state indicators
 */
const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  currentUser,
  wishlistCount = 0,
  inboxCount = 0
}) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      view: ViewEnum.HOME,
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-600'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'browse',
      label: 'Browse',
      view: ViewEnum.USED_CARS,
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-600'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'wishlist',
      label: 'Saved',
      view: ViewEnum.WISHLIST,
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-600'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      badge: wishlistCount
    },
    {
      id: 'inbox',
      label: 'Messages',
      view: ViewEnum.INBOX,
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-600'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: inboxCount,
      requiresAuth: true
    },
    {
      id: 'profile',
      label: 'Account',
      view: currentUser?.role === 'seller' ? ViewEnum.SELLER_DASHBOARD : 
            currentUser?.role === 'customer' ? ViewEnum.BUYER_DASHBOARD :
            ViewEnum.LOGIN_PORTAL,
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-600'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Bottom Navigation Bar - 60px height */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            // Skip auth-required items if not logged in
            if (item.requiresAuth && !currentUser) return null;
            
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.view)}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                {/* Icon */}
                <div className="relative">
                  {item.icon(isActive)}
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full px-1">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-[10px] mt-0.5 font-medium ${
                  isActive ? 'text-orange-500' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-orange-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed bottom nav */}
      <div className="h-16 pb-safe"></div>
    </>
  );
};

export default MobileBottomNav;

