import React, { useState } from 'react';
import type { ChatMessage, User } from '../types';

interface ReadReceiptIconProps {
  isRead: boolean;
}

const ReadReceiptIcon: React.FC<ReadReceiptIconProps> = ({ isRead }) => {
    if (isRead) {
        // Double check for "Read"
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1" viewBox="0 0 24 24" fill="none" style={{ color: '#1E88E5' }}>
                <path d="M1.5 12.5L5.5 16.5L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 12.5L12.5 16.5L22.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );
    }
    // Single check for "Sent/Delivered"
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    );
};

export default ReadReceiptIcon;


// --- Reusable Offer Components ---

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

export const OfferModal: React.FC<{
    title: string;
    listingPrice?: number;
    onSubmit: (price: number) => void;
    onClose: () => void;
}> = ({ title, listingPrice, onSubmit, onClose }) => {
    const [price, setPrice] = useState('');
    const [error, setError] = useState('');

    const formatNumberWithCommas = (value: string) => {
        // Remove all non-numeric characters
        const numericValue = value.replace(/\D/g, '');
        // Add commas for Indian number format
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // Remove commas and non-numeric characters for storage
        const numericValue = inputValue.replace(/\D/g, '');
        setPrice(numericValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const offerPrice = parseInt(price, 10);
        if (isNaN(offerPrice) || offerPrice <= 0) {
            setError('Please enter a valid price.');
            return;
        }
        setError('');
        onSubmit(offerPrice);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[101] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-spinny-text-dark dark:text-spinny-text-dark">{title}</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
                        </div>
                        {listingPrice && <p className="text-sm text-spinny-text dark:text-spinny-text mb-4">Listing Price: {formatCurrency(listingPrice)}</p>}
                        <div>
                            <label htmlFor="offer-price" className="block text-sm font-medium mb-1 text-spinny-text-dark dark:text-spinny-text-dark">Your Offer Amount (₹)</label>
                            <input
                                type="text"
                                id="offer-price"
                                value={formatNumberWithCommas(price)}
                                onChange={handlePriceChange}
                                placeholder="Enter amount"
                                style={{ colorScheme: 'light dark' }}
                                autoFocus
                                required
                                className="w-full p-3 border border-gray-200-300 dark:border-gray-200-300 rounded-lg bg-white dark:bg-brand-gray-700 text-lg text-gray-900 dark:text-white focus:outline-none" onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--spinny-orange)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 107, 53, 0.1)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                            />
                        </div>
                        {error && <p className="text-sm text-spinny-orange mt-2">{error}</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 px-6 py-4 flex justify-end rounded-b-xl">
                        <button type="submit" className="px-6 py-2 btn-brand-primary text-white font-bold rounded-lg transition-colors">Submit Offer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const OfferMessage: React.FC<{
    msg: ChatMessage;
    currentUserRole: User['role'];
    listingPrice?: number;
    onRespond: (messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
}> = ({ msg, currentUserRole, listingPrice, onRespond }) => {
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const { offerPrice, counterPrice, status } = msg.payload || {};

    const isRecipient = (currentUserRole === 'customer' && msg.sender === 'seller') || (currentUserRole === 'seller' && msg.sender === 'user');
    const showActions = isRecipient && status === 'pending';
    
    // Additional debug logging
    console.log('🔧 OfferMessage showActions debug:', {
        msgId: msg.id,
        currentUserRole,
        msgSender: msg.sender,
        isRecipient,
        status,
        showActions,
        payload: msg.payload
    });
    
    // Debug logging
    console.log('🔧 OfferMessage debug:', {
        msgId: msg.id,
        msgSender: msg.sender,
        currentUserRole,
        payload: msg.payload,
        status,
        isRecipient,
        showActions,
        msgType: msg.type
    });
    
    const statusInfo = {
        pending: { text: "Pending", color: "bg-spinny-blue-light text-spinny-text-dark dark:bg-spinny-blue/50 dark:text-spinny-text-dark border-gray-200" },
        accepted: { text: "Accepted", color: "bg-spinny-orange-light text-spinny-orange dark:bg-spinny-orange/50 dark:text-spinny-orange border-spinny-orange" },
        rejected: { text: "Rejected", color: "bg-spinny-orange-light text-spinny-orange dark:bg-spinny-orange/50 dark:text-spinny-orange border-spinny-orange" },
        countered: { text: "Countered", color: "bg-white-dark text-spinny-text-dark dark:bg-white dark:text-spinny-text-dark border-gray-500" },
        confirmed: { text: "Confirmed", color: "bg-spinny-orange-light text-spinny-orange dark:bg-spinny-orange/50 dark:text-spinny-orange border-spinny-orange" },
    };

    const handleCounterSubmit = (price: number) => {
        onRespond(msg.id, 'countered', price);
        setIsCounterModalOpen(false);
    };
    
    return (
        <>
            <div className={`p-3 border-l-4 rounded-r-lg bg-spinny-off-white dark:bg-brand-gray-700/50 border-gray-200`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-spinny-text-dark dark:text-spinny-text-dark">{msg.sender === 'user' ? 'Offer Made' : 'Counter-Offer'}</p>
                        <p className="text-xl font-bold text-spinny-text-dark dark:text-white">{formatCurrency(offerPrice || 0)}</p>
                        {counterPrice && (
                            <p className="text-xs text-spinny-text dark:text-gray-300 line-through">
                                Original: {formatCurrency(counterPrice)}
                            </p>
                        )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusInfo[status || 'pending'].color}`}>
                        {statusInfo[status || 'pending'].text}
                    </span>
                </div>
                {showActions && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-300 flex gap-2" style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => onRespond(msg.id, 'accepted')} 
                            className="flex-1 text-sm bg-green-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-green-600 transition-colors"
                            style={{ flex: 1, backgroundColor: '#10B981', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                            Accept
                        </button>
                        <button 
                            onClick={() => onRespond(msg.id, 'rejected')} 
                            className="flex-1 text-sm bg-red-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-600 transition-colors"
                            style={{ flex: 1, backgroundColor: '#EF4444', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                            Reject
                        </button>
                        {currentUserRole === 'seller' && (
                            <button 
                                onClick={() => setIsCounterModalOpen(true)} 
                                className="flex-1 text-sm bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 transition-colors"
                                style={{ flex: 1, backgroundColor: '#3B82F6', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            >
                                Counter
                            </button>
                        )}
                    </div>
                )}
            </div>
            {isCounterModalOpen && (
                <OfferModal
                    title="Make a Counter-Offer"
                    listingPrice={listingPrice}
                    onSubmit={handleCounterSubmit}
                    onClose={() => setIsCounterModalOpen(false)}
                />
            )}
        </>
    );
};