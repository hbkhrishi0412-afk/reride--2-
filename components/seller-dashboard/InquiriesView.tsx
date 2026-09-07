import { logInfo } from '../../utils/logger.js';
import React, { useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../../types';
import { Pressable } from '../primitives/Pressable';
import { conversationBelongsToSeller } from '../../utils/conversationParticipants';
import { getLastVisibleMessageForViewer } from '../../utils/conversationView';
import { getThreadLastMessagePreview } from '../../utils/messagePreview';

export const InquiriesView: React.FC<{
  conversations: Conversation[];
  sellerEmail: string;
  sellerUserId?: string;
  onMarkConversationAsReadBySeller: (conversationId: string) => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onSelectConv: (conv: Conversation) => void;
  onSetConversationReadState?: (conversationId: string, isRead: boolean) => void;
  onMarkAllAsReadBySeller?: () => void;

}> = memo(({ conversations, sellerEmail, sellerUserId, onMarkConversationAsReadBySeller, onMarkMessagesAsRead, onSelectConv, onSetConversationReadState, onMarkAllAsReadBySeller }) => {
    const { t } = useTranslation();
    const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');

    const handleSelectConversation = (conv: Conversation) => {
      onSelectConv(conv);
      if(!conv.isReadBySeller) {
        onMarkConversationAsReadBySeller(conv.id);
        onMarkMessagesAsRead(conv.id, 'seller');
      }
    };
    
    // Removed unused test drive handlers

    const sortedConversations = useMemo(() => {
        // Filter conversations to only show those for the current seller
        if (!conversations || !Array.isArray(conversations) || !sellerEmail) {
          if (process.env.NODE_ENV === 'development') {
            logInfo('🔍 InquiriesView: No conversations or sellerEmail', {
              conversationsLength: conversations?.length || 0,
              sellerEmail: sellerEmail || 'missing'
            });
          }
          return [];
        }
        
        // Normalize emails for case-insensitive comparison (critical for production)
        const normalizedSellerEmail = (sellerEmail || '').toLowerCase().trim();
        
        if (process.env.NODE_ENV === 'development') {
          logInfo('🔍 InquiriesView: Filtering conversations', {
            totalConversations: conversations.length,
            normalizedSellerEmail,
            conversations: conversations.map(c => ({
              id: c?.id,
              sellerId: c?.sellerId,
              normalizedSellerId: c?.sellerId ? c.sellerId.toLowerCase().trim() : null,
              customerName: c?.customerName,
              vehicleName: c?.vehicleName,
              messageCount: c?.messages?.length || 0
            }))
          });
        }
        
        const sellerConversations = conversations.filter(conv => {
          if (!conv || !conv.sellerId) {
            if (process.env.NODE_ENV === 'development') {
              logInfo('⚠️ InquiriesView: Skipping conversation - missing sellerId', { convId: conv?.id });
            }
            return false;
          }
          return conversationBelongsToSeller(conv, sellerEmail, sellerUserId);
        });
        
        if (process.env.NODE_ENV === 'development') {
          logInfo('✅ InquiriesView: Filtered conversations', {
            matchedCount: sellerConversations.length,
            matchedIds: sellerConversations.map(c => c.id)
          });
        }
        
        const filtered = sellerConversations.filter((conv) => {
          if (filterMode === 'unread') return !conv.isReadBySeller;
          if (filterMode === 'read') return conv.isReadBySeller;
          return true;
        });
        return [...filtered].sort((a, b) => {
          const dateA = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
    }, [conversations, sellerEmail, sellerUserId, filterMode]);

    return (
       <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
         <h2 className="text-2xl font-bold text-reride-text-dark mb-6">{t('sellerDashboard.nav.messages')}</h2>
         <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilterMode('all')} className={`px-3 py-1 rounded-full text-sm ${filterMode === 'all' ? 'bg-reride-orange text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
            <button type="button" onClick={() => setFilterMode('unread')} className={`px-3 py-1 rounded-full text-sm ${filterMode === 'unread' ? 'bg-reride-orange text-white' : 'bg-gray-200 text-gray-700'}`}>Unread</button>
            <button type="button" onClick={() => setFilterMode('read')} className={`px-3 py-1 rounded-full text-sm ${filterMode === 'read' ? 'bg-reride-orange text-white' : 'bg-gray-200 text-gray-700'}`}>Read</button>
            {onMarkAllAsReadBySeller && (
              <button type="button" onClick={onMarkAllAsReadBySeller} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700" aria-label="Mark all conversations as read">Mark all read</button>
            )}
         </div>
         <div className="space-y-2">
            {sortedConversations.length > 0 ? sortedConversations.map(conv => {
              if (!conv) return null;
              const lastVisible = getLastVisibleMessageForViewer(conv, 'seller');
              const snippet = getThreadLastMessagePreview(lastVisible, {
                otherLabel: conv.customerName || '',
                viewer: 'seller',
              });
              const lastLine = `${snippet.prefix}${snippet.text}`;
              const lastMessageTime = conv.lastMessageAt 
                ? new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                : 'N/A';
              return (
              <Pressable
                key={conv.id}
                onPress={() => handleSelectConversation(conv)}
                className="p-4 rounded-lg cursor-pointer hover:bg-brand-gray-light dark:hover:bg-white border-b dark:border-gray-200 flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                    {!conv.isReadBySeller && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF6B35' }}></div>}
                    <div>
                      <p className="font-bold text-reride-text-dark">
                        {conv.customerName || 'Unknown'} - <span className="font-normal text-reride-text-dark">{conv.vehicleName || 'Unknown Vehicle'}</span>
                      </p>
                      <p className="text-sm text-reride-text-dark truncate max-w-md">
                        {lastVisible ? lastLine : snippet.text}
                      </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                  {onSetConversationReadState && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetConversationReadState(conv.id, !conv.isReadBySeller);
                      }}
                      className="text-xs text-gray-500 hover:text-reride-orange"
                      aria-label={conv.isReadBySeller ? 'Mark conversation as unread' : 'Mark conversation as read'}
                    >
                      {conv.isReadBySeller ? 'Mark unread' : 'Mark read'}
                    </button>
                  )}
                  <span className="text-xs text-reride-text-dark">{lastMessageTime}</span>
                </div>
              </Pressable>
            );
            }) : (
                <div className="text-center py-16 px-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-reride-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-semibold text-reride-text-dark">{t('sellerDashboard.messages.emptyTitle')}</h3>
                    <p className="mt-1 text-sm text-reride-text-dark">{t('sellerDashboard.messages.emptyBody')}</p>
                </div>
            )}
         </div>
       </div>
    );
});
