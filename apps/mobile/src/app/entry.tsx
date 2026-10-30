/* One entry: add one (rode it out or slipped, and when), or open one to change what happened, the time, what set it off, what
   helped, a small step after a slip, a note, or delete it. A slip added here goes on to Rekindle at how it feels now, with
   no hold (docs/design-standards.md: a slip always reaches the comeback). Ported from the legacy sheetEvent and its actions. */
import {
  addEvent,
  addOption,
  didAdd,
  didIds,
  didToggle,
  fmtClock,
  fmtDate,
  gameCompute,
  isKey,
  moveEvent,
  optList,
  OPT_MAX,
  patchEvent,
  phaseOf,
  removeEvent,
  urSosLines,
  whenEntry,
  whenFromEntry,
  whenLabel,
  whenStart,
  type Outcome,
  type When,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { AddOwn, BigOption, Field } from '@/components/choices';
import { Pill } from '@/components/form';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, Chip, Icon, T } from '@/components/ui';
import { WhenPill, WhenSheet } from '@/components/when';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { WORDS } from '@/lib/words';
import { font, useTheme } from '@/lib/theme';

export default function Entry() {
  const params = useLocalSearchParams<{ date: string; id?: string }>();
  const c = useTheme();
  const { snap, tk, now, update, say } = useStore();
  const st = snap.settings;
  /* the log day the entry is on; changing when it happened can move it to another day */
  const [date, setDate] = useState(params.date);
  const [id, setId] = useState<string | null>(params.id || null);
  const [fresh, setFresh] = useState(false);
  const isToday = date === tk;
  const roll = st?.rollover ?? 4;
  /* a new entry: when it happened, now (or on an earlier day, this time of day) until changed; null is "not sure" */
  const [when, setWhen] = useState<When | null>(() => whenStart(params.date, Date.now(), roll));
  const [whenOpen, setWhenOpen] = useState(false);
  const [all, setAll] = useState(false);
  const [adding, setAdding] = useState<'trig' | 'did' | null>(null);
  const [del, setDel] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  if (!st || !isKey(date)) return <Redirect href="/" />;
  const e = id ? snap.days[date]?.events.find((x) => x.id === id) || null : null;

  if (!e) {
    const ph = phaseOf(date, st);
    const pick = (v: Outcome) => {
      let nid = '';
      const pts0 = gameCompute(snap.days, st, snap.reviews, tk).pts;
      const at = when ? whenEntry(when, roll) : { key: date, time: null };
      update((s0) => {
        const r = addEvent(s0.days, at.key, v, at.time);
        nid = r.id;
        return { ...s0, days: r.days };
      });
      buzz('save');
      if (v === 'slipped') {
        closeSheet();
        router.push({ pathname: '/log', params: { date: at.key, evId: nid, outcome: 'slipped', step: 'slNow', from: 'entry', pts0: String(pts0) } });
        return;
      }
      setDate(at.key);
      setId(nid);
      setFresh(true);
    };
    return (
      <SheetFrame title="Add an entry">
        <T style={{ fontSize: 17 }}>{isToday ? 'What happened?' : 'What happened on ' + fmtDate(date) + '?'}</T>
        <WhenPill w={when || whenStart(date, now, roll)} none={!when} now={now} onPress={() => setWhenOpen(true)} />
        <WhenSheet
          open={whenOpen}
          value={when || whenFromEntry(date, null, roll, '12:00')}
          now={Date.now()}
          roll={roll}
          allowNone
          onClose={() => setWhenOpen(false)}
          onSave={(w) => {
            setWhenOpen(false);
            setWhen(w);
          }}
        />
        <T v="small" tone="muted">
          {isToday ? 'Filled in for you. Tap it if this happened earlier.' : 'Tap it to set the time, or say you are not sure.'}
          {ph.p === 'tracking' ? ' Tracking week: no pass or fail, just learning.' : ''} Either choice earns points for being honest.
        </T>
        {/* the two answers sit low, by the thumb */}
        <Dock>
          <BigOption tone="mint" icon="wave" title="Rode it out" sub="The urge came and I did not act on it." onPress={() => pick('rode')} />
          <BigOption tone="slip" icon="leaf" title="I slipped" sub="A slip is data, not a reset." onPress={() => pick('slipped')} />
        </Dock>
      </SheetFrame>
    );
  }

  const rode = e.outcome === 'rode';
  const patch = (p: Parameters<typeof patchEvent>[3]) => update((s0) => ({ ...s0, days: patchEvent(s0.days, date, e.id, p) }));
  const op = st.opts;
  const picker = (kind: 'trig' | 'did', cur: string | string[] | null, onPick: (v: string) => void) => {
    const L = optList(kind, op, { time: e.time, sel: cur, all });
    const full = op[kind].filter((x) => !x.off).length >= OPT_MAX;
    return (
      <View style={{ gap: 8 }}>
        <View style={s.chips}>
          {L.list.map(([v, label]) => (
            <Chip key={v} label={label} on={Array.isArray(cur) ? cur.indexOf(v) >= 0 : cur === v} onPress={() => onPick(v)} />
          ))}
          {L.hidden && !all ? <Chip label="Show all" on={false} onPress={() => setAll(true)} /> : null}
          {adding === kind || full ? null : <Chip label="+ Add your own" on={false} onPress={() => setAdding(kind)} />}
        </View>
        {adding === kind ? (
          <AddOwn
            kind={kind}
            onCancel={() => setAdding(null)}
            onSave={(text) => {
              const r = addOption(st, kind, text);
              if (!r.id) {
                say(text.trim() ? 'That list is full. Remove one in My plan, under Lists, first.' : WORDS.needWords);
                return;
              }
              const nid = r.id;
              update((s0) => ({
                ...s0,
                settings: r.st,
                days: patchEvent(s0.days, date, e.id, kind === 'did' ? { did: didAdd(e.did, nid) } : { trigger: nid }),
              }));
              setAdding(null);
            }}
          />
        ) : null}
      </View>
    );
  };
  const sos = urSosLines(e);
  return (
    <SheetFrame title={(rode ? 'Rode it out' : 'Slipped') + (e.time ? ' · ' + fmtClock(e.time) : '')} scrollRef={scroll}>
      {fresh ? (
        <View style={[s.saved, { backgroundColor: c.mintSoft }]}>
          <T tone="mintText" style={{ flex: 1 }}>
            ✓ Saved{rode ? '. That counts.' : '. That took honesty.'}
          </T>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              /* a mistaken log taken back: its points go with it (they were never really earned) */
              update((s0) => ({ ...s0, days: removeEvent(s0.days, date, e.id) }), { takeBack: true });
              closeSheet();
            }}>
            <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={s.chips} accessibilityLabel="What happened">
        <Pill label="Rode it out" on={rode} onPress={() => !rode && patch({ outcome: 'rode', recovered: false })} />
        <Pill
          label="Slipped"
          on={!rode}
          onPress={() => {
            if (!rode) return;
            /* a slip has no pause or "what I did", so they go; a mis-tap gets them back with Undo */
            const was = { outcome: e.outcome, paused: e.paused, did: e.did, recovered: e.recovered };
            patch({ outcome: 'slipped', paused: null, did: null });
            if (e.paused != null || e.did) say('Changed to Slipped.', () => patch(was));
          }}
        />
      </View>
      <WhenPill w={whenFromEntry(date, e.time, roll, '12:00')} none={!e.time} now={now} onPress={() => setWhenOpen(true)} />
      <WhenSheet
        open={whenOpen}
        value={whenFromEntry(date, e.time, roll, '12:00')}
        now={Date.now()}
        roll={roll}
        allowNone
        onClose={() => setWhenOpen(false)}
        onSave={(w) => {
          setWhenOpen(false);
          if (!w) return patch({ time: null });
          const at = whenEntry(w, roll);
          update((s0) => ({ ...s0, days: moveEvent(s0.days, date, at.key, e.id, { time: at.time }) }));
          if (at.key !== date) say('Moved to ' + whenLabel(w, Date.now()) + '.');
          setDate(at.key);
        }}
      />
      {sos.length ? (
        <View style={[s.sos, { backgroundColor: c.violetSoft }]}>
          <T v="small" tone="violetText" style={{ fontFamily: font.bodyBold, letterSpacing: 0.6 }}>
            FROM SOS
          </T>
          {sos.map((x, i) => (
            <T key={i}>{x}</T>
          ))}
        </View>
      ) : null}
      <SheetH title="What set it off?" aside="optional" />
      {picker('trig', e.trigger, (v) => patch({ trigger: e.trigger === v ? null : v }))}
      {rode ? (
        <>
          <SheetH title="Paused 10 minutes first?" />
          <View style={s.chips}>
            <Pill label="Yes" on={e.paused === true} onPress={() => patch({ paused: e.paused === true ? null : true })} />
            <Pill label="No" on={e.paused === false} onPress={() => patch({ paused: e.paused === false ? null : false })} />
          </View>
          <SheetH title="What I did" aside="optional, pick any" />
          {picker('did', didIds(e.did), (v) => {
            const next = didToggle(e.did, v);
            patch({ did: next.length ? next : null });
          })}
        </>
      ) : (
        <View style={[s.care, { backgroundColor: c.sunSoft }]}>
          <T>Nothing resets. One small step within the hour keeps the snowball from starting.</T>
          <Chip
            label={e.recovered ? '✓ I did one small thing' : 'I did one small thing'}
            on={!!e.recovered}
            onPress={() => patch({ recovered: !e.recovered })}
          />
          <T v="small" tone="muted">
            Water, step outside, or text someone.
          </T>
        </View>
      )}
      <KeepAbove style={{ gap: 14 }}>
        <Field
          label="Note (optional)"
          multiline
          maxLength={500}
          defaultValue={e.note}
          placeholder="What would make this easier next time?"
          onChangeText={(t) => patch({ note: t })}
        />
        <Button label="Done" onPress={closeSheet} />
      </KeepAbove>
      {del ? (
        <View style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
          <T v="label">Delete this entry?</T>
          <View style={s.chips}>
            <Button
              kind="danger"
              label="Yes, delete"
              onPress={() => {
                const ev = e;
                update((s0) => ({ ...s0, days: removeEvent(s0.days, date, ev.id) }));
                closeSheet();
                /* put back as it was, with its id, if that was a mis-tap */
                say('Deleted.', () => update((s0) => ({ ...s0, days: addEvent(s0.days, date, ev.outcome, ev.time, { ...ev }).days })));
              }}
            />
            <Button kind="ghost" label="Keep it" onPress={() => setDel(false)} />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setDel(true);
            /* the question opens below the fold: bring it up */
            setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
          }}
          style={s.delBtn}>
          <Icon name="trash" size={18} color={c.danger} />
          <Text style={{ fontFamily: font.bodySemi, color: c.danger }}>Delete</Text>
        </Pressable>
      )}
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14 },
  sos: { gap: 4, padding: 12, borderRadius: 14 },
  care: { gap: 8, padding: 12, borderRadius: 14 },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
});
