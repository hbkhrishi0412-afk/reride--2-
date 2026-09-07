import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Conversation, Notification, User } from '../types';
import { CLIENT_POLL_INTERVALS_MS } from '../utils/clientPolling.js';
import { saveConversations } from '../services/chatService';
import { realtimeChatService, type ChatEphemeralThreadMeta } from '../services/realtimeChatService';
import * as buyerService from '../services/buyerService';
import { persistReRideNotifications } from '../utils/notificationLocalStorage';
import {
  conversationBelongsToCustomer,
  conversationBelongsToSeller,
} from '../utils/conversationParticipants';
import {
  mergeConversationMessagesForRealtime,
  mergeConversationLists,
} from '../components/AppProvider/helpers';
import { logInfo, logWarn, logError, logDebug } from '../utils/logger';

type TypingStatus = { conversationId: string; userRole: 'customer' | 'seller' } | null;

export type UseRealtimeChatRuntimeArgs = {
  currentUser: User | null;
  conversations: Conversation[];
  activeChat: Conversation | null;
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  setActiveChat: Dispatch<SetStateAction<Conversation | null>>;
  setTypingStatus: Dispatch<SetStateAction<TypingStatus>>;
  setChatPeerOnlineByConversationId: Dispatch<SetStateAction<Record<string, boolean>>>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
};

/**
 * Realtime chat connect/handlers, ephemeral channels, buyer activity load,
 * and conversation polling sync (extracted from AppProvider).
 */
