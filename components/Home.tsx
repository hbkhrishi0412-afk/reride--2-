

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
        className="spinny-vehicle-card group cursor-pointer"
      >
        <div className="relative overflow-hidden">
          <img className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} loading="lazy" />
          
          {/* Verified Badge */}
          <div className="absolute top-3 left-3">
            <div className="spinny-verified">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
              Assured
            </div>
          </div>
          
          {/* Wishlist */}
          <div className="absolute top-3 right-3">
            <button
              onClick={handleWishlistClick}
              className="p-2 rounded-full transition-all shadow-lg"
              style={{
                backgroundColor: isInWishlist ? 'var(--spinny-orange)' : 'white',
                color: isInWishlist ? 'white' : 'var(--spinny-text-dark)'
              }}
              onMouseEnter={(e) => !isInWishlist && (e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.1)')}
              onMouseLeave={(e) => !isInWishlist && (e.currentTarget.style.backgroundColor = 'white')}
            >
              <svg className="h-5 w-5" fill={isInWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Details */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-spinny-text-dark mb-2">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-spinny-text-dark mb-3">{vehicle.variant}</p>
          
          {/* Specs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="spinny-feature-pill">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {vehicle.year}
            </span>
            <span className="spinny-feature-pill">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {vehicle.fuelType}
            </span>
            <span className="spinny-feature-pill">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {vehicle.mileage.toLocaleString()} km
            </span>
          </div>
          
          {/* Price */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              <div className="spinny-price">
                ₹{(vehicle.price / 100000).toFixed(2)} Lakh
              </div>
              <div className="text-xs text-spinny-text-dark">
                EMI from ₹{(vehicle.price / 60 / 1000).toFixed(1)}k/month
              </div>
            </div>
            <button 
              onClick={handleQuickViewClick}
              className="font-semibold text-sm flex items-center gap-1 transition-colors"
              style={{ color: '#FF6B35' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--spinny-blue)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--spinny-orange)'}
            >
              View
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
        try {
            // Navigate to vehicle list with the search query
            onSearch(aiSearchQuery);
            setIsAiSearching(false);
        } catch (error) {
            console.error('AI search failed:', error);
            setIsAiSearching(false);
        }
    };

    return (
        <>
            {/* Hero Section */}
            <section className="spinny-hero">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'white' }}>
                        Buy Quality Used Cars
                    </h1>
                    <p className="text-xl mb-8" style={{ color: 'white' }}>
                        200+ Quality Checks • Fixed Price • 5-Day Money Back
                    </p>
                    
                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl p-2 shadow-lg">
                            <div className="flex flex-col md:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by brand, model or budget..."
                                    value={aiSearchQuery}
                                    onChange={(e) => setAiSearchQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearch(); }}
                                    className="flex-1 px-4 py-3 text-spinny-text-dark border-0 focus:outline-none rounded-xl"
                                />
                                <button 
                                    onClick={handleAiSearch}
                                    className="spinny-button-primary px-8"
                                    disabled={isAiSearching}
                                >
                                    {isAiSearching ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-spinny-white border-t-transparent rounded-full animate-spin"></div>
                                            Searching...
                                        </div>
                                    ) : (
                                        'Search'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Trust Badges */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                        <div className="spinny-trust-badge">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#1E88E5' }}>
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                            <span className="font-semibold" style={{ color: 'white' }}>200+ Quality Checks</span>
                        </div>
                        <div className="spinny-trust-badge">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#1E88E5' }}>
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                            </svg>
                            <span className="font-semibold" style={{ color: 'white' }}>Fixed Price</span>
                        </div>
                        <div className="spinny-trust-badge">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#1E88E5' }}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                            <span className="font-semibold" style={{ color: 'white' }}>5-Day Money Back</span>
                        </div>
                        <div className="spinny-trust-badge">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#1E88E5' }}>
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                            </svg>
                            <span className="font-semibold" style={{ color: 'white' }}>Free RC Transfer</span>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Featured Vehicles Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="spinny-section-header" style={{ color: '#1A1A1A' }}>Featured Cars</h2>
                        <button 
                            onClick={() => onNavigate(ViewEnum.USED_CARS)}
                            className="btn-brand-secondary"
                        >
                            View All
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {featuredVehicles.slice(0, 8).map((vehicle) => (
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

            {/* Categories Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="spinny-section-header text-center mb-8" style={{ color: '#1A1A1A' }}>
                        Browse by Category
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Object.values(CategoryEnum).map((category) => (
                            <button
                                key={category}
                                onClick={() => onSelectCategory(category)}
                                className="category-button"
                            >
                                <div className="mb-4" style={{ color: '#1E88E5' }}>
                                    {categoryIcons[category]}
                                </div>
                                <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>
                                    {category.replace('_', ' ')}
                                </h3>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20 animate-float" style={{ background: 'rgba(30, 136, 229, 0.1)' }}></div>
                    <div className="absolute bottom-20 right-20 w-24 h-24 bg-spinny-orange rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
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
                             <p className="text-lg text-spinny-text-dark max-w-2xl mx-auto">
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
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, rgba(30, 136, 229, 0.1), rgba(30, 136, 229, 0.1))' }}></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-spinny-white to-spinny-blue rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
                </section>
            )}

            {/* Featured Listings */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12 text-spinny-text-dark">Featured Collection</h2>
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
                        <button onClick={() => onSearch('')} className="btn-brand-primary text-white font-bold py-3 px-8 rounded-full text-lg transition-all transform hover:scale-105">
                            View All Vehicles
                        </button>
                    </div>
                </div>
            </section>

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <section className="py-20 md:py-24 bg-white dark:bg-white">
                    <div className="container mx-auto px-4 scroll-animate">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-4xl font-bold text-spinny-text-dark dark:text-white text-left">Recently Viewed Vehicles</h2>
                            <button onClick={() => onNavigate(ViewEnum.WISHLIST)} className="btn-brand-primary text-white font-bold py-2 px-6 rounded-full transition-colors whitespace-nowrap">
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
            
            {/* Browse by City Section - NEW FEATURE */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-8 text-spinny-text-dark">Browse by City</h2>
                    <p className="text-center text-gray-600 mb-8">Find quality used cars in your city</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {['Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata'].map(city => {
                            const cityVehicles = allVehicles.filter(v => v.city === city && v.status === 'published');
                            return (
                                <button
                                    key={city}
                                    onClick={() => {
                                        // Navigate to city landing page
                                        onNavigate(ViewEnum.CITY_LANDING as any, { city } as any);
                                    }}
                                    className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all text-center group hover:border-2 hover:border-spinny-orange"
                                >
                                    <h3 className="font-semibold text-gray-900 group-hover:text-spinny-orange transition-colors">{city}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{cityVehicles.length} cars</p>
                                    <p className="text-xs text-spinny-orange font-semibold mt-1">View All →</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
            
             {/* Seller CTA */}
            <section style={{ background: 'linear-gradient(to right, rgba(30, 136, 229, 0.1), var(--brand-gray))' }} className="dark:bg-gradient-dark">
                <div className="container mx-auto px-4 py-20 text-center scroll-animate">
                    <h2 className="text-4xl font-bold mb-4 text-spinny-text-dark dark:text-white">Are You a Seller?</h2>
                    <p className="max-w-2xl mx-auto mb-8 text-brand-gray-600 dark:text-spinny-text-dark">Join the most advanced vehicle marketplace today. Reach thousands of buyers and use our AI tools to sell faster.</p>
                     <button onClick={() => onNavigate(ViewEnum.SELLER_LOGIN)} className="btn-brand-secondary font-bold py-3 px-8 rounded-full text-lg transition-all transform hover:scale-105">
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