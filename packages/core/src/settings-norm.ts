/* Settings loaded from storage, sync or a backup, cleaned up, with one rule on top of the legacy normSettings (legacy/core.js): a missing or invalid counting mode loads
   as gentle, not strict (WP1, item 7). New people start on gentle (CLAUDE.md, the owner, October 30, 2026), so strict is only ever
   a person's own choice, and a record that lost its mode must not land on the one count a slip puts to 0. The legacy file keeps its
   own default for the frozen golden fixtures, which all name their mode. */
import { normSettings as normLegacy } from './legacy/core.js';
import type { Settings } from './types';

const MODES = ['strict', 'gentle', 'step'];

export function normSettingsLoaded(s: unknown): Settings {
  const o = normLegacy(s as Settings);
  const m = s && typeof s === 'object' ? (s as { cleanMode?: unknown }).cleanMode : undefined;
  if (!MODES.includes(m as string)) o.cleanMode = 'gentle';
  return o;
}
