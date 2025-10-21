import React, { useState } from 'react';
import type { User } from '../types';
import { View as ViewEnum } from '../types';
import Logo from './Logo';

interface MobileHeaderProps {
  onNavigate: (view: ViewEnum) => void;
  currentUser: User | null;
  onLogout: () => void;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Mobile App Header - Compact design for installed PWA
 * Features: Small icons, minimal space, app-like feel
 */
const MobileHeader: React.FC<MobileHeaderProps> = ({
  onNavigate,
  currentUser,
  onLogout,
  title,
  showBack = false,
  onBack,
  rightAction
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Premium Mobile Header with Glassmorphism */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.95) 0%, rgba(255, 133, 85, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(255, 107, 53, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={onBack}
                className="p-2 rounded-full transition-all active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                aria-label="Go back"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full transition-all active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                aria-label="Menu"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <Logo size="sm" showText={false} />
              <h1 className="text-base font-bold text-white truncate max-w-[180px]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {title}
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {rightAction || (
              <>
                {/* Search Icon */}
                <button
                  onClick={() => onNavigate(ViewEnum.USED_CARS)}
                  className="p-2 rounded-full transition-all active:scale-95"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                  aria-label="Search"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Notifications Icon */}
                {currentUser && (
                  <button
                    className="p-2 rounded-full transition-all active:scale-95 relative"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Premium notification badge with pulse animation */}
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    >
                      3
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Premium Slide-out Menu with Animation */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMenu(false)}
          />
          <div 
            className="fixed top-0 left-0 bottom-0 w-80 z-50 shadow-2xl transform transition-all duration-300"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
              animation: 'slideInLeft 0.3s ease-out'
            }}
          >
            <div className="h-full flex flex-col">
              {/* Premium Menu Header with Gradient */}
              <div 
                className="p-6 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #6366F1 100%)',
                  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)'
                }}
              >
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.1)' }}></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
                      <Logo size="sm" showText={false} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-base" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        {currentUser?.name || 'Guest User'}
                      </p>
                      <p className="text-white/80 text-xs font-medium">
                        {currentUser?.email || 'Sign in to continue'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 rounded-full transition-all active:scale-95"
                    style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Menu Items with Premium Design */}
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <MenuItem
                  icon={<HomeIcon />}
                  label="Home"
                  onClick={() => { onNavigate(ViewEnum.HOME); setShowMenu(false); }}
                />
                <MenuItem
                  icon={<CarIcon />}
                  label="Browse Cars"
                  onClick={() => { onNavigate(ViewEnum.USED_CARS); setShowMenu(false); }}
                />
                {currentUser && (
                  <>
                    <MenuItem
                      icon={<HeartIcon />}
                      label="My Wishlist"
                      onClick={() => { onNavigate(ViewEnum.WISHLIST); setShowMenu(false); }}
                    />
                    <MenuItem
                      icon={<MessageIcon />}
                      label="Messages"
                      onClick={() => { onNavigate(ViewEnum.INBOX); setShowMenu(false); }}
                      badge={3}
                    />
                    {currentUser.role === 'seller' && (
                      <MenuItem
                        icon={<DashboardIcon />}
                        label="Seller Dashboard"
                        onClick={() => { onNavigate(ViewEnum.SELLER_DASHBOARD); setShowMenu(false); }}
                      />
                    )}
                    {currentUser.role === 'customer' && (
                      <MenuItem
                        icon={<UserIcon />}
                        label="My Dashboard"
                        onClick={() => { onNavigate(ViewEnum.BUYER_DASHBOARD); setShowMenu(false); }}
                      />
                    )}
                  </>
                )}
                <div className="my-3 mx-2 border-t border-gray-200"></div>
                <MenuItem
                  icon={<InfoIcon />}
                  label="Support"
                  onClick={() => { onNavigate(ViewEnum.SUPPORT); setShowMenu(false); }}
                />
                <MenuItem
                  icon={<QuestionIcon />}
                  label="FAQ"
                  onClick={() => { onNavigate(ViewEnum.FAQ); setShowMenu(false); }}
                />
                
                {/* Logout Option */}
                {currentUser && (
                  <>
                    <div className="my-3 mx-2 border-t border-gray-200"></div>
                    <MenuItem
                      icon={<LogoutIcon />}
                      label="Logout"
                      onClick={() => { onLogout(); setShowMenu(false); }}
                      danger
                    />
                  </>
                )}
                
                {/* Login Option for Guests */}
                {!currentUser && (
                  <>
                    <div className="my-3 mx-2 border-t border-gray-200"></div>
                    <MenuItem
                      icon={<LoginIcon />}
                      label="Login"
                      onClick={() => { onNavigate(ViewEnum.LOGIN_PORTAL); setShowMenu(false); }}
                      primary
                    />
                  </>
                )}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16"></div>
      
      {/* Add keyframe animation */}
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

// Premium Menu Item Component
const MenuItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  badge?: number;
  danger?: boolean;
  primary?: boolean;
}> = ({
  icon,
  label,
  onClick,
  badge,
  danger,
  primary
}) => {
  const getStyle = () => {
    if (danger) {
      return {
        background: 'rgba(239, 68, 68, 0.08)',
        color: '#EF4444',
        iconColor: '#EF4444'
      };
    }
    if (primary) {
      return {
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)',
        color: 'white',
        iconColor: 'white',
        boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
      };
    }
    return {
      background: 'transparent',
      color: '#0F172A',
      iconColor: '#64748B'
    };
  };

  const style = getStyle();

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-98 mb-1 relative"
      style={{
        background: style.background,
        color: style.color,
        ...(primary ? { boxShadow: style.boxShadow } : {})
      }}
      onMouseEnter={(e) => {
        if (!primary && !danger) {
          e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!primary && !danger) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <div className="w-5 h-5" style={{ color: style.iconColor }}>{icon}</div>
      <span className="text-sm font-semibold flex-1">{label}</span>
      {badge && badge > 0 && (
        <span 
          className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};

// Small Icon Components
const HomeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CarIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const HeartIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const MessageIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const DashboardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuestionIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const LoginIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

export default MobileHeader;

