import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import UserForm from '../components/UserForm';
import { useMenuTitle } from '@/hooks/useMenuTitle';

export default function UserCreate() {
  const pageTitle = useMenuTitle('Create User');
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
                <span className="ml-1 md:ml-2 text-text-main">Create</span>
             </div>
          </li>
        </ol>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        <p className="text-sm text-text-muted mt-1">Add a new user to the system.</p>
      </div>

      <UserForm />
    </div>
  );
}
