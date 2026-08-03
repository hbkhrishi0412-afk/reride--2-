import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DealLead, Vehicle } from '../types';
import { dealStageLabel, pipelineStageProgressPercent } from '../types';
import { useMyDealLeads } from '../hooks/useMyDealLeads';
import { EmptyState } from './dashboard/shared';

const DEALS_PER_PAGE = 10;

interface MyDealsListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onOpenDeal?: (leadId: string, vehicle?: Vehicle) => void;
  onBrowseVehicles?: () => void;
}

function vehicleForLead(vehicles: Vehicle[], lead: DealLead): Vehicle | undefined {
  return vehicles.find(
    (v) => String(v.id) === String(lead.vehicleId) || v.databaseId === String(lead.vehicleId),
  );
}

export const MyDealsList: React.FC<MyDealsListProps> = ({ vehicles, onSelectVehicle, onOpenDeal, onBrowseVehicles }) => {
  const { t } = useTranslation();
  const { activeLeads, loading, error, reload } = useMyDealLeads();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(activeLeads.length / DEALS_PER_PAGE)),
    [activeLeads.length],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * DEALS_PER_PAGE;
    return activeLeads.slice(start, start + DEALS_PER_PAGE);
  }, [activeLeads, currentPage]);

  const needsPagination = activeLeads.length > DEALS_PER_PAGE;
  const rangeStart = activeLeads.length === 0 ? 0 : (currentPage - 1) * DEALS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * DEALS_PER_PAGE, activeLeads.length);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((n) => (
          <div key={n} className="h-24 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
        <button type="button" onClick={() => void reload()} className="ml-2 font-semibold underline">
          {t('common.retry', { defaultValue: 'Retry' })}
        </button>
      </div>
    );
  }

  if (!activeLeads.length) {
    return (
      <EmptyState
        icon="🤝"
        title={t('buyerDashboard.deals.emptyTitle', { defaultValue: 'No active deals yet' })}
        description={t('buyerDashboard.deals.emptyBody', {
          defaultValue: 'When you start a tracked deal on a listing, it will appear here with every milestone.',
        })}
        action={
          onBrowseVehicles
            ? {
                label: t('buyerDashboard.deals.browse', { defaultValue: 'Browse vehicles' }),
                onClick: onBrowseVehicles,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {paginatedLeads.map((lead) => {
        const vehicle = vehicleForLead(vehicles, lead);
        const title =
          lead.vehicleName ||
          (vehicle ? `${vehicle.make} ${vehicle.model}` : t('buyerDashboard.deals.vehicleFallback', { defaultValue: 'Vehicle' }));
        const progress = pipelineStageProgressPercent(lead.currentStage);
        const canOpenDeal = Boolean(onOpenDeal);

        return (
          <button
            key={lead.id}
            type="button"
            onClick={() => {
              if (onOpenDeal) {
                onOpenDeal(lead.id, vehicle);
                return;
              }
              if (vehicle) onSelectVehicle(vehicle);
            }}
            disabled={!onOpenDeal && !vehicle}
            className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-60"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-700">{lead.id}</p>
                <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{dealStageLabel(lead.currentStage)}</p>
              </div>
              {lead.chatStatus === 'pending' ? (
                <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                  {t('buyerDashboard.deals.awaitingSeller', { defaultValue: 'Awaiting seller' })}
                </span>
              ) : null}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {canOpenDeal
                ? t('buyerDashboard.deals.tapForDealRoom', { defaultValue: 'Tap to open deal room' })
                : t('buyerDashboard.deals.tapToOpen', { defaultValue: 'Tap to open listing & deal room' })}
            </p>
          </button>
        );
      })}

      {needsPagination ? (
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            {t('buyerDashboard.deals.showingRange', {
              defaultValue: 'Showing {{from}} to {{to}} of {{total}} deals',
              from: rangeStart,
              to: rangeEnd,
              total: activeLeads.length,
            })}
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="text-xs text-gray-500 tabular-nums sm:text-sm">
              {t('buyerDashboard.deals.pageOf', {
                defaultValue: 'Page {{page}} of {{pages}}',
                page: currentPage,
                pages: totalPages,
              })}
            </span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1}
                className="rounded-md px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
              >
                {t('common.previous', { defaultValue: 'Previous' })}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
              >
                {t('common.next', { defaultValue: 'Next' })}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MyDealsList;
