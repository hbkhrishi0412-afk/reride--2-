import React, { useState, memo } from 'react';
import type { User, Vehicle, Conversation } from '../types';
import { View as ViewEnum } from '../types';

interface MobileDashboardProps {
  currentUser: User;
  userVehicles: Vehicle[];
  conversations: Conversation[];
  onNavigate: (view: ViewEnum) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
  onMarkAsSold: (vehicleId: number) => void;
  onFeatureListing: (vehicleId: number) => void;
  onSendMessage: (conversationId: string, message: string) => void;
  onMarkConversationAsRead: (conversationId: string) => void;
  onOfferResponse: (conversationId: string, messageId: string, response: string, counterPrice?: number) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onFlagContent: (type: 'vehicle' | 'conversation', id: string, reason: string) => void;
  onLogout?: () => void;
  // Add vehicle form handlers
  onAddVehicle?: (vehicleData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing?: boolean) => void;
  onUpdateVehicle?: (vehicleData: Vehicle) => void;
  vehicleData?: any; // Vehicle data for form
}

type DashboardTab = 'overview' | 'listings' | 'messages' | 'analytics' | 'profile' | 'addVehicle' | 'editVehicle';

const MobileDashboard: React.FC<MobileDashboardProps> = memo(({
  currentUser,
  userVehicles,
  conversations,
  onNavigate,
  onEditVehicle,
  onDeleteVehicle,
  onMarkAsSold,
  onFeatureListing,
  onSendMessage,
  onMarkConversationAsRead,
  onOfferResponse,
  typingStatus,
  onUserTyping,
  onMarkMessagesAsRead,
  onFlagContent,
  onLogout,
  onAddVehicle,
  onUpdateVehicle,
  vehicleData
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const isSeller = currentUser.role === 'seller';
  const isAdmin = currentUser.role === 'admin';
  const isCustomer = currentUser.role === 'customer';

  // Calculate stats
  const totalListings = userVehicles.length;
  const activeListings = userVehicles.filter(v => v.status === 'active').length;
  const soldListings = userVehicles.filter(v => v.status === 'sold').length;
  const unreadMessages = conversations.filter(c => !c.isReadByCustomer).length;
  const totalViews = userVehicles.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalInquiries = conversations.length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', count: null },
    { id: 'listings', label: 'Listings', icon: '🚗', count: totalListings },
    { id: 'messages', label: 'Messages', icon: '💬', count: unreadMessages },
    { id: 'analytics', label: 'Analytics', icon: '📈', count: null },
    { id: 'profile', label: 'Profile', icon: '👤', count: null },
  ];

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
        <h2 className="text-lg font-bold mb-1">Welcome back, {currentUser.name?.split(' ')[0]}!</h2>
        <p className="text-orange-100 text-sm">
          {isSeller ? 'Manage your vehicle listings' : 
           isAdmin ? 'Monitor platform activity' : 
           'Track your car search journey'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Listings</p>
              <p className="text-2xl font-bold text-gray-900">{totalListings}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">🚗</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Messages</p>
              <p className="text-2xl font-bold text-gray-900">{unreadMessages}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">💬</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Views</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">👁️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sold</p>
              <p className="text-2xl font-bold text-gray-900">{soldListings}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {isSeller && (
            <>
              <button 
                onClick={() => {
                  setEditingVehicle(null);
                  setActiveTab('addVehicle');
                }}
                className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg text-orange-700 font-medium"
              >
                <span>➕</span>
                <span className="text-sm">Add Vehicle</span>
              </button>
              <button 
                onClick={() => setActiveTab('listings')}
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 font-medium"
              >
                <span>📝</span>
                <span className="text-sm">Manage Listings</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveTab('messages')}
            className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 font-medium"
          >
            <span>💬</span>
            <span className="text-sm">View Messages</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-gray-700 font-medium"
          >
            <span>⚙️</span>
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Your Listings</h3>
        {isSeller && (
          <button 
            onClick={() => onNavigate(ViewEnum.SELLER_DASHBOARD)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Add Vehicle
          </button>
        )}
      </div>

      {userVehicles.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚗</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h4>
          <p className="text-gray-500 text-sm mb-4">
            {isSeller ? 'Start by adding your first vehicle' : 'You haven\'t saved any vehicles yet'}
          </p>
          {isSeller && (
            <button 
              onClick={() => onNavigate(ViewEnum.SELLER_DASHBOARD)}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium"
            >
              Add Your First Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {userVehicles.slice(0, 5).map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚗</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h4>
                  <p className="text-sm text-gray-500">₹{vehicle.price.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vehicle.status}
                    </span>
                    {vehicle.views && (
                      <span className="text-xs text-gray-500">{vehicle.views} views</span>
                    )}
                  </div>
                </div>
                {isSeller && (
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setActiveTab('editVehicle');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onDeleteVehicle(vehicle.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {userVehicles.length > 5 && (
            <button 
              onClick={() => onNavigate(ViewEnum.SELLER_DASHBOARD)}
              className="w-full py-3 text-orange-600 font-medium border border-orange-200 rounded-lg hover:bg-orange-50"
            >
              View All Listings ({userVehicles.length})
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
        <span className="text-sm text-gray-500">{conversations.length} total</span>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
          <p className="text-gray-500 text-sm">Your conversations will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.slice(0, 5).map((conversation) => (
            <div 
              key={conversation.id} 
              className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() => onNavigate(ViewEnum.INBOX)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-medium text-sm">
                    {conversation.customerName?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate">
                      {conversation.customerName || 'Customer'}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>
                  {!conversation.isReadByCustomer && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {conversations.length > 5 && (
            <button 
              onClick={() => onNavigate(ViewEnum.INBOX)}
              className="w-full py-3 text-orange-600 font-medium border border-orange-200 rounded-lg hover:bg-orange-50"
            >
              View All Messages ({conversations.length})
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">👁️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">📞</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{activeListings}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">🚗</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sold</p>
              <p className="text-2xl font-bold text-gray-900">{soldListings}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">✅</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">New inquiry received</span>
            <span className="text-gray-400 text-xs ml-auto">2h ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Vehicle viewed 5 times</span>
            <span className="text-gray-400 text-xs ml-auto">4h ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600">New listing published</span>
            <span className="text-gray-400 text-xs ml-auto">1d ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold text-xl">
              {currentUser.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{currentUser.name}</h3>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
            <p className="text-xs text-orange-600 font-medium uppercase">{currentUser.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-3">Account Settings</h4>
        <div className="space-y-3">
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-900">Edit Profile</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-900">Notifications</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-900">Privacy</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-900">Help & Support</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full text-left p-3 hover:bg-red-50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-red-600">Log Out</span>
                <span className="text-red-400">›</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderAddVehicle = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Add New Vehicle</h3>
        <button 
          onClick={() => setActiveTab('overview')}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚗</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Vehicle Form Coming Soon</h4>
          <p className="text-gray-500 text-sm mb-4">
            We're working on a mobile-optimized vehicle form. For now, please use the desktop version.
          </p>
          <button 
            onClick={() => onNavigate(ViewEnum.SELLER_DASHBOARD)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Go to Desktop Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditVehicle = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Edit Vehicle</h3>
        <button 
          onClick={() => setActiveTab('listings')}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✏️</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Edit Vehicle Coming Soon</h4>
          <p className="text-gray-500 text-sm mb-4">
            We're working on a mobile-optimized vehicle edit form. For now, please use the desktop version.
          </p>
          <button 
            onClick={() => onNavigate(ViewEnum.SELLER_DASHBOARD)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Go to Desktop Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'listings': return renderListings();
      case 'messages': return renderMessages();
      case 'analytics': return renderAnalytics();
      case 'profile': return renderProfile();
      case 'addVehicle': return renderAddVehicle();
      case 'editVehicle': return renderEditVehicle();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Dashboard Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              {isSeller ? 'Manage your listings' : 
               isAdmin ? 'Platform overview' : 
               'Your car journey'}
            </p>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold">
              {currentUser.name?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
});

MobileDashboard.displayName = 'MobileDashboard';

export default MobileDashboard;
