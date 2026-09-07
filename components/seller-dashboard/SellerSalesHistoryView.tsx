import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Vehicle } from '../../types';
import SellerPremiumPanel, {
  sellerPremiumGhostBtnStyle,
  sellerPremiumTableWrapStyle,
} from './SellerPremiumShell';

export const SellerSalesHistoryView: React.FC<{
  soldListings: Vehicle[];
  paginatedSoldListings: Vehicle[];
  soldPage: number;
  totalSoldPages: number;
  soldPageSize: number;
  onSoldPageChange: (updater: (prev: number) => number) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
  onMarkAsUnsold: (vehicleId: number) => void;
}> = ({
  soldListings,
  paginatedSoldListings,
  soldPage,
  totalSoldPages,
  soldPageSize,
  onSoldPageChange,
  onViewVehicle,
  onMarkAsUnsold,
}) => {
  const { t } = useTranslation();

  return (
    <SellerPremiumPanel
      eyebrow="Closed deals"
      title={t('sellerDashboard.nav.salesHistory')}
      description={
        soldListings.length > 0
          ? `${soldListings.length} sold listing${soldListings.length === 1 ? '' : 's'}`
          : 'Vehicles you have marked as sold.'
      }
    >
      {soldListings.length > 0 ? (
        <div className="overflow-x-auto rounded-xl" style={sellerPremiumTableWrapStyle}>
          <table className="min-w-full">
            <thead>
              <tr style={{ background: 'rgba(28,25,23,0.03)' }}>
                {['Vehicle', 'Sold price', 'Action'].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedSoldListings.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => {
                    if (onViewVehicle) {
                      onViewVehicle(v);
                    }
                  }}
                  className="cursor-pointer border-t transition-colors hover:bg-orange-50/40"
                  style={{ borderColor: 'rgba(28,25,23,0.06)' }}
                >
                  <td className="px-4 py-3.5 text-[14px] font-semibold text-stone-900">
                    {v.year} {v.make} {v.model} {v.variant || ''}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-semibold tabular-nums text-stone-800">
                    ₹{v.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsUnsold(v.id);
                      }}
                      className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:brightness-95"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      Mark as unsold
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalSoldPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: 'rgba(28,25,23,0.08)' }}>
              <div className="text-[12px] text-stone-500">
                Showing {(soldPage - 1) * soldPageSize + 1}
                {' – '}
                {Math.min(soldPage * soldPageSize, soldListings.length)} of {soldListings.length}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSoldPageChange((p) => Math.max(1, p - 1))}
                  disabled={soldPage === 1}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                  style={sellerPremiumGhostBtnStyle}
                >
                  Prev
                </button>
                <span className="px-2 text-[12px] text-stone-500">
                  {soldPage} / {totalSoldPages}
                </span>
                <button
                  type="button"
                  onClick={() => onSoldPageChange((p) => Math.min(totalSoldPages, p + 1))}
                  disabled={soldPage === totalSoldPages}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                  style={sellerPremiumGhostBtnStyle}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-xl px-4 py-10 text-center text-sm text-stone-500" style={{ border: '1px dashed rgba(28,25,23,0.14)' }}>
          You have not sold any vehicles yet.
        </p>
      )}
    </SellerPremiumPanel>
  );
};
