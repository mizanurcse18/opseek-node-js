import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const orders = [
  {
    id: '#23456789',
    customer: 'Hamda Said',
    email: 'bnelson@yahoo.com',
    amount: '৳500',
    method: 'Bkash',
    status: 'Delivered',
  },
  {
    id: '#23456789',
    customer: 'Nasser Al Kaabi',
    email: 'rlee@yahoo.com',
    amount: '৳9,500',
    method: 'Rocket',
    status: 'Pending',
  },
  {
    id: '#23456789',
    customer: 'Asmaa Mohamed',
    email: 'ylewis@yahoo.com',
    amount: '৳9,500',
    method: 'Rocket',
    status: 'Pending',
  },
  {
    id: '#23456789',
    customer: 'Khaldoon Al Mubarak',
    email: 'prodriguez@yahoo.com',
    amount: '৳500',
    method: 'Bank',
    status: 'Delivered',
  },
  {
    id: '#23456789',
    customer: 'Salem Al Mansouri',
    email: 'jmobinson@aol.com',
    amount: '৳500',
    method: 'Bkash',
    status: 'Delivered',
  },
];

export default function RecentOrders() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Recent Transection</h3>
        <a href="#" className="text-sm font-bold text-gray-900 underline underline-offset-4 hover:text-gray-700">See All</a>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="font-medium text-gray-500 w-12">#</TableHead>
            <TableHead className="font-medium text-gray-500">Customer</TableHead>
            <TableHead className="font-medium text-gray-500 text-center">TRX Amount</TableHead>
            <TableHead className="font-medium text-gray-500 text-center">Payment Method</TableHead>
            <TableHead className="font-medium text-gray-500 text-center">Delivery Status</TableHead>
            <TableHead className="font-medium text-gray-500 text-right">Order ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
             <TableRow key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
               <TableCell className="py-4 text-gray-900">{index + 1}</TableCell>
               <TableCell className="py-4">
                 <div className="font-medium text-gray-900">{order.customer}</div>
                 <div className="text-xs text-gray-500">{order.email}</div>
               </TableCell>
               <TableCell className="py-4 text-center font-medium text-gray-900">{order.amount}</TableCell>
               <TableCell className="py-4 text-center text-gray-600">{order.method}</TableCell>
               <TableCell className="py-4 text-center">
                 <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                   order.status === 'Delivered' 
                     ? 'bg-[#22c55e] text-white' 
                     : 'bg-[#eab308] text-white'
                 }`}>
                   {order.status}
                 </span>
               </TableCell>
               <TableCell className="py-4 text-right text-gray-600">{order.id}</TableCell>
             </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
