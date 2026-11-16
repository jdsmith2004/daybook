/* One ring from the Screen Time page, on its own (components/screen-time.tsx; core pull.ts): a list (?id=a, b or c) or adult
   sites (?id=adult). The wait is the big ring in the middle, as full as the wait is long, and the choices sit under it, low,
   with the main button at the bottom: Change the apps for a list.

   A list: its wait, its name (with its picture), its apps from Apple's own list, and Remove. Adult sites: the long wait on or off,
   how long it is, and a way to start it now. A shorter wait, No wait, a removed list or adult sites turned off waits for 6 AM
   unless it is the morning (loosen slowly, tighten at once), and the page says so. Daybook never learns which apps are in a list:
   only how many. */
import {
  fmtClock,
  habitOf,
  PULL_LIFT,
  PULL_LIST_NAMES,
  PULL_NIGHT_END,
  PULL_WAIT,
  pullSettle,
  pullShown,
  pullWaitLabel,
  type PullListId,
  type PullPrefs,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { Screen } from '@/components/screen';
import { ListIcon, Tiles, waitFill, waitParts, WaitRing } from '@/components/screen-time';
import { Toggle } from '@/components/settings-ui';
import { Text } from '@/components/text';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { pullListSet, pullPick, pullSet, usePullPicked, usePullPrefs } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const RING = 196;

export default function PullListPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { snap, say } = useStore();
  const c = useTheme();
  const p = usePullPrefs();
  const shown = pullShown(p).lists;
  const l = shown.find((x) => x.id === id);
  const picked = usePullPicked(l ? [l.id] : []);
  const st = snap.settings;
  if (!p.on || !st) return <Redirect href="/settings/pull" />;
  if (id === 'adult' && habitOf(st) === 'porn') return <AdultPage p={p} say={say} />;
  if (!l) return <Redirect href="/settings/pull" />;
  const lid = l.id as PullListId;
  const morning = 'Looser settings start in the morning. This one starts at ' + fmtClock(PULL_NIGHT_END) + '.';
  /* the wait it has now, when a looser one is waiting for the morning */
  const now = p.lists.find((x) => x.id === lid);
  const n = picked[lid];
  const [big, unit] = waitParts(l.wait);
  return (
    <Screen title={l.name} back="Screen Time" icon={<ListIcon name={l.name} size={30} color={c.accentText} />}>
      <Dial sec={l.wait} big={big} unit={unit} line={n != null ? n + (n === 1 ? ' app waits' : ' apps wait') : ' '} />
      {now && now.wait !== l.wait ? <Held line={'Until ' + fmtClock(PULL_NIGHT_END) + ', it still waits ' + pullWaitLabel(now.wait) + '.'} /> : null}

      <Part head="The wait">
        <Tiles
          label="The wait"
          opts={PULL_WAIT.map((w) => {
            const [a, b] = waitParts(w);
            return { v: w, n: a, u: b, label: pullWaitLabel(w) };
          })}
          value={l.wait}
          onPick={(w) => {
            if (pullListSet(lid, { wait: w })) say(morning);
          }}
        />
      </Part>

      <Part head="Call it">
        <Names value={l.name} onPick={(name) => pullListSet(lid, { name })} />
      </Part>

      <View style={{ gap: 8, marginTop: 8 }}>
        <Button
          label="Change the apps"
          kind="warm"
          onPress={async () => {
            const at = await pullPick(lid);
            if (at) say('The apps you took out still wait until ' + fmtClock(PULL_NIGHT_END) + '. Looser settings start in the morning.');
          }}
        />
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          Apple keeps the list. Nothing about your apps leaves this phone.
        </T>
        {shown.length > 1 ? (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Link
              label="Remove this list"
              tone="danger"
              onPress={() => {
                const at = pullListSet(lid, null);
                say(at ? 'Its apps still wait until ' + fmtClock(PULL_NIGHT_END) + ', then the list is gone.' : 'The list is gone.');
                router.back();
              }}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/** adult sites: the long wait on or off, how long, and a way to start it now */
function AdultPage({ p, say }: { p: PullPrefs; say: (m: string) => void }) {
  const c = useTheme();
  const shown = pullShown(p);
  const live = pullSettle(p, Date.now());
  const sec = shown.adult ? shown.lift * 60 : 0;
  const [big, unit] = shown.adult ? waitParts(sec) : ['Off', ''];
  const set = (ch: Partial<PullPrefs>) => {
    if (pullSet(ch)) say('Looser settings start in the morning. This one starts at ' + fmtClock(PULL_NIGHT_END) + '.');
  };
  const held = !!p.later && ('adult' in p.later.p || 'lift' in p.later.p);
  const mins = (n: number) => (n === 1 ? '1 minute' : n + ' minutes');
  return (
    <Screen title="Adult sites" back="Screen Time" icon={<ListIcon name="adult" size={30} color={c.accentText} />}>
      <Dial sec={sec} big={big} unit={unit} line={shown.adult ? 'All day, in every browser' : 'They open with no wait'} />
      {held ? (
        <Held line={'Until ' + fmtClock(PULL_NIGHT_END) + ', ' + (live.adult ? 'they still wait ' + mins(live.lift) + '.' : 'they still open with no wait.')} />
      ) : null}

      <View style={[s.row, { backgroundColor: c.surface }]}>
        <T v="label" style={{ flex: 1 }}>
          A long wait first
        </T>
        <Toggle on={shown.adult} label="A long wait first" onChange={(on) => set({ adult: on })} />
      </View>

      {shown.adult ? (
        <Part head="The wait">
          <Tiles
            label="The wait"
            opts={PULL_LIFT.map((n) => ({ v: n, n: String(n), u: 'min', label: mins(n) }))}
            value={shown.lift}
            onPick={(n) => set({ lift: n })}
          />
        </Part>
      ) : null}

      <T v="small" tone="muted">
        Apple’s adult filter, in Safari and other browsers. After the wait you choose how long they open, then the filter is back.
      </T>

      {live.adult ? (
        <View style={{ alignItems: 'center' }}>
          <Link
            label={'Start the ' + (live.lift === 1 ? '1-minute' : live.lift + '-minute') + ' wait now'}
            onPress={() => router.push({ pathname: '/pause', params: { w: 'long' } })}
          />
        </View>
      ) : null}
    </Screen>
  );
}

/** the big ring: the wait written inside, a line under it */
function Dial({ sec, big, unit, line }: { sec: number; big: string; unit: string; line: string }) {
  const c = useTheme();
  return (
    <View style={s.dial} accessible accessibilityLabel={(sec ? big + ' ' + (unit === 'sec' ? 'seconds' : 'minutes') : big + ' ' + unit) + '. ' + line}>
      <WaitRing size={RING} stroke={12} fill={waitFill(sec)} color={c.sun} track={c.scheme === 'dark' ? 'rgba(255,255,255,0.12)' : c.line}>
        <Text style={[s.big, { color: c.ink }]}>{big}</Text>
        {unit ? <Text style={[s.unit, { color: c.muted }]}>{unit}</Text> : null}
      </WaitRing>
      <T tone="muted" style={{ textAlign: 'center' }}>
        {line}
      </T>
    </View>
  );
}

/** a looser choice waiting for the morning */
function Held({ line }: { line: string }) {
  return (
    <T v="small" tone="sunText" style={{ textAlign: 'center', fontFamily: font.bodySemi }}>
      {line}
    </T>
  );
}

function Part({ head, children }: { head: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <T v="h2">{head}</T>
      {children}
    </View>
  );
}

/** the six names, each with its picture, three to a row; the chosen one filled */
function Names({ value, onPick }: { value: string; onPick: (n: (typeof PULL_LIST_NAMES)[number]) => void }) {
  const c = useTheme();
  return (
    <View style={s.names} accessibilityRole="radiogroup" accessibilityLabel="Call it">
      {PULL_LIST_NAMES.map((n) => {
        const on = n === value;
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={n}
            onPress={() => {
              if (on) return;
              buzz('tap');
              onPick(n);
            }}
            style={({ pressed }) => [s.name, { backgroundColor: on ? c.accent : c.surface, opacity: pressed ? 0.8 : 1 }]}>
            <ListIcon name={n} size={24} color={on ? c.accentInk : c.accentText} />
            <Text style={[s.nameT, { color: on ? c.accentInk : c.ink }]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  dial: { alignItems: 'center', gap: 12, marginTop: 8 },
  big: { fontFamily: font.displayBold, fontSize: 56, lineHeight: 60, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 16, minHeight: 56, marginTop: 8 },
  names: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  name: { width: '31.6%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16, minHeight: 72, paddingVertical: 10 },
  nameT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
});
