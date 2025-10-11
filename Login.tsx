import React, { useState, useEffect } from 'react';
import { View, User } from './types';
import { login, register } from './services/userService';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  onNavigate: (view: View) => void;
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onNavigate, onForgotPassword }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const formInputClass = "appearance-none relative block w-full px-4 py-3 border border-brand-gray-300 dark:border-brand-gray-600 placeholder-brand-gray-500 text-brand-gray-900 dark:text-brand-gray-200 bg-spinny-white dark:bg-white focus:outline-none focus:ring-spinny-orange focus:border-spinny-orange focus:z-10 sm:text-sm";

  return (
    <div className="seller-dashboard-login w-full max-w-md space-y-8 bg-spinny-white dark:bg-white p-10 rounded-xl shadow-soft-xl">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">
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
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className={`${formInputClass} rounded-md`} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-brand-gray-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.324M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274-4.057 5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
        </div>
        
        {isLogin && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 border-brand-gray-300 rounded" style={{ accentcolor: '#FF6B35' }} />
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