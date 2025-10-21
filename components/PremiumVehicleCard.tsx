import React from 'react';
import type { Vehicle } from '../types';
import { getFirstValidImage } from '../utils/imageUtils';
import StarRating from './StarRating';

interface PremiumVehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  onToggleWishlist: (id: number) => void;
  isInWishlist: boolean;
  onToggleCompare?: (id: number) => void;
  isInCompare?: boolean;
  compact?: boolean;
}

/**
 * Premium Vehicle Card Component
 * Modern, app-like design with depth, shadows, and smooth animations
 */
const PremiumVehicleCard: React.FC<PremiumVehicleCardProps> = ({
  vehicle,
  onSelect,
  onToggleWishlist,
  isInWishlist,
  onToggleCompare,
  isInCompare,
  compact = false
}) => {
  const imageUrl = getFirstValidImage(vehicle.images);
  const formatPrice = (price: number) => `₹${(price / 100000).toFixed(2)}L`;

  return (
    <div
      onClick={() => onSelect(vehicle)}
      className="relative group cursor-pointer transition-all duration-300"
      style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
      }}
    >
      {/* Image Container with Gradient Overlay */}
      <div className="relative" style={{ aspectRatio: compact ? '16/10' : '16/11' }}>
        <img
          src={imageUrl}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Premium Gradient Overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)'
          }}
        />

        {/* Verified Badge */}
        {vehicle.isCertified && (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full flex items-center gap-1 text-white text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Certified</span>
          </div>
        )}

        {/* Featured Badge */}
        {vehicle.isFeatured && (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full flex items-center gap-1 text-white text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #EC4899 100%)',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.4)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Featured</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(vehicle.id);
            }}
            className="p-2 rounded-full transition-all active:scale-95"
            style={{
              background: isInWishlist 
                ? 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: isInWishlist 
                ? '0 4px 12px rgba(255, 107, 53, 0.4)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <svg
              className="w-5 h-5 transition-all"
              style={{ color: isInWishlist ? 'white' : '#64748B' }}
              fill={isInWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Compare Button */}
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(vehicle.id);
              }}
              className="p-2 rounded-full transition-all active:scale-95"
              style={{
                background: isInCompare
                  ? 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: isInCompare
                  ? '0 4px 12px rgba(99, 102, 241, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: isInCompare ? 'white' : '#64748B' }}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Quick Stats Overlay (on hover) */}
        <div
          className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
            backdropFilter: 'blur(10px)',
            transform: 'translateY(100%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>Quick View</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{vehicle.year}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className={`p-${compact ? '3' : '4'}`}>
        {/* Title & Rating */}
        <div className="mb-2">
          <h3 
            className="font-bold text-base mb-1 truncate"
            style={{ color: '#0F172A' }}
          >
            {vehicle.year} {vehicle.make}
          </h3>
          <p 
            className="text-sm font-medium truncate"
            style={{ color: '#64748B' }}
          >
            {vehicle.model} {vehicle.variant}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: '#64748B' }}>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{vehicle.mileage || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{vehicle.kmDriven?.toLocaleString()} km</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{vehicle.location}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div 
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #FF6B35 0%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {formatPrice(vehicle.price)}
            </div>
            {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
              <div className="text-xs line-through" style={{ color: '#94A3B8' }}>
                ₹{(vehicle.originalPrice / 100000).toFixed(2)}L
              </div>
            )}
          </div>
          
          <button
            className="px-4 py-2 rounded-full text-white text-sm font-bold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(vehicle);
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumVehicleCard;

