/* The Sign in with Apple button. On iPhone it is Apple's own (Apple asks for its look); on the web, a plain black or white
   button in Apple's style, since Apple's JS only opens the popup. Shown only where Sign in with Apple is offered
   (lib/apple.ts appleOffered). */
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export function AppleButton({ onPress, label = 'Continue with Apple', disabled }: { onPress: () => void; label?: string; disabled?: boolean }) {
  const c = useTheme();
  const dark = c.scheme === 'dark';
  if (Platform.OS === 'ios')
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={16}
        style={[s.btn, disabled ? { opacity: 0.5 } : null]}
        onPress={() => !disabled && onPress()}
      />
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[s.btn, s.web, { backgroundColor: dark ? '#FFFFFF' : '#000000', opacity: disabled ? 0.5 : 1 }]}>
      <T style={{ fontFamily: font.bodySemi, color: dark ? '#000000' : '#FFFFFF', fontSize: 17 }}>{label}</T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 54, width: '100%' },
  web: { borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
