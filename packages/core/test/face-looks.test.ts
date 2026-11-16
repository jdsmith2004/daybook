import { describe, expect, it } from 'vitest';

import { emblemLayers, faceLooks, LOOKS } from '../src/emblem';

describe('faceLooks', () => {
  it('draws one face per look, each with its own ids, for every form', () => {
    for (const lv of [1, 5, 10, 19, 30]) {
      const L = emblemLayers(lv, true)!;
      const f = faceLooks(L.still);
      expect(f).toHaveLength(LOOKS.length);
      const ids = f.flatMap((x) => [...x.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
      expect(new Set(ids).size).toBe(ids.length);
      /* every url(#…) points at an id in the same copy */
      for (const x of f) for (const m of x.matchAll(/url\(#([^)]+)\)/g)) expect(x).toContain(`id="${m[1]}"`);
    }
  });
});
