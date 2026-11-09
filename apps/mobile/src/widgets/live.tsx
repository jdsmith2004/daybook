/* The Live Activity on iPhone (core live-activity.ts): the flame on the Lock Screen and in the Dynamic Island, in the hard hours and
   at night. The flame picture is the one the app drew for the widget (lib/flame-widget), or the flame asleep after Goodnight.
   This function runs on its own inside the widget (expo-widgets): every color and size is written inside it. Nothing in it says
   what Daybook is for. */
import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { activityBackgroundTint, aspectRatio, font, foregroundStyle, frame, lineLimit, padding, resizable } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type FlameLiveProps = {
  /** the picture of the flame, a file:// path in the shared folder */
  img: string;
  line: string;
  /** the time under it ("Till 10 PM"), or empty */
  sub: string;
  /** the same, short, for the Dynamic Island ("10 PM"), or empty */
  short: string;
};

const FlameLive = (props: FlameLiveProps, environment: LiveActivityEnvironment) => {
  'widget';
  const flame = (size: number) =>
    props.img ? (
      <Image uiImage={props.img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ width: size, height: size })]} />
    ) : (
      <Image systemName="flame.fill" size={size * 0.7} color="#FFB347" />
    );
  const line = (size: number) => (
    <Text modifiers={[font({ size, weight: 'bold', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(1)]}>{props.line}</Text>
  );
  const sub = (size: number) =>
    props.sub ? <Text modifiers={[font({ size, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFB347'), lineLimit(1)]}>{props.sub}</Text> : null;
  const dim = environment.isLuminanceReduced;
  return {
    banner: (
      <HStack spacing={14} modifiers={[activityBackgroundTint(dim ? '#000000' : '#1E1846'), padding({ all: 14 })]}>
        {flame(64)}
        <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: 1000, alignment: 'leading' })]}>
          {line(19)}
          {sub(15)}
        </VStack>
      </HStack>
    ),
    compactLeading: flame(24),
    compactTrailing: props.short ? (
      <Text modifiers={[font({ size: 14, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFB347'), lineLimit(1)]}>{props.short}</Text>
    ) : (
      <Image systemName="moon.zzz.fill" size={14} color="#FFB347" />
    ),
    minimal: flame(22),
    expandedLeading: flame(52),
    expandedCenter: (
      <VStack alignment="leading" spacing={2}>
        {line(17)}
        {sub(14)}
      </VStack>
    ),
  };
};

export default createLiveActivity<FlameLiveProps>('FlameLive', FlameLive);
