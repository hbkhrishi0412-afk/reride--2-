
import { MOCK_VEHICLES } from '../constants';
import type { Vehicle, User } from '../types';

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

export const getVehiclesLocal = async (): Promise<Vehicle[]> => {
    try {
        console.log('getVehiclesLocal: Starting...');
        let vehiclesJson = localStorage.getItem('reRideVehicles');
        if (!vehiclesJson) {
            console.log('getVehiclesLocal: No cached data, using MOCK_VEHICLES');
            localStorage.setItem('reRideVehicles', JSON.stringify(MOCK_VEHICLES));
            vehiclesJson = JSON.stringify(MOCK_VEHICLES);
        } else {
            console.log('getVehiclesLocal: Using cached data');
        }
        const vehicles = JSON.parse(vehiclesJson);
        console.log('getVehiclesLocal: Successfully loaded', vehicles.length, 'vehicles');
        return vehicles;
    } catch (error) {
        console.error('getVehiclesLocal: Error loading vehicles:', error);
        // Return MOCK_VEHICLES as fallback
        console.log('getVehiclesLocal: Returning MOCK_VEHICLES as fallback');
        return MOCK_VEHICLES;
    }
};

const addVehicleLocal = async (vehicleData: Vehicle): Promise<Vehicle> => {
    const vehicles = await getVehiclesLocal();
    vehicles.unshift(vehicleData);
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    return vehicleData;
};

const updateVehicleLocal = async (vehicleData: Vehicle): Promise<Vehicle> => {
    let vehicles = await getVehiclesLocal();
    vehicles = vehicles.map(v => v.id === vehicleData.id ? vehicleData : v);
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    return vehicleData;
};

const deleteVehicleLocal = async (vehicleId: number): Promise<{ success: boolean, id: number }> => {
    let vehicles = await getVehiclesLocal();
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    return { success: true, id: vehicleId };
};


// --- Production (API) Functions ---

const getVehiclesApi = async (): Promise<Vehicle[]> => {
  const response = await fetch('/api/vehicles');
  return handleResponse(response);
};

const addVehicleApi = async (vehicleData: Vehicle): Promise<Vehicle> => {
    const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(vehicleData),
    });
    return handleResponse(response);
};

const updateVehicleApi = async (vehicleData: Vehicle): Promise<Vehicle> => {
    const response = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(vehicleData),
    });
    return handleResponse(response);
};

const deleteVehicleApi = async (vehicleId: number): Promise<{ success: boolean, id: number }> => {
    const response = await fetch('/api/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ id: vehicleId }),
    });
    return handleResponse(response);
};


// --- Environment Detection ---
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('localhost');

// --- Exported Environment-Aware Service Functions ---

export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    console.log('getVehicles: Starting, isDevelopment:', isDevelopment);
    // Always try API first for production, with fallback to local
    if (!isDevelopment) {
      try {
        console.log('getVehicles: Trying API...');
        const result = await getVehiclesApi();
        console.log('getVehicles: API success, loaded', result.length, 'vehicles');
        return result;
      } catch (error) {
        console.warn('getVehicles: API failed, falling back to local storage:', error);
        // Fallback to local storage if API fails
        return await getVehiclesLocal();
      }
    } else {
      // Development mode - use local storage
      console.log('getVehicles: Development mode, using local storage');
      return await getVehiclesLocal();
    }
  } catch (error) {
    console.error('getVehicles: Critical error, returning empty array:', error);
    // Last resort fallback
    return MOCK_VEHICLES;
  }
};
export const addVehicle = async (vehicleData: Vehicle): Promise<Vehicle> => {
  console.log('🔧 vehicleService.addVehicle called');
  console.log('📍 Environment - isDevelopment:', isDevelopment);
  console.log('📦 Vehicle data received:', vehicleData);
  
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      console.log('🌐 Attempting API call to /api/vehicles');
      const result = await addVehicleApi(vehicleData);
      console.log('✅ API call successful:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ API addVehicle failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await addVehicleLocal(vehicleData);
    }
  } else {
    // Development mode - use local storage
    console.log('💻 Development mode - using local storage');
    const result = await addVehicleLocal(vehicleData);
    console.log('✅ Local storage save successful:', result);
    return result;
  }
};

export const updateVehicle = async (vehicleData: Vehicle): Promise<Vehicle> => {
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      return await updateVehicleApi(vehicleData);
    } catch (error) {
      console.warn('API updateVehicle failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await updateVehicleLocal(vehicleData);
    }
  } else {
    // Development mode - use local storage
    return await updateVehicleLocal(vehicleData);
  }
};

export const deleteVehicle = async (vehicleId: number): Promise<{ success: boolean, id: number }> => {
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      return await deleteVehicleApi(vehicleId);
    } catch (error) {
      console.warn('API deleteVehicle failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await deleteVehicleLocal(vehicleId);
    }
  } else {
    // Development mode - use local storage
    return await deleteVehicleLocal(vehicleId);
  }
};
