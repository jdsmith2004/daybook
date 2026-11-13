/* SOS on the Home Screen and the Lock Screen (core WIDGET_SOS; the owner, November 12, 2026: a widget that opens SOS must say so).
   The small flame widget is one tap target on iPhone and opens Today, so SOS has its own: a calm night sky, the lifebuoy, SOS in big
   letters, and one line. A tap opens SOS. Nothing on it says what for.
   This function runs on its own inside the widget (expo-widgets), so every color and word is written inside it. */
import { AccessoryWidgetBackground, Image, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit, minimumScaleFactor, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type SosWidgetProps = { line: string; next: string };

const SosWidget = (props: SosWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const url = 'daybook://sos';
  if (environment.widgetFamily === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(url)]}>
        <AccessoryWidgetBackground />
        <VStack spacing={0}>
          <Image systemName="lifepreserver.fill" size={20} />
          <Text modifiers={[font({ size: 12, weight: 'heavy', design: 'rounded' })]}>SOS</Text>
        </VStack>
      </ZStack>
    );
  }
  const sky = { type: 'linearGradient' as const, colors: ['#1A1446', '#3A1F5C', '#7A2E4A'], startPoint: { x: 0.2, y: 0 }, endPoint: { x: 0.8, y: 1 } };
  return (
    <VStack spacing={4} modifiers={[containerBackground(sky, 'widget'), widgetURL(url)]}>
      <Image systemName="lifepreserver.fill" size={46} color="#FF6B4A" />
      <Text modifiers={[font({ size: 34, weight: 'heavy', design: 'rounded' }), foregroundStyle('#FFFFFF')]}>SOS</Text>
      <VStack spacing={0}>
        <Text modifiers={[font({ size: 13, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFB547'), lineLimit(1), minimumScaleFactor(0.8)]}>
          {props.line}
        </Text>
        <Text modifiers={[font({ size: 13, weight: 'semibold', design: 'rounded' }), foregroundStyle('#FFFFFFCC'), lineLimit(1), minimumScaleFactor(0.8)]}>
          {props.next}
        </Text>
      </VStack>
    </VStack>
  );
};

export default createWidget<SosWidgetProps>('Sos', SosWidget, { line: 'A hard moment?', next: 'Tap. I am here.' });
