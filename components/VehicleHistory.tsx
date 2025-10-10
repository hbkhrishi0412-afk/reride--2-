import React from 'react';
import type { ServiceRecord, AccidentRecord } from '../types';

interface VehicleHistoryProps {
  serviceRecords: ServiceRecord[];
  accidentHistory: AccidentRecord[];
}

const TimelineIcon: React.FC<{ type: 'service' | 'accident' }> = ({ type }) => {
  const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-brand-gray-800";
  if (type === 'service') {
    return (
      <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${baseClasses} bg-red-100 text-red-600`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

const VehicleHistory: React.FC<VehicleHistoryProps> = ({ serviceRecords, accidentHistory }) => {
  const combinedHistory = [
    ...serviceRecords.map(r => ({ ...r, type: 'service' as const })),
    ...accidentHistory.map(r => ({ ...r, type: 'accident' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (combinedHistory.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
        <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Vehicle History</h3>
        <p className="text-center text-brand-gray-500 dark:text-brand-gray-400 py-8">No service or accident history available for this vehicle.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
      <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-6 border-b dark:border-gray-700 pb-2">Vehicle History</h3>
      <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-5">
        {combinedHistory.map((item, index) => (
          <li key={index} className="mb-10 ml-8">
            <span className="absolute -left-5 flex items-center justify-center">
                <TimelineIcon type={item.type} />
            </span>
            <div className="p-4 bg-brand-gray-50 dark:bg-brand-gray-900/50 border border-brand-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <time className="text-sm font-normal leading-none text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    {item.type === 'accident' && <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">{item.severity}</span>}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.type === 'service' ? item.service : 'Accident Reported'}
                </h4>
                <p className="text-base font-normal text-gray-600 dark:text-gray-300">
                    {item.type === 'service' ? `At ${item.mileage.toLocaleString('en-IN')} kms in ${item.location}` : item.description}
                </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default VehicleHistory;