/* The flame widget is on iPhone only for now (flame-widget.ios.ts; the owner, November 9, 2026: iPhone first). Elsewhere it does
   nothing. */
import type { Snapshot } from '@daybook/core';
import type { ReactNode } from 'react';

/** keeps the widget showing the flame as it burns, and says whether it is on a screen; nothing here */
export function useFlameWidget(_snap: Snapshot, _tk: string, _ready: boolean, _now: number, _onPlaced: () => void, _sosAt?: number | null): ReactNode {
  return null;
}
