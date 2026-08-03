import React from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast.js';
import { useToast } from '../contexts/ToastContext.js';
import { Z_INDEX } from '../utils/zIndex.js';

/**
 * Reads toast state from ToastContext directly so toast updates do not
 * invalidate AppContext and re-render the entire tree.
 * Portaled to document.body so sticky headers / overflow parents cannot clip it.
 */
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed z-toast inset-x-4 bottom-20 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto w-auto sm:max-w-sm space-y-2"
      style={{ zIndex: Z_INDEX.toast }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body,
  );
};

export default ToastContainer;
