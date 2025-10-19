import React, { memo } from 'react';
import type { Vehicle } from '../types';
import VehicleCard from './VehicleCard';
import VirtualizedVehicleList from './VirtualizedVehicleList';

interface DashboardListingsProps {
  sellerVehicles: Vehicle[];
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
  onMarkAsSold: (vehicleId: number) => void;
  onFeatureListing: (vehicleId: number) => void;
  onRequestCertification: (vehicleId: number) => void;
  onViewSellerProfile: (sellerEmail: string) => void;
  comparisonList: number[];
  onToggleCompare: (vehicleId: number) => void;
  wishlist: number[];
  onToggleWishlist: (vehicleId: number) => void;
}

const DashboardListings: React.FC<DashboardListingsProps> = memo(({
  sellerVehicles,
  onEditVehicle,
  onDeleteVehicle,
  onMarkAsSold,
  onFeatureListing,
  onRequestCertification,
  onViewSellerProfile,
  comparisonList,
  onToggleCompare,
  wishlist,
  onToggleWishlist
}) => {
  const activeVehicles = sellerVehicles.filter(v => v.status === 'published');
  const soldVehicles = sellerVehicles.filter(v => v.status === 'sold');

  return (
    <div className="space-y-6">
      {/* Active Listings */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-spinny-text-dark dark:text-spinny-text-dark">
            Active Listings ({activeVehicles.length})
          </h2>
        </div>
        
        {activeVehicles.length > 0 ? (
          <VirtualizedVehicleList
            vehicles={activeVehicles}
            onSelectVehicle={onEditVehicle}
            onToggleCompare={onToggleCompare}
            onToggleWishlist={onToggleWishlist}
            comparisonList={comparisonList}
            wishlist={wishlist}
            onViewSellerProfile={onViewSellerProfile}
            height={400}
            itemHeight={200}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No active listings found.</p>
          </div>
        )}
      </div>

      {/* Sold Vehicles */}
      {soldVehicles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-spinny-text-dark dark:text-spinny-text-dark mb-4">
            Sold Vehicles ({soldVehicles.length})
          </h2>
          <VirtualizedVehicleList
            vehicles={soldVehicles}
            onSelectVehicle={onEditVehicle}
            onToggleCompare={onToggleCompare}
            onToggleWishlist={onToggleWishlist}
            comparisonList={comparisonList}
            wishlist={wishlist}
            onViewSellerProfile={onViewSellerProfile}
            height={300}
            itemHeight={200}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-spinny-text-dark dark:text-spinny-text-dark mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {/* Add new vehicle */}}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-spinny-orange transition-colors text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm text-gray-600">Add Vehicle</span>
          </button>
          
          <button
            onClick={() => {/* Bulk upload */}}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-spinny-orange transition-colors text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-gray-600">Bulk Upload</span>
          </button>
          
          <button
            onClick={() => {/* View analytics */}}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-spinny-orange transition-colors text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm text-gray-600">Analytics</span>
          </button>
          
          <button
            onClick={() => {/* Export data */}}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-spinny-orange transition-colors text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-600">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
});

DashboardListings.displayName = 'DashboardListings';

export default DashboardListings;
