

import React, { useState, useEffect } from 'react';
import type { Vehicle, VehicleCategory, View } from '../types';
import { View as ViewEnum, VehicleCategory as CategoryEnum } from '../types';
import StarRating from './StarRating';
import QuickViewModal from './QuickViewModal';

interface HomeProps {
    onSearch: (query: string) => void;
    onSelectCategory: (category: VehicleCategory) => void;
    featuredVehicles: Vehicle[];
    onSelectVehicle: (vehicle: Vehicle) => void;
    onToggleCompare: (id: number) => void;
    comparisonList: number[];
    onToggleWishlist: (id: number) => void;
    wishlist: number[];
    onViewSellerProfile: (sellerEmail: string) => void;
    recommendations: Vehicle[];
    allVehicles: Vehicle[];
    onNavigate: (view: View) => void;
}

const categoryIcons: Record<VehicleCategory, React.ReactNode> = {
    [CategoryEnum.FOUR_WHEELER]: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.25 15.8059C8.33333 16.3562 7 17.4641 7 19C7 20.5359 8.33333 21.6438 9.25 22.1941M14.75 15.8059C15.6667 16.3562 17 17.4641 17 19C17 20.5359 15.6667 21.6438 14.75 22.1941M16 7H8L7 11H17L16 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 11V15.5C17 16.8807 15.8807 18 14.5 18C13.1193 18 12 16.8807 12 15.5V13.5M7 11V15.5C7 16.8807 8.11929 18 9.5 18C10.8807 18 12 16.8807 12 15.5V13.5M12 13.5V11M12 11H17H7M15.5 4L15 7H9L8.5 4H15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    [CategoryEnum.TWO_WHEELER]: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 11.5C4 10.1193 5.11929 9 6.5 9H12.5V12.5C12.5 14.1569 11.1569 15.5 9.5 15.5H6.5C5.11929 15.5 4 14.3807 4 13V11.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M15.5 19.5C17.7091 19.5 19.5 17.7091 19.5 15.5C19.5 13.2909 17.7091 11.5 15.5 11.5C13.2909 11.5 11.5 13.2909 11.5 15.5C11.5 17.7091 13.2909 19.5 15.5 19.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 19.5C7.70914 19.5 9.5 17.7091 9.5 15.5C9.5 13.2909 7.70914 11.5 5.5 11.5C3.29086 11.5 1.5 13.2909 1.5 15.5C1.5 17.7091 3.29086 19.5 5.5 19.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12.5 12.5L16.5 6.5H20.5L18 10.5H12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    [CategoryEnum.THREE_WHEELER]: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 19.5C18.3807 19.5 19.5 18.3807 19.5 17C19.5 15.6193 18.3807 14.5 17 14.5C15.6193 14.5 14.5 15.6193 14.5 17C14.5 18.3807 15.6193 19.5 17 19.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 19.5C8.38071 19.5 9.5 18.3807 9.5 17C9.5 15.6193 8.38071 14.5 7 14.5C5.61929 14.5 4.5 15.6193 4.5 17C4.5 18.3807 5.61929 19.5 7 19.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 9C13.6569 9 15 7.65685 15 6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6C9 7.65685 10.3431 9 12 9Z" stroke="currentColor" strokeWidth="1.5"/><path d="M17 14.5H19L21 9H15L14 14.5H9.5M9.5 14.5L9 11H3.5L3 12.5H9.5M9.5 14.5H14.5M12 9V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    [CategoryEnum.COMMERCIAL]: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 13L3 18.25C3 19.2165 4.02944 20 5.25 20H18.75C19.9706 20 21 19.2165 21 18.25V13M3 13V8.75C3 7.7835 4.02944 7 5.25 7H9.75C10.9706 7 12 7.7835 12 8.75V13M3 13H12M12 13H21M21 13V8.75C21 7.7835 19.9706 7 18.75 7H13.5L12 4H7L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    [CategoryEnum.FARM]: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 19.5C20.4853 19.5 22.5 17.4853 22.5 15C22.5 12.5147 20.4853 10.5 18 10.5C15.5147 10.5 13.5 12.5147 13.5 15C13.5 17.4853 15.5147 19.5 18 19.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 19.5C9.48528 19.5 11.5 17.4853 11.5 15C11.5 12.5147 9.48528 10.5 7 10.5C4.51472 10.5 2.5 12.5147 2.5 15C2.5 17.4853 4.51472 19.5 7 19.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M13.5 15H11.5M7 10.5V6.5L9.5 4.5H13.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    [CategoryEnum.CONSTRUCTION]: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M2 17L4 17M4 17L4.47143 16.1143C5.2381 14.6667 6.42857 14 8 14H12C14.6667 14 16.6667 12.3333 18 10L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17L6 21H11L14 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 14L7.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

const FeaturedVehicleCard: React.FC<Pick<HomeProps, 'onSelectVehicle' | 'onToggleCompare' | 'comparisonList' | 'onToggleWishlist' | 'wishlist' | 'onViewSellerProfile'> & { vehicle: Vehicle; onQuickView: (vehicle: Vehicle) => void; }> = ({ vehicle, onSelectVehicle, onToggleCompare, comparisonList, onToggleWishlist, wishlist, onViewSellerProfile, onQuickView }) => {
    const isSelectedForCompare = comparisonList.includes(vehicle.id);
    const isInWishlist = wishlist.includes(vehicle.id);
    const isCompareDisabled = !isSelectedForCompare && comparisonList.length >= 4;
  
    const handleCompareClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleCompare(vehicle.id);
    };
  
    const handleWishlistClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleWishlist(vehicle.id);
    };

    const handleSellerClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewSellerProfile(vehicle.sellerEmail);
    }

    const handleQuickViewClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickView(vehicle);
    }
  
    return (
      <div 
        onClick={() => onSelectVehicle(vehicle)}
        className="carandbike-card group cursor-pointer"
      >
        <div className="relative overflow-hidden">
          <img className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} loading="lazy" />
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent"></div>
          <div className="absolute top-3 right-3">
              <button
                onClick={handleWishlistClick}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isInWishlist ? 'text-pink-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>
          </div>
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={handleQuickViewClick} className="bg-white/90 dark:bg-black/80 text-brand-gray-800 dark:text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform backdrop-blur-sm">
                  Quick View
              </button>
          </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold" style={{color: 'var(--carandbike-dark-gray)'}}>{vehicle.make} {vehicle.model}</h3>
              <span className="text-sm font-semibold px-2 py-1 rounded" style={{color: 'var(--carandbike-light-gray)', backgroundColor: 'var(--carandbike-off-white)'}}>{vehicle.year}</span>
          </div>
           <p className="text-sm mb-2" style={{color: 'var(--carandbike-light-gray)'}}>{vehicle.variant || ''}</p>
          <div className="mb-3 text-sm truncate" style={{color: 'var(--carandbike-light-gray)'}}>
             By: <button onClick={handleSellerClick} className="font-semibold hover:underline focus:outline-none" style={{color: 'var(--carandbike-primary-blue)'}}>{vehicle.sellerName}</button>
          </div>
          
          <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center text-sm" style={{borderTop: '1px solid var(--carandbike-border)', color: 'var(--carandbike-medium-gray)'}}>
             <span>{vehicle.mileage.toLocaleString('en-IN')} kms</span>
             <span>{vehicle.fuelType}</span>
             <span>{vehicle.transmission}</span>
          </div>
  
          <div className="mt-4 flex justify-between items-center">
               <p className="text-xl font-bold" style={{color: 'var(--carandbike-dark-gray)'}}>₹{vehicle.price.toLocaleString('en-IN')}</p>
               <label 
                onClick={handleCompareClick} 
                title={isCompareDisabled ? "Comparison limit reached (max 4)" : "Add to compare"}
                className={`flex items-center text-sm font-medium px-3 py-2 rounded-md transition-colors ${isCompareDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
                style={{color: 'var(--carandbike-medium-gray)'}}
              >
                <input 
                  type="checkbox" 
                  checked={isSelectedForCompare}
                  readOnly
                  disabled={isCompareDisabled}
                  className="form-checkbox h-4 w-4 rounded focus:ring-blue-500 disabled:opacity-50"
                  style={{color: 'var(--carandbike-primary-blue)', backgroundColor: 'var(--carandbike-off-white)', borderColor: 'var(--carandbike-border)'}}
                />
                <span className="ml-2">Compare</span>
              </label>
          </div>
        </div>
      </div>
    );
};

const Home: React.FC<HomeProps> = ({ onSearch, onSelectCategory, featuredVehicles, onSelectVehicle, onToggleCompare, comparisonList, onToggleWishlist, wishlist, onViewSellerProfile, recommendations, allVehicles, onNavigate }) => {
    const [aiSearchQuery, setAiSearchQuery] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);
    const [recentlyViewed, setRecentlyViewed] = useState<Vehicle[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
    
        const targets = document.querySelectorAll('.scroll-animate');
        targets.forEach(target => observer.observe(target));
    
        return () => targets.forEach(target => observer.unobserve(target));
      }, []);

    useEffect(() => {
        const getViewedIds = (): number[] => {
            try {
                const viewedJson = localStorage.getItem('viewedVehicleIds');
                return viewedJson ? JSON.parse(viewedJson) : [];
            } catch (error) {
                console.error("Failed to get viewed vehicle IDs:", error);
                return [];
            }
        };

        const viewedIds = getViewedIds();
        if (viewedIds.length > 0) {
            const vehicleMap = new Map(allVehicles.map(v => [v.id, v]));
            const viewedVehiclesInOrder = viewedIds.map(id => vehicleMap.get(id)).filter((v): v is Vehicle => !!v);
            setRecentlyViewed(viewedVehiclesInOrder.slice(0, 5));
        }
    }, [allVehicles]);

    const handleAiSearch = async () => {
        if (!aiSearchQuery.trim()) return;
        setIsAiSearching(true);
        // Simulate a quick AI processing feel before navigating
        setTimeout(() => {
            onSearch(aiSearchQuery);
            setIsAiSearching(false);
        }, 300);
    };

    return (
        <>
            {/* Hero Section - CarAndBike style */}
            <section className="carandbike-hero">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Find Your Desired Vehicle
                        </h1>
                        <p className="text-xl md:text-2xl mb-8" style={{color: 'rgba(255, 255, 255, 0.9)'}}>
                            BY BRAND • BY BUDGET
                        </p>
                        
                        {/* Search Bar - CarAndBike style */}
                        <div className="max-w-4xl mx-auto">
                            <div className="carandbike-search">
                                <div className="flex flex-col md:flex-row gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Any specific type of car in mind"
                                            value={aiSearchQuery}
                                            onChange={(e) => setAiSearchQuery(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearch(); }}
                                            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border-0 focus:outline-none rounded-md"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAiSearch} 
                                        disabled={isAiSearching}
                                        className="carandbike-button-orange"
                                    >
                                        {isAiSearching ? '...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Category Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Browse by Category</h2>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                         {Object.values(CategoryEnum).map(category => (
                            <button
                                key={category}
                                onClick={() => onSelectCategory(category)}
                                className="group p-6 bg-gray-50 border border-gray-200 rounded-lg text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="text-blue-600 mx-auto mb-3 group-hover:text-blue-700 transition-colors">{categoryIcons[category]}</div>
                                <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{category}</span>
                            </button>
                         ))}
                     </div>
                </div>
            </section>

            {/* Recommended For You */}
            {recommendations.length > 0 && (
                 <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Recommended For You</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recommendations.map(vehicle => (
                                <FeaturedVehicleCard
                                    key={vehicle.id} 
                                    vehicle={vehicle} 
                                    onSelectVehicle={onSelectVehicle} 
                                    onToggleCompare={onToggleCompare} 
                                    comparisonList={comparisonList} 
                                    onToggleWishlist={onToggleWishlist} 
                                    wishlist={wishlist} 
                                    onViewSellerProfile={onViewSellerProfile}
                                    onQuickView={setQuickViewVehicle}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Listings */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Featured Collection</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {featuredVehicles.map(vehicle => (
                            <FeaturedVehicleCard
                                key={vehicle.id} 
                                vehicle={vehicle} 
                                onSelectVehicle={onSelectVehicle} 
                                onToggleCompare={onToggleCompare} 
                                comparisonList={comparisonList} 
                                onToggleWishlist={onToggleWishlist} 
                                wishlist={wishlist} 
                                onViewSellerProfile={onViewSellerProfile}
                                onQuickView={setQuickViewVehicle}
                            />
                        ))}
                    </div>
                     <div className="text-center mt-12">
                        <button onClick={() => onSearch('')} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-brand-blue-dark transition-all transform hover:scale-105">
                            View All Vehicles
                        </button>
                    </div>
                </div>
            </section>

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <section className="py-20 md:py-24 bg-brand-gray-50 dark:bg-brand-gray-dark">
                    <div className="container mx-auto px-4 scroll-animate">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-4xl font-bold text-brand-gray-900 dark:text-white text-left">Recently Viewed Vehicles</h2>
                            <button onClick={() => onNavigate(ViewEnum.WISHLIST)} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-full hover:bg-brand-blue-dark transition-colors whitespace-nowrap">
                                View All
                            </button>
                        </div>
                        <div className="flex overflow-x-auto space-x-6 pb-6 -mx-4 px-4">
                            {recentlyViewed.map(vehicle => (
                                <div key={vehicle.id} className="flex-shrink-0 w-11/12 max-w-xs sm:w-80">
                                    <FeaturedVehicleCard
                                        vehicle={vehicle} 
                                        onSelectVehicle={onSelectVehicle} 
                                        onToggleCompare={onToggleCompare} 
                                        comparisonList={comparisonList} 
                                        onToggleWishlist={onToggleWishlist} 
                                        wishlist={wishlist} 
                                        onViewSellerProfile={onViewSellerProfile}
                                        onQuickView={setQuickViewVehicle}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            
             {/* Seller CTA */}
            <section className="bg-gradient-to-r from-brand-blue-lightest to-brand-gray-100 dark:from-brand-blue/20 dark:via-brand-gray-dark dark:to-brand-gray-darker">
                <div className="container mx-auto px-4 py-20 text-center scroll-animate">
                    <h2 className="text-4xl font-bold mb-4 text-brand-gray-900 dark:text-white">Are You a Seller?</h2>
                    <p className="max-w-2xl mx-auto mb-8 text-brand-gray-600 dark:text-brand-gray-300">Join the most advanced vehicle marketplace today. Reach thousands of buyers and use our AI tools to sell faster.</p>
                     <button onClick={() => onNavigate(ViewEnum.SELLER_LOGIN)} className="bg-white dark:bg-brand-gray-100 text-brand-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-brand-gray-200 dark:hover:bg-white dark:text-brand-blue-darker transition-all transform hover:scale-105">
                        Start Selling Now
                    </button>
                </div>
            </section>
            <QuickViewModal
                vehicle={quickViewVehicle}
                onClose={() => setQuickViewVehicle(null)}
                onSelectVehicle={onSelectVehicle}
                onToggleCompare={onToggleCompare}
                onToggleWishlist={onToggleWishlist}
                comparisonList={comparisonList}
                wishlist={wishlist}
            />
        </>
    );
};

export default Home;