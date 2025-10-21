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
        <svg 
          className="w-6 h-6 transition-all duration-300" 
          style={{ color: active ? '#FF6B35' : '#64748B' }}
          fill={active ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'browse',
      label: 'Browse',
      view: ViewEnum.USED_CARS,
      icon: (active: boolean) => (
        <svg 
          className="w-6 h-6 transition-all duration-300" 
          style={{ color: active ? '#FF6B35' : '#64748B' }}
          fill={active ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'wishlist',
      label: 'Saved',
      view: ViewEnum.WISHLIST,
      icon: (active: boolean) => (
        <svg 
          className="w-6 h-6 transition-all duration-300" 
          style={{ color: active ? '#FF6B35' : '#64748B' }}
          fill={active ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      badge: wishlistCount
    },
    {
      id: 'inbox',
      label: 'Messages',
      view: ViewEnum.INBOX,
      icon: (active: boolean) => (
        <svg 
          className="w-6 h-6 transition-all duration-300" 
          style={{ color: active ? '#FF6B35' : '#64748B' }}
          fill={active ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: inboxCount,
      requiresAuth: true
    },
    {
      id: 'dashboard',
      label: currentUser ? 'Dashboard' : 'Account',
      view: currentUser?.role === 'seller' ? ViewEnum.SELLER_DASHBOARD : 
            currentUser?.role === 'customer' ? ViewEnum.BUYER_DASHBOARD :
            currentUser?.role === 'admin' ? ViewEnum.ADMIN_PANEL :
            ViewEnum.LOGIN_PORTAL,
      icon: (active: boolean) => (
        <svg 
          className="w-6 h-6 transition-all duration-300" 
          style={{ color: active ? '#FF6B35' : '#64748B' }}
          fill={active ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Premium Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex items-center justify-around h-16 px-2 relative">
          {/* Floating active indicator background */}
          <div 
            className="absolute transition-all duration-300 ease-out"
            style={{
              height: '48px',
              width: '64px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(255, 133, 85, 0.12) 100%)',
              top: '50%',
              transform: `translateY(-50%) translateX(${
                navItems.findIndex(item => item.view === currentView) * (window.innerWidth / Math.max(navItems.filter(item => !item.requiresAuth || currentUser).length, 1))
              }px)`,
              left: '0',
              pointerEvents: 'none'
            }}
          />
          
          {navItems.map((item, index) => {
            // Skip auth-required items if not logged in
            if (item.requiresAuth && !currentUser) return null;
            
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.view)}
                className="flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 active:scale-95"
                style={{
                  zIndex: isActive ? 10 : 1
                }}
              >
                {/* Icon Container with Animation */}
                <div 
                  className="relative transition-all duration-300"
                  style={{
                    transform: isActive ? 'translateY(-2px) scale(1.1)' : 'translateY(0) scale(1)'
                  }}
                >
                  <div className={`transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {item.icon(isActive)}
                  </div>
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-white text-[9px] font-bold rounded-full px-1"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label with smooth transition */}
                <span 
                  className="text-[10px] mt-1 font-semibold transition-all duration-300"
                  style={{
                    color: isActive ? '#FF6B35' : '#64748B',
                    fontWeight: isActive ? 700 : 600,
                    transform: isActive ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {item.label}
                </span>
                
                {/* Active dot indicator */}
                {isActive && (
                  <div 
                    className="absolute transition-all duration-300"
                    style={{
                      bottom: '4px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)',
                      boxShadow: '0 2px 8px rgba(255, 107, 53, 0.6)',
                      animation: 'scaleIn 0.3s ease-out'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed bottom nav */}
      <div className="h-16 pb-safe"></div>
      
      {/* Add scale animation */}
      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default MobileBottomNav;

