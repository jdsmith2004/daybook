/* Fitting a page on a short phone without scrolling. A screen's scroll area (SceneFrame, the lesson card) measures its room
   and how tall its content is; a picture inside it (FitArt) shrinks by as much as the page would overflow, down to a floor,
   so the words keep their size and the main button stays in reach. On a tall phone nothing changes. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dimensions, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

/** a short phone: the web on a phone, with the browser's bars (about 664 points tall), or a small phone. Pages tighten a little. */
export const SHORT = Dimensions.get('window').height < 760;

interface Fit {
  /** how far the page runs past its room, with the pictures at full size (0 when it fits) */
  over: number;
  /** a picture says its full height and the height it has now */
  report: (id: number, full: number, now: number) => void;
}
const FitCtx = createContext<Fit | null>(null);

/** for a scroll area: pass onLayout and onContentSizeChange to the ScrollView, and wrap its content in FitProvider with ctx */
export function useFitRoom() {
  const [room, setRoom] = useState(0);
  const [content, setContent] = useState(0);
  const arts = useRef(new Map<number, { full: number; now: number }>());
  const [, bump] = useState(0);
  const report = useCallback((id: number, full: number, now: number) => {
    const was = arts.current.get(id);
    if (was && Math.abs(was.full - full) < 1 && Math.abs(was.now - now) < 1) return;
    if (full <= 0) arts.current.delete(id);
    else arts.current.set(id, { full, now });
    bump((n) => n + 1);
  }, []);
  /* the content as it would be with every picture at full size, so shrinking a picture does not change the answer */
  let gap = 0;
  arts.current.forEach((a) => (gap += a.full - a.now));
  const over = room && content ? Math.max(0, Math.round(content + gap - room)) : 0;
  const ctx = useMemo(() => ({ over, report }), [over, report]);
  return {
    onLayout: (e: LayoutChangeEvent) => setRoom(e.nativeEvent.layout.height),
    onContentSizeChange: (_w: number, h: number) => setContent(h),
    ctx,
  };
}
export function FitProvider({ value, children }: { value: Fit; children: ReactNode }) {
  return <FitCtx.Provider value={value}>{children}</FitCtx.Provider>;
}

let nextId = 1;
/** a picture that gives up height when the page would not fit. min: the smallest it gets, as a share of its full height */
export function FitArt({
  children,
  min = 0.45,
  drop,
  stretch,
  style,
}: {
  children: ReactNode;
  min?: number;
  /** below this share of its full height, the picture steps aside instead of shrinking into a scribble */
  drop?: number;
  /** the picture spans the width (bars, rows) */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fit = useContext(FitCtx);
  const id = useRef(nextId++).current;
  const [full, setFull] = useState(0);
  const over = fit ? fit.over : 0;
  /* other pictures on the page share the shrinking; one picture per page is the usual case */
  const want = full - over;
  const gone = !!full && drop != null && want < full * drop;
  const now = !full ? 0 : gone ? 0 : Math.max(full * min, want);
  const k = full && !gone ? now / full : 1;
  const report = fit && fit.report;
  useEffect(() => {
    if (report && full) report(id, full, now);
  }, [report, id, full, now]);
  useEffect(() => () => report?.(id, 0, 0), [report, id]);
  return (
    <View
      style={[
        { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
        full ? { height: now } : null,
        gone && { overflow: 'hidden', opacity: 0 },
        style,
      ]}
      importantForAccessibility={gone ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={gone}>
      <View
        style={[{ transform: [{ scale: k }], alignItems: 'center' }, stretch && { alignSelf: 'stretch' }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (Math.abs(h - full) > 1) setFull(h);
        }}>
        {children}
      </View>
    </View>
  );
}
