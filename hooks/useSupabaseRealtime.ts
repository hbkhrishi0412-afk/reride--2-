import { logInfo } from '../utils/logger.js';
import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UseSupabaseRealtimeOptions {
  table: string;
  enabled?: boolean;
  filter?: string;
  onInsert?: (newRow: any) => void;
  onUpdate?: (updatedRow: any) => void;
  onDelete?: (deletedRow: any) => void;
}

const MAX_RETRIES = 5;
const BASE_RETRY_MS = 1500;

/**
 * Hook for subscribing to Supabase real-time database changes.
 * Retries on CHANNEL_ERROR / TIMED_OUT with exponential backoff.
 */
export function useSupabaseRealtime({
  table,
  enabled = true,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseSupabaseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const disposedRef = useRef(false);

  // Keep latest callbacks without re-subscribing on every render identity change
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    disposedRef.current = false;

    const clearRetry = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const cleanupChannel = () => {
      if (channelRef.current) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channelRef.current);
        } catch {
          /* ignore */
        }
        channelRef.current = null;
      }
    };

    if (!enabled) {
      clearRetry();
      cleanupChannel();
      return;
    }

    const channelName = filter
      ? `${table}:${filter.replace(/[^a-zA-Z0-9]/g, '_')}`
      : `${table}:all`;

    const subscribe = () => {
      if (disposedRef.current) return;

      cleanupChannel();

      try {
        const supabase = getSupabaseClient();

        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table,
              ...(filter ? { filter } : {}),
            },
            (payload) => {
              if (process.env.NODE_ENV === 'development') {
                logInfo(`[Realtime] ${table} ${payload.eventType}:`, payload);
              }

              try {
                const { onInsert: oi, onUpdate: ou, onDelete: od } = callbacksRef.current;
                switch (payload.eventType) {
                  case 'INSERT':
                    if (oi && payload.new) oi(payload.new);
                    break;
                  case 'UPDATE':
                    if (ou && payload.new) ou(payload.new);
                    break;
                  case 'DELETE':
                    if (od && payload.old) od(payload.old);
                    break;
                }
              } catch (error) {
                console.error(`Error handling ${table} real-time event:`, error);
              }
            },
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              retryCountRef.current = 0;
              if (process.env.NODE_ENV === 'development') {
                logInfo(`✅ Subscribed to ${table} real-time updates`);
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn(
                `⏱️ Realtime ${status} for ${table}; scheduling reconnect`,
              );
              scheduleRetry();
            } else if (status === 'CLOSED') {
              if (process.env.NODE_ENV === 'development') {
                logInfo(`🔌 Closed connection to ${table} real-time updates`);
              }
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error(`Failed to set up real-time subscription for ${table}:`, error);
        scheduleRetry();
      }
    };

    const scheduleRetry = () => {
      if (disposedRef.current) return;
      clearRetry();
      if (retryCountRef.current >= MAX_RETRIES) {
        console.error(`❌ Gave up reconnecting to ${table} after ${MAX_RETRIES} attempts`);
        return;
      }
      const attempt = retryCountRef.current;
      const delay = BASE_RETRY_MS * Math.pow(2, attempt);
      retryCountRef.current = attempt + 1;
      retryTimerRef.current = setTimeout(() => {
        subscribe();
      }, delay);
    };

    subscribe();

    return () => {
      disposedRef.current = true;
      clearRetry();
      cleanupChannel();
    };
  }, [table, filter, enabled]);

  return channelRef.current;
}
