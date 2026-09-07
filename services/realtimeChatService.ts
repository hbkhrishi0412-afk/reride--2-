import { logInfo } from '../utils/logger.js';
/**
 * Real-time Chat Service for Buyer-Seller Conversations
 *
 * Production uses Supabase Realtime (postgres changes + broadcast/presence).
 * Socket.io is not used in the client — Vercel serverless cannot host persistent WS.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Conversation, ChatMessage, Notification } from '../types.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { addMessageToConversation, saveConversationToSupabase } from './conversationService.js';

interface TypingStatus {
  conversationId: string;
  userRole: 'customer' | 'seller';
  isTyping: boolean;
}

interface MessageDeliveryStatus {
  messageId: number | string;
  conversationId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface UserPresence {
  userEmail: string;
  userRole: 'customer' | 'seller';
  isOnline: boolean;
  lastSeen?: string;
}

interface PresenceStatus {
  conversationId: string;
  userEmail: string;
  userRole: 'customer' | 'seller';
  isOnline: boolean;
  lastSeen?: string;
}

/** Per-thread metadata for Supabase Realtime broadcast (typing) + presence (online). */
export interface ChatEphemeralThreadMeta {
  conversationId: string;
  counterpartEmail: string;
}

class RealtimeChatService {
  private isConnecting = false;
  private typingTimeouts = new Map<string, NodeJS.Timeout>();
  private messageCallbacks = new Map<string, (status: MessageDeliveryStatus) => void>();
  private onMessageReceived?: (conversationId: string, message: ChatMessage, conversationData?: Partial<Conversation>) => void;
  private onTypingStatusChanged?: (status: TypingStatus) => void;
  private onConnectionStatusChanged?: (connected: boolean) => void;
  private onReadReceipt?: (
    conversationId: string,
    messageIds: (number | string)[],
    readBy: 'customer' | 'seller',
  ) => void;
  private onPresenceChanged?: (status: PresenceStatus) => void;
  private onNotificationReceived?: (notification: Notification) => void;
  private pendingMessages: Map<string, ChatMessage[]> = new Map(); // Queue messages when offline
  private userPresence: Map<string, UserPresence> = new Map(); // Track user presence
  private lastUserEmail = '';
  private lastUserRole: 'customer' | 'seller' = 'customer';
  private supabaseEphemeralChannels = new Map<string, RealtimeChannel>();
  private ephemeralRetryCounts = new Map<string, number>();
  private lastEphemeralSyncArgs: {
    metas: ChatEphemeralThreadMeta[];
    email: string;
    role: 'customer' | 'seller';
  } | null = null;

  /**
   * Subscribe to Supabase broadcast+presence per conversation when Socket.io is not in use
   * (production / mobile). Keeps typing + online indicators in sync with low latency.
   */
  syncChatEphemeralChannels(
    metas: ChatEphemeralThreadMeta[],
    myEmail: string,
    myRole: 'customer' | 'seller',
  ): void {
    this.lastEphemeralSyncArgs = { metas, email: myEmail, role: myRole };
    this.applySupabaseEphemeralSubscriptions(metas, myEmail, myRole);
  }

