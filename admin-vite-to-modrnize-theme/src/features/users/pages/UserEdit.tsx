import React, { useEffect, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import UserForm from '../components/UserForm';
import { userService } from '@/lib/auth/api/user.service';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuTitle } from '@/hooks/useMenuTitle';

export default function UserEdit() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast, ToastComponent } = useToast();
  const pageTitle = useMenuTitle('Edit User');

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await userService.getUserById(id);
        if (isMounted && response?.data) {
          // Assume the response returns user object under data, data.user, or similar.
          const userData = response.data.user || response.data.User || response.data;
          setInitialData(userData);
        }
      } catch (error) {
        if (isMounted) toast(handleApiError(error));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchUser();
    
    return () => { isMounted = false; };
  }, [id, toast]);

  return (
    <div className="space-y-6">
      <nav className="flex text-sm text-text-muted font-medium mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to={ROUTES.DASHBOARD} className="hover:text-text-main inline-flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-text-muted/50" />
              <Link to={ROUTES.USERS} className="ml-1 md:ml-2 hover:text-text-main">
                Users
              </Link>
            </div>
          </li>
          <li>
             <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-text-muted/50" />
                <span className="ml-1 md:ml-2 text-text-main">Edit User ({id})</span>
             </div>
          </li>
        </ol>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        <p className="text-sm text-text-muted mt-1">Update existing user information.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white rounded-xl border border-border-theme">
          <Loader className="h-8 w-8 text-[#3b2768]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Loading user details...</p>
        </div>
      ) : initialData ? (
        <UserForm initialData={initialData} isEditing />
      ) : (
        <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100">
           Failed to load user information.
        </div>
      )}
      <ToastComponent />
    </div>
  );
}
