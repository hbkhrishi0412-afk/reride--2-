

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
        className="cb-vehicle-card group cursor-pointer"
      >
        <div className="relative overflow-hidden">
          <img className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} loading="lazy" />
          
          {/* EV Badge for Electric Vehicles */}
          {vehicle.fuelType.toLowerCase().includes('electric') && (
            <div className="cb-ev-badge">EV</div>
          )}
          
          {/* Wishlist Button */}
          <div className="absolute top-3 right-3">
              <button
                onClick={handleWishlistClick}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isInWishlist 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                }`}
                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isInWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                </svg>
              </button>
          </div>
        </div>
        
        {/* Vehicle Details */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-black mb-2">{vehicle.make} {vehicle.model}</h3>
          
          {/* Variants Link */}
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="cb-variants-link">
            +2 Variants
          </a>
          
          {/* Feature Badges */}
          <div className="flex gap-2 mt-4 mb-4">
            <div className="cb-feature-badge">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              {vehicle.fuelType}
            </div>
            <div className="cb-feature-badge">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {vehicle.transmission}
            </div>
            <div className="cb-feature-badge">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              {vehicle.seatingCapacity || '5'} Seater
            </div>
          </div>
        </div>
        
        {/* Pricing Section */}
        <div className="cb-price-section">
          <div className="cb-price-range">* Ex-Showroom</div>
          <div className="cb-price-amount">₹ {vehicle.price.toLocaleString('en-IN')}</div>
          <div className="cb-emi-info">EMI starts at ₹ {(vehicle.price / 60).toLocaleString('en-IN')}</div>
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
            {/* CarAndBike Style Main Content */}
            <main className="bg-white">
                {/* Main Heading */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-black mb-8">Newly Launched Cars</h1>
                    
                    {/* Horizontal Scrollable Vehicle Grid */}
                    <div className="flex gap-6 overflow-x-auto pb-4" style={{scrollbarWidth: 'thin'}}>
                        {featuredVehicles.slice(0, 8).map((vehicle, index) => (
                            <div key={vehicle.id} className="flex-shrink-0">
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
            </main>
            
            {/* Premium Category Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="text-center mb-16 animate-fadeInUp">
                         <h2 className="text-3xl md:text-4xl font-bold mb-4 premium-text-gradient">
                             Explore by Category
                         </h2>
                         <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                             Find your perfect vehicle across different categories
                         </p>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                         {Object.values(CategoryEnum).map((category, index) => (
                            <button
                                key={category}
                                onClick={() => onSelectCategory(category)}
                                className="group premium-card p-8 text-center animate-fadeInUp"
                                style={{animationDelay: `${index * 0.1}s`}}
                            >
                                <div className="mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                                        {categoryIcons[category]}
                                    </div>
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors text-sm">
                                    {category}
                                </span>
                                <div className="mt-2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                         ))}
                     </div>
                </div>
                
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-float"></div>
                    <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-100 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
                </div>
            </section>

            {/* Premium Recommended Section */}
            {recommendations.length > 0 && (
                 <section className="py-20 bg-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 animate-fadeInUp">
                             <h2 className="text-3xl md:text-4xl font-bold mb-4 premium-text-gradient">
                                 Recommended For You
                             </h2>
                             <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                 Handpicked vehicles based on your preferences and market trends
                             </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {recommendations.map((vehicle, index) => (
                                <div 
                                    key={vehicle.id}
                                    className="animate-fadeInUp"
                                    style={{animationDelay: `${index * 0.1}s`}}
                                >
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
                    
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
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