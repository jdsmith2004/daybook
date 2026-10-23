/* What the sync tests share: the people in them are supporters, so their saves go through the sync gate. The gate itself
   is checked in supporter.test.ts. */
import type { Supporter } from '@daybook/core';

import type { MemoryStore } from '../src/store';

export const TIP: Supporter = { since: 1, kind: 'tip', until: null, src: 'apple', cents: 500 };

export function supporters<T extends MemoryStore>(store: T, people = ['alice', 'bob', 'eve']): T {
  for (const p of people) store.sups.set(p, { sup: { ...TIP }, refs: new Set() });
  return store;
}
