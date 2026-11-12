/* The Live Activity on iPhone (core live-activity.ts): the flame on the Lock Screen and in the Dynamic Island, in the hard hours and
   at night. The look follows the flight, ride and delivery cards the owner held up (November 9, 2026): the start and end times big at
   the two ends, a thick bar between them that iPhone fills on its own as the time passes, the flame waiting at its end, and a live
   countdown under it. In the Dynamic Island, the flame and the live time left beside it, read as one thing (Uber's way; a ring drew its own digits).
   The card is the widget's campfire night, and the picture is the flame standing in its fire, cut in close (core campfire.ts).
   One small flame picture, the same everywhere (lib/flame-widget), and few layers: a Live Activity has little memory.
   This function runs on its own inside the widget (expo-widgets): every color and size is written inside it. Nothing in it says
   what Daybook is for. */
import { HStack, Image, Link, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  aspectRatio,
  background,
  font,
  foregroundStyle,
  frame,
  backgroundOverlay,
  clipShape,
  labelsHidden,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  progressViewStyle,
  resizable,
  scaleEffect,
  shadow,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type FlameLiveProps = {
  /** 'ride' while SOS is open (the time held on counts up, no bar), else the hard hours or the night; missing on older ones */
  kind?: string;
  /** the ride's one button back into SOS ("Keep going") */
  back?: string;
  /** the picture of the flame, a file:// path in the shared folder */
  img: string;
  /** the one line at the top ("Wind down") */
  line: string;
  sub: string;
  short: string;
  /** the bar fills from a to b (ms), with left and right said at its ends */
  a: number;
  b: number;
  left: string;
  right: string;
};

const FlameLive = (props: FlameLiveProps, environment: LiveActivityEnvironment) => {
  'widget';
  const WARM = '#FFB347';
  const SOFT = '#B9B2E0';
  const NIGHT = '#16123A';
  const span = { lower: new Date(props.a), upper: new Date(props.b) };
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
      <Image systemName="flame.fill" size={size * 0.7} color={WARM} />
    );
  /* a clean glyph for the small places, where the mascot would only blur: a flame, or a moon once it is asleep (no short time) */
  const glyph = (size: number, color = WARM) => <Image systemName={props.short ? 'flame.fill' : 'moon.zzz.fill'} size={size} color={color} />;
  /* the end of the bar: a warm round badge with the flame in it, like the pin at the end of a ride */
  const badge = (size: number) => (
    <VStack modifiers={[frame({ width: size, height: size }), backgroundOverlay({ color: WARM }), clipShape('circle')]}>{glyph(size * 0.55, NIGHT)}</VStack>
  );
  const text = (s: string, size: number, color: string, weight: 'bold' | 'semibold' = 'semibold') => (
    <Text modifiers={[font({ size, weight, design: 'rounded' }), foregroundStyle(color), lineLimit(1)]}>{s}</Text>
  );
  /* the time left, counted down by iPhone */
  const left = (size: number, color: string) => (
    <Text
      timerInterval={span}
      countsDown
      modifiers={[font({ size, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(color), lineLimit(1)]}
    />
  );
  /* the thick bar, with the flame waiting at its end */
  const bar = (
    <HStack spacing={8}>
      <ProgressView
        timerInterval={span}
        countsDown={false}
        modifiers={[progressViewStyle('linear'), labelsHidden(), tint(WARM), scaleEffect({ x: 1, y: 2.2 })]}
      />
      {/* in a column as wide as the open island's flame above it, so the two stand one over the other */}
      <VStack modifiers={[frame({ width: 34 })]}>{badge(24)}</VStack>
    </HStack>
  );
  /* under the bar: where it started, the time left, where it ends */
  const foot = (size: number) => (
    <HStack>
      {text(props.left, size, SOFT)}
      {/* a ticking time takes all the width it is given, so it sits alone in the middle, centered */}
      <Text
        timerInterval={span}
        countsDown
        modifiers={[
          font({ size, weight: 'bold', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle('#FFFFFF'),
          multilineTextAlignment('center'),
          lineLimit(1),
        ]}
      />
      {text(props.right, size, WARM)}
    </HStack>
  );
  /* the words: whose it is (the owner: "we don't know which app it is"), what it is, and when */
  const brand = (
    <HStack spacing={4}>
      {glyph(11, SOFT)}
      {text('Daybook', 13, SOFT)}
    </HStack>
  );
  const words = (big: number, named = true) => (
    <VStack alignment="leading" spacing={2}>
      {named ? brand : null}
      {text(props.line, big, '#FFFFFF', 'bold')}
      {props.sub ? text(props.sub, 15, WARM) : null}
    </VStack>
  );
  /* asleep after Goodnight (no short time): no bar and no clock, only the flame resting, and SOS one tap away (the owner, November 9,
     2026: "when I go to sleep I want an SOS button") */
  const asleep = !props.short;
  /* SOS exactly as the app draws it (components/sos-button.tsx, theme sos, sosLow, sosDeep, sosInk): just the word, on the SOS color
     deepening at its foot, standing on a solid ledge, so it reads as a button to press. Light or dark as the phone is, as in the app (the
     owner, November 9, 2026: "the SOS looks different from the app") */
  const dark = environment.colorScheme === 'dark';
  const SOS = dark ? { top: '#FF8A7E', low: '#F2674F', deep: '#B8402F', ink: '#3A0D08' } : { top: '#D83A2E', low: '#B92B21', deep: '#8E1F17', ink: '#FFFFFF' };
  const sos = (
    <Link destination="daybook://sos">
      <Text
        modifiers={[
          font({ size: 17, weight: 'heavy', design: 'rounded' }),
          foregroundStyle(SOS.ink),
          padding({ horizontal: 18, vertical: 8 }),
          background(
            { type: 'linearGradient' as const, colors: [SOS.top, SOS.low], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
            shapes.capsule(),
          ),
          shadow({ radius: 0, y: 3, color: SOS.deep }),
        ]}>
        SOS
      </Text>
    </Link>
  );
  const rest = (big: number, img: number) => (
    <HStack spacing={12}>
      {words(big)}
      <Spacer />
      <VStack spacing={8}>
        {flame(img)}
        {sos}
      </VStack>
    </HStack>
  );
  /* the ride, while SOS is open: the flame burning bright, how long the person has held on counting up (no bar, no end to wait for:
     it is not a countdown), and one tap back into SOS. The whole card opens SOS too */
  if (props.kind === 'ride') {
    const up = (size: number, color: string) => (
      <Text
        timerInterval={span}
        countsDown={false}
        modifiers={[font({ size, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(color), lineLimit(1)]}
      />
    );
    const back = (
      <Link destination="daybook://sos">
        <Text
          modifiers={[
            font({ size: 16, weight: 'heavy', design: 'rounded' }),
            foregroundStyle(NIGHT),
            padding({ horizontal: 16, vertical: 8 }),
            background(
              { type: 'linearGradient' as const, colors: ['#FFC870', WARM], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
              shapes.capsule(),
            ),
            shadow({ radius: 0, y: 3, color: '#B86A1E' }),
          ]}>
          {props.back || 'Keep going'}
        </Text>
      </Link>
    );
    return {
      banner: (
        <VStack modifiers={card}>
          <HStack spacing={12}>
            <VStack alignment="leading" spacing={2}>
              {brand}
              {text(props.line, 22, '#FFFFFF', 'bold')}
              {up(34, WARM)}
              {text(props.sub, 13, SOFT)}
            </VStack>
            <Spacer />
            <VStack spacing={8}>
              {flame(72)}
              {back}
            </VStack>
          </HStack>
        </VStack>
      ),
      compactLeading: <VStack modifiers={[padding({ leading: 2 })]}>{flame(24)}</VStack>,
      compactTrailing: <VStack modifiers={[frame({ maxWidth: 64 })]}>{up(15, WARM)}</VStack>,
      minimal: flame(22),
      expandedLeading: <VStack modifiers={[padding({ leading: 8, top: 4 })]}>{brand}</VStack>,
      expandedTrailing: <VStack modifiers={[padding({ trailing: 8, top: 4 }), frame({ maxWidth: 80 })]}>{up(15, WARM)}</VStack>,
      expandedBottom: (
        <HStack spacing={10} modifiers={[padding({ horizontal: 8, bottom: 4 })]}>
          {flame(36)}
          <Text modifiers={[font({ size: 18, weight: 'bold', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(1), minimumScaleFactor(0.7)]}>
            {props.line}
          </Text>
          <Spacer />
          {back}
        </HStack>
      ),
    };
  }
  if (asleep)
    return {
      banner: <VStack modifiers={card}>{rest(24, 64)}</VStack>,
      compactLeading: <VStack modifiers={[padding({ leading: 2 })]}>{flame(24)}</VStack>,
      compactTrailing: glyph(15),
      minimal: flame(22),
      expandedBottom: (
        <HStack spacing={10} modifiers={[padding({ horizontal: 8, bottom: 4 })]}>
          {flame(36)}
          {/* the open island is narrow: the line shrinks a little to fit whole, never cut */}
          <Text modifiers={[font({ size: 18, weight: 'bold', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(1), minimumScaleFactor(0.7)]}>
            {props.line}
          </Text>
          <Spacer />
          {sos}
        </HStack>
      ),
    };
  return {
    /* after the ride card: the words on the left, the mascot big on the right as the picture, then the bar and its times */
    banner: (
      <VStack spacing={12} modifiers={card}>
        <HStack spacing={12}>
          {words(24)}
          <Spacer />
          {flame(72)}
        </HStack>
        <VStack spacing={6}>
          {bar}
          {foot(13)}
        </VStack>
      </VStack>
    ),
    /* the mascot says whose it is; the time left beside it */
    compactLeading: <VStack modifiers={[padding({ leading: 2 })]}>{flame(24)}</VStack>,
    compactTrailing: <VStack modifiers={[frame({ maxWidth: 64 })]}>{left(15, WARM)}</VStack>,
    minimal: flame(22),
    /* the sides of the open island are narrow: only the name and the time left there, and the words across the full width below */
    expandedLeading: <VStack modifiers={[padding({ leading: 8, top: 4 })]}>{brand}</VStack>,
    expandedTrailing: <VStack modifiers={[padding({ trailing: 8, top: 4 }), frame({ maxWidth: 80 })]}>{left(15, WARM)}</VStack>,
    expandedBottom: (
      <VStack spacing={6} modifiers={[padding({ horizontal: 8, bottom: 4 })]}>
        {/* the open island is short: one line and a small mascot, so the bar and its times are never cut off */}
        <HStack spacing={10}>
          {text(props.line, 19, '#FFFFFF', 'bold')}
          <Spacer />
          <VStack modifiers={[frame({ width: 34 })]}>{flame(34)}</VStack>
        </HStack>
        {bar}
        {foot(13)}
      </VStack>
    ),
  };
};

export default createLiveActivity<FlameLiveProps>('FlameLive', FlameLive);
