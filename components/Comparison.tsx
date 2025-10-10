import React, { useMemo, useState } from 'react';
import type { Vehicle } from '../types';

interface ComparisonProps {
  vehicles: Vehicle[];
  onBack: () => void;
  onToggleCompare: (id: number) => void;
}

const specFields: (keyof Vehicle)[] = ['price', 'year', 'mileage', 'engine', 'transmission', 'fuelType', 'fuelEfficiency', 'color', 'sellerName', 'city', 'averageRating', 'sellerAverageRating', 'registrationYear', 'noOfOwners', 'displacement'];
const specLabels: Record<keyof Vehicle, string> = {
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage (kms)',
    engine: 'Engine',
    transmission: 'Transmission',
    fuelType: 'Fuel Type',
    fuelEfficiency: 'Fuel Efficiency',
    color: 'Color',
    id: 'ID',
    category: 'Category',
    make: 'Make',
    model: 'Model',
    variant: 'Variant',
    images: 'Images',
    features: 'Features',
    description: 'Description',
    sellerEmail: 'Seller Email',
    sellerName: 'Seller Name',
    city: 'City',
    state: 'State',
    averageRating: 'Vehicle Rating',
    ratingCount: 'Rating Count',
    status: 'Status',
    isFeatured: 'Featured',
    views: 'Views',
    inquiriesCount: 'Inquiries',
    isFlagged: 'Flagged',
    flagReason: 'Flag Reason',
    flaggedAt: 'Flagged At',
    sellerAverageRating: 'Seller Rating',
    sellerRatingCount: 'Seller Rating Count',
    sellerBadges: 'Seller Badges',
    registrationYear: 'Registration Year',
    insuranceValidity: 'Insurance Validity',
    insuranceType: 'Insurance Type',
    rto: 'RTO',
    noOfOwners: 'No. of Owners',
    displacement: 'Displacement',
    groundClearance: 'Ground Clearance',
    bootSpace: 'Boot Space',
    qualityReport: 'Quality Report',
    certifiedInspection: 'Certified Inspection',
    certificationStatus: 'Certification Status',
    videoUrl: 'Video URL',
    serviceRecords: 'Service Records',
    accidentHistory: 'Accident History',
    documents: 'Documents',
};

