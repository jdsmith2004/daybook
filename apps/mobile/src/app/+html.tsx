/* The web page's own HTML, drawn before the app loads. Its background is the launch color (core LAUNCH_BG, the dark theme's page): the
   app opens on it with the flame asleep in the middle (components/launch.tsx) in either theme, so the first paint, the splash and
   Today are one motion with no change of color (the owner, November 15, 2026). WebChrome (_layout.tsx) sets the page and the browser's
   bars to the app's own background once Today is there. */
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const BEFORE = `
html,body{background-color:#15123A}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#15123A" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BEFORE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
