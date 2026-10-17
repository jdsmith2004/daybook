/* One Get help page: Talk to a person, Therapy on a small budget, Free groups, Faith and recovery, Phone and night setup,
   What to say, and Sources. The words are the legacy app's, kept as they are. Ported from the legacy pagePeople, pageTherapy,
   pageGroups, pageFaith, pagePhone, pageSay and pageSources. */
import {
  fmtClock,
  HELP_PAGES,
  HELP_SRC,
  HELP_SUBS,
  LESSONS,
  safeName,
  SCRIPTS,
  setTherapistName,
  THERAPIST_CRIT,
  toggleTherapist,
  type HelpPage,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Segments } from '@/components/form';
import { B, ChipBtn, Code, CopyChip, Ext, Fine, HCard, Links, Note, NumRow, OL, P, RelLesson, Sec, UL } from '@/components/help-bits';
import { HelpFoot } from '@/components/help-foot';
import { LinkCard } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { Card, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const msg = () => router.push({ pathname: '/tool/[id]', params: { id: 'message' } });
const tool = (id: string) => router.push({ pathname: '/tool/[id]', params: { id } });
const help = (id: string) => router.push({ pathname: '/help/[id]', params: { id } });
const urgePlan = () => router.push({ pathname: '/plan', params: { pane: 'plans', sub: 'urge' } });

export default function HelpPageRoute() {
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: string }>();
  if (id === 'plan') return <Redirect href={{ pathname: '/plan', params: { pane: 'plans', ...(sub ? { sub } : {}) } }} />;
  if (id === 'playbook') return <Redirect href={{ pathname: '/plan', params: { pane: 'learned' } }} />;
  if (id === 'sources') return <Sources />;
  if (!(id in HELP_PAGES)) return <Redirect href="/help" />;
  const pg = HELP_PAGES[id as HelpPage];
  return (
    <Screen title={pg.t} sub={<T tone="muted">{pg.s}</T>} back="Get help">
      {id === 'people' ? (
        <People />
      ) : id === 'therapy' ? (
        <Therapy sub={sub} />
      ) : id === 'groups' ? (
        <Groups />
      ) : id === 'faith' ? (
        <Faith />
      ) : id === 'phone' ? (
        <Phone sub={sub} />
      ) : (
        <Say />
      )}
      <HelpFoot />
    </Screen>
  );
}

function useSub(page: 'therapy' | 'phone', want?: string) {
  const list = HELP_SUBS[page] as [string, string][];
  return useState<string>(list.some((x) => x[0] === want) ? want! : list[0][0]);
}

