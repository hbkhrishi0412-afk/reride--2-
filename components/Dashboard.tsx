import { logInfo } from '../utils/logger.js';
import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Vehicle, User, Conversation, VehicleData, ChatMessage, PlanDetails, SubscriptionPlan, Notification } from '../types';
import { View, VehicleCategory } from '../types';
import { enhanceVehicleListing } from '../services/listingEnhancementService';
import { getSafeImageSrc, getFirstValidImage } from '../utils/imageUtils';
import { currentUserForLocalSessionJson } from '../utils/userLocalStorageSnapshot';
import { formatSalesValue } from '../utils/numberUtils';
import { formatIndianNumberInput, parseIndianNumberDigits } from '../utils/indianNumberInput.js';
import { findUserByParticipantId } from '../utils/chatContact';
import VehicleCard from './VehicleCard';
// FIX: ChatWidget is a named export, not a default. Corrected the import syntax.
import { ChatWidget } from './ChatWidget';
// Removed blocking import - will lazy load location data when needed
import { planService } from '../services/planService';
import { planDetailsForSeller } from '../utils/listingPlanRules.js';
import BulkUploadModal from './BulkUploadModal';
import SellerDisclosureForm from './SellerDisclosureForm';
import ListingTrustProgress from './ListingTrustProgress';
import MarkSoldDealModal from './MarkSoldDealModal';
import SellerCommandHome from './command-center/SellerCommandHome';
import DealDetailPage from './command-center/DealDetailPage';
import { useSellerDashboardController } from '../hooks/useSellerDashboardController';
import { countActionableSellerTasks } from '../utils/sellerViewedTasks';
import { CLIENT_POLL_INTERVALS_MS } from '../utils/clientPolling.js';
import {
  clearChecklistPhotoByUrl,
  extractChecklistGalleryUrls,
  getExtraGalleryImages,
  mergeListingImages,
  syncDocumentsFromChecklist,
} from '../lib/universalChecklist/mediaSync';
import { verifyVahanRegistration, applyVahanVerifyToVehicleFields } from '../services/vehicleTrustService';
import { findVehicleByIdentity, getCanonicalPrimaryKey, buildVehicleMutationBody } from '../utils/vehicleIdentity';

export type DashboardNotifyFn = (
  message: string,
  type?: 'success' | 'error' | 'info' | 'warning',
) => void;

function dashboardNotify(
  onNotify: DashboardNotifyFn | undefined,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
) {
  if (onNotify) {
    onNotify(message, type);
    return;
  }
  if (type === 'error') console.error(message);
  else logInfo(message);
}
import { getPlaceholderImage } from './vehicleData';
import PricingGuidance from './PricingGuidance';
// Removed unused OfferModal import
// NEW FEATURES
import BoostListingModal from './BoostListingModal';
import ListingLifecycleIndicator from './ListingLifecycleIndicator';
import { isListingExpired } from '../services/listingLifecycleService';
import { isEffectivelyFeatured } from '../utils/listingPromotion';
import SellerListingsActions from './seller-dashboard/SellerListingsActions';
import SellerPremiumPanel, {
  sellerPremiumGhostBtnStyle,
  sellerPremiumPrimaryBtnStyle,
  sellerPremiumTableWrapStyle,
} from './seller-dashboard/SellerPremiumShell';
import {
  validateListingRenewal,
  isListingLimitReached,
  type ListingRenewalValidation,
} from '../utils/listingPlanRules';
import PaymentStatusCard from './PaymentStatusCard';
import { PaymentErrorBoundary } from './ErrorBoundaries';
import { Pressable } from './primitives/Pressable';
import { VehicleOfferBanner } from './VehicleOfferBanner';
import { isSellerListingOfferVisible } from '../utils/vehicleOffer';
import { authenticatedFetch } from '../utils/authenticatedFetch';
import {
  conversationBelongsToSeller,
  countInquiriesForVehicle,
  countInquiriesForVehicles,
} from '../utils/conversationParticipants';
import { getLastVisibleMessageForViewer } from '../utils/conversationView';
import { getThreadLastMessagePreview } from '../utils/messagePreview';
// Firebase status utilities removed - using Supabase

const AnalyticsChart = React.lazy(() => import('./dashboard/AnalyticsChart'));


interface DashboardProps {
  seller: User;
  sellerVehicles: Vehicle[];
  allVehicles: Vehicle[];
  reportedVehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => void | Promise<void>;
  onAddMultipleVehicles: (vehicles: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>[]) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
  onMarkAsSold: (vehicleId: number) => void;
  onMarkAsUnsold?: (vehicleId: number) => void;
  conversations: Conversation[];
  onSellerSendMessage: (conversationId: string, messageText: string, type?: ChatMessage['type'], payload?: any) => void;
  onMarkConversationAsReadBySeller: (conversationId: string) => void;
  onSetConversationReadState?: (conversationId: string, isRead: boolean) => void;
  onMarkAllAsReadBySeller?: () => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onUserStoppedTyping?: (conversationId: string) => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onClearChat?: (conversationId: string) => void | Promise<void>;
  onDeleteConversation?: (conversationId: string) => void | Promise<void>;
  onArchiveConversation?: (conversationId: string, archived?: boolean) => void | Promise<void>;
  onUpdateSellerProfile: (details: { dealershipName: string; bio: string; logoUrl: string; partnerBanks?: string[] }) => void;
  vehicleData: VehicleData;
  onFeatureListing: (vehicleId: number) => Promise<void>;
  onBoostListing?: (vehicleId: number, packageId: string) => Promise<void>;
  onRequestCertification: (vehicleId: number) => void;
  onNavigate: (view: View) => void;
  onTestDriveResponse?: (conversationId: string, messageId: number, newStatus: 'confirmed' | 'rejected') => void;
  onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
  chatPeerOnlineByConversationId?: Record<string, boolean>;
  /** Mobile seller dashboard uses this; desktop dashboard may ignore. */
  onSellerOpenChat?: (conversation: Conversation) => void;
  /** Toast / snackbar feedback (replaces blocking alert dialogs). */
  onNotify?: DashboardNotifyFn;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkNotificationsAsRead?: (ids: number[]) => void;
}

type DashboardView = 'overview' | 'listings' | 'form' | 'messages' | 'analytics' | 'salesHistory' | 'reports' | 'settings' | 'notifications';

const HelpTooltip: React.FC<{ text: string }> = memo(({ text }) => (
    <span className="group relative ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-reride-text-dark cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className="absolute bottom-full mb-2 w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 left-1/2 -translate-x-1/2 z-10 shadow-lg">{text}</span>
    </span>
));

// Combobox component for Make, Model, and Variant fields
const ComboboxInput: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;
}> = ({ label, name, value, onChange, options, placeholder, error, required = false, disabled = false, tooltip }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter options based on input
  useEffect(() => {
    if (!inputValue || inputValue.trim() === '') {
      setFilteredOptions(safeOptions);
    } else {
      const filtered = safeOptions.filter(opt => 
        opt && typeof opt === 'string' && opt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, safeOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newValue = e.target.value || '';
      setInputValue(newValue);
      setIsOpen(true);
      onChange(e);
    } catch (error) {
      console.error('Error in handleInputChange:', error);
    }
  };

  const handleSelectOption = (option: string) => {
    if (!option || typeof option !== 'string') return;
    setInputValue(option);
    setIsOpen(false);
    // Create synthetic event for onChange
    try {
      // Create a minimal event object that handleChange expects
      const syntheticEvent = {
        target: {
          name,
          value: option
        } as HTMLInputElement,
        currentTarget: inputRef.current
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error in handleSelectOption:', error);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === 'ArrowDown' && Array.isArray(filteredOptions) && filteredOptions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'Enter' && isOpen && Array.isArray(filteredOptions) && filteredOptions.length > 0 && filteredOptions[0]) {
        e.preventDefault();
        handleSelectOption(filteredOptions[0]);
      }
    } catch (error) {
      console.error('Error in handleInputKeyDown:', error);
    }
  };

  // Safety check - ensure we have valid data before rendering
  if (typeof name !== 'string' || name.length === 0) {
    console.error('ComboboxInput: Invalid name prop');
    return null;
  }

  return (
    <div className="relative">
      <label htmlFor={name} className="flex items-center text-sm font-medium text-reride-text-dark mb-1">
        {label}{required && <span className="text-reride-orange ml-0.5">*</span>}
        {tooltip && <HelpTooltip text={tooltip} />}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={name}
          name={name}
          value={inputValue || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`block w-full p-3 pr-10 border rounded-lg focus:outline-none transition bg-white text-reride-text-dark disabled:bg-white dark:disabled:bg-white ${error ? 'border-reride-orange' : 'border-gray-200 dark:border-gray-300'}`}
          style={!error ? { boxShadow: 'none' } : {}}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isOpen && !disabled && Array.isArray(filteredOptions) && filteredOptions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {filteredOptions.slice(0, 10).map((option, index) => {
              if (!option || typeof option !== 'string') return null;
              return (
                <button
                  key={option || `option-${index}`}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                >
                  {option}
                </button>
              );
            })}
            {filteredOptions.length > 10 && (
              <div className="px-4 py-2 text-xs text-gray-500 text-center">
                {t('sellerDashboard.comboboxMoreOptions', {
                  count: filteredOptions.length - 10,
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-reride-orange">{error}</p>}
    </div>
  );
};

const FormInput: React.FC<{ label: string; name: keyof Vehicle | 'summary'; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; error?: string; tooltip?: string; required?: boolean; children?: React.ReactNode; disabled?: boolean; placeholder?: string; rows?: number; prefix?: React.ReactNode; suffix?: React.ReactNode; indianNumberFormat?: boolean }> =
  ({ label, name, type = 'text', value, onChange, onBlur, error, tooltip, required = false, children, disabled = false, placeholder, rows, prefix, suffix, indianNumberFormat = false }) => {
  const baseInputClasses = `block w-full p-3 border rounded-lg focus:outline-none transition bg-white text-reride-text-dark disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${error ? 'border-reride-orange' : 'border-gray-200 dark:border-gray-300 hover:border-gray-300'}`;
  const focusOn = (e: React.FocusEvent<HTMLElement>) => !error && (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.15)');
  const focusOff = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.style.boxShadow = '');
  const inputType = indianNumberFormat ? 'text' : type;
  const displayValue = indianNumberFormat ? formatIndianNumberInput(value) : value;
  const handleFormattedNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = parseIndianNumberDigits(e.target.value);
    onChange({
      ...e,
      target: { ...e.target, name: e.target.name, value: digits },
    } as React.ChangeEvent<HTMLInputElement>);
  };
  return (
  <div>
    <label htmlFor={String(name)} className="flex items-center text-sm font-medium text-reride-text-dark mb-1">
        {label}{required && <span className="text-reride-orange ml-0.5">*</span>}
        {tooltip && <HelpTooltip text={tooltip} />}
    </label>
    {type === 'select' ? (
        <select id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} disabled={disabled} className={baseInputClasses} onFocus={focusOn} onBlur={focusOff}>
            {children}
        </select>
    ) : type === 'textarea' ? (
        <textarea id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder} rows={rows} className={baseInputClasses} onFocus={focusOn} onBlur={focusOff} />
    ) : (
        <div className="relative">
            {prefix && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 text-sm font-semibold">
                    {prefix}
                </span>
            )}
            <input
                type={inputType}
                id={String(name)}
                name={String(name)}
                value={displayValue}
                onChange={indianNumberFormat ? handleFormattedNumberChange : onChange}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                inputMode={indianNumberFormat ? 'numeric' : undefined}
                className={`${baseInputClasses} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''}`}
                onFocus={focusOn}
                onBlur={(e) => { focusOff(e); if (onBlur) onBlur(e); }}
            />
            {suffix && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-xs">
                    {suffix}
                </span>
            )}
        </div>
    )}
    {error && (
        <p className="mt-1 text-xs text-reride-orange flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
        </p>
    )}
  </div>
  );
};


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; gradient?: string }> = memo(({ title, value, icon }) => (
  <div
    className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
    style={{
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F5 100%)',
      border: '1px solid rgba(28,25,23,0.08)',
      boxShadow: '0 18px 36px -28px rgba(28,25,23,0.35)',
    }}
  >
    <div className="mb-4 flex items-center justify-between gap-3 overflow-hidden">
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden text-right">
        <p
          className="break-words text-lg font-bold tabular-nums text-stone-900 sm:text-xl"
          style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.02em' }}
        >
          {value}
        </p>
      </div>
    </div>
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition-colors duration-300 group-hover:text-orange-700">
      {title}
    </h3>
  </div>
));

