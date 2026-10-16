/* A browser has no Face ID to ask, so the lock is a phone feature. */
import type { ReactNode } from 'react';

export const lockOffered = false;
export async function confirmUnlock(_prompt: string): Promise<{ ok: boolean; why?: string }> {
  return { ok: false };
}
export function LockGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
