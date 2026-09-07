import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Vehicle, User, VehicleData } from '../../types';
import { VehicleCategory } from '../../types';
import { enhanceVehicleListing } from '../../services/listingEnhancementService';
import { getSafeImageSrc } from '../../utils/imageUtils';
import { logInfo } from '../../utils/logger.js';
import { CLIENT_POLL_INTERVALS_MS } from '../../utils/clientPolling.js';
import {
  clearChecklistPhotoByUrl,
  extractChecklistGalleryUrls,
  getExtraGalleryImages,
  mergeListingImages,
  syncDocumentsFromChecklist,
} from '../../lib/universalChecklist/mediaSync';
import { verifyVahanRegistration, applyVahanVerifyToVehicleFields } from '../../services/vehicleTrustService';
import { getPlaceholderImage } from '../vehicleData';
import PricingGuidance from '../PricingGuidance';
import SellerDisclosureForm from '../SellerDisclosureForm';
import ListingTrustProgress from '../ListingTrustProgress';
import VehicleCard from '../VehicleCard';
import { VehicleOfferBanner } from '../VehicleOfferBanner';
import { isSellerListingOfferVisible } from '../../utils/vehicleOffer';
import { dashboardNotify, type DashboardNotifyFn } from './notify';
import { initialFormState } from './initialFormState';
import { FormFieldset } from './FormFieldset';
import { FormInput } from './FormInput';
import { ComboboxInput } from './ComboboxInput';
import { PremiumPreviewPlaceholder } from './PremiumPreviewPlaceholder';

export interface VehicleFormProps {
    seller: User;
    editingVehicle: Vehicle | null;
    allVehicles: Vehicle[];
    onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => void | Promise<void>;
    onUpdateVehicle: (vehicle: Vehicle) => void | Promise<void>;
    onFeatureListing: (vehicleId: number) => Promise<void>;
    onCancel: () => void;
    vehicleData: VehicleData;
    onNotify?: DashboardNotifyFn;
}

