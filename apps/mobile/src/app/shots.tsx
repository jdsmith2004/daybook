/* The screenshot studio's address (src/shots, dev only). It exists only in a build made with EXPO_PUBLIC_SHOTS=1 (npm run
   shots): in every other build the test below folds away, the studio is not bundled, and this address goes to Today. */
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

const Studio: ComponentType | null = process.env.EXPO_PUBLIC_SHOTS === '1' ? require('@/shots/studio').default : null;

export default function Shots() {
  return Studio ? <Studio /> : <Redirect href="/" />;
}
