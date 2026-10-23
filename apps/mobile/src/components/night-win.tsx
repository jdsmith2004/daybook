/* Last night's win, on Today: an urge ridden out in SOS at night is said the next time Today opens that day, in one line
   ("Last night you rode one out at 1:30 AM."), with the optional note for next time: what helped starts a note that SOS
   shows first next time (core night-win.ts; the morning stop that asked it before was retired on October 23, 2026). The
   card stays that day until its X closes it (kept on this device), and goes by itself the next day. */
import { changeSettings, nightWin, winNote, type Snapshot } from '@daybook/core';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Field, Link } from '@/components/choices';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function NightWinCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const sos = useSos();
  const { update } = useStore();
  /* the note being written (null while it is closed), the choices of what helped, and the word once it is saved */
  const [draft, setDraft] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [saved, setSaved] = useState(false);
  const st = snap.settings;
  const win = st ? nightWin(snap.days, st, tk) : null;
  const id = win ? win.k + ':' + win.evId : '';
  if (!win || sos.mem.nightWin === id) return null;
  const ask = win.askNote && !saved;
  const shut = () => {
    buzz('tap');
    sos.setMem((m) => ({ ...m, nightWin: id }));
  };
  const save = () => {
    const t = String(draft || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);
    if (!t) return;
    update((s0) => (s0.settings ? { ...s0, settings: changeSettings(s0.settings, (x) => void (x.note = t)) } : s0));
    buzz('save');
    setSaved(true);
    setDraft(null);
    setAsking(false);
  };
  return (
    <View style={[s.card, { backgroundColor: c.mintSoft }]} accessibilityRole="summary">
      <View style={s.top}>
        <View style={[s.ic, { backgroundColor: c.surface }]}>
          <Icon name="moon" size={20} color={c.mintText} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.line, { color: c.ink }]}>{win.line}</Text>
          <T v="small" tone="muted">
            {saved ? 'Saved. SOS shows your note first next time.' : win.sub}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          onPress={shut}
          style={({ pressed }) => [s.x, { opacity: pressed ? 0.6 : 1 }]}>
          <Icon name="x" size={18} color={c.muted} />
        </Pressable>
      </View>
      {draft != null ? (
        /* the note box and its button stay together, above the keyboard */
        <KeepAbove style={{ gap: 10 }}>
          <Field
            label="A note for your next hard moment"
            multiline
            autoFocus
            maxLength={600}
            value={draft}
            onChangeText={setDraft}
            placeholder={winNote(win, null)}
          />
          <View style={s.row}>
            <Button label="Save my note" onPress={save} />
            <Link label="Cancel" onPress={() => setDraft(null)} />
          </View>
        </KeepAbove>
      ) : ask && asking ? (
        <View style={{ gap: 8 }}>
          <T v="small" tone="muted">
            What helped? Pick one, and it starts a note that SOS shows you first next time.
          </T>
          <View style={s.chips}>
            {win.helped.map((h) => (
              <Pill key={h.id} icon={h.ic} label={h.name} tone={c.mintText} onPress={() => setDraft(winNote(win, h.id))} />
            ))}
            <Pill
              icon="pencil"
              label={win.helped.length ? 'Something else' : 'Write what helped'}
              tone={c.accentText}
              onPress={() => setDraft(winNote(win, null))}
            />
          </View>
        </View>
      ) : ask ? (
        <View style={{ alignItems: 'flex-start', marginLeft: 46 }}>
          <Link label="Add a note for next time" onPress={() => setAsking(true)} />
        </View>
      ) : null}
    </View>
  );
}

function Pill({ icon, label, tone, onPress }: { icon: string; label: string; tone: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.pill, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name={icon} size={16} color={tone} />
      <Text style={[s.pillT, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 20, padding: 14, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  line: { fontFamily: font.bodySemi, fontSize: 15.5, lineHeight: 21 },
  x: { padding: 4, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 999 },
  pillT: { fontFamily: font.bodySemi, fontSize: 14 },
});