/* ---------- people ---------- */
function People() {
  const { snap } = useStore();
  const nm = safeName(snap.settings);
  return (
    <>
      <P>A real voice can take the edge off, even for a few minutes. You do not have to be in a crisis to call.</P>
      <Sec title="Your safe person">
        {nm ? (
          <LinkCard icon="chat" title={'Text ' + nm} sub="Texts ready to copy, or write your own" onPress={msg} />
        ) : (
          <>
            <P>One person you can text when it is hard. Add their name in My plan, and Reach a person will start with them.</P>
            <LinkCard icon="shield" title="Pick a safe person" sub="In My plan" onPress={() => router.push({ pathname: '/plan', params: { to: 'safe' } })} />
          </>
        )}
      </Sec>
      <Sec title="Any hour">
        <Card>
          <NumRow
            name="988 Suicide & Crisis Lifeline"
            num="988"
            note="Call or text, or chat at 988lifeline.org. Free, 24/7. The name says suicide because it is there for that. It is also open to anyone who is struggling or needs to talk. A counselor starts by asking if you are safe. Answer honestly, then say what is going on."
            copy="988"
          />
          <NumRow
            name="Crisis Text Line"
            num="Text HOME to 741741"
            note="Free, 24/7. For anyone facing a hard time, whatever you are going through. A live volunteer counselor, usually within about 5 minutes. (Text HOLA for Spanish.) Message and data rates may apply. Volunteers are not medical professionals."
            copy="741741"
          />
          <NumRow
            name="SAMHSA National Helpline"
            num="1-800-662-4357"
            note="Free, confidential, 24/7, in English and Spanish. Treatment referrals and information."
            copy="1-800-662-4357"
          />
        </Card>
      </Sec>
      <Sec title="Other helplines">
        <T v="small" tone="muted">
          Hours are more limited. Check each one before you call.
        </T>
        <Card>
          <NumRow
            name="NAMI HelpLine"
            num="1-800-950-6264"
            note="Mental health information and referrals, Mon to Fri 10 AM to 10 PM Eastern. Or text “helpline” to 62640. Not a crisis line: for a crisis, call or text 988."
            copy="1-800-950-6264"
          />
          <NumRow name="211" num="2-1-1" note="Dial 211 for local services and referrals. Free and confidential. Hours and services vary by area." copy="211" />
          <T v="label">Warmlines</T>
          <P>
            A warmline is a peer-run phone line that offers callers emotional support, answered by volunteers who are in recovery themselves. Which lines there
            are, and their hours, depend on your state.
          </P>
          <Links>
            <Ext url="https://nami.org/Support-Education/NAMI-HelpLine/NAMI-Warmline-Directory" label="NAMI Warmline Directory" />
          </Links>
        </Card>
      </Sec>
      <Sec title="If your worries involve children">
        <P>
          Stop It Now is a confidential helpline for adults who are worried about their own sexual thoughts or behavior toward children, or about someone
          else’s. Reaching out before anything happens is exactly what it is for.
        </P>
        <Card>
          <NumRow
            name="Stop It Now helpline"
            num="1-888-773-8368"
            note="Free and confidential. Weekday daytime hours (Eastern time), plus chat and email. Check the hours on their site."
            copy="1-888-773-8368"
          />
        </Card>
      </Sec>
      <Note>Phone numbers are shown as text on purpose. Tap Copy, then paste it into your phone app.</Note>
      <Links>
        <Ext url="https://988lifeline.org/" label="988lifeline.org" />
        <Ext url="https://www.crisistextline.org/text-us/" label="Crisis Text Line" />
        <Ext url="https://www.samhsa.gov/find-help/helplines/national-helpline" label="SAMHSA helpline" />
        <Ext url="https://www.stopitnow.org/helpnow" label="Stop It Now" />
      </Links>
      <HCard title="A person you already know">
        <P>
          If someone already knows, a two-minute check-in with them is a real head start. Use “Reach a person” in Learn, under Tools, if you want a text that is
          ready to send.
        </P>
      </HCard>
      <RelLesson id="l7" />
    </>
  );
}

