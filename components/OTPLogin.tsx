import React, { useState, useEffect } from 'react';
import { sendOTP, verifyOTP, syncWithBackend, initializeRecaptcha, cleanupRecaptcha } from '../services/authService';
import { ConfirmationResult } from 'firebase/auth';
import { User } from '../types';

interface OTPLoginProps {
  onLogin: (user: User) => void;
  role: 'customer' | 'seller';
  onCancel: () => void;
}

const OTPLogin: React.FC<OTPLoginProps> = ({ onLogin, role, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    initializeRecaptcha();
    
    return () => {
      // Cleanup on unmount
      cleanupRecaptcha();
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!phoneNumber) {
        throw new Error('Please enter your phone number');
      }

      // Validate Indian phone number format
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber.replace(/^(\+91)?/, ''))) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      const result = await sendOTP(phoneNumber);
      
      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        setOtpSent(true);
      } else {
        throw new Error(result.reason || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error('Please request OTP first');
      }

      if (!otp || otp.length !== 6) {
        throw new Error('Please enter the 6-digit OTP');
      }

      const result = await verifyOTP(confirmationResult, otp);
      
      if (result.success && result.firebaseUser) {
        // Sync with backend
        const backendResult = await syncWithBackend(result.firebaseUser, role, 'phone');
        
        if (backendResult.success && backendResult.user) {
          onLogin(backendResult.user);
        } else {
          throw new Error(backendResult.reason || 'Failed to authenticate with backend');
        }
      } else {
        throw new Error(result.reason || 'Invalid OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    setOtpSent(false);
    setConfirmationResult(null);
    await handleSendOTP(new Event('submit') as any);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-spinny-text-dark mb-2">
          Login with Mobile OTP
        </h3>
        <p className="text-sm text-gray-600">
          We'll send you a one-time password
        </p>
      </div>

      {!otpSent ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                id="phone-number"
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-spinny-orange focus:border-spinny-orange"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-spinny-orange text-white rounded-md hover:bg-spinny-orange-dark focus:outline-none focus:ring-2 focus:ring-spinny-orange focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spinny-orange focus:border-spinny-orange text-center text-2xl tracking-widest"
              required
            />
            <p className="text-xs text-gray-600 mt-2">
              Sent to +91 {phoneNumber}
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Resend OTP
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-spinny-orange text-white rounded-md hover:bg-spinny-orange-dark focus:outline-none focus:ring-2 focus:ring-spinny-orange focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>
      )}

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default OTPLogin;

