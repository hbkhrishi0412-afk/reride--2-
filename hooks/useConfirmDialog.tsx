import React, { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export type ConfirmState = {
  title: string;
  message: string;
  variant?: 'danger';
  resolve: (ok: boolean) => void;
} | null;

export type AskConfirmOpts = { title?: string; variant?: 'danger' };

/** Confirm promise state + helpers (extracted from AppProvider). */
export function useConfirmDialog() {
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const askConfirm = useCallback(
    (message: string, opts?: AskConfirmOpts) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          title: opts?.title ?? 'Please confirm',
          message,
          variant: opts?.variant,
          resolve,
        });
      }),
    [],
  );

  const runIfConfirmed = useCallback(
    async (
      message: string,
      action: () => void | Promise<void>,
      opts?: AskConfirmOpts,
    ) => {
      if (await askConfirm(message, opts)) {
        await action();
      }
    },
    [askConfirm],
  );

  return { confirmState, setConfirmState, askConfirm, runIfConfirmed };
}

/** Renders the shared ConfirmDialog bound to useConfirmDialog state. */
export function ConfirmDialogHost({
  confirmState,
  setConfirmState,
}: {
  confirmState: ConfirmState;
  setConfirmState: React.Dispatch<React.SetStateAction<ConfirmState>>;
}) {
  return (
    <ConfirmDialog
      open={confirmState != null}
      title={confirmState?.title ?? ''}
      message={confirmState?.message ?? ''}
      variant={confirmState?.variant === 'danger' ? 'danger' : 'default'}
      onConfirm={() => {
        confirmState?.resolve(true);
        setConfirmState(null);
      }}
      onCancel={() => {
        confirmState?.resolve(false);
        setConfirmState(null);
      }}
    />
  );
}
