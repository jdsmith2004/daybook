/* One video from YouTube's privacy-enhanced player, filling the box it is put in (the Real love page, app/love.tsx). On a phone it
   plays in react-native-webview. A build made before that module was added has no player, so the video opens in the in-app
   browser sheet instead, and nothing breaks. With no connection it shows a calm line and Try again, never a broken frame. The
   web has its own (video-player.web.tsx). */
import { loveEmbed, SITE_URL } from '@daybook/core';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ComponentType } from 'react';
import { TurboModuleRegistry } from 'react-native';

import { PlayerNote } from '@/components/video-note';

/* the module throws when it is loaded without its native half, so it is asked for only once the phone says it has one */
type WebViewType = ComponentType<Record<string, unknown>>;
let WebView: WebViewType | null = null;
try {
  if (TurboModuleRegistry.get('RNCWebViewModule')) WebView = require('react-native-webview').WebView as WebViewType;
} catch {
  WebView = null;
}

export function VideoPlayer({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  const retry = () => {
    setFailed(false);
    setTries((n) => n + 1);
  };
  if (!WebView) {
    return (
      <PlayerNote
        line="This video opens in a window over Daybook."
        act="Play"
        onPress={() =>
          WebBrowser.openBrowserAsync(loveEmbed(id), { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }).catch(() => undefined)
        }
      />
    );
  }
  if (failed) return <PlayerNote line="No connection right now. The video plays once you are back online." act="Try again" onPress={retry} />;
  return (
    <WebView
      key={id + ':' + tries}
      /* YouTube asks where a player sits, so the first load names Daybook's site; nothing about the person goes with it */
      source={{ uri: loveEmbed(id), headers: { Referer: SITE_URL + '/' } }}
      style={{ flex: 1, backgroundColor: '#000' }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      incognito
      setSupportMultipleWindows={false}
      /* the player stays the player: a tap on the YouTube name or a related video is not followed out of the page (what the
         player loads inside itself is left alone) */
      onShouldStartLoadWithRequest={(r: { url: string; isTopFrame?: boolean }) =>
        r.isTopFrame === false || /^https:\/\/(www\.)?youtube-nocookie\.com\/embed\//.test(r.url) || r.url.startsWith('about:')
      }
      onError={() => setFailed(true)}
      onHttpError={() => setFailed(true)}
    />
  );
}
