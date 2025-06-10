import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !socketRef.current) {
      try {
        socketRef.current = socketService.connect();
        
        socketRef.current.on('connect', () => {
          console.log('Socket conectado');
          setIsConnected(true);
          setError(null);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket desconectado');
          setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Error de conexión socket:', err);
          setError('Error de conexión al servidor');
          setIsConnected(false);
        });

      } catch (err) {
        console.error('Error al conectar socket:', err);
        setError(err.message);
      }
    }

    return () => {
      if (socketRef.current) {
        socketService.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    socketService
  };
};