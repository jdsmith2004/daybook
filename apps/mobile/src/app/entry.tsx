/* One entry: add one (rode it out or slipped, and when), or open one to change what happened, the time, what set it off, what
   helped, a small step after a slip, a note, or delete it. Ported from the legacy sheetEvent and its actions. */
import {
  addEvent,
  addOption,
  clockOf,
  didAdd,
  didIds,
  didToggle,
  fmtClock,
  fmtDate,
  isKey,
  isTime,
  optList,
  OPT_MAX,
  patchEvent,
  phaseOf,
  removeEvent,
  urSosLines,
  type Outcome,
} from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddOwn, BigOption, Field } from '@/components/choices';
import { Pill } from '@/components/form';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Entry() {
  const params = useLocalSearchParams<{ date: string; id?: string }>();
  const c = useTheme();
  const { snap, tk, update, say } = useStore();
  const st = snap.settings;
  const date = params.date;
  const [id, setId] = useState<string | null>(params.id || null);
  const [fresh, setFresh] = useState(false);
  const isToday = date === tk;
  const [timeText, setTimeText] = useState<string>(() => {
    const e = params.id ? snap.days[date]?.events.find((x) => x.id === params.id) : null;
    return e ? e.time || '' : isToday ? clockOf(Date.now()) : '';
  });
  const [all, setAll] = useState(false);
  const [adding, setAdding] = useState<'trig' | 'did' | null>(null);
  const [del, setDel] = useState(false);
  if (!st || !isKey(date)) return <Redirect href="/" />;
  const e = id ? snap.days[date]?.events.find((x) => x.id === id) || null : null;

  if (!e) {
    const ph = phaseOf(date, st);
    const pick = (v: Outcome) => {
      let nid = '';
      update((s0) => {
        const r = addEvent(s0.days, date, v, isTime(timeText) ? timeText : null);
        nid = r.id;
        return { ...s0, days: r.days };
      });
      setId(nid);
      setFresh(true);
      buzz('save');
    };
    return (
      <SheetFrame title="Add an entry">
        <T style={{ fontSize: 18 }}>{isToday ? 'What happened?' : 'What happened on ' + fmtDate(date) + '?'}</T>
        <View style={{ gap: 10 }}>
          <BigOption tone="mint" icon="wave" title="Rode it out" sub="The urge came and I didn't act on it." onPress={() => pick('rode')} />
          <BigOption tone="slip" icon="leaf" title="I slipped" sub="A slip is data, not a reset." onPress={() => pick('slipped')} />
        </View>
        <Field label="Time (24-hour, like 22:30)" value={timeText} keyboardType="numbers-and-punctuation" maxLength={5} placeholder="22:30" onChangeText={setTimeText} />
        <T v="small" tone="muted">
          {isToday ? 'Filled in for you. Change it if this happened earlier.' : 'Leave it empty if you are not sure.'}
          {ph.p === 'tracking' ? ' Tracking week: no pass or fail, just learning.' : ''} Either choice earns points for being honest.
        </T>
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
                say(text.trim() ? 'That list is full. Remove one in My plan, under Lists, first.' : 'Type a few words first.');
                return;
              }
              const nid = r.id;
              update((s0) => ({ ...s0, settings: r.st, days: patchEvent(s0.days, date, e.id, kind === 'did' ? { did: didAdd(e.did, nid) } : { trigger: nid }) }));
              setAdding(null);
            }}
          />
        ) : null}
      </View>
    );
  };
  const sos = urSosLines(e);
  return (
    <SheetFrame title={(rode ? 'Rode it out' : 'Slipped') + (e.time ? ' · ' + fmtClock(e.time) : '')}>
      {fresh ? (
        <View style={[s.saved, { backgroundColor: c.mintSoft }]}>
          <T tone="mintText" style={{ flex: 1 }}>
            ✓ Saved{rode ? '. That counts.' : '. That took honesty.'}
          </T>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              update((s0) => ({ ...s0, days: removeEvent(s0.days, date, e.id) }));
              closeSheet();
            }}>
            <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={s.chips} accessibilityLabel="What happened">
        <Pill label="Rode it out" on={rode} onPress={() => !rode && patch({ outcome: 'rode', recovered: false })} />
        <Pill label="Slipped" on={!rode} onPress={() => rode && patch({ outcome: 'slipped', paused: null, did: null })} />
      </View>
      <Field
        label="Time (24-hour, like 22:30)"
        value={timeText}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        placeholder="22:30"
        onChangeText={(t) => {
          setTimeText(t);
          if (isTime(t)) patch({ time: t });
          else if (!t) patch({ time: null });
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
          <Chip label={e.recovered ? '✓ I did one small thing' : 'I did one small thing'} on={!!e.recovered} onPress={() => patch({ recovered: !e.recovered })} />
          <T v="small" tone="muted">
            Water, step outside, or text someone.
          </T>
        </View>
      )}
      <Field label="Note (optional)" multiline maxLength={500} defaultValue={e.note} placeholder="What would make this easier next time?" onChangeText={(t) => patch({ note: t })} />
      <Button label="Done" onPress={closeSheet} />
      {del ? (
        <View style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
          <T v="label">Delete this entry?</T>
          <View style={s.chips}>
            <Button
              kind="danger"
              label="Yes, delete"
              onPress={() => {
                update((s0) => ({ ...s0, days: removeEvent(s0.days, date, e.id) }));
                closeSheet();
                say('Deleted.');
              }}
            />
            <Button kind="ghost" label="Keep it" onPress={() => setDel(false)} />
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setDel(true)} style={s.delBtn}>
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
