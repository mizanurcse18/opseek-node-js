import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans overflow-x-hidden">
      <div className="w-full min-h-screen relative flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
