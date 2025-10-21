
import React, { useMemo, useState, useEffect } from 'react';
import type { Vehicle, User, Conversation, PlatformSettings, AuditLogEntry, VehicleData, SupportTicket, FAQItem, SubscriptionPlan, PlanDetails } from '../types';
import { View } from '../types';
import EditUserModal from './EditUserModal';
import EditVehicleModal from './EditVehicleModal';
import PaymentManagement from './PaymentManagement';
// Removed blocking import - will lazy load PLAN_DETAILS when needed
import { VehicleDataBulkUploadModal } from './VehicleDataBulkUploadModal';
import VehicleDataManagement from './VehicleDataManagement';
import SellerFormPreview from './SellerFormPreview';
import { planService } from '../services/planService';

interface AdminPanelProps {
    users: User[];
    currentUser: User;
    vehicles: Vehicle[];
    conversations: Conversation[];
    onToggleUserStatus: (email: string) => void;
    onDeleteUser: (email: string) => void;
    onAdminUpdateUser: (email: string, details: { name: string; mobile: string; role: User['role'] }) => void;
    onUpdateUserPlan: (email: string, plan: SubscriptionPlan) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (vehicleId: number) => void;
    onToggleVehicleStatus: (vehicleId: number) => void;
    onToggleVehicleFeature: (vehicleId: number) => void;
    onResolveFlag: (type: 'vehicle' | 'conversation', id: number | string) => void;
    platformSettings: PlatformSettings;
    onUpdateSettings: (settings: PlatformSettings) => void;
    onSendBroadcast: (message: string) => void;
    auditLog: AuditLogEntry[];
    onExportUsers: () => void;
    onExportVehicles: () => void;
    onExportSales: () => void;
    onNavigate?: (view: View) => void;
    vehicleData: VehicleData;
    onUpdateVehicleData: (newData: VehicleData) => void;
    onToggleVerifiedStatus: (email: string) => void;
    supportTickets: SupportTicket[];
    onUpdateSupportTicket: (ticket: SupportTicket) => void;
    faqItems: FAQItem[];
    onAddFaq: (faq: Omit<FAQItem, 'id'>) => void;
    onUpdateFaq: (faq: FAQItem) => void;
    onDeleteFaq: (id: number) => void;
    onCertificationApproval: (vehicleId: number, decision: 'approved' | 'rejected') => void;
}

type AdminView = 'analytics' | 'users' | 'listings' | 'moderation' | 'certificationRequests' | 'vehicleData' | 'auditLog' | 'settings' | 'support' | 'faq' | 'payments' | 'planManagement';
type RoleFilter = 'all' | 'customer' | 'seller' | 'admin';
// FIX: Restrict sortable keys to prevent comparison errors on incompatible types.
type SortableUserKey = 'name' | 'status';
type SortConfig = {
    key: SortableUserKey;
    direction: 'ascending' | 'descending';
};

// --- Sub-components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, onClick?: () => void }> = ({ title, value, icon, onClick }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md flex items-center ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform' : ''}`} onClick={onClick}>
    <div className="p-3 rounded-full mr-4" style={{ background: 'rgba(30, 136, 229, 0.1)' }}>{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-spinny-text-dark dark:text-spinny-text-dark">{title}</h3>
      <p className="text-2xl font-bold text-spinny-text-dark dark:text-spinny-text-dark">{value}</p>
    </div>
  </div>
);

const TableContainer: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, children, actions }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark">{title}</h2>
            {actions && <div className="w-full sm:w-auto">{actions}</div>}
        </div>
        <div className="overflow-x-auto">
            {children}
        </div>
    </div>
);

const SortableHeader: React.FC<{
    title: string;
    sortKey: SortableUserKey;
    sortConfig: SortConfig | null;
    requestSort: (key: SortableUserKey) => void;
}> = ({ title, sortKey, sortConfig, requestSort }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;

    return (
        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1.5 group">
                <span className="group-hover:text-spinny-text-dark dark:group-hover:text-spinny-text-dark">{title}</span>
                <span className="text-spinny-text-dark">
                    {isSorted ? (direction === 'ascending' ? '▲' : '▼') : '↕'}
                </span>
            </button>
        </th>
    );
};

const BarChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...(data || []).map(d => d.value), 1);
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-4">{title}</h3>
            <div className="space-y-4">
                {(data || []).map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-[100px_1fr] items-center gap-4 text-sm">
                        <span className="font-medium text-spinny-text-dark dark:text-spinny-text-dark truncate text-right">{label}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-full bg-white-dark dark:bg-white rounded-full h-5">
                                <div
                                    className="h-5 rounded-full text-white text-xs flex items-center justify-end pr-2"
                                    style={{ width: `${(value / maxValue) * 100}%`, background: 'var(--gradient-warm)' }}
                                >
                                    {value}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Certification Requests View Component ---
const CertificationRequestsView: React.FC<{
    requests: Vehicle[];
    users: User[];
    onCertificationApproval: (vehicleId: number, decision: 'approved' | 'rejected') => void;
}> = ({ requests, users, onCertificationApproval }) => {
    
    // Certification Request Row Component
    const CertificationRequestRow: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
        const [sellerInfo, setSellerInfo] = useState<{ planName: string; usage: string; hasFreeCredits: boolean } | null>(null);
        
        useEffect(() => {
            const getSellerInfo = async () => {
                const seller = users.find(u => u.email === vehicle.sellerEmail);
                if (!seller) {
                    setSellerInfo({ planName: 'N/A', usage: 'N/A', hasFreeCredits: false });
                    return;
                }
                const plan = await planService.getPlanDetails(seller.subscriptionPlan || 'free');
                const used = seller.usedCertifications || 0;
                const total = plan.freeCertifications;
                const usage = `${used}/${total}`;
                setSellerInfo({ planName: plan.name, usage, hasFreeCredits: used < total });
            };
            getSellerInfo();
        }, [vehicle.sellerEmail]);
        
        if (!sellerInfo) {
            return (
                <tr key={vehicle.id}>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Loading seller info...
                    </td>
                </tr>
            );
        }
        
        return (
            <tr key={vehicle.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                <td className="px-6 py-4">{vehicle.sellerEmail}</td>
                <td className="px-6 py-4">
                    <div>Plan: <span className="font-semibold">{sellerInfo.planName}</span></div>
                    <div className="text-sm">Free Certs Used: {sellerInfo.usage}</div>
                    {!sellerInfo.hasFreeCredits && <div className="text-xs text-spinny-text-dark">No free credits left</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => onCertificationApproval(vehicle.id, 'approved')} className="text-spinny-orange hover:text-spinny-orange">Approve</button>
                    <button onClick={() => onCertificationApproval(vehicle.id, 'rejected')} className="text-spinny-orange hover:text-spinny-orange">Reject</button>
                </td>
            </tr>
        );
    };

    return (
        <TableContainer title={`Pending Certification Requests (${requests.length})`}>
            {requests.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-white dark:bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Plan Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.map(vehicle => (
                            <CertificationRequestRow key={vehicle.id} vehicle={vehicle} />
                        ))}
                    </tbody>
                </table>
            ) : <p className="text-center py-8 text-spinny-text-dark dark:text-spinny-text-dark">No pending certification requests.</p>}
        </TableContainer>
    );
};

