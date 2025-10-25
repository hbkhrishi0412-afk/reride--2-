import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';

interface SellerDropdownProps {
  allVehicles: Vehicle[];
  onCitySelect: (city: string) => void;
  onSellOnline: () => void;
  onSellScrapCar: () => void;
}

const SellerDropdown: React.FC<SellerDropdownProps> = ({ 
  allVehicles, 
  onCitySelect, 
  onSellOnline, 
  onSellScrapCar 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  // Extract unique cities from vehicles data
  useEffect(() => {
    const uniqueCities = Array.from(
      new Set(
        allVehicles
          .filter(vehicle => vehicle.status === 'published' && vehicle.city)
          .map(vehicle => vehicle.city)
      )
    ).sort();

    setCities(uniqueCities);
  }, [allVehicles]);

  const handleCityClick = (city: string) => {
    onCitySelect(city);
    setIsOpen(false);
  };

  const handleSellOnlineClick = () => {
    onSellOnline();
    setIsOpen(false);
  };

  const handleScrapCarClick = () => {
    onSellScrapCar();
    setIsOpen(false);
  };

  // Split cities into two columns
  const midPoint = Math.ceil(cities.length / 2);
  const leftColumnCities = cities.slice(0, midPoint);
  const rightColumnCities = cities.slice(midPoint);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-1"
      >
        Sell Car
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl shadow-2xl border border-purple-700 z-20 overflow-hidden">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-2">
                  <button
                    onClick={handleSellOnlineClick}
                    className="w-full text-left px-3 py-2 text-white font-semibold hover:bg-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-between"
                  >
                    Sell Car Online
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {leftColumnCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCityClick(city)}
                      className="w-full text-left px-3 py-2 text-white hover:bg-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-between"
                    >
                      Sell cars in {city}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  {rightColumnCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCityClick(city)}
                      className="w-full text-left px-3 py-2 text-white hover:bg-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-between"
                    >
                      Sell cars in {city}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                  
                  {/* Scrap Car Option */}
                  <button
                    onClick={handleScrapCarClick}
                    className="w-full text-left px-3 py-2 text-white hover:bg-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-between"
                  >
                    Sell Scrap Car
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SellerDropdown;
