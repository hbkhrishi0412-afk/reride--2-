import type { VehicleData } from '../types';
import { VEHICLE_DATA } from '../components/vehicleData';

const VEHICLE_DATA_STORAGE_KEY = 'reRideVehicleData';
const API_BASE_URL = '/api';

/**
 * Fetches vehicle data from the API.
 * Falls back to localStorage and then default data if API fails.
 */
export const getVehicleData = async (): Promise<VehicleData> => {
  // Try consolidated endpoint first
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles?type=data`);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
          return data;
        } catch (jsonError) {
          console.warn("Failed to parse JSON from consolidated endpoint, trying standalone endpoint", jsonError);
        }
      } else {
        console.warn(`Consolidated endpoint returned non-JSON content type: ${contentType}, trying standalone endpoint`);
      }
    } else {
      console.warn(`Consolidated endpoint returned ${response.status}: ${response.statusText}, trying standalone endpoint`);
    }
  } catch (error) {
    console.warn("Consolidated endpoint failed, trying standalone endpoint", error);
  }

  // Try standalone endpoint as fallback
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle-data`);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
          return data;
        } catch (jsonError) {
          console.warn("Failed to parse JSON from standalone endpoint, falling back to localStorage", jsonError);
        }
      } else {
        console.warn(`Standalone endpoint returned non-JSON content type: ${contentType}, falling back to localStorage`);
      }
    } else {
      console.warn(`Standalone endpoint returned ${response.status}: ${response.statusText}, falling back to localStorage`);
    }
  } catch (error) {
    console.warn("Both API endpoints failed, falling back to localStorage", error);
    if (error instanceof SyntaxError) {
      console.warn("JSON parsing error - API likely returned HTML instead of JSON");
    }
  }

  // Fallback to localStorage
  try {
    const dataJson = localStorage.getItem(VEHICLE_DATA_STORAGE_KEY);
    if (dataJson) {
      return JSON.parse(dataJson);
    }
  } catch (error) {
    console.error("Failed to parse vehicle data from localStorage", error);
  }

  // Final fallback to default data
  const defaultData = VEHICLE_DATA;
  localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

/**
 * Synchronous version for backward compatibility.
 * Returns cached data from localStorage immediately.
 */
export const getVehicleDataSync = (): VehicleData => {
  try {
    const dataJson = localStorage.getItem(VEHICLE_DATA_STORAGE_KEY);
    if (dataJson) {
      return JSON.parse(dataJson);
    }
  } catch (error) {
    console.error("Failed to parse vehicle data from localStorage", error);
  }
  
  // Fallback to default data
  const defaultData = VEHICLE_DATA;
  localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

/**
 * Saves vehicle data to both API and localStorage.
 */
export const saveVehicleData = async (data: VehicleData): Promise<boolean> => {
  // Try consolidated endpoint first
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles?type=data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
      return true;
    } else {
      console.warn(`Consolidated endpoint failed with ${response.status}, trying standalone endpoint`);
    }
  } catch (error) {
    console.warn("Consolidated endpoint failed, trying standalone endpoint", error);
  }

  // Try standalone endpoint as fallback
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
      return true;
    } else {
      console.error("Both API endpoints failed to save vehicle data");
      return false;
    }
  } catch (error) {
    console.error("Failed to save vehicle data to both endpoints:", error);
    // Still save to localStorage as fallback
    try {
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save vehicle data to localStorage", e);
    }
    return false;
  }
};