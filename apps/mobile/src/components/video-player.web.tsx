/* The web's player: YouTube's privacy-enhanced embed in a frame. A browser does not say when a frame fails to load, so the page
   asks whether it is online first, and shows a calm line until it is. */
import { loveEmbed } from '@daybook/core';
import { createElement, useEffect, useState } from 'react';

import { PlayerNote } from '@/components/video-note';

const online = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

export function VideoPlayer({ id }: { id: string }) {
  const [on, setOn] = useState(online);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  if (!on) return <PlayerNote line="No connection right now. The video plays once you are back online." act="Try again" onPress={() => setOn(online())} />;
  return createElement('iframe', {
    key: id,
    src: loveEmbed(id),
    title: 'Video',
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    style: { border: 0, width: '100%', height: '100%', display: 'block', backgroundColor: '#000' },
  });
}
