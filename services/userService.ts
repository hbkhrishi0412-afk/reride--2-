
import { MOCK_USERS } from '../constants';
import type { User } from '../types';

// --- API Helpers ---
const getAuthHeader = () => {
  try {
    const userJson = sessionStorage.getItem('currentUser');
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
    let usersJson = localStorage.getItem('reRideUsers');
    if (!usersJson) {
        console.log('🔧 Development mode: Populating local storage with mock data...');
        localStorage.setItem('reRideUsers', JSON.stringify(MOCK_USERS));
        usersJson = JSON.stringify(MOCK_USERS);
        console.log(`✅ Populated local storage with ${MOCK_USERS.length} users`);
    }
    return JSON.parse(usersJson);
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
    const { email, password, role } = credentials;
    const users = await getUsersLocal();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, reason: 'Invalid credentials.' };
    if (role && user.role !== role) return { success: false, reason: `User is not a registered ${role}.` };
    if (user.status === 'inactive') return { success: false, reason: 'Your account has been deactivated.' };
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
    const response = await fetch('/api/auth', {
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
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// --- Exported Environment-Aware Service Functions ---

export const getUsers = isDevelopment ? getUsersLocal : getUsersApi;
export const updateUser = isDevelopment ? updateUserLocal : updateUserApi;
export const deleteUser = isDevelopment ? deleteUserLocal : deleteUserApi;
export const login = isDevelopment 
  ? (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => loginLocal(credentials)
  : (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => authApi({ action: 'login', ...credentials });
export const register = isDevelopment 
  ? (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => registerLocal(credentials)
  : (credentials: any): Promise<{ success: boolean, user?: User, reason?: string }> => authApi({ action: 'register', ...credentials });
