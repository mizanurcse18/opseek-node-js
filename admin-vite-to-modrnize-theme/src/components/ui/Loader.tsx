import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loader({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Loader2 
      className={cn('animate-spin text-primary-600', sizeClasses[size], className)} 
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center">
      <Loader size="lg" />
    </div>
  );
}
