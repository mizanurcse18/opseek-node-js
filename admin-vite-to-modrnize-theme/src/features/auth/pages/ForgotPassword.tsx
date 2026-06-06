import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();
  const { toast, ToastComponent } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call for now since we don't have a forgot password API documented yet
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSent(true);
      toast({
        title: 'Reset link sent',
        description: 'If an account exists for this email, you will receive reset instructions.',
        status: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reset link. Please try again later.',
        status: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800">
        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#3b2768]/10 p-3 rounded-xl mb-4">
              <Mail className="w-10 h-10 text-[#3b2768]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">Forgot Password?</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
              {isSent 
                ? "Check your inbox for password reset instructions." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#3b2768] transition-colors" />
                  </div>
                  <input 
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#f7f6f8] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3b2768]/20 focus:border-[#3b2768] transition-all placeholder:text-slate-400" 
                    id="email" 
                    name="email" 
                    placeholder="admin@payplus.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                className="w-full h-11" 
                isLoading={isLoading}
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <Button 
                variant="outline"
                className="w-full h-11"
                onClick={() => setIsSent(false)}
              >
                Try another email
              </Button>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
            <button 
              onClick={() => navigate(ROUTES.LOGIN)}
              className="flex items-center justify-center w-full text-sm font-semibold text-[#3b2768] hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
      <ToastComponent />
    </>
  );
}
