import React, { useState } from 'react';
import { useSignalR } from '@/hooks/useSignalR';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

/**
 * Example Component demonstrating how to use the useSignalR hook
 * to send and receive real-time notifications.
 */
const SignalRNotificationExample = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  // Initialize the SignalR hook
  const { isConnected, sendNotification } = useSignalR({
    // Using the base URL + API prefix from environment variables
    url: `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_PREFIX || '/api/v1'}/auth/hubs/notification`,
    
    // Callback when a notification is received from the server
    onReceiveNotification: (message: string) => {
      // Here you could also dispatch a Redux action:
      // dispatch(getNotificationList());
      
      setNotifications((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Received: ${message}`
      ]);
    }
  });

  // Example of sending data to the server via SignalR
  const handleSimulateSend = () => {
    // "SendNotificationToServer" should match the method name defined in your C# Hub
    sendNotification('SendNotificationToServer', 'Hello from React client!');
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>SignalR Notifications</span>
          <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSimulateSend} 
            disabled={!isConnected}
            className="w-full"
          >
            Send Notification to Server
          </Button>
        </div>

        <div className="border rounded-md p-4 h-48 overflow-y-auto bg-gray-50">
          <h4 className="text-sm font-semibold mb-2 text-gray-500">Event Log</h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No notifications yet...</p>
          ) : (
            <ul className="space-y-1">
              {notifications.map((note, idx) => (
                <li key={idx} className="text-sm text-gray-700 border-b border-gray-100 pb-1">
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

export default SignalRNotificationExample;