export function useRealtimeChatRuntime(args: UseRealtimeChatRuntimeArgs) {
  const {
    currentUser,
    conversations,
    activeChat,
    setConversations,
    setActiveChat,
    setTypingStatus,
    setChatPeerOnlineByConversationId,
    setNotifications,
  } = args;

  // Helper function to join all relevant conversation rooms
  const joinAllConversationRooms = useCallback(() => {
    if (!currentUser || !realtimeChatService.isConnected()) {
      return;
    }
    
    const currentUserEmail = currentUser.email;
    const currentUserRole = currentUser.role as 'customer' | 'seller';
    
    // Collect all conversation IDs user is part of
    const conversationIds: string[] = [];
    conversations.forEach(conv => {
      if (!conv) return;
      const isParticipant =
        currentUserRole === 'customer'
          ? conversationBelongsToCustomer(conv, currentUserEmail, currentUser.id)
          : conversationBelongsToSeller(conv, currentUserEmail, currentUser.id);

      if (isParticipant) {
        conversationIds.push(conv.id);
      }
    });
    
    // Join all conversations at once
    if (conversationIds.length > 0) {
      logInfo('🔧 Joining conversation rooms:', { count: conversationIds.length, conversationIds });
      realtimeChatService.joinAllConversations(conversationIds);
      if (process.env.NODE_ENV === 'development') {
        logDebug(`🔧 Auto-subscribed to ${conversationIds.length} conversation(s)`);
      }
    }
  }, [currentUser, conversations]);

  // Supabase broadcast + presence for typing/online when Socket.io is off (production).
  useEffect(() => {
    if (!currentUser?.email || (currentUser.role !== 'seller' && currentUser.role !== 'customer')) {
      setChatPeerOnlineByConversationId({});
      realtimeChatService.syncChatEphemeralChannels([], '', 'customer');
      return;
    }
    const email = currentUser.email.toLowerCase().trim();
    const role = currentUser.role === 'seller' ? 'seller' : 'customer';
    const metas: ChatEphemeralThreadMeta[] = conversations
      .filter((c): c is Conversation => Boolean(c?.id))
      .map((c) => {
        const cid = String(c.customerId || '')
          .toLowerCase()
          .trim();
        const sid = String(c.sellerId || '')
          .toLowerCase()
          .trim();
        if (!cid || !sid) return null;
        const counterpartEmail = role === 'customer' ? sid : cid;
        return { conversationId: String(c.id), counterpartEmail };
      })
      .filter((m): m is ChatEphemeralThreadMeta => m != null);

    realtimeChatService.syncChatEphemeralChannels(metas, email, role);
  }, [currentUser?.email, currentUser?.role, conversations]);

  // Load buyer activity from database on customer login
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') {
      return;
    }

    const loadBuyerActivity = async () => {
      try {
        const activity = await buyerService.getBuyerActivity(currentUser.email);
        // Activity is automatically saved to localStorage by getBuyerActivity
        if (process.env.NODE_ENV === 'development') {
          logInfo('✅ Buyer activity loaded from database:', {
            userId: activity.userId,
            recentlyViewedCount: activity.recentlyViewed.length,
            savedSearchesCount: activity.savedSearches.length
          });
        }
      } catch (error) {
        logWarn('Failed to load buyer activity from database:', error);
        // Continue with localStorage fallback (handled by getBuyerActivity)
      }
    };

    loadBuyerActivity();
  }, [currentUser]);

  // Real-time Chat Service Integration (end-to-end chat for buyers and sellers)
  useEffect(() => {
    if (!currentUser) {
      realtimeChatService.disconnect();
      return;
    }

    const userEmail = currentUser.email;
    const userRole = currentUser.role as 'customer' | 'seller';

    // Connect to real-time chat service
    logInfo('🔧 AppProvider: Connecting to real-time chat service...', { userEmail, userRole });
    realtimeChatService.connect(userEmail, userRole).then((connected) => {
      if (connected) {
        logInfo('✅ Real-time chat service connected successfully');
      } else {
        // Only show warning if connection actually failed (not just "not available")
        // The service now returns true even if WebSocket isn't available (messages still work)
        logInfo('ℹ️ Real-time chat: Using fallback mode (messages still work via API)');
      }
    }).catch((error) => {
      // Don't show error toast - messages still work via API
      logWarn('⚠️ Real-time chat connection issue (non-critical):', error);
      // Messages will still work via Supabase API, just not real-time
    });
    
    // Setup connection status callback - only log, don't show error toasts
    // Messages still work via API even if real-time connection fails
    realtimeChatService.onConnection((connected) => {
      if (connected) {
        logInfo('✅ Real-time chat connection established');
      } else {
        // Don't show error - messages still work via API
        logInfo('ℹ️ Real-time chat disconnected (messages still work via API)');
      }
    });

    // Setup message received callback
    realtimeChatService.onMessage((conversationId, message, conversationData) => {
      logInfo('📨 AppProvider: Received real-time message:', { 
        conversationId, 
        messageId: message.id, 
        sender: message.sender,
        hasConversationData: !!conversationData
      });
      
      // Update conversations state with new message
      setConversations(prev => {
        const existingConv = prev.find(c => c.id === conversationId);
        if (existingConv) {
          // Check if message already exists (prevent duplicates)
          const messageExists = existingConv.messages.some(m => m.id === message.id);
          if (messageExists) {
            logInfo('⚠️ Message already exists, skipping duplicate:', message.id);
            return prev; // Message already exists, no update needed
          }
          
          // Update conversation with new message
          const updated = prev.map(conv => 
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  lastMessageAt: message.timestamp,
                  isReadBySeller: message.sender === 'seller' ? true : (message.sender === 'user' ? false : conv.isReadBySeller),
                  isReadByCustomer: message.sender === 'user' ? true : (message.sender === 'seller' ? false : conv.isReadByCustomer)
                }
              : conv
          );
          
          // Update activeChat if it's the same conversation
          if (activeChat?.id === conversationId) {
            const updatedConv = updated.find(c => c.id === conversationId);
            if (updatedConv) {
              setActiveChat(updatedConv);
            }
          }
          
          // Save to localStorage
          try {
            saveConversations(updated);
          } catch (error) {
            logError('Failed to save conversations to localStorage:', error);
          }
          
          logInfo('✅ Message added to conversation:', { conversationId, messageId: message.id });
          return updated;
        } else {
          // Conversation doesn't exist in state - try to add it using conversationData from WebSocket
          logWarn('⚠️ Received message for conversation not in state:', {
            conversationId,
            messageId: message.id,
            sender: message.sender,
            currentConversations: prev.length,
            hasConversationData: !!conversationData
          });
          
          // If we have conversation data from WebSocket, use it to create the conversation in state
          if (conversationData && conversationData.id) {
            // sellerName may be in conversationData but not in Conversation type
            const sellerName = (conversationData as any).sellerName;
            const newConversation: Conversation = {
              id: conversationData.id,
              customerId: conversationData.customerId ? conversationData.customerId.toLowerCase().trim() : '',
              customerName: conversationData.customerName || 'Customer',
              sellerId: conversationData.sellerId ? conversationData.sellerId.toLowerCase().trim() : '',
              vehicleId: conversationData.vehicleId || 0,
              vehicleName: conversationData.vehicleName || 'Vehicle',
              vehiclePrice: conversationData.vehiclePrice,
              messages: [message],
              lastMessageAt: message.timestamp,
              isReadBySeller: message.sender === 'seller' ? true : (message.sender === 'user' ? false : false),
              isReadByCustomer: message.sender === 'user' ? true : (message.sender === 'seller' ? false : false),
              isFlagged: false
            };
            
            logInfo('✅ Adding conversation to state from WebSocket data:', {
              conversationId,
              customerName: newConversation.customerName,
              sellerName: sellerName || 'N/A',
              vehicleName: newConversation.vehicleName
            });
            
            // Update activeChat if this is the active conversation
            if (activeChat?.id === conversationId) {
              setActiveChat(newConversation);
            }
            
            // Save to localStorage
            try {
              const updated = [...prev, newConversation];
              saveConversations(updated);
            } catch (error) {
              logError('Failed to save conversations to localStorage:', error);
            }
            
            return [...prev, newConversation];
          }
          
          // Fallback: Try to load conversation from database
          // CRITICAL: For sellers, we need to ensure they see conversations even if not in their initial load
          logInfo('🔄 Attempting to load conversation from database:', conversationId);
          (async () => {
            try {
              const { getConversationsFromSupabase } = await import('../services/conversationService');
              const { supabaseConversationService } = await import('../services/supabase-conversation-service');
              const currentUserEmail = currentUser?.email;
              const currentUserRole = currentUser?.role;
              
              if (!currentUserEmail || !currentUserRole) {
                logWarn('⚠️ Cannot load conversation: missing user info');
                return;
              }
              
              // Prefer API list first: server hydrates users.id → email for seller/customer matching
              let foundConv: Conversation | null = null;
              const bulkResult = currentUserRole === 'seller'
                ? await getConversationsFromSupabase(undefined, currentUserEmail)
                : currentUserRole === 'customer'
                ? await getConversationsFromSupabase(currentUserEmail)
                : await getConversationsFromSupabase();

              if (bulkResult.success && bulkResult.data) {
                foundConv = bulkResult.data.find((c) => c.id === conversationId) || null;
              }

              if (!foundConv) {
                try {
                  foundConv = await supabaseConversationService.findById(conversationId);
                  logInfo('🔍 Direct Supabase conversation lookup result:', {
                    found: !!foundConv,
                    conversationId,
                    sellerId: foundConv?.sellerId,
                    currentUserEmail,
                    role: currentUserRole,
                  });
                } catch (error) {
                  logWarn('⚠️ Direct lookup failed:', error);
                }
              }
              
              if (foundConv) {
                // CRITICAL: For sellers, verify this conversation belongs to them
                if (currentUserRole === 'seller') {
                  const normalizedSellerEmail = (currentUserEmail || '').toLowerCase().trim();
                  const normalizedConvSellerId = (foundConv.sellerId || '').toLowerCase().trim();
                  if (normalizedConvSellerId !== normalizedSellerEmail) {
                    logWarn('⚠️ Conversation sellerId mismatch:', {
                      conversationId,
                      convSellerId: foundConv.sellerId,
                      currentUserEmail,
                      normalizedConvSellerId,
                      normalizedSellerEmail
                    });
                    // Still add it - might be a case sensitivity issue
                  }
                }
                
                // Check if message already exists
                const messageExists = foundConv.messages.some(m => m.id === message.id);
                const updatedConv = {
                  ...foundConv,
                  messages: messageExists ? foundConv.messages : [...(foundConv.messages || []), message],
                  lastMessageAt: message.timestamp,
                  isReadBySeller: message.sender === 'seller' ? true : foundConv.isReadBySeller,
                  isReadByCustomer: message.sender === 'user' ? true : foundConv.isReadByCustomer
                };
                
                setConversations(prevState => {
                  // Check if it was added while we were loading
                  const alreadyExists = prevState.find(c => c.id === conversationId);
                  if (alreadyExists) {
                    // Update existing - ensure message is included
                    const existingConv = prevState.find(c => c.id === conversationId);
                    const hasMessage = existingConv?.messages.some(m => m.id === message.id);
                    if (hasMessage) {
                      logInfo('✅ Message already in conversation, skipping update');
                      return prevState;
                    }
                    // Update existing conversation with new message
                    const updated = prevState.map(conv => 
                      conv.id === conversationId ? updatedConv : conv
                    );
                    try {
                      saveConversations(updated);
                    } catch (error) {
                      logError('Failed to save conversations to localStorage:', error);
                    }
                    return updated;
                  }
                  // Add new conversation to seller's inbox
                  logInfo('✅ Adding conversation to seller inbox:', {
                    conversationId,
                    sellerId: updatedConv.sellerId,
                    customerName: updatedConv.customerName,
                    vehicleName: updatedConv.vehicleName
                  });
                  const updated = [...prevState, updatedConv];
                  try {
                    saveConversations(updated);
                  } catch (error) {
                    logError('Failed to save conversations to localStorage:', error);
                  }
                  return updated;
                });
                
                // Update activeChat if this is the active conversation
                if (activeChat?.id === conversationId) {
                  setActiveChat(updatedConv);
                }
                
                logInfo('✅ Loaded and added conversation from database:', conversationId);
              } else {
                logError('❌ Conversation not found in database:', {
                  conversationId,
                  currentUserEmail,
                  currentUserRole,
                  searchedBySeller: currentUserRole === 'seller'
                });
                // For sellers, this might mean the conversation wasn't saved properly
                // or the sellerId doesn't match - log for debugging
              }
            } catch (error) {
              logError('❌ Failed to load conversation from database:', error);
            }
          })();
          
          // Return previous state for now - will be updated when conversation loads
          return prev;
        }
      });
    });

    // Setup typing status callback
    realtimeChatService.onTyping((typingStatus) => {
      if (typingStatus.isTyping) {
        setTypingStatus({
          conversationId: typingStatus.conversationId,
          userRole: typingStatus.userRole,
        });
      } else {
        setTypingStatus((prev) =>
          prev?.conversationId === typingStatus.conversationId &&
          prev?.userRole === typingStatus.userRole
            ? null
            : prev,
        );
      }
    });

    // Setup connection status callback (auto-subscribe on connect)
    realtimeChatService.onConnection((connected) => {
      if (process.env.NODE_ENV === 'development') {
        logDebug(connected ? '✅ Real-time chat connected' : '⚠️ Real-time chat disconnected');
      }
      
      // When connected, automatically join ALL conversation rooms
      if (connected) {
        // Add a small delay to ensure socket is fully ready
        setTimeout(() => {
          joinAllConversationRooms();
        }, 120);
      }
    });

    // Setup presence callback (track online/offline status for chat header)
    realtimeChatService.onPresence((presence) => {
      if (process.env.NODE_ENV === 'development') {
        logDebug(`👤 Presence update: ${presence.userEmail} is ${presence.isOnline ? 'online' : 'offline'}`);
      }
      if (!presence.conversationId || !presence.userEmail) return;
      setChatPeerOnlineByConversationId((prev) => ({
        ...prev,
        [presence.conversationId]: presence.isOnline,
      }));
    });

    // Setup read receipt callback (remote: mark listed message ids as read by recipient)
    realtimeChatService.onRead((conversationId, messageIds, _readBy) => {
      const idSet = new Set(messageIds.map(String));
      setConversations((prev) => {
        const next = prev.map((conv) => {
          if (String(conv.id) !== String(conversationId)) return conv;
          const updatedMessages = (conv.messages || []).map((msg) =>
            idSet.has(String(msg.id)) ? { ...msg, isRead: true } : msg,
          );
          return { ...conv, messages: updatedMessages };
        });
        try {
          saveConversations(next);
        } catch (e) {
          logWarn('saveConversations after read receipt failed', e);
        }
        return next;
      });
      setActiveChat((prev) => {
        if (!prev || String(prev.id) !== String(conversationId)) return prev;
        const updatedMessages = (prev.messages || []).map((msg) =>
          idSet.has(String(msg.id)) ? { ...msg, isRead: true } : msg,
        );
        return { ...prev, messages: updatedMessages };
      });
    });

    // Setup notification received callback for real-time notifications
    realtimeChatService.onNotification((notification) => {
      // CRITICAL FIX: Normalize recipient email for comparison
      const normalizedNotificationRecipient = (notification.recipientEmail || '').toLowerCase().trim();
      const normalizedCurrentUserEmail = (currentUser?.email || '').toLowerCase().trim();

      // Not signed in: never accept (empty === empty would wrongly match missing recipientEmail)
      if (!normalizedCurrentUserEmail) {
        return;
      }

      // Only add notification if it's for the current user
      if (normalizedNotificationRecipient === normalizedCurrentUserEmail) {
        logInfo('📬 AppProvider: Received real-time notification:', { 
          notificationId: notification.id, 
          recipientEmail: notification.recipientEmail 
        });
        
        setNotifications(prevNotifications => {
          // Check if notification already exists (prevent duplicates)
          const exists = prevNotifications.some(n => n.id === notification.id);
          if (exists) {
            logInfo('⚠️ Notification already exists, skipping duplicate:', notification.id);
            return prevNotifications;
          }
          
          const updatedNotifications = [notification, ...prevNotifications];
          
          // Save to localStorage
          try {
            persistReRideNotifications(updatedNotifications);
          } catch (error) {
            logError('Failed to save notifications to localStorage:', error);
          }
          
          logInfo('✅ Real-time notification added to state:', notification.id);
          return updatedNotifications;
        });
      } else {
        logInfo('⚠️ Notification not for current user, ignoring:', {
          notificationRecipient: notification.recipientEmail,
          currentUserEmail: currentUser?.email
        });
      }
    });
  }, [currentUser, joinAllConversationRooms, activeChat]);

  // Also join rooms when conversations are loaded/updated
  useEffect(() => {
    if (realtimeChatService.isConnected() && conversations.length > 0 && currentUser) {
      const timeoutId = setTimeout(() => {
        joinAllConversationRooms();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [conversations.length, currentUser?.email, joinAllConversationRooms]);

  // CRITICAL: Periodically refresh conversations for sellers to catch new ones
  // This ensures sellers see new conversations even if WebSocket delivery fails
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'seller' || !currentUser.email) return;
    
    const normalizedSellerEmail = currentUser.email.toLowerCase().trim();
    let sellerPollInFlight = false;
    
    // Load conversations immediately when seller logs in
    const loadSellerConversations = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (sellerPollInFlight) return;
      sellerPollInFlight = true;
      try {
        const { getConversationsFromSupabase } = await import('../services/conversationService');
        
        // CRITICAL: Use normalized email for query, but also try original email as fallback
        const result = await getConversationsFromSupabase(undefined, normalizedSellerEmail);
        
        if (process.env.NODE_ENV === 'development') {
          logInfo('🔍 Loading seller conversations:', {
            sellerEmail: currentUser.email,
            normalizedSellerEmail,
            resultSuccess: result.success,
            conversationCount: result.data?.length || 0
          });
        }
        
        if (result.success && result.data) {
          const normalizedConversations = result.data.map(conv => ({
            ...conv,
            sellerId: conv.sellerId ? conv.sellerId.toLowerCase().trim() : conv.sellerId,
            customerId: conv.customerId ? conv.customerId.toLowerCase().trim() : conv.customerId
          }));

          setConversations((prev) => {
            const merged = mergeConversationLists(prev, normalizedConversations);
            try {
              saveConversations(merged);
            } catch (error) {
              logError('Failed to save refreshed conversations:', error);
            }
            return merged;
          });
        } else if (process.env.NODE_ENV === 'development') {
          logWarn('⚠️ Failed to load seller conversations:', {
            success: result.success,
            error: result.error,
            sellerEmail: normalizedSellerEmail
          });
        }
      } catch (error) {
        logWarn('⚠️ Failed to refresh seller conversations:', error);
        if (process.env.NODE_ENV === 'development') {
          logError('Error details:', error);
        }
      } finally {
        sellerPollInFlight = false;
      }
    };
    
    // Load immediately
    loadSellerConversations();
    
    // Fallback sync if Realtime/WebSocket misses an update (30s — avoids API rate limits)
    const refreshInterval = setInterval(loadSellerConversations, CLIENT_POLL_INTERVALS_MS.sellerConversations);
    
    return () => clearInterval(refreshInterval);
  }, [currentUser?.email, currentUser?.role, currentUser?.id]);

  // Customers: poll API so seller replies appear even when Realtime RLS blocks postgres_changes
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer' || !currentUser.email) {
      return;
    }
    const normalizedCustomerEmail = currentUser.email.toLowerCase().trim();
    let customerPollInFlight = false;

    const loadCustomerConversations = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (customerPollInFlight) return;
      customerPollInFlight = true;
      try {
        const { getConversationsFromSupabase } = await import('../services/conversationService');
        const result = await getConversationsFromSupabase(normalizedCustomerEmail);
        if (!result.success || !result.data) {
          return;
        }
        const normalizedConversations = result.data.map((conv) => ({
          ...conv,
          sellerId: conv.sellerId ? conv.sellerId.toLowerCase().trim() : conv.sellerId,
          customerId: conv.customerId ? conv.customerId.toLowerCase().trim() : conv.customerId,
        }));
        setConversations((prev) => {
          const merged = mergeConversationLists(prev, normalizedConversations);
          try {
            saveConversations(merged);
          } catch (_) {
            /* ignore */
          }
          return merged;
        });
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          logWarn('Failed to refresh customer conversations:', e);
        }
      } finally {
        customerPollInFlight = false;
      }
    };

    loadCustomerConversations();
    const interval = setInterval(loadCustomerConversations, CLIENT_POLL_INTERVALS_MS.customerConversations);
    return () => clearInterval(interval);
  }, [currentUser?.email, currentUser?.role]);

  // Keep activeChat in sync with the conversations array so polling updates appear instantly.
  useEffect(() => {
    if (!activeChat?.id) return;
    const match = conversations.find((c) => c && String(c.id) === String(activeChat.id));
    if (!match) return;
    const localLen = activeChat.messages?.length ?? 0;
    const matchLen = match.messages?.length ?? 0;
    // Never replace open chat with fewer messages (dev API returns empty until Supabase is wired).
    if (matchLen < localLen) {
      return;
    }
    if (
      matchLen > localLen ||
      match.lastMessageAt !== activeChat.lastMessageAt ||
      match.isReadBySeller !== activeChat.isReadBySeller ||
      match.isReadByCustomer !== activeChat.isReadByCustomer
    ) {
      setActiveChat(match);
    }
  }, [conversations, activeChat?.id]);

  // While a thread is open, poll that conversation directly (fast path; bypasses bulk list + queue backlog).
  useEffect(() => {
    const convId = activeChat?.id;
    if (!convId || !currentUser?.email) {
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const syncOpenThread = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const { getConversationByIdFromSupabase } = await import('../services/conversationService');
        const result = await getConversationByIdFromSupabase(String(convId));
        if (cancelled || !result.success || !result.data) {
          return;
        }
        const fresh = result.data;

        setConversations((prev) => {
          const idx = prev.findIndex((c) => c && String(c.id) === String(convId));
          const existing = idx >= 0 ? prev[idx] : null;
          const mergedMsgs = existing
            ? mergeConversationMessagesForRealtime(existing.messages || [], fresh.messages || [])
            : mergeConversationMessagesForRealtime([], fresh.messages || []);
          const merged: Conversation = {
            ...fresh,
            messages: mergedMsgs,
          };
          if (existing) {
            const prevLen = existing.messages?.length ?? 0;
            if (mergedMsgs.length === prevLen && merged.lastMessageAt === existing.lastMessageAt) {
              return prev;
            }
          }
          const next =
            idx >= 0 ? prev.map((c, i) => (i === idx ? merged : c)) : [...prev, merged];
          try {
            saveConversations(next);
          } catch {
            /* ignore */
          }
          return next;
        });

        setActiveChat((ac) => {
          if (!ac || String(ac.id) !== String(convId)) {
            return ac;
          }
          const mergedMsgs = mergeConversationMessagesForRealtime(ac.messages || [], fresh.messages || []);
          const prevLen = ac.messages?.length ?? 0;
          if (mergedMsgs.length === prevLen && fresh.lastMessageAt === ac.lastMessageAt) {
            return ac;
          }
          return { ...fresh, messages: mergedMsgs };
        });
      } finally {
        inFlight = false;
      }
    };

    void syncOpenThread();
    const interval = setInterval(syncOpenThread, CLIENT_POLL_INTERVALS_MS.openChatSync);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeChat?.id, currentUser?.email]);

  // CRITICAL: Periodically refresh notifications for all users
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;
    
    const normalizedUserEmail = currentUser.email.toLowerCase().trim();
    
    // Load notifications immediately
    const loadNotifications = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const { getNotificationsFromSupabase } = await import('../services/notificationService');
        const result = await getNotificationsFromSupabase(normalizedUserEmail);
        
        if (result.success && result.data) {
          setNotifications(prev => {
            const prevIds = new Set(prev.map(n => n.id));
            const hasNewNotifications = result.data!.some(n => !prevIds.has(n.id));
            const hasUpdatedNotifications = result.data!.some(newNotif => {
              const oldNotif = prev.find(n => n.id === newNotif.id);
              return oldNotif && oldNotif.isRead !== newNotif.isRead;
            });
            
            if (hasNewNotifications || hasUpdatedNotifications || prev.length === 0) {
              logInfo('🔄 Refreshing notifications:', {
                newCount: result.data!.length,
                hasNew: hasNewNotifications,
                hasUpdated: hasUpdatedNotifications
              });
              try {
                persistReRideNotifications(result.data!);
              } catch (error) {
                logWarn('Failed to save notifications:', error);
              }
              return result.data!;
            }
            
            return prev;
          });
        }
      } catch (error) {
        logWarn('⚠️ Failed to refresh notifications:', error);
      }
    };
    
    // Load immediately
    loadNotifications();
    
    // Refresh periodically (45s — dashboard polling must not exhaust API rate limits)
    const refreshInterval = setInterval(loadNotifications, CLIENT_POLL_INTERVALS_MS.notifications);
    
    return () => clearInterval(refreshInterval);
  }, [currentUser?.email]);

  // CRITICAL: Join conversation room when activeChat changes (user opens a chat)
  // This ensures real-time message delivery works
  useEffect(() => {
    if (activeChat && currentUser) {
      logInfo('🔧 Active chat changed, joining conversation room:', activeChat.id);
      // Always try to join, even if not connected (will queue for when connection is ready)
      realtimeChatService.joinConversation(activeChat.id).catch(err => {
        logWarn('⚠️ Failed to join conversation room:', err);
      });
    }
  }, [activeChat?.id, currentUser?.email]); // Join when chat opens or user changes

  // Sync activeChat when conversations change
  useEffect(() => {
    if (activeChat) {
      const updatedConversation = conversations.find(conv => conv.id === activeChat.id);
      if (updatedConversation) {
        // Use shallow comparison instead of deep JSON comparison to avoid infinite loops
        const localMsgLen = activeChat.messages?.length ?? 0;
        const remoteMsgLen = updatedConversation.messages?.length ?? 0;
        if (remoteMsgLen < localMsgLen) {
          return;
        }
        const hasChanges = 
          remoteMsgLen !== localMsgLen ||
          updatedConversation.lastMessageAt !== activeChat.lastMessageAt ||
          updatedConversation.isReadBySeller !== activeChat.isReadBySeller ||
          updatedConversation.isReadByCustomer !== activeChat.isReadByCustomer;
        
        if (hasChanges) {
          setActiveChat(updatedConversation);
        }
      }
    }
  }, [conversations, activeChat?.id]); // Added activeChat?.id for proper reactivity
}
