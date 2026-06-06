import React from 'react';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/authSlice';

interface InActiveUserOverlayProps {
  message: string;
}

export function InActiveUserOverlay({ message }: InActiveUserOverlayProps) {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    // Using window.location because this component is rendered outside the Router context
    window.location.href = '/auth/login';
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fff8f8] px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-50 p-6 rounded-2xl inline-flex items-center justify-center mb-8">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight mb-2 uppercase italic">
          Authorization Failed
        </h1>
        
        <p className="text-red-500 font-bold uppercase tracking-wider mb-8">
          {message || 'Unauthorized'}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={handleRetry}
            className="w-full sm:w-auto h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-red-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Login
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto h-12 px-8 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-black uppercase text-[10px] tracking-widest rounded-lg"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
