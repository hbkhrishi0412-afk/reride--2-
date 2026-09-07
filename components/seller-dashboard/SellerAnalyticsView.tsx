import React, { memo } from 'react';
import type { Vehicle } from '../../types';
import { formatSalesValue } from '../../utils/numberUtils';
import SellerPremiumPanel from './SellerPremiumShell';

const AnalyticsChart = React.lazy(() => import('../dashboard/AnalyticsChart'));

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; gradient?: string }> = memo(({ title, value, icon }) => (
  <div
    className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
    style={{
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F5 100%)',
      border: '1px solid rgba(28,25,23,0.08)',
      boxShadow: '0 18px 36px -28px rgba(28,25,23,0.35)',
    }}
  >
    <div className="mb-4 flex items-center justify-between gap-3 overflow-hidden">
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden text-right">
        <p
          className="break-words text-lg font-bold tabular-nums text-stone-900 sm:text-xl"
          style={{ fontFamily: "'Nunito Sans', Poppins, sans-serif", letterSpacing: '-0.02em' }}
        >
          {value}
        </p>
      </div>
    </div>
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition-colors duration-300 group-hover:text-orange-700">
      {title}
    </h3>
  </div>
));

export type SellerAnalyticsChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    yAxisID: string;
  }>;
};

export type SellerAnalyticsData = {
  totalSalesValue: number;
  totalViews: number;
  totalInquiries: number;
  chartData: SellerAnalyticsChartData;
};

export const SellerAnalyticsView: React.FC<{
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  monthOptions: Array<{ value: string; label: string }>;
  filteredPublishedListings: Vehicle[];
  analyticsData: SellerAnalyticsData;
  sellerVehicles: Vehicle[];
}> = ({
  selectedMonth,
  onSelectedMonthChange,
  monthOptions,
  filteredPublishedListings,
  analyticsData,
  sellerVehicles,
}) => (
  <div className="space-y-6">
    <SellerPremiumPanel
      eyebrow="Insights"
      title="Analytics"
      description="Performance across listings, views, and inquiries."
      actions={
        <label className="inline-flex items-center gap-2 text-sm text-stone-600">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">Month</span>
          <select
            id="month-selector"
            value={selectedMonth}
            onChange={(e) => onSelectedMonthChange(e.target.value)}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            style={{ border: '1px solid rgba(28,25,23,0.12)' }}
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Listings"
          value={filteredPublishedListings.length}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" />
            </svg>
          }
        />
        <StatCard
          title="Total Sales Value"
          value={formatSalesValue(analyticsData.totalSalesValue)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
            </svg>
          }
        />
        <StatCard
          title="Total Views"
          value={analyticsData.totalViews.toLocaleString('en-IN')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057 5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatCard
          title="Total Inquiries"
          value={analyticsData.totalInquiries.toLocaleString('en-IN')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
      </div>

      {/* Boost Analytics */}
      {(() => {
        const activeBoosts = sellerVehicles.flatMap((v) =>
          v && v.activeBoosts ? v.activeBoosts.filter((boost) => boost.isActive && new Date(boost.expiresAt) > new Date()) : [],
        );

        if (activeBoosts.length > 0) {
          return (
            <div
              className="mt-6 rounded-2xl p-5"
              style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.14)' }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-stone-900" style={{ letterSpacing: '-0.02em' }}>
                  Active boost campaigns
                </h3>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF8456 0%, #E85A2A 100%)' }}
                >
                  {activeBoosts.length} active
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {activeBoosts.map((boost) => {
                  const vehicle = sellerVehicles.find((v) => v && v.activeBoosts?.some((b) => b.id === boost.id));
                  const daysLeft = Math.ceil((new Date(boost.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={boost.id}
                      className="rounded-xl bg-white p-4"
                      style={{ border: '1px solid rgba(28,25,23,0.08)' }}
                    >
                      <p className="text-[12px] font-semibold capitalize text-stone-800">{boost.type.replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-[11px] text-stone-500">
                        {vehicle?.year} {vehicle?.make} {vehicle?.model}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-stone-500">{daysLeft}d left</span>
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%`,
                              background: 'linear-gradient(90deg, #FF8456, #E85A2A)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="mt-6 rounded-2xl p-5 sm:p-6" style={{ border: '1px solid rgba(28,25,23,0.08)', background: 'rgba(255,255,255,0.7)' }}>
        <h3 className="mb-5 text-base font-semibold text-stone-900" style={{ letterSpacing: '-0.02em' }}>
          Listing performance
        </h3>
        {filteredPublishedListings.length > 0 ? (
          (() => {
            try {
              // Safety check: ensure chartData is valid before rendering
              if (!analyticsData?.chartData || !analyticsData.chartData.labels || !analyticsData.chartData.datasets) {
                return (
                  <div className="px-6 py-16 text-center">
                    <h3 className="mt-2 text-lg font-semibold text-stone-900">Chart data unavailable</h3>
                    <p className="mt-1 text-sm text-stone-500">Unable to load chart data. Please refresh the page.</p>
                  </div>
                );
              }

              return (
                <React.Suspense
                  fallback={
                    <div className="flex h-80 items-center justify-center sm:h-96">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-reride-orange border-t-transparent" />
                    </div>
                  }
                >
                  <AnalyticsChart data={analyticsData.chartData} />
                </React.Suspense>
              );
            } catch (chartError) {
              // Log error but don't crash the dashboard
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ Error rendering chart:', chartError);
              }
              return (
                <div className="px-6 py-16 text-center">
                  <h3 className="mt-2 text-lg font-semibold text-stone-900">Chart error</h3>
                  <p className="mt-1 text-sm text-stone-500">Unable to display chart. Please refresh the page.</p>
                </div>
              );
            }
          })()
        ) : (
          <div className="px-6 py-16 text-center">
            <h3 className="mt-2 text-lg font-semibold text-stone-900">No data to display</h3>
            <p className="mt-1 text-sm text-stone-500">
              {selectedMonth === 'all' ? 'Add a vehicle to see performance data.' : 'No data available for the selected month.'}
            </p>
          </div>
        )}
      </div>
    </SellerPremiumPanel>
  </div>
);
