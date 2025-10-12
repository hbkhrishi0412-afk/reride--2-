import React, { useState } from 'react';
import type { Vehicle } from '../types';
import { trackShare } from '../services/listingService';

interface ShareButtonsProps {
  vehicle: Vehicle;
  className?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ vehicle, className = '' }) => {
  const [copyStatus, setCopyStatus] = useState('Copy Link');

  const shareUrl = window.location.href;
  const shareText = `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for ₹${vehicle.price.toLocaleString('en-IN')} on ReRide!`;

  const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);
    let targetUrl = '';

    switch (platform) {
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        targetUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
    }

    trackShare(vehicle.id, platform);
    window.open(targetUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShare(vehicle.id, 'copy');
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy Link'), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        trackShare(vehicle.id, 'copy');
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Link'), 2000);
      } catch (err) {
        setCopyStatus('Failed!');
        setTimeout(() => setCopyStatus('Copy Link'), 2000);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={`${className}`}>
      <h4 className="text-sm font-semibold text-center text-brand-gray-600 dark:text-spinny-text mb-3">
        Share this listing
      </h4>
      <div className="flex justify-center items-center gap-3 flex-wrap">
        {/* Facebook */}
        <button
          onClick={() => handleShare('facebook')}
          aria-label="Share on Facebook"
          className="p-2 rounded-full text-white transition-all shadow-lg bg-spinny-orange hover:bg-spinny-orange-hover"
          title="Share on Facebook"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
          </svg>
        </button>

        {/* Twitter */}
        <button
          onClick={() => handleShare('twitter')}
          aria-label="Share on Twitter"
          className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg"
          title="Share on Twitter"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.54-.18-6.69-1.87-8.8-4.46-.37.63-.58 1.37-.58 2.15 0 1.49.76 2.81 1.91 3.58-.7-.02-1.36-.21-1.94-.53v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21c7.34 0 11.35-6.08 11.35-11.35 0-.17 0-.34-.01-.51.78-.57 1.45-1.28 1.99-2.08z" />
          </svg>
        </button>

        {/* WhatsApp */}
        <button
          onClick={() => handleShare('whatsapp')}
          aria-label="Share on WhatsApp"
          className="p-2 rounded-full bg-[#25D366] text-white hover:bg-[#20BA5A] transition-all shadow-lg"
          title="Share on WhatsApp"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23zm4.52-6.2c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14 0-.3 0-.47 0-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.05-.11-.2-.16-.44-.28z" />
          </svg>
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 text-sm font-semibold bg-spinny-light-gray dark:bg-brand-gray-700 text-spinny-text-dark dark:text-brand-gray-200 px-3 py-2 rounded-full hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-all shadow-lg"
          title="Copy link"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
          <span>{copyStatus}</span>
        </button>
      </div>
    </div>
  );
};

export default ShareButtons;

