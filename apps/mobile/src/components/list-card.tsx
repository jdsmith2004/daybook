/* One of my lists (calm moves, the wind-down, words that steady me) as a plain list: a heading over one card, a thin line
   between the rows. Tap a row to reword, move or remove it, and "Add" puts a new one at the end. A row just added (from a
   lesson, or here) glows for a moment so it is easy to find. */
import { listAdd, listEdit, listInsert, listMove, listRemove, LISTS, type ListKey } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { TextInput } from '@/components/text';

import { Hair, PageLink, PageSec } from '@/components/editable';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Tone = 'mint' | 'sky' | 'violet';

export function ListCard({
  k,
  title,
  sub,
  icon,
  tone,
  numbered,
  addLabel,
  placeholder,
  fresh,
  onLayout,
  openAdd,
}: {
  k: ListKey;
  title: string;
  sub: string;
  icon: string;
  tone: Tone;
  /** a list done in order (the wind-down) shows step numbers */
  numbered?: boolean;
  addLabel: string;
  placeholder: string;
  /** the row to light up when the page opens */
  fresh?: number;
  onLayout?: (e: LayoutChangeEvent) => void;
  /** open with the Add field ready to type in */
  openAdd?: boolean;
}) {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const rows = ((st as unknown as Record<string, string[]>)[k] || []) as string[];
  const L = LISTS[k];
  const soft = { mint: c.mintSoft, sky: c.skySoft, violet: c.violetSoft }[tone];
  const ink = { mint: c.mintText, sky: c.skyText, violet: c.violetText }[tone];
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(!!openAdd);
  const [draft, setDraft] = useState('');
  const [lit, setLit] = useState<number | null>(fresh ?? null);

  const add = () => {
    const r = listAdd(snap.settings!, k, draft);
    if (!r.ok) {
      say(r.toast);
      if (r.at != null) setLit(r.at);
      return;
    }
    apply({ st: r.st });
    setDraft('');
    setLit(r.at);
    buzz('save');
  };

  return (
    <PageSec icon={icon} tone={tone} title={title} sub={sub} tight onLayout={onLayout}>
      {rows.length ? null : (
        <T tone="muted" style={{ paddingVertical: 8 }}>
          No {L.name} yet. Add the first one.
        </T>
      )}
      {rows.map((r, i) => (
        <View key={i + ':' + r}>
          {i > 0 ? <Hair /> : null}
          <Row
            text={r}
            n={numbered ? i + 1 : null}
            soft={soft}
            ink={ink}
            open={open === i}
            lit={lit === i}
            onLitDone={() => setLit(null)}
            onToggle={() => setOpen(open === i ? null : i)}
            onSave={(t) => apply((cur) => ({ st: listEdit(cur, k, i, t) }))}
            onMove={(d) => {
              apply((cur) => ({ st: listMove(cur, k, i, d) }));
              setOpen(i + d);
            }}
            canUp={i > 0}
            canDown={i < rows.length - 1}
            onRemove={() => {
              const res = listRemove(snap.settings!, k, i);
              if (res.ok) {
                const gone = r;
                say(res.toast, () => apply((cur) => ({ st: listInsert(cur, k, i, gone) })));
                apply({ st: res.st });
                setOpen(null);
              } else say(res.toast);
            }}
          />
        </View>
      ))}
      {adding ? (
        <KeepAbove style={{ gap: 8, paddingVertical: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            placeholder={placeholder}
            placeholderTextColor={c.muted}
            maxLength={L.len}
            multiline={k === 'words'}
            submitBehavior={k === 'words' ? 'newline' : 'submit'}
            returnKeyType="done"
            onSubmitEditing={add}
            accessibilityLabel={addLabel}
            style={[s.editIn, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }]}
          />
          <View style={s.addBtns}>
            <Pressable accessibilityRole="button" onPress={() => (setAdding(false), setDraft(''))} hitSlop={8} style={s.ghost}>
              <T v="label" tone="muted">
                Close
              </T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !draft.trim() }}
              disabled={!draft.trim()}
              onPress={add}
              style={({ pressed }) => [s.addGo, { backgroundColor: c.accent, opacity: !draft.trim() ? 0.5 : pressed ? 0.85 : 1 }]}>
              <T v="label" style={{ color: c.accentInk }}>
                Add
              </T>
            </Pressable>
          </View>
        </KeepAbove>
      ) : rows.length < L.max ? (
        <>
          {rows.length ? <Hair /> : null}
          <PageLink icon="plus" label={addLabel} onPress={() => setAdding(true)} />
        </>
      ) : (
        <T v="small" tone="muted" style={{ paddingVertical: 8 }}>
          The list is full. Remove one to make room.
        </T>
      )}
    </PageSec>
  );
}