const PlanStatusCard: React.FC<{
    seller: User;
    activeListingsCount: number;
    featuredListingsCount: number;
    onNavigate: (view: View) => void;
}> = memo(({ seller, activeListingsCount, featuredListingsCount, onNavigate }) => {
    const { t } = useTranslation();
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Real-time update state for expiry dates
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Real-time expiry date updates - update every minute (UI only, no API)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, CLIENT_POLL_INTERVALS_MS.uiClock);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let active = true;

        const loadPlan = async (silent = false) => {
            if (!silent) setLoading(true);
            try {
                const planDetails = await planService.getPlanDetails(seller.subscriptionPlan || 'free');
                if (!active) return;
                setPlan(planDetails);
            } catch (error) {
                console.error('Failed to load plan details:', error);
                if (!active) return;
                setPlan({
                    ...planDetailsForSeller(seller),
                    name: t('sellerDashboard.freePlanName'),
                });
            } finally {
                if (active) setLoading(false);
            }
        };

        const reloadOnVisibility = () => {
            if (document.visibilityState === 'visible') {
                void loadPlan(true);
            }
        };
        const reloadOnPlanConfigUpdate = () => {
            void loadPlan(true);
        };
        const reloadOnStoragePlanUpdate = (event: StorageEvent) => {
            if (event.key === 'reRidePlanConfigUpdatedAt') {
                void loadPlan(true);
            }
        };

        setPlan(planDetailsForSeller(seller));
        void loadPlan(false);
        window.addEventListener('focus', reloadOnVisibility);
        document.addEventListener('visibilitychange', reloadOnVisibility);
        window.addEventListener('planConfigUpdated', reloadOnPlanConfigUpdate as EventListener);
        window.addEventListener('storage', reloadOnStoragePlanUpdate);

        return () => {
            active = false;
            window.removeEventListener('focus', reloadOnVisibility);
            document.removeEventListener('visibilitychange', reloadOnVisibility);
            window.removeEventListener('planConfigUpdated', reloadOnPlanConfigUpdate as EventListener);
            window.removeEventListener('storage', reloadOnStoragePlanUpdate);
        };
    }, [seller, seller.subscriptionPlan, t]);
    
    if (loading || !plan) {
        return (
            <div className="text-white p-6 rounded-lg shadow-lg flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8456 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t('sellerDashboard.planStatus')}</h3>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
                <p className="text-sm opacity-90">{t('sellerDashboard.loadingPlan')}</p>
            </div>
        );
    }
    
    const listingLimit = plan.listingLimit === 'unlimited' ? Infinity : plan.listingLimit;
    const planFeaturedCredits = typeof plan.featuredCredits === 'number' ? plan.featuredCredits : 0;
    const storedRemainingCredits = typeof seller.featuredCredits === 'number'
        ? seller.featuredCredits
        : planFeaturedCredits;
    const featuredCreditsAfterUsage = Math.max(planFeaturedCredits - featuredListingsCount, 0);
    const effectiveFeaturedCredits = Math.min(storedRemainingCredits, featuredCreditsAfterUsage);
    const usagePercentage = listingLimit === Infinity ? 0 : (activeListingsCount / listingLimit) * 100;
    // Use currentTime for real-time updates
    const planIsExpired = !!seller.planExpiryDate && new Date(seller.planExpiryDate) < currentTime;

    return (
        <div className="text-white p-6 rounded-lg shadow-lg flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8456 100%)' }}>
            <h3 className="text-lg font-bold flex justify-between items-center">
                <span>
                  {t('sellerDashboard.yourPlanLabel')}{' '}
                  <span className="text-reride-text-dark">{plan.name}</span>
                </span>
            </h3>
            <div className="mt-4 space-y-3 text-sm flex-grow">
                <div className="flex justify-between">
                    <span>{t('sellerDashboard.activeListingsLabel')}</span>
                    <span className="font-semibold">{activeListingsCount} / {plan.listingLimit === 'unlimited' ? '∞' : plan.listingLimit}</span>
                </div>
                <div className="w-full rounded-full h-2 mb-2" style={{ background: 'rgba(30, 136, 229, 0.1)' }}>
                    <div
                        className="bg-reride-blue h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between">
                    <span>{t('sellerDashboard.featuredCreditsLabel')}</span>
                    <span className="font-semibold">
                      {t('sellerDashboard.featuredRemaining', { count: effectiveFeaturedCredits })}
                    </span>
                </div>
                 <div className="flex justify-between">
                    <span>{t('sellerDashboard.freeCertificationsLabel')}</span>
                    <span className="font-semibold">
                      {t('sellerDashboard.featuredRemaining', {
                        count: Math.max((plan.freeCertifications ?? 0) - (seller.usedCertifications || 0), 0),
                      })}
                    </span>
                </div>

                {/* Always show expiry date section */}
                <div className="mt-4 pt-4 border-t border-reride-white/20 space-y-2">
                    {seller.planActivatedDate && (
                        <div className="flex justify-between text-xs">
                            <span>{t('sellerDashboard.planActivated')}</span>
                            <span className="font-semibold">
                                {new Date(seller.planActivatedDate).toLocaleDateString('en-IN', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs">
                        <span>{t('sellerDashboard.expiryDate')}</span>
                        {seller.planExpiryDate ? (
                            <span className={`font-semibold ${
                                (() => {
                                    const expiryDate = new Date(seller.planExpiryDate);
                                    const isExpired = expiryDate < currentTime;
                                    const daysRemaining = Math.ceil((expiryDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
                                    if (isExpired) return 'text-red-300';
                                    if (daysRemaining <= 7) return 'text-orange-300';
                                    return '';
                                })()
                            }`}>
                                {new Date(seller.planExpiryDate).toLocaleDateString('en-IN', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                                {(() => {
                                    const expiryDate = new Date(seller.planExpiryDate);
                                    const isExpired = expiryDate < currentTime;
                                    const daysRemaining = Math.ceil((expiryDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
                                    if (isExpired) {
                                        return (
                                          <span className="ml-2 text-red-200 font-bold">{t('sellerDashboard.expired')}</span>
                                        );
                                    }
                                    if (daysRemaining <= 30 && daysRemaining > 0) {
                                        return (
                                          <span className="ml-2 text-orange-200">
                                            {daysRemaining === 1
                                              ? t('sellerDashboard.dayLeft')
                                              : t('sellerDashboard.daysLeft', { count: daysRemaining })}
                                          </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </span>
                        ) : (
                            <span className="font-semibold text-gray-300 text-xs">{t('sellerDashboard.notSet')}</span>
                        )}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-reride-white/20">
                    <h4 className="font-semibold mb-2">{t('sellerDashboard.planFeatures')}</h4>
                    <ul className="space-y-2 text-xs">
                        {(plan.features || []).map((feature: string) => (
                            <li key={feature} className="flex items-start">
                                <svg className="w-4 h-4 text-reride-orange mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="mt-6 space-y-2">
                {(planIsExpired || plan.id !== 'premium') && (
                    <button
                        onClick={() => onNavigate(View.PRICING)}
                        className="w-full bg-white text-reride-orange font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors"
                    >
                        {planIsExpired ? t('sellerDashboard.renewPlan') : t('sellerDashboard.upgradePlan')}
                    </button>
                )}
                <button
                    onClick={() => onNavigate(View.PRICING)}
                    className="w-full border border-white/40 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
                >
                    View all plans
                </button>
            </div>
        </div>
    );
});

const initialFormState: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'> = {
  make: '', model: '', variant: '', year: new Date().getFullYear(), price: 0, mileage: 0,
  description: '', engine: '', transmission: 'Automatic', fuelType: 'Petrol', fuelEfficiency: '',
  color: '', features: [], images: [], documents: [],
  sellerEmail: '',
  category: VehicleCategory.FOUR_WHEELER, // Start with default category
  status: 'published',
  isFeatured: false,
  registrationYear: new Date().getFullYear(),
  insuranceValidity: '',
  insuranceType: 'Comprehensive',
  rto: '',
  city: '',
  state: '',
  location: '',
  noOfOwners: 1,
  displacement: '',
  groundClearance: '',
  bootSpace: '',
  qualityReport: {
    fixesDone: [],
  },
  certifiedInspection: null,
  certificationStatus: 'none',
  offerEnabled: false,
  offerTitle: '',
  offerStartDate: '',
  offerEndDate: '',
  offerDateLabel: '',
  offerDescription: '',
  offerHighlight: '',
  offerDisclaimer: '',
};

const FormFieldset: React.FC<{
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    description?: string;
    step?: number;
    defaultOpen?: boolean;
    actions?: React.ReactNode;
}> = ({ title, children, icon, description, step, defaultOpen = true, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <header
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isOpen}
            >
                {step !== undefined && (
                    <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8456 100%)' }}
                    >
                        {step}
                    </span>
                )}
                {icon && step === undefined && (
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-reride-orange-light text-reride-orange">
                        {icon}
                    </span>
                )}
                <div className="flex-grow min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-reride-text-dark leading-tight">{title}</h3>
                    {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
                </div>
                {actions && (
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        {actions}
                    </div>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </header>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 border-t border-gray-100">{children}</div>
                </div>
            </div>
        </section>
    );
};

// Premium "no image yet" preview card – shown in Live Preview before any photos are uploaded.
// Mirrors the listing card layout but replaces the photo with a beautiful branded hero
// that surfaces Make / Model / Year / Category – giving sellers an aspirational preview.
const PremiumPreviewPlaceholder: React.FC<{
    make?: string;
    model?: string;
    year?: number | string;
    category?: string;
    price?: number;
    fuelType?: string;
    transmission?: string;
    mileage?: number;
    city?: string;
    state?: string;
    sellerName?: string;
    onUploadClick?: () => void;
}> = memo(({ make, model, year, category, price, fuelType, transmission, mileage, city, state, sellerName, onUploadClick }) => {
    const hasIdentity = !!(make && model);
    const displayMake = (make || '').trim();
    const displayModel = (model || '').trim();
    const formattedPrice = price && price > 0 ? `₹${price.toLocaleString('en-IN')}` : '₹ —';
    const formattedKms = mileage && mileage > 0 ? `${(mileage / 1000).toFixed(mileage >= 10000 ? 0 : 1)}k kms` : '—';
    const locationText = city || state ? `${city || 'N/A'}${state ? `, ${state}` : ''}` : 'Location not set';

    // Pick a category-appropriate vehicle silhouette
    const isTwoWheeler = category && /two|bike|motor/i.test(category);
    const isCommercial = category && /commercial|truck/i.test(category);
    const VehicleIcon = isTwoWheeler ? (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="14" cy="46" r="10" />
            <circle cx="50" cy="46" r="10" />
            <path d="M22 46l8-18h12l8 18M28 28l-4-8h-6M42 28l4-8h6M30 28l4 8h-8" />
        </svg>
    ) : isCommercial ? (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 42V18h28v24M32 26h12l8 10v6H32" />
            <circle cx="14" cy="46" r="5" /><circle cx="44" cy="46" r="5" />
        </svg>
    ) : (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 38h48l-6-14a4 4 0 00-3.6-2.4H17.6A4 4 0 0014 24L8 38z" />
            <path d="M6 38h52v8a2 2 0 01-2 2h-4a4 4 0 01-4-4H16a4 4 0 01-4 4H8a2 2 0 01-2-2v-8z" />
            <circle cx="18" cy="44" r="4" /><circle cx="46" cy="44" r="4" />
            <path d="M18 28h28" />
        </svg>
    );

    return (
        <div
            className="rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm bg-white relative"
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            {/* Hero placeholder */}
            <button
                type="button"
                onClick={onUploadClick}
                className="relative w-full block overflow-hidden group focus:outline-none"
                style={{ aspectRatio: '16 / 10' }}
                aria-label="Upload images"
            >
                {/* Branded gradient background */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, #1A1A2E 0%, #2D1B4E 45%, #FF6B35 130%)',
                    }}
                />
                {/* Decorative blurred orbs */}
                <div
                    className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-30 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #FF8456 0%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #5B8DEF 0%, transparent 70%)' }}
                />
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                {/* Giant translucent vehicle silhouette */}
                <div className="absolute inset-0 flex items-end justify-end pr-2 pb-2 text-white opacity-10 pointer-events-none">
                    <div className="w-[80%] h-[80%]">{VehicleIcon}</div>
                </div>

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white text-[10px] font-semibold uppercase tracking-wider border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse" />
                        Live Preview
                    </span>
                    {year ? (
                        <span className="px-2.5 py-1 rounded-full bg-white/90 text-[#1A1A1A] text-xs font-bold shadow-sm">
                            {year}
                        </span>
                    ) : null}
                </div>

                {/* Center content – Make / Model headline */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10">
                    {hasIdentity ? (
                        <>
                            <h2
                                className="text-white font-extrabold leading-tight drop-shadow-lg"
                                style={{ fontSize: 'clamp(20px, 3.6vw, 32px)', letterSpacing: '-0.01em' }}
                            >
                                {displayMake}
                            </h2>
                            <h3
                                className="text-white/90 font-semibold leading-tight mt-0.5 drop-shadow"
                                style={{ fontSize: 'clamp(16px, 2.6vw, 22px)' }}
                            >
                                {displayModel}
                            </h3>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Click to add photos
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-14 h-14 mb-3 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-white font-bold text-base">Your listing preview</p>
                            <p className="text-white/70 text-xs mt-1 max-w-[80%]">
                                Enter Make &amp; Model — and add photos — to see how buyers will view your listing.
                            </p>
                        </>
                    )}
                </div>

                {/* Bottom subtle gradient for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
            </button>

            {/* Card body – mirrors the real VehicleCard layout */}
            <div className="p-4 flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold leading-tight flex-1 pr-2 text-[14px] text-[#1A1A1A]">
                        {hasIdentity ? `${displayMake} ${displayModel}` : 'Make · Model'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full flex-shrink-0 bg-[#EEEEEE] text-[#616161] text-[12px] font-medium">
                        {year || '—'}
                    </span>
                </div>

                <p className="mb-2 text-[13px] text-[#616161]">
                    By <span className="font-semibold" style={{ color: '#FF7F47' }}>{sellerName || 'Your Dealership'}</span>
                </p>

                <div className="grid grid-cols-3 gap-x-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#616161]">
                        <svg className="flex-shrink-0 w-4 h-4 text-[#2196F3]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" /></svg>
                        {formattedKms}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#616161]">
                        <svg className="flex-shrink-0 w-4 h-4 text-[#2196F3]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                        {fuelType || 'Petrol'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#616161]">
                        <svg className="flex-shrink-0 w-4 h-4 text-[#2196F3]" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                        {transmission || 'Manual'}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] text-[#616161] mb-3">
                    <svg className="flex-shrink-0 w-4 h-4 text-[#2196F3]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    {locationText}
                </div>

                <div className="mt-auto pt-3 border-t border-[#E0E0E0]">
                    <p className="font-extrabold text-[18px]" style={{ color: '#FF7F47' }}>
                        {formattedPrice}
                    </p>
                </div>
            </div>
        </div>
    );
});

interface VehicleFormProps {
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

// Settings View Component for Bank Partner Selection
const SettingsView: React.FC<{
  seller: User;
  onUpdateSeller: (details: { dealershipName: string; bio: string; logoUrl: string; partnerBanks?: string[] }) => void | Promise<void>;
  onNotify?: DashboardNotifyFn;
  activeListingsCount: number;
  featuredListingsCount: number;
  onNavigate: (view: View) => void;
}> = ({ seller, onUpdateSeller, onNotify, activeListingsCount, featuredListingsCount, onNavigate }) => {
  const { t } = useTranslation();
  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') =>
      dashboardNotify(onNotify, message, type),
    [onNotify],
  );
  const [selectedBanks, setSelectedBanks] = useState<string[]>(seller?.partnerBanks || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update selectedBanks when seller data changes
  useEffect(() => {
    if (seller?.partnerBanks) {
      setSelectedBanks(seller.partnerBanks);
    } else {
      setSelectedBanks([]);
    }
  }, [seller?.partnerBanks]);

  // Safety check
  if (!seller || !seller.email) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <p className="text-gray-600">{t('sellerDashboard.unableLoadSeller')}</p>
      </div>
    );
  }

  // Common Indian banks for vehicle financing
  const availableBanks = [
    'HDFC Bank',
    'ICICI Bank',
    'State Bank of India (SBI)',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Bajaj Finserv',
    'Tata Capital',
    'Mahindra Finance',
    'Yes Bank',
    'IDFC First Bank',
    'Bank of Baroda',
    'Punjab National Bank (PNB)',
    'Union Bank of India',
    'Canara Bank',
    'Indian Bank'
  ];

  const handleBankToggle = (bankName: string) => {
    setSelectedBanks(prev => {
      if (prev.includes(bankName)) {
        return prev.filter(b => b !== bankName);
      } else {
        return [...prev, bankName];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSeller({
        dealershipName: seller.dealershipName || seller.name,
        bio: seller.bio || '',
        logoUrl: seller.logoUrl || '',
        partnerBanks: selectedBanks
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save bank partners:', error);
      notify(t('sellerDashboard.saveBanksFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">
        <PlanStatusCard
          seller={seller}
          activeListingsCount={activeListingsCount}
          featuredListingsCount={featuredListingsCount}
          onNavigate={onNavigate}
        />
        <PaymentErrorBoundary>
          <PaymentStatusCard currentUser={seller} />
        </PaymentErrorBoundary>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-reride-text-dark mb-6">
        {t('sellerDashboard.settingsTitle')}
      </h2>
      
      <div className="space-y-6">
        {/* Finance Partner Banks Section */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {t('sellerDashboard.financePartnerBanks')}
            </h3>
            <p className="text-sm text-gray-600">{t('sellerDashboard.financePartnerHint')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {availableBanks.map((bank) => {
              const isSelected = selectedBanks.includes(bank);
              return (
                <label
                  key={bank}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleBankToggle(bank)}
                    className="sr-only"
                  />
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                    isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                    {bank}
                  </span>
                </label>
              );
            })}
          </div>

          {selectedBanks.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900 mb-2">
                {t('sellerDashboard.selectedPartners', { count: selectedBanks.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedBanks.map((bank) => (
                  <span
                    key={bank}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                  >
                    {bank}
                    <button
                      onClick={() => handleBankToggle(bank)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                      aria-label={t('sellerDashboard.removeBankAria', { bank })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedBanks.length === 0
                ? t('sellerDashboard.hintNoBanks')
                : t('sellerDashboard.hintListingsShow')}
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isSaving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : saveSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isSaving ? t('sellerDashboard.saving') : saveSuccess ? t('sellerDashboard.saved') : t('sellerDashboard.saveChanges')}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const VehicleForm: React.FC<VehicleFormProps> = memo(({ editingVehicle, onAddVehicle, onUpdateVehicle, onCancel, vehicleData, seller, onFeatureListing: _onFeatureListing, allVehicles, onNotify }) => {
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
                const { loadLocationData } = await import('../utils/dataLoaders');
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
            const { uploadImages, validateImageFile } = await import('../services/imageUploadService');
            
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

const InquiriesView: React.FC<{
  conversations: Conversation[];
  sellerEmail: string;
  sellerUserId?: string;
  onMarkConversationAsReadBySeller: (conversationId: string) => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onSelectConv: (conv: Conversation) => void;
  onSetConversationReadState?: (conversationId: string, isRead: boolean) => void;
  onMarkAllAsReadBySeller?: () => void;

}> = memo(({ conversations, sellerEmail, sellerUserId, onMarkConversationAsReadBySeller, onMarkMessagesAsRead, onSelectConv, onSetConversationReadState, onMarkAllAsReadBySeller }) => {
    const { t } = useTranslation();
    const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');

    const handleSelectConversation = (conv: Conversation) => {
      onSelectConv(conv);
      if(!conv.isReadBySeller) {
        onMarkConversationAsReadBySeller(conv.id);
        onMarkMessagesAsRead(conv.id, 'seller');
      }
    };
    
    // Removed unused test drive handlers

    const sortedConversations = useMemo(() => {
        // Filter conversations to only show those for the current seller
        if (!conversations || !Array.isArray(conversations) || !sellerEmail) {
          if (process.env.NODE_ENV === 'development') {
            logInfo('🔍 InquiriesView: No conversations or sellerEmail', {
              conversationsLength: conversations?.length || 0,
              sellerEmail: sellerEmail || 'missing'
            });
          }
          return [];
        }
        
        // Normalize emails for case-insensitive comparison (critical for production)
        const normalizedSellerEmail = (sellerEmail || '').toLowerCase().trim();
        
        if (process.env.NODE_ENV === 'development') {
          logInfo('🔍 InquiriesView: Filtering conversations', {
            totalConversations: conversations.length,
            normalizedSellerEmail,
            conversations: conversations.map(c => ({
              id: c?.id,
              sellerId: c?.sellerId,
              normalizedSellerId: c?.sellerId ? c.sellerId.toLowerCase().trim() : null,
              customerName: c?.customerName,
              vehicleName: c?.vehicleName,
              messageCount: c?.messages?.length || 0
            }))
          });
        }
        
        const sellerConversations = conversations.filter(conv => {
          if (!conv || !conv.sellerId) {
            if (process.env.NODE_ENV === 'development') {
              logInfo('⚠️ InquiriesView: Skipping conversation - missing sellerId', { convId: conv?.id });
            }
            return false;
          }
          return conversationBelongsToSeller(conv, sellerEmail, sellerUserId);
        });
        
        if (process.env.NODE_ENV === 'development') {
          logInfo('✅ InquiriesView: Filtered conversations', {
            matchedCount: sellerConversations.length,
            matchedIds: sellerConversations.map(c => c.id)
          });
        }
        
        const filtered = sellerConversations.filter((conv) => {
          if (filterMode === 'unread') return !conv.isReadBySeller;
          if (filterMode === 'read') return conv.isReadBySeller;
          return true;
        });
        return [...filtered].sort((a, b) => {
          const dateA = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
    }, [conversations, sellerEmail, sellerUserId, filterMode]);

    return (
       <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
         <h2 className="text-2xl font-bold text-reride-text-dark mb-6">{t('sellerDashboard.nav.messages')}</h2>
         <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilterMode('all')} className={`px-3 py-1 rounded-full text-sm ${filterMode === 'all' ? 'bg-reride-orange text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
            <button type="button" onClick={() => setFilterMode('unread')} className={`px-3 py-1 rounded-full text-sm ${filterMode === 'unread' ? 'bg-reride-orange text-white' : 'bg-gray-200 text-gray-700'}`}>Unread</button>
            <button type="button" onClick={() => setFilterMode('read')} className={`px-3 py-1 rounded-full text-sm ${filterMode === 'read' ? 'bg-reride-orange text-white' : 'bg-gray-200 text-gray-700'}`}>Read</button>
            {onMarkAllAsReadBySeller && (
              <button type="button" onClick={onMarkAllAsReadBySeller} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700" aria-label="Mark all conversations as read">Mark all read</button>
            )}
         </div>
         <div className="space-y-2">
            {sortedConversations.length > 0 ? sortedConversations.map(conv => {
              if (!conv) return null;
              const lastVisible = getLastVisibleMessageForViewer(conv, 'seller');
              const snippet = getThreadLastMessagePreview(lastVisible, {
                otherLabel: conv.customerName || '',
                viewer: 'seller',
              });
              const lastLine = `${snippet.prefix}${snippet.text}`;
              const lastMessageTime = conv.lastMessageAt 
                ? new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                : 'N/A';
              return (
              <Pressable
                key={conv.id}
                onPress={() => handleSelectConversation(conv)}
                className="p-4 rounded-lg cursor-pointer hover:bg-brand-gray-light dark:hover:bg-white border-b dark:border-gray-200 flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                    {!conv.isReadBySeller && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF6B35' }}></div>}
                    <div>
                      <p className="font-bold text-reride-text-dark">
                        {conv.customerName || 'Unknown'} - <span className="font-normal text-reride-text-dark">{conv.vehicleName || 'Unknown Vehicle'}</span>
                      </p>
                      <p className="text-sm text-reride-text-dark truncate max-w-md">
                        {lastVisible ? lastLine : snippet.text}
                      </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                  {onSetConversationReadState && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetConversationReadState(conv.id, !conv.isReadBySeller);
                      }}
                      className="text-xs text-gray-500 hover:text-reride-orange"
                      aria-label={conv.isReadBySeller ? 'Mark conversation as unread' : 'Mark conversation as read'}
                    >
                      {conv.isReadBySeller ? 'Mark unread' : 'Mark read'}
                    </button>
                  )}
                  <span className="text-xs text-reride-text-dark">{lastMessageTime}</span>
                </div>
              </Pressable>
            );
            }) : (
                <div className="text-center py-16 px-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-reride-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-semibold text-reride-text-dark">{t('sellerDashboard.messages.emptyTitle')}</h3>
                    <p className="mt-1 text-sm text-reride-text-dark">{t('sellerDashboard.messages.emptyBody')}</p>
                </div>
            )}
         </div>
       </div>
    );
});




const ReportsView: React.FC<{
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


// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ seller, sellerVehicles, reportedVehicles, onAddVehicle, onAddMultipleVehicles, onUpdateVehicle, onDeleteVehicle, onMarkAsSold, onMarkAsUnsold, conversations, onSellerSendMessage, onMarkConversationAsReadBySeller, onSetConversationReadState, onMarkAllAsReadBySeller, typingStatus, onUserTyping, onUserStoppedTyping, onMarkMessagesAsRead, onClearChat, onDeleteConversation, onArchiveConversation, onUpdateSellerProfile, vehicleData, onFeatureListing, onBoostListing, onRequestCertification, onNavigate, onTestDriveResponse, allVehicles, onOfferResponse, onViewVehicle, chatPeerOnlineByConversationId, onSellerOpenChat, onNotify, notifications = [], onNotificationClick, onMarkNotificationsAsRead }) => {
  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') =>
      dashboardNotify(onNotify, message, type),
    [onNotify],
  );
  void onRequestCertification;
  void onSellerOpenChat;
  void onFeatureListing;

  const { t } = useTranslation();
  
  // CRITICAL: All hooks must be called before any conditional returns (React Rules of Hooks)
  // Initialize all state hooks first
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const {
    commandCenter,
    commandCenterLoading,
    commandCenterError: dealStatsError,
    pendingAcceptCount,
    sellerActiveDeals,
    dealsByVehicleId,
    refreshDealCommandStats,
  } = useSellerDashboardController(seller);
  const [viewedTasksVersion, setViewedTasksVersion] = useState(0);
  const hotLeadsBadgeCount = useMemo(
    () =>
      countActionableSellerTasks(
        commandCenter?.tasks,
        commandCenter?.stats?.pendingInterestCount ?? pendingAcceptCount,
      ),
    // Recompute when seller dismisses a view-only task in-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- viewedTasksVersion bumps after markSellerTaskViewed
    [commandCenter?.tasks, commandCenter?.stats?.pendingInterestCount, pendingAcceptCount, viewedTasksVersion],
  );

  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('reride_seller_open_inquiries') === '1') {
        sessionStorage.removeItem('reride_seller_open_inquiries');
        setActiveView('messages');
      }
    } catch {
      /* ignore */
    }
  }, []);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  // NEW: Boost listing feature
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [vehicleToBoost, setVehicleToBoost] = useState<Vehicle | null>(null);
  const [markSoldVehicle, setMarkSoldVehicle] = useState<Vehicle | null>(null);
  // Pagination state for Active Listings
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [soldPage, setSoldPage] = useState(1);
  // Month selector state for analytics
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  // Users state for contact lookup
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Production error logging helper (must be after hooks)
  const logProductionError = useCallback((error: Error | unknown, context: string) => {
    const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
    if (isProduction) {
      console.error(`[Dashboard Error] ${context}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sellerEmail: seller?.email,
        timestamp: new Date().toISOString()
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ ${context}:`, error);
    }
  }, [seller?.email]);

  // Safety checks: Ensure arrays are initialized and validate all props (must be after hooks)
  const safeSellerVehicles = useMemo(() => Array.isArray(sellerVehicles) ? sellerVehicles : [], [sellerVehicles]);

  /** Include canonical Supabase `databaseId` so API mutations work for UUID primary keys. */
  const buildVehicleActionBody = useCallback(
    (vehicleId: number, extra: Record<string, unknown> = {}) => {
      try {
        return buildVehicleMutationBody(vehicleId, safeSellerVehicles, extra);
      } catch {
        const vehicle = findVehicleByIdentity(safeSellerVehicles, vehicleId);
        const databaseId = vehicle ? getCanonicalPrimaryKey(vehicle) : undefined;
        return {
          vehicleId,
          ...(databaseId ? { databaseId } : {}),
          ...extra,
        };
      }
    },
    [safeSellerVehicles],
  );
  const safeConversations = useMemo(() => Array.isArray(conversations) ? conversations : [], [conversations]);
  const safeReportedVehicles = useMemo(() => Array.isArray(reportedVehicles) ? reportedVehicles : [], [reportedVehicles]);
  const safeVehicleData = useMemo(() => {
    const result = vehicleData && typeof vehicleData === 'object' && Object.keys(vehicleData).length > 0 
      ? vehicleData 
      : {
          'four-wheeler': [],
          'two-wheeler': [],
          'three-wheeler': []
        };
    return result;
  }, [vehicleData]);

  // Check Firebase connection status (only in browser, not SSR)
  const [databaseStatus, setDatabaseStatus] = useState<{ available: boolean; error?: string; details?: string } | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Safely get Firebase status - wrap in try-catch to prevent crashes
        // Firebase removed - using Supabase
        const status = { available: true };
        setDatabaseStatus(status);
      } catch (error) {
        // If Firebase status check fails, set a safe default
        // Don't throw - just log and continue
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('⚠️ Dashboard: Failed to check Firebase status:', errorMessage);
        setDatabaseStatus({ 
          available: false, 
          error: 'Unable to check Firebase status',
          details: errorMessage
        });
      }
    }
  }, []);

  // Refresh user data from API to get updated plan expiry date
  // FIXED: Removed window.location.reload() to prevent crashes - now uses localStorage update only
  useEffect(() => {
    // Only refresh if seller is authenticated
    if (!seller || !seller.email) {
      return;
    }
    
    let isMounted = true;

    const refreshUserData = async () => {
      // Prevent refresh if component is unmounted
      if (!isMounted) {
        return;
      }
      
      try {
        // Validate seller object before making API call
        if (!seller || !seller.email || typeof seller.email !== 'string') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Invalid seller object, skipping user data refresh');
          }
          return;
        }
        
        // Wrap authenticatedFetch in additional error handling to catch network errors
        let response: Response;
        try {
          // Use authenticatedFetch to include JWT token for production API
          // Include token if available (user is logged in, so token should exist)
          // This prevents 401 errors from middleware/proxy layers in production
          // GET /api/users doesn't validate the token, but including it prevents proxy rejection
          response = await authenticatedFetch(`/api/users?email=${encodeURIComponent(seller.email)}`);
          
          // Handle 401 gracefully - don't show error, just skip refresh
          if (response.status === 401) {
            if (process.env.NODE_ENV === 'development' && isMounted) {
              console.warn('⚠️ User data refresh skipped: Authentication required');
            }
            return; // Exit early on 401
          }
        } catch (fetchError) {
          // Catch network errors, CORS errors, or any other fetch-related errors
          // Don't throw - just silently fail to prevent ErrorBoundary from catching
          if (process.env.NODE_ENV === 'development' && isMounted) {
            console.warn('⚠️ Network error during user data refresh:', fetchError);
          }
          return; // Exit early on fetch errors
        }
        
        // Check if component is still mounted after async operation
        if (!isMounted) {
          return;
        }
        
        // Validate response object exists
        if (!response || typeof response !== 'object') {
          if (process.env.NODE_ENV === 'development' && isMounted) {
            console.warn('⚠️ Invalid response object from authenticatedFetch');
          }
          return;
        }
        
        if (response.ok) {
          // Check content type before parsing
          const contentType = response.headers?.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ API returned non-JSON response, skipping user refresh');
            }
            return;
          }
          
          let users: User[];
          try {
            const payload = await response.json();
            users = Array.isArray(payload) ? payload : (payload && payload.email ? [payload as User] : []);
          } catch (jsonError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Failed to parse JSON response:', jsonError);
            }
            return;
          }
          
          // Check if component is still mounted after async operation
          if (!isMounted) {
            return;
          }
          
          // Store users in state for use in JSX
          if (users.length > 0) {
            setAllUsers(users);
          }
          
          if (users.length > 0 && seller?.email) {
            // Normalize emails for comparison (critical for production)
            const normalizedSellerEmail = seller.email.toLowerCase().trim();
            const updatedSeller = users.find((u: User) => {
              if (!u || !u.email) return false;
              return u.email.toLowerCase().trim() === normalizedSellerEmail;
            });
            if (updatedSeller) {
              // Check if plan expiry date has changed
              const currentExpiry = seller.planExpiryDate;
              const newExpiry = updatedSeller.planExpiryDate;
              
              // Only update if expiry date actually changed
              if (currentExpiry !== newExpiry || 
                  updatedSeller.planActivatedDate !== seller.planActivatedDate ||
                  updatedSeller.subscriptionPlan !== seller.subscriptionPlan) {
                try {
                  // Update localStorage with fresh user data
                  // FIXED: Removed window.location.reload() - localStorage update is sufficient
                  // The App component will pick up the change through its own refresh mechanism
                  localStorage.setItem('reRideCurrentUser', currentUserForLocalSessionJson(updatedSeller));
                  
                  // Dispatch a custom event to notify other components of the update
                  // This allows the app to update without a full page reload
                  window.dispatchEvent(new CustomEvent('userDataUpdated', { 
                    detail: { user: updatedSeller } 
                  }));
                  
                  if (process.env.NODE_ENV === 'development') {
                    logInfo('✅ User data updated in localStorage (plan expiry changed)');
                  }
                } catch (storageError) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Failed to update localStorage:', storageError);
                  }
                }
              }
            }
          }
        } else {
          // Log non-OK responses but don't throw errors (except 401 which is handled above)
          if (response.status !== 401 && process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ User refresh API returned ${response.status}: ${response.statusText}`);
          }
        }
      } catch (error) {
        // Log errors in production for debugging
        if (isMounted) {
          logProductionError(error, 'Failed to refresh user data');
        }
        // Don't throw - silently fail to prevent dashboard crash
      }
    };

    // Refresh user data when component mounts and every 60 seconds (increased from 30 to reduce load)
    // FIXED: Only refresh on mount, not on every dependency change to prevent loops
    refreshUserData();
    const onUserDataEvent = () => {
      if (isMounted) void refreshUserData();
    };
    window.addEventListener('userDataUpdated', onUserDataEvent);
    const onVisibility = () => {
      if (isMounted && document.visibilityState === 'visible') {
        void refreshUserData();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    
    return () => {
      isMounted = false;
      window.removeEventListener('userDataUpdated', onUserDataEvent);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [seller?.email, seller?.planExpiryDate, seller?.planActivatedDate, seller?.subscriptionPlan]); // FIXED: Include all plan-related fields to prevent stale closures
  
  // Location data is now handled by individual components that need it
  
  // Helper function to filter vehicles by month
  const filterVehiclesByMonth = useCallback((vehicles: Vehicle[], month: string): Vehicle[] => {
    if (month === 'all') return vehicles;
    
    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
    
    return vehicles.filter(v => {
      const vehicleDate = v.createdAt ? new Date(v.createdAt) : null;
      if (!vehicleDate) return false;
      return vehicleDate >= startDate && vehicleDate <= endDate;
    });
  }, []);
  
  // Generate month options for the last 12 months — memoized to a stable array so
  // the <select>'s option list doesn't allocate a fresh array on every render.
  const monthOptions = useMemo(() => {
    const months: { value: string; label: string }[] = [{ value: 'all', label: 'All Time' }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value: monthValue, label: monthLabel });
    }
    return months;
  }, []);


  // Refresh vehicle data from API when form view is opened or when editing a vehicle
  useEffect(() => {
    if (activeView === 'form' || editingVehicle) {
      const refreshVehicleData = async () => {
        try {
          // Validate that we have a valid seller before fetching data
          if (!seller || !seller.email) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Cannot refresh vehicle data: seller information missing');
            }
            return;
          }

          const { getVehicleData } = await import('../services/vehicleDataService');
          const freshData = await getVehicleData();
          
          // Validate the data before using it
          if (freshData && typeof freshData === 'object' && Object.keys(freshData).length > 0) {
            try {
              // Update localStorage to trigger storage event for other tabs
              localStorage.setItem('reRideVehicleData', JSON.stringify(freshData));
              // Dispatch custom event for same-tab sync
              window.dispatchEvent(new CustomEvent('vehicleDataUpdated', { detail: { vehicleData: freshData } }));
              if (process.env.NODE_ENV === 'development') {
                logInfo('✅ Vehicle data refreshed when opening form');
              }
            } catch (storageError) {
              // Log storage errors but don't crash
              logProductionError(storageError, 'Failed to save vehicle data to localStorage');
            }
          } else {
            logProductionError(new Error('Invalid vehicle data structure'), 'Vehicle data refresh returned invalid data');
          }
        } catch (error) {
          // Log errors but don't crash the dashboard
          logProductionError(error, 'Failed to refresh vehicle data when opening form');
        }
      };
      refreshVehicleData();
    }
  }, [activeView, editingVehicle, seller]);

  useEffect(() => {
    // FIXED: Added safety checks to prevent crashes
    if (selectedConv && safeConversations && Array.isArray(safeConversations)) {
        try {
            const updatedConversation = safeConversations.find(c => c && c.id && c.id === selectedConv.id);
            if (updatedConversation) {
                // Using stringify is a simple way to deep-compare for changes.
                // Added try-catch to handle circular references or serialization errors
                try {
                    if (JSON.stringify(updatedConversation) !== JSON.stringify(selectedConv)) {
                        setSelectedConv(updatedConversation);
                    }
                } catch (stringifyError) {
                    // If stringify fails, do a shallow comparison instead
                    if (updatedConversation.messages?.length !== selectedConv.messages?.length ||
                        updatedConversation.isReadBySeller !== selectedConv.isReadBySeller) {
                        setSelectedConv(updatedConversation);
                    }
                }
            } else {
                // The selected conversation is no longer in the list, so deselect it.
                setSelectedConv(null);
            }
        } catch (error) {
            // Silently handle errors to prevent crashes
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Error updating selected conversation:', error);
            }
        }
    }
  }, [safeConversations, selectedConv]);

  const unreadCount = useMemo(() => {
    if (!seller?.email) return 0;
    return safeConversations.filter((c) => {
      if (!c || c.isReadBySeller === true || !c.sellerId) return false;
      return conversationBelongsToSeller(c, seller.email, seller.id);
    }).length;
  }, [safeConversations, seller?.email, seller?.id]);
  const sellerNotifications = useMemo(
    () => (notifications || []).filter((n) => n.recipientEmail === seller?.email),
    [notifications, seller?.email],
  );
  const unreadNotificationCount = useMemo(
    () => sellerNotifications.filter((n) => !n.isRead).length,
    [sellerNotifications],
  );
  const activeListings = useMemo(() => safeSellerVehicles.filter(v => v && v.status !== 'sold'), [safeSellerVehicles]);
  const publishedListings = useMemo(() => safeSellerVehicles.filter(v => v && v.status === 'published'), [safeSellerVehicles]);
  const soldListings = useMemo(() => safeSellerVehicles.filter(v => v && v.status === 'sold'), [safeSellerVehicles]);
  const reportedCount = useMemo(() => safeReportedVehicles.length, [safeReportedVehicles]);
  
  // Pagination for sold listings (Sales History)
  const SOLD_PAGE_SIZE = 10;
  const totalSoldPages = Math.max(1, Math.ceil(soldListings.length / SOLD_PAGE_SIZE));
  const paginatedSoldListings = useMemo(() => {
    const start = (soldPage - 1) * SOLD_PAGE_SIZE;
    return soldListings.slice(start, start + SOLD_PAGE_SIZE);
  }, [soldListings, soldPage]);
  useEffect(() => {
    // Reset to first page whenever the underlying list changes
    setSoldPage(1);
  }, [soldListings]);
  
  // Filter listings by selected month for analytics (published only)
  const filteredPublishedListings = useMemo(() => 
    filterVehiclesByMonth(publishedListings, selectedMonth), 
    [publishedListings, selectedMonth, filterVehiclesByMonth]
  );
  const filteredSoldListings = useMemo(() => 
    filterVehiclesByMonth(soldListings, selectedMonth), 
    [soldListings, selectedMonth, filterVehiclesByMonth]
  );
  
  // Pagination calculations for Active Listings
  const totalPages = useMemo(() => Math.ceil(activeListings.length / itemsPerPage), [activeListings.length, itemsPerPage]);
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return activeListings.slice(startIndex, endIndex);
  }, [activeListings, currentPage, itemsPerPage]);
  
  // Reset to page 1 when listings change or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeListings.length, activeView]);
  
  const analyticsData = useMemo(() => {
    // FIXED: Added safety checks to prevent crashes from null/undefined data
    try {
      const safeFilteredSoldListings = Array.isArray(filteredSoldListings) ? filteredSoldListings : [];
      const safeFilteredPublishedListings = Array.isArray(filteredPublishedListings) ? filteredPublishedListings : [];
      
      const totalSalesValue = safeFilteredSoldListings.reduce((sum: number, v) => {
        if (!v || typeof v.price !== 'number') return sum;
        return sum + v.price;
      }, 0);
      
      const totalViews = safeFilteredPublishedListings.reduce((sum, v) => {
        if (!v || typeof v.views !== 'number') return sum;
        return sum + v.views;
      }, 0);
      
      const totalInquiries = countInquiriesForVehicles(
        safeFilteredPublishedListings,
        safeConversations,
        seller?.email,
        seller?.id,
      );
      
      const chartLabels = safeFilteredPublishedListings.map(v => {
        if (!v) return '';
        const year = v.year || '';
        const model = v.model || '';
        const variant = v.variant || '';
        return `${year} ${model} ${variant}`.trim().slice(0, 25);
      }).filter(label => label.length > 0);
      
      const chartData = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Views',
            data: safeFilteredPublishedListings.map(v => (v && typeof v.views === 'number') ? v.views : 0),
            backgroundColor: 'rgba(255, 107, 53, 0.5)',
            borderColor: 'rgba(255, 107, 53, 1)',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'Inquiries',
            data: safeFilteredPublishedListings.map(v =>
              countInquiriesForVehicle(v, safeConversations, seller?.email, seller?.id),
            ),
            backgroundColor: 'rgba(30, 136, 229, 0.5)',
            borderColor: 'rgba(30, 136, 229, 1)',
            borderWidth: 1,
            yAxisID: 'y1',
          },
        ],
      };
      return { totalSalesValue, totalViews, totalInquiries, chartData };
    } catch (error) {
      // Return safe defaults if computation fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error computing analytics data:', error);
      }
      return {
        totalSalesValue: 0,
        totalViews: 0,
        totalInquiries: 0,
        chartData: {
          labels: [],
          datasets: [
            { label: 'Views', data: [], backgroundColor: 'rgba(255, 107, 53, 0.5)', borderColor: 'rgba(255, 107, 53, 1)', borderWidth: 1, yAxisID: 'y' },
            { label: 'Inquiries', data: [], backgroundColor: 'rgba(30, 136, 229, 0.5)', borderColor: 'rgba(30, 136, 229, 1)', borderWidth: 1, yAxisID: 'y1' }
          ]
        }
      };
    }
  }, [filteredPublishedListings, filteredSoldListings, safeConversations, seller?.email, seller?.id]);

  const handleNavigate = (view: DashboardView) => {
    if (view !== 'messages') {
        setSelectedConv(null);
    }
    setActiveView(view);
  };

  const openHotLeadConversation = useCallback(
    (conv: Conversation) => {
      setSelectedConv(conv);
      onMarkConversationAsReadBySeller(conv.id);
      onMarkMessagesAsRead(conv.id, 'seller');
      handleNavigate('messages');
    },
    [onMarkConversationAsReadBySeller, onMarkMessagesAsRead],
  );

  const sellerPlan = useMemo(
    () => ({
      subscriptionPlan: seller?.subscriptionPlan,
      planExpiryDate: seller?.planExpiryDate,
    }),
    [seller?.subscriptionPlan, seller?.planExpiryDate],
  );

  const [sellerPlanDetails, setSellerPlanDetails] = useState<PlanDetails | null>(null);

  useEffect(() => {
    let active = true;
    const loadPlan = async () => {
      try {
        const details = await planService.getPlanDetails((seller?.subscriptionPlan || 'free') as SubscriptionPlan);
        if (active) setSellerPlanDetails(details);
      } catch {
        if (active) setSellerPlanDetails(null);
      }
    };
    void loadPlan();
    return () => {
      active = false;
    };
  }, [seller?.subscriptionPlan]);

  const listingAtLimit = useMemo(
    () => isListingLimitReached(sellerPlan, safeSellerVehicles, sellerPlanDetails),
    [sellerPlan, safeSellerVehicles, sellerPlanDetails],
  );

  const isVehicleListingExpired = useCallback(
    (vehicle: Vehicle) => isListingExpired(vehicle, sellerPlan),
    [sellerPlan],
  );

  const getListingRenewalValidation = useCallback(
    (vehicle: Vehicle): ListingRenewalValidation =>
      validateListingRenewal(sellerPlan, vehicle, safeSellerVehicles),
    [sellerPlan, safeSellerVehicles],
  );

  const handleRefreshVehicle = async (vehicleId: number) => {
    try {
      const response = await authenticatedFetch('/api/vehicles?action=refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildVehicleActionBody(vehicleId, {
          action: 'refresh',
          refreshAction: 'refresh',
          sellerEmail: seller?.email,
        }))
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json();
            if (result && result.success && result.vehicle) {
              // Update local state instead of reloading page
              onUpdateVehicle(result.vehicle);
              if (process.env.NODE_ENV === 'development') {
                logInfo('✅ Vehicle refreshed successfully');
              }
            }
          } catch (jsonError) {
            console.warn('⚠️ Failed to parse refresh response:', jsonError);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Failed to refresh vehicle: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      // Silently handle errors to prevent dashboard crashes
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error refreshing vehicle:', error);
      }
    }
  };

  const handleRenewVehicle = async (vehicleId: number) => {
    const vehicle = safeSellerVehicles.find((v) => v && v.id === vehicleId);
    if (!vehicle) {
      dashboardNotify(onNotify, 'Listing not found. Please refresh and try again.', 'error');
      return;
    }

    const validation = validateListingRenewal(sellerPlan, vehicle, safeSellerVehicles);
    if (!validation.allowed) {
      dashboardNotify(onNotify, validation.reason || 'Cannot renew this listing.', 'error');
      return;
    }

    try {
      const response = await authenticatedFetch('/api/vehicles?action=refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildVehicleActionBody(vehicleId, {
          action: 'refresh',
          refreshAction: 'renew',
          sellerEmail: seller?.email,
        }))
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json();
            if (result && result.success && result.vehicle) {
              onUpdateVehicle(result.vehicle);
              dashboardNotify(
                onNotify,
                'Listing renewed successfully. It is visible to buyers again.',
                'success',
              );
            } else {
              dashboardNotify(onNotify, result?.reason || 'Failed to renew listing. Please try again.', 'error');
            }
          } catch (jsonError) {
            console.warn('⚠️ Failed to parse renew response:', jsonError);
            dashboardNotify(onNotify, 'Failed to renew listing. Please try again.', 'error');
          }
        }
      } else {
        try {
          const err = await response.json();
          dashboardNotify(onNotify, err?.reason || 'Failed to renew listing. Please try again.', 'error');
        } catch {
          dashboardNotify(onNotify, 'Failed to renew listing. Please try again.', 'error');
        }
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Failed to renew vehicle: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      dashboardNotify(onNotify, 'Failed to renew listing. Please try again.', 'error');
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error renewing vehicle:', error);
      }
    }
  };

  const handleCertifyVehicle = async (vehicleId: number) => {
    try {
      // Prefer app-level callback (handles centralized auth/state/toast logic)
      if (onRequestCertification) {
        await onRequestCertification(vehicleId);
        return;
      }

      const response = await authenticatedFetch('/api/vehicles?action=certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildVehicleActionBody(vehicleId))
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json();
            if (result && result.success && result.vehicle) {
              // Update local state
              onUpdateVehicle(result.vehicle);
              if (process.env.NODE_ENV === 'development') {
                logInfo('✅ Certification request submitted');
              }
            }
          } catch (jsonError) {
            console.warn('⚠️ Failed to parse certification response:', jsonError);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Failed to submit certification request: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      // Silently handle errors to prevent dashboard crashes
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error submitting certification request:', error);
      }
    }
  };

  const handleMarkAsSold = async (vehicleId: number) => {
    const vehicle = safeSellerVehicles.find((v) => v?.id === vehicleId);
    if (vehicle) {
      setMarkSoldVehicle(vehicle);
      return;
    }
    try {
      // Prefer app-level callback so state/toasts stay consistent across environments
      if (onMarkAsSold) {
        await onMarkAsSold(vehicleId);
        return;
      }

      const response = await authenticatedFetch('/api/vehicles?action=sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildVehicleActionBody(vehicleId))
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json();
            if (result && result.success && result.vehicle) {
              // Update local state
              onUpdateVehicle(result.vehicle);
              if (process.env.NODE_ENV === 'development') {
                logInfo('✅ Vehicle marked as sold');
              }
            } else if (result && result.reason) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Failed to mark vehicle as sold:', result.reason);
              }
            }
          } catch (jsonError) {
            console.warn('⚠️ Failed to parse sold response:', jsonError);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          try {
            const errorText = await response.text();
            console.warn(`⚠️ Failed to mark vehicle as sold: ${response.status} ${errorText}`);
          } catch (textError) {
            console.warn(`⚠️ Failed to mark vehicle as sold: ${response.status}`);
          }
        }
      }
    } catch (error) {
      // Silently handle errors to prevent dashboard crashes
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error marking vehicle as sold:', error);
      }
    }
  };

  const handleMarkAsUnsold = async (vehicleId: number) => {
    try {
      // Use the onMarkAsUnsold prop if available (handles through App.tsx with proper state updates and toast notifications)
      if (onMarkAsUnsold) {
        await onMarkAsUnsold(vehicleId);
        return;
      }

      // Fallback: shared service path (heals stale listing identity before POST)
      const { markVehicleAsUnsold } = await import('../services/vehicleService.js');
      const updated = await markVehicleAsUnsold(vehicleId, safeSellerVehicles);
      onUpdateVehicle(updated);
    } catch (error) {
      // Silently handle errors to prevent dashboard crashes
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error marking vehicle as unsold:', error);
      }
      // Error is logged, but UI feedback should come from App.tsx via onMarkAsUnsold prop
      if (!onMarkAsUnsold) {
        // Only show alert if prop is not available (shouldn't happen in normal flow)
        notify(error instanceof Error ? error.message : 'Failed to mark vehicle as unsold. Please try again.');
      }
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    // FIXED: Added safety check to prevent crashes
    if (!vehicle || !vehicle.id) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Attempted to edit invalid vehicle');
      }
      return;
    }
    try {
      setEditingVehicle(vehicle);
      handleNavigate('form');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error in handleEditClick:', error);
      }
    }
  };
  
  const notifyListingLimitReached = useCallback(() => {
    dashboardNotify(
      onNotify,
      `You've reached your plan's active listing limit. Unpublish or sell a listing, or upgrade your plan.`,
      'warning',
    );
  }, [onNotify]);

  const handleAddNewClick = () => {
    try {
      if (listingAtLimit) {
        notifyListingLimitReached();
        return;
      }
      setEditingVehicle(null);
      handleNavigate('form');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error in handleAddNewClick:', error);
      }
    }
  }

  const handleFormCancel = () => {
    try {
      setEditingVehicle(null);
      handleNavigate('listings');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error in handleFormCancel:', error);
      }
    }
  }

  const handleNavigateToVehicle = (vehicleId: number) => {
    // FIXED: Added safety checks
    if (!vehicleId || !Number.isInteger(vehicleId)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Invalid vehicleId provided:', vehicleId);
      }
      return;
    }
    try {
      const vehicle = safeSellerVehicles.find(v => v && v.id === vehicleId);
      if (vehicle) {
        handleEditClick(vehicle);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error in handleNavigateToVehicle:', error);
      }
    }
  };

  const handleNavigateToInquiry = (conversationId: string) => {
    // FIXED: Added safety checks
    if (!conversationId || typeof conversationId !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Invalid conversationId provided:', conversationId);
      }
      return;
    }
    try {
      const conv = safeConversations.find(c => c && c.id === conversationId);
      if (conv) {
        openHotLeadConversation(conv);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error in handleNavigateToInquiry:', error);
      }
    }
  };


  // Guard against missing seller / callbacks (after all hooks — Rules of Hooks)
  if (!seller || !seller.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sellerDashboard.infoMissing')}</h2>
          <p className="text-gray-600 mb-6">{t('sellerDashboard.loadFailed')}</p>
          <button
            onClick={() => onNavigate(View.SELLER_LOGIN)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            {t('sellerDashboard.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  if (!onAddVehicle || !onUpdateVehicle || !onDeleteVehicle || !onMarkAsSold) {
    console.error('❌ Dashboard: Missing required callback functions');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sellerDashboard.configError')}</h2>
          <p className="text-gray-600 mb-6">{t('sellerDashboard.configErrorBody')}</p>
          <button
            type="button"
            onClick={() => {
              try {
                window.location.assign(window.location.pathname + window.location.search);
              } catch {
                window.location.reload();
              }
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            {t('sellerDashboard.reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  const renderPendingDealsBanner = () => {
    if (dealStatsError && activeView !== 'overview') {
      return (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-800">Could not load buyer leads</p>
            <p className="text-xs text-red-700 mt-0.5">{dealStatsError}</p>
          </div>
          <button
            type="button"
            onClick={() => refreshDealCommandStats()}
            className="shrink-0 px-4 py-2 text-sm font-bold rounded-lg bg-red-700 text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      );
    }
    if (pendingAcceptCount <= 0 || activeView === 'overview') return null;
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {pendingAcceptCount === 1
              ? '1 buyer is waiting for you to accept chat'
              : `${pendingAcceptCount} buyers are waiting for you to accept chat`}
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            {t('sellerDashboard.hotLeads.openBanner')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleNavigate('messages')}
          className="shrink-0 px-4 py-2 text-sm font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700"
        >
          {t('sellerDashboard.hotLeads.openButton')}
        </button>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeView) {
      case 'overview':
        if (selectedDealId) {
          return (
            <SellerPremiumPanel
              eyebrow="Deal"
              title="Lead detail"
              description="Review the buyer conversation and next steps."
              actions={
                <button
                  type="button"
                  onClick={() => setSelectedDealId(null)}
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-stone-700"
                  style={sellerPremiumGhostBtnStyle}
                >
                  Back to leads
                </button>
              }
            >
              <DealDetailPage
                leadId={selectedDealId}
                currentUser={seller}
                role="seller"
                conversations={safeConversations.filter((c) =>
                  c && seller?.email ? conversationBelongsToSeller(c, seller.email, seller.id) : false,
                )}
                onBack={() => setSelectedDealId(null)}
                onOpenConversation={openHotLeadConversation}
                onNotify={(message, type) => onNotify?.(message, type ?? 'info')}
              />
            </SellerPremiumPanel>
          );
        }
        return (
          <div className="space-y-6">
            <SellerPremiumPanel
              eyebrow="Command"
              title="Hot leads"
              description="Accept chats, move deals forward, and keep buyers warm."
            >
              <SellerCommandHome
                seller={seller}
                commandCenter={commandCenter}
                commandCenterLoading={commandCenterLoading}
                commandCenterError={dealStatsError}
                onRefreshCommandCenter={(force) => refreshDealCommandStats(force)}
                conversations={safeConversations.filter((c) =>
                  c && seller?.email ? conversationBelongsToSeller(c, seller.email, seller.id) : false,
                )}
                onOpenDeal={(leadId) => setSelectedDealId(leadId)}
                onOpenConversation={openHotLeadConversation}
                onNavigateToMessages={() => handleNavigate('messages')}
                onNavigateToListings={() => handleNavigate('listings')}
                onNotify={(message, type) => {
                  onNotify?.(message, type ?? 'info');
                  void refreshDealCommandStats(true);
                }}
                onTaskViewed={() => setViewedTasksVersion((v) => v + 1)}
                onSignInAgain={() => {
                  void (async () => {
                    const { clearPersistedUserSession } = await import('../utils/validatePersistedSession.js');
                    const { logout } = await import('../services/userService.js');
                    clearPersistedUserSession();
                    logout();
                    onNavigate(View.SELLER_LOGIN);
                    window.location.reload();
                  })();
                }}
              />
            </SellerPremiumPanel>
          </div>
        );
      case 'analytics':
        return (
            <div className="space-y-6">
                <SellerPremiumPanel
                  eyebrow="Insights"
                  title="Analytics"
                  description="Performance across listings, views, and inquiries."
                  actions={
                    <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">Month</span>
                      <select
                            id="month-selector"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            style={{ border: '1px solid rgba(28,25,23,0.12)' }}
                        >
                            {monthOptions.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                    </label>
                  }
                >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Active Listings" value={filteredPublishedListings.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" /></svg>} />
                    <StatCard title="Total Sales Value" value={formatSalesValue(analyticsData.totalSalesValue)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                    <StatCard title="Total Views" value={analyticsData.totalViews.toLocaleString('en-IN')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057 5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
                    <StatCard title="Total Inquiries" value={analyticsData.totalInquiries.toLocaleString('en-IN')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
                </div>
                
                {/* Boost Analytics */}
                {(() => {
                  const activeBoosts = safeSellerVehicles.flatMap(v => 
                    v && v.activeBoosts ? v.activeBoosts.filter(boost => boost.isActive && new Date(boost.expiresAt) > new Date()) : []
                  );
                  
                  if (activeBoosts.length > 0) {
                    return (
                      <div
                        className="mt-6 rounded-2xl p-5"
                        style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.14)' }}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-stone-900" style={{ letterSpacing: '-0.02em' }}>
                            Active boost campaigns
                          </h3>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)' }}
                          >
                            {activeBoosts.length} active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                          {activeBoosts.map(boost => {
                            const vehicle = safeSellerVehicles.find(v => v && v.activeBoosts?.some(b => b.id === boost.id));
                            const daysLeft = Math.ceil((new Date(boost.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <div
                                key={boost.id}
                                className="rounded-xl bg-white p-4"
                                style={{ border: '1px solid rgba(28,25,23,0.08)' }}
                              >
                                <p className="text-[12px] font-semibold capitalize text-stone-800">
                                  {boost.type.replace(/_/g, ' ')}
                                </p>
                                <p className="mt-1 text-[11px] text-stone-500">
                                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-medium text-stone-500">{daysLeft}d left</span>
                                  <div className="h-1 w-16 overflow-hidden rounded-full bg-stone-100">
                                    <div 
                                      className="h-full transition-all duration-300"
                                      style={{
                                        width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%`,
                                        background: 'linear-gradient(90deg, #FF8456, #E85A2A)',
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="mt-6 rounded-2xl p-5 sm:p-6" style={{ border: '1px solid rgba(28,25,23,0.08)', background: 'rgba(255,255,255,0.7)' }}>
                    <h3 className="mb-5 text-base font-semibold text-stone-900" style={{ letterSpacing: '-0.02em' }}>
                      Listing performance
                    </h3>
                    {filteredPublishedListings.length > 0 ? (
                        (() => {
                          try {
                            // Safety check: ensure chartData is valid before rendering
                            if (!analyticsData?.chartData || !analyticsData.chartData.labels || !analyticsData.chartData.datasets) {
                              return (
                                <div className="px-6 py-16 text-center">
                                  <h3 className="mt-2 text-lg font-semibold text-stone-900">Chart data unavailable</h3>
                                  <p className="mt-1 text-sm text-stone-500">
                                    Unable to load chart data. Please refresh the page.
                                  </p>
                                </div>
                              );
                            }
                            
                            return (
                              <React.Suspense
                                fallback={
                                  <div className="flex h-80 items-center justify-center sm:h-96">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-reride-orange border-t-transparent" />
                                  </div>
                                }
                              >
                                <AnalyticsChart data={analyticsData.chartData} />
                              </React.Suspense>
                            );
                          } catch (chartError) {
                            // Log error but don't crash the dashboard
                            if (process.env.NODE_ENV === 'development') {
                              console.error('❌ Error rendering chart:', chartError);
                            }
                            return (
                              <div className="px-6 py-16 text-center">
                                <h3 className="mt-2 text-lg font-semibold text-stone-900">Chart error</h3>
                                <p className="mt-1 text-sm text-stone-500">
                                  Unable to display chart. Please refresh the page.
                                </p>
                              </div>
                            );
                          }
                        })()
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <h3 className="mt-2 text-lg font-semibold text-stone-900">No data to display</h3>
                            <p className="mt-1 text-sm text-stone-500">
                                {selectedMonth === 'all' 
                                    ? 'Add a vehicle to see performance data.' 
                                    : 'No data available for the selected month.'}
                            </p>
                        </div>
                    )}
                </div>
                </SellerPremiumPanel>
            </div>
        );
      case 'listings':
        return (
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F5 100%)',
              border: '1px solid rgba(28, 25, 23, 0.08)',
              boxShadow: '0 24px 48px -32px rgba(28, 25, 23, 0.28)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-28"
              style={{
                background:
                  'radial-gradient(80% 120% at 0% 0%, rgba(255,107,53,0.14), transparent 55%), radial-gradient(60% 100% at 100% 0%, rgba(28,25,23,0.05), transparent 50%)',
              }}
            />
            <div className="relative p-5 sm:p-7">
              {renderPendingDealsBanner()}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-stone-400">Inventory</p>
                  <h2
                    className="mt-1 text-[1.65rem] font-semibold tracking-tight text-stone-900"
                    style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.03em' }}
                  >
                    My listings
                  </h2>
                  <p className="mt-1.5 text-sm text-stone-500">
                    {activeListings.length} active · boost to climb search and homepage placement
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkUploadOpen(true)}
                    className="inline-flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white"
                    style={{ border: '1px solid rgba(28,25,23,0.12)', background: 'rgba(255,255,255,0.7)' }}
                  >
                    Bulk upload
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewClick}
                    className="inline-flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)',
                      boxShadow: '0 12px 24px -14px rgba(232,90,42,0.85)',
                    }}
                  >
                    List new vehicle
                  </button>
                </div>
              </div>

              {activeListings.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(28,25,23,0.08)' }}>
                    <table className="min-w-full">
                      <thead>
                        <tr style={{ background: 'rgba(28,25,23,0.03)' }}>
                          {['Vehicle', 'Price', 'Views', 'Status', 'Actions'].map((label) => (
                            <th
                              key={label}
                              className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400 ${
                                label === 'Actions' ? 'text-right' : 'text-left'
                              }`}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedListings.map((v) => {
                          const renewalValidation = getListingRenewalValidation(v);
                          const vehicleDeals =
                            dealsByVehicleId.get(String(v.id)) ||
                            (v.databaseId ? dealsByVehicleId.get(String(v.databaseId)) : undefined) ||
                            [];
                          const thumb = getFirstValidImage(v.images || [], v.id);
                          const activeBoosts = (v.activeBoosts || []).filter(
                            (boost) => boost.isActive && new Date(boost.expiresAt) > new Date(),
                          );
                          return (
                            <tr
                              key={v.id}
                              onClick={() => {
                                if (onViewVehicle) onViewVehicle(v);
                              }}
                              className="group cursor-pointer border-t transition-colors"
                              style={{ borderColor: 'rgba(28,25,23,0.06)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,107,53,0.035)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <td className="px-4 py-3.5">
                                <div className="flex min-w-[14rem] items-center gap-3">
                                  <div
                                    className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100"
                                    style={{ border: '1px solid rgba(28,25,23,0.06)' }}
                                  >
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt={`${v.year} ${v.make} ${v.model}`}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                                          <path d="M3 13l2-5a2 2 0 012-1h8a2 2 0 012 1l2 5" />
                                          <path d="M5 13h14v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z" />
                                          <circle cx="7.5" cy="16.5" r="1.2" />
                                          <circle cx="16.5" cy="16.5" r="1.2" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className="truncate text-[14px] font-semibold text-stone-900"
                                      style={{ letterSpacing: '-0.015em' }}
                                    >
                                      {v.year} {v.make} {v.model}
                                    </p>
                                    {v.variant ? (
                                      <p className="truncate text-[12px] text-stone-500">{v.variant}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap text-[14px] font-semibold tabular-nums text-stone-800">
                                ₹{v.price.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3.5 text-[13px] tabular-nums text-stone-500">
                                {(typeof v.views === 'number' ? v.views : 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col items-start gap-1.5">
                                  <ListingLifecycleIndicator
                                    vehicle={v}
                                    seller={seller}
                                    compact={true}
                                    onRefresh={() => handleRefreshVehicle(v.id)}
                                    onRenew={() => handleRenewVehicle(v.id)}
                                  />
                                  {vehicleDeals.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const lead = vehicleDeals[0];
                                        if (lead) setSelectedDealId(lead.id);
                                        handleNavigate('overview');
                                      }}
                                      className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-amber-900 transition hover:brightness-95"
                                      style={{ background: 'rgba(251, 191, 36, 0.22)' }}
                                    >
                                      {vehicleDeals.length} buyer lead{vehicleDeals.length === 1 ? '' : 's'}
                                      {vehicleDeals.some((d) => d.chatStatus === 'pending') ? ' · Accept chat' : ''}
                                    </button>
                                  ) : null}
                                  {activeBoosts.map((boost) => {
                                    const daysLeft = Math.max(
                                      1,
                                      Math.ceil(
                                        (new Date(boost.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                                      ),
                                    );
                                    return (
                                      <span
                                        key={boost.id}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-orange-900"
                                        style={{ background: 'rgba(255,107,53,0.14)' }}
                                      >
                                        Boost · {boost.type.replace(/_/g, ' ')} · {daysLeft}d
                                      </span>
                                    );
                                  })}
                                  {isEffectivelyFeatured(v) && activeBoosts.length === 0 ? (
                                    <span
                                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-orange-900"
                                      style={{ background: 'rgba(255,107,53,0.14)' }}
                                    >
                                      Featured
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <SellerListingsActions
                                  vehicle={v}
                                  isExpired={isVehicleListingExpired(v)}
                                  renewAllowed={renewalValidation.allowed}
                                  renewReason={renewalValidation.reason}
                                  onBoost={() => {
                                    setVehicleToBoost(v);
                                    setShowBoostModal(true);
                                  }}
                                  onRenew={() => handleRenewVehicle(v.id)}
                                  onRenewBlocked={(reason) =>
                                    dashboardNotify(onNotify, reason, 'error')
                                  }
                                  onEdit={() => handleEditClick(v)}
                                  onSold={() => handleMarkAsSold(v.id)}
                                  onDelete={() => onDeleteVehicle(v.id)}
                                  onCertify={() => handleCertifyVehicle(v.id)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {activeListings.length > itemsPerPage && (
                    <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'rgba(28,25,23,0.08)' }}>
                      <p className="text-[12.5px] text-stone-500">
                        Showing{' '}
                        <span className="font-semibold text-stone-800">
                          {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, activeListings.length)}
                        </span>{' '}
                        of <span className="font-semibold text-stone-800">{activeListings.length}</span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                          style={{ border: '1px solid rgba(28,25,23,0.12)' }}
                        >
                          Prev
                        </button>
                        <span className="px-2 text-[12px] font-medium text-stone-500">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                          style={{ border: '1px solid rgba(28,25,23,0.12)' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="rounded-2xl px-6 py-14 text-center"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,247,237,0.65))',
                    border: '1px dashed rgba(28,25,23,0.14)',
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-orange-600"
                    style={{ background: 'rgba(255,107,53,0.12)' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                      <path d="M3 13l2-5a2 2 0 012-1h8a2 2 0 012 1l2 5" />
                      <path d="M5 13h14v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z" />
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.02em' }}
                  >
                    No vehicles listed yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
                    Ready to sell? Add your first vehicle, then use Boost to put it in front of buyers.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddNewClick}
                    className="mt-6 inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)',
                      boxShadow: '0 12px 24px -14px rgba(232,90,42,0.85)',
                    }}
                  >
                    List your first vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'salesHistory':
        return (
          <SellerPremiumPanel
            eyebrow="Closed deals"
            title={t('sellerDashboard.nav.salesHistory')}
            description={
              soldListings.length > 0
                ? `${soldListings.length} sold listing${soldListings.length === 1 ? '' : 's'}`
                : 'Vehicles you have marked as sold.'
            }
          >
            {soldListings.length > 0 ? (
                <div className="overflow-x-auto rounded-xl" style={sellerPremiumTableWrapStyle}>
                <table className="min-w-full">
                  <thead>
                    <tr style={{ background: 'rgba(28,25,23,0.03)' }}>
                      {['Vehicle', 'Sold price', 'Action'].map((label) => (
                        <th
                          key={label}
                          className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSoldListings.map((v) => (
                      <tr 
                        key={v.id}
                        onClick={() => {
                          if (onViewVehicle) {
                            onViewVehicle(v);
                          }
                        }}
                        className="cursor-pointer border-t transition-colors hover:bg-orange-50/40"
                        style={{ borderColor: 'rgba(28,25,23,0.06)' }}
                      >
                        <td className="px-4 py-3.5 text-[14px] font-semibold text-stone-900">
                          {v.year} {v.make} {v.model} {v.variant || ''}
                        </td>
                        <td className="px-4 py-3.5 text-[14px] font-semibold tabular-nums text-stone-800">
                          ₹{v.price.toLocaleString('en-IN')}
                        </td>
                        <td 
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsUnsold(v.id);
                            }}
                            className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:brightness-95"
                            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                          >
                            Mark as unsold
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalSoldPages > 1 && (
                  <div className="flex items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: 'rgba(28,25,23,0.08)' }}>
                    <div className="text-[12px] text-stone-500">
                      Showing {(soldPage - 1) * SOLD_PAGE_SIZE + 1}
                      {' – '}
                      {Math.min(soldPage * SOLD_PAGE_SIZE, soldListings.length)} of {soldListings.length}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSoldPage(p => Math.max(1, p - 1))}
                        disabled={soldPage === 1}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                        style={sellerPremiumGhostBtnStyle}
                      >
                        Prev
                      </button>
                      <span className="px-2 text-[12px] text-stone-500">
                        {soldPage} / {totalSoldPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSoldPage(p => Math.min(totalSoldPages, p + 1))}
                        disabled={soldPage === totalSoldPages}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                        style={sellerPremiumGhostBtnStyle}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                <p className="rounded-xl px-4 py-10 text-center text-sm text-stone-500" style={{ border: '1px dashed rgba(28,25,23,0.14)' }}>
                  You have not sold any vehicles yet.
                </p>
            )}
          </SellerPremiumPanel>
        );
      case 'form':
        return (
          <SellerPremiumPanel
            eyebrow="Listing"
            title={editingVehicle ? 'Edit vehicle' : 'Add vehicle'}
            description={
              editingVehicle
                ? 'Update details, photos, and listing status.'
                : 'Create a listing, then boost it from My listings.'
            }
          >
            <VehicleForm 
              seller={seller}
              editingVehicle={editingVehicle} 
              onAddVehicle={onAddVehicle} 
              onUpdateVehicle={onUpdateVehicle} 
              onCancel={handleFormCancel} 
              vehicleData={safeVehicleData} 
              onFeatureListing={onFeatureListing}
              allVehicles={allVehicles}
              onNotify={onNotify}
            />
          </SellerPremiumPanel>
        );
      case 'messages':
        return (
          <SellerPremiumPanel
            eyebrow="Inbox"
            title={t('sellerDashboard.nav.messages')}
            description="Buyer chats and listing inquiries."
          >
            <InquiriesView 
              conversations={safeConversations} 
              sellerEmail={seller.email}
              sellerUserId={seller.id}
              onMarkConversationAsReadBySeller={onMarkConversationAsReadBySeller} 
              onMarkMessagesAsRead={onMarkMessagesAsRead}
              onSelectConv={setSelectedConv}
              onSetConversationReadState={onSetConversationReadState}
              onMarkAllAsReadBySeller={onMarkAllAsReadBySeller}
            />
          </SellerPremiumPanel>
        );
      case 'settings':
        if (!seller) {
          return (
            <SellerPremiumPanel eyebrow="Account" title="Settings" description="Loading seller profile…">
              <p className="text-sm text-stone-500">{t('sellerDashboard.loadingSellerInfo')}</p>
            </SellerPremiumPanel>
          );
        }
        return (
          <SellerPremiumPanel
            eyebrow="Account"
            title={t('sellerDashboard.nav.settings')}
            description="Plan, profile, and dealership preferences."
          >
            <SettingsView
              seller={seller}
              onUpdateSeller={onUpdateSellerProfile}
              onNotify={onNotify}
              activeListingsCount={publishedListings.length}
              featuredListingsCount={safeSellerVehicles.filter(v => v && isEffectivelyFeatured(v)).length}
              onNavigate={onNavigate}
            />
          </SellerPremiumPanel>
        );
      case 'reports':
        return (
          <SellerPremiumPanel
            eyebrow="Trust & safety"
            title={t('sellerDashboard.nav.reports')}
            description="Listings flagged by buyers or moderation."
          >
            <ReportsView
              reportedVehicles={safeReportedVehicles}
              onEditVehicle={handleEditClick}
              onDeleteVehicle={onDeleteVehicle}
            />
          </SellerPremiumPanel>
        );
      case 'notifications':
        return (
          <SellerPremiumPanel
            eyebrow="Alerts"
            title="Notifications"
            description={`${sellerNotifications.length} total · ${unreadNotificationCount} unread`}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => onNavigate(View.NOTIFICATIONS_CENTER)}
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
                  style={sellerPremiumGhostBtnStyle}
                >
                  Grouped view
                </button>
                {unreadNotificationCount > 0 && onMarkNotificationsAsRead ? (
                  <button
                    type="button"
                    onClick={() => onMarkNotificationsAsRead(sellerNotifications.filter((n) => !n.isRead).map((n) => n.id))}
                    className="rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    style={sellerPremiumPrimaryBtnStyle}
                  >
                    Mark all read
                  </button>
                ) : null}
              </>
            }
          >
            {sellerNotifications.length === 0 ? (
              <p className="rounded-xl px-4 py-12 text-center text-sm text-stone-500" style={{ border: '1px dashed rgba(28,25,23,0.14)' }}>
                You&apos;re all caught up. New alerts will appear here.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl" style={sellerPremiumTableWrapStyle}>
                {sellerNotifications.map((notification, index) => (
                  <li key={notification.id} style={{ borderTop: index === 0 ? undefined : '1px solid rgba(28,25,23,0.06)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onNotificationClick?.(notification);
                        if (!notification.isRead && onMarkNotificationsAsRead) {
                          onMarkNotificationsAsRead([notification.id]);
                        }
                      }}
                      className={`w-full px-4 py-4 text-left transition-colors hover:bg-orange-50/50 ${
                        !notification.isRead ? 'bg-orange-50/35' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-sm ${!notification.isRead ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                            {notification.targetType === 'conversation'
                              ? 'New message'
                              : notification.targetType === 'vehicle'
                                ? 'Vehicle update'
                                : 'Notification'}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">{notification.message}</p>
                          <p className="mt-1 text-xs text-stone-400">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-reride-orange" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SellerPremiumPanel>
        );
      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-reride-text-dark mb-4">
              {t('sellerDashboard.pageNotFound')}
            </h2>
            <p className="text-gray-600">{t('sellerDashboard.sectionNotFound')}</p>
          </div>
        );
    }
  }

  const NavItem: React.FC<{ view: DashboardView, children: React.ReactNode, count?: number, disabled?: boolean }> = ({ view, children, count, disabled = false }) => {
    const isActive = activeView === view;
    return (
      <button
        type="button"
        data-testid={view === 'form' ? 'seller-add-vehicle-nav' : undefined}
        onClick={() => {
          if (disabled) {
            if (view === 'form') notifyListingLimitReached();
            return;
          }
          handleNavigate(view);
        }}
        disabled={disabled}
        aria-disabled={disabled}
        aria-current={isActive ? 'page' : undefined}
        className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
          disabled
            ? 'cursor-not-allowed text-stone-400 opacity-55'
            : isActive
            ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
            : 'text-stone-600 hover:bg-orange-50 hover:text-orange-800'
        }`}
      >
        <span className="font-medium tracking-tight">{children}</span>
        {typeof count === 'number' && count > 0 ? (
          <span
            aria-label={`${count} items`}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
              isActive ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
            }`}
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>
    );
  };

  // Removed unused AppNavItem component

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #F7F4F0 0%, #FBF8F5 42%, #FFF7F2 100%)' }}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(255,107,53,0.16), transparent)' }} />
        <div className="absolute bottom-0 left-0 w-[32rem] h-[32rem] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(28,25,23,0.06), transparent)' }} />
      </div>
      
      {/* Firebase Connection Status Banner */}
      {databaseStatus && !databaseStatus.available && (
        <div className="relative z-20 bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {t('sellerDashboard.databaseIssue')}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {(() => {
                    try {
                      return (
                        databaseStatus?.error || t('sellerDashboard.databaseErrorSupabase')
                      );
                    } catch (error) {
                      console.warn('⚠️ Error getting database error message:', error);
                      return t('sellerDashboard.databaseErrorGeneric');
                    }
                  })()}
                </p>
                {databaseStatus?.details && (
                  <p className="mt-1 text-xs">{databaseStatus.details}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 container mx-auto py-6 sm:py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          {/* Premium Sidebar */}
          <aside className="lg:col-span-1">
            <nav
              aria-label={t('nav.dashboard') || 'Seller dashboard'}
              className="rounded-3xl p-4 sm:p-5 space-y-2 lg:sticky lg:top-6"
              style={{
                background: 'rgba(255,255,255,0.78)',
                border: '1px solid rgba(28,25,23,0.08)',
                boxShadow: '0 20px 40px -28px rgba(28,25,23,0.35)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)' }}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Seller</p>
                  <h3
                    className="text-lg font-bold text-stone-900"
                    style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.02em' }}
                  >
                    {t('nav.dashboard')}
                  </h3>
                </div>
              </div>

              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Workspace</p>
              <NavItem view="overview" count={hotLeadsBadgeCount > 0 ? hotLeadsBadgeCount : undefined}>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.overview')}</span>
                </div>
              </NavItem>
              
              <NavItem view="analytics">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.analytics')}</span>
                </div>
              </NavItem>
              
              <NavItem view="listings">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.myListings')}</span>
                </div>
              </NavItem>
              
              <NavItem view="reports" count={reportedCount}>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.reports')}</span>
                </div>
              </NavItem>
              
              <NavItem view="salesHistory">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.salesHistory')}</span>
                </div>
              </NavItem>
              
              <NavItem view="form" disabled={listingAtLimit}>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.addVehicle')}</span>
                </div>
              </NavItem>
              
              <p className="mb-2 mt-5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Communication</p>
              <NavItem view="messages" count={unreadCount}>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.messages')}</span>
                </div>
              </NavItem>

              <NavItem view="notifications" count={unreadNotificationCount}>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span>Notifications</span>
                </div>
              </NavItem>
              
              <NavItem view="settings">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>{t('sellerDashboard.nav.settings')}</span>
                </div>
              </NavItem>
            </nav>
          </aside>
          
          {/* Premium Main Content */}
          <main className="lg:col-span-1 min-w-0">
            <div
              className="rounded-3xl p-4 sm:p-6 lg:p-7 min-h-[500px]"
              style={{
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(28,25,23,0.06)',
                boxShadow: '0 20px 40px -28px rgba(28,25,23,0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {(() => {
                try {
                  return renderContent();
                } catch (error) {
                  // Log error for debugging but don't crash the entire dashboard
                  if (process.env.NODE_ENV === 'development') {
                    console.error('❌ Error rendering dashboard content:', error);
                  }
                  logProductionError(error, 'Dashboard content render error');
                  
                  // Return a fallback UI instead of crashing
                  return (
                    <div className="text-center py-16 px-6">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {t('sellerDashboard.loadContentFailed')}
                      </h3>
                      <p className="text-gray-600 mb-4">{t('sellerDashboard.loadContentBody')}</p>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            window.location.assign(window.location.pathname + window.location.search);
                          } catch {
                            window.location.reload();
                          }
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        {t('sellerDashboard.refreshPage')}
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </main>
        </div>
        
        {/* Premium Modals */}
        {selectedConv && seller && (
          <ChatWidget
            conversation={selectedConv}
            currentUserRole="seller"
            currentUserEmail={seller.email}
            otherUserName={selectedConv.customerName}
            otherUserOnline={chatPeerOnlineByConversationId?.[String(selectedConv.id)]}
            callTargetPhone={(() => {
              const contact = findUserByParticipantId(allUsers || [], selectedConv.customerId);
              return contact?.mobile || (contact as any)?.phone || '';
            })()}
            callTargetName={selectedConv.customerName}
            isInlineLaunch={true}
            onStartCall={(phone) => { if (phone) window.open(`tel:${phone}`); }}
            onSendMessage={(messageText, type, payload) => onSellerSendMessage(selectedConv.id, messageText, type, payload)}
            onClose={() => setSelectedConv(null)}
            onUserTyping={onUserTyping}
            onUserStoppedTyping={onUserStoppedTyping}
            uploaderEmail={seller.email}
            onMarkMessagesAsRead={onMarkMessagesAsRead}
            onFlagContent={(type, id, reason) => {
              // Persist the report so admins/moderators can review it.
              void import('../services/trustSafetyService').then(({ createSafetyReport }) => {
                try {
                  createSafetyReport(
                    seller.email || 'anonymous',
                    type === 'vehicle' ? 'vehicle' : 'conversation',
                    id,
                    'other',
                    reason || 'No reason provided',
                  );
                } catch (e) {
                  console.warn('Failed to save safety report:', e);
                }
              });
              // Best-effort server notify (endpoint may be absent in some envs).
              try {
                void authenticatedFetch('/api/content-reports', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    reportedBy: seller.email,
                    targetType: type,
                    targetId: id,
                    reason: reason || 'No reason provided',
                    createdAt: new Date().toISOString(),
                  }),
                }).catch(() => { /* ignore */ });
              } catch { /* ignore */ }
            }}
            typingStatus={typingStatus}
            onOfferResponse={onOfferResponse}
            onTestDriveResponse={onTestDriveResponse}
            onClearChat={onClearChat}
            onArchiveConversation={onArchiveConversation}
            onDeleteConversation={onDeleteConversation}
          />
        )}
        
        {isBulkUploadOpen && (
          <BulkUploadModal
            onClose={() => setIsBulkUploadOpen(false)}
            onAddMultipleVehicles={onAddMultipleVehicles}
            sellerEmail={seller.email}
          />
        )}
        
        {showBoostModal && vehicleToBoost && (
          <BoostListingModal
            vehicle={vehicleToBoost}
            featuredCredits={seller.featuredCredits ?? 0}
            onClose={() => { setShowBoostModal(false); setVehicleToBoost(null); }}
            onBoost={async (vehicleId, packageId) => {
              try {
                if (onBoostListing) {
                  await onBoostListing(vehicleId, packageId);
                } else {
                  const { executeSellerBoostListing } = await import('../utils/sellerBoostListing');
                  const result = await executeSellerBoostListing({
                    vehicleId,
                    packageId,
                    seller,
                    sellerVehicles: safeSellerVehicles,
                  });
                  await onUpdateVehicle(result.vehicle);
                  notify(
                    typeof result.remainingCredits === 'number'
                      ? `Listing boosted for 7 days! You have ${result.remainingCredits} boost credit${result.remainingCredits === 1 ? '' : 's'} left.`
                      : 'Your listing has been boosted! It will get more visibility.',
                    'success',
                  );
                }
                setShowBoostModal(false);
                setVehicleToBoost(null);
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
                if (!onBoostListing) {
                  notify(`Error boosting vehicle: ${errorMsg}`, 'error');
                }
                // Keep modal open so user can retry (handler already toasts when onBoostListing is set)
              }
            }}
          />
        )}
        {markSoldVehicle && (
          <MarkSoldDealModal
            vehicleId={markSoldVehicle.databaseId || markSoldVehicle.id}
            vehicleTitle={`${markSoldVehicle.make} ${markSoldVehicle.model}`}
            conversations={conversations}
            sellerEmail={seller.email}
            onClose={() => setMarkSoldVehicle(null)}
            onSuccess={async () => {
              notify('Sale recorded — buyer will confirm to unlock ratings', 'success');
              try {
                if (onMarkAsSold) {
                  await onMarkAsSold(markSoldVehicle.id);
                } else {
                  await onUpdateVehicle({
                    ...markSoldVehicle,
                    status: 'sold',
                    soldAt: new Date().toISOString(),
                    listingStatus: 'sold',
                  });
                }
              } catch (err) {
                notify(
                  err instanceof Error ? err.message : 'Failed to update listing status.',
                  'error',
                );
              } finally {
                setMarkSoldVehicle(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
