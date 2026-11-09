/* The Live Activity on iPhone (core live-activity.ts): the flame on the Lock Screen and in the Dynamic Island, in the hard hours and
   at night. The flame picture is the one the app drew (lib/flame-widget), or the flame asleep after Goodnight.
   The look follows the best of them (the owner, November 9, 2026: "research prominent live activities"; Apple's guidelines, Uber,
   Swiggy): one hero line, then a progress bar that iPhone fills on its own as the time passes (no app needed), with the times at its
   ends; 14 point margins, a dark sky that holds over any wallpaper, the flame with no frame around it, and in the Dynamic Island the
   flame and one time, read as one piece.
   This function runs on its own inside the widget (expo-widgets): every color and size is written inside it. Nothing in it says
   what Daybook is for. */
import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  aspectRatio,
  font,
  foregroundStyle,
  frame,
  lineLimit,
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
  line: string;
  /** the time under it ("Till 10 PM"), or empty */
  sub: string;
  /** the same, short, for the Dynamic Island ("10 PM"), or empty */
  short: string;
  /** the progress bar fills from a to b (ms), with left and right at its ends */
  a: number;
  b: number;
  left: string;
  right: string;
};

const FlameLive = (props: FlameLiveProps, environment: LiveActivityEnvironment) => {
  'widget';
  const WARM = '#FFB347';
  const flame = (size: number) =>
    props.img ? (
      <Image uiImage={props.img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ width: size, height: size })]} />
    ) : (
      <Image systemName="flame.fill" size={size * 0.7} color={WARM} />
    );
  const text = (s: string, size: number, color: string, weight: 'bold' | 'semibold' = 'semibold') => (
    <Text modifiers={[font({ size, weight, design: 'rounded' }), foregroundStyle(color), lineLimit(1)]}>{s}</Text>
  );
  /* the bar: filled by iPhone as the time passes, thick, in the warm color, with the times at its ends */
  const bar =
    props.b > props.a ? (
      <VStack spacing={5}>
        <ProgressView
          timerInterval={{ lower: new Date(props.a), upper: new Date(props.b) }}
          countsDown={false}
          modifiers={[progressViewStyle('linear'), tint(WARM), scaleEffect({ x: 1, y: 1.6 })]}>
          {null}
        </ProgressView>
        <HStack>
          {text(props.left, 13, '#B9B2E0')}
          <Spacer />
          {text(props.right, 13, '#B9B2E0')}
        </HStack>
      </VStack>
    ) : null;
  const dim = environment.isLuminanceReduced;
  return {
    banner: (
      <VStack spacing={12} modifiers={[activityBackgroundTint(dim ? '#000000' : '#1E1846'), padding({ all: 14 })]}>
        <HStack spacing={12}>
          {flame(52)}
          <VStack alignment="leading" spacing={2} modifiers={[frame({ maxWidth: 1000, alignment: 'leading' })]}>
            {text(props.line, 20, '#FFFFFF', 'bold')}
            {props.sub ? text(props.sub, 15, WARM) : null}
          </VStack>
        </HStack>
        {bar}
      </VStack>
    ),
    compactLeading: flame(24),
    compactTrailing: props.short ? text(props.short, 14, WARM) : <Image systemName="moon.zzz.fill" size={14} color={WARM} />,
    minimal: flame(22),
    expandedLeading: flame(48),
    expandedCenter: (
      <VStack alignment="leading" spacing={2}>
        {text(props.line, 17, '#FFFFFF', 'bold')}
        {props.sub ? text(props.sub, 14, WARM) : null}
      </VStack>
    ),
    expandedBottom: bar,
  };
};

export default createLiveActivity<FlameLiveProps>('FlameLive', FlameLive);
