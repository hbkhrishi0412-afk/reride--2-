import React, { useEffect, useRef, useState } from 'react';
import type { Vehicle } from '../../types';

type CertificationStatus = Vehicle['certificationStatus'];

export type SellerListingsActionsProps = {
  vehicle: Vehicle;
  isExpired: boolean;
  renewAllowed: boolean;
  renewReason?: string;
  onBoost: () => void;
  onRenew: () => void;
  onRenewBlocked?: (reason: string) => void;
  onEdit: () => void;
  onSold: () => void;
  onDelete: () => void;
  onCertify: () => void;
};

function certLabel(status: CertificationStatus | undefined): { label: string; disabled?: boolean; hint: string } {
  switch (status) {
    case 'requested':
      return { label: 'Pending review', disabled: true, hint: 'Certification pending approval' };
    case 'approved':
      return { label: 'Certified', disabled: true, hint: 'Vehicle is certified' };
    case 'rejected':
      return { label: 'Retry certify', hint: 'Certification was rejected — request again' };
    default:
      return { label: 'Request certify', hint: 'Request a certified inspection report' };
  }
}

/** Compact primary actions + overflow menu for seller listing rows. */
const SellerListingsActions: React.FC<SellerListingsActionsProps> = ({
  vehicle,
  isExpired,
  renewAllowed,
  renewReason,
  onBoost,
  onRenew,
  onRenewBlocked,
  onEdit,
  onSold,
  onDelete,
  onCertify,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const cert = certLabel(vehicle.certificationStatus);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={rootRef} className="relative flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {isExpired && (
        <button
          type="button"
          onClick={() => {
            if (!renewAllowed) {
              onRenewBlocked?.(renewReason || 'Cannot renew this listing.');
              return;
            }
            run(onRenew);
          }}
          aria-disabled={!renewAllowed}
          title={renewAllowed ? 'Renew expired listing' : renewReason}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-white transition hover:brightness-110 ${
            renewAllowed ? '' : 'cursor-not-allowed opacity-45'
          }`}
          style={{ background: '#B42318' }}
        >
          Renew
        </button>
      )}
      <button
        type="button"
        onClick={() => run(onBoost)}
        title="Boost for more visibility"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-white transition hover:brightness-110"
        style={{
          background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)',
          boxShadow: '0 8px 18px -12px rgba(232, 90, 42, 0.7)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Boost
      </button>
      <button
        type="button"
        onClick={() => run(onEdit)}
        className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 transition hover:bg-slate-100"
        style={{ border: '1px solid rgba(15,23,42,0.10)' }}
      >
        Edit
      </button>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        style={{ border: '1px solid rgba(15,23,42,0.10)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[11.5rem] overflow-hidden rounded-xl bg-white py-1 shadow-xl"
          style={{ border: '1px solid rgba(15,23,42,0.08)' }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={cert.disabled}
            title={cert.hint}
            onClick={() => {
              if (cert.disabled) return;
              run(onCertify);
            }}
            className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {cert.label}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onSold)}
            className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Mark as sold
          </button>
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onDelete)}
            className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-red-600 hover:bg-red-50"
          >
            Delete listing
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerListingsActions;
