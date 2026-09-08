/**
 * contexts/index.ts — Barrel exports for context providers.
 * Auth lives in AppProvider / useAppAuthRuntime (not a separate AuthContext).
 */

export { ToastProvider, useToast } from './ToastContext';
export { CatalogProvider, useCatalog } from './CatalogContext';
export { ChatProvider, useChat } from './ChatContext';
export { NotificationProvider, NotificationContextBridge, useNotifications } from './NotificationContext';

