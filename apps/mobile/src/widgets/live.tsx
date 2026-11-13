/* The Live Activity on iPhone (core live-activity.ts): the flame on the Lock Screen and in the Dynamic Island, during SOS, in the
   hard hours and at night. Redesigned on Duolingo's model (the owner, November 13, 2026: "they don't tell us its for sos ... i press
   them and they open sos for no reason"): every card says what it is in one plain line, shows one live number big with what it
   means under it, the flame big on the right in the mood of the moment, and a button that says where a tap goes. A tap anywhere on
   the card goes to that same place.

   All the words come from core (liveProps): each card has two faces, and iPhone turns to the second (the props ending in 2) at
   Apple's stale date, when the moment changes while the app is shut (the hard hours begin, screens off passes, morning comes).
   The live number is a timer iPhone runs itself, so the card stays true with the app closed.

   The Dynamic Island reads on its own: compact is who and the number (the ride says SOS in its red, since that is what it is),
   minimal is the flame (SOS for the ride), and the long press is the card, smaller.
   One small flame picture, the same everywhere (lib/flame-widget), and few layers: a Live Activity has little memory. This
   function runs on its own inside the widget (expo-widgets): every color and size is written inside it. */
import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  aspectRatio,
  background,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  resizable,
  shadow,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

/** core liveProps, and the flame's picture */
export type FlameLiveProps = {
  /** 'ride', 'hard' or 'night' */
  kind?: string;
  /** 1 when the flame is asleep (after Good night) */
  asleep?: number;
  /** the picture of the flame, a file:// path in the shared folder */
  img: string;
  /** the face: its head, the big word when there is no clock, the note, the button and where it goes, SOS beside it, the clock */
  h?: string;
  big?: string;
  n?: string;
  act?: string;
  go?: string;
  sos?: number;
  ca?: number;
  cb?: number;
  cd?: string;
  /** the same for the face it turns to by itself */
  h2?: string;
  big2?: string;
  n2?: string;
  act2?: string;
  go2?: string;
  sos2?: number;
  ca2?: number;
  cb2?: number;
  cd2?: string;
};

