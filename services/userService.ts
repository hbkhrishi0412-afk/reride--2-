
import type { User } from '../types';

// Fallback mock users to prevent loading issues
const FALLBACK_USERS: User[] = [
  {
    email: "admin@reride.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
    mobile: "9876543210",
    location: "Mumbai",
    status: "active",
    isVerified: true,
    createdAt: new Date().toISOString(),
    subscriptionPlan: "free",
    featuredCredits: 0
  }
];

// --- API Helpers ---
const getAuthHeader = (): Record<string, string> => {
  try {
    // Get JWT token from localStorage
    const token = localStorage.getItem('reRideAccessToken');
    if (!token) return { 'Content-Type': 'application/json' };
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

const storeTokens = (accessToken: string, refreshToken: string) => {
  try {
    localStorage.setItem('reRideAccessToken', accessToken);
    localStorage.setItem('reRideRefreshToken', refreshToken);
  } catch (error) {
    console.warn('Failed to store tokens:', error);
  }
};

const clearTokens = () => {
  try {
    localStorage.removeItem('reRideAccessToken');
    localStorage.removeItem('reRideRefreshToken');
    localStorage.removeItem('reRideCurrentUser');
  } catch (error) {
    console.warn('Failed to clear tokens:', error);
  }
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        // For 500 errors, don't throw - let the fallback mechanism handle it
        if (response.status >= 500) {
            console.warn(`API returned ${response.status}: ${response.statusText}, will use fallback data`);
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        const error = await response.json().catch(() => ({ error: `API Error: ${response.statusText}` }));
        throw new Error(error.error || `Failed to fetch: ${response.statusText}`);
    }
    return response.json();
}

// --- Local Development (localStorage) Functions ---

export const getUsersLocal = async (): Promise<User[]> => {
    try {
        console.log('getUsersLocal: Starting...');
        let usersJson = localStorage.getItem('reRideUsers');
        if (!usersJson) {
            console.log('getUsersLocal: No cached data, loading MOCK_USERS...');
            // Dynamically import MOCK_USERS to avoid blocking initial load
            const { MOCK_USERS } = await import('../constants');
            localStorage.setItem('reRideUsers', JSON.stringify(MOCK_USERS));
            usersJson = JSON.stringify(MOCK_USERS);
            console.log(`✅ Populated local storage with ${MOCK_USERS.length} users`);
        } else {
            console.log('getUsersLocal: Using cached data');
        }
        const users = JSON.parse(usersJson);
        console.log('getUsersLocal: Successfully loaded', users.length, 'users');
        return users;
    } catch (error) {
        console.error('getUsersLocal: Error loading users:', error);
        // Return FALLBACK_USERS as fallback
        console.log('getUsersLocal: Returning FALLBACK_USERS as fallback');
        return FALLBACK_USERS;
    }
};

const updateUserLocal = async (userData: Partial<User> & { email: string }): Promise<User> => {
    let users = await getUsersLocal();
    let updatedUser: User | undefined;
    users = users.map(u => {
        if (u.email === userData.email) {
            updatedUser = { ...u, ...userData };
            return updatedUser;
        }
        return u;
    });
    localStorage.setItem('reRideUsers', JSON.stringify(users));
    if (!updatedUser) throw new Error("User not found to update.");
    return updatedUser;
};

const deleteUserLocal = async (email: string): Promise<{ success: boolean, email: string }> => {
    let users = await getUsersLocal();
    users = users.filter(u => u.email !== email);
    localStorage.setItem('reRideUsers', JSON.stringify(users));
    return { success: true, email };
};

const loginLocal = async (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => {
    // SECURITY: Reduced logging to prevent information disclosure
    const { email, password, role } = credentials;
    const users = await getUsersLocal();
    
    // SECURITY: Find user by email first, then validate password securely
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return { success: false, reason: 'Invalid credentials.' };
    }
    
    // SECURITY: For local storage, we need to handle both hashed and plain text passwords
    // This is a fallback system, so we check both formats
    let isPasswordValid = false;
    
    if (user.password && user.password.startsWith('$2')) {
        // Password is hashed with bcrypt
        try {
            const bcrypt = require('bcryptjs');
            isPasswordValid = await bcrypt.compare(password, user.password);
        } catch (error) {
            // SECURITY: Don't log password validation errors
            isPasswordValid = false;
        }
    } else {
        // SECURITY WARNING: Plain text password - this should only be used in development
        // In production, all passwords should be hashed
        console.warn('⚠️ SECURITY WARNING: Using plain text password comparison in local storage');
        isPasswordValid = user.password === password;
    }
    
    if (!isPasswordValid) {
        return { success: false, reason: 'Invalid credentials.' };
    }
    
    if (role && user.role !== role) {
        return { success: false, reason: `User is not a registered ${role}.` };
    }
    
    if (user.status === 'inactive') {
        return { success: false, reason: 'Your account has been deactivated.' };
    }
    
    // SECURITY: Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
};

const registerLocal = async (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => {
    const { email } = credentials;
    const users = await getUsersLocal();
    if (users.some(u => u.email === email)) {
        return { success: false, reason: 'An account with this email already exists.' };
    }
    const newUser: User = {
        ...credentials,
        status: 'active',
        createdAt: new Date().toISOString(),
        subscriptionPlan: 'free', featuredCredits: 0, usedCertifications: 0,
    };
    users.push(newUser);
    localStorage.setItem('reRideUsers', JSON.stringify(users));
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
};

// --- Production (API) Functions ---

const getUsersApi = async (): Promise<User[]> => {
  const response = await fetch('/api/users');
  return handleResponse(response);
};

const updateUserApi = async (userData: Partial<User> & { email: string }): Promise<User> => {
    const response = await fetch('/api/users', {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

const deleteUserApi = async (email: string): Promise<{ success: boolean, email: string }> => {
    const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: getAuthHeader(),
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
};

const authApi = async (body: any): Promise<any> => {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    
    // Check if response is ok first
    if (!response.ok) {
        // Try to parse error response, but handle cases where response might be empty
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.reason || errorData.error || errorMessage;
            }
        } catch (parseError) {
            // If we can't parse the error response, use the default error message
            console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
    }
    
    // Parse successful response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
    }
    
    try {
        const result = await response.json();
        return result;
    } catch (parseError) {
        throw new Error('Failed to parse server response as JSON');
    }
};


// --- Environment Detection ---
// Use local storage in development, API in production
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('localhost');

// --- Exported Environment-Aware Service Functions ---

export const getUsers = async (): Promise<User[]> => {
  try {
    console.log('getUsers: Starting, isDevelopment:', isDevelopment);
    // Always try API first for production, with fallback to local
    if (!isDevelopment) {
      try {
        console.log('getUsers: Trying API...');
        const result = await getUsersApi();
        console.log('getUsers: API success, loaded', result.length, 'users');
        return result;
      } catch (error) {
        console.warn('getUsers: API failed, falling back to local storage:', error);
        // Show user-friendly notification for API failures
        if (error instanceof Error && error.message.includes('API Error: 5')) {
          console.info('getUsers: Using cached data due to server issues');
        }
        // Fallback to local storage if API fails
        return await getUsersLocal();
      }
    } else {
      // Development mode - use local storage
      console.log('getUsers: Development mode, using local storage');
      return await getUsersLocal();
    }
  } catch (error) {
    console.error('getUsers: Critical error, returning FALLBACK_USERS:', error);
    // Last resort fallback
    return FALLBACK_USERS;
  }
};
export const updateUser = async (userData: Partial<User> & { email: string }): Promise<User> => {
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      return await updateUserApi(userData);
    } catch (error) {
      console.warn('API updateUser failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await updateUserLocal(userData);
    }
  } else {
    // Development mode - use local storage
    return await updateUserLocal(userData);
  }
};
export const deleteUser = isDevelopment ? deleteUserLocal : deleteUserApi;
export const login = async (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => {
  console.log('🚀 Login attempt:', { email: credentials.email, role: credentials.role, isDevelopment });
  
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      console.log('🌐 Trying API login...');
      const result = await authApi({ action: 'login', ...credentials });
      
      // Store JWT tokens if provided
      if (result.success && result.accessToken && result.refreshToken) {
        storeTokens(result.accessToken, result.refreshToken);
        localStorage.setItem('reRideCurrentUser', JSON.stringify(result.user));
      }
      
      console.log('✅ API login successful');
      return result;
    } catch (error) {
      console.warn('⚠️  API login failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await loginLocal(credentials);
    }
  } else {
    // Development mode - use local storage
    console.log('💻 Development mode - using local storage');
    return await loginLocal(credentials);
  }
};
export const register = async (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => {
  console.log('🚀 Register attempt:', { email: credentials.email, role: credentials.role, isDevelopment });
  
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      console.log('🌐 Trying API registration...');
      const result = await authApi({ action: 'register', ...credentials });
      
      // Store JWT tokens if provided
      if (result.success && result.accessToken && result.refreshToken) {
        storeTokens(result.accessToken, result.refreshToken);
        localStorage.setItem('reRideCurrentUser', JSON.stringify(result.user));
      }
      
      console.log('✅ API registration successful');
      return result;
    } catch (error) {
      console.warn('⚠️  API registration failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await registerLocal(credentials);
    }
  } else {
    // Development mode - use local storage
    console.log('💻 Development mode - using local storage');
    return await registerLocal(credentials);
  }
};

export const logout = (): void => {
  clearTokens();
  console.log('✅ User logged out and tokens cleared');
};

// Token refresh function
export const refreshAccessToken = async (): Promise<{ success: boolean; accessToken?: string; reason?: string }> => {
  try {
    const refreshToken = localStorage.getItem('reRideRefreshToken');
    if (!refreshToken) {
      return { success: false, reason: 'No refresh token available' };
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh-token', refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const result = await response.json();
    
    if (result.success && result.accessToken) {
      localStorage.setItem('reRideAccessToken', result.accessToken);
      return { success: true, accessToken: result.accessToken };
    }

    return { success: false, reason: 'Invalid refresh response' };
  } catch (error) {
    console.warn('Token refresh failed:', error);
    return { success: false, reason: 'Token refresh failed' };
  }
};
