


import React, { useMemo, useState, useEffect } from 'react';
import type { Vehicle, User, Conversation, PlatformSettings, AuditLogEntry, VehicleData, SupportTicket, FAQItem, TicketReply, PlanDetails, SubscriptionPlan } from '../types';
import EditUserModal from './EditUserModal';
import EditVehicleModal from './EditVehicleModal';
import PaymentManagement from './PaymentManagement';
import { PLAN_DETAILS } from '../constants';
import { planService } from '../services/planService';
import { VehicleDataBulkUploadModal } from './VehicleDataBulkUploadModal';
import VehicleDataManagement from './VehicleDataManagement';
import SellerFormPreview from './SellerFormPreview';

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
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(({ label, value }) => (
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
    
    const getSellerInfo = (email: string) => {
        const seller = users.find(u => u.email === email);
        if (!seller) return { planName: 'N/A', usage: 'N/A', hasFreeCredits: false };
        const plan = PLAN_DETAILS[seller.subscriptionPlan || 'free'];
        const used = seller.usedCertifications || 0;
        const total = plan.freeCertifications;
        const usage = `${used}/${total}`;
        return { planName: plan.name, usage, hasFreeCredits: used < total };
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
                        {requests.map(v => {
                            const sellerInfo = getSellerInfo(v.sellerEmail);
                            return (
                                <tr key={v.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                    <td className="px-6 py-4">{v.sellerEmail}</td>
                                    <td className="px-6 py-4">
                                        <div>Plan: <span className="font-semibold">{sellerInfo.planName}</span></div>
                                        <div className="text-sm">Free Certs Used: {sellerInfo.usage}</div>
                                        {!sellerInfo.hasFreeCredits && <div className="text-xs text-spinny-text-dark">No free credits left</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button onClick={() => onCertificationApproval(v.id, 'approved')} className="text-spinny-orange hover:text-spinny-orange">Approve</button>
                                        <button onClick={() => onCertificationApproval(v.id, 'rejected')} className="text-spinny-orange hover:text-spinny-orange">Reject</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : <p className="text-center py-8 text-spinny-text-dark dark:text-spinny-text-dark">No pending certification requests.</p>}
        </TableContainer>
    );
};

    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const [editingItem, setEditingItem] = useState<{ path: string[], value: string } | null>(null);
    const [addingAt, setAddingAt] = useState<{ path: string[], type: string } | null>(null);
    const [newItemValue, setNewItemValue] = useState('');
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (selectedCategory && !vehicleData[selectedCategory]) setSelectedCategory(null);
        if (selectedMake && (!selectedCategory || !vehicleData[selectedCategory]?.find(m => m.name === selectedMake))) setSelectedMake(null);
        if (selectedModel && (!selectedCategory || !selectedMake || !vehicleData[selectedCategory]?.find(m => m.name === selectedMake)?.models.find(mo => mo.name === selectedModel))) setSelectedModel(null);
    }, [vehicleData, selectedCategory, selectedMake, selectedModel]);

    const handleAction = (updater: (draft: VehicleData) => void) => {
        const draft = JSON.parse(JSON.stringify(vehicleData));
        updater(draft);
        onUpdate(draft);
    };

    const handleDelete = (path: string[]) => {
        if (!window.confirm(`Are you sure you want to delete "${path[path.length - 1]}"? This action cannot be undone.`)) return;
        handleAction(draft => {
            if (path.length === 1) { // Deleting a Category
                delete draft[path[0]];
            } else if (path.length === 2) { // Deleting a Make
                const category = draft[path[0]];
                const makeIndex = category.findIndex(m => m.name === path[1]);
                if (makeIndex > -1) category.splice(makeIndex, 1);
            } else if (path.length === 3) { // Deleting a Model
                const make = draft[path[0]].find(m => m.name === path[1]);
                if (make) {
                    const modelIndex = make.models.findIndex(mo => mo.name === path[2]);
                    if (modelIndex > -1) make.models.splice(modelIndex, 1);
                }
            } else if (path.length === 4) { // Deleting a Variant
                const model = draft[path[0]].find(m => m.name === path[1])?.models.find(mo => mo.name === path[2]);
                if (model) {
                    const variantIndex = model.variants.indexOf(path[3]);
                    if (variantIndex > -1) model.variants.splice(variantIndex, 1);
                }
            }
        });
        if (path.length === 1 && path[0] === selectedCategory) setSelectedCategory(null);
        if (path.length === 2 && path[1] === selectedMake) setSelectedMake(null);
        if (path.length === 3 && path[2] === selectedModel) setSelectedModel(null);
    };
    
    const handleSaveEdit = () => {
        if (!editingItem || !editingItem.value.trim()) return setEditingItem(null);
        const oldKey = editingItem.path[editingItem.path.length - 1];
        const newKey = editingItem.value.trim();
        if (oldKey === newKey) return setEditingItem(null);

        handleAction(draft => {
            if (editingItem.path.length === 1) {
                if (draft.hasOwnProperty(newKey)) return alert(`Category "${newKey}" already exists.`);
                draft[newKey] = draft[oldKey];
                delete draft[oldKey];
            } else if (editingItem.path.length === 2) {
                const make = draft[editingItem.path[0]].find(m => m.name === oldKey);
                if (make) make.name = newKey;
            } else if (editingItem.path.length === 3) {
                const model = draft[editingItem.path[0]].find(m => m.name === editingItem.path[1])?.models.find(mo => mo.name === oldKey);
                if (model) model.name = newKey;
            } else if (editingItem.path.length === 4) {
                const model = draft[editingItem.path[0]].find(m => m.name === editingItem.path[1])?.models.find(mo => mo.name === editingItem.path[2]);
                if (model) {
                    const variantIndex = model.variants.indexOf(oldKey);
                    if (variantIndex > -1) model.variants[variantIndex] = newKey;
                }
            }
        });
        setEditingItem(null);
    };

    const handleSaveNewItem = () => {
        if (!addingAt || !newItemValue.trim()) return setAddingAt(null);
        const newValue = newItemValue.trim();

        handleAction(draft => {
            if (addingAt.path.length === 0) { // New Category
                if (draft.hasOwnProperty(newValue)) return alert(`Category "${newValue}" already exists.`);
                draft[newValue] = [];
            } else if (addingAt.path.length === 1) { // New Make
                if (draft[addingAt.path[0]].some(m => m.name === newValue)) return alert(`Make "${newValue}" already exists.`);
                draft[addingAt.path[0]].push({ name: newValue, models: [] });
            } else if (addingAt.path.length === 2) { // New Model
                const make = draft[addingAt.path[0]].find(m => m.name === addingAt.path[1]);
                if (make) {
                    if (make.models.some(m => m.name === newValue)) return alert(`Model "${newValue}" already exists.`);
                    make.models.push({ name: newValue, variants: [] });
                }
            } else if (addingAt.path.length === 3) { // New Variant
                const model = draft[addingAt.path[0]].find(m => m.name === addingAt.path[1])?.models.find(mo => mo.name === addingAt.path[2]);
                if (model) {
                    if (model.variants.includes(newValue)) return alert(`Variant "${newValue}" already exists.`);
                    model.variants.push(newValue);
                }
            }
        });

        setAddingAt(null);
        setNewItemValue('');
    };
    
    const handleSelectCategory = (item: string | null) => { setSelectedCategory(item); setSelectedMake(null); setSelectedModel(null); };
    const handleSelectMake = (item: string | null) => { setSelectedMake(item); setSelectedModel(null); };
    const handleSelectModel = (item: string | null) => setSelectedModel(item);

    const categories = Object.keys(vehicleData).sort();
    const makes = selectedCategory ? (vehicleData[selectedCategory] || []).map(m => m.name).sort() : [];
    const models = selectedCategory && selectedMake ? (vehicleData[selectedCategory]?.find(m => m.name === selectedMake)?.models || []).map(mo => mo.name).sort() : [];
    const variants = selectedCategory && selectedMake && selectedModel ? (vehicleData[selectedCategory]?.find(m => m.name === selectedMake)?.models.find(mo => mo.name === selectedModel)?.variants || []).sort() : [];

    // Preview data for seller form
    const previewData = {
        categories: categories.map(cat => ({ value: cat, label: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
        makes: makes.map(make => ({ value: make, label: make })),
        models: models.map(model => ({ value: model, label: model })),
        variants: variants.map(variant => ({ value: variant, label: variant }))
    };

    const renderColumn = (title: string, items: string[], pathPrefix: string[], selectedItem: string | null, onSelect: (item: string | null) => void, itemType: string, disabled: boolean = false) => (
        <div className={`bg-white dark:bg-white p-3 rounded-lg border dark:border-gray-200-200 flex flex-col transition-opacity ${disabled ? 'opacity-50' : ''}`}>
            <h3 className="text-md font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-2 px-1">{title}</h3>
            <ul className="space-y-1 overflow-y-auto flex-grow min-h-[200px] max-h-[400px]">
                {items.map(item => {
                    const path = [...pathPrefix, item];
                    const isEditing = editingItem?.path.join() === path.join();
                    return (
                        <li key={item} className="rounded-md">
                            {isEditing ? (
                                <div className="flex items-center gap-2 p-2">
                                    <input type="text" value={editingItem.value} onChange={e => setEditingItem(prev => ({ ...prev!, value: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} onBlur={handleSaveEdit} className="w-full text-sm p-1 border rounded bg-white dark:bg-white" />
                                </div>
                            ) : (
                                <div onClick={() => !disabled && onSelect(item)} className={`group flex justify-between items-center p-2 rounded-md ${!disabled ? 'cursor-pointer' : 'cursor-default'} ${selectedItem === item ? 'text-white' : !disabled ? 'hover:bg-white-dark dark:hover:bg-white' : ''}`} style={selectedItem === item ? { background: 'var(--gradient-primary)' } : undefined}>
                                    <span className="text-sm">{item}</span>
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedItem === item ? '!opacity-100' : ''}`}>
                                        <button onClick={e => { e.stopPropagation(); if (!disabled) setEditingItem({ path, value: item }); }} disabled={disabled} className="p-1 hover:bg-white/20 rounded-md">&#x270E;</button>
                                        <button onClick={e => { e.stopPropagation(); if (!disabled) handleDelete(path); }} disabled={disabled} className="p-1 hover:bg-white/20 rounded-md">&times;</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
                {!disabled && items.length === 0 && <div className="text-center text-sm text-spinny-text-dark py-4 px-2">No items.</div>}
                {disabled && <div className="text-center text-sm text-spinny-text-dark py-4 px-2">Select an item from the previous column.</div>}
            </ul>
            <div className="mt-2 pt-2 border-t dark:border-gray-200-200">
                {addingAt?.path.join() === pathPrefix.join() ? (
                    <div className="flex items-center gap-2 p-1">
                        <input type="text" value={newItemValue} onChange={e => setNewItemValue(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveNewItem()} placeholder={`New ${itemType}...`} className="w-full text-sm p-1 border rounded bg-white dark:bg-white" />
                    </div>
                ) : (
                    <button onClick={() => !disabled && setAddingAt({ path: pathPrefix, type: itemType })} disabled={disabled} className="w-full text-sm p-2 rounded-md hover:bg-white-dark dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => !disabled && (e.currentTarget.style.color = 'var(--spinny-blue)')} onMouseLeave={(e) => !disabled && (e.currentTarget.style.color = 'var(--spinny-orange)')}>+ Add New {itemType}</button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark">Manage Vehicle Data</h2>
                    <p className="text-sm text-spinny-text-dark dark:text-spinny-text-dark">Manage dropdown options for the vehicle creation form.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowPreview(!showPreview)} 
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                            showPreview 
                                ? 'bg-spinny-blue text-white hover:bg-spinny-blue/90' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {showPreview ? 'Hide Preview' : 'Show Seller Form Preview'}
                    </button>
                    <button onClick={() => setIsBulkUploadOpen(true)} className="bg-spinny-orange text-white font-bold py-2 px-4 rounded-lg hover:bg-spinny-orange">
                        Bulk Upload
                    </button>
                </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Seller Form Preview</h3>
                    <p className="text-blue-700 mb-4">This shows how the vehicle data will appear in the seller's "List New Vehicle" form:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Preview */}
                        <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-2">Category Dropdown</h4>
                            <div className="space-y-1">
                                {previewData.categories.slice(0, 3).map(cat => (
                                    <div key={cat.value} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                                        {cat.label}
                                    </div>
                                ))}
                                {previewData.categories.length > 3 && (
                                    <div className="text-xs text-gray-500">+{previewData.categories.length - 3} more...</div>
                                )}
                            </div>
                        </div>

                        {/* Make Preview */}
                        <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-2">Make Dropdown</h4>
                            <div className="space-y-1">
                                {previewData.makes.length > 0 ? (
                                    previewData.makes.slice(0, 3).map(make => (
                                        <div key={make.value} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                                            {make.label}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-400 italic">Select a category first</div>
                                )}
                                {previewData.makes.length > 3 && (
                                    <div className="text-xs text-gray-500">+{previewData.makes.length - 3} more...</div>
                                )}
                            </div>
                        </div>

                        {/* Model Preview */}
                        <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-2">Model Dropdown</h4>
                            <div className="space-y-1">
                                {previewData.models.length > 0 ? (
                                    previewData.models.slice(0, 3).map(model => (
                                        <div key={model.value} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                                            {model.label}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-400 italic">Select a make first</div>
                                )}
                                {previewData.models.length > 3 && (
                                    <div className="text-xs text-gray-500">+{previewData.models.length - 3} more...</div>
                                )}
                            </div>
                        </div>

                        {/* Variant Preview */}
                        <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-2">Variant Dropdown</h4>
                            <div className="space-y-1">
                                {previewData.variants.length > 0 ? (
                                    previewData.variants.slice(0, 3).map(variant => (
                                        <div key={variant.value} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                                            {variant.label}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-400 italic">Select a model first</div>
                                )}
                                {previewData.variants.length > 3 && (
                                    <div className="text-xs text-gray-500">+{previewData.variants.length - 3} more...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-800 text-sm">
                            <strong>✅ Live Connection:</strong> Any changes you make here will immediately reflect in the seller's vehicle listing form.
                            Sellers will see the updated options when they create new listings.
                        </p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderColumn("Categories", categories, [], selectedCategory, handleSelectCategory, "Category")}
                {renderColumn("Makes", makes, selectedCategory ? [selectedCategory] : [], selectedMake, handleSelectMake, "Make", !selectedCategory)}
                {renderColumn("Models", models, selectedCategory && selectedMake ? [selectedCategory, selectedMake] : [], selectedModel, handleSelectModel, "Model", !selectedMake)}
                {renderColumn("Variants", variants, selectedCategory && selectedMake && selectedModel ? [selectedCategory, selectedMake, selectedModel] : [], null, () => {}, "Variant", !selectedModel)}
            </div>
            {isBulkUploadOpen && (
// FIX: Changed 'onUpdateVehicleData' to 'onUpdate' to pass the correct prop within the component's scope.
                <VehicleDataBulkUploadModal 
                    onClose={() => setIsBulkUploadOpen(false)} 
                    onUpdateData={onUpdate}
                />
            )}
        </div>
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

// --- Platform Settings View ---
const PlatformSettingsView: React.FC<{
    settings: PlatformSettings;
    onUpdate: (newSettings: PlatformSettings) => void;
    onSendBroadcast: (message: string) => void;
}> = ({ settings, onUpdate, onSendBroadcast }) => {
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentSettings(prev => ({
            ...prev,
            [name]: name === 'listingFee' ? Number(value) : value,
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(currentSettings);
    };

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (broadcastMessage.trim()) {
            if (window.confirm("Are you sure you want to send this broadcast message to all users?")) {
                onSendBroadcast(broadcastMessage.trim());
                setBroadcastMessage('');
            }
        }
    };

    const formElementClass = "block w-full p-3 border border-gray-200-300 dark:border-gray-200-300 rounded-lg focus:outline-none transition bg-white dark:bg-white dark:text-spinny-text-dark";

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-4">General Settings</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="listingFee" className="block text-sm font-medium text-spinny-text-dark dark:text-spinny-text-dark mb-1">
                            Listing Fee (₹)
                        </label>
                        <input
                            type="number"
                            id="listingFee"
                            name="listingFee"
                            value={currentSettings.listingFee}
                            onChange={handleChange}
                            min="0"
                            className={formElementClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="siteAnnouncement" className="block text-sm font-medium text-spinny-text-dark dark:text-spinny-text-dark mb-1">
                            Site Announcement Banner
                        </label>
                        <textarea
                            id="siteAnnouncement"
                            name="siteAnnouncement"
                            value={currentSettings.siteAnnouncement}
                            onChange={handleChange}
                            rows={3}
                            className={formElementClass}
                            placeholder="e.g., Special weekend discount on all EVs!"
                        />
                         <p className="text-xs text-spinny-text-dark dark:text-spinny-text-dark mt-1">Leave empty to hide the banner.</p>
                    </div>
                    <div>
                        <button type="submit" className="btn-brand-primary text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-4">Communication</h2>
                <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                         <label htmlFor="broadcastMessage" className="block text-sm font-medium text-spinny-text-dark dark:text-spinny-text-dark mb-1">
                            Send Broadcast Message
                        </label>
                        <textarea
                            id="broadcastMessage"
                            name="broadcastMessage"
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            rows={3}
                            className={formElementClass}
                            placeholder="This message will be sent to every user's chat inbox."
                        />
                    </div>
                     <div>
                        <button type="submit" className="bg-spinny-orange-light0 text-white font-bold py-2 px-6 rounded-lg hover:bg-spinny-orange transition-colors disabled:opacity-50" disabled={!broadcastMessage.trim()}>
                            Send Broadcast
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Moderation Queue View ---
const ModerationQueueView: React.FC<{
    vehicles: Vehicle[];
    conversations: Conversation[];
    onResolveFlag: (type: 'vehicle' | 'conversation', id: number | string) => void;
    onToggleVehicleStatus: (vehicleId: number) => void;
    onToggleUserStatus: (email: string) => void;
}> = ({ vehicles, conversations, onResolveFlag, onToggleVehicleStatus, onToggleUserStatus }) => {
    const flaggedVehicles = useMemo(() => vehicles.filter(v => v.isFlagged), [vehicles]);
    const flaggedConversations = useMemo(() => conversations.filter(c => c.isFlagged), [conversations]);

    return (
        <div className="space-y-8">
            <TableContainer title={`Flagged Vehicles (${flaggedVehicles.length})`}>
                {flaggedVehicles.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-white dark:bg-white"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reported On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                            {flaggedVehicles.map(v => (
                                <tr key={v.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                    <td className="px-6 py-4">{v.sellerEmail}</td>
                                    <td className="px-6 py-4 text-sm text-spinny-text-dark dark:text-spinny-text-dark max-w-xs truncate" title={v.flagReason}>{v.flagReason || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-spinny-text-dark dark:text-spinny-text-dark">{v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button onClick={() => onResolveFlag('vehicle', v.id)} className="text-spinny-orange hover:text-spinny-orange">Dismiss Flag</button>
                                        <button onClick={() => { onToggleVehicleStatus(v.id); onResolveFlag('vehicle', v.id); }} className="text-spinny-text-dark hover:text-spinny-text-dark">Unpublish</button>
                                        <button onClick={() => onToggleUserStatus(v.sellerEmail)} className="text-spinny-orange hover:text-spinny-orange">Ban Seller</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-center py-8 text-spinny-text-dark dark:text-spinny-text-dark">No vehicles are currently flagged.</p>}
            </TableContainer>

            <TableContainer title={`Flagged Conversations (${flaggedConversations.length})`}>
                {flaggedConversations.length > 0 ? (
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-white dark:bg-white"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Participants</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reported On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                           {flaggedConversations.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 text-sm">
                                        <div>C: {c.customerName}</div>
                                        <div>S: {c.sellerId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-spinny-text-dark dark:text-spinny-text-dark max-w-sm truncate" title={c.flagReason}>
                                        {c.flagReason || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-spinny-text-dark dark:text-spinny-text-dark">{c.flaggedAt ? new Date(c.flaggedAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button onClick={() => onResolveFlag('conversation', c.id)} className="text-spinny-orange hover:text-spinny-orange">Dismiss</button>
                                        <button onClick={() => onToggleUserStatus(c.customerId)} className="text-spinny-orange hover:text-spinny-orange">Ban Customer</button>
                                        <button onClick={() => onToggleUserStatus(c.sellerId)} className="text-spinny-orange hover:text-spinny-orange">Ban Seller</button>
                                    </td>
                                </tr>
                           ))}
                        </tbody>
                    </table>
                ) : <p className="text-center py-8 text-spinny-text-dark dark:text-spinny-text-dark">No conversations are currently flagged.</p>}
            </TableContainer>
        </div>
    );
};

// --- Support Ticket View ---
const SupportTicketsView: React.FC<{
    tickets: SupportTicket[];
    onUpdateTicket: (ticket: SupportTicket) => void;
    currentUser: User;
}> = ({ tickets, onUpdateTicket, currentUser }) => {
    const [statusFilter, setStatusFilter] = useState<'All' | SupportTicket['status']>('All');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');

    const filteredTickets = useMemo(() => {
        const sorted = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (statusFilter === 'All') return sorted;
        return sorted.filter(t => t.status === statusFilter);
    }, [tickets, statusFilter]);

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;
        
        const newReply: TicketReply = {
            author: currentUser.email,
            message: replyText.trim(),
            timestamp: new Date().toISOString(),
        };

        const updatedTicket: SupportTicket = {
            ...selectedTicket,
            replies: [...selectedTicket.replies, newReply],
            status: 'In Progress' // Automatically move to 'In Progress' on reply
        };

        onUpdateTicket(updatedTicket);
        setSelectedTicket(updatedTicket); // Update local view
        setReplyText('');
    };

    const handleStatusChange = (newStatus: SupportTicket['status']) => {
        if (!selectedTicket || selectedTicket.status === newStatus) return;
        const updatedTicket = { ...selectedTicket, status: newStatus };
        onUpdateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
    };
    
    const statusColor = (status: SupportTicket['status']) => {
        switch (status) {
            case 'Open': return 'text-white' + ' ' + 'dark:text-white';
            case 'In Progress': return 'bg-spinny-blue-light text-spinny-text-dark dark:bg-spinny-blue/50 dark:text-spinny-text-dark';
            case 'Closed': return 'bg-white-dark text-spinny-text-dark dark:bg-white dark:text-spinny-text-dark';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-200px)]">
            {/* Ticket List */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
                <div className="p-2 border-b dark:border-gray-200-200">
                    <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark mb-2">Support Tickets</h2>
                    <div className="flex gap-2">
                        {(['All', 'Open', 'In Progress', 'Closed'] as const).map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-xs font-semibold rounded-full ${statusFilter === status ? 'text-white' : 'bg-white-dark dark:bg-white text-spinny-text-dark dark:text-spinny-text-dark'}`} style={statusFilter === status ? { background: '#FF6B35' } : undefined}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <ul className="overflow-y-auto mt-2 flex-grow">
                    {filteredTickets.map(ticket => (
                        <li key={ticket.id}>
                            <button onClick={() => setSelectedTicket(ticket)} className={`w-full text-left p-3 rounded-md hover:bg-white dark:hover:bg-white ${selectedTicket?.id === ticket.id ? '' : ''}`} style={selectedTicket?.id === ticket.id ? { backgroundColor: 'rgba(30, 136, 229, 0.1)' } : undefined}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm truncate pr-2 text-spinny-text-dark dark:text-spinny-text-dark">{ticket.subject}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                </div>
                                <p className="text-xs text-spinny-text-dark dark:text-spinny-text-dark mt-1">{ticket.userName} ({ticket.userEmail})</p>
                                <p className="text-xs text-spinny-text-dark dark:text-spinny-text-dark mt-1">Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Ticket Detail View */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
                {selectedTicket ? (
                    <>
                        <div className="p-2 border-b dark:border-gray-200-200">
                             <h3 className="text-lg font-bold text-spinny-text-dark dark:text-spinny-text-dark">{selectedTicket.subject}</h3>
                             <p className="text-sm text-spinny-text-dark dark:text-spinny-text-dark">Ticket #{selectedTicket.id} from {selectedTicket.userName}</p>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4 my-2">
                            {/* Original Message */}
                             <div className="bg-white dark:bg-white/50 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-spinny-text-dark dark:text-spinny-text-dark">{selectedTicket.userName}</p>
                                <p className="text-xs text-spinny-text-dark dark:text-spinny-text-dark mb-2">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                <p className="text-sm text-spinny-text-dark dark:text-spinny-text-dark whitespace-pre-wrap">{selectedTicket.message}</p>
                            </div>
                            {/* Replies */}
                            {selectedTicket.replies.map((reply, index) => (
                                <div key={index} className={`p-3 rounded-lg ${reply.author === currentUser.email ? '' : 'bg-white dark:bg-white/50'}`} style={reply.author === currentUser.email ? { backgroundColor: 'rgba(30, 136, 229, 0.1)' } : undefined}>
                                    <p className="text-sm font-semibold text-spinny-text-dark dark:text-spinny-text-dark">{reply.author === currentUser.email ? 'You' : reply.author}</p>
                                    <p className="text-xs text-spinny-text-dark dark:text-spinny-text-dark mb-2">{new Date(reply.timestamp).toLocaleString()}</p>
                                    <p className="text-sm text-spinny-text-dark dark:text-spinny-text-dark whitespace-pre-wrap">{reply.message}</p>
                                </div>
                            ))}
                        </div>
                        {selectedTicket.status !== 'Closed' && (
                            <form onSubmit={handleReply} className="p-2 border-t dark:border-gray-200-200">
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    rows={3}
                                    className="w-full p-2 border rounded-md dark:bg-white dark:border-gray-200-300"
                                />
                                <div className="mt-2 flex justify-between items-center">
                                    <div>
                                        <button type="button" onClick={() => handleStatusChange('Open')} className="text-xs font-semibold mr-3 transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>Set to Open</button>
                                        <button type="button" onClick={() => handleStatusChange('In Progress')} className="text-xs font-semibold text-spinny-text-dark mr-3">Set to In Progress</button>
                                        <button type="button" onClick={() => handleStatusChange('Closed')} className="text-xs font-semibold text-spinny-text-dark">Close Ticket</button>
                                    </div>
                                    <button type="submit" className="px-4 py-2 btn-brand-primary text-white rounded-md text-sm font-semibold">Send Reply</button>
                                </div>
                            </form>
                        )}
                        {selectedTicket.status === 'Closed' && (
                             <div className="p-4 border-t dark:border-gray-200-200 text-center">
                                <p className="text-sm text-spinny-text-dark italic">This ticket is closed.</p>
                                <button onClick={() => handleStatusChange('Open')} className="mt-2 text-sm font-semibold transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>Re-open Ticket</button>
                             </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-spinny-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <p className="mt-2 font-semibold">Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- FAQ Editor View ---
const FAQEditorView: React.FC<{
    faqItems: FAQItem[];
    onAdd: (faq: Omit<FAQItem, 'id'>) => void;
    onUpdate: (faq: FAQItem) => void;
    onDelete: (id: number) => void;
}> = ({ faqItems, onAdd, onUpdate, onDelete }) => {
    const [editingItem, setEditingItem] = useState<FAQItem | Partial<FAQItem> | null>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !editingItem.question || !editingItem.answer || !editingItem.category) return;
        
        if ('id' in editingItem && editingItem.id) {
            onUpdate(editingItem as FAQItem);
        } else {
            onAdd(editingItem as Omit<FAQItem, 'id'>);
        }
        setEditingItem(null);
    };

    const handleCancel = () => {
        setEditingItem(null);
    };

    const startEditing = (item: FAQItem) => {
        setEditingItem(item);
    };

    const startAdding = () => {
        setEditingItem({ question: '', answer: '', category: 'General' });
    };

    const categories = useMemo(() => [...new Set(faqItems.map(f => f.category))].sort(), [faqItems]);

    if (editingItem) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <h2 className="text-xl font-bold mb-4">{'id' in editingItem ? 'Edit' : 'Add'} FAQ</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="text" placeholder="Question" value={editingItem.question} onChange={e => setEditingItem(p => ({...p, question: e.target.value}))} className="w-full p-2 border rounded" required />
                    <textarea placeholder="Answer" value={editingItem.answer} onChange={e => setEditingItem(p => ({...p, answer: e.target.value}))} className="w-full p-2 border rounded" rows={4} required />
                    <input type="text" placeholder="Category" value={editingItem.category} onChange={e => setEditingItem(p => ({...p, category: e.target.value}))} className="w-full p-2 border rounded" list="faq-categories" required />
                    <datalist id="faq-categories">
                        {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <div className="flex gap-4">
                        <button type="submit" className="px-4 py-2 btn-brand-primary text-white rounded">Save</button>
                        <button type="button" onClick={handleCancel} className="px-4 py-2 bg-white-dark rounded">Cancel</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <TableContainer title="Manage FAQs" actions={<button onClick={startAdding} className="bg-spinny-orange-light0 text-white font-bold py-2 px-4 rounded-lg">Add FAQ</button>}>
            <table className="min-w-full">
                <thead><tr><th>Question</th><th>Category</th><th>Actions</th></tr></thead>
                <tbody>
                    {faqItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.question}</td>
                            <td>{item.category}</td>
                            <td>
                                <button onClick={() => startEditing(item)} className="mr-2 transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>Edit</button>
                                <button onClick={() => onDelete(item.id)} className="text-spinny-orange">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

// --- Plan Management Component ---
const PlanManagementView: React.FC<{
    users: User[];
    vehicles: Vehicle[];
    onUpdateUserPlan: (email: string, plan: SubscriptionPlan) => void;
}> = ({ users, vehicles, onUpdateUserPlan }) => {
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

    // Load plans from service
    useEffect(() => {
        setPlans(planService.getAllPlans());
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

    const handleAddNewPlan = () => {
        if (!planService.canAddNewPlan()) {
            alert('Maximum of 4 plans allowed. Please delete an existing custom plan first.');
            return;
        }
        setShowAddPlanModal(true);
    };

    const handleSavePlan = (updatedPlan: PlanDetails) => {
        // Update the plan using the plan service
        planService.updatePlan(updatedPlan.id, updatedPlan);
        
        // Refresh the plans list
        setPlans(planService.getAllPlans());
        
        // Close modal
        setShowPlanModal(false);
        setEditingPlan(null);
        
        // Show success message
        alert(`Plan "${updatedPlan.name}" has been updated successfully!`);
    };

    const handleCreatePlan = (newPlanData: Omit<PlanDetails, 'id'>) => {
        // Create new plan using the plan service
        planService.createPlan(newPlanData);
        
        // Refresh the plans list
        setPlans(planService.getAllPlans());
        
        // Close modal
        setShowAddPlanModal(false);
        
        // Show success message
        alert(`Plan "${newPlanData.name}" has been created successfully!`);
    };

    const handleDeletePlan = (plan: PlanDetails) => {
        if (PLAN_DETAILS[plan.id as SubscriptionPlan]) {
            alert('Cannot delete base plans (Free, Pro, Premium).');
            return;
        }
        
        if (window.confirm(`Are you sure you want to delete the "${plan.name}" plan? This action cannot be undone.`)) {
            if (planService.deletePlan(plan.id)) {
                setPlans(planService.getAllPlans());
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
                            {planService.getPlanCount()}/4 plans configured
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                setPlans(planService.getAllPlans());
                                alert('Plans refreshed successfully!');
                            }}
                            className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            🔄 Refresh
                        </button>
                        <button 
                            onClick={handleAddNewPlan}
                            disabled={!planService.canAddNewPlan()}
                            className={`font-bold py-2 px-4 rounded-lg transition-colors ${
                                planService.canAddNewPlan()
                                    ? 'bg-spinny-orange text-white hover:bg-spinny-orange/90'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {planService.canAddNewPlan() ? '+ Add New Plan' : 'Max Plans Reached'}
                        </button>
                    </div>
                </div>
                
                <div className={`grid gap-6 ${plans.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : plans.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                    {plans.map(plan => {
                        const isCustomPlan = !PLAN_DETAILS[plan.id as SubscriptionPlan];
                        return (
                            <div key={plan.id} className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                                isCustomPlan 
                                    ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-spinny-text-dark dark:text-spinny-text-dark">{plan.name}</h3>
                                            {isCustomPlan && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                                    CUSTOM
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-2xl font-bold text-spinny-orange">₹{plan.price.toLocaleString('en-IN')}/month</p>
                                        {plan.isMostPopular && (
                                            <span className="inline-block mt-1 px-2 py-1 bg-spinny-orange text-white text-xs font-bold rounded-full">
                                                MOST POPULAR
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button 
                                            onClick={() => handleEditPlan(plan)}
                                            className="text-spinny-orange hover:text-spinny-blue transition-colors text-sm"
                                        >
                                            ✏️ Edit
                                        </button>
                                        {isCustomPlan && (
                                            <button 
                                                onClick={() => handleDeletePlan(plan)}
                                                className="text-red-500 hover:text-red-700 transition-colors text-sm"
                                            >
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-spinny-text-dark dark:text-spinny-text-dark">Listings:</span>
                                        <span className="font-medium">{plan.listingLimit === 'unlimited' ? '∞' : plan.listingLimit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-spinny-text-dark dark:text-spinny-text-dark">Featured Credits:</span>
                                        <span className="font-medium">{plan.featuredCredits}/month</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-spinny-text-dark dark:text-spinny-text-dark">Free Certifications:</span>
                                        <span className="font-medium">{plan.freeCertifications}/month</span>
                                    </div>
                                </div>
                                
                                <div className="text-sm text-spinny-text-dark dark:text-spinny-text-dark">
                                    <strong>Features:</strong>
                                    <ul className="mt-1 space-y-1">
                                        {plan.features.slice(0, 3).map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                        {plan.features.length > 3 && (
                                            <li className="text-spinny-orange">+{plan.features.length - 3} more...</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
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
                            const planDetails = planService.getPlanDetails(currentPlan);
                            const userVehicles = vehicles.filter((v: Vehicle) => v.sellerEmail === user.email);
                            const activeListings = userVehicles.filter((v: Vehicle) => v.status === 'published').length;
                            
                            return (
                                <tr key={user.email}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="font-medium text-spinny-text-dark dark:text-spinny-text-dark">{user.name}</div>
                                            <div className="text-sm text-spinny-text-dark dark:text-spinny-text-dark">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            currentPlan === 'premium' ? 'bg-purple-100 text-purple-800' :
                                            currentPlan === 'pro' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {planDetails.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>Listings:</span>
                                                <span className="font-medium">
                                                    {activeListings} / {planDetails.listingLimit === 'unlimited' ? '∞' : planDetails.listingLimit}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Featured:</span>
                                                <span className="font-medium">
                                                    {user.featuredCredits || 0} / {planDetails.featuredCredits}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Certifications:</span>
                                                <span className="font-medium">
                                                    {user.usedCertifications || 0} / {planDetails.freeCertifications}
                                                </span>
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
                        <h2 className="text-2xl font-bold text-spinny-text-dark dark:text-white">Edit Plan: {plan.name}</h2>
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
                                    placeholder="Leave empty for unlimited"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-spinny-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Featured Credits</label>
                                <input
                                    type="number"
                                    name="featuredCredits"
                                    value={formData.featuredCredits}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-spinny-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-spinny-text-dark dark:text-white mb-1">Free Certifications</label>
                                <input
                                    type="number"
                                    name="freeCertifications"
                                    value={formData.freeCertifications}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-spinny-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-spinny-orange"
                                />
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

// --- MAIN ADMIN PANEL COMPONENT ---

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const {
        users, currentUser, vehicles, conversations, onToggleUserStatus, onDeleteUser,
        onAdminUpdateUser, onUpdateUserPlan, onUpdateVehicle, onDeleteVehicle, onToggleVehicleStatus,
        onToggleVehicleFeature, onResolveFlag, platformSettings, onUpdateSettings, onSendBroadcast,
        auditLog, onExportUsers, onExportVehicles, onExportSales, vehicleData, onUpdateVehicleData,
        onToggleVerifiedStatus, supportTickets, onUpdateSupportTicket, faqItems, onAddFaq, onUpdateFaq, onDeleteFaq,
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

    const analytics = useMemo(() => {
        const totalUsers = users.length;
        const totalVehicles = vehicles.length;
        const activeListings = vehicles.filter(v => v.status === 'published').length;
        const soldListings = vehicles.filter(v => v.status === 'sold');
        // FIX: Added Number() to ensure v.price is treated as a number, preventing arithmetic errors on potentially mixed types.
        const totalSales = soldListings.reduce((sum: number, v) => sum + (Number(v.price) || 0), 0);
        const flaggedVehiclesCount = vehicles.reduce((sum: number, v) => v.isFlagged ? sum + 1 : sum, 0);
        const flaggedConversationsCount = conversations.reduce((sum: number, c) => c.isFlagged ? sum + 1 : sum, 0);
        const flaggedContent = flaggedVehiclesCount + flaggedConversationsCount;
        const certificationRequests = vehicles.filter(v => v.certificationStatus === 'requested').length;
        
        const listingsByMake = vehicles.reduce((acc, v) => {
            acc[v.make] = (acc[v.make] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userSignups = users.reduce((acc, u) => {
            const date = new Date(u.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userSignupsChartData = Object.entries(userSignups)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .slice(-30) // Last 30 days
            .map(([label, value]) => ({ label, value }));
        
        const listingsByMakeChartData = Object.entries(listingsByMake)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10)
            .map(([label, value]) => ({ label, value }));

        return {
            totalUsers, totalVehicles, activeListings, totalSales, flaggedContent, certificationRequests,
            listingsByMakeChartData,
            userSignupsChartData
        };
    }, [users, vehicles, conversations]);

    const filteredUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (roleFilter !== 'all') {
            sortableUsers = sortableUsers.filter(user => user.role === roleFilter);
        }
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                const valA = String(a[sortConfig.key]);
                const valB = String(b[sortConfig.key]);
                if (valA < valB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, roleFilter, sortConfig]);

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

    const requestSort = (key: SortableUserKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSaveUser = (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
        onAdminUpdateUser(email, details);
        setEditingUser(null);
    };

    const handleSaveVehicle = (vehicle: Vehicle) => {
        onUpdateVehicle(vehicle);
        setEditingVehicle(null);
    };
    
    const renderContent = () => {
        switch(activeView) {
            case 'analytics':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard title="Total Users" value={analytics.totalUsers} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: '#1E88E5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>} onClick={() => setActiveView('users')} />
                            <StatCard title="Active Listings" value={analytics.activeListings} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: '#1E88E5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" /></svg>} onClick={() => setActiveView('listings')} />
                            <StatCard title="Total Sales" value={`₹${(analytics.totalSales / 100000).toFixed(2)}L`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: '#1E88E5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                            <StatCard title="Flagged Content" value={analytics.flaggedContent} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: '#1E88E5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>} onClick={() => setActiveView('moderation')} />
                            <StatCard title="Open Support Tickets" value={supportTickets.filter(t => t.status !== 'Closed').length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: '#1E88E5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} onClick={() => setActiveView('support')} />
                            <StatCard title="Certification Requests" value={analytics.certificationRequests} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: '#1E88E5' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" /></svg>} onClick={() => setActiveView('certificationRequests')} />
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart title="Top 10 Vehicle Makes" data={analytics.listingsByMakeChartData} />
                            <BarChart title="User Signups (Last 30 Days)" data={analytics.userSignupsChartData} />
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-4">Export Data</h3>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={onExportUsers} className="bg-white-dark dark:bg-white font-semibold py-2 px-4 rounded-lg">Export Users (CSV)</button>
                                <button onClick={onExportVehicles} className="bg-white-dark dark:bg-white font-semibold py-2 px-4 rounded-lg">Export Listings (CSV)</button>
                                <button onClick={onExportSales} className="bg-white-dark dark:bg-white font-semibold py-2 px-4 rounded-lg">Export Sales Report (CSV)</button>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                const userFilterActions = (
                     <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="p-2 border border-gray-200 dark:border-gray-200-300 rounded-lg bg-white dark:text-spinny-text-dark">
                        <option value="all">All Roles</option>
                        <option value="customer">Customers</option>
                        <option value="seller">Sellers</option>
                        <option value="admin">Admins</option>
                    </select>
                );
                return (
                   <TableContainer title="User Management" actions={userFilterActions}>
                       <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-white dark:bg-white text-spinny-text-dark dark:text-spinny-text-dark"><tr>
                                <SortableHeader title="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email & Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Role</th>
                                <SortableHeader title="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Verified</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map(user => {
                                    const isCurrentUser = user.email === currentUser.email;
                                    return (
                                        <tr key={user.email}>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><p>{user.email}</p><p className="text-spinny-text-dark">{user.mobile}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-spinny-orange-light text-spinny-orange' : user.role === 'seller' ? 'brand-badge-orange' : 'bg-spinny-orange-light text-spinny-orange'}`}>{user.role}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-spinny-orange-light text-spinny-orange' : 'bg-white-dark text-spinny-text-dark'}`}>{user.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.role === 'seller' && (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={user.isVerified || false} 
                                                        onChange={() => onToggleVerifiedStatus(user.email)}
                                                        className="h-4 w-4 border-gray-200 rounded" style={{ accentColor: '#FF6B35' }}
                                                        title={user.isVerified ? "Un-verify seller" : "Verify seller"}
                                                    />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                                <button onClick={() => setEditingUser(user)} className="transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>Edit</button>
                                                <button onClick={() => onToggleUserStatus(user.email)} disabled={isCurrentUser} className={`${user.status === 'active' ? 'text-spinny-text-dark hover:text-spinny-text-dark' : 'text-spinny-orange hover:text-spinny-orange'} disabled:opacity-50 disabled:cursor-not-allowed`}>{user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                                <button onClick={() => onDeleteUser(user.email)} disabled={isCurrentUser} className="text-spinny-orange hover:text-spinny-orange disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                       </table>
                   </TableContainer>
                );
            case 'listings':
                const listingActions = (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="items-per-page" className="text-sm font-medium text-spinny-text-dark dark:text-spinny-text-dark">
                                Show:
                            </label>
                            <select 
                                id="items-per-page"
                                value={itemsPerPage} 
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="px-3 py-1 border border-gray-200 dark:border-gray-200-300 rounded-lg bg-white dark:bg-white text-sm text-spinny-text-dark dark:text-spinny-text-dark"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-spinny-text-dark dark:text-spinny-text-dark">per page</span>
                        </div>
                    </div>
                );

                return (
                    <TableContainer title={`All Listings (${vehicles.length} total)`} actions={listingActions}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-white dark:bg-white"><tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Listing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Featured</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedVehicles.map(v => (
                                    <tr key={v.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                        <td className="px-6 py-4 text-sm">{v.sellerEmail}</td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${v.status === 'published' ? 'bg-spinny-orange-light text-spinny-orange' : 'bg-white-dark text-spinny-text-dark'}`}>{v.status}</span></td>
                                        <td className="px-6 py-4">{v.isFeatured ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                            <button onClick={() => setEditingVehicle(v)} className="transition-colors" style={{ color: '#FF6B35' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}>Edit</button>
                                            <button onClick={() => onToggleVehicleStatus(v.id)} className="text-spinny-text-dark hover:text-spinny-text-dark">{v.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                                            <button onClick={() => onToggleVehicleFeature(v.id)} className="text-spinny-orange hover:text-spinny-orange">{v.isFeatured ? 'Un-feature' : 'Feature'}</button>
                                            <button onClick={() => onDeleteVehicle(v.id)} className="text-spinny-orange hover:text-spinny-orange">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-spinny-text-dark dark:text-spinny-text-dark">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, vehicles.length)} of {vehicles.length} listings
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-200-300 rounded-lg bg-white dark:bg-white text-spinny-text-dark dark:text-spinny-text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                            if (pageNum > totalPages) return null;
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-1 text-sm border rounded-lg transition-colors ${
                                                        currentPage === pageNum 
                                                            ? 'bg-spinny-orange text-white border-spinny-orange' 
                                                            : 'border-gray-200 dark:border-gray-200-300 bg-white dark:bg-white text-spinny-text-dark dark:text-spinny-text-dark hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-200-300 rounded-lg bg-white dark:bg-white text-spinny-text-dark dark:text-spinny-text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </TableContainer>
                );
            case 'moderation':
                return <ModerationQueueView vehicles={vehicles} conversations={conversations} onResolveFlag={onResolveFlag} onToggleVehicleStatus={onToggleVehicleStatus} onToggleUserStatus={onToggleUserStatus} />;
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
                return <PlatformSettingsView settings={platformSettings} onUpdate={onUpdateSettings} onSendBroadcast={onSendBroadcast} />;
             case 'support':
                return <SupportTicketsView tickets={supportTickets} onUpdateTicket={onUpdateSupportTicket} currentUser={currentUser} />;
            case 'payments':
                return <PaymentManagement currentUser={currentUser} />;
            case 'planManagement':
                return <PlanManagementView users={users} vehicles={vehicles} onUpdateUserPlan={onUpdateUserPlan} />;
            case 'faq':
                return <FAQEditorView faqItems={faqItems} onAdd={onAddFaq} onUpdate={onUpdateFaq} onDelete={onDeleteFaq} />;
            default:
                return <div>Select a view</div>;
        }
    };

    const NavItem: React.FC<{ view: AdminView, label: string, count?: number }> = ({ view, label, count }) => (
        <li>
            <button
                onClick={() => setActiveView(view)}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex justify-between items-center ${activeView === view ? 'text-white shadow-md' : 'text-spinny-text-dark dark:text-spinny-text-dark hover:bg-white dark:hover:bg-white'}`} style={activeView === view ? { background: 'var(--gradient-primary)' } : undefined}
            >
                <span className="font-semibold">{label}</span>
                {count !== undefined && count > 0 && <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${activeView === view ? 'bg-white' : 'bg-spinny-orange-light0 text-white'}`} style={activeView === view ? { color: '#FF6B35' } : undefined}>{count}</span>}
            </button>
        </li>
    );

    return (
        <div className="container mx-auto py-8 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-spinny-text-dark dark:text-spinny-text-dark mb-6">Administrator Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                <aside className="self-start md:sticky top-24">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <ul className="space-y-1">
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
                        </ul>
                    </div>
                </aside>
                <main>
                    {renderContent()}
                </main>
            </div>

            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
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
