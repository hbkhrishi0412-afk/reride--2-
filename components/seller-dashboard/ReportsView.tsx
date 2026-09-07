import React, { memo } from 'react';
import type { Vehicle } from '../../types';

export const ReportsView: React.FC<{
    reportedVehicles: Vehicle[];
    onEditVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (vehicleId: number) => void;
}> = memo(({ reportedVehicles, onEditVehicle, onDeleteVehicle }) => {
    // Create safe version locally within this component
    const safeReportedVehicles = reportedVehicles || [];
    
    return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-reride-text-dark mb-6">Reported Listings</h2>
        {safeReportedVehicles.length > 0 ? (
            <div className="space-y-4">
                {safeReportedVehicles.map(v => (
                    <div key={v.id} className="border border-gray-200 dark:border-gray-200 bg-reride-blue-light dark:bg-reride-blue/20 p-4 rounded-lg">
                        <h3 className="font-bold text-reride-text-dark">{v.year} {v.make} {v.model}</h3>
                        <p className="text-sm text-reride-text-dark mt-1">Reported on: {v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'N/A'}</p>
                        <p className="mt-2 text-sm italic text-reride-text-dark">Reason: "{v.flagReason || 'No reason provided.'}"</p>
                        <p className="text-xs text-reride-text-dark mt-2">An administrator will review this report. You can edit the listing to correct any issues or delete it if it's no longer valid.</p>
                        <div className="mt-3 space-x-4">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditVehicle(v);
                                }} 
                                className="font-semibold text-sm hover:underline transition-colors cursor-pointer" 
                                style={{ color: '#FF6B35' }} 
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--reride-blue)'} 
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--reride-orange)'}
                            > 
                                Edit Listing
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDeleteVehicle(v.id);
                                }} 
                                className="text-reride-orange font-semibold text-sm hover:underline cursor-pointer"
                            >
                                Delete Listing
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-center py-16 px-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-reride-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="mt-2 text-xl font-semibold text-reride-text-dark">All Clear!</h3>
                <p className="mt-1 text-sm text-reride-text-dark">You have no reported listings at this time.</p>
            </div>
        )}
    </div>
    );
});
