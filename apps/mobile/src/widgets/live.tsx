/* The Live Activity on iPhone (core live-activity.ts): the flame on the Lock Screen and in the Dynamic Island, in the hard hours and
   at night. The look follows the flight, ride and delivery cards the owner held up (November 9, 2026): the start and end times big at
   the two ends, a thick bar between them that iPhone fills on its own as the time passes, the flame waiting at its end, and a live
   countdown under it. In the Dynamic Island, a ring that fills around the flame and the live time left beside it, read as one thing.
   One small flame picture, the same everywhere (lib/flame-widget), and few layers: a Live Activity has little memory.
   This function runs on its own inside the widget (expo-widgets): every color and size is written inside it. Nothing in it says
   what Daybook is for. */
import { HStack, Image, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  aspectRatio,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  monospacedDigit,
  padding,
  progressViewStyle,
  resizable,
  scaleEffect,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type FlameLiveProps = {
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
  const span = { lower: new Date(props.a), upper: new Date(props.b) };
  const flame = (size: number) =>
    props.img ? (
      <Image uiImage={props.img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ width: size, height: size })]} />
    ) : (
      <Image systemName="flame.fill" size={size * 0.7} color={WARM} />
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
      {flame(26)}
    </HStack>
  );
  /* the ring that fills around the flame, for the Dynamic Island */
  const ring = (size: number) => (
    <ZStack modifiers={[frame({ width: size, height: size })]}>
      <ProgressView timerInterval={span} countsDown={false} modifiers={[progressViewStyle('circular'), labelsHidden(), tint(WARM)]} />
      {flame(size * 0.62)}
    </ZStack>
  );
  const ends = (size: number) => (
    <HStack>
      {text(props.left, size, '#FFFFFF', 'bold')}
      <Spacer />
      {text(props.right, size, WARM, 'bold')}
    </HStack>
  );
  return {
    banner: (
      <VStack spacing={10} modifiers={[activityBackgroundTint(environment.isLuminanceReduced ? '#000000' : '#16123A'), padding({ all: 16 })]}>
        <HStack>
          {text(props.line, 15, SOFT)}
          <Spacer />
        </HStack>
        {ends(26)}
        {bar}
        <HStack spacing={5}>
          {left(17, '#FFFFFF')}
          {text('left', 15, SOFT)}
        </HStack>
      </VStack>
    ),
    compactLeading: ring(26),
    compactTrailing: <VStack modifiers={[frame({ maxWidth: 64 })]}>{left(15, WARM)}</VStack>,
    minimal: ring(24),
    expandedLeading: <VStack modifiers={[padding({ leading: 4 })]}>{ring(34)}</VStack>,
    expandedCenter: text(props.line, 15, SOFT),
    expandedTrailing: <VStack modifiers={[padding({ trailing: 4 })]}>{left(18, WARM)}</VStack>,
    expandedBottom: (
      <VStack spacing={10} modifiers={[padding({ horizontal: 4, top: 6, bottom: 4 })]}>
        {ends(20)}
        {bar}
      </VStack>
    ),
  };
};

export default createLiveActivity<FlameLiveProps>('FlameLive', FlameLive);
