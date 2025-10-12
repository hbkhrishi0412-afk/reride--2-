import React, { memo, useCallback } from 'react';
import type { Vehicle } from '../types';

interface VehicleCardOptimizedProps {
  vehicle: Vehicle;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onToggleCompare: (id: number) => void;
  onToggleWishlist: (id: number) => void;
  onViewSellerProfile: (sellerEmail: string) => void;
  comparisonList: number[];
  wishlist: number[];
  isInWishlist: boolean;
  isSelectedForCompare: boolean;
  isCompareDisabled: boolean;
}

const VehicleCardOptimized: React.FC<VehicleCardOptimizedProps> = memo(({
  vehicle,
  onSelectVehicle,
  onToggleCompare,
  onToggleWishlist,
  onViewSellerProfile,
  comparisonList,
  wishlist,
  isInWishlist,
  isSelectedForCompare,
  isCompareDisabled
}) => {
  const handleCompareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompare(vehicle.id);
  }, [vehicle.id, onToggleCompare]);

  const handleWishlistClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(vehicle.id);
  }, [vehicle.id, onToggleWishlist]);

  const handleSellerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewSellerProfile(vehicle.sellerEmail);
  }, [vehicle.sellerEmail, onViewSellerProfile]);

  const handleCardClick = useCallback(() => {
    onSelectVehicle(vehicle);
  }, [vehicle, onSelectVehicle]);

  return (
    <div 
      className="bg-white rounded-xl shadow-soft-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative w-full h-40 sm:h-56 overflow-hidden">
        <img
          src={vehicle.images[0] || '/placeholder-car.jpg'}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {vehicle.isFeatured && (
            <span className="bg-spinny-orange text-white px-2 py-1 rounded text-xs font-semibold">
              Featured
            </span>
          )}
          {vehicle.certificationStatus === 'approved' && (
            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Certified
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={handleWishlistClick}
            className={`p-2 rounded-full transition-colors ${
              isInWishlist 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          <button
            onClick={handleCompareClick}
            disabled={isCompareDisabled}
            className={`p-2 rounded-full transition-colors ${
              isSelectedForCompare
                ? 'bg-spinny-orange text-white'
                : isCompareDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
            aria-label={isSelectedForCompare ? 'Remove from comparison' : 'Add to comparison'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg sm:text-xl font-bold text-brand-gray-800 dark:text-brand-gray-200 line-clamp-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-spinny-orange">
              ₹{vehicle.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-3">
          {vehicle.variant && (
            <div className="mb-1">{vehicle.variant}</div>
          )}
          <div className="flex items-center gap-2">
            <span>{vehicle.fuelType}</span>
            <span>•</span>
            <span>{vehicle.kilometers?.toLocaleString()} km</span>
            <span>•</span>
            <span>{vehicle.location}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-brand-gray-200 dark:bg-brand-gray-700 my-3 sm:my-4"></div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-brand-gray-600 dark:text-brand-gray-400">
          {vehicle.features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-center gap-1">
              <svg className="w-3 h-3 text-spinny-orange" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{feature}</span>
            </div>
          ))}
        </div>

        {/* Seller Info */}
        <div className="flex justify-between items-center mt-4 sm:mt-6">
          <button
            onClick={handleSellerClick}
            className="text-sm text-spinny-orange hover:text-spinny-orange-dark font-medium transition-colors"
          >
            View Seller Profile
          </button>
          <div className="text-xs text-brand-gray-500 dark:text-brand-gray-500">
            {vehicle.views || 0} views
          </div>
        </div>
      </div>
    </div>
  );
});

VehicleCardOptimized.displayName = 'VehicleCardOptimized';

export default VehicleCardOptimized;