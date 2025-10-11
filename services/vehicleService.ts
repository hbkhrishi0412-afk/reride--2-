
import { MOCK_VEHICLES } from '../constants';
import type { Vehicle, User } from '../types';

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

export const getVehiclesLocal = async (): Promise<Vehicle[]> => {
    let vehiclesJson = localStorage.getItem('reRideVehicles');
    if (!vehiclesJson) {
        localStorage.setItem('reRideVehicles', JSON.stringify(MOCK_VEHICLES));
        vehiclesJson = JSON.stringify(MOCK_VEHICLES);
    }
    return JSON.parse(vehiclesJson);
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
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      return await getVehiclesApi();
    } catch (error) {
      console.warn('API getVehicles failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await getVehiclesLocal();
    }
  } else {
    // Development mode - use local storage
    return await getVehiclesLocal();
  }
};
export const addVehicle = async (vehicleData: Vehicle): Promise<Vehicle> => {
  // Always try API first for production, with fallback to local
  if (!isDevelopment) {
    try {
      return await addVehicleApi(vehicleData);
    } catch (error) {
      console.warn('API addVehicle failed, falling back to local storage:', error);
      // Fallback to local storage if API fails
      return await addVehicleLocal(vehicleData);
    }
  } else {
    // Development mode - use local storage
    return await addVehicleLocal(vehicleData);
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
