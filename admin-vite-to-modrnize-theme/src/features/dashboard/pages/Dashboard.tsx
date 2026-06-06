import React from 'react';
import StatsCard from '../components/StatsCard';
import TransactionOverview from '../components/TransactionOverview';
import PaymentMethodOverview from '../components/PaymentMethodOverview';
import RecentOrders from '../components/RecentOrders';

const stats = [
  {
    title: 'Available Balance',
    value: '20,000',
    trend: '0.5%',
    trendUp: true,
    prefix: '৳',
    hasSubtext: true,
    subtext: 'Includes last settlement'
  },
  {
    title: 'Pending',
    value: '20,000',
    trend: '0.5%',
    trendUp: true,
    prefix: '☼',
    hasSubtext: true,
    subtext: 'Next settlement in 2 days'
  },
  {
    title: 'Total Collection',
    value: '1,00,000',
    trend: '0.8%',
    trendUp: false,
    prefix: '৳'
  },
  {
    title: "Today's Collection",
    value: '0',
    trend: '0.0%',
    trendUp: true,
    prefix: '৳',
    subtext: 'Last day'
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <TransactionOverview />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <PaymentMethodOverview />
        </div>
      </div>
      
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
        <RecentOrders />
      </div>
    </div>
  );
}
