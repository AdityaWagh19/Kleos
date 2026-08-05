import { useEffect, useRef, useCallback } from 'react';

export function useSSE(url: string | null, onMessage: (data: unknown) => void) {
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!url) return;
    esRef.current?.close();
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
    const es = new EventSource(`${baseUrl}${url}`);
    es.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data as string));
      } catch {
        // ignore malformed events
      }
    };
    esRef.current = es;
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);

  return {
    close: () => esRef.current?.close(),
  };
}
