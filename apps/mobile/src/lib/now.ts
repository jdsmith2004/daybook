/* The time, kept fresh: every 30 seconds, and right away when the app comes back to the front, so the day rolls over on time. */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useNow(every = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, every);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [every]);
  return now;
}