const CheckIcon: React.FC = () => (
    <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const XIcon: React.FC = () => (
    <svg className="w-6 h-6 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);


const Comparison: React.FC<ComparisonProps> = ({ vehicles, onBack: onBackToHome, onToggleCompare }) => {
  const [highlightDiffs, setHighlightDiffs] = useState(true);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg">
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">Vehicle Comparison</h2>
        <p className="mt-4 text-brand-gray-600 dark:text-brand-gray-300">You haven't selected any vehicles to compare yet.</p>
        <p className="text-brand-gray-500 dark:text-brand-gray-400">Go to the listings to add up to 4 vehicles.</p>
        <button onClick={onBackToHome} className="mt-6 bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark transition-colors">
          &larr; Back to Listings
        </button>
      </div>
    );
  }

  // Find best values
  const minPrice = Math.min(...vehicles.map(v => v.price));
  const minMileage = Math.min(...vehicles.map(v => v.mileage));
  const maxYear = Math.max(...vehicles.map(v => v.year));
  const maxAverageRating = Math.max(...vehicles.map(v => v.averageRating || 0));
  const maxSellerAverageRating = Math.max(...vehicles.map(v => v.sellerAverageRating || 0));

  const isBestValue = (key: keyof Vehicle, value: number) => {
    if (key === 'price' && value === minPrice) return true;
    if (key === 'mileage' && value === minMileage) return true;
    if (key === 'year' && value === maxYear) return true;
    if (key === 'averageRating' && value > 0 && value === maxAverageRating) return true;
    if (key === 'sellerAverageRating' && value > 0 && value === maxSellerAverageRating) return true;
    return false;
  }
  
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    vehicles.forEach(v => {
        v.features.forEach(feature => featureSet.add(feature));
    });
    return Array.from(featureSet).sort();
  }, [vehicles]);

  const areValuesDifferent = (key: keyof Vehicle) => {
      if (vehicles.length <= 1) return false;
      const firstValue = JSON.stringify(vehicles[0][key]);
      return vehicles.slice(1).some(v => JSON.stringify(v[key]) !== firstValue);
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-soft-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">Compare Vehicles</h1>
            <button onClick={onBackToHome} className="text-sm font-medium text-brand-blue hover:underline mt-1">
                &larr; Back to Listings
            </button>
        </div>
        <div className="flex items-center space-x-3 bg-brand-gray-100 dark:bg-brand-gray-700 p-2 rounded-lg">
          <label htmlFor="highlight-toggle" className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200">Highlight Differences</label>
          <button onClick={() => setHighlightDiffs(!highlightDiffs)} id="highlight-toggle" className={`${highlightDiffs ? 'bg-brand-blue' : 'bg-brand-gray-300 dark:bg-brand-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}>
              <span className={`${highlightDiffs ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-brand-gray-300 dark:border-brand-gray-600">
              <th className="text-left font-bold text-lg text-brand-gray-700 p-4 sticky left-0 bg-white dark:bg-brand-gray-800 z-10">Feature</th>
              {vehicles.map(vehicle => (
                <th key={vehicle.id} className="p-4 min-w-[220px]">
                  <img src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-40 object-cover rounded-lg mb-2" />
                  <h3 className="font-bold text-lg dark:text-brand-gray-100">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.variant || ''}</h3>
                  <button onClick={() => onToggleCompare(vehicle.id)} className="mt-2 text-sm text-red-500 hover:text-red-700">Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specFields.map((key) => {
              const hasDifference = areValuesDifferent(key);
              return (
                <tr key={String(key)} className="border-b border-brand-gray-200 dark:border-brand-gray-700">
                  <td className="font-semibold text-brand-gray-600 dark:text-brand-gray-300 p-4 sticky left-0 bg-white dark:bg-brand-gray-800 z-10">{specLabels[key]}</td>
                  {vehicles.map(vehicle => {
                    let value = vehicle[key];
                    if (key === 'city') {
                        value = `${vehicle.city}, ${vehicle.state}`;
                    }

                    const isBest = typeof value === 'number' && isBestValue(key, value);
                    const cellClass = highlightDiffs && hasDifference ? 'bg-brand-blue-lightest/50 dark:bg-brand-blue/10' : '';
                    return (
                      <td key={`${vehicle.id}-${String(key)}`} className={`p-4 text-center dark:text-brand-gray-200 transition-colors ${cellClass} ${isBest ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                         <span className={`inline-flex items-center gap-2 ${isBest ? 'font-bold text-green-700 dark:text-green-300' : ''}`}>
                            {(() => {
                                if (value === undefined || value === null) return '-';
                                if (key === 'averageRating' || key === 'sellerAverageRating') {
                                    const countKey = key === 'averageRating' ? 'ratingCount' : 'sellerRatingCount';
                                    const count = vehicle[countKey] || 0;
                                    const rating = typeof value === 'number' ? value : 0;
                                    if (rating === 0) return 'N/A';
                                    return `${rating.toFixed(1)} (${count})`;
                                }
                                if (typeof value === 'number') {
                                    if (key === 'price') return `₹${value.toLocaleString('en-IN')}`;
                                    return value.toLocaleString('en-IN');
                                }
                                return String(value);
                            })()}
                            {isBest && <span className="text-xs font-semibold bg-green-200 text-green-900 px-2 py-0.5 rounded-full">Best</span>}
                         </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr className="h-4"></tr>
            <tr>
              <td colSpan={vehicles.length + 1} className="pt-6 pb-2">
                 <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 border-b-2 border-brand-gray-300 dark:border-brand-gray-600 pb-2">Features</h2>
              </td>
            </tr>
            {allFeatures.map((feature) => {
              const hasDifference = areValuesDifferent('features');
              return (
                 <tr key={feature} className="border-b border-brand-gray-200 dark:border-brand-gray-700">
                     <td className="font-semibold text-brand-gray-600 dark:text-brand-gray-300 p-4 sticky left-0 bg-white dark:bg-brand-gray-800 z-10">{feature}</td>
                     {vehicles.map(vehicle => (
                        <td key={`${vehicle.id}-${feature}`} className={`p-4 transition-colors ${highlightDiffs && hasDifference ? 'bg-brand-blue-lightest/50 dark:bg-brand-blue/10' : ''}`}>
                            {vehicle.features.includes(feature) ? <CheckIcon /> : <XIcon />}
                        </td>
                     ))}
                 </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Comparison;