/* The flame on the Home Screen and the Lock Screen (core flame-widget.ts, widgets/flame.tsx). Each time the app opens or the log
   changes, it draws the flame at its level as it burns now and as it will burn over the next days if nothing is done (the same drawing,
   its colors drained and its face sad, as on Today: core lowXml, sadXml), saves the pictures where the widget can read them, and hands
   the widget its timeline. So the widget dims on its own while the app stays closed.
   The pictures are drawn by react-native-svg, the same as the flame on Today, off the screen, one at a time (Skia's SVG reader left
   part of the flame black).
   It also asks the phone whether the widget is on a screen, and the first time it is, the points are earned (core WIDGET_PTS). */
import { emblemXml, gameCompute, lowXml, sadXml, widgetTimeline, type Snapshot, type WidgetEntry } from '@daybook/core';
import { Directory, File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import Svg, { parse } from 'react-native-svg';

import FlameWidget from '@/widgets/flame';
import { WidgetCheck } from '../../modules/widget-check';

/** the size each picture is drawn at, in points (the phone makes it three times as many pixels): crisp in a small widget, and light */
const PX = 150;
/** the night behind the flame */
const SKY = '#1E1846';

const xmlOf = (level: number, low: number) => (low > 0 ? lowXml(sadXml(emblemXml(level)), low) : emblemXml(level));
/** the picture's name carries the level and how low, so the widget never shows one it kept from before */
const nameOf = (level: number, low: number) => `flame-${level}-${Math.round(low * 100)}.png`;
const folder = () => {
  const dir = new Directory(widgetsDirectory);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

/** draws one picture off the screen and gives it back as a PNG in base64 */
function Painter({ xml, onDone }: { xml: string; onDone: (png: string) => void }) {
  const ref = useRef<Svg>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const ast = useMemo(() => parse(xml), [xml]);
  /* once it is laid out, asked for its picture; tried again a few times while the drawing is not ready */
  const [laid, setLaid] = useState(false);
  useEffect(() => {
    if (!laid) return;
    let tries = 0;
    let t: ReturnType<typeof setTimeout>;
    const go = () => {
      if (ref.current) ref.current.toDataURL((png) => done.current(png), { width: PX, height: PX });
      else if (++tries < 20) t = setTimeout(go, 150);
    };
    t = setTimeout(go, 100);
    return () => clearTimeout(t);
  }, [laid, xml]);
  return (
    <View style={{ position: 'absolute', left: -2 * PX, top: 0, width: PX, height: PX }} pointerEvents="none" onLayout={() => setLaid(true)}>
      {ast ? (
        <Svg ref={ref} {...ast.props} width={PX} height={PX}>
          {ast.children}
        </Svg>
      ) : null}
    </View>
  );
}

/** keeps the widget showing the flame as it burns, and calls onPlaced once it is first seen on a screen. Gives back the drawing that
    has to be on the screen (off its edge) while a picture is made */
export function useFlameWidget(snap: Snapshot, tk: string, ready: boolean, onPlaced: () => void): ReactNode {
  const placed = useRef(onPlaced);
  placed.current = onPlaced;
  const earned = !!snap.settings?.widget;
  const [job, setJob] = useState<{ key: string; level: number; entries: WidgetEntry[] } | null>(null);
  const [drawn, setDrawn] = useState(0);
  const sent = useRef('');
  useEffect(() => {
    if (!ready || !snap.settings) return;
    const entries = widgetTimeline(snap.days, snap.settings, tk, Date.now());
    const level = gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n;
    const key = level + '|' + entries.map((e) => e.at + e.state).join(',');
    setJob((j) => (j?.key === key ? j : { key, level, entries }));
  }, [ready, snap.days, snap.settings, snap.reviews, tk]);
  /* the pictures this timeline needs that are not drawn yet */
  const missing = useMemo(() => {
    if (!job) return [];
    try {
      const dir = folder();
      return [...new Set(job.entries.map((e) => e.low))].filter((low) => !new File(dir, nameOf(job.level, low)).exists);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, drawn]);
  /* all drawn: old pictures go, and the widget gets its timeline */
  useEffect(() => {
    if (!job || missing.length || sent.current === job.key) return;
    try {
      const dir = folder();
      const keep = new Set(job.entries.map((e) => nameOf(job.level, e.low)));
      for (const x of dir.list()) if (x instanceof File && x.name.startsWith('flame-') && !keep.has(x.name)) x.delete();
      FlameWidget.updateTimeline(
        job.entries.map((e) => ({ date: new Date(e.at), props: { img: new File(dir, nameOf(job.level, e.low)).uri, line: e.line, sky: SKY } })),
      );
      sent.current = job.key;
    } catch {
      /* a widget that cannot be drawn simply keeps what it shows */
    }
  }, [job, missing]);
  /* on a screen yet? asked each time the app comes back, until it is */
  useEffect(() => {
    if (!ready || earned || !WidgetCheck) return;
    const ask = () =>
      WidgetCheck!
        .placed()
        .then((f) => f.length > 0 && placed.current())
        .catch(() => undefined);
    ask();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && ask());
    return () => sub.remove();
  }, [ready, earned]);
  if (!job || !missing.length) return null;
  const low = missing[0];
  const level = job.level;
  return (
    <Painter
      key={nameOf(level, low)}
      xml={xmlOf(level, low)}
      onDone={(png) => {
        try {
          const f = new File(folder(), nameOf(level, low));
          f.create({ overwrite: true });
          f.write(png, { encoding: 'base64' });
        } catch {
          /* tried again the next time the app opens */
        }
        setDrawn((n) => n + 1);
      }}
    />
  );
}
