import React from 'react';
import { View } from '../types';
import Logo from './Logo';

interface LoginPortalProps {
  onNavigate: (view: View) => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-soft-xl text-center">
      <div className="flex justify-center mb-4">
        <Logo className="scale-125" />
      </div>
      <h2 className="text-2xl font-extrabold text-spinny-text-dark dark:text-spinny-text-dark">Welcome to ReRide</h2>
      <p className="mt-2 text-brand-gray-600 dark:text-spinny-text">Please select your role to continue.</p>
      <div className="mt-8 space-y-4">
        <button
          onClick={() => onNavigate(View.CUSTOMER_LOGIN)}
          className="btn-brand-primary group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform hover:scale-105"
        >
          I am a Customer
        </button>
        <button
          onClick={() => onNavigate(View.SELLER_LOGIN)}
          className="btn-brand-secondary group relative w-full flex justify-center py-3 px-4 text-lg font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform hover:scale-105"
        >
          I am a Seller
        </button>
      </div>
      <div className="text-sm mt-6">
          <button
              onClick={() => onNavigate(View.USED_CARS)}
              className="font-medium transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}
          >
              Or continue as a guest &rarr;
          </button>
      </div>
       <div className="mt-6 pt-6 border-t border-gray-200-200 dark:border-gray-200-200">
           <div className="text-sm">
              <button
                  onClick={() => onNavigate(View.ADMIN_LOGIN)}
                  className="font-medium text-spinny-text dark:text-spinny-text transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                  Administrator Login
              </button>
          </div>
      </div>
    </div>
  );
};

export default LoginPortal;