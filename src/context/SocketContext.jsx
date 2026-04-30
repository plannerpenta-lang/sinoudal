import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// In dev:  Vite serves on :5173 with its own Socket.io plugin
// In prod: Express + Socket.io on :3001, serving the React build
const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:5173';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  // Map of event → callback, kept in a ref so off() finds the right function
  const handlersRef = useRef({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event, data) => {
    if (socketRef.current) {
      console.log('[SOCKET EMIT]', event, data);
      socketRef.current.emit(event, data);
    }
  };

  // Store the raw handler reference so off() can remove the exact same function
  const on = (event, callback) => {
    if (socketRef.current) {
      handlersRef.current[event] = callback;
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      // Remove by reference — works because we stored the same function above
      socketRef.current.off(event, handlersRef.current[event]);
      delete handlersRef.current[event];
    }
  };

  return (
    <SocketContext.Provider value={{ emit, on, off, isConnected }}>
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
