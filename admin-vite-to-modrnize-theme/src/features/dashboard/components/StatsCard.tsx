import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  prefix?: string;
  hasSubtext?: boolean;
  subtext?: string;
}

export default function StatsCard({ title, value, trend, trendUp, prefix, hasSubtext, subtext }: StatsCardProps) {
  return (
    <Card className="shadow-none border-gray-200">
      <CardContent className="p-5 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                {prefix && (
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                    {prefix}
                  </div>
                )}
                <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
             </div>
             <ArrowUpRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900 mb-6 flex items-end">
            ৳{value}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs mt-auto">
          <div className="flex items-center text-gray-500">
            <span>Last month</span>
            <span className={cn(
              "flex items-center ml-2 font-medium",
              trendUp ? "text-green-500" : "text-red-500"
            )}>
              {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trend}
            </span>
          </div>
          {hasSubtext && subtext && (
             <div className="text-gray-400 text-[10px] text-right leading-tight max-w-[80px]">
               {subtext}
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
