/* Reviews, backups, and the records that sync moves. */
import { isKey, mergeOpts, normDay, normSettings } from './legacy/core.js';
import type { Day, DayKey, Days, Review, Reviews, Settings, Snapshot } from './types';

/** a weekly review, cleaned up (legacy normReview, from its STORE section) */
export function normReview(r: unknown, k: string): Review {
  const o = (r && typeof r === 'object' ? r : {}) as { a?: Record<string, unknown>; u?: unknown };
  const a = o.a || {};
  const t = (v: unknown) => String(v || '').slice(0, 1500);
  return {
    k,
    a: { hard: t(a.hard), helped: t(a.helped), change: t(a.change), proud: t(a.proud) },
    u: typeof o.u === 'number' ? o.u : 0,
  };
}

export const isReviewKey = (k: string) => /^w\d{1,4}$/.test(k);

/* ---------- backups: the same JSON file the legacy app saves and restores ---------- */

export interface BackupFile {
  app: 'daybook';
  v: 1;
  exportedAt: string;
  settings: Settings | null;
  days: Days;
  reviews: Reviews;
}

export function makeBackup(s: Snapshot, now = new Date()): BackupFile {
  return { app: 'daybook', v: 1, exportedAt: now.toISOString(), settings: s.settings, days: s.days, reviews: s.reviews };
}

/** reads a backup file. Throws when it is not a Daybook backup. */
export function readBackup(text: string): Snapshot {
  const o = JSON.parse(text);
  if (!o || o.app !== 'daybook' || typeof o.days !== 'object') throw new Error('That file is not a Daybook backup.');
  const days: Days = {};
  Object.keys(o.days || {}).forEach((k) => {
    if (!isKey(k)) return;
    const d = normDay(o.days[k], k);
    if (!d.events.length && !d.checkin && !d.p) return;
    days[k] = d;
  });
  const reviews: Reviews = {};
  Object.keys(o.reviews || {}).forEach((k) => {
    if (isReviewKey(k)) reviews[k] = normReview(o.reviews[k], k);
  });
  return { settings: o.settings ? normSettings(o.settings) : null, days, reviews };
}

/** restores a backup on top of what is here, the way the legacy app does: the backup's days and reviews replace the same days
    and reviews here, its settings replace these settings, and the answers added to the lists are combined so none are lost. */
export function restoreBackup(here: Snapshot, b: Snapshot, now = Date.now()): { snap: Snapshot; restored: number } {
  const days: Days = { ...here.days };
  let restored = 0;
  Object.keys(b.days).forEach((k) => {
    const d = b.days[k];
    days[k] = { ...(days[k] || normDay(null, k)), events: d.events, checkin: d.checkin, p: d.p, u: now };
    restored++;
  });
  const reviews: Reviews = { ...here.reviews };
  Object.keys(b.reviews).forEach((k) => {
    reviews[k] = { k, a: b.reviews[k].a, u: now };
  });
  let settings = here.settings;
  if (b.settings) {
    const mine = here.settings ? here.settings.opts : b.settings.opts;
    settings = { ...normSettings(b.settings), u: now };
    settings.opts = mergeOpts(mine, settings.opts);
  }
  return { snap: { settings, days, reviews }, restored };
}

/* ---------- sync records ----------
   Everything is one of three kinds of record, each with its own id and a last-changed time (u, in ms):
     settings             the one settings record
     days/YYYY-MM-DD      one day
     reviews/wN           one weekly review
   Sync is last change wins, per record. That is the same rule the legacy app uses with its account database. */

export type RecordId = 'settings' | `days/${string}` | `reviews/${string}`;
export interface SyncRecord {
  id: RecordId;
  u: number;
  data: Settings | Day | Review | null; // null: deleted
}

export function parseId(id: string): { kind: 'settings' } | { kind: 'days' | 'reviews'; key: string } | null {
  if (id === 'settings') return { kind: 'settings' };
  const i = id.indexOf('/');
  if (i < 0) return null;
  const kind = id.slice(0, i);
  const key = id.slice(i + 1);
  if (kind === 'days' && isKey(key)) return { kind, key };
  if (kind === 'reviews' && isReviewKey(key)) return { kind, key };
  return null;
}

/** cleans a record that came from somewhere else (the server, another device). Returns null when it is not a valid record. */
export function normRecord(r: unknown): SyncRecord | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as { id?: unknown; u?: unknown; data?: unknown };
  if (typeof o.id !== 'string' || typeof o.u !== 'number' || !Number.isFinite(o.u)) return null;
  const p = parseId(o.id);
  if (!p) return null;
  if (o.data == null) return { id: o.id as RecordId, u: o.u, data: null };
  if (p.kind === 'settings') return { id: 'settings', u: o.u, data: { ...normSettings(o.data), u: o.u } };
  if (p.kind === 'days') return { id: o.id as RecordId, u: o.u, data: { ...normDay(o.data, p.key), u: o.u } };
  return { id: o.id as RecordId, u: o.u, data: { ...normReview(o.data, p.key), u: o.u } };
}

export function toRecords(s: Snapshot): SyncRecord[] {
  const out: SyncRecord[] = [];
  if (s.settings) out.push({ id: 'settings', u: s.settings.u || 0, data: s.settings });
  Object.keys(s.days).forEach((k) => out.push({ id: `days/${k}`, u: s.days[k].u || 0, data: s.days[k] }));
  Object.keys(s.reviews).forEach((k) => out.push({ id: `reviews/${k}`, u: s.reviews[k].u || 0, data: s.reviews[k] }));
  return out;
}

/** applies records to a snapshot. A record only replaces what is here when it changed later. */
export function applyRecords(s: Snapshot, recs: SyncRecord[]): { snap: Snapshot; changed: RecordId[] } {
  const snap: Snapshot = { settings: s.settings, days: { ...s.days }, reviews: { ...s.reviews } };
  const changed: RecordId[] = [];
  for (const raw of recs) {
    const r = normRecord(raw);
    if (!r) continue;
    const p = parseId(r.id)!;
    if (p.kind === 'settings') {
      if (snap.settings && (snap.settings.u || 0) >= r.u) continue;
      if (r.data) {
        snap.settings = r.data as Settings;
        changed.push(r.id);
      }
    } else if (p.kind === 'days') {
      const cur = snap.days[p.key as DayKey];
      if (cur ? (cur.u || 0) >= r.u : !r.data) continue;
      if (r.data) snap.days[p.key] = r.data as Day;
      else delete snap.days[p.key];
      changed.push(r.id);
    } else {
      const cur = snap.reviews[p.key];
      if (cur ? (cur.u || 0) >= r.u : !r.data) continue;
      if (r.data) snap.reviews[p.key] = r.data as Review;
      else delete snap.reviews[p.key];
      changed.push(r.id);
    }
  }
  return { snap, changed };
}
