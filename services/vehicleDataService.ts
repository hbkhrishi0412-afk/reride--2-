import type { VehicleData } from '../types';
import { VEHICLE_DATA } from '../components/vehicleData';

const VEHICLE_DATA_STORAGE_KEY = 'reRideVehicleData';
const API_BASE_URL = '/api';

/**
 * Fetches vehicle data from the admin database API.
 * Falls back to localStorage and then default data if API fails.
 */
export const getVehicleData = async (): Promise<VehicleData> => {
  // Try new vehicle data management API first
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle-data-management`);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('✅ Vehicle data loaded from admin database:', result.source);
            localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(result.data));
            return result.data;
          }
        } catch (jsonError) {
          console.warn("Failed to parse JSON from vehicle-data-management endpoint", jsonError);
        }
      }
    } else {
      console.warn(`Vehicle data management API returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn("Vehicle data management API failed, trying fallback endpoints", error);
  }

  // Try consolidated endpoint as fallback
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
    } else if (error instanceof Error && error.message.includes('API returned non-JSON response')) {
      console.warn("API returned HTML instead of JSON - likely a 404 or server error page");
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
 * Creates new vehicle data in the admin database
 */
export const createVehicleData = async (vehicleData: {
  category: string;
  make: string;
  model: string;
  variants: string[];
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle-data-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating vehicle data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Updates existing vehicle data in the admin database
 */
export const updateVehicleData = async (id: string, vehicleData: {
  category?: string;
  make?: string;
  model?: string;
  variants?: string[];
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle-data-management?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating vehicle data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Deletes vehicle data from the admin database
 */
export const deleteVehicleData = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle-data-management?id=${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting vehicle data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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
 * Saves vehicle data to both API and localStorage with enhanced error handling and retry logic.
 */
export const saveVehicleData = async (data: VehicleData): Promise<boolean> => {
  console.log('🔄 Starting vehicle data save process...');
  
  // Always save to localStorage first for immediate UI update
  try {
    localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
    console.log('✅ Vehicle data saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
  }

  // Try to save to API with retry logic
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🌐 Attempt ${attempt}/${maxRetries}: Trying to save to API...`);
    
    // Try consolidated endpoint first
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles?type=data`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vehicle data saved to API via consolidated endpoint:', result);
        return true;
      } else {
        console.warn(`⚠️ Consolidated endpoint failed with ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.warn('Response body:', errorText);
      }
    } catch (error) {
      console.warn(`⚠️ Consolidated endpoint attempt ${attempt} failed:`, error);
      lastError = error as Error;
    }

    // Try standalone endpoint as fallback
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-data`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vehicle data saved to API via standalone endpoint:', result);
        return true;
      } else {
        console.warn(`⚠️ Standalone endpoint failed with ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.warn('Response body:', errorText);
      }
    } catch (error) {
      console.warn(`⚠️ Standalone endpoint attempt ${attempt} failed:`, error);
      lastError = error as Error;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('❌ All API save attempts failed. Data saved locally only.');
  console.error('Last error:', lastError);
  
  // Return false to indicate API save failed, but data is still in localStorage
  return false;
};