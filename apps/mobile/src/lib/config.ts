/* Where this build syncs to. The deploy workflow sets these from Terraform's outputs for the web app; a phone build gets
   them from its build settings (see apps/mobile/README.md). With any of them missing, sync is simply not offered. None of them
   is secret: they are the app's public sign-in client and addresses. */
export const SYNC_URL = process.env.EXPO_PUBLIC_SYNC_URL || '';
export const AUTH_DOMAIN = (process.env.EXPO_PUBLIC_AUTH_DOMAIN || '').replace(/\/+$/, '');
export const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID || '';
export const syncOffered = !!(SYNC_URL && AUTH_DOMAIN && CLIENT_ID);
/* the anonymous counts and feedback (core pulse.ts): set only once the pulse is on in Terraform. Empty: nothing is counted or sent. */
export const PULSE_URL = (process.env.EXPO_PUBLIC_PULSE_URL || '').replace(/\/+$/, '');
/* what Daybook learns (core events.ts): set only once the events are on in Terraform. Empty: nothing is kept or sent. */
export const EVENTS_URL = (process.env.EXPO_PUBLIC_EVENTS_URL || '').replace(/\/+$/, '');
/* Sign in with Apple (lib/apple.ts): on iPhone once the Deploy workflow prints EXPO_PUBLIC_APPLE=on; on the web once there is a
   Services ID. Empty: no Apple button. */
export const APPLE_ON = process.env.EXPO_PUBLIC_APPLE === 'on';
export const APPLE_SERVICES_ID = process.env.EXPO_PUBLIC_APPLE_SERVICES_ID || '';
/* Mithras, the owner's earlier app (core mithras.ts): its Supabase address and its public anon key, which ships inside Mithras too and is
   public by design. The import signs in with the person's own Mithras sign-in and reads only their rows; nothing here is secret. */
export const MITHRAS_URL = 'https://myouylbpeuqnmectdwyt.supabase.co';
export const MITHRAS_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15b3V5bGJwZXVxbm1lY3Rkd3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5ODI0MTUsImV4cCI6MjA1NzU1ODQxNX0.EieCouVFd9MPKJ2Q8V-skh0q-9z6H_1c4LjT9tfKFtc';
