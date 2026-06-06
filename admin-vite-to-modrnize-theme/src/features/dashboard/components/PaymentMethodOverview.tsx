import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'MFS', value: 60, color: '#3b2768' },
  { name: 'CARD', value: 35, color: '#a78bfa' },
  { name: 'Net Banking', value: 5, color: '#e5e7eb' },
];

export default function PaymentMethodOverview() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-gray-500 font-medium">Payment Method<br/>Overview</h3>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#3b2768] focus:border-[#3b2768] block p-2">
          <option>Last Week</option>
          <option>This Week</option>
        </select>
      </div>
      
      <div className="flex-1 relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', right: '-10px' }}
              formatter={(value, entry: any) => (
                <span className="text-gray-600 font-medium ml-1">
                  {value} <span className="text-gray-900 font-bold ml-4">{entry.payload.value}%</span>
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[90px]">
          <span className="text-xs text-gray-500">Most Used</span>
          <span className="text-sm font-bold text-gray-900 mt-1">MFS-60%</span>
        </div>
      </div>
    </div>
  );
}
