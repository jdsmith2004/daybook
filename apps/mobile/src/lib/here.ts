import { Platform } from 'react-native';

/** "this phone" in a message, said as "this browser" on the web, where the log is kept in the browser */
export const here = (words: string): string => (Platform.OS === 'web' ? words.replace(/this phone/g, 'this browser') : words);
