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
        console.log('Attempting admin login for:', email);
        const result = await login({ email, password, role: 'admin' });
        console.log('Login result:', result);

        if (result.success && result.user) {
            console.log('Login successful, user:', result.user);
            onLogin(result.user);
        } else {
            console.error('Login failed:', result.reason);
            throw new Error(result.reason || 'Invalid admin credentials.');
        }
    } catch (err) {
        console.error('Login error:', err);
        let errorMessage = 'Failed to authenticate.';
        
        if (err instanceof Error) {
            errorMessage = err.message;
            
            // Provide more helpful error messages for common issues
            if (err.message.includes('Database configuration error')) {
                errorMessage = 'Database not configured. Using fallback authentication.';
            } else if (err.message.includes('Database connection failed')) {
                errorMessage = 'Cannot connect to database. Using fallback authentication.';
            } else if (err.message.includes('Failed to parse server response')) {
                errorMessage = 'Server returned invalid response. Using fallback authentication.';
            } else if (err.message.includes('HTTP 500')) {
                errorMessage = 'Server error. Using fallback authentication.';
            } else if (err.message.includes('Invalid credentials')) {
                errorMessage = 'Invalid admin credentials. Please check email and password.';
            }
        }
        
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const formInputClass = "appearance-none relative block w-full px-4 py-3 border border-brand-gray-300 dark:border-brand-gray-600 placeholder-brand-gray-500 text-brand-gray-900 dark:text-brand-gray-200 bg-spinny-white dark:bg-white focus:outline-none focus:ring-spinny-orange focus:border-spinny-orange focus:z-10 sm:text-sm";

  return (
    <div className="w-full max-w-md space-y-8 bg-spinny-white dark:bg-white p-10 rounded-xl shadow-soft-xl">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">
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
          <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-spinny-white bg-spinny-orange-dark hover:bg-spinny-orange-darkest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spinny-orange transition-colors disabled:opacity-50">
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