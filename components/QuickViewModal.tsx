import React, { useState, useEffect, memo } from 'react';
import type { Vehicle } from '../types';
import { getFirstValidImage, getValidImages, getSafeImageSrc } from '../utils/imageUtils';

// KeySpec component copied for reuse
const KeySpec: React.FC<{ label: string; value: string | number; }> = memo(({ label, value }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-200-100 dark:border-gray-200-200">
        <span className="text-sm font-medium text-brand-gray-600 dark:text-spinny-text">{label}</span>
        <span className="font-bold text-spinny-text-dark dark:text-spinny-text-dark text-right">{value}</span>
    </div>
));

interface QuickViewModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onToggleCompare: (id: number) => void;
  onToggleWishlist: (id: number) => void;
  comparisonList: number[];
  wishlist: number[];
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ vehicle, onClose, onSelectVehicle, onToggleCompare, onToggleWishlist, comparisonList, wishlist }) => {
  const [mainImage, setMainImage] = useState(() => vehicle ? getFirstValidImage(vehicle.images) : '');

  useEffect(() => {
    if (vehicle) {
      setMainImage(getFirstValidImage(vehicle.images));
    } else {
      setMainImage('');
    }
  }, [vehicle]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!vehicle) {
    return null;
  }

  console.log('QuickViewModal rendering for vehicle:', vehicle.id, vehicle.make, vehicle.model);
  console.log('Vehicle data:', {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    price: vehicle.price,
    images: vehicle.images,
    imagesLength: vehicle.images?.length
  });

  const isComparing = comparisonList.includes(vehicle.id);
  const isInWishlist = wishlist.includes(vehicle.id);
  const isCompareDisabled = !isComparing && comparisonList.length >= 4;

  const handleFullDetailsClick = () => {
    console.log('🔧 QuickViewModal: View Full Details clicked for vehicle:', vehicle.id, vehicle.make, vehicle.model);
    
    // Store vehicle in sessionStorage as backup to prevent state loss
    try {
      sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
      console.log('🔧 QuickViewModal: Vehicle stored in sessionStorage as backup');
    } catch (error) {
      console.warn('🔧 QuickViewModal: Failed to store vehicle in sessionStorage:', error);
    }
    
    // Call onSelectVehicle to set the state and navigate to DETAIL view
    onSelectVehicle(vehicle);
    
    // Close modal after setting state and triggering navigation
    console.log('🔧 QuickViewModal: Closing modal after state commit and navigation');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-white md:text-spinny-text bg-black/30 md:bg-transparent rounded-full w-8 h-8 flex items-center justify-center hover:text-spinny-text-dark dark:hover:text-white z-10 text-2xl">&times;</button>
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 p-4 flex flex-col">
          <img src={getSafeImageSrc(mainImage)} alt={`${vehicle.make || 'Vehicle'} ${vehicle.model || ''}`} className="w-full h-64 md:h-auto object-cover rounded-lg flex-grow" />
          {vehicle.images && vehicle.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-2">
              {getValidImages(vehicle.images).slice(0, 5).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`cursor-pointer rounded-md border-2 h-16 w-full object-cover ${mainImage === img ? '' : 'border-transparent'} transition`} style={mainImage === img ? { bordercolor: '#FF6B35' } : undefined} onMouseEnter={(e) => mainImage !== img && (e.currentTarget.style.borderColor = 'var(--spinny-blue)')} onMouseLeave={(e) => mainImage !== img && (e.currentTarget.style.borderColor = '')}
                  onClick={() => setMainImage(img)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <div>
            <h2 className="text-3xl font-bold text-spinny-text-dark dark:text-spinny-text-dark">{vehicle.year || 'N/A'} {vehicle.make || 'Vehicle'} {vehicle.model || ''}</h2>
            <p className="text-spinny-text dark:text-spinny-text">{vehicle.variant || ''}</p>
            <p className="text-3xl font-extrabold my-4" style={{ color: '#FF6B35' }}>₹{vehicle.price ? vehicle.price.toLocaleString('en-IN') : 'N/A'}</p>
          </div>

          <div className="space-y-2 my-4">
            <KeySpec label="Mileage" value={`${vehicle.mileage ? vehicle.mileage.toLocaleString('en-IN') : 'N/A'} kms`} />
            <KeySpec label="Fuel Type" value={vehicle.fuelType || 'N/A'} />
            <KeySpec label="Transmission" value={vehicle.transmission || 'N/A'} />
            <KeySpec label="Registration Year" value={vehicle.registrationYear || 'N/A'} />
            <KeySpec label="No. of Owners" value={vehicle.noOfOwners || 'N/A'} />
          </div>

          <div className="mt-auto pt-6 space-y-3">
             <button onClick={handleFullDetailsClick} className="w-full btn-brand-primary text-white font-bold py-3 px-6 rounded-lg text-lg transition-all transform hover:scale-105">
                View Full Details
            </button>
            <div className="flex gap-3">
                <button
                    onClick={() => onToggleWishlist(vehicle.id)}
                    className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all flex items-center justify-center gap-2 ${isInWishlist ? 'bg-spinny-blue text-spinny-orange' : 'bg-spinny-light-gray dark:bg-brand-gray-700'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    Wishlist
                </button>
                 <button
                    onClick={() => onToggleCompare(vehicle.id)}
                    disabled={isCompareDisabled}
                    className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all ${isComparing ? 'bg-spinny-orange text-spinny-orange' : 'bg-spinny-light-gray dark:bg-brand-gray-700'} ${isCompareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Compare
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