  private teardownSupabaseEphemeral(): void {
    if (this.supabaseEphemeralChannels.size === 0) return;
    try {
      const supabase = getSupabaseClient();
      for (const ch of this.supabaseEphemeralChannels.values()) {
        try {
          supabase.removeChannel(ch);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    this.supabaseEphemeralChannels.clear();
  }

  private applySupabaseEphemeralSubscriptions(
    metas: ChatEphemeralThreadMeta[],
    myEmail: string,
    myRole: 'customer' | 'seller',
  ): void {
    if (typeof window === 'undefined') return;

    const norm = (e: string) => (e || '').toLowerCase().trim();
    const me = norm(myEmail);
    if (!me) {
      this.teardownSupabaseEphemeral();
      return;
    }

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const counterpartRole: 'customer' | 'seller' = myRole === 'customer' ? 'seller' : 'customer';
    const want = new Set(metas.map((m) => String(m.conversationId)));

    for (const id of [...this.supabaseEphemeralChannels.keys()]) {
      if (!want.has(id)) {
        const ch = this.supabaseEphemeralChannels.get(id);
        if (ch) {
          try {
            supabase.removeChannel(ch);
          } catch {
            /* ignore */
          }
        }
        this.supabaseEphemeralChannels.delete(id);
      }
    }

    for (const m of metas) {
      const convId = String(m.conversationId);
      if (this.supabaseEphemeralChannels.has(convId)) continue;

      const counterpart = norm(m.counterpartEmail);
      if (!counterpart) continue;

      const topic = `reride-chat-${convId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      const ch = supabase
        .channel(topic, {
          config: {
            broadcast: { self: false },
            presence: { key: me },
          },
        })
        .on(
          'broadcast',
          { event: 'typing' },
          (evt: { payload?: { userRole?: string; isTyping?: boolean } } | { userRole?: string; isTyping?: boolean }) => {
            const raw = evt as { payload?: { userRole?: string; isTyping?: boolean }; userRole?: string; isTyping?: boolean };
            const p = raw.payload ?? raw;
            if (!p || (p.userRole !== 'customer' && p.userRole !== 'seller')) return;
            this.onTypingStatusChanged?.({
              conversationId: convId,
              userRole: p.userRole as 'customer' | 'seller',
              isTyping: !!p.isTyping,
            });
          },
        )
        .on('presence', { event: 'sync' }, () => {
          try {
            const state = ch.presenceState();
            const keys = Object.keys(state).map(norm);
            const online = keys.includes(counterpart);
            this.onPresenceChanged?.({
              conversationId: convId,
              userEmail: m.counterpartEmail,
              userRole: counterpartRole,
              isOnline: online,
            });
          } catch {
            /* ignore */
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.ephemeralRetryCounts.delete(convId);
            void ch.track({ role: myRole, online_at: new Date().toISOString() }).catch(() => {});
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.supabaseEphemeralChannels.delete(convId);
            const retries = this.ephemeralRetryCounts.get(convId) || 0;
            if (retries >= 3 || !this.lastEphemeralSyncArgs) return;
            this.ephemeralRetryCounts.set(convId, retries + 1);
            const { metas, email, role } = this.lastEphemeralSyncArgs;
            window.setTimeout(() => {
              try {
                this.applySupabaseEphemeralSubscriptions(metas, email, role);
              } catch {
                /* ignore */
              }
            }, 2000 * (retries + 1));
          }
        });

      this.supabaseEphemeralChannels.set(convId, ch);
    }
  }

  private sendTypingSupabaseBroadcast(
    conversationId: string,
    userRole: 'customer' | 'seller',
    isTyping: boolean,
  ): void {
    const ch = this.supabaseEphemeralChannels.get(String(conversationId));
    if (!ch) return;
    try {
      void ch.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userRole, isTyping, ts: Date.now() },
      });
    } catch {
      /* ignore */
    }
  }

  /**
   * Mark service ready — Supabase Realtime subscriptions are wired via useSupabaseRealtime.
   */
  private ensureOnlineFlushListener(): void {
    if (typeof window === 'undefined') return;
    if ((this as { _onlineFlushBound?: boolean })._onlineFlushBound) return;
    (this as { _onlineFlushBound?: boolean })._onlineFlushBound = true;
    window.addEventListener('online', () => {
      void this.flushPendingMessages();
    });
  }

  async connect(userEmail: string, userRole: 'customer' | 'seller'): Promise<boolean> {
    this.lastUserEmail = userEmail;
    this.lastUserRole = userRole;
    this.ensureOnlineFlushListener();

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;

    try {
      const { getSupabaseClient } = await import('../lib/supabase.js');
      const supabase = getSupabaseClient();
      if (supabase) {
        this.onConnectionStatusChanged?.(true);
        void this.flushPendingMessages();
        return true;
      }
      console.warn('⚠️ Supabase client not available');
      this.onConnectionStatusChanged?.(true);
      void this.flushPendingMessages();
      return true;
    } catch (supabaseError) {
      console.warn('⚠️ Supabase not available, real-time features will be limited:', supabaseError);
      this.onConnectionStatusChanged?.(true);
      return true;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Send a message and persist to Supabase (delivery via Supabase Realtime).
   */
  private enqueuePendingMessage(conversationId: string, message: ChatMessage): void {
    const key = String(conversationId);
    const existing = this.pendingMessages.get(key) || [];
    if (existing.some((m) => String(m.id) === String(message.id))) return;
    this.pendingMessages.set(key, [...existing, message]);
  }

  private isLikelyOfflineOrNetworkError(error?: string): boolean {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    if (!error) return false;
    const lower = error.toLowerCase();
    return (
      lower.includes('network') ||
      lower.includes('fetch') ||
      lower.includes('offline') ||
      lower.includes('failed to fetch') ||
      lower.includes('timeout') ||
      lower.includes('networkerror')
    );
  }

  /** Flush queued messages after reconnect / coming back online. */
  async flushPendingMessages(): Promise<void> {
    if (this.pendingMessages.size === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const entries = [...this.pendingMessages.entries()];
    for (const [conversationId, messages] of entries) {
      const remaining: ChatMessage[] = [];
      for (const message of messages) {
        try {
          const messageForPersistence: ChatMessage = { ...message };
          delete messageForPersistence.status;
          const saveResult = await addMessageToConversation(conversationId, messageForPersistence);
          if (!saveResult.success) {
            if (this.isLikelyOfflineOrNetworkError(saveResult.error)) {
              remaining.push(message);
            } else {
              console.warn('Dropping queued chat message after non-network failure:', saveResult.error);
            }
          } else {
            logInfo('✅ Flushed queued chat message', { conversationId, messageId: message.id });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (this.isLikelyOfflineOrNetworkError(msg)) {
            remaining.push(message);
          }
        }
      }
      if (remaining.length > 0) {
        this.pendingMessages.set(conversationId, remaining);
      } else {
        this.pendingMessages.delete(conversationId);
      }
    }
  }

  async sendMessage(
    conversationId: string,
    message: ChatMessage,
    userEmail: string,
    userRole: 'customer' | 'seller'
  ): Promise<{ success: boolean; error?: string; persisted: boolean }> {
    try {
      const messageForPersistence: ChatMessage = { ...message };
      delete messageForPersistence.status;

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this.enqueuePendingMessage(conversationId, messageForPersistence);
        return {
          success: true,
          persisted: false,
          error: 'Queued offline — will send when back online',
        };
      }

      logInfo('💾 Saving message to database:', { conversationId, messageId: message.id });
      const saveResult = await addMessageToConversation(conversationId, messageForPersistence);
      const persisted = !!saveResult.success;

      if (!saveResult.success) {
        console.error('❌ Failed to save message to Supabase:', {
          conversationId,
          messageId: message.id,
          error: saveResult.error,
          errorDetails: saveResult.error
        });
        
        // Check if conversation doesn't exist
        if (saveResult.error?.includes('not found') || saveResult.error?.includes('404')) {
          console.error('⚠️ Conversation not found in database. Message will not be persisted.');
        } else if (this.isLikelyOfflineOrNetworkError(saveResult.error)) {
          this.enqueuePendingMessage(conversationId, messageForPersistence);
          return {
            success: true,
            persisted: false,
            error: saveResult.error || 'Queued after network failure',
          };
        } else {
          console.warn('⚠️ Database save failed');
        }
      } else {
        logInfo('✅ Message saved to database successfully');
        void this.flushPendingMessages();
      }

      return { success: saveResult.success, persisted, error: saveResult.error };
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (this.isLikelyOfflineOrNetworkError(errorMessage)) {
        const messageForPersistence: ChatMessage = { ...message };
        delete messageForPersistence.status;
        this.enqueuePendingMessage(conversationId, messageForPersistence);
        return {
          success: true,
          persisted: false,
          error: 'Queued after network error',
        };
      }
      return {
        success: false,
        persisted: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send typing indicator via Supabase broadcast.
   */
  sendTypingIndicator(conversationId: string, userRole: 'customer' | 'seller', isTyping: boolean): void {
    const timeoutKey = `${conversationId}-${userRole}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    this.sendTypingSupabaseBroadcast(conversationId, userRole, isTyping);

    if (isTyping) {
      const timeout = setTimeout(() => {
        this.sendTypingSupabaseBroadcast(conversationId, userRole, false);
        this.typingTimeouts.delete(timeoutKey);
      }, 3000);
      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }

  /**
   * Mark messages as read (handled via conversation API / Supabase updates).
   */
  async markAsRead(
    _conversationId: string,
    _messageIds: (number | string)[],
    _readerRole: 'customer' | 'seller',
  ): Promise<void> {
    /* no-op — read state persisted through conversation service */
  }

  joinConversation(_conversationId: string): Promise<void> {
    return Promise.resolve();
  }

  joinAllConversations(_conversationIds: string[]): void {
    /* no-op */
  }

  /**
   * Get user presence status
   */
  getUserPresence(userEmail: string, userRole: 'customer' | 'seller'): UserPresence | null {
    const key = `${userEmail}-${userRole}`;
    return this.userPresence.get(key) || null;
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(_conversationId: string): void {
    /* no-op */
  }

  /**
   * Set callback for when a new message is received
   */
  onMessage(callback: (conversationId: string, message: ChatMessage, conversationData?: Partial<Conversation>) => void): void {
    this.onMessageReceived = callback;
  }

  /**
   * Set callback for typing status changes
   */
  onTyping(callback: (status: TypingStatus) => void): void {
    this.onTypingStatusChanged = callback;
  }

  /**
   * Set callback for connection status changes
   */
  onConnection(callback: (connected: boolean) => void): void {
    this.onConnectionStatusChanged = callback;
  }

  /**
   * Set callback for read receipts
   */
  onRead(
    callback: (
      conversationId: string,
      messageIds: (number | string)[],
      readBy: 'customer' | 'seller',
    ) => void,
  ): void {
    this.onReadReceipt = callback;
  }

  /**
   * Set callback for presence changes
   */
  onPresence(callback: (status: PresenceStatus) => void): void {
    this.onPresenceChanged = callback;
  }

  /**
   * Set callback for notification received
   */
  onNotification(callback: (notification: Notification) => void): void {
    this.onNotificationReceived = callback;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.messageCallbacks.clear();
    this.ephemeralRetryCounts.clear();
    this.teardownSupabaseEphemeral();
    this.lastEphemeralSyncArgs = null;
    this.onConnectionStatusChanged?.(false);
  }

  isConnected(): boolean {
    return true;
  }
}

// Singleton instance
export const realtimeChatService = new RealtimeChatService();

