/* A group of choice pills laid out in rows with no wasted room: each pill goes into the first row that has room for it
   (core packRows), instead of plain wrapping, where a short "Nothing" can start a row of its own beside an empty gap.
   The pills stay in their real order as views, so a screen reader reads them in that order, and a radiogroup role on the
   group still holds them; only where each one is drawn changes.
   First draw: the pills are laid out by plain wrapping, unseen, to measure them; then they are placed and shown. After that
   a change of width (rotation), of a pill's size (text size, a check mark) or of the list repacks in place. */
import { packRows } from '@daybook/core';
import { Children, isValidElement, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

type Size = { w: number; h: number };
const near = (a: number, b: number) => Math.abs(a - b) < 0.5;

export function Packed({
  children,
  gap = 8,
  rowGap,
  center,
  last = 0,
  style,
  ...rest
}: ViewProps & {
  children: ReactNode;
  /** the space between pills, across and down; rowGap sets down on its own */
  gap?: number;
  rowGap?: number;
  /** center each row, as the groups that were centered are */
  center?: boolean;
  /** how many items at the end stay in the last row ("Nothing", "None of these", "Add your own"); core noneTail counts them */
  last?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  const keys = items.map((el, i) => String(el.key ?? i));
  const [width, setWidth] = useState(0);
  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const pending = useRef<Record<string, Size>>({});
  const frame = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const down = rowGap ?? gap;

  // sizes arrive one onLayout at a time; gather them and apply once per frame
  const flush = useCallback(() => {
    frame.current = null;
    const add = pending.current;
    pending.current = {};
    setSizes((old) => {
      let changed = false;
      for (const k in add) if (!old[k] || !near(old[k].w, add[k].w) || !near(old[k].h, add[k].h)) changed = true;
      return changed ? { ...old, ...add } : old;
    });
  }, []);
  const measure = (k: string) => (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    pending.current[k] = { w, h };
    if (frame.current == null) frame.current = requestAnimationFrame(flush);
  };
  const onBox = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth((old) => (near(old, w) ? old : w));
  };

  // the first time, wait for every pill; after that, a pill new to the list is measured unseen while the rest stay put
  const shown = useRef(false);
  const ready = width > 0 && (shown.current ? keys.some((k) => sizes[k]) : keys.length > 0 && keys.every((k) => sizes[k]));
  const sig = ready
    ? width + '|' + last + '|' + keys.map((k) => k + ':' + (sizes[k] ? sizes[k].w.toFixed(1) + 'x' + sizes[k].h.toFixed(1) : '?')).join(',')
    : '';
  const place = useMemo(() => {
    if (!ready) return null;
    // only measured pills are placed; "last" counts from the end of those
    const idx = keys.map((k, i) => (sizes[k] ? i : -1)).filter((i) => i >= 0);
    const tail = keys.slice(keys.length - last).filter((k) => sizes[k]).length;
    const rows = packRows(
      idx.map((i) => sizes[keys[i]].w),
      width,
      gap,
      tail,
    ).map((r) => r.map((j) => idx[j]));
    const at: ({ x: number; y: number } | undefined)[] = [];
    let y = 0;
    rows.forEach((r) => {
      const used = r.reduce((n, i) => n + sizes[keys[i]].w, 0) + gap * (r.length - 1);
      let x = center ? Math.max(0, (width - used) / 2) : 0;
      let h = 0;
      r.forEach((i) => {
        at[i] = { x, y };
        x += sizes[keys[i]].w + gap;
        h = Math.max(h, sizes[keys[i]].h);
      });
      y += h + down;
    });
    return { at, height: Math.max(0, y - down) };
    // sig holds everything the packing reads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, gap, down, center, last]);

  if (place) shown.current = true;
  if (!place) {
    // measuring: plain wrapping, unseen, so the room it takes is about right
    return (
      <View
        {...rest}
        onLayout={onBox}
        style={[s.box, style, s.wrap, { columnGap: gap, rowGap: down, justifyContent: center ? 'center' : 'flex-start', opacity: 0 }]}>
        {items.map((el, i) => (
          <View key={keys[i]} onLayout={measure(keys[i])}>
            {el}
          </View>
        ))}
      </View>
    );
  }
  return (
    <View {...rest} onLayout={onBox} style={[s.box, style, { height: place.height }]}>
      {items.map((el, i) => {
        const p = place.at[i];
        return (
          <View
            key={keys[i]}
            onLayout={measure(keys[i])}
            style={[s.item, p ? { transform: [{ translateX: p.x }, { translateY: p.y }] } : s.unseen]}
            pointerEvents={p ? 'auto' : 'none'}>
            {el}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  // the group takes the whole width it is given, as a wrapping row does, even inside a centered column
  box: { alignSelf: 'stretch', position: 'relative' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  // placed by a move, not by left and top, so a pill near the right edge is still measured at its own width
  item: { position: 'absolute', left: 0, top: 0 },
  unseen: { opacity: 0 },
});
