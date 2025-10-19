// Lightweight location data - only major cities and states
export const MAJOR_CITIES = [
  'Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 
  'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Surat'
];

export const INDIAN_STATES = [
  { name: 'Maharashtra', code: 'MH' },
  { name: 'Delhi', code: 'DL' },
  { name: 'Karnataka', code: 'KA' },
  { name: 'Telangana', code: 'TS' },
  { name: 'Tamil Nadu', code: 'TN' },
  { name: 'Gujarat', code: 'GJ' },
  { name: 'West Bengal', code: 'WB' },
  { name: 'Rajasthan', code: 'RJ' },
  { name: 'Uttar Pradesh', code: 'UP' },
  { name: 'Haryana', code: 'HR' }
];

export const CITIES_BY_STATE: Record<string, string[]> = {
  'MH': ['Mumbai', 'Pune', 'Nagpur'],
  'DL': ['New Delhi'],
  'KA': ['Bengaluru', 'Mysuru'],
  'TS': ['Hyderabad'],
  'TN': ['Chennai', 'Coimbatore'],
  'GJ': ['Ahmedabad', 'Surat'],
  'WB': ['Kolkata'],
  'RJ': ['Jaipur', 'Jodhpur'],
  'UP': ['Lucknow', 'Noida'],
  'HR': ['Gurugram', 'Faridabad']
};

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'New Delhi': { lat: 28.6139, lng: 77.2090 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 }
};
