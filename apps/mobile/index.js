/* The app's entry. Screenshot mode (src/shots, dev only) has to start before any screen reads storage, so it is loaded
   first; in a normal build it is empty. Then Expo Router starts the app as usual. */
import './src/shots/boot';
import 'expo-router/entry';