export const VehicleForm: React.FC<VehicleFormProps> = memo(({ editingVehicle, onAddVehicle, onUpdateVehicle, onCancel, vehicleData, seller, onFeatureListing: _onFeatureListing, allVehicles, onNotify }) => {
    void _onFeatureListing;
    const { t } = useTranslation();
    const notify = useCallback(
      (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') =>
        dashboardNotify(onNotify, message, type),
      [onNotify],
    );
    const [formData, setFormData] = useState(editingVehicle ? { 
        ...initialFormState, 
        ...editingVehicle, 
        sellerEmail: editingVehicle.sellerEmail,
        sellerName: editingVehicle.sellerName || seller.name || seller.dealershipName || 'Seller'
    } : { 
        ...initialFormState, 
        sellerEmail: seller.email,
        sellerName: seller.name || seller.dealershipName || 'Seller'
    });
    

    // Safety check for vehicleData
    const safeVehicleData = useMemo(() => {
        if (!vehicleData || Object.keys(vehicleData).length === 0) {
            console.warn('⚠️ VehicleData is empty or undefined, using fallback');
            // Use a minimal fallback structure
            return {
                'four-wheeler': [
                    { name: 'Maruti Suzuki', models: [{ name: 'Swift', variants: ['LXI', 'VXI', 'ZXI'] }] },
                    { name: 'Hyundai', models: [{ name: 'i20', variants: ['Magna', 'Sportz', 'Asta'] }] }
                ],
                'two-wheeler': [
                    { name: 'Honda', models: [{ name: 'Activa', variants: ['Standard', 'Deluxe'] }] },
                    { name: 'Bajaj', models: [{ name: 'Pulsar', variants: ['150', '180', '220'] }] }
                ]
            };
        }
        return vehicleData;
    }, [vehicleData]);
    
    // Location data state for this component
    const [indianStates, setIndianStates] = useState<Array<{name: string, code: string}>>([]);
    const [citiesByState, setCitiesByState] = useState<Record<string, string[]>>({});
    
    const [featureInput, setFeatureInput] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, string>>>({});
    // Real-time update state for expiry dates
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Real-time expiry date updates - update every minute (UI only, no API)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, CLIENT_POLL_INTERVALS_MS.uiClock);

        return () => clearInterval(interval);
    }, []);
    const [isUploading, setIsUploading] = useState(false);
    
    // Ensure seller email is always set in form data
    useEffect(() => {
        if (!formData.sellerEmail && seller.email) {
            setFormData(prev => ({ ...prev, sellerEmail: seller.email }));
        }
    }, [seller.email, formData.sellerEmail]);

    // Load location data when component mounts
    useEffect(() => {
        const loadLocationData = async () => {
            try {
                const { loadLocationData } = await import('../../utils/dataLoaders');
                const locationData = await loadLocationData();
                setIndianStates(locationData.INDIAN_STATES || []);
                setCitiesByState(locationData.CITIES_BY_STATE || {});
            } catch (error) {
                console.error('Failed to load location data:', error);
            }
        };
        loadLocationData();
    }, []);

    const availableMakes = useMemo(() => {
        try {
            if (!formData.category || !safeVehicleData || !safeVehicleData[formData.category]) {
                return [];
            }
            
            const categoryData = safeVehicleData[formData.category];
            if (!Array.isArray(categoryData)) {
                return [];
            }
            
            const makes = categoryData
                .map(make => make?.name)
                .filter((name): name is string => typeof name === 'string' && name.length > 0)
                .sort();
            return makes;
        } catch (error) {
            console.error('Error calculating availableMakes:', error);
            return [];
        }
    }, [formData.category, safeVehicleData]);

    const availableModels = useMemo(() => {
        try {
            if (!formData.category || !formData.make || !safeVehicleData || !safeVehicleData[formData.category]) {
                return [];
            }
            
            const categoryData = safeVehicleData[formData.category];
            if (!Array.isArray(categoryData)) {
                return [];
            }
            
            const makeData = categoryData.find(m => m?.name === formData.make);
            if (!makeData || !Array.isArray(makeData.models)) {
                return [];
            }
            
            return makeData.models
                .map(model => model?.name)
                .filter((name): name is string => typeof name === 'string' && name.length > 0)
                .sort();
        } catch (error) {
            console.error('Error calculating availableModels:', error);
            return [];
        }
    }, [formData.category, formData.make, safeVehicleData]);

    const availableVariants = useMemo(() => {
        try {
            if (!formData.category || !formData.make || !formData.model || !safeVehicleData || !safeVehicleData[formData.category]) {
                return [];
            }
            
            const categoryData = safeVehicleData[formData.category];
            if (!Array.isArray(categoryData)) {
                return [];
            }
            
            const makeData = categoryData.find(m => m?.name === formData.make);
            if (!makeData || !Array.isArray(makeData.models)) {
                return [];
            }
            
            const modelData = makeData.models.find(m => m?.name === formData.model);
            if (!modelData || !Array.isArray(modelData.variants)) {
                return [];
            }
            
            return modelData.variants
                .filter((variant): variant is string => typeof variant === 'string' && variant.length > 0)
                .sort();
        } catch (error) {
            console.error('Error calculating availableVariants:', error);
            return [];
        }
    }, [formData.category, formData.make, formData.model, safeVehicleData]);

    const availableCities = useMemo(() => {
        if (!formData.state || !citiesByState || !citiesByState[formData.state]) return [];
        return citiesByState[formData.state].sort();
    }, [formData.state, citiesByState]);

    // Check if vehicle data is available for the selected category
    const hasVehicleData = useMemo(() => {
        return formData.category && vehicleData[formData.category] && vehicleData[formData.category].length > 0;
    }, [formData.category, vehicleData]);

    const validateField = (name: keyof Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, value: any): string => {
      switch(name) {
          case 'make': case 'model': return value.trim().length < 2 ? `${name} must be at least 2 characters long.` : '';
          case 'year': {
              const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
              return isNaN(numValue) || numValue < 1900 || numValue > new Date().getFullYear() + 1 ? 'Please enter a valid year.' : '';
          }
          case 'price': {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              return isNaN(numValue) || numValue <= 0 ? 'Price must be greater than 0.' : '';
          }
          case 'mileage': {
              const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
              return isNaN(numValue) || numValue < 0 ? 'Mileage cannot be negative.' : '';
          }
          default: return '';
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target as { name: keyof typeof initialFormState; value: string };
      
      // Store as string during editing, parse only on blur
      setFormData(prev => {
        const newState = { ...prev, [name]: value };
        if (name === 'category') {
            newState.make = ''; newState.model = ''; newState.variant = '';
        } else if (name === 'make') {
            newState.model = ''; newState.variant = '';
        } else if (name === 'model') {
            newState.variant = '';
        } else if (name === 'state') {
            newState.city = '';
        }
        return newState;
      });

      // Clear error when user starts typing
      setErrors(prev => ({...prev, [name]: ''}));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target as { name: keyof typeof initialFormState; value: string };
      const isNumeric = ['year', 'price', 'mileage', 'noOfOwners', 'registrationYear'].includes(name);
      
      // Parse numeric fields only when user finishes editing
      if (isNumeric && value !== '') {
        const num = name === 'price' ? parseFloat(value) : parseInt(value, 10);
        if (!isNaN(num)) {
          setFormData(prev => ({ ...prev, [name]: num }));
          const error = validateField(name, num);
          setErrors(prev => ({...prev, [name]: error}));
        }
      }
    };

    const handleAddFeature = () => {
      if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
        setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
        setFeatureInput('');
      }
    };
  
    const handleRemoveFeature = (featureToRemove: string) => {
      setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        if (!input.files) return;

        setIsUploading(true);
        const files = Array.from(input.files);
        
        try {
            // Import image upload service
            const { uploadImages, validateImageFile } = await import('../../services/imageUploadService');
            
            // Validate all files first
            for (const file of files) {
                const validation = validateImageFile(file);
                if (!validation.valid) {
                    notify(validation.error || 'Invalid image file');
                    setIsUploading(false);
                    if (input) input.value = '';
                    return;
                }
            }
            
            // Upload images to cloud storage (or convert to base64 if not configured)
            // Pass seller email for ownership tracking
            const uploadResults = await uploadImages(files, 'vehicles', seller?.email);
            
            // Check for upload errors
            const failedUploads = uploadResults.filter(r => !r.success);
            if (failedUploads.length > 0) {
                const errorMessage = failedUploads.map(r => r.error).join(', ');
                console.error('❌ Image upload failed:', errorMessage);
                notify(`Failed to upload ${failedUploads.length} file(s): ${errorMessage}`);
                setIsUploading(false);
                if (input) input.value = '';
                return;
            }
            
            // Get successful upload URLs
            const successfulUrls = uploadResults
                .filter(r => r.success && r.url)
                .map(r => r.url!);
            
            if (successfulUrls.length > 0) {
                // Limit total images to prevent vehicle object from becoming too large
                // Firebase Realtime Database has 16MB limit per node
                const currentImages = formData.images || [];
                const maxImages = 10; // Limit to 10 images per vehicle
                const remainingSlots = maxImages - currentImages.length;
                
                if (remainingSlots <= 0) {
                    notify(`Maximum ${maxImages} images allowed per vehicle. Please remove some images before adding more.`);
                    setIsUploading(false);
                    if (input) input.value = '';
                    return;
                }
                
                const imagesToAdd = successfulUrls.slice(0, remainingSlots);
                if (successfulUrls.length > remainingSlots) {
                    notify(`Only ${remainingSlots} image(s) added. Maximum ${maxImages} images allowed per vehicle.`);
                }
                
                setFormData(prev => ({ ...prev, images: [...prev.images, ...imagesToAdd] }));
                logInfo(`✅ Successfully uploaded ${imagesToAdd.length} image(s) (${currentImages.length + imagesToAdd.length}/${maxImages} total)`);
            } else {
                console.warn('⚠️ No images were successfully uploaded');
                notify('No images were uploaded. Please try again.');
            }
        } catch (error) { 
            console.error("Error uploading files:", error);
            notify('Failed to upload files. Please try again.');
        } 
        finally {
            setIsUploading(false);
            if (input) input.value = '';
        }
    };
  
    const handleRemoveImageUrl = (urlToRemove: string) => {
      setFormData((prev) => {
        const clearedChecklist = clearChecklistPhotoByUrl(prev.sellerDisclosureChecklist, urlToRemove);
        const checklistUrls = extractChecklistGalleryUrls(clearedChecklist);
        const extras = getExtraGalleryImages(
          clearedChecklist,
          (prev.images || []).filter((url) => url !== urlToRemove),
        );
        return {
          ...prev,
          sellerDisclosureChecklist: clearedChecklist,
          images: mergeListingImages(checklistUrls, extras),
          documents: syncDocumentsFromChecklist(clearedChecklist, prev.documents || []),
        };
      });
    };

    const handleChecklistChange = (checklist: NonNullable<typeof formData.sellerDisclosureChecklist>) => {
      setFormData((prev) => {
        const checklistUrls = extractChecklistGalleryUrls(checklist);
        const extras = getExtraGalleryImages(prev.sellerDisclosureChecklist, prev.images || []);
        return {
          ...prev,
          sellerDisclosureChecklist: checklist,
          images: mergeListingImages(checklistUrls, extras),
          documents: syncDocumentsFromChecklist(checklist, prev.documents || []),
        };
      });
    };


    const checklistGalleryUrls = useMemo(
      () => extractChecklistGalleryUrls(formData.sellerDisclosureChecklist),
      [formData.sellerDisclosureChecklist],
    );
    const extraGalleryImages = useMemo(
      () => getExtraGalleryImages(formData.sellerDisclosureChecklist, formData.images || []),
      [formData.sellerDisclosureChecklist, formData.images],
    );
  
    // Determine if seller's plan is expired (client-side UX guard; server still enforces)
    // Use currentTime for real-time updates
    const isPlanExpired = !!seller?.planExpiryDate && new Date(seller.planExpiryDate) < currentTime;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Block new listings if plan is expired (allow editing existing vehicles)
        if (!editingVehicle && isPlanExpired) {
            notify('Your subscription plan has expired. Please renew your plan to create new listings.');
            return;
        }
        logInfo('📝 Dashboard form submitted');
        logInfo('📋 Form data:', formData);
        logInfo('✉️ Seller email in form:', formData.sellerEmail);
        
        // CRITICAL FIX: Validate required numeric fields BEFORE sanitization
        const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
        const mileageValue = typeof formData.mileage === 'string' ? parseInt(formData.mileage, 10) : formData.mileage;
        
        if (!priceValue || isNaN(priceValue) || priceValue <= 0) {
            notify('Please enter a valid price greater than 0');
            console.error('❌ Invalid price:', formData.price, '→', priceValue);
            return;
        }
        
        if (isNaN(mileageValue) || mileageValue < 0) {
            notify('Please enter a valid mileage (km driven)');
            console.error('❌ Invalid mileage:', formData.mileage, '→', mileageValue);
            return;
        }

        // FIX: Ensure all numeric fields are actual numbers before submission
        const sanitizedFormData = {
            ...formData,
            year: typeof formData.year === 'string' ? parseInt(formData.year, 10) : formData.year,
            price: priceValue,
            mileage: mileageValue,
            registrationYear: typeof formData.registrationYear === 'string' ? parseInt(formData.registrationYear, 10) : formData.registrationYear,
            noOfOwners: typeof formData.noOfOwners === 'string' ? parseInt(formData.noOfOwners, 10) : formData.noOfOwners,
        };
        
        logInfo('🔄 Sanitized form data:', sanitizedFormData);
        logInfo('💰 Price check:', { original: formData.price, sanitized: sanitizedFormData.price, type: typeof sanitizedFormData.price });
        
        const runEnhancement = async (base: typeof sanitizedFormData) => {
            const result = await enhanceVehicleListing(
                editingVehicle ? { ...editingVehicle, ...base } : base,
                {
                    runValidation: true,
                    checkPhotoQuality: true,
                    calculateListingScore: true,
                },
            );
            if (!result.success) {
                const messages = result.validation.errors.map((e) => e.message).join('\n');
                notify(messages || 'Please fix validation errors before saving.');
                return null;
            }
            return result.vehicle;
        };

        if (editingVehicle) {
            logInfo('✏️ Editing existing vehicle:', editingVehicle.id);
            try {
                const enhanced = await runEnhancement(sanitizedFormData);
                if (!enhanced) return;
                await Promise.resolve(onUpdateVehicle(enhanced));
                onCancel();
            } catch (err) {
                console.error('Failed to update listing:', err);
            }
            return;
        }

        logInfo('➕ Adding new vehicle');
        logInfo('📧 Seller email in sanitized data:', sanitizedFormData.sellerEmail);
        logInfo('📧 Seller email from props:', seller.email);
        try {
            const enhanced = await runEnhancement(sanitizedFormData);
            if (!enhanced) return;
            await Promise.resolve(onAddVehicle(enhanced, false));
            onCancel();
        } catch (err) {
            console.error('Failed to add vehicle:', err);
        }
    };

    const previewVehicle: Vehicle = {
        id: editingVehicle?.id || Date.now(),
        averageRating: 0, ratingCount: 0,
        ...formData,
        images: formData.images.length > 0 ? formData.images : [getPlaceholderImage(formData.make, formData.model)],
    };


    // Listing completion checklist – drives the progress bar & sidebar health card
    const listingChecklist = [
        { key: 'basics', label: 'Make, Model & Year', done: !!(formData.make && formData.model && formData.year) },
        { key: 'price', label: 'Price set', done: Number(formData.price) > 0 },
        { key: 'location', label: 'State & City', done: !!(formData.state && formData.city) },
        { key: 'mileage', label: 'Km Driven', done: Number(formData.mileage) > 0 },
        { key: 'specs', label: 'Engine / Fuel specs', done: !!(formData.engine && formData.fuelType) },
        { key: 'images', label: 'At least 1 photo', done: (formData.images?.length || 0) > 0 },
        { key: 'description', label: 'Description added', done: (formData.description || '').trim().length > 20 },
        { key: 'features', label: 'Key features added', done: (formData.features?.length || 0) > 0 },
    ];
    const completedCount = listingChecklist.filter(i => i.done).length;
    const completionPercent = Math.round((completedCount / listingChecklist.length) * 100);
    const completionColor = completionPercent < 40 ? '#EF4444' : completionPercent < 75 ? '#F59E0B' : '#10B981';

    return (
      <div className="bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-md">
        {/* Page header with progress */}
        <div className="mb-6 pb-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-reride-text-dark flex items-center gap-3">
                        <span
                            className="inline-flex w-10 h-10 rounded-xl items-center justify-center text-white shadow-md"
                            style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8456 100%)' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l-4-4m0 0l4-4m-4 4h12a4 4 0 014 4v0a4 4 0 01-4 4H4" /></svg>
                        </span>
                        {editingVehicle ? 'Edit Vehicle Listing' : 'List a New Vehicle'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1.5 ml-13 sm:ml-0">
                        {editingVehicle ? 'Update your listing details below.' : 'Fill in the details to create a high-quality listing that sells faster.'}
                    </p>
                </div>
                <div className="sm:min-w-[260px]">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                        <span>Listing completion</span>
                        <span className="font-bold" style={{ color: completionColor }}>{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercent}%`, background: completionColor }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{completedCount} of {listingChecklist.length} essentials complete</p>
                </div>
            </div>
        </div>

        {isPlanExpired && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <div>
                    <p className="font-semibold">Your plan has expired</p>
                    <p className="text-sm">Renew your plan to add new listings.</p>
                </div>
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-3">
            <FormFieldset
                title="Vehicle Overview"
                step={1}
                description="Core details buyers see first"
                actions={
                    hasVehicleData ? (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Admin Managed
                        </span>
                    ) : undefined
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <FormInput label="Category" name="category" type="select" value={formData.category} onChange={handleChange} required>
                        <option value="" disabled>Select Category</option>
                        {(() => {
                            const categories = Object.keys(safeVehicleData);
                            // Categories loaded successfully
                            
                            if (categories.length === 0) {
                                return <option value="" disabled>Loading categories...</option>;
                            }
                            
                            return categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ));
                        })()}
                    </FormInput>
                    <ComboboxInput
                        label="Make"
                        name="make"
                        value={formData.make || ''}
                        onChange={handleChange}
                        options={Array.isArray(availableMakes) ? availableMakes : []}
                        placeholder={!formData.category ? 'Select Category First' : 'Select or type Make'}
                        error={errors.make}
                        disabled={!formData.category}
                        required
                    />
                    <ComboboxInput
                        label="Model"
                        name="model"
                        value={formData.model || ''}
                        onChange={handleChange}
                        options={Array.isArray(availableModels) ? availableModels : []}
                        placeholder={!formData.make ? 'Select Make First' : 'Select or type Model'}
                        error={errors.model}
                        disabled={!formData.make}
                        required
                    />
                    <ComboboxInput
                        label="Variant"
                        name="variant"
                        value={formData.variant || ''}
                        onChange={handleChange}
                        options={Array.isArray(availableVariants) ? availableVariants : []}
                        placeholder="Select or type Variant (Optional)"
                        disabled={!formData.model}
                    />
                    <FormInput label="Make Year" name="year" type="number" value={formData.year} onChange={handleChange} onBlur={handleBlur} error={errors.year} required />
                    <FormInput label="Registration Year" name="registrationYear" type="number" value={formData.registrationYear} onChange={handleChange} onBlur={handleBlur} required />
                    <div>
                        <FormInput label="Price" name="price" value={formData.price} onChange={handleChange} onBlur={handleBlur} error={errors.price} tooltip="Enter the listing price in rupees." prefix="₹" indianNumberFormat required />
                        <PricingGuidance
                          vehicleDetails={formData}
                          allVehicles={allVehicles}
                          onApplySuggestedPrice={(price) =>
                            setFormData((prev) => ({ ...prev, price }))
                          }
                        />
                    </div>
                    <FormInput label="Km Driven" name="mileage" value={formData.mileage} onChange={handleChange} onBlur={handleBlur} error={errors.mileage} suffix="km" indianNumberFormat />
                    <FormInput label="No. of Owners" name="noOfOwners" type="number" value={formData.noOfOwners} onChange={handleChange} onBlur={handleBlur} />
                    <FormInput label="RTO" name="rto" value={formData.rto} onChange={handleChange} placeholder="e.g., MH01" />
                    <FormInput label="State" name="state" type="select" value={formData.state} onChange={handleChange} required>
                        <option value="" disabled>Select State</option>
                        {indianStates.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </FormInput>
                    <FormInput label="City" name="city" type="select" value={formData.city} onChange={handleChange} disabled={!formData.state} required>
                        <option value="" disabled>Select City</option>
                        {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </FormInput>
                    <FormInput label="Insurance Type" name="insuranceType" type="select" value={formData.insuranceType} onChange={handleChange}>
                        <option>Comprehensive</option>
                        <option>Third Party</option>
                        <option>Expired</option>
                    </FormInput>
                    <FormInput label="Insurance Validity" name="insuranceValidity" value={formData.insuranceValidity} onChange={handleChange} placeholder="e.g., Aug 2026" />
                </div>
            </FormFieldset>
            
            <FormFieldset 
                title="Vehicle Specifications" 
                step={2} 
                description="Transmission and performance details"
            >
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                     <FormInput label="Transmission" name="transmission" type="select" value={formData.transmission} onChange={handleChange}>
                            <option>Automatic</option><option>Manual</option><option>CVT</option><option>DCT</option>
                        </FormInput>
                    <FormInput label="Fuel Type" name="fuelType" type="select" value={formData.fuelType} onChange={handleChange}>
                            <option>Petrol</option><option>Diesel</option><option>Electric</option><option>CNG</option><option>Hybrid</option>
                        </FormInput>
                    <FormInput label="Mileage / Range" name="fuelEfficiency" value={formData.fuelEfficiency} onChange={handleChange} tooltip="e.g., 18 KMPL or 300 km range"/>
                    <FormInput label="Color" name="color" value={formData.color} onChange={handleChange} onBlur={handleBlur} />
                 </div>
            </FormFieldset>

            <FormFieldset
              title="Inspection & trust checklist"
              step={3}
              description="Upload required docs and photos — they sync to your listing gallery automatically"
              defaultOpen={true}
            >
              <SellerDisclosureForm
                hideTitle
                category={formData.category || VehicleCategory.FOUR_WHEELER}
                value={formData.sellerDisclosureChecklist}
                sellerEmail={seller.email}
                registrationNumber={formData.registrationNumber}
                vahanVerified={formData.vahanSnapshot?.source === 'surepass'}
                vahanSnapshot={formData.vahanSnapshot}
                onChange={handleChecklistChange}
                onVerifyVahan={async (registrationNumber) => {
                  try {
                    const result = await verifyVahanRegistration(
                      registrationNumber,
                      editingVehicle?.databaseId ?? editingVehicle?.id,
                    );
                    setFormData((prev) =>
                      applyVahanVerifyToVehicleFields(prev, registrationNumber, result),
                    );
                    notify(
                      result.verified ? 'RC verified with government records' : result.message || 'Saved RC — auto-verify unavailable',
                      result.verified ? 'success' : 'warning',
                    );
                    return {
                      verified: result.verified,
                      message: result.message,
                    };
                  } catch (e) {
                    const message = e instanceof Error ? e.message : 'Verification failed';
                    notify(message, 'error');
                    return { verified: false, message };
                  }
                }}
              />
              <ListingTrustProgress vehicle={formData as Vehicle} className="mt-4" />
            </FormFieldset>
            
            <FormFieldset title="Listing presentation" step={4} description="Add a description, features, and any extra marketing photos">
                <div className="space-y-6">
                    {/* DESCRIPTION */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-reride-text-dark mb-2">
                            Vehicle Description
                            <span className="text-xs text-gray-500 ml-2 font-normal">(optional but recommended)</span>
                        </label>
                        <div className="relative">
                            <textarea
                                id="description"
                                name="description"
                                rows={5}
                                maxLength={1000}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the highlights — service history, condition, recent upgrades, why you love it…"
                                className="block w-full p-3 border border-gray-200 rounded-lg focus:outline-none transition hover:border-gray-300 resize-y"
                                onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.15)')}
                                onBlur={(e) => (e.currentTarget.style.boxShadow = '')}
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none">
                                {(formData.description || '').length} / 1000
                            </div>
                        </div>
                    </div>

                    {/* KEY FEATURES */}
                    <div>
                        <label className="block text-sm font-medium text-reride-text-dark mb-2">
                            Key Features
                            <span className="text-xs text-gray-500 ml-2 font-normal">(Press Enter to add)</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </span>
                                <input
                                    type="text"
                                    value={featureInput}
                                    onChange={(e) => setFeatureInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                                    placeholder="e.g., Sunroof, ABS, Cruise Control"
                                    className="w-full pl-9 p-3 border border-gray-200 rounded-lg focus:outline-none transition hover:border-gray-300"
                                    onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.15)')}
                                    onBlur={(e) => (e.currentTarget.style.boxShadow = '')}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddFeature}
                                disabled={!featureInput.trim()}
                                className="inline-flex items-center gap-1.5 bg-reride-text-dark text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add
                            </button>
                        </div>
                        {formData.features.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {formData.features.map(feature => (
                                    <span key={feature} className="inline-flex items-center gap-1.5 bg-reride-orange-light text-reride-orange text-sm font-semibold pl-3 pr-1 py-1 rounded-full">
                                        {feature}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(feature)}
                                            className="w-5 h-5 rounded-full hover:bg-reride-orange hover:text-white flex items-center justify-center transition-colors"
                                            aria-label={`Remove ${feature}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* EXTRA PHOTOS */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-reride-text-dark">
                                Extra marketing photos
                                <span className="text-xs text-gray-500 ml-2 font-normal">(optional)</span>
                            </label>
                            {extraGalleryImages.length > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                    {extraGalleryImages.length} extra {extraGalleryImages.length === 1 ? 'photo' : 'photos'}
                                </span>
                            )}
                        </div>

                        {checklistGalleryUrls.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-emerald-800">
                                        From checklist ({checklistGalleryUrls.length})
                                    </p>
                                    <p className="text-[10px] text-gray-500">Edit in Step 3 above</p>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                                    {checklistGalleryUrls.map((url, index) => (
                                        <div key={url} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden ring-1 ring-emerald-200">
                                            <img src={getSafeImageSrc(url)} className="w-full h-full object-cover opacity-90" alt={`Checklist photo ${index + 1}`} />
                                            {index === 0 && (
                                                <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                                                    COVER
                                                </span>
                                            )}
                                            <span className="absolute bottom-0 inset-x-0 bg-emerald-700/80 text-white text-[8px] font-semibold text-center py-0.5">
                                                Checklist
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label
                            htmlFor="file-upload"
                            className={`relative block cursor-pointer bg-orange-50 rounded-xl border-2 border-dashed border-orange-300 hover:border-reride-orange hover:bg-orange-100 hover:shadow-md transition-all duration-200 p-6 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); if (!isUploading) e.currentTarget.classList.add('border-reride-orange', 'bg-orange-100', 'shadow-lg'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-reride-orange', 'bg-orange-100', 'shadow-lg'); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-reride-orange', 'bg-orange-100', 'shadow-lg');
                                if (isUploading) return;
                                const files = e.dataTransfer.files;
                                if (files && files.length > 0) {
                                    const input = document.getElementById('file-upload') as HTMLInputElement;
                                    if (input) {
                                        const dt = new DataTransfer();
                                        Array.from(files).forEach(f => dt.items.add(f));
                                        input.files = dt.files;
                                        input.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                }
                            }}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-reride-orange flex items-center justify-center mb-4 shadow-lg">
                                    {isUploading ? (
                                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    )}
                                </div>
                                <div className="bg-reride-orange hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md mb-3 transition-colors">
                                    {isUploading ? 'Uploading…' : 'Add Extra Photos'}
                                </div>
                                <p className="text-sm text-gray-600">or drag & drop images here</p>
                                <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB — required shots come from the checklist above</p>
                            </div>
                            <input id="file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                        {extraGalleryImages.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                {extraGalleryImages.map((url) => (
                                    <div key={url} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden ring-1 ring-gray-200 hover:ring-reride-orange transition-all">
                                        <img src={getSafeImageSrc(url)} className="w-full h-full object-cover" alt="Extra marketing photo" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImageUrl(url)}
                                                className="bg-white/95 text-red-600 rounded-full h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                                                title="Remove image"
                                                aria-label="Remove image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {checklistGalleryUrls.length === 0 && extraGalleryImages.length === 0 && (
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                No photos yet — complete the checklist in Step 3 to add required shots.
                            </p>
                        )}
                    </div>
                </div>
            </FormFieldset>

            <FormFieldset title={t('sellerListing.section.offer')} step={5} description="Optional — attract more buyers with a special offer" defaultOpen={false}>
                <p className="text-sm text-gray-500 mb-4">{t('sellerListing.offer.hint')}</p>
                <div className="flex items-center gap-3 mb-4">
                    <input
                        id="offer-enabled"
                        type="checkbox"
                        checked={!!formData.offerEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, offerEnabled: e.target.checked }))}
                        className="h-5 w-5 rounded border-gray-300"
                    />
                    <label htmlFor="offer-enabled" className="text-sm font-medium text-reride-text-dark cursor-pointer">
                        {t('sellerListing.offer.enable')}
                    </label>
                </div>
                <div className={`space-y-4 ${formData.offerEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                        <label htmlFor="offer-title" className="block text-sm font-medium text-reride-text-dark mb-1">
                            {t('sellerListing.label.offerTitle')}
                        </label>
                        <input
                            id="offer-title"
                            name="offerTitle"
                            type="text"
                            value={formData.offerTitle ?? ''}
                            onChange={handleChange}
                            placeholder={t('vehicle.detail.offer.specialOffer')}
                            className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="offer-start" className="block text-sm font-medium text-reride-text-dark mb-1">
                                {t('sellerListing.label.offerStartDate')}
                            </label>
                            <input
                                id="offer-start"
                                name="offerStartDate"
                                type="date"
                                value={formData.offerStartDate ?? ''}
                                onChange={handleChange}
                                className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label htmlFor="offer-end" className="block text-sm font-medium text-reride-text-dark mb-1">
                                {t('sellerListing.label.offerEndDate')}
                            </label>
                            <input
                                id="offer-end"
                                name="offerEndDate"
                                type="date"
                                value={formData.offerEndDate ?? ''}
                                onChange={handleChange}
                                className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="offer-date-label" className="block text-sm font-medium text-reride-text-dark mb-1">
                            {t('sellerListing.label.offerDateLabel')}
                        </label>
                        <input
                            id="offer-date-label"
                            name="offerDateLabel"
                            type="text"
                            value={formData.offerDateLabel ?? ''}
                            onChange={handleChange}
                            placeholder={t('sellerListing.placeholder.offerDateLabel')}
                            className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label htmlFor="offer-description" className="block text-sm font-medium text-reride-text-dark mb-1">
                            {t('sellerListing.label.offerDescription')}
                        </label>
                        <input
                            id="offer-description"
                            name="offerDescription"
                            type="text"
                            value={formData.offerDescription ?? ''}
                            onChange={handleChange}
                            placeholder={t('vehicle.detail.offer.loanOffersOnAllCars')}
                            className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label htmlFor="offer-highlight" className="block text-sm font-medium text-reride-text-dark mb-1">
                            {t('sellerListing.label.offerHighlight')}
                        </label>
                        <input
                            id="offer-highlight"
                            name="offerHighlight"
                            type="text"
                            value={formData.offerHighlight ?? ''}
                            onChange={handleChange}
                            placeholder={t('vehicle.detail.offer.roiStartingAt')}
                            className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label htmlFor="offer-disclaimer" className="block text-sm font-medium text-reride-text-dark mb-1">
                            {t('sellerListing.label.offerDisclaimer')}
                        </label>
                        <input
                            id="offer-disclaimer"
                            name="offerDisclaimer"
                            type="text"
                            value={formData.offerDisclaimer ?? ''}
                            onChange={handleChange}
                            placeholder={t('sellerListing.placeholder.offerDisclaimer')}
                            className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
            </FormFieldset>

            {editingVehicle && (
              <FormFieldset title={t('sellerListing.section.listingStatus')} step={6} description="Control whether buyers can see this listing" defaultOpen>
                <div>
                  <label htmlFor="listing-status" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('sellerListing.label.status')}
                  </label>
                  <select
                    id="listing-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full p-3 border border-gray-200 dark:border-gray-300 rounded-lg bg-white"
                  >
                    <option value="published">{t('sellerListing.status.published')}</option>
                    <option value="unpublished">{t('sellerListing.status.unpublished')}</option>
                    <option value="sold">{t('sellerListing.status.sold')}</option>
                  </select>
                </div>
              </FormFieldset>
            )}

            <FormFieldset title="Promotion" step={6} description="Use Boost after publishing to promote this listing" defaultOpen={false}>
                <div className="p-4 bg-reride-orange dark:bg-reride-orange/20 border border-reride-orange dark:border-reride-orange rounded-lg">
                    <p className="font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Boost after you publish
                    </p>
                    <p className="text-xs text-white mt-2">
                        After publishing, open Boost on your listing. Plan credits unlock a 7-day Featured boost; paid packs add stronger placements.
                    </p>
                    <p className="text-xs text-white/90 mt-2">
                        Boost credits available: {seller.featuredCredits || 0}
                    </p>
                </div>
            </FormFieldset>

            {/* Sticky action bar – always visible on scroll */}
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-white/90 backdrop-blur border-t border-gray-200 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 mr-auto">
                        <span className="w-2 h-2 rounded-full" style={{ background: completionColor }} />
                        <span>{completionPercent}% complete · {completedCount}/{listingChecklist.length} essentials</span>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full sm:w-auto order-2 sm:order-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 px-5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!editingVehicle && isPlanExpired}
                        className={`w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center gap-2 font-bold py-2.5 px-6 rounded-lg shadow-sm ${
                            !editingVehicle && isPlanExpired
                                ? 'opacity-50 cursor-not-allowed btn-brand-primary'
                                : 'btn-brand-primary hover:shadow-md transition-shadow'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {editingVehicle ? 'Update Vehicle' : 'List My Vehicle'}
                    </button>
                </div>
            </div>
          </form>

          {/* Live Preview / Sidebar Column */}
          <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-24 self-start space-y-5">
                  <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Live Preview
                      </h3>
                      {formData.images.length === 0 ? (
                          <PremiumPreviewPlaceholder
                              make={formData.make}
                              model={formData.model}
                              year={formData.year}
                              category={formData.category}
                              price={Number(formData.price) || 0}
                              fuelType={formData.fuelType}
                              transmission={formData.transmission}
                              mileage={Number(formData.mileage) || 0}
                              city={formData.city}
                              state={formData.state}
                              sellerName={seller?.dealershipName || seller?.name || 'Your Dealership'}
                              onUploadClick={() => document.getElementById('file-upload')?.click()}
                          />
                      ) : (
                          <div className="pointer-events-none rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                             <VehicleCard vehicle={previewVehicle} onSelect={() => {}} onToggleCompare={() => {}} isSelectedForCompare={false} onToggleWishlist={() => {}} isInWishlist={false} isCompareDisabled={true} onViewSellerProfile={() => {}} />
                          </div>
                      )}
                      {isSellerListingOfferVisible(previewVehicle) ? (
                        <div className="pointer-events-none mt-4">
                          <VehicleOfferBanner vehicle={previewVehicle} />
                        </div>
                      ) : null}
                  </div>

                  {/* Listing Health Checklist */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-reride-text-dark flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-reride-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Listing Health
                          </h3>
                          <span className="text-xs font-bold" style={{ color: completionColor }}>{completionPercent}%</span>
                      </div>
                      <ul className="px-4 py-3 space-y-2">
                          {listingChecklist.map(item => (
                              <li key={item.key} className="flex items-center gap-2 text-sm">
                                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                      {item.done ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                      ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                      )}
                                  </span>
                                  <span className={item.done ? 'text-gray-600 line-through' : 'text-reride-text-dark'}>{item.label}</span>
                              </li>
                          ))}
                      </ul>
                      {completionPercent < 100 && (
                          <div className="px-4 py-3 bg-orange-50 border-t border-orange-100">
                              <p className="text-xs text-orange-800">
                                  <span className="font-semibold">Pro tip:</span> Complete listings get up to <span className="font-bold">3× more views</span>.
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </aside>
        </div>
      </div>
    );
});
