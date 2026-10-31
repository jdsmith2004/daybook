/* The screenshot studio (dev only, web only, EXPO_PUBLIC_SHOTS=1): one store image at its exact size. The real app runs in a
   phone-sized frame (an iframe of this same build, on the demo log), with a caption above it on a brand background.
   Everything about the look is in config.ts. URL params:
     size     a key of SIZES (ios69, ios63, play-phone, play-feature, ios-header, ios-search)
     screen   the app path to show, like / or /learn (screen2, screen3: more phones in the wide layouts)
     caption  the headline; sub: a smaller line under it; head: the headline's size, as a share of the width (default CAPTION.head)
     bg       a key of BACKGROUNDS; theme: light or dark (the app's own theme inside the phone)
     pan      this shot's place in the set, so the hills run on across the edges; bgL, bgR: the skies of the shots on either side, for the sky to drift into
     at       the moment the demo log is seen at (default DEMO.at); scroll: how far down the screen to start
     zoom     the phone's width as a share of the shot's (default FRAME.width); a big phone runs off the bottom edge
     top      where the phone starts, as a share of the shot's height (default CAPTION.phoneTop)
     playTop  the same on the Play sizes, where the caption takes more of the height
     tilt     the phone turned this many degrees; below: the words under the phone, which hangs from the top of the shot
     forms    the flame's forms in a rising row above the phone, as a comma list of levels
     hero     the flame of this level, big, rising behind the phone
     pic      in place of the live app, a picture of it from the iPhone simulator (scripts/shots-ios.ts), for the iPhone sizes: only there is Apple's
              glass tab bar real (pic2, pic3 go with screen2, screen3)
   When the image is ready to capture, window.__shotsReady is true (scripts/shots.ts waits for it). */
import { emblemLayers, flameFigureSvg } from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { createElement as h, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { BACKGROUNDS, CAPTION, DEMO, FONTS, FRAME, SIZES, type Bg, type Size } from './config';

type Params = Record<string, string | undefined>;
const STARS = [
  [0.08, 0.06, 2],
  [0.22, 0.13, 1.4],
  [0.38, 0.04, 1.6],
  [0.62, 0.09, 1.2],
  [0.8, 0.05, 2],
  [0.92, 0.16, 1.4],
  [0.13, 0.24, 1.2],
  [0.86, 0.3, 1.6],
  [0.5, 0.18, 1],
  [0.7, 0.22, 1.2],
];

declare global {
  interface Window {
    __shotsReady?: boolean;
  }
}

export default function Studio() {
  const p = useLocalSearchParams() as Params;
  const size: Size = SIZES[p.size || 'ios69'] || SIZES.ios69;
  const bg: Bg = BACKGROUNDS[p.bg || 'night'] || BACKGROUNDS.night;
  const W = size.w / size.scale;
  const H = size.h / size.scale;
  const screens = [p.pic || p.screen, p.pic2 || p.screen2, p.pic3 || p.screen3].filter((x): x is string => !!x);
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    window.__shotsReady = false;
  }, []);
  useEffect(() => {
    if (loaded >= Math.max(1, screens.length) || (!screens.length && loaded === 0)) {
      const t = setTimeout(() => (window.__shotsReady = true), screens.length ? 400 : 800);
      return () => clearTimeout(t);
    }
  }, [loaded, screens.length]);
  const onReady = () => setLoaded((n) => n + 1);
  const page: CSSProperties = { position: 'fixed', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: bg.sky[1], zIndex: 9999 };
  const pan = Number(p.pan || 0);
  const left = BACKGROUNDS[p.bgL || ''];
  const right = BACKGROUNDS[p.bgR || ''];
  /* the sky: this shot's own in the middle, half way to each neighbor at the edges, so two shots side by side are one picture */
  const land = [
    left ? <Land key="l" bg={left} W={W} H={H} pan={pan} mask="linear-gradient(90deg, rgba(0,0,0,.5), rgba(0,0,0,0) 45%)" /> : null,
    right ? <Land key="r" bg={right} W={W} H={H} pan={pan} mask="linear-gradient(90deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.5))" /> : null,
  ];
  const stars = bg.stars
    ? STARS.map(([x, y, r], i) =>
        h('div', {
          key: i,
          style: {
            position: 'absolute',
            left: x * W,
            top: y * H,
            width: r * (W / 300),
            height: r * (W / 300),
            borderRadius: 99,
            background: '#fff',
            opacity: 0.8,
          },
        }),
      )
    : null;
  const body =
    size.kind === 'phone' ? (
      <PhoneShot p={p} size={size} bg={bg} W={W} H={H} screens={screens} onReady={onReady} />
    ) : (
      <WideShot p={p} bg={bg} W={W} H={H} screens={screens} device={size.device || 'iphone'} onReady={onReady} />
    );
  return h('div', { style: page, 'data-shot': p.size || 'ios69' }, <Land bg={bg} W={W} H={H} pan={pan} />, stars, land, body);
}

