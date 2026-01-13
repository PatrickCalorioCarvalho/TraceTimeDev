import { useEffect, useRef, useState } from "react";

export function useTimer() {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // =========================
  // LOOP DE CONTAGEM
  // =========================
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        if (startRef.current) {
          setElapsed(Date.now() - startRef.current);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // =========================
  // AÇÕES
  // =========================
  function start() {
    startRef.current = Date.now() - elapsed;
    setStatus('running');
  }

  function pause() {
    setStatus('paused');
  }

  function stop() {
    setStatus('idle');
    setElapsed(0);
    startRef.current = null;
  }

  return {
    status,
    elapsed,
    start,
    pause,
    stop,
  };
}
