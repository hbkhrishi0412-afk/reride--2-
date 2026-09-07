import React, { memo } from 'react';

// Premium "no image yet" preview card – shown in Live Preview before any photos are uploaded.
// Mirrors the listing card layout but replaces the photo with a beautiful branded hero
// that surfaces Make / Model / Year / Category – giving sellers an aspirational preview.
export const PremiumPreviewPlaceholder: React.FC<{
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