// --- Audit Log View Component ---
const AuditLogView: React.FC<{ auditLog: AuditLogEntry[] }> = ({ auditLog }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLog = useMemo(() => {
    if (!searchTerm.trim()) return auditLog;
    const lowercasedFilter = searchTerm.toLowerCase();
    return auditLog.filter(entry =>
      entry.actor.toLowerCase().includes(lowercasedFilter) ||
      entry.action.toLowerCase().includes(lowercasedFilter) ||
      entry.target.toLowerCase().includes(lowercasedFilter) ||
      (entry.details && entry.details.toLowerCase().includes(lowercasedFilter))
    );
  }, [auditLog, searchTerm]);

  const searchAction = (
    <input
      type="text"
      placeholder="Search logs..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="flex-grow p-2 border border-gray-200 dark:border-gray-200-300 rounded-lg bg-white dark:text-spinny-text-dark focus:outline-none transition w-full sm:w-64" onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--spinny-orange)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
    />
  );

  return (
    <TableContainer title="Audit Log" actions={searchAction}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-white dark:bg-white text-spinny-text-dark dark:text-spinny-text-dark">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actor</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Target</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Details</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
          {filteredLog.map(entry => (
            <tr key={entry.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-spinny-text-dark dark:text-spinny-text-dark">{new Date(entry.timestamp).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.actor}</td>
              <td className="px-6 py-4 whitespace-nowrap">{entry.action}</td>
              <td className="px-6 py-4 whitespace-nowrap">{entry.target}</td>
              <td className="px-6 py-4 text-sm text-spinny-text-dark dark:text-spinny-text-dark truncate max-w-xs" title={entry.details}>{entry.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredLog.length === 0 && <p className="text-center py-8 text-spinny-text-dark dark:text-spinny-text-dark">No log entries found matching your search.</p>}
    </TableContainer>
  );
};

// --- Add New Plan Modal Component ---
const AddNewPlanModal: React.FC<{
    onClose: () => void;
    onCreate: (planData: Omit<PlanDetails, 'id'>) => void;
}> = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState<Omit<PlanDetails, 'id'>>({
        name: '',
        price: 0,
        listingLimit: 1,
        featuredCredits: 0,
        freeCertifications: 0,
        features: [],
        isMostPopular: false
    });
    const [newFeature, setNewFeature] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isCreating, setIsCreating] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['price', 'listingLimit', 'featuredCredits', 'freeCertifications'];
        const parsedValue = numericFields.includes(name) ? parseInt(value) || 0 : value;
        
        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Plan name is required';
        }
        
        if (formData.price < 0) {
            newErrors.price = 'Price cannot be negative';
        }
        
        if (formData.listingLimit !== 'unlimited' && formData.listingLimit < 1) {
            newErrors.listingLimit = 'Listing limit must be at least 1';
        }
        
        if (formData.featuredCredits < 0) {
            newErrors.featuredCredits = 'Featured credits cannot be negative';
        }
        
        if (formData.freeCertifications < 0) {
            newErrors.freeCertifications = 'Free certifications cannot be negative';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
            setNewFeature('');
        }
    };

    const handleRemoveFeature = (featureToRemove: string) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsCreating(true);
        try {
            await onCreate(formData);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-spinny-text-dark dark:text-white">Create New Plan</h2>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">
                                    Plan Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.name 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                    placeholder="Enter plan name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">
                                    Price (₹/month) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="1"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.price 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                    placeholder="0"
                                />
                                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Listing Limit</label>
                                <input
                                    type="number"
                                    name="listingLimit"
                                    value={formData.listingLimit === 'unlimited' ? '' : formData.listingLimit}
                                    onChange={handleChange}
                                    min="1"
                                    placeholder="Leave empty for unlimited"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.listingLimit 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                />
                                {errors.listingLimit && <p className="mt-1 text-sm text-red-500">{errors.listingLimit}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Featured Credits</label>
                                <input
                                    type="number"
                                    name="featuredCredits"
                                    value={formData.featuredCredits}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.featuredCredits 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                />
                                {errors.featuredCredits && <p className="mt-1 text-sm text-red-500">{errors.featuredCredits}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Free Certifications</label>
                                <input
                                    type="number"
                                    name="freeCertifications"
                                    value={formData.freeCertifications}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.freeCertifications 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                />
                                {errors.freeCertifications && <p className="mt-1 text-sm text-red-500">{errors.freeCertifications}</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    name="isMostPopular"
                                    checked={formData.isMostPopular}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 text-spinny-orange bg-gray-100 border-gray-300 rounded focus:ring-spinny-orange"
                                />
                                <label className="text-sm font-medium text-spinny-text-dark dark:text-white">
                                    Mark as Most Popular
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Features</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                                    placeholder="Add new feature..."
                                    className="flex-grow px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-spinny-orange"
                                />
                                <button type="button" onClick={handleAddFeature} className="px-4 py-2 bg-spinny-orange text-white rounded-lg hover:bg-spinny-orange/90">
                                    Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.features.map((feature, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        <span className="text-spinny-text-dark dark:text-white">{feature}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(feature)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {Object.keys(errors).length > 0 && (
                                    <span className="text-red-500">Please fix {Object.keys(errors).length} error(s) before creating</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-spinny-text-dark dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isCreating || Object.keys(errors).length > 0}
                                    className="px-6 py-2 bg-spinny-orange text-white rounded-lg hover:bg-spinny-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Plan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Plan Edit Modal Component ---
const PlanEditModal: React.FC<{
    plan: PlanDetails;
    onClose: () => void;
    onSave: (plan: PlanDetails) => void;
}> = ({ plan, onClose, onSave }) => {
    const [formData, setFormData] = useState(plan);
    const [newFeature, setNewFeature] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['price', 'listingLimit', 'featuredCredits', 'freeCertifications'];
        const parsedValue = numericFields.includes(name) ? parseInt(value) || 0 : value;
        
        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Plan name is required';
        }
        
        if (formData.price < 0) {
            newErrors.price = 'Price cannot be negative';
        }
        
        if (formData.listingLimit !== 'unlimited' && formData.listingLimit < 0) {
            newErrors.listingLimit = 'Listing limit cannot be negative';
        }
        
        if (formData.featuredCredits < 0) {
            newErrors.featuredCredits = 'Featured credits cannot be negative';
        }
        
        if (formData.freeCertifications < 0) {
            newErrors.freeCertifications = 'Free certifications cannot be negative';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
            setNewFeature('');
        }
    };

    const handleRemoveFeature = (featureToRemove: string) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-spinny-text-dark dark:text-white">Edit Plan</h2>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">
                                    Plan Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.name 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                    placeholder="Enter plan name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">
                                    Price (₹/month) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="1"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.price 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                    placeholder="0"
                                />
                                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Listing Limit</label>
                                <input
                                    type="number"
                                    name="listingLimit"
                                    value={formData.listingLimit === 'unlimited' ? '' : formData.listingLimit}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Leave empty for unlimited"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.listingLimit 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                />
                                {errors.listingLimit && <p className="mt-1 text-sm text-red-500">{errors.listingLimit}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Featured Credits</label>
                                <input
                                    type="number"
                                    name="featuredCredits"
                                    value={formData.featuredCredits}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.featuredCredits 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                />
                                {errors.featuredCredits && <p className="mt-1 text-sm text-red-500">{errors.featuredCredits}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Free Certifications</label>
                                <input
                                    type="number"
                                    name="freeCertifications"
                                    value={formData.freeCertifications}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                                        errors.freeCertifications 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-200 dark:border-gray-600 focus:ring-spinny-orange'
                                    }`}
                                />
                                {errors.freeCertifications && <p className="mt-1 text-sm text-red-500">{errors.freeCertifications}</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    name="isMostPopular"
                                    checked={formData.isMostPopular}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isMostPopular: e.target.checked }))}
                                    className="w-4 h-4 text-spinny-orange bg-gray-100 border-gray-300 rounded focus:ring-spinny-orange"
                                />
                                <label className="text-sm font-medium text-spinny-text-dark dark:text-white">
                                    Mark as Most Popular
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Features</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                                    placeholder="Add new feature..."
                                    className="flex-grow px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-spinny-orange"
                                />
                                <button type="button" onClick={handleAddFeature} className="px-4 py-2 bg-spinny-orange text-white rounded-lg hover:bg-spinny-orange/90">
                                    Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.features.map((feature, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        <span className="text-spinny-text-dark dark:text-white">{feature}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(feature)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {Object.keys(errors).length > 0 && (
                                    <span className="text-red-500">Please fix {Object.keys(errors).length} error(s) before saving</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-spinny-text-dark dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving || Object.keys(errors).length > 0}
                                    className="px-6 py-2 bg-spinny-orange text-white rounded-lg hover:bg-spinny-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main AdminPanel Component ---
const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const {
        users, currentUser, vehicles, conversations, onToggleUserStatus, onDeleteUser,
        onAdminUpdateUser, onUpdateUserPlan, onUpdateVehicle, onDeleteVehicle, onToggleVehicleStatus,
        onResolveFlag, platformSettings, onUpdateSettings, onSendBroadcast,
        auditLog, onExportUsers, onExportVehicles, vehicleData, onUpdateVehicleData,
        supportTickets, onUpdateSupportTicket, faqItems, onAddFaq, onUpdateFaq, onDeleteFaq,
        onCertificationApproval
    } = props;
    const [activeView, setActiveView] = useState<AdminView>('analytics');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Modal states
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    
    // Loading states for actions
    const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
    
    // Helper function to handle loading states
    const handleActionWithLoading = async (actionKey: string, action: () => void | Promise<void>) => {
        setLoadingActions(prev => new Set(prev).add(actionKey));
        try {
            await action();
        } finally {
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(actionKey);
                return newSet;
            });
        }
    };

    const analytics = useMemo(() => {
        // Add null/undefined checks to prevent length errors
        const safeUsers = users || [];
        const safeVehicles = vehicles || [];
        const safeConversations = conversations || [];
        
        const totalUsers = safeUsers.length;
        const totalVehicles = safeVehicles.length;
        const activeListings = safeVehicles.filter(v => v.status === 'published').length;
        const soldListings = safeVehicles.filter(v => v.status === 'sold');
        // FIX: Added Number() to ensure v.price is treated as a number, preventing arithmetic errors on potentially mixed types.
        const totalSales = soldListings.reduce((sum: number, v) => sum + (Number(v.price) || 0), 0);
        const flaggedVehiclesCount = safeVehicles.reduce((sum: number, v) => v.isFlagged ? sum + 1 : sum, 0);
        const flaggedConversationsCount = safeConversations.reduce((sum: number, c) => c.isFlagged ? sum + 1 : sum, 0);
        const flaggedContent = flaggedVehiclesCount + flaggedConversationsCount;
        const certificationRequests = safeVehicles.filter(v => v.certificationStatus === 'requested').length;
        
        const listingsByMake = safeVehicles.reduce((acc, v) => {
            acc[v.make] = (acc[v.make] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalUsers,
            totalVehicles,
            activeListings,
            totalSales,
            flaggedContent,
            certificationRequests,
            listingsByMake: Object.entries(listingsByMake)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([make, count]) => ({ label: make, value: count }))
        };
    }, [users, vehicles, conversations]);

    const handleSaveUser = (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
        onAdminUpdateUser(email, details);
        setEditingUser(null);
    };

    const handleSaveVehicle = (updatedVehicle: Vehicle) => {
        onUpdateVehicle(updatedVehicle);
        setEditingVehicle(null);
    };

    const requestSort = (key: SortableUserKey) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'ascending' 
                    ? { key, direction: 'descending' }
                    : null;
            }
            return { key, direction: 'ascending' };
        });
    };

    const sortedUsers = useMemo(() => {
        if (!sortConfig) return users;
        
        return [...users].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [users, sortConfig]);

    const filteredUsers = useMemo(() => {
        if (roleFilter === 'all') return sortedUsers;
        return sortedUsers.filter(user => user.role === roleFilter);
    }, [sortedUsers, roleFilter]);

    // Pagination logic for vehicles
    const paginatedVehicles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return vehicles.slice(startIndex, endIndex);
    }, [vehicles, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(vehicles.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const renderContent = () => {
        switch (activeView) {
            case 'analytics':
    return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Users" value={analytics.totalUsers} icon={<span className="text-2xl">👥</span>} />
                            <StatCard title="Total Vehicles" value={analytics.totalVehicles} icon={<span className="text-2xl">🚗</span>} />
                            <StatCard title="Active Listings" value={analytics.activeListings} icon={<span className="text-2xl">📋</span>} />
                            <StatCard title="Total Sales" value={`₹${analytics.totalSales.toLocaleString('en-IN')}`} icon={<span className="text-2xl">💰</span>} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart title="Top Vehicle Makes" data={analytics.listingsByMake} />
            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Flagged Content:</span>
                                        <span className="font-semibold">{analytics.flaggedContent}</span>
                    </div>
                                    <div className="flex justify-between">
                                        <span>Certification Requests:</span>
                                        <span className="font-semibold">{analytics.certificationRequests}</span>
                    </div>
                    </div>
            </div>
            </div>
        </div>
    );
            case 'users':
    return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setRoleFilter('all')}
                                    className={`px-4 py-2 rounded-lg ${roleFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    All Users
                                </button>
                                <button 
                                    onClick={() => setRoleFilter('customer')}
                                    className={`px-4 py-2 rounded-lg ${roleFilter === 'customer' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Customers
                                </button>
                                <button 
                                    onClick={() => setRoleFilter('seller')}
                                    className={`px-4 py-2 rounded-lg ${roleFilter === 'seller' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Sellers
                                </button>
                                <button 
                                    onClick={() => setRoleFilter('admin')}
                                    className={`px-4 py-2 rounded-lg ${roleFilter === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Admins
                                </button>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🔄 Export Users button clicked');
                                    handleActionWithLoading('export-users', onExportUsers);
                                }} 
                                disabled={loadingActions.has('export-users')}
                                className={`px-4 py-2 rounded-lg cursor-pointer ${
                                    loadingActions.has('export-users') 
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                            >
                                {loadingActions.has('export-users') ? 'Exporting...' : 'Export Users'}
                            </button>
                        </div>
                        <TableContainer title={`User Management (${filteredUsers.length} users)`}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-white dark:bg-white">
                                    <tr>
                                        <SortableHeader title="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Mobile</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                                        <SortableHeader title="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user.email}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.mobile}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🔄 Edit button clicked for user:', user.email);
                                                        setEditingUser(user);
                                                    }} 
                                                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🔄 Toggle status button clicked for user:', user.email);
                                                        const action = user.status === 'active' ? 'suspend' : 'activate';
                                                        if (window.confirm(`Are you sure you want to ${action} user ${user.email}?`)) {
                                                            handleActionWithLoading(`toggle-user-${user.email}`, () => onToggleUserStatus(user.email));
                                                        }
                                                    }} 
                                                    disabled={loadingActions.has(`toggle-user-${user.email}`)}
                                                    className={`cursor-pointer ${
                                                        loadingActions.has(`toggle-user-${user.email}`)
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-yellow-600 hover:text-yellow-800'
                                                    }`}
                                                >
                                                    {loadingActions.has(`toggle-user-${user.email}`) ? '...' : (user.status === 'active' ? 'Suspend' : 'Activate')}
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🔄 Delete button clicked for user:', user.email);
                                                        if (window.confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
                                                            handleActionWithLoading(`delete-user-${user.email}`, () => onDeleteUser(user.email));
                                                        }
                                                    }} 
                                                    disabled={loadingActions.has(`delete-user-${user.email}`)}
                                                    className={`cursor-pointer ${
                                                        loadingActions.has(`delete-user-${user.email}`)
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-red-600 hover:text-red-800'
                                                    }`}
                                                >
                                                    {loadingActions.has(`delete-user-${user.email}`) ? '...' : 'Delete'}
                                                </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
            </TableContainer>
                    </div>
                );
            case 'listings':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={20}>20 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🔄 Export Vehicles button clicked');
                                    handleActionWithLoading('export-vehicles', onExportVehicles);
                                }} 
                                disabled={loadingActions.has('export-vehicles')}
                                className={`px-4 py-2 rounded-lg cursor-pointer ${
                                    loadingActions.has('export-vehicles') 
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                            >
                                {loadingActions.has('export-vehicles') ? 'Exporting...' : 'Export Vehicles'}
                            </button>
                        </div>
                        <TableContainer title={`All Listings (${vehicles.length} total, showing ${paginatedVehicles.length})`}>
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-white dark:bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vehicle</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Seller</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedVehicles.map(vehicle => (
                                        <tr key={vehicle.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{vehicle.sellerEmail}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">₹{vehicle.price.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    vehicle.status === 'published' ? 'bg-green-100 text-green-800' :
                                                    vehicle.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {vehicle.status}
                                                </span>
                                    </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🔄 Edit vehicle button clicked for vehicle:', vehicle.id);
                                                        setEditingVehicle(vehicle);
                                                    }} 
                                                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🔄 Toggle vehicle status button clicked for vehicle:', vehicle.id);
                                                        const action = vehicle.status === 'published' ? 'unpublish' : 'publish';
                                                        if (window.confirm(`Are you sure you want to ${action} this vehicle listing?`)) {
                                                            handleActionWithLoading(`toggle-vehicle-${vehicle.id}`, () => onToggleVehicleStatus(vehicle.id));
                                                        }
                                                    }} 
                                                    disabled={loadingActions.has(`toggle-vehicle-${vehicle.id}`)}
                                                    className={`cursor-pointer ${
                                                        loadingActions.has(`toggle-vehicle-${vehicle.id}`)
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-yellow-600 hover:text-yellow-800'
                                                    }`}
                                                >
                                                    {loadingActions.has(`toggle-vehicle-${vehicle.id}`) ? '...' : (vehicle.status === 'published' ? 'Unpublish' : 'Publish')}
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🔄 Delete vehicle button clicked for vehicle:', vehicle.id);
                                                        if (window.confirm(`Are you sure you want to delete this vehicle listing? This action cannot be undone.`)) {
                                                            handleActionWithLoading(`delete-vehicle-${vehicle.id}`, () => onDeleteVehicle(vehicle.id));
                                                        }
                                                    }} 
                                                    disabled={loadingActions.has(`delete-vehicle-${vehicle.id}`)}
                                                    className={`cursor-pointer ${
                                                        loadingActions.has(`delete-vehicle-${vehicle.id}`)
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-red-600 hover:text-red-800'
                                                    }`}
                                                >
                                                    {loadingActions.has(`delete-vehicle-${vehicle.id}`) ? '...' : 'Delete'}
                                                </button>
                                    </td>
                                </tr>
                           ))}
                        </tbody>
                    </table>
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-4">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
            </TableContainer>
        </div>
    );
            case 'moderation':
                return <ModerationQueueView />;
            case 'certificationRequests':
                return <CertificationRequestsView requests={vehicles.filter(v => v.certificationStatus === 'requested')} users={users} onCertificationApproval={onCertificationApproval} />;
            case 'vehicleData':
                return (
                    <VehicleDataManagement 
                        vehicleData={vehicleData} 
                        onUpdate={onUpdateVehicleData}
                        onPreview={() => setShowPreviewModal(true)}
                        onBulkUpload={() => setIsBulkUploadOpen(true)}
                    />
                );
            case 'auditLog':
                return <AuditLogView auditLog={auditLog} />;
            case 'settings':
                return <PlatformSettingsView />;
            case 'support':
                return <SupportTicketsView />;
            case 'faq':
                return <FAQManagementView />;
            case 'payments':
                return <PaymentManagement currentUser={currentUser} />;
            case 'planManagement':
                return <PlanManagementView />;
            default:
                return null;
        }
    };

    // Moderation Queue View Component
    const ModerationQueueView = () => {
        const [filter, setFilter] = useState<'all' | 'vehicles' | 'conversations'>('all');
        
        const flaggedVehicles = vehicles.filter(v => v.isFlagged);
        const flaggedConversations = conversations.filter(c => c.isFlagged);
        
        const getFilteredItems = () => {
            switch (filter) {
                case 'vehicles':
                    return flaggedVehicles;
                case 'conversations':
                    return flaggedConversations;
                default:
                    return [...flaggedVehicles, ...flaggedConversations];
            }
        };

        const handleResolveFlag = (type: 'vehicle' | 'conversation', id: number | string) => {
            if (window.confirm(`Are you sure you want to resolve this ${type} flag?`)) {
                onResolveFlag(type, id);
        }
    };

    return (
            <div className="space-y-6">
                {/* Filter Tabs */}
                    <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'all' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        All ({flaggedVehicles.length + flaggedConversations.length})
                            </button>
                    <button
                        onClick={() => setFilter('vehicles')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'vehicles' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Vehicles ({flaggedVehicles.length})
                    </button>
                    <button
                        onClick={() => setFilter('conversations')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'conversations' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Conversations ({flaggedConversations.length})
                    </button>
                    </div>

                {/* Content */}
                {getFilteredItems().length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                        <p className="text-gray-600">No flagged content requiring moderation.</p>
                                </div>
                ) : (
                    <div className="space-y-4">
                        {/* Flagged Vehicles */}
                        {filter === 'all' || filter === 'vehicles' ? (
                            flaggedVehicles.length > 0 && (
                                <TableContainer title={`Flagged Vehicles (${flaggedVehicles.length})`}>
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-white dark:bg-white">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vehicle</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Seller</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                            {flaggedVehicles.map(vehicle => (
                                                <tr key={vehicle.id} className="bg-red-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{vehicle.sellerEmail}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">₹{vehicle.price.toLocaleString('en-IN')}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                            FLAGGED
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('🔄 Resolve flag button clicked for vehicle:', vehicle.id);
                                                                handleResolveFlag('vehicle', vehicle.id);
                                                            }}
                                                            className="text-green-600 hover:text-green-800 font-medium cursor-pointer"
                                                        >
                                                            Resolve Flag
                            </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('🔄 Toggle flagged vehicle status button clicked for vehicle:', vehicle.id);
                                                                onToggleVehicleStatus(vehicle.id);
                                                            }}
                                                            className="text-yellow-600 hover:text-yellow-800 font-medium cursor-pointer"
                                                        >
                                                            {vehicle.status === 'published' ? 'Unpublish' : 'Publish'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableContainer>
                            )
                        ) : null}

                        {/* Flagged Conversations */}
                        {filter === 'all' || filter === 'conversations' ? (
                            flaggedConversations.length > 0 && (
                                <TableContainer title={`Flagged Conversations (${flaggedConversations.length})`}>
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-white dark:bg-white">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Seller</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vehicle</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Message</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                            {flaggedConversations.map(conversation => {
                                                const vehicle = vehicles.find(v => v.id === conversation.vehicleId);
                                                const lastMessage = conversation.messages[conversation.messages.length - 1];
                                                return (
                                                    <tr key={conversation.id} className="bg-red-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">{conversation.customerId}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{conversation.sellerId}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {lastMessage ? (lastMessage as any).content?.substring(0, 50) + '...' : 'No messages'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    console.log('🔄 Resolve conversation flag button clicked for conversation:', conversation.id);
                                                                    handleResolveFlag('conversation', conversation.id);
                                                                }}
                                                                className="text-green-600 hover:text-green-800 font-medium cursor-pointer"
                                                            >
                                                                Resolve Flag
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </TableContainer>
                            )
                        ) : null}
                        </div>
                )}
                             </div>
        );
    };

    const PlatformSettingsView = () => (
        <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
                Platform settings functionality would be implemented here
            </div>
        </div>
    );

    const SupportTicketsView = () => {
        const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Closed'>('All');
        
        const filteredTickets = supportTickets.filter(ticket => 
            statusFilter === 'All' || ticket.status === statusFilter
        );

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'Open':
                    return 'bg-red-100 text-red-800';
                case 'In Progress':
                    return 'bg-yellow-100 text-yellow-800';
                case 'Closed':
                    return 'bg-green-100 text-green-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <div className="space-y-6">
                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {(['All', 'Open', 'In Progress', 'Closed'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                statusFilter === status 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {status} ({status === 'All' ? supportTickets.length : supportTickets.filter(t => t.status === status).length})
                        </button>
                    ))}
                    </div>

                {/* Tickets Table */}
                <TableContainer title={`Support Tickets (${filteredTickets.length})`}>
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No support tickets found for the selected filter.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-white dark:bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{ticket.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {ticket.userEmail}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={ticket.subject}>
                                            {ticket.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const newStatus = ticket.status === 'Open' ? 'In Progress' : 
                                                                   ticket.status === 'In Progress' ? 'Closed' : 'Open';
                                                    console.log('🔄 Support ticket status change:', ticket.id, 'from', ticket.status, 'to', newStatus);
                                                    onUpdateSupportTicket({ ...ticket, status: newStatus });
                                                }}
                                                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                            >
                                                {ticket.status === 'Open' ? 'Start Progress' : 
                                                 ticket.status === 'In Progress' ? 'Close' : 'Reopen'}
                                            </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
                    )}
        </TableContainer>
            </div>
        );
    };

    const FAQManagementView = () => (
        <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
                FAQ management functionality would be implemented here
            </div>
        </div>
    );

    const PlanManagementView = () => {
        const [editingPlan, setEditingPlan] = useState<PlanDetails | null>(null);
        const [showPlanModal, setShowPlanModal] = useState(false);
        const [showAddPlanModal, setShowAddPlanModal] = useState(false);
        const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlan>('all');
        const [planStats, setPlanStats] = useState<Record<SubscriptionPlan, number>>({
            free: 0,
            pro: 0,
            premium: 0
        });
        const [plans, setPlans] = useState<PlanDetails[]>([]);

        // Helper function to check if a plan is custom
        const isCustomPlan = async (planId: string): Promise<boolean> => {
            try {
                await planService.getOriginalPlanDetails(planId as SubscriptionPlan);
                return false; // If we can get original details, it's a base plan
            } catch (error) {
                return true; // If we can't get original details, it's a custom plan
            }
        };

        // User Row Component
        const UserRow: React.FC<{ user: User; currentPlan: SubscriptionPlan }> = ({ user, currentPlan }) => {
            const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
            
            useEffect(() => {
                planService.getPlanDetails(currentPlan).then(setPlanDetails);
            }, [currentPlan]);
            
            const userVehicles = vehicles.filter((v: Vehicle) => v.sellerEmail === user.email);
            const activeListings = userVehicles.filter((v: Vehicle) => v.status === 'published').length;
            
            if (!planDetails) {
                return (
                    <tr key={user.email}>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Loading plan details...
                        </td>
                    </tr>
                );
            }
            
            return (
                <tr key={user.email}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-spinny-orange flex items-center justify-center text-white font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            currentPlan === 'free' ? 'bg-gray-100 text-gray-800' :
                            currentPlan === 'pro' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                        }`}>
                            {planDetails.name}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {activeListings} / {planDetails.listingLimit === 'unlimited' ? '∞' : planDetails.listingLimit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {user.usedCertifications || 0} / {planDetails.freeCertifications}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex flex-col gap-2">
                                            {currentPlan !== 'free' && (
                                                <button 
                                                    onClick={() => handleAssignPlan(user.email, 'free')}
                                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                                >
                                                    Assign Free
                                                </button>
                                            )}
                                            {currentPlan !== 'pro' && (
                                                <button 
                                                    onClick={() => handleAssignPlan(user.email, 'pro')}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Assign Pro
                                                </button>
                                            )}
                                            {currentPlan !== 'premium' && (
                                                <button 
                                                    onClick={() => handleAssignPlan(user.email, 'premium')}
                                                    className="text-purple-600 hover:text-purple-800 transition-colors"
                                                >
                                                    Assign Premium
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
            );
        };

        // Plan Card Component
        const PlanCard: React.FC<{ plan: PlanDetails }> = ({ plan }) => {
            const [isCustom, setIsCustom] = useState<boolean>(false);
            
            useEffect(() => {
                isCustomPlan(plan.id).then(setIsCustom);
            }, [plan.id]);

            return (
                <div key={plan.id} className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                    isCustom 
                        ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-spinny-text-dark dark:text-spinny-text-dark">{plan.name}</h3>
                                {isCustom && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                        CUSTOM
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-spinny-text-dark dark:text-spinny-text-dark mt-2">
                                ₹{plan.price.toLocaleString()}
                                <span className="text-sm font-normal text-gray-500">/month</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditPlan(plan)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                                Edit
                            </button>
                            {isCustom && (
                                <button
                                    onClick={() => handleDeletePlan(plan)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Listings:</span>
                            <span className="font-medium">{plan.listingLimit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Featured Credits:</span>
                            <span className="font-medium">{plan.featuredCredits}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Free Certifications:</span>
                            <span className="font-medium">{plan.freeCertifications}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Features:</p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {plan.isMostPopular && (
                        <div className="mt-4 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full text-center">
                            MOST POPULAR
                        </div>
                    )}
                </div>
            );
        };

        // Load plans from service
        useEffect(() => {
            const loadPlans = async () => {
                const allPlans = await planService.getAllPlans();
                setPlans(allPlans);
            };
            loadPlans();
        }, []);

        // Calculate plan statistics
        useEffect(() => {
            const stats = users.reduce((acc, user) => {
                const plan = user.subscriptionPlan || 'free';
                acc[plan] = (acc[plan] || 0) + 1;
            return acc;
            }, {} as Record<SubscriptionPlan, number>);
            setPlanStats(stats);
        }, [users]);

        const filteredUsers = useMemo(() => {
            if (planFilter === 'all') return users;
            return users.filter(user => (user.subscriptionPlan || 'free') === planFilter);
        }, [users, planFilter]);

        const handleEditPlan = (plan: PlanDetails) => {
            setEditingPlan(plan);
            setShowPlanModal(true);
        };

        const handleAddNewPlan = async () => {
            if (!(await planService.canAddNewPlan())) {
                alert('Maximum of 4 plans allowed. Please delete an existing custom plan first.');
                return;
            }
            setShowAddPlanModal(true);
        };

        const handleSavePlan = async (updatedPlan: PlanDetails) => {
            // Update the plan using the plan service
            planService.updatePlan(updatedPlan.id, updatedPlan);
            
            // Refresh the plans list
            const allPlans = await planService.getAllPlans();
            setPlans(allPlans);
            
            // Close modal
            setShowPlanModal(false);
            setEditingPlan(null);
            
            // Show success message
            alert(`Plan "${updatedPlan.name}" has been updated successfully!`);
        };

        const handleCreatePlan = async (newPlanData: Omit<PlanDetails, 'id'>) => {
            // Create new plan using the plan service
            planService.createPlan(newPlanData);
            
            // Refresh the plans list
            const allPlans = await planService.getAllPlans();
            setPlans(allPlans);
            
            // Close modal
            setShowAddPlanModal(false);
            
            // Show success message
            alert(`Plan "${newPlanData.name}" has been created successfully!`);
        };

        const handleDeletePlan = async (plan: PlanDetails) => {
            // Check if it's a base plan by trying to get original details
            try {
                const originalPlan = await planService.getOriginalPlanDetails(plan.id as SubscriptionPlan);
                if (originalPlan) {
                    alert('Cannot delete base plans (Free, Pro, Premium).');
                    return;
                }
            } catch (error) {
                // If we can't get original details, it's likely a custom plan
            }
            
            if (window.confirm(`Are you sure you want to delete the "${plan.name}" plan? This action cannot be undone.`)) {
                if (await planService.deletePlan(plan.id)) {
                    setPlans(await planService.getAllPlans());
                    alert(`Plan "${plan.name}" has been deleted successfully!`);
                }
            }
        };

        const handleAssignPlan = (userEmail: string, plan: SubscriptionPlan) => {
            if (window.confirm(`Are you sure you want to assign ${plan} plan to ${userEmail}?`)) {
                onUpdateUserPlan(userEmail, plan);
            }
        };

        return (
            <div className="space-y-6">
                {/* Plan Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard 
                        title="Free Users" 
                        value={planStats.free} 
                        icon={<span className="text-2xl">🆓</span>} 
                        onClick={() => setPlanFilter('free')}
                    />
                    <StatCard 
                        title="Pro Users" 
                        value={planStats.pro} 
                        icon={<span className="text-2xl">⭐</span>} 
                        onClick={() => setPlanFilter('pro')}
                    />
                    <StatCard 
                        title="Premium Users" 
                        value={planStats.premium} 
                        icon={<span className="text-2xl">👑</span>} 
                        onClick={() => setPlanFilter('premium')}
                    />
                    <StatCard 
                        title="Total Users" 
                        value={users.length} 
                        icon={<span className="text-2xl">👥</span>} 
                        onClick={() => setPlanFilter('all')}
                    />
                </div>

                {/* Plan Configuration */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark">Plan Configuration</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {plans.length}/4 plans configured
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={async () => {
                                    const allPlans = await planService.getAllPlans();
                                    setPlans(allPlans);
                                    alert('Plans refreshed successfully!');
                                }}
                                className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                🔄 Refresh
                            </button>
                            <button 
                                onClick={handleAddNewPlan}
                                disabled={plans.length >= 4}
                                className={`font-bold py-2 px-4 rounded-lg transition-colors ${
                                    plans.length < 4
                                        ? 'bg-spinny-orange text-white hover:bg-spinny-orange/90'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {plans.length < 4 ? '+ Add New Plan' : 'Max Plans Reached'}
                            </button>
                        </div>
                    </div>
                    
                    <div className={`grid gap-6 ${plans.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : plans.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                        {plans.map(plan => (
                            <PlanCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </div>

                {/* User Plan Management */}
                <TableContainer 
                    title={`User Plan Management ${planFilter !== 'all' ? `(${planFilter})` : ''}`}
                    actions={
                        <select 
                            value={planFilter} 
                            onChange={(e) => setPlanFilter(e.target.value as any)}
                            className="p-2 border border-gray-200 dark:border-gray-200-300 rounded-lg bg-white dark:text-spinny-text-dark"
                        >
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="premium">Premium</option>
                    </select>
                    }
                >
                       <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-white dark:bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Current Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr>
                        </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map(user => {
                                    const currentPlan = user.subscriptionPlan || 'free';
                                    return <UserRow key={user.email} user={user} currentPlan={currentPlan} />;
                                })}
                            </tbody>
                       </table>
                   </TableContainer>

                {/* Plan Edit Modal */}
                {showPlanModal && editingPlan && (
                    <PlanEditModal 
                        plan={editingPlan}
                        onClose={() => {
                            setShowPlanModal(false);
                            setEditingPlan(null);
                        }}
                        onSave={handleSavePlan}
                    />
                )}

                {/* Add New Plan Modal */}
                {showAddPlanModal && (
                    <AddNewPlanModal 
                        onClose={() => setShowAddPlanModal(false)}
                        onCreate={handleCreatePlan}
                    />
                )}
            </div>
        );
    };

    const NavItem: React.FC<{ view: AdminView; label: string; count?: number }> = ({ view, label, count }) => (
            <button
                onClick={() => setActiveView(view)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                activeView === view
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    {count}
                </span>
            )}
            </button>
    );

    const AppNavItem: React.FC<{ view: View; label: string; count?: number }> = ({ view, label, count }) => (
        <button
            onClick={() => {
                // Use the navigate function passed from props
                if (props.onNavigate) {
                    props.onNavigate(view);
                } else {
                    // Fallback to event system
                    const event = new CustomEvent('navigate', { detail: { view } });
                    window.dispatchEvent(event);
                }
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex">
                <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Admin Panel</h1>
                        <nav className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Admin Panel</h3>
                            <NavItem view="analytics" label="Analytics" />
                            <NavItem view="users" label="User Management" />
                            <NavItem view="listings" label="Listings" />
                            <NavItem view="moderation" label="Moderation Queue" count={analytics.flaggedContent} />
                            <NavItem view="certificationRequests" label="Certification Requests" count={analytics.certificationRequests} />
                             <NavItem view="support" label="Support Tickets" count={supportTickets.filter(t => t.status === 'Open').length} />
                            <NavItem view="payments" label="Payment Requests" />
                            <NavItem view="planManagement" label="Plan Management" />
                            <NavItem view="faq" label="FAQ Management" />
                            <NavItem view="vehicleData" label="Vehicle Data" />
                            <NavItem view="auditLog" label="Audit Log" />
                            <NavItem view="settings" label="Settings" />
                        </nav>
                    </div>
                </aside>
                <main className="flex-1 p-8">
                    {renderContent()}
                </main>
            </div>

            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={(email, details) => handleSaveUser(email, details)} />}
            {editingVehicle && <EditVehicleModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} onSave={handleSaveVehicle} />}
            
            {/* Seller Form Preview Modal */}
            {showPreviewModal && (
                <SellerFormPreview 
                    vehicleData={vehicleData} 
                    onClose={() => setShowPreviewModal(false)} 
                />
            )}
            
            {/* Bulk Upload Modal */}
            {isBulkUploadOpen && (
                <VehicleDataBulkUploadModal 
                    onClose={() => setIsBulkUploadOpen(false)} 
                    onUpdateData={onUpdateVehicleData}
                />
            )}
        </div>
    );
};

export default AdminPanel;
