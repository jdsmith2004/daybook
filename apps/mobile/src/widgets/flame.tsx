/* The flame on the Home Screen and the Lock Screen (core flame-widget.ts; the owner, November 9, 2026): the flame as it burns now,
   standing over its campfire under a night sky (core campfire.ts, the look the owner picked), drawn by the app into the shared folder (lib/flame-widget.ts), and one short line under it; the medium and large ones add the next
   choice in the warm color. A tap opens Today.
   This function runs on its own inside the widget (expo-widgets): nothing from outside it is there, so every color and size is
   written inside it. Never a count, and nothing that says what Daybook is for: a Home Screen is seen by others. */
import { HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  resizable,
  aspectRatio,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type FlameWidgetProps = {
  /** the picture of the flame, a file:// path in the shared folder; empty until the app has drawn it */
  img: string;
  line: string;
  /** the second line the bigger widgets show: what to do next */
  next: string;
  /** the sky behind it */
  sky: string;
};

const FlameWidget = (props: FlameWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  /* the night over the campfire, warm at the ground (core CAMPFIRE_SKY, written here because this runs on its own) */
  const night = {
    type: 'linearGradient' as const,
    colors: ['#120E30', '#221A4E', '#4A2346', '#8A3A2A'],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  };
  const picture = props.img ? (
    <Image uiImage={props.img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' })]} />
  ) : (
    <Image systemName="flame.fill" size={44} color="#FFB347" />
  );
  if (environment.widgetFamily === 'accessoryCircular') {
    return <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL('daybook://')]}>{picture}</ZStack>;
  }
  const head = (size: number) => (
    <Text modifiers={[font({ size, weight: 'bold', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(2), minimumScaleFactor(0.8)]}>{props.line}</Text>
  );
  const next = (size: number) => (
    <Text modifiers={[font({ size, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFB347'), lineLimit(2), minimumScaleFactor(0.8)]}>
      {props.next}
    </Text>
  );
  const flame = <ZStack modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 })]}>{picture}</ZStack>;
  const base = [containerBackground(night, 'widget'), widgetURL('daybook://')];
  if (environment.widgetFamily === 'systemMedium') {
    /* the flame fills the left, the words read on the right */
    return (
      <HStack spacing={14} modifiers={base}>
        {flame}
        <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: 1000, alignment: 'leading' })]}>
          {head(21)}
          {next(15)}
        </VStack>
      </HStack>
    );
  }
  if (environment.widgetFamily === 'systemLarge') {
    /* the flame big in the middle, the words low */
    return (
      <VStack spacing={6} modifiers={[...base, padding({ vertical: 4 })]}>
        {flame}
        <Spacer minLength={4} />
        {head(26)}
        {next(17)}
      </VStack>
    );
  }
  return (
    <VStack spacing={4} modifiers={[...base, padding({ vertical: 2 })]}>
      {flame}
      <Text modifiers={[font({ size: 14, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(1), minimumScaleFactor(0.8)]}>
        {props.line}
      </Text>
    </VStack>
  );
};

export default createWidget<FlameWidgetProps>('Flame', FlameWidget, { img: '', line: 'Burning bright', next: 'Every step today feeds it.', sky: '#1E1846' });
