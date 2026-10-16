/* @daybook/core: every rule in Daybook with no UI. The web, iOS and Android apps and the sync service all use this, so the
   rules are the same everywhere. Most of it is generated from the legacy single-file app (see tools/extract-legacy.mjs);
   the files next to this one are the parts ported to TypeScript. */
export * from './types';
export * from './legacy/core.js';
export * from './view';
export * from './actions';
export * from './data';
export * from './setup';
export * from './emblem';
