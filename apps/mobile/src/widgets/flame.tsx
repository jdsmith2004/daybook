/* The flame on the Home Screen and the Lock Screen (core flame-widget.ts; the owner, November 9 and 12, 2026: "the duolingo widgets
   look really nice i want more like that"). Like Duolingo's: the person's own flame big and full of feeling at its campfire, one short
   line in its voice that changes through the day, the week row, and a rich sky that follows the hour (dawn, day, dusk, night).

   Two places to tap, each saying where it goes: the flame opens Today, and the SOS button opens SOS (the owner: "there's no indication
   it's going to go to SOS"). The small size is one tap target on iPhone, so it opens Today, and SOS has its own widget (widgets/sos.tsx).
   In the morning it asks "How was last night?": Free of it is a button that answers here (kept in the widget, written by the app the
   next time it opens: core widgetTold); It happened opens the morning page, so that answer always lands where the care is.

   This function runs on its own inside the widget (expo-widgets): nothing from outside it is there, so every color and size is
   written inside it. Never a count, and nothing that says what Daybook is for: a Home Screen is seen by others. */
import { AccessoryWidgetBackground, Button, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  aspectRatio,
  background,
  buttonStyle,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  multilineTextAlignment,
  offset,
  padding,
  resizable,
  scaleEffect,
  shapes,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type FlameWidgetProps = {
  /** the picture of the flame as it is now, a file:// path in the shared folder; empty until the app has drawn it */
  img: string;
  line: string;
  /** the second line the bigger widgets show: the next choice */
  next: string;
  /** the sky behind it, top to bottom, colors joined with commas */
  sky: string;
  /** the last seven days, oldest first: x fed, o not fed, - before the start, t today open, f today fed (core widgetWeek) */
  week: string;
  /** their first letters */
  wd: string;
  /** the log day whose morning is asked now, or empty */
  ask: string;
  /** after Free of it is tapped here: the answer, its day and when (core widgetTold reads these) */
  told?: string;
  toldK?: string;
  toldAt?: number;
  /** what it shows once answered: the flame bright, and its words */
  imgTold: string;
  toldLine: string;
  toldNext: string;
  /** the sky's name (morning, day, evening, night), for the night's dimmer words */
  part: string;
};

const FlameWidget = (props: FlameWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const fam = environment.widgetFamily;
  const told = props.told === 'free';
  const ask = !!props.ask && !told;
  const img = told ? props.imgTold : props.img;
  const line = told ? props.toldLine : props.line;
  const nextLine = told ? props.toldNext : props.next;
  const week = told ? props.week.slice(0, 6) + 'f' : props.week;
  const warm = '#FFB547';
  const today = 'daybook://';
  const tap = ask ? 'daybook://morning' : today;

  const picture = img ? (
    <Image uiImage={img} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' })]} />
  ) : (
    <Image systemName="flame.fill" size={44} color={warm} />
  );

  /* the Lock Screen: the system tints these, so they are plain */
  if (fam === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(today)]}>
        <AccessoryWidgetBackground />
        <ZStack modifiers={[padding({ all: 3 })]}>{picture}</ZStack>
      </ZStack>
    );
  }
  if (fam === 'accessoryInline') {
    return (
      <HStack modifiers={[containerBackground('clear', 'widget'), widgetURL(today)]}>
        <Image systemName="flame.fill" />
        <Text>{line}</Text>
      </HStack>
    );
  }

  /* the week row: a dot a day, today's ringed until it is fed, a fed day checked */
  const dot = (c: string, i: number, size: number) => {
    const name = c === 'x' || c === 'f' ? 'checkmark.circle.fill' : c === 't' ? 'circle.dashed' : 'circle.fill';
    const color = c === 'x' || c === 'f' ? warm : c === 't' ? warm : c === 'o' ? '#FFFFFF33' : '#FFFFFF14';
    return (
      <VStack key={'d' + i} spacing={3}>
        <Text modifiers={[font({ size: size * 0.55, weight: 'bold', design: 'rounded' }), foregroundStyle(i === 6 ? '#FFFFFF' : '#FFFFFFAA')]}>
          {props.wd[i] ?? ''}
        </Text>
        <Image systemName={name as 'circle.fill'} size={size} color={color} />
      </VStack>
    );
  };
  const weekRow = (size: number, spacing: number) => <HStack spacing={spacing}>{week.split('').map((c, i) => dot(c, i, size))}</HStack>;

  if (fam === 'accessoryRectangular') {
    return (
      <HStack spacing={6} modifiers={[containerBackground('clear', 'widget'), widgetURL(today)]}>
        <ZStack modifiers={[frame({ width: 44, height: 44 })]}>{picture}</ZStack>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 14, weight: 'bold', design: 'rounded' }), lineLimit(2), minimumScaleFactor(0.8)]}>{line}</Text>
          <HStack spacing={3}>
            {week.split('').map((c, i) => (
              <Image key={'r' + i} systemName={c === 'x' || c === 'f' ? 'circle.fill' : 'circle'} size={7} />
            ))}
          </HStack>
        </VStack>
      </HStack>
    );
  }

  const cols = (props.sky || '#120E30,#221A4E,#4A2346,#8A3A2A').split(',');
  const sky = { type: 'linearGradient' as const, colors: cols, startPoint: { x: 0.2, y: 0 }, endPoint: { x: 0.8, y: 1 } };
  const base = [containerBackground(sky, 'widget'), widgetURL(tap)];
  const head = (size: number, lines = 2) => (
    <Text modifiers={[font({ size, weight: 'heavy', design: 'rounded' }), foregroundStyle('#FFFFFF'), lineLimit(lines), minimumScaleFactor(0.7)]}>{line}</Text>
  );
  const sub = (size: number) => (
    <Text modifiers={[font({ size, weight: 'semibold', design: 'rounded' }), foregroundStyle(warm), lineLimit(2), minimumScaleFactor(0.8)]}>{nextLine}</Text>
  );
  const flame = <ZStack modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 })]}>{picture}</ZStack>;

  /* SOS: a warm pill that says where it goes */
  const sos = (size: number) => (
    <Link destination="daybook://sos">
      <HStack spacing={4} modifiers={[padding({ horizontal: size * 0.75, vertical: size * 0.4 }), background('#FF6B4A', shapes.capsule())]}>
        <Image systemName="lifepreserver.fill" size={size} color="#FFFFFF" />
        <Text modifiers={[font({ size, weight: 'heavy', design: 'rounded' }), foregroundStyle('#FFFFFF')]}>SOS</Text>
      </HStack>
    </Link>
  );

  /* the morning's two answers: Free of it answers here; It happened opens the morning page */
  const free = (size: number, wide: boolean) => (
    <Button target="free" modifiers={[buttonStyle('plain')]} onPress={() => ({ told: 'free', toldK: props.ask, toldAt: Date.now() })}>
      <HStack spacing={4} modifiers={[padding({ horizontal: size * 0.9, vertical: size * 0.55 }), background('#FFFFFF', shapes.capsule())]}>
        <Image systemName="checkmark" size={size * 0.85} color="#1B2A6B" />
        <Text modifiers={[font({ size, weight: 'heavy', design: 'rounded' }), foregroundStyle('#1B2A6B'), lineLimit(1), minimumScaleFactor(0.8)]}>
          {wide ? 'Free of it' : 'Free'}
        </Text>
      </HStack>
    </Button>
  );
  const happened = (size: number) => (
    <Link destination="daybook://morning">
      <Text
        modifiers={[
          font({ size, weight: 'bold', design: 'rounded' }),
          foregroundStyle('#FFFFFF'),
          lineLimit(1),
          minimumScaleFactor(0.8),
          padding({ horizontal: size * 0.9, vertical: size * 0.55 }),
          background('#FFFFFF2E', shapes.capsule()),
        ]}>
        It happened
      </Text>
    </Link>
  );

  if (fam === 'systemMedium') {
    /* the words and the week on the left, the flame big on the right with SOS over it */
    return (
      <HStack spacing={8} modifiers={base}>
        <VStack alignment="leading" spacing={5} modifiers={[frame({ maxWidth: 1000, maxHeight: 1000, alignment: 'leading' })]}>
          {head(ask ? 19 : 21)}
          {ask ? null : sub(13)}
          <Spacer minLength={4} />
          {ask ? (
            <VStack alignment="leading" spacing={6}>
              {free(14, true)}
              {happened(14)}
            </VStack>
          ) : (
            weekRow(17, 5)
          )}
        </VStack>
        <ZStack alignment="topTrailing" modifiers={[frame({ width: 132 })]}>
          <ZStack modifiers={[scaleEffect(1.15), offset({ x: 0, y: 10 }), frame({ maxWidth: 1000, maxHeight: 1000 })]}>{picture}</ZStack>
          {sos(12)}
        </ZStack>
      </HStack>
    );
  }
  if (fam === 'systemLarge') {
    return (
      <VStack spacing={8} modifiers={base}>
        <HStack alignment="top">
          <VStack alignment="leading" spacing={4}>
            {head(24)}
            {ask ? null : sub(15)}
          </VStack>
          <Spacer minLength={8} />
          {sos(14)}
        </HStack>
        {flame}
        {ask ? (
          <HStack spacing={10}>
            {free(17, true)}
            {happened(17)}
          </HStack>
        ) : (
          weekRow(24, 10)
        )}
      </VStack>
    );
  }
  /* small (and StandBy): the line on top, the flame rising big below it and filling the rest, like Duolingo's; in the morning, Free of
     it answers here, under the flame */
  const top = (
    <Text
      modifiers={[
        font({ size: 15, weight: 'heavy', design: 'rounded' }),
        foregroundStyle('#FFFFFF'),
        lineLimit(2),
        minimumScaleFactor(0.7),
        multilineTextAlignment('center'),
      ]}>
      {line}
    </Text>
  );
  if (ask) {
    return (
      <ZStack alignment="top" modifiers={base}>
        <ZStack alignment="bottom" modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 }), padding({ top: 40 })]}>
          <ZStack modifiers={[scaleEffect(1.1), offset({ x: 0, y: -12 })]}>{picture}</ZStack>
          {free(13, false)}
        </ZStack>
        {top}
      </ZStack>
    );
  }
  return (
    <ZStack alignment="top" modifiers={base}>
      <ZStack alignment="bottom" modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 }), padding({ top: 40 })]}>
        <ZStack modifiers={[scaleEffect(1.25), offset({ x: 0, y: 4 })]}>{picture}</ZStack>
      </ZStack>
      {top}
    </ZStack>
  );
};

export default createWidget<FlameWidgetProps>('Flame', FlameWidget, {
  img: '',
  line: 'Ready when you are',
  next: 'One step today feeds me.',
  sky: '#16226B,#1F3A9E,#2D55C8',
  week: 'oooooot',
  wd: 'SMTWTFS',
  ask: '',
  imgTold: '',
  toldLine: '',
  toldNext: '',
  part: 'day',
});
