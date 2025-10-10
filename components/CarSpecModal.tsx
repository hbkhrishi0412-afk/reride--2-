import React, { useEffect } from 'react';
import type { NewCarModel, NewCarVariant } from '../data/newCarsData';

interface CarSpecModalProps {
    car: NewCarModel;
    variant: NewCarVariant;
    onClose: () => void;
}

const SpecSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-2 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-1">
            {title}
        </h3>
        {children}
    </div>
);

const SpecDetail: React.FC<{ label: string, value: string | number | undefined }> = ({ label, value }) => (
    <div className="flex justify-between py-1.5 px-2 rounded hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
        <dt className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{label}</dt>
        <dd className="text-sm font-semibold text-brand-gray-900 dark:text-brand-gray-200 text-right">{value || '-'}</dd>
    </div>
);

const FeatureList: React.FC<{ features: string[] }> = ({ features }) => {
    if (features.length === 0) {
        return <p className="text-sm text-brand-gray-500 italic">No features listed for this category.</p>;
    }
    return (
        <ul className="list-disc list-inside space-y-1 text-sm text-brand-gray-700 dark:text-brand-gray-300">
            {features.map(feature => <li key={feature}>{feature}</li>)}
        </ul>
    );
};

const CarSpecModal: React.FC<CarSpecModalProps> = ({ car, variant, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEsc);

        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
                            {car.brand_name} {car.model_name}
                        </h2>
                        <p className="text-md text-brand-gray-600 dark:text-brand-gray-300">{variant.variant_name}</p>
                    </div>
                    <button onClick={onClose} className="text-brand-gray-400 hover:text-brand-gray-800 dark:hover:text-white text-3xl">&times;</button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-6">
                             <SpecSection title="Key Specifications">
                                <dl>
                                    <SpecDetail label="Engine" value={variant.engine_specs} />
                                    <SpecDetail label="Power" value={variant.power_bhp} />
                                    <SpecDetail label="Torque" value={variant.torque_nm} />
                                    <SpecDetail label="Mileage" value={car.key_specs.mileage} />
                                    <SpecDetail label="Transmission" value={variant.transmission} />
                                    <SpecDetail label="Fuel Type" value={variant.fuel_type} />
                                </dl>
                            </SpecSection>
                             <SpecSection title="Dimensions & Capacity">
                                <dl>
                                    <SpecDetail label="Seating Capacity" value={`${car.key_specs.seating_capacity} Seater`} />
                                    <SpecDetail label="Boot Space" value={car.key_specs.boot_space_litres ? `${car.key_specs.boot_space_litres} litres` : 'N/A'} />
                                </dl>
                            </SpecSection>
                             <SpecSection title="Safety Features">
                                <FeatureList features={variant.features.safety} />
                            </SpecSection>
                              <SpecSection title="Interior Features">
                                <FeatureList features={variant.features.interior} />
                            </SpecSection>
                        </div>
                        {/* Column 2 */}
                        <div className="space-y-6">
                            <SpecSection title="Comfort & Convenience">
                                <FeatureList features={variant.features.comfort_convenience} />
                            </SpecSection>
                             <SpecSection title="Exterior Features">
                                <FeatureList features={variant.features.exterior} />
                            </SpecSection>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarSpecModal;