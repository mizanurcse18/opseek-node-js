import { useEffect, useState, useCallback } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType, HubConnectionState } from '@microsoft/signalr';

interface UseSignalROptions {
  url: string;
  autoConnect?: boolean;
  onReceiveNotification?: (...args: any[]) => void;
  skipNegotiation?: boolean;
  transport?: HttpTransportType;
}

export const useSignalR = (options: UseSignalROptions) => {
  const { url, autoConnect = true, onReceiveNotification } = options;
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Build the connection
    const newConnection = new HubConnectionBuilder()
      .withUrl(url, {
        withCredentials: false,
        skipNegotiation: options.skipNegotiation,
        transport: options.transport
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);

    // Cleanup on unmount
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [url]);

  useEffect(() => {
    if (!connection) return;

    // 2. Set up event listeners
    connection.on('ReceiveNotification', (...args: any[]) => {
      console.log('Received notification from server:', args);
      if (onReceiveNotification) {
        onReceiveNotification(...args);
      }
    });

    // 3. Start connection if autoConnect is true and it's not already connecting/connected
    if (autoConnect && connection.state === HubConnectionState.Disconnected) {
      connection.start()
        .then(() => {
          console.log('SignalR Connected!');
          setIsConnected(true);
        })
        .catch(err => {
          // Ignore the error if it's already connected (can happen in rapid re-renders)
          if (!err.message?.includes('not in the \'Disconnected\' state')) {
            console.error('SignalR Connection Error: ', err);
          }
        });
    }

    // Handle connection state changes
    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    return () => {
      connection.off('ReceiveNotification');
    };
  }, [connection, autoConnect, onReceiveNotification]);

  // Method to send messages to the server
  const sendNotification = useCallback(async (methodName: string, ...args: any[]) => {
    if (connection && isConnected) {
      try {
        await connection.send(methodName, ...args);
      } catch (err) {
        console.error('Error sending message via SignalR:', err);
      }
    } else {
      console.warn('SignalR is not connected. Cannot send message.');
    }
  }, [connection, isConnected]);

  return { isConnected, sendNotification, connection };
};
