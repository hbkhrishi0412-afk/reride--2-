import React, { useState } from 'react';
import type { ChatMessage, User } from '../types';

interface ReadReceiptIconProps {
  isRead: boolean;
}

const ReadReceiptIcon: React.FC<ReadReceiptIconProps> = ({ isRead }) => {
    if (isRead) {
        // Double check for "Read"
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--brand-gold)' }}>
                <path d="M1.5 12.5L5.5 16.5L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 12.5L12.5 16.5L22.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );
    }
    // Single check for "Sent/Delivered"
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-brand-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="bg-brand-cream dark:bg-brand-gray-dark rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">{title}</h2>
                            <button type="button" onClick={onClose} className="text-brand-gray-400 text-2xl">&times;</button>
                        </div>
                        {listingPrice && <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-4">Listing Price: {formatCurrency(listingPrice)}</p>}
                        <div>
                            <label htmlFor="offer-price" className="block text-sm font-medium mb-1 text-brand-gray-700 dark:text-brand-gray-300">Your Offer Amount (₹)</label>
                            <input
                                type="number"
                                id="offer-price"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                autoFocus
                                required
                                className="w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg bg-brand-cream dark:bg-brand-gray-700 text-lg focus:outline-none" onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-teal)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--brand-teal-light)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                            />
                        </div>
                        {error && <p className="text-sm text-brand-teal mt-2">{error}</p>}
                    </div>
                    <div className="bg-brand-gray-50 dark:bg-brand-gray-darker px-6 py-4 flex justify-end rounded-b-xl">
                        <button type="submit" className="px-6 py-2 btn-brand-primary text-brand-cream font-bold rounded-lg transition-colors">Submit Offer</button>
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
    
    const statusInfo = {
        pending: { text: "Pending", color: "bg-brand-gold-light text-brand-slate dark:bg-brand-gold/50 dark:text-brand-slate border-brand-gold" },
        accepted: { text: "Accepted", color: "bg-brand-teal-light text-brand-teal dark:bg-brand-teal/50 dark:text-brand-teal border-brand-teal" },
        rejected: { text: "Rejected", color: "bg-brand-teal-light text-brand-teal dark:bg-brand-teal/50 dark:text-brand-teal border-brand-teal" },
        countered: { text: "Countered", color: "bg-brand-cream-dark text-brand-slate dark:bg-brand-cream dark:text-brand-slate border-gray-500" },
        confirmed: { text: "Confirmed", color: "bg-brand-teal-light text-brand-teal dark:bg-brand-teal/50 dark:text-brand-teal border-brand-teal" },
    };

    const handleCounterSubmit = (price: number) => {
        onRespond(msg.id, 'countered', price);
        setIsCounterModalOpen(false);
    };
    
    return (
        <>
            <div className={`p-3 border-l-4 rounded-r-lg bg-brand-gray-100 dark:bg-brand-gray-700/50 ${statusInfo[status || 'pending'].color.split(' ')[2]}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-100">{msg.sender === 'user' ? 'Offer Made' : 'Counter-Offer'}</p>
                        <p className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-50">{formatCurrency(offerPrice || 0)}</p>
                        {counterPrice && (
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 line-through">
                                Original: {formatCurrency(counterPrice)}
                            </p>
                        )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusInfo[status || 'pending'].color.split(' ')[0]} ${statusInfo[status || 'pending'].color.split(' ')[1]}`}>
                        {statusInfo[status || 'pending'].text}
                    </span>
                </div>
                {showActions && (
                    <div className="mt-3 pt-3 border-t border-brand-gray-200 dark:border-brand-gray-600 flex gap-2">
                        <button onClick={() => onRespond(msg.id, 'accepted')} className="flex-1 text-sm bg-brand-teal-light0 text-brand-cream font-bold py-1.5 px-3 rounded-md hover:bg-brand-teal transition-colors">Accept</button>
                        <button onClick={() => onRespond(msg.id, 'rejected')} className="flex-1 text-sm bg-brand-teal-light0 text-brand-cream font-bold py-1.5 px-3 rounded-md hover:bg-brand-teal transition-colors">Reject</button>
                        {currentUserRole === 'seller' && (
                            <button onClick={() => setIsCounterModalOpen(true)} className="flex-1 text-sm bg-brand-cream text-brand-cream font-bold py-1.5 px-3 rounded-md hover:bg-brand-cream transition-colors">Counter</button>
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