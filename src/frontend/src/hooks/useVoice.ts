import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'reconnecting' | 'error';

interface UseVoiceOptions {
  canvasId: string;
  onToolCall: (tool: string, args: Record<string, unknown>, result: unknown) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onStatusChange: (status: VoiceStatus) => void;
}

export function useVoice({
  canvasId,
  onToolCall,
  onTranscript,
  onStatusChange,
}: UseVoiceOptions) {
  const wsRef          = useRef<WebSocket | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const processorRef   = useRef<ScriptProcessorNode | null>(null);
  const reconnectRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const attemptRef     = useRef(0);
  const [status, setStatus] = useState<VoiceStatus>('idle');

  const updateStatus = useCallback(
    (s: VoiceStatus) => {
      setStatus(s);
      onStatusChange(s);
    },
    [onStatusChange],
  );

  const stopVoice = useCallback(() => {
    clearTimeout(reconnectRef.current);
    processorRef.current?.disconnect();
    if (audioCtxRef.current) { audioCtxRef.current.close(); }
    wsRef.current?.close();
    processorRef.current = null;
    audioCtxRef.current  = null;
    wsRef.current        = null;
    updateStatus('idle');
  }, [updateStatus]);

  const startVoice = useCallback(async () => {
    try {
      updateStatus('connecting');

      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;

      const source    = audioCtx.createMediaStreamSource(stream);
      // ScriptProcessorNode: deprecated but works in Chrome for hackathon scope
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination);

      const wsBase = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000';
      const ws     = new WebSocket(`${wsBase}/ws/voice?canvas_id=${canvasId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus('listening');
        attemptRef.current = 0;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input  = e.inputBuffer.getChannelData(0);
          const pcm16  = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
          }
          ws.send(pcm16.buffer);
        };
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as Record<string, unknown>;
          switch (msg.type) {
            case 'response.audio_transcript.delta':
              onTranscript((msg.delta as string) ?? '', false);
              break;
            case 'conversation.item.input_audio_transcription.completed':
              onTranscript((msg.transcript as string) ?? '', true);
              break;
            case 'tool_call_result':
              onToolCall(
                msg.tool as string,
                (msg.args as Record<string, unknown>) ?? {},
                msg.result,
              );
              break;
            case 'status':
              if (msg.status === 'reconnecting') updateStatus('reconnecting');
              break;
            case 'session_expired':
              stopVoice();
              setTimeout(() => startVoice(), 500);
              break;
          }
        } catch {
          // ignore binary audio frames
        }
      };

      ws.onclose = () => {
        if (status !== 'idle') {
          const delay = Math.min(2 ** attemptRef.current * 1000, 30000);
          attemptRef.current++;
          updateStatus('reconnecting');
          reconnectRef.current = setTimeout(() => startVoice(), delay);
        }
      };

      ws.onerror = () => updateStatus('error');

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        updateStatus('error');
      } else {
        updateStatus('error');
      }
    }
  }, [canvasId, onToolCall, onTranscript, updateStatus, stopVoice, status]);

  // Cleanup on unmount
  useEffect(() => () => stopVoice(), [stopVoice]);

  return { status, startVoice, stopVoice };
}
