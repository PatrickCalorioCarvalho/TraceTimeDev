import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const unlisten = listen<number>("timer:tick", (e) => {
      setSeconds(e.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const start = async () => {
    setRunning(true);
    await invoke("start_timer");
  };

  const pause = async () => {
    setRunning(false);
    await invoke("pause_timer");
  };

  const stop = async () => {
    setRunning(false);
    setSeconds(0);
    await invoke("stop_timer");
  };

  return { seconds, running, start, pause, stop };
}
