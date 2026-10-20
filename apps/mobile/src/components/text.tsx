/* Text that follows the phone's text size, up to a point. iOS can make text more than three times its size; past about one
   and a half times, words break in the middle and the tab bar covers the page. Every Text in the app comes from here, so
   the cap holds everywhere. A heading or a big number passes a smaller cap (maxFontSizeMultiplier). Every TextInput also
   comes up above the on-screen keyboard with its button (components/keyboard.tsx). */
import { useCallback, useRef } from 'react';
import { Animated, Text as RNText, TextInput as RNTextInput, type TextInputInstance } from 'react-native';

import { useRevealOnFocus } from '@/components/keyboard';

/** how far text grows with the phone's text size */
export const TEXT_MAX = 1.5;
/** headings and big numbers grow less: they are big already */
export const BIG_MAX = 1.25;

export function Text({ maxFontSizeMultiplier = TEXT_MAX, ...rest }: React.ComponentProps<typeof RNText>) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}

export function TextInput({ maxFontSizeMultiplier = TEXT_MAX, onFocus, ref, ...rest }: React.ComponentProps<typeof RNTextInput>) {
  const own = useRef<TextInputInstance | null>(null);
  const reveal = useRevealOnFocus(own);
  const join = useCallback(
    (v: TextInputInstance | null) => {
      own.current = v;
      if (typeof ref === 'function') ref(v);
      else if (ref) (ref as { current: TextInputInstance | null }).current = v;
    },
    [ref],
  );
  return (
    <RNTextInput
      ref={join}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      onFocus={(e) => {
        reveal();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}

/** Animated.Text with the same cap */
export function AnimatedText({ maxFontSizeMultiplier = BIG_MAX, ...rest }: React.ComponentProps<typeof Animated.Text>) {
  return <Animated.Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
