import type { VehicleData } from '../types';
import { VEHICLE_DATA } from '../components/vehicleData';

const VEHICLE_DATA_STORAGE_KEY = 'reRideVehicleData';
const API_BASE_URL = '/api';

/**
 * Fetches vehicle data from the API.
 * Falls back to localStorage and then default data if API fails.
 */
export const getVehicleData = async (): Promise<VehicleData> => {
  try {
    // Try to fetch from API first
    const response = await fetch(`${API_BASE_URL}/vehicle-data`);
    if (response.ok) {
      const data = await response.json();
      // Cache in localStorage
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
      return data;
    } else {
      console.warn(`API returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Only log the error if it's not a network/connection issue
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.info("API endpoint not available, using cached data");
    } else {
      console.warn("Failed to fetch vehicle data from API, falling back to localStorage", error);
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
  try {
    // Save to API
    const response = await fetch(`${API_BASE_URL}/vehicle-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      // Also save to localStorage as cache
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
      return true;
    } else {
      console.error("Failed to save vehicle data to API");
      return false;
    }
  } catch (error) {
    console.error("Failed to save vehicle data:", error);
    // Still save to localStorage as fallback
    try {
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save vehicle data to localStorage", e);
    }
    return false;
  }
};