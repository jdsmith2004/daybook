import { useEffect, useLayoutEffect, useState } from 'react';
import { Platform } from 'react-native';

/** On the web nothing tells the app the keyboard is up: the browser's visible area just gets shorter, while the page
    itself keeps its full height behind the keyboard. This is how much of the page the keyboard (and the browser's bar
    above it) covers, 0 while it is down. On iOS and Android it is always 0: Keyboard's own events say it there. */
export function useWebKeyboard(): number {
  const [kb, setKb] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const read = () => {
      /* Safari pans the whole page up to show the field; the page is laid out to fit above the keyboard, so put it back */
      if (window.scrollY) window.scrollTo(0, 0);
      const covered = document.documentElement.clientHeight - vv.height - vv.offsetTop;
      /* a short change is the browser's own bars coming and going, not a keyboard */
      setKb(covered > 120 ? Math.round(covered) : 0);
    };
    read();
    vv.addEventListener('resize', read);
    vv.addEventListener('scroll', read);
    return () => {
      vv.removeEventListener('resize', read);
      vv.removeEventListener('scroll', read);
    };
  }, []);
  return kb;
}

/** A many-line field on the web is a textarea two rows tall that scrolls inside itself; on iOS and Android it grows with
    its words. This grows it on the web too, each time the words change, so a long entry reads in full on the page. */
export function useWebGrow(input: { current: unknown }, text: string, width: number) {
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = input.current as HTMLTextAreaElement | null;
    if (!el?.style) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [input, text, width]);
}
