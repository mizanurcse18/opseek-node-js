import React from 'react';

export default function SalesChart() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Overview</h3>
        <p className="text-sm text-gray-500">Monthly revenue for the current year.</p>
      </div>
      <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
        {/* Simple CSS Bar Chart Placeholder */}
        {[30, 45, 25, 60, 45, 75, 55, 85, 40, 65, 50, 90].map((height, i) => (
          <div key={i} className="w-full flex flex-col justify-end h-full">
            <div 
              className="bg-primary-500 hover:bg-primary-600 rounded-t-sm transition-all" 
              style={{ height: `${height}%` }}
              title={`${height}%`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500 px-1">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
        <span>Oct</span>
        <span>Nov</span>
        <span>Dec</span>
      </div>
    </div>
  );
}
