import React from 'react';
import type { DealLead, User, Vehicle } from '../../types';
import { getFirstValidImage } from '../../utils/imageUtils';
import ListingLifecycleIndicator from '../ListingLifecycleIndicator';
import { isEffectivelyFeatured } from '../../utils/listingPromotion';
import SellerListingsActions from './SellerListingsActions';
import type { ListingRenewalValidation } from '../../utils/listingPlanRules';

export const SellerListingsView: React.FC<{
  pendingDealsBanner: React.ReactNode;
  activeListings: Vehicle[];
  paginatedListings: Vehicle[];
  seller: User;
  dealsByVehicleId: Map<string, DealLead[]>;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onCurrentPageChange: (updater: (prev: number) => number) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
  onBulkUpload: () => void;
  onAddNew: () => void;
  getListingRenewalValidation: (vehicle: Vehicle) => ListingRenewalValidation;
  isVehicleListingExpired: (vehicle: Vehicle) => boolean;
  onRefreshVehicle: (vehicleId: number) => void;
  onRenewVehicle: (vehicleId: number) => void;
  onOpenDeal: (leadId: string) => void;
  onNavigateToOverview: () => void;
  onBoost: (vehicle: Vehicle) => void;
  onRenewBlocked: (reason: string) => void;
  onEdit: (vehicle: Vehicle) => void;
  onSold: (vehicleId: number) => void;
  onDelete: (vehicleId: number) => void;
  onCertify: (vehicleId: number) => void;
}> = ({
  pendingDealsBanner,
  activeListings,
  paginatedListings,
  seller,
  dealsByVehicleId,
  currentPage,
  totalPages,
  itemsPerPage,
  onCurrentPageChange,
  onViewVehicle,
  onBulkUpload,
  onAddNew,
  getListingRenewalValidation,
  isVehicleListingExpired,
  onRefreshVehicle,
  onRenewVehicle,
  onOpenDeal,
  onNavigateToOverview,
  onBoost,
  onRenewBlocked,
  onEdit,
  onSold,
  onDelete,
  onCertify,
}) => (
  <div
    className="relative overflow-hidden rounded-2xl"
    style={{
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F5 100%)',
      border: '1px solid rgba(28, 25, 23, 0.08)',
      boxShadow: '0 24px 48px -32px rgba(28, 25, 23, 0.28)',
    }}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-28"
      style={{
        background:
          'radial-gradient(80% 120% at 0% 0%, rgba(255,107,53,0.14), transparent 55%), radial-gradient(60% 100% at 100% 0%, rgba(28,25,23,0.05), transparent 50%)',
      }}
    />
    <div className="relative p-5 sm:p-7">
      {pendingDealsBanner}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-stone-400">Inventory</p>
          <h2
            className="mt-1 text-[1.65rem] font-semibold tracking-tight text-stone-900"
            style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.03em' }}
          >
            My listings
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            {activeListings.length} active · boost to climb search and homepage placement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBulkUpload}
            className="inline-flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white"
            style={{ border: '1px solid rgba(28,25,23,0.12)', background: 'rgba(255,255,255,0.7)' }}
          >
            Bulk upload
          </button>
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)',
              boxShadow: '0 12px 24px -14px rgba(232,90,42,0.85)',
            }}
          >
            List new vehicle
          </button>
        </div>
      </div>

      {activeListings.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(28,25,23,0.08)' }}>
            <table className="min-w-full">
              <thead>
                <tr style={{ background: 'rgba(28,25,23,0.03)' }}>
                  {['Vehicle', 'Price', 'Views', 'Status', 'Actions'].map((label) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400 ${
                        label === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedListings.map((v) => {
                  const renewalValidation = getListingRenewalValidation(v);
                  const vehicleDeals =
                    dealsByVehicleId.get(String(v.id)) ||
                    (v.databaseId ? dealsByVehicleId.get(String(v.databaseId)) : undefined) ||
                    [];
                  const thumb = getFirstValidImage(v.images || [], v.id);
                  const activeBoosts = (v.activeBoosts || []).filter(
                    (boost) => boost.isActive && new Date(boost.expiresAt) > new Date(),
                  );
                  return (
                    <tr
                      key={v.id}
                      onClick={() => {
                        if (onViewVehicle) onViewVehicle(v);
                      }}
                      className="group cursor-pointer border-t transition-colors"
                      style={{ borderColor: 'rgba(28,25,23,0.06)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,107,53,0.035)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[14rem] items-center gap-3">
                          <div
                            className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100"
                            style={{ border: '1px solid rgba(28,25,23,0.06)' }}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={`${v.year} ${v.make} ${v.model}`}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                                  <path d="M3 13l2-5a2 2 0 012-1h8a2 2 0 012 1l2 5" />
                                  <path d="M5 13h14v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z" />
                                  <circle cx="7.5" cy="16.5" r="1.2" />
                                  <circle cx="16.5" cy="16.5" r="1.2" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[14px] font-semibold text-stone-900"
                              style={{ letterSpacing: '-0.015em' }}
                            >
                              {v.year} {v.make} {v.model}
                            </p>
                            {v.variant ? <p className="truncate text-[12px] text-stone-500">{v.variant}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[14px] font-semibold tabular-nums text-stone-800">
                        ₹{v.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] tabular-nums text-stone-500">
                        {(typeof v.views === 'number' ? v.views : 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1.5">
                          <ListingLifecycleIndicator
                            vehicle={v}
                            seller={seller}
                            compact={true}
                            onRefresh={() => onRefreshVehicle(v.id)}
                            onRenew={() => onRenewVehicle(v.id)}
                          />
                          {vehicleDeals.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const lead = vehicleDeals[0];
                                if (lead) onOpenDeal(lead.id);
                                onNavigateToOverview();
                              }}
                              className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-amber-900 transition hover:brightness-95"
                              style={{ background: 'rgba(251, 191, 36, 0.22)' }}
                            >
                              {vehicleDeals.length} buyer lead{vehicleDeals.length === 1 ? '' : 's'}
                              {vehicleDeals.some((d) => d.chatStatus === 'pending') ? ' · Accept chat' : ''}
                            </button>
                          ) : null}
                          {activeBoosts.map((boost) => {
                            const daysLeft = Math.max(
                              1,
                              Math.ceil((new Date(boost.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                            );
                            return (
                              <span
                                key={boost.id}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-orange-900"
                                style={{ background: 'rgba(255,107,53,0.14)' }}
                              >
                                Boost · {boost.type.replace(/_/g, ' ')} · {daysLeft}d
                              </span>
                            );
                          })}
                          {isEffectivelyFeatured(v) && activeBoosts.length === 0 ? (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-orange-900"
                              style={{ background: 'rgba(255,107,53,0.14)' }}
                            >
                              Featured
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <SellerListingsActions
                          vehicle={v}
                          isExpired={isVehicleListingExpired(v)}
                          renewAllowed={renewalValidation.allowed}
                          renewReason={renewalValidation.reason}
                          onBoost={() => onBoost(v)}
                          onRenew={() => onRenewVehicle(v.id)}
                          onRenewBlocked={(reason) => onRenewBlocked(reason)}
                          onEdit={() => onEdit(v)}
                          onSold={() => onSold(v.id)}
                          onDelete={() => onDelete(v.id)}
                          onCertify={() => onCertify(v.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {activeListings.length > itemsPerPage && (
            <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'rgba(28,25,23,0.08)' }}>
              <p className="text-[12.5px] text-stone-500">
                Showing{' '}
                <span className="font-semibold text-stone-800">
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, activeListings.length)}
                </span>{' '}
                of <span className="font-semibold text-stone-800">{activeListings.length}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onCurrentPageChange((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                  style={{ border: '1px solid rgba(28,25,23,0.12)' }}
                >
                  Prev
                </button>
                <span className="px-2 text-[12px] font-medium text-stone-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onCurrentPageChange((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
                  style={{ border: '1px solid rgba(28,25,23,0.12)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className="rounded-2xl px-6 py-14 text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,247,237,0.65))',
            border: '1px dashed rgba(28,25,23,0.14)',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-orange-600"
            style={{ background: 'rgba(255,107,53,0.12)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M3 13l2-5a2 2 0 012-1h8a2 2 0 012 1l2 5" />
              <path d="M5 13h14v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z" />
            </svg>
          </div>
          <h3
            className="text-xl font-semibold text-stone-900"
            style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.02em' }}
          >
            No vehicles listed yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
            Ready to sell? Add your first vehicle, then use Boost to put it in front of buyers.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-6 inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)',
              boxShadow: '0 12px 24px -14px rgba(232,90,42,0.85)',
            }}
          >
            List your first vehicle
          </button>
        </div>
      )}
    </div>
  </div>
);