const FlameLive = (props: FlameLiveProps, environment: LiveActivityEnvironment) => {
  'widget';
  const WARM = '#FFB347';
  const SOFT = '#C9C2EC';
  const NIGHT = '#16123A';
  const LAV = '#B9ADFF';
  const later = !!environment.isStale;
  const f = later
    ? { h: props.h2, big: props.big2, n: props.n2, act: props.act2, go: props.go2, sos: props.sos2, ca: props.ca2, cb: props.cb2, cd: props.cd2 }
    : { h: props.h, big: props.big, n: props.n, act: props.act, go: props.go, sos: props.sos, ca: props.ca, cb: props.cb, cd: props.cd };
  const ride = props.kind === 'ride';
  const night = props.kind === 'night';
  /* the number's color: warm for SOS and the hard hours, the night's lavender at night */
  const ACC = night ? LAV : WARM;
  const dark = environment.colorScheme === 'dark';
  /* SOS exactly as the app draws it (components/sos-button.tsx, theme sos, sosLow, sosDeep, sosInk), light or dark as the phone is */
  const SOS = dark ? { top: '#FF8A7E', low: '#F2674F', deep: '#B8402F', ink: '#3A0D08' } : { top: '#D83A2E', low: '#B92B21', deep: '#8E1F17', ink: '#FFFFFF' };
  /* the card is the widget's night over the campfire (core CAMPFIRE_SKY); plain black while the Lock Screen is dimmed */
  const card = environment.isLuminanceReduced
    ? [activityBackgroundTint('#000000'), padding({ all: 16 })]
    : [
        activityBackgroundTint(NIGHT),
        padding({ all: 16 }),
        background({
          type: 'linearGradient' as const,
          colors: ['#120E30', '#221A4E', '#4A2346', '#8A3A2A'],
          startPoint: { x: 0.5, y: 0 },
          endPoint: { x: 0.5, y: 1 },
        }),
      ];
  const flame = (size: number) =>
    props.img ? (
      <Image uiImage={props.img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ width: size, height: size })]} />
    ) : (
      <Image systemName={props.asleep ? 'moon.zzz.fill' : 'flame.fill'} size={size * 0.7} color={WARM} />
    );
  const text = (s: string, size: number, color: string, weight: 'bold' | 'semibold' | 'heavy' = 'semibold') => (
    <Text modifiers={[font({ size, weight, design: 'rounded' }), foregroundStyle(color), lineLimit(1), minimumScaleFactor(0.75)]}>{s}</Text>
  );
  /* the one live number, run by iPhone: down to cb, or up from ca */
  const span = { lower: new Date(f.ca || 0), upper: new Date(f.cb || 0) };
  const clock = (size: number, color: string) =>
    f.cd ? (
      <Text
        timerInterval={span}
        countsDown={f.cd === 'down'}
        modifiers={[font({ size, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(color), lineLimit(1)]}
      />
    ) : (
      text(f.big || '', size, color, 'bold')
    );
  /* a button that says where it goes, standing on a ledge so it reads as one to press: SOS in its red, the rest warm */
  const isSos = f.go === 'daybook://sos';
  const pill = (label: string, dest: string, red: boolean, size: number) => (
    <Link destination={dest}>
      <Text
        modifiers={[
          font({ size, weight: 'heavy', design: 'rounded' }),
          foregroundStyle(red ? SOS.ink : NIGHT),
          lineLimit(1),
          padding({ horizontal: 16, vertical: 8 }),
          background(
            {
              type: 'linearGradient' as const,
              colors: red ? [SOS.top, SOS.low] : ['#FFC870', WARM],
              startPoint: { x: 0.5, y: 0 },
              endPoint: { x: 0.5, y: 1 },
            },
            shapes.capsule(),
          ),
          shadow({ radius: 0, y: 3, color: red ? SOS.deep : '#B86A1E' }),
        ]}>
        {label}
      </Text>
    </Link>
  );
  const buttons = (size: number) => (
    <HStack spacing={8}>
      {f.act && f.go ? pill(f.act, f.go, isSos, size) : null}
      {f.sos ? pill('SOS', 'daybook://sos', true, size) : null}
      <Spacer />
    </HStack>
  );
  /* the words, the number and what it means, on the left; the flame big on the right, with whose it is under it */
  const banner = (
    <VStack spacing={10} modifiers={card}>
      <HStack spacing={12}>
        <VStack alignment="leading" spacing={0}>
          {text(f.h || '', 16, '#FFFFFF', 'bold')}
          {clock(36, ACC)}
          {text(f.n || '', 14, SOFT)}
        </VStack>
        <Spacer />
        <VStack spacing={2}>
          {flame(68)}
          {text('Daybook', 11, SOFT)}
        </VStack>
      </HStack>
      {buttons(15)}
    </VStack>
  );
  /* SOS in its red, small, where the island has no room for words */
  const sosTag = (size: number) => text('SOS', size, SOS.top, 'heavy');
  return {
    banner,
    compactLeading: <VStack modifiers={[padding({ leading: 2 })]}>{ride ? sosTag(14) : flame(24)}</VStack>,
    compactTrailing: <VStack modifiers={[frame({ maxWidth: 64 })]}>{f.cd ? clock(15, ACC) : flame(22)}</VStack>,
    minimal: ride ? sosTag(11) : flame(22),
    expandedLeading: <VStack modifiers={[padding({ leading: 8, top: 4 })]}>{flame(44)}</VStack>,
    expandedTrailing: <VStack modifiers={[padding({ trailing: 8, top: 4 }), frame({ maxWidth: 110 })]}>{clock(24, ACC)}</VStack>,
    expandedBottom: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ horizontal: 8, bottom: 4 })]}>
        {text(f.h || '', 17, '#FFFFFF', 'bold')}
        {text(f.n || '', 13, SOFT)}
        {buttons(14)}
      </VStack>
    ),
  };
};

export default createLiveActivity<FlameLiveProps>('FlameLive', FlameLive);
