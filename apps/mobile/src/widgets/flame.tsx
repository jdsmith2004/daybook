/* The flame on the Home Screen and the Lock Screen (core flame-widget.ts; the owner, November 9, 2026): the flame as it burns now,
   drawn by the app into the shared folder (lib/flame-widget.ts), and one short line under it. A tap opens Today.
   This function runs on its own inside the widget (expo-widgets): nothing from outside it is there, so every color and size is
   written inside it. Never a count, and nothing that says what Daybook is for: a Home Screen is seen by others. */
import { Image, Text, VStack, ZStack } from '@expo/ui/swift-ui';
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
  /** the sky behind it */
  sky: string;
};

const FlameWidget = (props: FlameWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const night = props.sky || '#1E1846';
  const picture = props.img ? (
    <Image uiImage={props.img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' })]} />
  ) : (
    <Image systemName="flame.fill" size={44} color="#FFB347" />
  );
  if (environment.widgetFamily === 'accessoryCircular') {
    return <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL('daybook://')]}>{picture}</ZStack>;
  }
  return (
    <VStack spacing={4} modifiers={[containerBackground(night, 'widget'), widgetURL('daybook://'), padding({ vertical: 2 })]}>
      <ZStack modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 })]}>{picture}</ZStack>
      <Text modifiers={[font({ size: 14, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(1), minimumScaleFactor(0.8)]}>
        {props.line}
      </Text>
    </VStack>
  );
};

export default createWidget<FlameWidgetProps>('Flame', FlameWidget, { img: '', line: 'Burning bright', sky: '#1E1846' });