function Row({
  text,
  n,
  soft,
  ink,
  open,
  lit,
  onLitDone,
  onToggle,
  onSave,
  onMove,
  canUp,
  canDown,
  onRemove,
}: {
  text: string;
  n: number | null;
  soft: string;
  ink: string;
  open: boolean;
  lit: boolean;
  onLitDone: () => void;
  onToggle: () => void;
  onSave: (t: string) => void;
  onMove: (d: -1 | 1) => void;
  canUp: boolean;
  canDown: boolean;
  onRemove: () => void;
}) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const glow = useRef(new Animated.Value(lit ? 1 : 0)).current;
  const [val, setVal] = useState(text);
  useEffect(() => setVal(text), [text]);
  /* a row that closes (another row opened) keeps what was typed in it */
  const typed = useRef(val);
  typed.current = val;
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open && typed.current !== text) onSave(typed.current);
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  /* the glow: on at once, then it fades over a few seconds */
  useEffect(() => {
    if (!lit) return;
    glow.setValue(1);
    if (reduced) {
      const t = setTimeout(onLitDone, 3200);
      return () => clearTimeout(t);
    }
    const a = Animated.sequence([Animated.delay(1400), Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: false })]);
    a.start(({ finished }) => finished && onLitDone());
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lit, reduced]);
  const bg = glow.interpolate({ inputRange: [0, 1], outputRange: [c.surface, soft] });

  return (
    <Animated.View style={[s.row, lit ? { backgroundColor: bg } : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint="Opens it to reword, move or remove"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={({ pressed }) => [s.rowTop, { opacity: pressed ? 0.6 : 1 }]}>
        {n != null ? <T style={{ fontFamily: font.bodyBold, color: ink, minWidth: 16 }}>{n}</T> : null}
        <T style={{ flex: 1 }}>{text}</T>
        {lit ? (
          <View style={[s.newTag, { backgroundColor: ink }]}>
            <T v="small" style={{ fontFamily: font.bodySemi, color: c.surface }}>
              New
            </T>
          </View>
        ) : (
          <Icon name={open ? 'up' : 'pencil'} size={16} color={c.muted} />
        )}
      </Pressable>
      {open ? (
        <KeepAbove style={{ gap: 4, paddingBottom: 4 }}>
          <TextInput
            value={val}
            onChangeText={setVal}
            onBlur={() => onSave(val)}
            onSubmitEditing={() => onSave(val)}
            multiline
            accessibilityLabel="Reword it"
            style={[s.editIn, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }]}
          />
          <View style={s.tools}>
            <Tool icon="up" label="Up" on={canUp} onPress={() => (onSave(val), onMove(-1))} />
            <Tool icon="down" label="Down" on={canDown} onPress={() => (onSave(val), onMove(1))} />
            <Tool icon="trash" label="Remove" on onPress={onRemove} danger />
            <View style={{ flex: 1 }} />
            <Tool label="Done" on onPress={() => (onSave(val), onToggle())} />
          </View>
        </KeepAbove>
      ) : null}
    </Animated.View>
  );
}

/** an action on an open row: only its words and a small icon */
function Tool({ icon, label, on, onPress, danger }: { icon?: string; label: string; on: boolean; onPress: () => void; danger?: boolean }) {
  const c = useTheme();
  const col = danger ? c.danger : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !on }}
      disabled={!on}
      onPress={onPress}
      style={({ pressed }) => [s.tool, { opacity: !on ? 0.35 : pressed ? 0.6 : 1 }]}>
      {icon ? <Icon name={icon} size={16} color={col} /> : null}
      <T v="small" style={{ fontFamily: font.bodySemi, color: col }}>
        {label}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* the glow reaches a little past the words, so its corners do not touch them */
  row: { marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingVertical: 8 },
  newTag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  editIn: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 21,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  tools: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, alignItems: 'center' },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 4 },
  addBtns: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  ghost: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  addGo: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 20, borderRadius: 999 },
});
