/* One of my lists (calm moves, the wind-down, words that steady me) as rows you can see: tap a row to reword, move or remove
   it, and "Add" puts a new one at the end. A row just added (from a lesson, or here) glows for a moment so it is easy to find. */
import { listAdd, listEdit, listMove, listRemove, LISTS, type ListKey } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';

import { Card, Icon, T } from '@/components/ui';
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
    <View onLayout={onLayout}>
    <Card>
      <View style={s.head}>
        <View style={[s.headIc, { backgroundColor: soft }]}>
          <Icon name={icon} size={22} color={ink} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h2">{title}</T>
          <T v="small" tone="muted">
            {sub}
          </T>
        </View>
        <T v="small" tone="muted">
          {rows.length} of {L.max}
        </T>
      </View>
      <View style={{ gap: 8 }}>
        {rows.length ? null : (
          <T tone="muted" style={{ paddingVertical: 4 }}>
            Nothing here yet. Add the first one.
          </T>
        )}
        {rows.map((r, i) => (
          <Row
            key={i + ':' + r}
            text={r}
            n={numbered ? i + 1 : null}
            icon={icon}
            soft={soft}
            ink={ink}
            open={open === i}
            lit={lit === i}
            onLitDone={() => setLit(null)}
            onToggle={() => setOpen(open === i ? null : i)}
            onSave={(t) => apply({ st: listEdit(snap.settings!, k, i, t) })}
            onMove={(d) => {
              apply({ st: listMove(snap.settings!, k, i, d) });
              setOpen(i + d);
            }}
            canUp={i > 0}
            canDown={i < rows.length - 1}
            onRemove={() => {
              const res = listRemove(snap.settings!, k, i);
              say(res.toast);
              if (res.ok) {
                apply({ st: res.st });
                setOpen(null);
              }
            }}
          />
        ))}
        {adding ? (
          <View style={[s.addBox, { borderColor: c.accent, backgroundColor: c.surface }]}>
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
              style={[s.addIn, { color: c.ink }]}
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
                <Icon name="plus" size={18} color={c.accentInk} />
                <T v="label" style={{ color: c.accentInk }}>
                  Add
                </T>
              </Pressable>
            </View>
          </View>
        ) : rows.length < L.max ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setAdding(true)}
            style={({ pressed }) => [s.addRow, { borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
            <Icon name="plus" size={20} color={c.accentText} />
            <T v="label" style={{ color: c.accentText }}>
              {addLabel}
            </T>
          </Pressable>
        ) : (
          <T v="small" tone="muted">
            The list is full. Remove one to make room.
          </T>
        )}
      </View>
    </Card>
    </View>
  );
}

function Row({
  text,
  n,
  icon,
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
  icon: string;
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
  const bg = glow.interpolate({ inputRange: [0, 1], outputRange: [c.surface2, soft] });
  const edge = glow.interpolate({ inputRange: [0, 1], outputRange: [open ? c.accent : 'transparent', ink] });

  return (
    <Animated.View style={[s.row, { backgroundColor: lit ? bg : c.surface2, borderColor: lit ? edge : open ? c.accent : 'transparent' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityHint="Opens it to reword, move or remove" accessibilityState={{ expanded: open }} onPress={onToggle} style={s.rowTop}>
        <View style={[s.rowIc, { backgroundColor: soft }]}>
          {n != null ? <T style={{ fontFamily: font.bodyBold, fontSize: 13, color: ink }}>{n}</T> : <Icon name={icon} size={16} color={ink} />}
        </View>
        <T style={{ flex: 1 }}>{text}</T>
        {lit ? (
          <View style={[s.newTag, { backgroundColor: ink }]}>
            <T v="small" style={{ fontFamily: font.bodyBold, color: c.surface }}>
              New
            </T>
          </View>
        ) : (
          <Icon name={open ? 'up' : 'pencil'} size={16} color={c.muted} />
        )}
      </Pressable>
      {open ? (
        <View style={{ gap: 10, paddingTop: 4 }}>
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
            <Tool icon="check" label="Done" on onPress={() => (onSave(val), onToggle())} />
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

function Tool({ icon, label, on, onPress, danger }: { icon: string; label: string; on: boolean; onPress: () => void; danger?: boolean }) {
  const c = useTheme();
  const col = danger ? c.danger : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !on }}
      disabled={!on}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.tool, { borderColor: c.line, backgroundColor: c.surface, opacity: !on ? 0.4 : pressed ? 0.8 : 1 }]}>
      <Icon name={icon} size={16} color={col} />
      <T v="small" style={{ fontFamily: font.bodySemi, color: col }}>
        {label}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { borderRadius: 16, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  rowIc: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  newTag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  editIn: { fontFamily: font.body, fontSize: 15, lineHeight: 21, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed' },
  addBox: { borderWidth: 2, borderRadius: 16, padding: 10, gap: 8 },
  addIn: { fontFamily: font.body, fontSize: 15, lineHeight: 21, minHeight: 40, paddingHorizontal: 4 },
  addBtns: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  ghost: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 },
  addGo: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 16, borderRadius: 999 },
});
