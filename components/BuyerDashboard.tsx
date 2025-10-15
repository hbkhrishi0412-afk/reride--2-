import React, { useState, useMemo, useCallback } from 'react';
import type { User, Vehicle, SavedSearch, Conversation } from '../types';
import { View } from '../types';
import * as buyerService from '../services/buyerService';
import VehicleCard from './VehicleCard';

interface BuyerDashboardProps {
  currentUser: User;
  vehicles: Vehicle[];
  wishlist: number[];
  conversations: Conversation[];
  onNavigate: (view: View) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onToggleWishlist: (id: number) => void;
  onToggleCompare: (id: number) => void;
  comparisonList: number[];
  onViewSellerProfile: (sellerEmail: string) => void;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  currentUser,
  vehicles,
  wishlist,
  conversations,
  onNavigate,
  onSelectVehicle,
  onToggleWishlist,
  onToggleCompare,
  comparisonList,
  onViewSellerProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'searches' | 'activity' | 'alerts'>('overview');
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(
    () => buyerService.getSavedSearches(currentUser?.email || '')
  );

  // Add safety checks for currentUser
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-brand-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-spinny-text-dark dark:text-spinny-text mb-4">
            Please log in to view your dashboard
          </h2>
          <button
            onClick={() => onNavigate(View.LOGIN)}
            className="btn-brand-primary text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Get buyer activity
  const buyerActivity = useMemo(
    () => buyerService.getBuyerActivity(currentUser.email),
    [currentUser.email]
  );

  // Get recently viewed vehicles
  const recentlyViewed = useMemo(() => {
    if (!vehicles || !Array.isArray(vehicles)) return [];
    const viewedIds = buyerActivity.recentlyViewed.slice(0, 6);
    return vehicles.filter(v => v && viewedIds.includes(v.id));
  }, [buyerActivity.recentlyViewed, vehicles]);

  // Get wishlist vehicles
  const wishlistVehicles = useMemo(
    () => {
      if (!vehicles || !Array.isArray(vehicles)) return [];
      return vehicles.filter(v => v && wishlist.includes(v.id)).slice(0, 6);
    },
    [vehicles, wishlist]
  );

  // Check for price drops
  const priceDrops = useMemo(() => {
    return buyerService.checkPriceDrops(currentUser.email, wishlist, vehicles);
  }, [currentUser.email, wishlist, vehicles]);

  // Find new matches for saved searches
  const newMatches = useMemo(() => {
    return buyerService.findNewMatches(currentUser.email, vehicles)
      .filter(result => result.matches.length > 0);
  }, [currentUser.email, vehicles]);

  const handleDeleteSearch = useCallback((searchId: number) => {
    buyerService.deleteSavedSearch(currentUser.email, searchId);
    setSavedSearches(buyerService.getSavedSearches(currentUser.email));
  }, [currentUser.email]);

  const handleToggleAlerts = useCallback((searchId: number, emailAlerts: boolean) => {
    buyerService.updateSavedSearch(currentUser.email, searchId, { emailAlerts });
    setSavedSearches(buyerService.getSavedSearches(currentUser.email));
  }, [currentUser.email]);

  const stats = [
    {
      label: 'Wishlist',
      value: wishlist.length,
      icon: '❤️',
      action: () => onNavigate(View.WISHLIST),
    },
    {
      label: 'Messages',
      value: conversations.length,
      icon: '💬',
      action: () => onNavigate(View.INBOX),
    },
    {
      label: 'Saved Searches',
      value: savedSearches.length,
      icon: '🔍',
      action: () => setActiveTab('searches'),
    },
    {
      label: 'Recently Viewed',
      value: recentlyViewed.length,
      icon: '👁️',
      action: () => setActiveTab('activity'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-spinny-text-dark dark:text-spinny-text mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {currentUser.name}! Here's your activity overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={stat.action}
              className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-3xl font-bold text-spinny-orange">
                  {stat.value}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </p>
            </button>
          ))}
        </div>

