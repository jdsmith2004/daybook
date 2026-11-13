/* The scripture library: the volumes in the person's own Obsidian vault, and their books (core scripture.ts, lib/scripture.ts).
   A row in More once it is on in Settings, and nowhere else: it is for the people who keep their scriptures in Obsidian. The one
   thing at the top is where they left off, a tap from reading on. */
import { router, Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { LinkCard } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { ScrLost, ScrOff } from '@/components/scripture';
import { SetGroup, SetRow } from '@/components/settings-ui';
import { lastRead, scrIndex, useScripture, type ScrVolume } from '@/lib/scripture';

export default function Library() {
  const lib = useScripture();
  const [vols, setVols] = useState<ScrVolume[] | null>(null);
  const [lost, setLost] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!lib.on) return;
      let live = true;
      scrIndex()
        .then((v) => live && (setVols(v), setLost(false)))
        .catch(() => live && setLost(true));
      lastRead().then((k) => live && setLast(k));
      return () => void (live = false);
    }, [lib.on]),
  );
  if (!lib.can) return <Redirect href="/" />;
  if (!lib.ready) return null;
  if (!lib.on)
    return (
      <Screen title="Scriptures" back>
        <ScrOff />
      </Screen>
    );
  return (
    <Screen title="Scriptures" back>
      {lost ? <ScrLost /> : null}
      {last ? (
        <LinkCard icon="book" tone="sun" title={last} sub="Read on" onPress={() => router.push({ pathname: '/scripture/read', params: { key: last } })} />
      ) : null}
      {(vols || []).map((v) => (
        <SetGroup key={v.dir} head={v.name}>
          {v.books.map((b) => (
            <SetRow key={b.dir} label={b.name} onPress={() => router.push({ pathname: '/scripture/book', params: { vol: v.dir, book: b.dir } })} />
          ))}
        </SetGroup>
      ))}
    </Screen>
  );
}
