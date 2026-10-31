/* SOS's place on the iPhone's tab bar (app-tabs.ios.tsx). It is never shown there; on the web or from a link it goes to SOS. */
import { Redirect } from 'expo-router';

export default function SosDoor() {
  return <Redirect href="/sos" />;
}
