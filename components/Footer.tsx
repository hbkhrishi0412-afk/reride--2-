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
    <footer style={{ background: 'linear-gradient(135deg, #424242 0%, #212529 100%)', borderTop: '1px solid var(--spinny-text-dark-light)' }}>
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mb-4">
          <h3 className="text-2xl font-bold" style={{ 
            background: 'var(--gradient-warm)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>ReRide</h3>
        </div>
        <p style={{ color: 'white' }}>&copy; {new Date().getFullYear()} ReRide. All rights reserved.</p>
        <p className="text-sm mt-1" style={{ color: '#1E88E5' }}>The premier AI-driven marketplace for your next vehicle.</p>
        <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm">
          <a href="#" className="transition-colors" style={{ color: '#1E88E5' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'}>Privacy Policy</a>
          <a href="#" className="transition-colors" style={{ color: '#1E88E5' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'}>Terms of Service</a>
          <a href="#" onClick={(e) => handleNav(e, View.SUPPORT)} className="transition-colors" style={{ color: '#1E88E5' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'}>Contact Support</a>
          <a href="#" onClick={(e) => handleNav(e, View.FAQ)} className="transition-colors" style={{ color: '#1E88E5' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'}>FAQ</a>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);