/* The flame on the Home Screen and the Lock Screen (core flame-widget.ts, widgets/flame.tsx). Each time the app opens or the log
   changes, it draws the flame at its level as it burns now and as it will burn over the next days if nothing is done (the same drawing,
   its colors drained and its face sad, as on Today: core lowXml, sadXml), saves the pictures where the widget can read them, and hands
   the widget its timeline. So the widget dims on its own while the app stays closed.
   The pictures are drawn by react-native-svg, the same as the flame on Today, off the screen, one at a time (Skia's SVG reader left
   part of the flame black).
   It also asks the phone whether the widget is on a screen, and the first time it is, the points are earned (core WIDGET_PTS).
   And it keeps the Live Activity (core livePlan, widgets/live.tsx) in step: started when the app opens in the hard hours or before
   screens off (a tapped heads-up opens the app), changed to the flame asleep after Goodnight, ended when its time is up. iPhone only
   lets an app start one while it is open, so that is when this runs. */
import {
  campfireXml,
  emblemLayers,
  emblemXml,
  figAsleep,
  gameCompute,
  livePlan,
  lowXml,
  sadXml,
  widgetTimeline,
  type Snapshot,
  type WidgetEntry,
} from '@daybook/core';
import { Directory, File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import Svg, { parse } from 'react-native-svg';

import FlameWidget from '@/widgets/flame';
import FlameLive from '@/widgets/live';
import { WidgetCheck } from '../../modules/widget-check';

/** the size each picture is drawn at, in points (the phone makes it three times as many pixels): crisp in a small widget, and light */
const PX = 150;
/** the night behind the flame */
const SKY = '#1E1846';

/** low is how low it burns (0 to 1), or ASLEEP for the flame with its eyes closed, for the night */
const ASLEEP = -1;
/** the person's own form standing over its campfire (core campfire.ts; the owner picked it, November 9, 2026): the fire burns as low as
    the flame, its face sad then, and asleep it rests by a fire burned down. small: cut in close, for the Live Activity */
const xmlOf = (level: number, low: number, small = false) => {
  const fig = emblemLayers(level, false)?.fig;
  if (!fig) return low === ASLEEP ? figAsleep(emblemXml(level)) : low > 0 ? lowXml(sadXml(emblemXml(level)), low) : emblemXml(level);
  if (low === ASLEEP) return campfireXml(figAsleep(fig), { lit: 0.5, close: small });
  return lowXml(campfireXml(low > 0 ? sadXml(fig) : fig, { lit: 1 - low, stars: !small, close: small }), low);
};
/** the small size the Live Activity's pictures are drawn at: iPhone shows a gray box in place of a picture too big for one */
const LIVE_PX = 60;
/** the picture's name carries the level and how low, so the widget never shows one it kept from before; small ones end in -s */
const nameOf = (level: number, low: number, small = false) => `flame-c-${level}-${low === ASLEEP ? 'asleep' : Math.round(low * 100)}${small ? '-s' : ''}.png`;
type Pic = { name: string; xml: string; px: number };
/** the pictures a timeline needs: each way it burns for the widget, and the flame as it burns now and asleep, small, for the Live Activity */
const picsOf = (level: number, entries: WidgetEntry[]): Pic[] => [
  ...[...new Set(entries.map((e) => e.low))].map((low) => ({ name: nameOf(level, low), xml: xmlOf(level, low), px: PX })),
  ...[entries[0].low, ASLEEP].map((low) => ({ name: nameOf(level, low, true), xml: xmlOf(level, low, true), px: LIVE_PX })),
];
/** the Live Activity showing now, and which plan it is for (kept across launches) */
const liveNote = () => new File(folder(), 'live.json');
const folder = () => {
  const dir = new Directory(widgetsDirectory);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

/** draws one picture off the screen and gives it back as a PNG in base64 */
function Painter({ xml, px, onDone }: { xml: string; px: number; onDone: (png: string) => void }) {
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
      if (ref.current) ref.current.toDataURL((png) => done.current(png), { width: px, height: px });
      else if (++tries < 20) t = setTimeout(go, 150);
    };
    t = setTimeout(go, 100);
    return () => clearTimeout(t);
  }, [laid, xml, px]);
  return (
    <View style={{ position: 'absolute', left: -2 * PX, top: 0, width: px, height: px }} pointerEvents="none" onLayout={() => setLaid(true)}>
      {ast ? (
        <Svg ref={ref} {...ast.props} width={px} height={px}>
          {ast.children}
        </Svg>
      ) : null}
    </View>
  );
}

