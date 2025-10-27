import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export const useWebSocket = (url: string) => {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    const connect = () => {
      const websocket = new WebSocket(url);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        // Clear any reconnection timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = undefined;
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setWs(websocket);
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [url, user]);

  return ws;
};