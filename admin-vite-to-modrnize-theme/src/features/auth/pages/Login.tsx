import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { authService } from '@/lib/auth/api/auth.service';
import { setTokens, setUserDetails } from '@/lib/auth';
import { setCredentials } from '@/features/auth/authSlice';
import { CompanySwitchModal } from '@/features/auth/components/CompanySwitchModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/Toast';

export default function Login() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCompanySwitch, setShowCompanySwitch] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast, ToastComponent } = useToast();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_username');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await authService.loginSecure({
        username: email,
        password: password
      });

      if (rememberMe) {
        localStorage.setItem('remembered_username', email);
      } else {
        localStorage.removeItem('remembered_username');
      }

      if (response && (response.status_code === 200 || response.response_code === 'LOGIN_SUCCESS')) {
        setTokens(response.data.token, response.data.refresh_token);

        const isAdmin = response.data.is_admin || false;
        const userObj = { 
          id: response.data.user_id?.toString() || '1', 
          name: response.data.user_name || response.data.user || email, 
          email: email, 
          role: response.data.role || 'admin',
          company_id: response.data.company_id || response.data.CompanyID || '',
          is_admin: isAdmin,
          is_forced_login: !!response.data.is_forced_login
        };

        setUserDetails(userObj);

        dispatch(setCredentials({
          user: userObj, 
          token: response.data.token,
          refreshToken: response.data.refresh_token
        }));

        if (isAdmin) {
          setIsSuperAdmin(true);
          setShowCompanySwitch(true);
          return;
        }

        if (userObj.is_forced_login) {
          toast({ title: 'Password update required', description: 'Please change your password to continue.', status: 'info' });
          navigate('/settings/password');
          return;
        }
        
        const targetPath = response.data.default_menu_path || ROUTES.DASHBOARD;
        navigate(targetPath);
      } else {
        setErrorMsg(response?.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.response_code === 'INVALID_CREDENTIALS') {
        setErrorMsg(error.message || 'Invalid username or password.');
      } else if (error?.status_code) {
        setErrorMsg(error.message || `Error ${error.status_code}: Something went wrong.`);
      } else {
        setErrorMsg(error?.message || 'Unable to connect to the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
      {/* Enhanced Multi-layer Background: Blue, White, Black */}
      <div className="absolute inset-0 z-0">
        {/* Base Black Layer */}
        <div className="absolute inset-0 bg-[#020617]"></div>
        
        {/* Deep Blue Radiant Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15)_0%,transparent_70%)]"></div>
        
        {/* Top Right Blue Light */}
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        
        {/* Bottom Left Deep Shadow */}
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full"></div>

        {/* Dynamic White-ish Light Source (Top center) */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full h-[60%] bg-gradient-to-b from-white/5 to-transparent blur-[60px]"></div>

        {/* Professional Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      </div>

      <div className="w-full max-w-[420px] flex flex-col items-center gap-10 z-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Glass Card */}
        <div className="bg-white/95 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[1.5rem] p-10 w-full flex flex-col gap-8 transition-all">
          
          <div className="flex flex-col gap-6 text-center">
            <div className="flex justify-center items-center pt-8 mb-2">
              <img src="/assets/images/logo/logo.svg" alt="Logo" className="h-10 w-auto object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[1.75rem] font-bold text-slate-900 tracking-tight">Sign In</h1>
              <p className="text-[13.5px] text-slate-500 font-medium">Welcome back! Log in with your credentials.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            {/* Email Field */}
            <div className="flex flex-col gap-2.5">
              <Label htmlFor="email" className="text-[13px] font-bold text-slate-800 ps-1">Email</Label>
              <Input 
                id="email"
                type="text"
                placeholder="demo@kt.com"
                variant="lg"
                className="bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all h-12 text-[14px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2.5">
              <Label htmlFor="password" className="text-[13px] font-bold text-slate-800 ps-1">Password</Label>
              <div className="relative group">
                <Input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  variant="lg"
                  className="bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all h-12 pr-12 text-[14px]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="rememberMe" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="size-[19px] rounded-[5px] border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                />
                <Label htmlFor="rememberMe" className="text-[13px] font-semibold text-slate-600 cursor-pointer select-none">
                  Remember me
                </Label>
              </div>
              <button 
                type="button"
                onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                className="text-[13px] font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                <span className="text-[12px] font-bold text-red-500 leading-tight">{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12.5 rounded-xl shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] text-sm tracking-wide mt-2 transition-all active:scale-[0.97]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-2">
            <p className="text-[13px] text-slate-500 font-medium">
              Don't have an account?{' '}
              <button className="font-bold text-slate-900 hover:text-blue-600 transition-colors">Sign Up</button>
            </p>
          </div>
        </div>

      </div>
      <ToastComponent />
    </div>
    
    <CompanySwitchModal
      isOpen={showCompanySwitch}
      onClose={() => {
        setShowCompanySwitch(false);
        const targetPath = ROUTES.DASHBOARD;
        navigate(targetPath);
      }}
    />
    </>
  );
}
