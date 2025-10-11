import React, { useState, useMemo } from 'react';
import { INDIAN_STATES, CITIES_BY_STATE } from '../constants';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLocation: string;
    onLocationChange: (location: string) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, currentLocation, onLocationChange, addToast }) => {
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);

    const availableCities = useMemo(() => {
        if (!selectedState) return [];
        return CITIES_BY_STATE[selectedState] || [];
    }, [selectedState]);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser.', 'error');
            return;
        }
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Detected coordinates:', { latitude, longitude });
                
                try {
                    // Use OpenStreetMap Nominatim API for reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                        {
                            headers: {
                                'User-Agent': 'ReRide-App'
                            }
                        }
                    );
                    
                    if (!response.ok) {
                        throw new Error('Geocoding failed');
                    }
                    
                    const data = await response.json();
                    console.log('Geocoding response:', data);
                    
                    // Extract city and state from the response
                    const address = data.address;
                    const detectedCity = address.city || address.town || address.village || address.suburb || address.state_district;
                    const detectedState = address.state;
                    
                    console.log('Detected location:', { detectedCity, detectedState });
                    
                    // Try to match with our available cities
                    const allCities = Object.values(CITIES_BY_STATE).flat();
                    let matchedCity = null;
                    
                    // First, try exact match
                    if (detectedCity) {
                        matchedCity = allCities.find(city => 
                            city.toLowerCase() === detectedCity.toLowerCase()
                        );
                    }
                    
                    // If no exact match, try partial match
                    if (!matchedCity && detectedCity) {
                        matchedCity = allCities.find(city => 
                            city.toLowerCase().includes(detectedCity.toLowerCase()) ||
                            detectedCity.toLowerCase().includes(city.toLowerCase())
                        );
                    }
                    
                    // If still no match, try to find major city in the detected state
                    if (!matchedCity && detectedState) {
                        const stateEntry = INDIAN_STATES.find(s => 
                            s.name.toLowerCase().includes(detectedState.toLowerCase()) ||
                            detectedState.toLowerCase().includes(s.name.toLowerCase())
                        );
                        
                        if (stateEntry && CITIES_BY_STATE[stateEntry.code]) {
                            // Pick the first major city in that state
                            matchedCity = CITIES_BY_STATE[stateEntry.code][0];
                        }
                    }
                    
                    // If we found a match, use it; otherwise, use detected city name
                    const finalLocation = matchedCity || detectedCity || 'Mumbai';
                    
                    onLocationChange(finalLocation);
                    addToast(`Location detected: ${finalLocation}`, 'success');
                    setIsDetecting(false);
                    onClose();
                    
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    // Fallback: Use coordinates to estimate nearest major city
                    const nearestCity = findNearestCity(latitude, longitude);
                    onLocationChange(nearestCity);
                    addToast(`Location detected: ${nearestCity}`, 'success');
                    setIsDetecting(false);
                    onClose();
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                addToast('Unable to retrieve your location. Please grant permission or select manually.', 'error');
                setIsDetecting(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };
    
    // Helper function to find nearest city based on coordinates
    const findNearestCity = (lat: number, lon: number): string => {
        // Approximate coordinates of major Indian cities
        const majorCities: { name: string; lat: number; lon: number }[] = [
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
            { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
            { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
            { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
            { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
            { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
            { name: 'Pune', lat: 18.5204, lon: 73.8567 },
            { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
            { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
            { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
            { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
            { name: 'Indore', lat: 22.7196, lon: 75.8577 },
            { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
            { name: 'Visakhapatnam', lat: 17.6869, lon: 83.2185 },
            { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
            { name: 'Surat', lat: 21.1702, lon: 72.8311 },
            { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
            { name: 'Patna', lat: 25.5941, lon: 85.1376 },
            { name: 'Vadodara', lat: 22.3072, lon: 73.1812 },
            { name: 'Ghaziabad', lat: 28.6692, lon: 77.4538 },
            { name: 'Ludhiana', lat: 30.9010, lon: 75.8573 },
            { name: 'Agra', lat: 27.1767, lon: 78.0081 },
            { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
            { name: 'Faridabad', lat: 28.4089, lon: 77.3178 },
            { name: 'Meerut', lat: 28.9845, lon: 77.7064 },
            { name: 'Rajkot', lat: 22.3039, lon: 70.8022 },
            { name: 'Varanasi', lat: 25.3176, lon: 82.9739 },
            { name: 'Amritsar', lat: 31.6340, lon: 74.8723 },
            { name: 'Allahabad', lat: 25.4358, lon: 81.8463 },
            { name: 'Ranchi', lat: 23.3441, lon: 85.3096 },
            { name: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
            { name: 'Jabalpur', lat: 23.1815, lon: 79.9864 },
            { name: 'Gwalior', lat: 26.2183, lon: 78.1828 }
        ];
        
        // Calculate distance using Haversine formula
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371; // Radius of Earth in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };
        
        // Find the nearest city
        let nearestCity = 'Mumbai';
        let minDistance = Infinity;
        
        for (const city of majorCities) {
            const distance = calculateDistance(lat, lon, city.lat, city.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city.name;
            }
        }
        
        return nearestCity;
    };
    
    const handleManualSelect = () => {
        if (selectedCity) {
            onLocationChange(selectedCity);
            onClose();
        } else {
            addToast('Please select a city.', 'info');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[101] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Select Your Location</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Prices and availability may vary based on your location.</p>
                    {currentLocation && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">Current: <strong className="text-brand-blue">{currentLocation}</strong></span>
                        </div>
                    )}
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={handleDetectLocation}
                        disabled={isDetecting}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue-lightest text-brand-blue-dark font-bold py-3 px-4 rounded-lg hover:bg-brand-blue-light transition-colors disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isDetecting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-current"></div>
                                <span>Detecting...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                <span>Detect My Location</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center text-xs text-gray-400">
                        <span className="flex-grow border-t dark:border-gray-600"></span>
                        <span className="px-4">OR</span>
                        <span className="flex-grow border-t dark:border-gray-600"></span>
                    </div>

                    <p className="text-sm font-semibold text-center text-gray-700 dark:text-gray-300">Select your location manually</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                            <select id="state-select" value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedCity(''); }} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-brand-gray-700">
                                <option value="" disabled>Select a state</option>
                                {INDIAN_STATES.map(state => <option key={state.code} value={state.code}>{state.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                            <select id="city-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState || availableCities.length === 0} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-brand-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600">
                                <option value="" disabled>Select a city</option>
                                {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-brand-gray-darker px-6 py-4 flex justify-end gap-4 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleManualSelect} disabled={!selectedCity} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark disabled:opacity-50">Set Location</button>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
