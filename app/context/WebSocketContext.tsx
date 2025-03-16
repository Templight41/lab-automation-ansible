'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = async () => {
      try {
        // Try to initialize the socket server first
        try {
          await fetch('/api/socket');
        } catch (error) {
          console.warn('Socket server initialization failed, will try to connect anyway:', error);
        }
        
        const socketInstance = io({
          path: '/api/socket',
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
        });

        socketInstance.on('connect', () => {
          console.log('Connected to WebSocket');
          setIsConnected(true);
          setRetryCount(0); // Reset retry count on successful connection
        });

        socketInstance.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          
          // Implement retry logic
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
            setRetryCount(prev => prev + 1);
            // Socket.io will handle reconnection automatically
          } else {
            console.error('Max retries reached, giving up on socket connection');
            socketInstance.disconnect();
          }
        });

        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    // Only initialize if we don't already have a socket
    if (!socket) {
      initializeSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket, retryCount]);

  const sendMessage = (data: any) => {
    if (socket && isConnected) {
      try {
        socket.emit('message', data);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.warn('Cannot send message: Socket not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
} 