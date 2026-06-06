import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 lg:px-8">
      <div className="max-w-max mx-auto text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-primary-600" />
        <h2 className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">404</h2>
        <p className="mt-2 text-lg text-gray-500">Page not found.</p>
        <p className="mt-2 text-base text-gray-500 md:max-w-md">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to={ROUTES.DASHBOARD}>
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
