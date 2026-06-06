import React, { useState } from 'react';
import { 
  Plus, ChevronDown, Download, Search, 
  ArrowUpDown, Edit, Eye, Trash2, Calendar
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useMenuTitle } from '@/hooks/useMenuTitle';

// Mock Data matching the screenshot
const paymentLinks = Array(10).fill(null).map((_, i) => {
  const statuses = ['Paid', 'Processing', 'Failed', 'Expired', 'Paid', 'Processing', 'Paid', 'Expired', 'Paid', 'Failed'];
  const status = statuses[i];
  const amounts = ['৳ 6426', '৳ 4684', '৳ 7267', '৳ 0832', '৳ 0061', '৳ 5206', '৳ 4900', '৳ 4640', '৳ 4640', '৳ 4640'];
  const invoices = [
    'INV-2651309600', 'INV-7596430447', 'INV-8703308124', 'INV-3797540190', 'INV-4667727578', 
    'INV-6371400424', 'INV-9074006920', 'INV-1175679244', 'INV-1175679244', 'INV-1175679244'
  ];
  return {
    id: i + 1,
    customerName: 'Sarah Al Mazrouei',
    invoiceNumber: invoices[i],
    reference: '9Z8PE8ALJK',
    amount: amounts[i],
    paymentLinkType: 'Payment_Link',
    status: status,
  };
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-700';
    case 'Processing':
      return 'bg-yellow-50 text-yellow-700';
    case 'Failed':
      return 'bg-red-100 text-red-700';
    case 'Expired':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function PaymentLink() {
  const pageTitle = useMenuTitle('Payment Link');
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{pageTitle}</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 overflow-hidden">
        {/* Actions Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5 mb-5">
          <button className="inline-flex items-center justify-center rounded-lg bg-[#3b2768] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2D1B4E] focus:outline-none focus:ring-2 focus:ring-[#3b2768]/50 gap-2">
            <Plus className="h-4 w-4" />
            Create Payment Link
            <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
          </button>
          
          <button className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 gap-2">
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-gray-700">Payment Link Status</label>
            <div className="relative">
              <select className="block w-full rounded-md border-gray-200 py-2.5 pl-3 pr-10 text-sm focus:border-[#3b2768] focus:ring-[#3b2768] text-gray-500 appearance-none bg-white border">
                <option value="">Status</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-gray-700">Start Date</label>
            <div className="relative">
              <input type="text" placeholder="01/01/206" className="block w-full rounded-md border-gray-200 py-2.5 pl-3 pr-10 text-sm focus:border-[#3b2768] focus:ring-[#3b2768] border text-gray-700" />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-gray-700">End Date</label>
            <div className="relative">
              <input type="text" placeholder="01/01/206" className="block w-full rounded-md border-gray-200 py-2.5 pl-3 pr-10 text-sm focus:border-[#3b2768] focus:ring-[#3b2768] border text-gray-700" />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-gray-700">Invoice Number</label>
            <input type="text" placeholder="INV-12345" className="block w-full rounded-md border-gray-200 py-2.5 px-3 text-sm focus:border-[#3b2768] focus:ring-[#3b2768] border placeholder:text-gray-300" />
          </div>

          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-gray-700">Customer Phone</label>
            <input type="text" placeholder="01XXXXXXXXX" className="block w-full rounded-md border-gray-200 py-2.5 px-3 text-sm focus:border-[#3b2768] focus:ring-[#3b2768] border placeholder:text-gray-300" />
          </div>

          <div className="space-y-1.5 lg:col-span-1 flex items-end">
            <button className="w-full inline-flex items-center justify-center rounded-lg bg-[#3b2768] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2D1B4E] focus:outline-none focus:ring-2 focus:ring-[#3b2768] gap-2">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border rounded-lg border-gray-200 mb-4">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-white border-b border-gray-200 hover:bg-white">
                <TableHead className="w-12 py-3.5 px-4 text-left text-xs font-medium text-gray-500">#</TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Customer Name <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Invoice Number <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Reference <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Amount <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Payment_Link <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Status <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-center text-xs font-medium text-gray-500 whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentLinks.map((link) => (
                <TableRow key={link.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <TableCell className="py-4 px-4 text-sm text-gray-700">{link.id}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{link.customerName}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{link.invoiceNumber}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-700">{link.reference}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-900 font-medium whitespace-nowrap">{link.amount}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-700">{link.paymentLinkType}</TableCell>
                  <TableCell className="py-4 px-4">
                    <span className={cn('inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold', getStatusColor(link.status))}>
                      {link.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                       <button className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 p-1.5 rounded" title="Edit">
                         <Edit className="h-4 w-4" />
                       </button>
                       <button className="text-purple-500 hover:text-purple-700 transition-colors bg-purple-50 p-1.5 rounded" title="View">
                         <Eye className="h-4 w-4" />
                       </button>
                       <button className="text-red-500 hover:text-red-700 transition-colors bg-red-50 p-1.5 rounded" title="Delete">
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6">
          <div className="flex items-center bg-gray-50 rounded-lg p-1">
             <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">Previous</button>
             <button className="px-3 py-1.5 text-sm bg-[#3b2768] text-white rounded-md font-medium">1</button>
             <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md font-medium">2</button>
             <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md font-medium">3</button>
             <span className="px-2 text-gray-400">...</span>
             <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md font-medium">10</button>
             <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md font-medium border bg-white shadow-sm ml-1">Next</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Page</span>
            <div className="relative">
              <select className="appearance-none border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-[#3b2768] focus:border-[#3b2768] bg-white">
                <option>1</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">of 14</span>
          </div>
        </div>

      </div>
    </div>
  );
}
