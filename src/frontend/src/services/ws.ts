const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000';

export function createVoiceSocket(
  canvasId: string,
  onMessage: (data: unknown) => void,
  onClose: () => void,
  onError: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/voice?canvas_id=${canvasId}`);
  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data as string));
    } catch {
      // Ignore parse errors for binary audio frames
    }
  };
  ws.onclose = onClose;
  ws.onerror = onError;
  return ws;
}