        {/* Alerts Section */}
        {(priceDrops.length > 0 || newMatches.length > 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              New Alerts
            </h2>

            {/* Price Drops */}
            {priceDrops.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  🔽 Price Drops ({priceDrops.length})
                </h3>
                {priceDrops.map(drop => {
                  const vehicle = vehicles.find(v => v.id === drop.vehicleId);
                  if (!vehicle) return null;
                  const savings = drop.oldPrice - drop.newPrice;
                  return (
                    <div
                      key={drop.vehicleId}
                      className="bg-white dark:bg-brand-gray-800 rounded-lg p-4 mb-2 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onSelectVehicle(vehicle)}
                    >
                      <p className="font-semibold text-spinny-text-dark dark:text-spinny-text">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="line-through">₹{drop.oldPrice.toLocaleString('en-IN')}</span>
                        {' → '}
                        <span className="text-spinny-orange font-bold">
                          ₹{drop.newPrice.toLocaleString('en-IN')}
                        </span>
                        {' '}
                        <span className="text-green-600">
                          (Save ₹{savings.toLocaleString('en-IN')})
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New Matches */}
            {newMatches.length > 0 && (
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  ✨ New Matches for Your Searches
                </h3>
                {newMatches.map(result => {
                  const search = savedSearches.find(s => s.id === result.searchId);
                  if (!search) return null;
                  return (
                    <div
                      key={result.searchId}
                      className="bg-white dark:bg-brand-gray-800 rounded-lg p-4 mb-2"
                    >
                      <p className="font-semibold text-spinny-text-dark dark:text-spinny-text mb-1">
                        {search.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {result.matches.length} new {result.matches.length === 1 ? 'match' : 'matches'} found
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-4 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'searches', label: 'Saved Searches', icon: '🔍' },
                { id: 'activity', label: 'Recent Activity', icon: '🕒' },
                { id: 'alerts', label: 'Alerts', icon: '🔔', badge: priceDrops.length + newMatches.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-spinny-orange text-spinny-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Wishlist Section */}
                {wishlistVehicles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text">
                        ❤️ Your Wishlist
                      </h3>
                      <button
                        onClick={() => onNavigate(View.WISHLIST)}
                        className="text-spinny-orange hover:underline text-sm font-semibold"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistVehicles.map(vehicle => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onSelect={onSelectVehicle}
                          onToggleCompare={onToggleCompare}
                          comparisonList={comparisonList}
                          onToggleWishlist={onToggleWishlist}
                          wishlist={wishlist}
                          onViewSellerProfile={onViewSellerProfile}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recently Viewed Section */}
                {recentlyViewed.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text mb-4">
                      👁️ Recently Viewed
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentlyViewed.map(vehicle => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onSelect={onSelectVehicle}
                          onToggleCompare={onToggleCompare}
                          comparisonList={comparisonList}
                          onToggleWishlist={onToggleWishlist}
                          wishlist={wishlist}
                          onViewSellerProfile={onViewSellerProfile}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Searches Tab */}
            {activeTab === 'searches' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text">
                    Your Saved Searches
                  </h3>
                </div>

                {savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No saved searches yet. Save your search criteria to get alerts on new matches!
                    </p>
                    <button
                      onClick={() => onNavigate(View.USED_CARS)}
                      className="btn-brand-primary text-white px-6 py-2 rounded-lg"
                    >
                      Browse Vehicles
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSearches.map(search => {
                      const matches = buyerService.matchVehiclesToSearch(vehicles, search);
                      return (
                        <div
                          key={search.id}
                          className="bg-gray-50 dark:bg-brand-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-spinny-text-dark dark:text-spinny-text">
                                {search.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteSearch(search.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Search Filters Display */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {search.filters.make && (
                              <span className="text-xs bg-white dark:bg-brand-gray-800 px-2 py-1 rounded">
                                Make: {search.filters.make}
                              </span>
                            )}
                            {search.filters.model && (
                              <span className="text-xs bg-white dark:bg-brand-gray-800 px-2 py-1 rounded">
                                Model: {search.filters.model}
                              </span>
                            )}
                            {(search.filters.minPrice || search.filters.maxPrice) && (
                              <span className="text-xs bg-white dark:bg-brand-gray-800 px-2 py-1 rounded">
                                Price: ₹{(search.filters.minPrice || 0).toLocaleString()} - ₹{(search.filters.maxPrice || 0).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Email Alerts Toggle */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={search.emailAlerts}
                              onChange={(e) => handleToggleAlerts(search.id, e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Email me about new matches
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text mb-6">
                  Recent Activity
                </h3>
                {recentlyViewed.length === 0 ? (
                  <p className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No recent activity. Start browsing vehicles to see them here!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentlyViewed.map(vehicle => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onSelect={onSelectVehicle}
                        onToggleCompare={onToggleCompare}
                        comparisonList={comparisonList}
                        onToggleWishlist={onToggleWishlist}
                        wishlist={wishlist}
                        onViewSellerProfile={onViewSellerProfile}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div>
                <h3 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text mb-6">
                  Your Alerts
                </h3>
                {priceDrops.length === 0 && newMatches.length === 0 ? (
                  <p className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No alerts at the moment. We'll notify you when there are price drops on your wishlist or new matches for your saved searches!
                  </p>
                ) : (
                  <div className="space-y-6">
                    {priceDrops.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-spinny-text-dark dark:text-spinny-text mb-4">
                          🔽 Price Drops
                        </h4>
                        <div className="space-y-3">
                          {priceDrops.map(drop => {
                            const vehicle = vehicles.find(v => v.id === drop.vehicleId);
                            if (!vehicle) return null;
                            return (
                              <div
                                key={drop.vehicleId}
                                className="bg-white dark:bg-brand-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => onSelectVehicle(vehicle)}
                              >
                                <div className="flex items-center gap-4">
                                  <img
                                    src={vehicle.images[0]}
                                    alt={`${vehicle.make} ${vehicle.model}`}
                                    className="w-24 h-20 object-cover rounded-lg"
                                  />
                                  <div className="flex-1">
                                    <p className="font-semibold text-spinny-text-dark dark:text-spinny-text">
                                      {vehicle.year} {vehicle.make} {vehicle.model}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="line-through">₹{drop.oldPrice.toLocaleString('en-IN')}</span>
                                      {' → '}
                                      <span className="text-spinny-orange font-bold">
                                        ₹{drop.newPrice.toLocaleString('en-IN')}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;

