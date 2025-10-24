import React, { useState } from 'react';
import { View, User } from './types';
import { login } from './services/userService';

interface AdminLoginProps {
  onLogin: (user: User) => void;
  onNavigate: (view: View) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
        // SECURITY: Removed hardcoded credentials - all authentication must go through proper API
        
        // Try normal login flow
        const result = await login({ email, password, role: 'admin' });

        if (result.success && result.user) {
            onLogin(result.user);
        } else {
            throw new Error(result.reason || 'Invalid admin credentials.');
        }
    } catch (err) {
        let errorMessage = 'Failed to authenticate.';
        
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const formInputClass = "appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-spinny-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-spinny-orange focus:border-spinny-orange focus:z-10 sm:text-sm";

  return (
    <div className="w-full max-w-md space-y-8 bg-spinny-white dark:bg-white p-10 rounded-xl shadow-soft-xl">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-spinny-text-dark">
          Admin Panel Login
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" autoComplete="email" required className={`${formInputClass} rounded-md`} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className={`${formInputClass} rounded-md`} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-spinny-orange text-sm text-center">{error}</p>}

        <div>
          <button type="submit" disabled={isLoading} className="btn-brand-primary group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50">
            {isLoading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </div>
      </form>
       <div className="text-center">
          <button onClick={() => onNavigate(View.USED_CARS)} className="font-medium text-spinny-orange hover:text-spinny-orange-dark">
              &larr; Or go back to Listings
          </button>
      </div>
    </div>
  );
};

export default AdminLogin;