
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
const getAuthHeader = () => {
  try {
    // Try localStorage first for persistent login, fallback to sessionStorage
    const userJson = localStorage.getItem('reRideCurrentUser') || sessionStorage.getItem('currentUser');
    if (!userJson) return {};
    const user: User = JSON.parse(userJson);
    return { 'Authorization': user.email };
  } catch {
    return {};
  }
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
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
    console.log('🔐 loginLocal called with:', { email: credentials.email, role: credentials.role });
    const { email, password, role } = credentials;
    const users = await getUsersLocal();
    console.log('📋 Total users loaded:', users.length);
    console.log('🔍 Looking for user with email:', email);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        console.log('❌ User not found with provided credentials');
        // Try to find user by email only to help debug
        const userByEmail = users.find(u => u.email === email);
        if (userByEmail) {
            console.log('⚠️  User exists with this email but password doesn\'t match');
            console.log('User role:', userByEmail.role, 'Expected role:', role);
        } else {
            console.log('⚠️  No user found with email:', email);
            console.log('Available emails:', users.map(u => u.email).join(', '));
        }
        return { success: false, reason: 'Invalid credentials.' };
    }
    
    console.log('✅ User found:', user.name, 'Role:', user.role);
    
    if (role && user.role !== role) {
        console.log('❌ Role mismatch. User role:', user.role, 'Expected:', role);
        return { success: false, reason: `User is not a registered ${role}.` };
    }
    
    if (user.status === 'inactive') {
        console.log('❌ User account is inactive');
        return { success: false, reason: 'Your account has been deactivated.' };
    }
    
    const { password: _, ...userWithoutPassword } = user;
    console.log('✅ Login successful for:', user.name);
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

const deleteUserApi = async (email: string): Promise<{ success: boolean, email: string }> => {
    const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
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
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      return await authApi({ action: 'register', ...credentials });
    } catch (error) {
      console.warn('API register failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await registerLocal(credentials);
    }
  } else {
    // Development mode - use local storage
    return await registerLocal(credentials);
  }
};
