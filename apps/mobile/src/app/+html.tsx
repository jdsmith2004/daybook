/* The web page's own HTML, drawn before the app loads. Its background and its `theme-color` already follow the phone's light or dark
   (and the app's own choice, kept in localStorage), so a dark phone never shows white first. WebChrome (_layout.tsx) keeps them
   in step once the app is running. The two colors are the light and dark `bg` in lib/theme.ts. */
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const BEFORE = `
html,body{background-color:#FFF8EB}
@media (prefers-color-scheme: dark){html,body{background-color:#15123A}}
html[data-theme=light],html[data-theme=light] body{background-color:#FFF8EB}
html[data-theme=dark],html[data-theme=dark] body{background-color:#15123A}
`;

/* the app's own choice (More, Settings) beats the phone's: read it before anything is drawn */
const PICK = `try{var t=localStorage.getItem('daybook.theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name=theme-color]');if(m){m.setAttribute('content',t==='dark'?'#15123A':'#FFF8EB');m.removeAttribute('media')}}}catch(e){}`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#FFF8EB" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#15123A" media="(prefers-color-scheme: dark)" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BEFORE }} />
        <script dangerouslySetInnerHTML={{ __html: PICK }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
