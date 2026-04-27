import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);
let socketInstance = null;

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io('http://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    }

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
    };
  }, []);

  const emit = (event, data) => {
    if (socketInstance?.connected) {
      console.log(`[Socket] Emitting: ${event}`, data);
      socketInstance.emit(event, data);
    } else {
      console.warn('[Socket] Not connected, cannot emit:', event);
    }
  };

  const on = (event, callback) => {
    if (socketInstance) {
      console.log(`[Socket] Listening: ${event}`);
      socketInstance.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketInstance) {
      socketInstance.off(event, callback);
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}