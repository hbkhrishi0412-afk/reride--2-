import React, { useState, useEffect } from 'react';
import { View, User } from './types';
import { login, register } from './services/userService';
import { signInWithGoogle, syncWithBackend } from './services/authService';
import OTPLogin from './components/OTPLogin';
import PasswordInput from './components/PasswordInput';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  onNavigate: (view: View) => void;
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onNavigate, onForgotPassword }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedSellerEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        let result: { success: boolean, user?: User, reason?: string };

        if (mode === 'login') {
            if (!email || !password) throw new Error('Please enter both email and password.');
            
            // SECURITY: Removed hardcoded credentials - all authentication must go through proper API
            
            result = await login({ email, password, role: 'seller' });
        } else {
            if (!name || !mobile || !email || !password) throw new Error('Please fill in all fields to register.');
            result = await register({ name, email, password, mobile, role: 'seller' });
        }

        if (result.success && result.user) {
            if (mode === 'login') {
                if (rememberMe) localStorage.setItem('rememberedSellerEmail', email);
                else localStorage.removeItem('rememberedSellerEmail');
                onLogin(result.user);
            } else {
                onRegister(result.user);
            }
        } else {
            throw new Error(result.reason || 'An unknown error occurred.');
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to authenticate.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      
      if (result.success && result.firebaseUser) {
        // Sync with backend
        const backendResult = await syncWithBackend(result.firebaseUser, 'seller', 'google');
        
        if (backendResult.success && backendResult.user) {
          onLogin(backendResult.user);
        } else {
          throw new Error(backendResult.reason || 'Failed to authenticate with backend');
        }
      } else {
        throw new Error(result.reason || 'Failed to sign in with Google');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setError('');
      setName('');
      setMobile('');
      if (!localStorage.getItem('rememberedSellerEmail')) {
          setEmail('');
      }
      setPassword('');
      setMode(prev => prev === 'login' ? 'register' : 'login');
  }

  const isLogin = mode === 'login';
  const formInputClass = "appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-spinny-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-spinny-orange focus:border-spinny-orange focus:z-10 sm:text-sm";

  // Handle OTP mode
  if (mode === 'otp') {
    return (
      <div className="seller-dashboard-login w-full max-w-md space-y-8 bg-spinny-white dark:bg-white p-10 rounded-xl shadow-soft-xl">
        <OTPLogin 
          onLogin={onLogin} 
          role="seller" 
          onCancel={() => setMode('login')} 
        />
      </div>
    );
  }

  return (
    <div className="seller-dashboard-login w-full max-w-md space-y-8 bg-spinny-white dark:bg-white p-10 rounded-xl shadow-soft-xl">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-spinny-text-dark">
          {isLogin ? 'Seller Dashboard Login' : 'Create a Seller Account'}
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          {!isLogin && (
               <>
                  <div>
                    <label htmlFor="full-name" className="sr-only">Full name</label>
                    <input id="full-name" name="name" type="text" autoComplete="name" required className={`${formInputClass} rounded-md`} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="mobile-number" className="sr-only">Mobile number</label>
                    <input id="mobile-number" name="mobile" type="tel" autoComplete="tel" required className={`${formInputClass} rounded-md`} placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                  </div>
               </>
          )}
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" autoComplete="email" required className={`${formInputClass} rounded-md`} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={`${formInputClass} rounded-md`}
            autoComplete="current-password"
            required
            showLabel={false}
          />
        </div>
        
        {isLogin && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 border-brand-gray-300 rounded" style={{ accentColor: '#FF6B35' }} />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-brand-gray-900 dark:text-brand-gray-300">Remember me</label>
            </div>
            <div className="text-sm">
              <button type="button" onClick={onForgotPassword} className="font-medium transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>Forgot your password?</button>
            </div>
          </div>
        )}

        {error && <p className="text-spinny-orange text-sm text-center">{error}</p>}

        <div>
          <button type="submit" disabled={isLoading} className="btn-brand-primary group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50">
            {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create Account')}
          </button>
        </div>
      </form>

      {/* Social Login Options */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spinny-orange transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => setMode('otp')}
            disabled={isLoading}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spinny-orange transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Phone OTP
          </button>
        </div>
      </div>
      <div className="text-sm text-center">
          <button onClick={toggleMode} className="font-medium transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>
              {isLogin ? "Don't have a seller account? Register" : "Already have a seller account? Sign in"}
          </button>
      </div>
       <div className="text-center">
          <button onClick={() => onNavigate(View.LOGIN_PORTAL)} className="font-medium transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>
              &larr; Back to Role Selection
          </button>
      </div>
    </div>
  );
};

export default Login;