/* one sky and its hills. The hills are one line across the whole set, so they meet at the edges of every shot. */
function Land({ bg, W, H, pan, mask }: { bg: Bg; W: number; H: number; pan: number; mask?: string }) {
  const crest = (x: number, base: number, a: number, b: number) => H * base + W * (a * Math.sin((pan + x) * b) + (a / 2) * Math.sin((pan + x) * b * 2.3 + 1));
  const hill = (base: number, a: number, b: number) => {
    const pts = Array.from({ length: 41 }, (_, i) => `${(i / 40) * W} ${crest(i / 40, base, a, b).toFixed(1)}`);
    return `M${pts.join('L')}L${W} ${H}L0 ${H}Z`;
  };
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(in oklch 180deg, ${bg.sky[0]} 0%, ${bg.sky[1]} 52%, ${bg.sky[2]} 100%)`,
        maskImage: mask,
        WebkitMaskImage: mask,
      },
    },
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <path d={hill(0.8, 0.05, 1.7)} fill={bg.hill[0]} />
      <path d={hill(0.88, 0.04, 2.4)} fill={bg.hill[1]} />
    </svg>,
  );
}

function Caption({ p, bg, W, align = 'center', scale = 1 }: { p: Params; bg: Bg; W: number; align?: 'center' | 'left'; scale?: number }) {
  return h(
    'div',
    { style: { textAlign: align, display: 'flex', flexDirection: 'column', gap: W * CAPTION.gap * scale } },
    p.caption
      ? h(
          'div',
          {
            style: {
              fontFamily: FONTS.head,
              fontSize: W * Number(p.head || CAPTION.head) * scale,
              lineHeight: 1.08,
              color: bg.ink,
              letterSpacing: -0.3,
              textWrap: 'balance',
              whiteSpace: 'pre-line',
            } as CSSProperties,
          },
          p.caption,
        )
      : null,
    p.sub
      ? h(
          'div',
          {
            style: {
              fontFamily: FONTS.body,
              fontSize: W * CAPTION.sub * scale,
              lineHeight: 1.3,
              color: bg.sub,
              textWrap: 'balance',
              whiteSpace: 'pre-line',
            } as CSSProperties,
          },
          p.sub,
        )
      : null,
  );
}

function PhoneShot({ p, size, bg, W, H, screens, onReady }: { p: Params; size: Size; bg: Bg; W: number; H: number; screens: string[]; onReady: () => void }) {
  /* a Play shot is shorter than the phone: the phone stands whole on it, at the usual width, with the words over it, so Android's own tab bar shows */
  const android = size.device === 'android';
  const top = H * Number((android && p.playTop) || p.top || CAPTION.phoneTop);
  const below = !android && p.below;
  const caption = h(
    'div',
    {
      key: 'cap',
      style: {
        position: 'absolute',
        left: W * CAPTION.side,
        right: W * CAPTION.side,
        ...(below ? { bottom: W * CAPTION.top } : { top: W * CAPTION.top }),
        zIndex: 2,
      },
    },
    <Caption p={p} bg={bg} W={W} />,
  );
  const pw = W * (android ? 0.72 : Number(p.zoom || FRAME.width));
  const levels = (p.forms || '').split(',').filter(Boolean).map(Number);
  return h(
    'div',
    null,
    caption,
    p.hero && !android ? <Hero level={Number(p.hero)} W={W} y={top - W * 0.68} /> : null,
    levels.length ? <Forms levels={levels} W={W} y={W * CAPTION.top + W * CAPTION.head * 1.2 * Number(p.lines || 2) + W * 0.05} /> : null,
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: (W - pw) / 2,
          top,
          transform: !android && p.tilt ? `rotate(${p.tilt}deg)` : undefined,
          transformOrigin: '50% 20%',
        },
      },
      <Phone width={pw} device={size.device || 'iphone'} screen={screens[0] || '/'} p={p} onReady={onReady} fit={android ? H - top - W * 0.05 : undefined} />,
    ),
  );
}

/* the flame itself, big, rising behind the phone. Only its figure and glow: the sky stays the shot's. */
function Hero({ level, W, y }: { level: number; W: number; y: number }) {
  const l = useMemo(() => emblemLayers(level, true), [level]);
  const size = W * 1.06;
  if (!l) return null;
  return h(
    'div',
    { style: { position: 'absolute', left: (W - size) / 2, top: y, width: size, height: size } },
    [l.glow, l.fig].map((svg, i) =>
      h('div', {
        key: i,
        style: { position: 'absolute', inset: 0 },
        dangerouslySetInnerHTML: { __html: svg.replace('<svg ', '<svg width="100%" height="100%" ') },
      }),
    ),
  );
}

/* the flame's real forms, rising from left to right, only the figures on the shot's own sky: the last is the biggest */
function Forms({ levels, W, y }: { levels: number[]; W: number; y: number }) {
  const n = levels.length;
  const layers = useMemo(() => levels.map((l) => emblemLayers(l, true)), [levels.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const big = W * 0.46;
  const small = W * 0.2;
  const sizes = levels.map((_, i) => small + (big - small) * (i / (n - 1)) ** 1.3);
  const gap = (W * 1.02 - sizes.reduce((a, b) => a + b, 0)) / (n - 1);
  let x = -W * 0.01;
  return h(
    'div',
    null,
    layers.map((l, i) => {
      const at = x;
      x += sizes[i] + gap;
      return l ? (
        <div key={i} style={{ position: 'absolute', left: at, top: y + big - sizes[i], width: sizes[i], height: sizes[i] }}>
          {[l.glow, l.fig].map((svg, j) =>
            h('div', {
              key: j,
              style: { position: 'absolute', inset: 0 },
              dangerouslySetInnerHTML: { __html: svg.replace('<svg ', '<svg width="100%" height="100%" ') },
            }),
          )}
        </div>
      ) : null;
    }),
  );
}

/* the wide images: the Play feature graphic and the App Store header and search card. With one screen, the words sit on the
   left and the phone on the right. With more, the phones stand in a row under the words. With none, the flame is the picture. */
function WideShot({
  p,
  bg,
  W,
  H,
  screens,
  device,
  onReady,
}: {
  p: Params;
  bg: Bg;
  W: number;
  H: number;
  screens: string[];
  device: 'iphone' | 'android';
  onReady: () => void;
}) {
  if (screens.length >= 2) {
    const pw = Math.min(W * 0.2, H * 0.46);
    return h(
      'div',
      null,
      h('div', { style: { position: 'absolute', left: W * 0.1, right: W * 0.1, top: H * 0.07 } }, <Caption p={p} bg={bg} W={H * 0.9} />),
      h(
        'div',
        { style: { position: 'absolute', left: 0, right: 0, top: H * 0.34, display: 'flex', justifyContent: 'center', gap: pw * 0.16 } },
        screens.map((s, i) => <Phone key={s + i} width={pw} device={device} screen={s} p={p} onReady={onReady} />),
      ),
    );
  }
  if (screens.length === 1) {
    const pw = H * 0.5;
    return h(
      'div',
      null,
      h(
        'div',
        {
          style: {
            position: 'absolute',
            left: W * 0.08,
            width: W * 0.5,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: H * 0.04,
          },
        },
        <Flame width={H * 0.2} />,
        <Caption p={p} bg={bg} W={H * 1.15} align="left" />,
      ),
      h(
        'div',
        { style: { position: 'absolute', right: W * 0.1, top: H * 0.12 } },
        <Phone width={pw} device={device} screen={screens[0]} p={p} onReady={onReady} />,
      ),
    );
  }
  return h(
    'div',
    { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: H * 0.05 } },
    <Flame width={H * 0.42} />,
    h('div', { style: { maxWidth: W * 0.6 } }, <Caption p={p} bg={bg} W={H * 1.1} />),
  );
}

function Flame({ width }: { width: number }) {
  const svg = useMemo(() => flameFigureSvg(), []);
  return h('div', {
    style: { width, height: width * (140 / 120) },
    dangerouslySetInnerHTML: { __html: svg.replace('<svg ', '<svg width="100%" height="100%" ') },
  });
}

/* a phone with the real app inside: the app is laid out at the viewport size and scaled to fit the screen */
function Phone({
  width,
  device,
  screen,
  p,
  onReady,
  fit,
}: {
  width: number;
  device: 'iphone' | 'android';
  screen: string;
  p: Params;
  onReady: () => void;
  /** the room for the whole phone, so it ends on the shot and its tab bar shows */
  fit?: number;
}) {
  const f = FRAME[device];
  const bez = width * f.bezel;
  const sw = width - bez * 2;
  const s = sw / FRAME.viewport.w;
  const pic = screen.endsWith('.png');
  const viewH = fit ? Math.min(FRAME.viewport.h, (fit - bez * 2) / s) : FRAME.viewport.h;
  const sh = pic ? sw * FRAME.picRatio : viewH * s;
  const dark = p.theme === 'dark';
  const appBg = dark ? '#17142B' : '#FFF8EB';
  const ink = dark ? '#FFFFFF' : '#1A1530';
  const status = f.statusH;
  const frame = useRef<HTMLIFrameElement | null>(null);
  const q = new URLSearchParams({ theme: dark ? 'dark' : 'light', at: p.at || DEMO.at, device });
  const src = screen + (screen.includes('?') ? '&' : '?') + q.toString();
  const settle = () => {
    const w = frame.current?.contentWindow as (Window & typeof globalThis) | null | undefined;
    const doc = frame.current?.contentDocument;
    if (!w || !doc) return onReady();
    const start = Date.now();
    const poll = () => {
      const fontsOk = doc.fonts ? doc.fonts.status === 'loaded' : true;
      const imgsOk = [...doc.images].every((i) => i.complete);
      const drawn = (doc.getElementById('root')?.innerText || '').trim().length > 20;
      if ((fontsOk && imgsOk && drawn) || Date.now() - start > 15000) {
        setTimeout(() => {
          const y = Number(p.scroll || 0);
          if (y) {
            let e = doc.elementFromPoint(FRAME.viewport.w / 2, FRAME.viewport.h / 2) as HTMLElement | null;
            while (e && !(e.scrollHeight > e.clientHeight + 20 && /(auto|scroll)/.test(w.getComputedStyle(e).overflowY))) e = e.parentElement;
            if (e) e.scrollTop = y;
          }
          setTimeout(onReady, 300);
        }, 1600);
      } else setTimeout(poll, 100);
    };
    poll();
  };
  const screenBox: CSSProperties = {
    position: 'absolute',
    left: bez,
    top: bez,
    width: sw,
    height: sh,
    borderRadius: width * (f.radius - f.bezel * 0.6),
    overflow: 'hidden',
    background: appBg,
  };
  const children: ReactNode[] = pic
    ? /* the picture already has its status bar and its island */
      [h('img', { key: 'app', src: screen, onLoad: onReady, onError: onReady, style: { position: 'absolute', left: 0, top: 0, width: sw, height: sh } })]
    : [
        /* the app, under the status bar */
        h('iframe', {
          key: 'app',
          ref: frame,
          src,
          onLoad: settle,
          scrolling: 'no',
          style: {
            position: 'absolute',
            left: 0,
            top: status * s,
            width: FRAME.viewport.w,
            height: viewH - status,
            border: 0,
            transform: `scale(${s})`,
            transformOrigin: '0 0',
            background: appBg,
          },
        }),
        <StatusBar key="sb" s={s} ink={ink} device={device} h={status} />,
      ];
  if (f.homeBar)
    children.push(
      h('div', {
        key: 'home',
        style: {
          position: 'absolute',
          left: '50%',
          bottom: 8 * s,
          width: 134 * s,
          height: 5 * s,
          marginLeft: -67 * s,
          borderRadius: 9,
          background: ink,
          opacity: 0.85,
        },
      }),
    );
  /* the shadow is its own blurred shape: a big box-shadow comes out in the picture with visible square patches around the phone */
  const box: CSSProperties = { position: 'absolute', inset: 0, borderRadius: width * f.radius };
  return h(
    'div',
    { style: { position: 'relative', width, height: sh + bez * 2 } },
    h('div', { style: { ...box, background: FRAME.shadow.color, transform: `translateY(${FRAME.shadow.y}px)`, filter: `blur(${FRAME.shadow.blur}px)` } }),
    h(
      'div',
      { style: { ...box, background: f.body, boxShadow: `inset 0 0 0 ${Math.max(1, width * 0.006)}px ${f.edge}` } },
      h('div', { style: screenBox }, ...children),
    ),
  );
}

/* the status bar the frame draws over the app's top edge: the time, then signal, wifi and battery */
function StatusBar({ s, ink, device, h: hh }: { s: number; ink: string; device: 'iphone' | 'android'; h: number }) {
  const ios = device === 'iphone';
  const fs = (ios ? 17 : 14) * s;
  const icons = `<svg viewBox="0 0 72 14" width="${72 * s}" height="${14 * s}"><g fill="${ink}"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/><path d="M32 13.5l-3-3.4a4.4 4.4 0 016 0zM26 7.6a8.6 8.6 0 0112 0l-1.8 2a6 6 0 00-8.4 0zM23 4.6a12.8 12.8 0 0118 0l-1.8 2a10.2 10.2 0 00-14.4 0z"/><rect x="46" y="1" width="22" height="12" rx="3.5" fill="none" stroke="${ink}" stroke-opacity=".45" stroke-width="1.2"/><rect x="48" y="3" width="16" height="8" rx="2"/><rect x="69.5" y="5" width="1.6" height="4" rx=".8" fill-opacity=".45"/></g></svg>`;
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: hh * s,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${(ios ? 30 : 22) * s}px`,
      },
    },
    h('div', { style: { fontFamily: FONTS.body, fontWeight: 600, fontSize: fs, color: ink, paddingTop: (ios ? 6 : 2) * s } }, ios ? '9:41' : '9:41'),
    ios
      ? h('div', {
          style: {
            position: 'absolute',
            left: '50%',
            top: 11 * s,
            width: 122 * s,
            height: 35 * s,
            marginLeft: -61 * s,
            borderRadius: 30 * s,
            background: '#000',
          },
        })
      : h('div', {
          style: {
            position: 'absolute',
            left: '50%',
            top: 10 * s,
            width: 12 * s,
            height: 12 * s,
            marginLeft: -6 * s,
            borderRadius: 12 * s,
            background: '#000',
          },
        }),
    h('div', { style: { paddingTop: (ios ? 6 : 2) * s }, dangerouslySetInnerHTML: { __html: icons } }),
  );
}
