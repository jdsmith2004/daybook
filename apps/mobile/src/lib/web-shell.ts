/* The first picture the web page shows before any code has arrived (scripts/web-shell.ts puts it in index.html: the flame asleep on the
   launch night, the opening scene's own first frame). The app takes it away once its own first screen is drawn, and then says so, so
   the other screens' code starts loading in the background. When the opening plays (Today), the scene's first frame is the same
   picture, so it goes at once; on a link straight to another page it stays until that page has drawn its words, so there is never a
   blank frame between the two. Native has no such page, so this does nothing there. */
import { Platform } from 'react-native';

import { WEB_LAUNCH } from '@/lib/launch';

/** the longest the picture waits for the page's words before it goes anyway */
const WAIT_MS = 4000;

export function dropWebShell() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const t0 = performance.now();
  const drawn = () => WEB_LAUNCH || (document.getElementById('root')?.innerText.trim().length ?? 0) > 0 || performance.now() - t0 > WAIT_MS;
  const check = () => {
    if (!drawn()) return void requestAnimationFrame(check);
    requestAnimationFrame(() => {
      const shell = document.getElementById('shell');
      if (!shell) return;
      shell.remove();
      /* the page then fetches the other screens' code while the person looks at this one (scripts/web-shell.ts) */
      window.dispatchEvent(new Event('daybook:drawn'));
    });
  };
  requestAnimationFrame(check);
}
