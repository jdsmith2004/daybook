/* Where this build syncs to. The deploy workflow sets these from Terraform's outputs for the web app; a phone build gets
   them from its build settings (see apps/mobile/README.md). With any of them missing, sync is simply not offered. None of them
   is secret: they are the app's public sign-in client and addresses. */
export const SYNC_URL = process.env.EXPO_PUBLIC_SYNC_URL || '';
export const AUTH_DOMAIN = (process.env.EXPO_PUBLIC_AUTH_DOMAIN || '').replace(/\/+$/, '');
export const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID || '';
export const syncOffered = !!(SYNC_URL && AUTH_DOMAIN && CLIENT_ID);
/** the AWS region, from the sign-in address (https://<name>.auth.<region>.amazoncognito.com) */
export const REGION = (AUTH_DOMAIN.match(/\.auth\.([a-z0-9-]+)\.amazoncognito\.com$/) || [])[1] || '';
