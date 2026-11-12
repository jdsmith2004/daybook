/* The scripture library's small parts (lib/scripture.ts): the switch in Settings under Faith, the page shown while it is off, and
   the line shown when the vault cannot be reached. The switch is plain and shown to anyone on an iPhone whose faith is part of
   their quit, off until they pick their own Obsidian vault: nothing in Daybook is hidden (App Review 2.5.19), it is only quiet. */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SetGroup, SetRow, SetSwitch } from '@/components/settings-ui';
import { Text } from '@/components/text';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { pickVault, stopVault, useScripture } from '@/lib/scripture';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** picks the vault, and says what went wrong when it did not take */
export function usePickVault() {
  const { say } = useStore();
  return async (): Promise<boolean> => {
    buzz('tap');
    try {
      const r = await pickVault();
      if (r === 'ok') {
        buzz('save');
        return true;
      }
      if (r === 'notVault') say('That folder has no Scriptures folder in it. Pick the vault itself, the folder that holds Scriptures.');
    } catch {
      say('That folder could not be opened. Try again in a moment.');
    }
    return false;
  };
}

/** the switch, under Faith in Settings */
export function ScriptureSetting() {
  const lib = useScripture();
  const pick = usePickVault();
  if (!lib.can) return null;
  return (
    <SetGroup
      foot={
        lib.on
          ? 'Your notes go into Scriptures/Notes in your vault, the way your Obsidian reader writes them. Nothing goes to Daybook.'
          : 'Reads the scriptures you keep in Obsidian, with your notes, on this iPhone.'
      }>
      <SetSwitch
        label="Scripture library"
        sub={lib.on && lib.name ? lib.name : undefined}
        on={lib.on}
        onChange={(on) => {
          if (on) void pick();
          else void stopVault();
        }}
      />
      {lib.on ? <SetRow label="Open the scriptures" onPress={() => router.push('/scripture')} /> : null}
    </SetGroup>
  );
}

/** the library while it is off: a verse as the reader shows it, and the one way to turn it on */
export function ScrOff() {
  const c = useTheme();
  const pick = usePickVault();
  return (
    <View style={{ gap: 24 }}>
      <View style={[s.sample, { backgroundColor: c.surface }]} accessible accessibilityLabel="Matthew 5, verse 14: Ye are the light of the world.">
        <T v="label" tone="muted">
          Matthew 5
        </T>
        <Text style={[s.verse, { color: c.ink }]}>
          <Text style={[s.n, { color: c.muted }]}>14 </Text>
          Ye are the light of the world. A city that is set on an hill cannot be hid.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <T tone="muted" v="small">
          Daybook reads the Scriptures folder in your Obsidian vault and writes your notes back into it. In the picker, go to iCloud Drive, then Obsidian, and
          open your vault.
        </T>
        <Button label="Choose my vault" onPress={() => void pick()} />
      </View>
    </View>
  );
}

/** the vault could not be reached */
export function ScrLost() {
  return <T>Your vault cannot be reached right now. Daybook tries again each time you open it. If this stays, choose the vault again in Settings.</T>;
}

export const scrType = StyleSheet.create({
  verse: { fontFamily: font.serif, fontSize: 20, lineHeight: 31 },
  n: { fontFamily: font.display, fontSize: 13, lineHeight: 31 },
});

const s = StyleSheet.create({
  sample: { borderRadius: 20, padding: 16, gap: 8 },
  verse: scrType.verse,
  n: scrType.n,
});
