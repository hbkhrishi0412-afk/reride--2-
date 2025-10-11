import React, { memo } from 'react';
import { View } from '../types';

interface FooterProps {
    onNavigate: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (e: React.MouseEvent, view: View) => {
    e.preventDefault();
    onNavigate(view);
  };
  
  return (
    <footer style={{ background: 'var(--gradient-dark)', borderTop: '1px solid var(--brand-blackcurrant-light)' }}>
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mb-4">
          <h3 className="text-2xl font-bold" style={{ 
            background: 'var(--gradient-warm)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>ReRide</h3>
        </div>
        <p style={{ color: 'var(--brand-white)' }}>&copy; {new Date().getFullYear()} ReRide. All rights reserved.</p>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-rose-pink)' }}>The premier AI-driven marketplace for your next vehicle.</p>
        <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm">
          <a href="#" className="transition-colors" style={{ color: 'var(--brand-rose-pink)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-orange)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-rose-pink)'}>Privacy Policy</a>
          <a href="#" className="transition-colors" style={{ color: 'var(--brand-rose-pink)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-orange)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-rose-pink)'}>Terms of Service</a>
          <a href="#" onClick={(e) => handleNav(e, View.SUPPORT)} className="transition-colors" style={{ color: 'var(--brand-rose-pink)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-orange)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-rose-pink)'}>Contact Support</a>
          <a href="#" onClick={(e) => handleNav(e, View.FAQ)} className="transition-colors" style={{ color: 'var(--brand-rose-pink)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-orange)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-rose-pink)'}>FAQ</a>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);