/* ---------- therapy ---------- */
function Therapy({ sub: want }: { sub?: string }) {
  const [sub, setSub] = useSub('therapy', want);
  return (
    <>
      <Segments label="Therapy on a small budget sections" list={HELP_SUBS.therapy} cur={sub} onPick={setSub} />
      {sub === 'start' ? (
        <>
          <P>You do not need much money to begin. Try these in order. Each one is a single phone call or form.</P>
          <HCard title="1. Your job’s EAP (Employee Assistance Program)">
            <P>
              Free, confidential short-term counseling that many employers offer. The number of sessions varies by employer. Look in your benefits portal or ask
              HR for the number. If you need more than the EAP covers, they can refer you onward.
            </P>
          </HCard>
          <HCard title="2. Open Path Collective" links={<Ext url="https://openpathcollective.org/" label="openpathcollective.org" />}>
            <P>
              Sliding-scale therapy for people without insurance, or without enough mental health coverage, who cannot afford the usual $80 to $200 a session.
              Individual sessions cost $40 to $70 ($30 with a student intern, where offered), plus a one-time $65 membership. It is self-pay, not insurance. You
              browse therapists and pick one.
            </P>
          </HCard>
          <HCard title="3. Community health centers" links={<Ext url="https://findahealthcenter.hrsa.gov/" label="Find a health center" />}>
            <P>
              Community health centers in the HRSA program adjust their fees by income and family size. Their promise: even if you cannot pay, you will not be
              turned away. Services may include mental health counseling.
            </P>
          </HCard>
          <HCard
            title="4. Ask for a sliding scale"
            links={
              <>
                <Ext url="https://findtreatment.gov/" label="findtreatment.gov" />
                <Ext url="https://www.psychologytoday.com/" label="Psychology Today" />
              </>
            }>
            <P>
              Many private therapists keep a few reduced-fee spots. SAMHSA says to ask about a sliding-fee scale when you call to book. On Psychology Today you
              can filter for “Sliding Scale.” Try: “Do you currently offer any sliding scale or reduced-fee spots?” There may be a waitlist, and online therapy
              is sometimes cheaper.
            </P>
          </HCard>
          <HCard title="5. Training clinics">
            <P>
              Ask nearby universities with psychology or counseling graduate programs whether they run a low-fee clinic. I could not confirm how any one clinic
              works, so ask them about fees and who sees you.
            </P>
          </HCard>
          <HCard title="If you have insurance" links={<Ext url="https://www.healthcare.gov/" label="healthcare.gov" />}>
            <P>
              Healthcare.gov says all Marketplace plans cover mental health and substance use services, including therapy and counseling. Details vary by state
              and plan, so call the number on your card and ask about “outpatient mental health” and copays.
            </P>
          </HCard>
          <HCard
            title="If you pay without insurance"
            links={<Ext url="https://www.cms.gov/medical-bill-rights/know-your-rights/no-insurance" label="CMS: your rights" />}>
            <P>
              You have a right to a Good Faith Estimate: providers must give you a cost estimate when you schedule (at least 3 business days ahead), or if you
              ask. Ask in writing. If a bill comes in $400 or more above the estimate, you can dispute it. Start within 120 days of the first bill.
            </P>
          </HCard>
        </>
      ) : (
        <>
          <FitCheck />
          <HCard title="Good signs">
            <UL
              items={[
                'They can explain how they would work with this habit, in plain words',
                'They set goals with you and go at your pace',
                'Practical, skills-based approaches (like CBT or ACT) suit many people',
                'They ask what matters to you, including your values and faith',
              ]}
            />
          </HCard>
          <HCard title="Red flags">
            <UL
              items={[
                'Shaming, lecturing, or treating you as broken',
                'Promising a cure or guaranteed results',
                'Pushing an expensive package before you have even met',
                'Not willing to explain their approach',
              ]}
            />
          </HCard>
          <HCard title="It is okay to switch">
            <P>
              A bad first fit says nothing about you. If your faith matters to you, it is fair to ask whether the therapist is comfortable working with it. Some
              people prefer a faith-based counselor and some prefer a secular one. Either is fine.
            </P>
          </HCard>
        </>
      )}
      <RelLesson id="l11" />
    </>
  );
}

