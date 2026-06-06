import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Feb', value: 25000 },
  { name: 'Mar', value: 41000 },
  { name: 'Apr', value: 35000 },
  { name: 'May', value: 12000 },
  { name: 'Jun', value: 48000 },
  { name: 'Jul', value: 23000 },
  { name: 'Aug', value: 23000 },
  { name: 'Sept', value: 9000 },
  { name: 'Oct', value: 17000 },
  { name: 'Nov', value: 36000 },
  { name: 'Dec', value: 28000 },
];

export default function TransactionOverview() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Transection Overview</h3>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#3b2768] focus:border-[#3b2768] block p-2">
          <option>Last Year</option>
          <option>This Year</option>
        </select>
      </div>
      
      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b2768" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b2768" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `৳${value >= 1000 ? value / 1000 + 'k' : value}`}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b2768" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
