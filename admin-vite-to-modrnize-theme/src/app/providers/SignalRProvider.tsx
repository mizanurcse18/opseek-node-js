import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { useSignalR } from '@/hooks/useSignalR';
import { HttpTransportType } from '@microsoft/signalr';
import { InActiveUserOverlay } from '@/features/auth/components/InActiveUserOverlay';

interface SignalRContextType {
  isConnected: boolean;
  sendNotification: (methodName: string, ...args: any[]) => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

export const useSignalRContext = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalRContext must be used within a SignalRProvider');
  }
  return context;
};

export const SignalRProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [isInactive, setIsInactive] = useState(false);
  const [inactiveMessage, setInactiveMessage] = useState('');

  const { isConnected, sendNotification } = useSignalR({
    // Using the same base path logic as your axios apiClient
    url: `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_PREFIX || '/api/v1'}/auth/hubs/notification`,
    autoConnect: isAuthenticated,
    onReceiveNotification: (notificationType: string, users: string, message: string, currentNotificationEmployeeId: string) => {
      console.log('Global Notification Received:', { notificationType, users, message, currentNotificationEmployeeId });

      if (notificationType === 'InActiveUser') {
        // Check if the current user ID is in the target users list
        const targetUsers = users ? users.split(',') : [];
        const currentUserId = String(user?.id || '');

        if (targetUsers.includes(currentUserId)) {
          setIsInactive(true);
          setInactiveMessage(message || 'Your account is inactive by admin.');
        }
      }
    }
  });

  return (
    <SignalRContext.Provider value={{ isConnected, sendNotification }}>
      {isInactive && <InActiveUserOverlay message={inactiveMessage} />}
      {children}
    </SignalRContext.Provider>
  );
};