function FitCheck() {
  const c = useTheme();
  const { snap, apply } = useStore();
  const thr = snap.settings!.therapist;
  const name = (k: number) => thr.names[k] || 'Therapist ' + (k + 1);
  return (
    <Card>
      <T v="h2">Is this therapist a fit?</T>
      <P>
        Check their license on your state licensing board’s website. Then book a free 15-minute intro call if they offer one, and use the questions in What to
        say. Trust your gut about how you feel when you hang up.
      </P>
      <View style={s.names}>
        {[0, 1, 2].map((k) => (
          <TextInput
            key={k}
            accessibilityLabel={'Therapist ' + (k + 1) + ' name'}
            maxLength={40}
            placeholder={'Therapist ' + (k + 1)}
            placeholderTextColor={c.muted}
            defaultValue={thr.names[k]}
            onChangeText={(v) => apply({ st: setTherapistName(snap.settings!, k, v) })}
            style={[s.name, { backgroundColor: c.surface, borderColor: c.line, color: c.ink }]}
          />
        ))}
      </View>
      {THERAPIST_CRIT.map((t, r) => (
        <View key={r} style={[s.crit, { borderColor: c.line }]}>
          <T style={{ flex: 1 }}>{t}</T>
          <View style={s.checks}>
            {[0, 1, 2].map((k) => {
              const on = !!thr.checks[r][k];
              return (
                <Pressable
                  key={k}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={name(k) + ': ' + t}
                  onPress={() => apply({ st: toggleTherapist(snap.settings!, r, k) })}
                  style={[s.sq, { backgroundColor: on ? c.mintSoft : c.surface, borderColor: on ? c.mintText : c.line }]}>
                  <Text style={{ fontFamily: font.bodyBold, color: on ? c.mintText : c.ink }}>{on ? '✓' : k + 1}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <T v="small" tone="muted">
        Checks passed:{' '}
        {[0, 1, 2].map((k) => (thr.names[k] || '#' + (k + 1)) + ' ' + thr.checks.filter((row) => row[k]).length + ' of ' + THERAPIST_CRIT.length).join(' · ')}.
      </T>
    </Card>
  );
}

/* ---------- groups ---------- */
function Groups() {
  return (
    <>
      <P>
        Groups are free. The first time you can just listen. Many online meetings let you keep your camera off. Try two or three before deciding, because the
        feel of a group matters more than its name.
      </P>
      <HCard title="SMART Recovery" links={<Ext url="https://meetings.smartrecovery.org/" label="Find a meeting" />}>
        <P>
          Free, skills-based meetings for any problematic or addictive behavior, online (mostly on Zoom) and in person, led by trained facilitators. Video is
          optional. Not a 12-step program.
        </P>
      </HCard>
      <HCard title="Sex Addicts Anonymous (SAA)" links={<Ext url="https://saa-recovery.org/meetings/" label="SAA meetings" />}>
        <P>
          A fellowship that uses 12 steps adapted from AA, open to anyone who suffers from sex addiction. Their office line is 1-800-477-8191 (Mon to Fri, 10 AM
          to 6 PM Central).
        </P>
      </HCard>
      <HCard
        title="Sex and Love Addicts Anonymous (SLAA)"
        links={
          <>
            <Ext url="https://slaafws.org/meetings" label="SLAA meetings" />
            <Ext url="https://slaafws.org/onlinemeetings/" label="Online meetings" />
          </>
        }>
        <P>
          No dues or fees, first names only. The program is spiritual in nature but is not tied to any religion, and you do not have to believe in God. Online
          and telephone meetings exist. Careful with the web address: the real site is slaafws.org. A similar-looking address belongs to something unrelated.
        </P>
      </HCard>
      <HCard title="Sexaholics Anonymous (SA)" links={<Ext url="https://sa.org/meetings/" label="SA meetings" />}>
        <P>
          Covers lust, sex, and pornography. The only requirement is a desire to stop lusting. SA defines sobriety strictly. For unmarried members it means
          freedom from sex of any kind. For married members it means no sex with oneself or with anyone other than the spouse. It also includes “progressive
          victory over lust.” Read their definition first and see if it fits you. Toll-free: 866-424-8777.
        </P>
      </HCard>
      <HCard title="Celebrate Recovery" links={<Ext url="https://www.celebraterecovery.com/" label="Find a group" />}>
        <P>
          A Christ-centered program for “hurts, hang-ups and habits,” started at Saddleback Church in 1991. Since your faith matters to you, this may fit. Ask
          the local group what they run and whether it covers porn use.
        </P>
      </HCard>
      <HCard title="Your first meeting">
        <UL
          items={[
            'Listening is enough. You never have to share.',
            'You can leave any time.',
            'If one does not fit, try another. They really are different.',
            'Take what helps and leave the rest.',
          ]}
        />
      </HCard>
      <RelLesson id="l11" />
      <RelLesson id="l25" />
      <RelLesson id="l26" />
      <RelLesson id="l28" />
    </>
  );
}

/* ---------- faith and recovery ---------- */
function Faith() {
  const { snap } = useStore();
  const words = snap.settings!.words || [];
  const copy = (i: number, label: string) => <CopyChip text={SCRIPTS[i][1]} label={label} />;
  return (
    <>
      <P>
        Faith can be a real strength in recovery. Here it comes with things to do. Nothing on this page belongs to one church, and none of it replaces a
        counselor or a doctor.
      </P>
      <HCard
        title="Words that steady me"
        links={
          <ChipBtn
            icon="pencil"
            label={words.length ? 'Edit my words' : 'Add my words'}
            onPress={() => router.push({ pathname: '/plan', params: { pane: 'lists' } })}
          />
        }>
        {words.length ? <UL items={words} /> : <P>Nothing here yet. A verse, a prayer, or a line that steadies you works well.</P>}
      </HCard>
      <HCard
        title="A pause for a hard moment"
        links={
          <>
            <ChipBtn icon="timer" label="10-minute pause" onPress={() => tool('pause')} />
            <ChipBtn icon="wind" label="Practice breathing" onPress={() => tool('breathe')} />
          </>
        }>
        <OL
          items={[
            <>
              <B>Stop.</B> Put the phone down or step away from the screen.
            </>,
            <>
              <B>Breathe out slowly.</B> In through the nose, then a long breath out. Do three.
            </>,
            <>
              <B>Say your words.</B> A short prayer, a verse, or a line that steadies you.
            </>,
            <>
              <B>Do the next small thing.</B> Stand up, drink water, step outside, or call someone.
            </>,
          ]}
        />
        <Note>Pray, then move. If the urge wins anyway, that does not cancel the practice.</Note>
      </HCard>
      <HCard title="God and a plan" links={<ChipBtn icon="shield" label="Open my urge plan" onPress={urgePlan} />}>
        <P>Add a short prayer to your urge plan, followed by one move. The prayer is yours, in your own way. The move is what changes the next ten minutes.</P>
        <Note>Example: if I am in bed late with my phone, then I say one sentence to God, and I get up and put the phone in the kitchen.</Note>
      </HCard>
      <HCard
        title="Talking with a faith leader"
        links={
          <>
            {copy(7, 'Copy: ask to meet')}
            {copy(8, 'Copy: first sentence')}
          </>
        }>
        <P>A faith leader can offer spiritual support. A licensed therapist can offer treatment. You can have both, and you choose who to tell and how much.</P>
      </HCard>
      <HCard title="Groups with faith in them" links={<ChipBtn icon="dots" label="Free groups" onPress={() => help('groups')} />}>
        <P>
          Celebrate Recovery is Christ-centered. Sex and Love Addicts Anonymous says its program is spiritual but not tied to any religion, and you do not have
          to believe in God. SMART Recovery is not a 12-step program. The Free groups page has them all.
        </P>
      </HCard>
      <Sec title="The faith lessons">
        {['l29', 'l30', 'l31', 'l32'].map((id) => (
          <RelLesson key={id} id={id} />
        ))}
      </Sec>
    </>
  );
}

/* ---------- phone and nights ---------- */
function Phone({ sub: want }: { sub?: string }) {
  const { snap } = useStore();
  const [sub, setSub] = useSub('phone', want);
  return (
    <>
      <P>
        A filter will not remove an urge. It makes the urge take more than two taps, which buys you the time to use the pause. Do the steps once, then ask your
        safe person to hold the passcode if you can.
      </P>
      <Segments label="Phone and night setup sections" list={HELP_SUBS.phone} cur={sub} onPick={setSub} />
      {sub === 'iphone' ? (
        <HCard
          title="Turn on a filter and lock it"
          links={
            <>
              <Ext url="https://support.apple.com/guide/iphone/block-apps-app-downloads-websites-purchases-iph3ff83f3b1/ios" label="Apple’s guide" />
              <Ext url="https://support.apple.com/en-us/126533" label="Screen Time passcode" />
            </>
          }>
          <OL
            items={[
              'Open Settings, then Screen Time, and turn it on.',
              <>
                Find the web filter named <B>Limit Adult Websites</B>. Apple moves menus around between iOS versions. On many versions it is Screen Time ›
                Content &amp; Privacy Restrictions › Web Content. Apple’s guide has the current steps.
              </>,
              'Lock it: Settings › Screen Time › Manage Screen Time › Lock Screen Time Settings, and set a passcode. Have your safe person choose it if they are willing.',
              'Apple will then ask you to add Passcode Recovery with an Apple Account. Do it. Without it, Apple says you cannot remove or reset the passcode and Apple cannot give it back.',
            ]}
          />
        </HCard>
      ) : sub === 'android' ? (
        <HCard
          title="A free adult-content filter"
          links={
            <>
              <CopyChip text="adult-filter-dns.cleanbrowsing.org" label="Copy CleanBrowsing" />
              <CopyChip text="family.cloudflare-dns.com" label="Copy Cloudflare" />
            </>
          }>
          <OL
            items={[
              'Open Settings › Network & internet › Advanced › Private DNS. On Samsung it is Connections › More connection settings › Private DNS.',
              <>
                Choose “Private DNS provider hostname” and type: <Code>adult-filter-dns.cleanbrowsing.org</Code>. That is CleanBrowsing’s free adult filter.
              </>,
              <>
                Or use Cloudflare’s family filter, which blocks adult content and malware: <Code>family.cloudflare-dns.com</Code>.
              </>,
              'If it says “couldn’t connect,” some networks block this. Try a different network.',
            ]}
          />
          <P>
            CleanBrowsing says its filter does not block VPNs or proxies, or mixed sites like Reddit, and the free tier is throttled with no support. It is
            friction, not a wall.
          </P>
        </HCard>
      ) : sub === 'computer' ? (
        <HCard title="Computer or router">
          <P>
            Set the DNS servers to Cloudflare’s family pair, <Code>1.1.1.3</Code> and <Code>1.0.0.3</Code>, or CleanBrowsing’s adult pair,{' '}
            <Code>185.228.168.10</Code> and <Code>185.228.169.11</Code>.
          </P>
          <P>
            If you can open your router settings, set it there to cover every device on your Wi-Fi. Same filter on every device, because a gap on one just moves
            the urge there.
          </P>
        </HCard>
      ) : (
        <>
          <HCard title="Nights are the weak spot" links={<Ext url="https://www.cdc.gov/sleep/about/" label="CDC: sleep" />}>
            <UL
              items={[
                'Charge the phone outside the bedroom and use a cheap alarm clock.',
                'Set your screens-off time in Settings. The app asks about it the next morning.',
                'Look for Downtime (iPhone) or Bedtime mode (Android) to schedule quiet hours. Menu names vary.',
                'The CDC suggests the same bedtime and wake time every day, and turning devices off at least 30 minutes before bed.',
                'Log out of accounts and delete bookmarks, so there is less to resist at 1 AM.',
              ]}
            />
          </HCard>
          <LinkCard
            icon="moon"
            title="Set my screens-off time"
            sub={'Now ' + fmtClock(snap.settings!.screensOff) + ' · in Settings'}
            onPress={() => router.push({ pathname: '/settings', params: { open: 'sched' } })}
          />
        </>
      )}
      <HCard title="Honest note">
        <P>
          A determined moment can get around any filter. That is why this works best with a person who knows, and with the 10-minute pause. Do not feel like a
          failure if you find a gap. Close it and move on.
        </P>
      </HCard>
      <RelLesson id="l10" />
    </>
  );
}

/* ---------- what to say ---------- */
function Say() {
  return (
    <>
      <P>The hardest part of asking for help is the first sentence. These are ready to use. Change anything.</P>
      {SCRIPTS.map(([title, text], i) => (
        <Card key={i}>
          <T v="label">{title}</T>
          <T selectable>{text}</T>
          <View style={{ flexDirection: 'row' }}>
            <CopyChip text={text} label="Copy" />
          </View>
        </Card>
      ))}
      <RelLesson id="l7" />
    </>
  );
}

/* ---------- sources ---------- */
function Sources() {
  const seen: Record<string, 1> = {};
  const ls: [string, string][] = [];
  LESSONS.forEach((L) =>
    L.src.forEach((x) => {
      if (!seen[x[1]]) {
        seen[x[1]] = 1;
        ls.push([x[0], x[1]]);
      }
    }),
  );
  return (
    <Screen title="Sources" sub={<T tone="muted">Where the numbers and the research come from.</T>} back="Get help">
      <Card>
        <View style={s.between}>
          <T v="h2">Help pages</T>
          <T v="small" tone="muted">
            checked Oct 11 and 13, 2026
          </T>
        </View>
        <T v="small" tone="muted">
          Hours, prices, and menus change, so confirm on each site.
        </T>
        {HELP_SRC.map(([url, label]) => (
          <Ext key={url} url={url} label={label} />
        ))}
      </Card>
      <Card>
        <View style={s.between}>
          <T v="h2">Lessons</T>
          <T v="small" tone="muted">
            checked Oct 12 and 13, 2026
          </T>
        </View>
        <T v="small" tone="muted">
          Summaries of studies and well-known recovery programs, kept to what each source says: who was studied, what was measured, and what it cannot show. The
          12-step wording comes from AA’s own page.
        </T>
        {ls.map(([label, url]) => (
          <Ext key={url} url={url} label={label} />
        ))}
      </Card>
      <Fine>Daybook is a self-tracking tool, not medical care or a replacement for it.</Fine>
    </Screen>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  names: { flexDirection: 'row', gap: 8 },
  name: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, fontFamily: font.body, fontSize: 15 },
  crit: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1 },
  checks: { flexDirection: 'row', gap: 6 },
  sq: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