type LiveWant = { key: string; img: string; line: string; sub: string; short: string; a: number; b: number; left: string; right: string };
const LIVE_FIELDS = ['img', 'line', 'sub', 'short', 'a', 'b', 'left', 'right'] as const;
/** one change at a time, so two quick changes never cross */
let liveQueue: Promise<unknown> = Promise.resolve();
/** makes the Live Activity match what should show: updated when it is the same plan, started fresh for a new one, ended when none */
async function syncLive(want: LiveWant | null, url: string, to: number) {
  const note = liveNote();
  let was: (LiveWant & { id: string }) | null = null;
  try {
    was = note.exists ? JSON.parse(note.textSync()) : null;
  } catch {
    was = null;
  }
  const all = FlameLive.getInstances();
  const mine = was && all.find((a) => a.getId() === was!.id);
  const props = want
    ? { img: new File(folder(), want.img).uri, line: want.line, sub: want.sub, short: want.short, a: want.a, b: want.b, left: want.left, right: want.right }
    : null;
  if (want && props && mine && was!.key === want.key) {
    if (LIVE_FIELDS.some((f) => was![f] !== want[f])) await mine.update(props, new Date(to));
    note.write(JSON.stringify({ ...want, id: was!.id }));
    return;
  }
  for (const a of all) await a.end('immediate');
  if (!want || !props || to <= Date.now()) {
    if (note.exists) note.delete();
    return;
  }
  const a = FlameLive.start(props, 'daybook://' + url.replace(/^\//, ''), new Date(to));
  note.create({ overwrite: true });
  note.write(JSON.stringify({ ...want, id: a.getId() }));
}

/** keeps the widget showing the flame as it burns, and calls onPlaced once it is first seen on a screen. Gives back the drawing that
    has to be on the screen (off its edge) while a picture is made */
export function useFlameWidget(snap: Snapshot, tk: string, ready: boolean, now: number, onPlaced: () => void): ReactNode {
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
      return picsOf(job.level, job.entries).filter((p) => !new File(dir, p.name).exists);
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
      const keep = new Set(picsOf(job.level, job.entries).map((p) => p.name));
      for (const x of dir.list()) if (x instanceof File && x.name.startsWith('flame-') && !keep.has(x.name)) x.delete();
      FlameWidget.updateTimeline(
        job.entries.map((e) => ({ date: new Date(e.at), props: { img: new File(dir, nameOf(job.level, e.low)).uri, line: e.line, next: e.next, sky: SKY } })),
      );
      sent.current = job.key;
    } catch {
      /* a widget that cannot be drawn simply keeps what it shows */
    }
  }, [job, missing]);
  /* the Live Activity: the plan for now, against what is showing */
  const drawnAll = !!job && !missing.length;
  const plan = ready ? livePlan(snap.days, snap.settings, tk, now) : null;
  const want =
    plan && job
      ? {
          key: plan.key,
          img: nameOf(job.level, plan.asleep ? ASLEEP : job.entries[0].low, true),
          line: plan.line,
          sub: plan.sub,
          short: plan.short,
          ...plan.bar,
        }
      : null;
  const wantKey = want ? JSON.stringify(want) : '';
  useEffect(() => {
    /* only once the log is read and the pictures are drawn: before that, nothing is known, and ending it then made it flicker away
       each time the app opened (a tap on it opens the app) */
    if (!ready || !drawnAll) return;
    const url = plan?.url ?? '/';
    const to = plan?.to ?? 0;
    liveQueue = liveQueue.then(() => syncLive(want, url, to)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, wantKey, drawnAll]);
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
  const pic = missing[0];
  return (
    <Painter
      key={pic.name}
      xml={pic.xml}
      px={pic.px}
      onDone={(png) => {
        try {
          const f = new File(folder(), pic.name);
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
