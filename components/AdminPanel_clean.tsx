
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

// --- Main AdminPanel Component ---
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

    const handleSaveUser = (updatedUser: User) => {
        onAdminUpdateUser(updatedUser.email, {
            name: updatedUser.name,
            mobile: updatedUser.mobile,
            role: updatedUser.role
        });
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
                            <button onClick={onExportUsers} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                                Export Users
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
                                                <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-800">Edit</button>
                                                <button onClick={() => onToggleUserStatus(user.email)} className="text-yellow-600 hover:text-yellow-800">
                                                    {user.status === 'active' ? 'Suspend' : 'Activate'}
                                                </button>
                                                <button onClick={() => onDeleteUser(user.email)} className="text-red-600 hover:text-red-800">Delete</button>
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
                            <button onClick={onExportVehicles} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                                Export Vehicles
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
                                                <button onClick={() => setEditingVehicle(vehicle)} className="text-blue-600 hover:text-blue-800">Edit</button>
                                                <button onClick={() => onToggleVehicleStatus(vehicle.id)} className="text-yellow-600 hover:text-yellow-800">
                                                    {vehicle.status === 'published' ? 'Unpublish' : 'Publish'}
                                                </button>
                                                <button onClick={() => onDeleteVehicle(vehicle.id)} className="text-red-600 hover:text-red-800">Delete</button>
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
                return <SupportTicketsView tickets={supportTickets} onUpdateTicket={onUpdateSupportTicket} />;
            case 'faq':
                return <FAQManagementView faqs={faqItems} onAddFaq={onAddFaq} onUpdateFaq={onUpdateFaq} onDeleteFaq={onDeleteFaq} />;
            case 'payments':
                return <PaymentManagement vehicles={vehicles} users={users} />;
            case 'planManagement':
                return <PlanManagementView users={users} vehicles={vehicles} onUpdateUserPlan={onUpdateUserPlan} />;
            default:
                return null;
        }
    };

    // Placeholder components for views that need to be implemented
    const ModerationQueueView = ({ vehicles, conversations, onResolveFlag, onToggleVehicleStatus, onToggleUserStatus }: any) => (
        <TableContainer title="Moderation Queue">
            <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                    Moderation queue functionality would be implemented here
                </div>
            </div>
        </TableContainer>
    );

    const PlatformSettingsView = ({ settings, onUpdate, onSendBroadcast }: any) => (
        <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
                Platform settings functionality would be implemented here
            </div>
        </div>
    );

    const SupportTicketsView = ({ tickets, onUpdateTicket }: any) => (
        <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
                Support tickets functionality would be implemented here
            </div>
        </div>
    );

    const FAQManagementView = ({ faqs, onAddFaq, onUpdateFaq, onDeleteFaq }: any) => (
        <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
                FAQ management functionality would be implemented here
            </div>
        </div>
    );

    const PlanManagementView = ({ users, vehicles, onUpdateUserPlan }: any) => (
        <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
                Plan management functionality would be implemented here
            </div>
        </div>
    );

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex">
                <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Admin Panel</h1>
                        <nav className="space-y-2">
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

