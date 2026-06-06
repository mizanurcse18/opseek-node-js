import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-max mx-auto text-center">
        <div className="bg-red-50 p-6 rounded-2xl inline-flex items-center justify-center mb-6">
           <ShieldAlert className="h-16 w-16 text-red-600 animate-pulse" />
        </div>
        
        <h2 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl uppercase">
          Access Denied
        </h2>
        
        <p className="mt-4 text-lg font-bold text-gray-500 uppercase tracking-widest text-xs">
           Restricted Zone
        </p>

        <p className="mt-4 text-base text-gray-500 max-w-md mx-auto">
          Sorry, but you do not have permission to view this page. This action has been logged for security monitoring.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link to={ROUTES.DASHBOARD}>
            <Button className="w-full sm:w-auto h-12 px-8 bg-[#3b2768] hover:bg-[#2d1e50] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary-900/10">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Dashboard
            </Button>
          </Link>
          
          <Link to={ROUTES.LOGIN}>
             <Button variant="outline" className="w-full sm:w-auto h-12 px-8 border-gray-300 text-gray-600 font-black uppercase text-[10px] tracking-widest">
                Re-authenticate
             </Button>
          </Link>
        </div>

        <div className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
           PayPlus Security System v1.0
        </div>
      </div>
    </div>
  );
}
