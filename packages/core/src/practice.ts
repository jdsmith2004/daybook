/* Put it to work: the practice step at the end of each lesson. It offers ready-made lines that go on the person's own plan
   with one tap (an if-then for the urge plan, a reason, a calm move, a wind-down step, words that steady them, a step for
   after a slip, who they are becoming, a note for hard moments), lines to copy and send, a line to write with examples to
   tap, and tools to try. Nothing has to be typed: every line can be changed before it is added, and Undo takes it back off.
   The words for each lesson are in PRACTICE, by lesson id. Checked by test/practice.test.ts. */
import { REASON_LEN, REASON_MAX, SLIP_LEN, SLIP_MAX } from './legacy/core.js';
import { changeSettings } from './actions';
import { lessonById, slipSteps, type Block, type Go, type Lesson } from './lessons';
import { listAdd, listRemove, LISTS, planAdd, planFind, planRemove, PLAN_THEN_LEN, PLAN_WHEN_LEN, removeReason, saveReason, saveSlip } from './plan';
import { BE_LEN } from './setup';
import type { Settings } from './types';

/** where a ready-made line goes: the urge plan (when + text), reasons, calm moves, the wind-down, words that steady me,
    the slip plan, who I am becoming, the note for hard moments. A copy line is copied, to send to someone. */
export type PKind = 'plan' | 'reason' | 'menu' | 'wind' | 'words' | 'slip' | 'be' | 'note' | 'copy';
export interface PItem {
  k: PKind;
  text: string;
  /** the "if" of an urge plan line */
  when?: string;
  /** for a copy line: who or what it is for */
  label?: string;
}
export interface PStep {
  h: string;
  p: string;
  mins: number;
  /** what the person's own log or lists show, above the lines */
  b?: Block[];
  /** ready-made lines, the best fit first */
  items?: PItem[];
  /** examples for the lesson's own line (its note, asked with L.np): a tap fills the box */
  write?: string[];
  /** a tool or a page to open; coming back returns to this step */
  go?: Go[];
  ok: string;
}

const plan = (when: string, text: string): PItem => ({ k: 'plan', when, text });
const line = (k: Exclude<PKind, 'plan' | 'copy'>, text: string): PItem => ({ k, text });
const copy = (label: string, text: string): PItem => ({ k: 'copy', label, text });
const scene = (t: string, v: string, ic: string): Go => ({ t, a: 'scene', v, ic });
const help = (t: string, v: string, sub = '', ic = 'life'): Go => ({ t, a: 'help', v, sub, ic });

export const PRACTICE: Record<string, PStep> = {
  /* ---------- How it works ---------- */
  l1: {
    h: 'Keep one reason close.',
    p: 'You do not have to feel ready. Your own reasons carry you. Add the one that sounds most like you.',
    mins: 1,
    items: [
      line('reason', 'I want to be someone my future self can trust.'),
      line('reason', 'I want my nights back, and clear mornings.'),
      line('reason', 'I want to live by what I value, not by a habit.'),
    ],
    ok: 'Your reasons are ready.',
  },
  l2: {
    h: 'Get ready for the next wave.',
    p: 'Add this line to your urge plan, so the next urge already has an answer. Then try one minute of slow breathing while it is calm.',
    mins: 2,
    items: [plan('an urge hits', 'Name it (“this is an urge”), breathe out slowly, and give it ten minutes before I decide anything.')],
    go: [scene('Practice breathing', 'breathe', 'wind'), scene('See the 10-minute pause', 'pause', 'timer')],
    ok: 'You have a plan for the next wave.',
  },
  l3: {
    h: 'Stop the snowball ahead of time.',
    p: 'The thought right after a slip is the real risk. Add a step to your slip plan now, while it is calm.',
    mins: 1,
    items: [
      line('slip', 'Say it out loud: “One slip is data, not a reset. I do the next small thing.”'),
      line('slip', 'Before bed, write one line: what came first, and what I will try next time.'),
    ],
    ok: 'Your slip plan is ready.',
  },
  l4: {
    h: 'Meet the need under the urge.',
    p: 'Tired and lonely each have their own answer. Add the line that fits you best.',
    mins: 2,
    items: [
      plan('I am worn out and still up', 'Put the phone on its charger outside the room and go to bed. Sleep is what I need.'),
      plan('I feel lonely late at night', 'Send one message to someone I like. A short one counts.'),
    ],
    go: [{ t: 'Set my screens-off time', a: 'tab', v: 'settings', open: 's-sched', ic: 'moon' }, scene('Reach a person', 'message', 'chat')],
    ok: 'You met the need, not just the urge.',
  },

  /* ---------- Why it is hard to stop ---------- */
  l33: {
    h: 'Call it wanting.',
    p: 'When the pull is strong, the true words are “this is wanting, not need.” Keep them where you will find them in a hard moment.',
    mins: 1,
    items: [
      line('words', 'This is wanting, not need. It will pass, and I do not have to follow it.'),
      plan('the pull feels like a need', 'Say “this is wanting, not liking,” then do one calm move while it passes.'),
    ],
    ok: 'You have words for the pull.',
  },
  l34: {
    h: 'Act at the first signal.',
    p: 'The pull starts at the signal: a time, a place, a mood, or an app. Add the line closest to your own first signal.',
    mins: 1,
    items: [
      plan('I open the app I usually scroll before a slip', 'Close it right away, put the phone down, and stand up.'),
      plan('I am stressed and alone with my phone', 'Put the phone in another room for ten minutes and do one calm move.'),
    ],
    ok: 'You know one of your signals.',
  },
  l35: {
    h: 'Set one watch.',
    p: 'Pick the moment your autopilot usually starts, and the words you will say when you catch it.',
    mins: 1,
    items: [
      plan('I catch myself on autopilot with my phone', 'Stop, say “not this time,” and put the phone face down across the room.'),
      line('words', 'Not this time. I noticed, and I get to choose.'),
    ],
    ok: 'You set a watch.',
  },
  l36: {
    h: 'Plan for the feeling.',
    p: 'Often the habit is a way out of a feeling. Pick the feeling you know best, and give it a better way out.',
    mins: 2,
    b: [['mylog']],
    items: [
      plan('I have had a hard day', 'Change clothes, take a walk or a shower, and tell someone one thing about my day.'),
      plan('I feel bored and empty', 'Do ten minutes of something with my hands: cook, fix, draw, or play.'),
      plan('I feel anxious or low', 'Write one sentence about what is on my mind, then do one small kind thing for myself.'),
    ],
    ok: 'You planned for the feeling.',
  },

  /* ---------- Shame and kindness ---------- */
  l5: {
    h: 'Rewrite one harsh sentence.',
    p: 'Write the harshest thing you have said to yourself as something that happened, not something you are. Tap an example to start from it.',
    mins: 2,
    write: [
      'I slipped last night. That is something I did, not who I am.',
      'I had a hard night. I am still someone who is changing.',
      'I gave in once. Now I know more about what comes before it.',
    ],
    items: [line('slip', 'Say “I did,” not “I am”: I slipped, and I am still changing.')],
    ok: 'That is a kinder, truer sentence.',
  },
  l6: {
    h: 'Keep the kind sentence ready.',
    p: 'Put it on your slip plan, so it is the first thing you read after a hard night. Or copy it and keep it where you will see it.',
    mins: 1,
    items: [
      line('slip', 'Talk to myself like a friend: “That was hard. It happened. What do I need now?”'),
      copy('The sentence', 'That was hard. It happened. What do I need now?'),
    ],
    ok: 'That sentence is yours now.',
  },
  l7: {
    h: 'A sentence you can send.',
    p: 'If you decide to tell your safe person, here is one way to say it. Copy it into a message, or change the words first.',
    mins: 1,
    items: [
      copy(
        'To my safe person',
        'I am working on something, and I might tell you when I slip. All I need is for you to say “thanks for telling me.” No advice, no fixing.',
      ),
    ],
    go: [help('See all the scripts', 'say', '', 'chat')],
    ok: 'You have the words ready.',
  },
  l8: {
    h: 'One small step toward people.',
    p: 'Closeness is a skill, and you can start practicing it now. Pick the smallest step.',
    mins: 2,
    items: [
      copy('To a friend', 'Hey, it has been a while. Want to get coffee or take a walk this week?'),
      plan('I feel lonely or unlovable', 'Reach out to one person, even with a short message, before I do anything else.'),
      line('menu', 'Text one friend: “Thinking of you. How is your week going?”'),
    ],
    go: [scene('Reach a person', 'message', 'chat'), help('Look at free groups', 'groups', '', 'dots')],
    ok: 'That is a real step toward people.',
  },

  /* ---------- Making a plan ---------- */
  l9: {
    h: 'Write one if-then for your hardest moment.',
    p: 'Add the line closest to your hardest moment. Change the words so it sounds like you. At 1 AM you only have to follow it.',
    mins: 2,
    items: [
      plan('it is after 11 PM and I am still on my phone', 'Plug it in outside my bedroom, and read, stretch, or go to sleep.'),
      plan('I am home alone and an urge starts', 'Leave the room, get a glass of water, and text someone.'),
      plan('I feel stressed after a long day', 'Go for a ten-minute walk before I sit down with a screen.'),
    ],
    ok: 'Your if-then is ready.',
  },
  l10: {
    h: 'Change the setting tonight.',
    p: 'Small changes to the room, the device, or the hour make the cue weaker. Pick one for tonight.',
    mins: 2,
    items: [
      plan('I am about to take my phone to bed', 'Leave it on the charger in another room, and bring a book instead.'),
      line('wind', 'Screens off and lights low an hour before bed'),
    ],
    go: [help('Phone and night setup', 'phone', 'night', 'phone'), { t: 'Set my screens-off time', a: 'tab', v: 'settings', open: 's-sched', ic: 'moon' }],
    ok: 'Your night has a better setting.',
  },
  l11: {
    h: 'Look at one option.',
    p: 'Use whatever words fit you. Pick one kind of help to look at. Reading one page is enough for today.',
    mins: 2,
    go: [help('Therapy on a small budget', 'therapy', 'start', 'heart'), help('Free groups', 'groups', '', 'dots'), help('What to say', 'say', '', 'chat')],
    ok: 'You looked at a real option.',
  },
  l12: {
    h: 'Measure more than a streak.',
    p: 'Getting better grows across your whole life. Add a reason about the life you are building, not only the habit you are leaving.',
    mins: 1,
    items: [
      line('reason', 'I am building a life with good sleep, real friends, and work I care about.'),
      line('reason', 'I am growing a whole life, not protecting a streak.'),
    ],
    go: [
      { t: 'See how my flame grows', a: 'growth', ic: 'sparkle' },
      { t: 'Open this week’s review', a: 'week', ic: 'calendar' },
    ],
    ok: 'You looked back, and you know your next step.',
  },

  /* ---------- Faith and recovery ---------- */
  l29: {
    h: 'Pair the prayer with a move.',
    p: 'Faith works best with people and a plan. Add a line that puts a short prayer and one move together.',
    mins: 1,
    items: [
      plan('I am struggling', 'Say a short prayer in my own words, then do one thing on my plan right away.'),
      plan('I have prayed and the urge is still there', 'Get up, leave the room, and text someone I trust.'),
      line('words', 'God, give me strength for the next ten minutes, and help me take the next right step.'),
    ],
    ok: 'God has a place in your plan.',
  },
  l30: {
    h: 'Make the pause yours.',
    p: 'Have your words ready before you need them. Add the ones that fit, or change the words first.',
    mins: 2,
    b: [['words']],
    items: [
      line('words', 'Stop and pray in my own words. Ask for strength for this moment.'),
      line('menu', 'Stop. Breathe out slowly. Say my words. Then stand up and move.'),
      line('wind', 'A few quiet minutes or a prayer, phone in another room'),
    ],
    ok: 'Your pause is ready.',
  },
  l31: {
    h: 'Bring it into the open.',
    p: 'Write one honest line about what you are carrying. Tap an example to start from it. If it stirs up something heavy, talk to a person.',
    mins: 3,
    write: [
      'I have been carrying this alone, and I am tired of hiding it.',
      'I feel I have let God down, and I want to be honest about it.',
      'I am ashamed, and I am ready to tell one person.',
    ],
    items: [
      copy(
        'To a faith leader or mentor',
        'I would like to talk with you about something personal that I have been struggling with. Do you have some time this week?',
      ),
      copy(
        'The first thing to say',
        'I have been struggling with compulsive porn use. I want to stop, and I want your support. I am also looking at counseling and a recovery group. Could we talk about how my faith fits in?',
      ),
    ],
    go: [help('Therapy on a small budget', 'therapy', 'start', 'heart')],
    ok: 'You wrote it honestly.',
  },
  l32: {
    h: 'Start again in one small way.',
    p: 'Forgiving yourself gets you to the next right step. Put it on your slip plan, or write what you want to say.',
    mins: 2,
    items: [line('slip', 'Ask God for forgiveness, forgive myself, and take the next right step.')],
    write: ['God, I am sorry. Help me start again today.', 'I forgive myself for last night. Today I take the next right step.'],
    go: [scene('Reach a person', 'message', 'chat')],
    ok: 'You started again.',
  },

  /* ---------- Skills for the moment ---------- */
  l13: {
    h: 'Name it to tame it.',
    p: 'When an urge starts, “I notice I feel ___” turns the volume down. Add the line to your plan, then try it on a real feeling.',
    mins: 2,
    items: [plan('an urge starts after a rough day', 'Say “I notice I feel ___,” name the feeling in a word or two, then meet that feeling another way.')],
    go: [scene('Try the Curious tool', 'curious', 'wave'), scene('Do a HALT check', 'halt', 'heart')],
    ok: 'You named a real feeling.',
  },
  l14: {
    h: 'Try one minute now.',
    p: 'Practice the long breath out while it is quiet, so you can find it when it is loud.',
    mins: 1,
    items: [
      plan('I feel the first pull of an urge', 'Take three slow breaths with a long breath out before I do anything else.'),
      line('menu', 'Three sigh breaths: in, in a little more, then a long way out'),
    ],
    go: [scene('Start the Sigh breath', 'breathe', 'wind')],
    ok: 'You have felt it work.',
  },
  l15: {
    h: 'Choose your move.',
    p: 'Pick one move you would do even when you are tired. The pause and Surprise me pick from your calm moves.',
    mins: 1,
    items: [
      line('menu', 'A brisk two-minute walk, or 20 squats'),
      line('menu', 'Twenty push-ups against the kitchen counter'),
      plan('an urge starts while I am on the couch', 'Stand up and move for two minutes first, then decide.'),
    ],
    go: [scene('Surprise me', 'surprise', 'dice')],
    ok: 'You have a move ready.',
  },
  l16: {
    h: 'Have the words ready.',
    p: 'Next time “just once” shows up, put “I am having the thought that” in front of it. Keep the words where you will find them.',
    mins: 1,
    items: [
      line('words', 'I am having the thought that just once will not matter. It is a thought, not an order.'),
      plan('I hear “just this once” in my head', 'Say “I am having the thought that…” and do something small and kind for myself.'),
    ],
    ok: 'You have a way to answer it.',
  },

  /* ---------- Seeing your pattern ---------- */
  l17: {
    h: 'Trace one chain back.',
    p: 'Think of your last hard night. Go backward: right before, an hour before, that morning. Write the earliest small yes. Tap an example to start from it.',
    mins: 3,
    write: [
      'Staying up “just a little longer” on my phone in bed.',
      'Skipping dinner and getting home tired and alone.',
      'Telling myself I would only scroll for a minute.',
    ],
    items: [plan('I notice an early link, like staying up late on my phone', 'Swap it right away: phone on the charger, and one calm move.')],
    go: [scene('Do a HALT check', 'halt', 'heart')],
    ok: 'You found an earlier link.',
  },
  l18: {
    h: 'Have a reply ready.',
    p: 'Write the permission thought you hear most, and add a one-line reply for it. Tap an example to start from it.',
    mins: 2,
    write: ['“I have earned it after this week.”', '“Just once will not matter.”', '“Nobody will know.”'],
    items: [
      line('words', 'I have earned rest, not a setback. I will give myself something good instead.'),
      line('words', 'Just once is how it always starts. Not tonight.'),
    ],
    ok: 'Your reply is ready.',
  },
  l19: {
    h: 'Ask your log one question.',
    p: 'Once a week, look back: when is it hard, what sets it off, and what helps. Here is what your log shows so far.',
    mins: 2,
    b: [['mylog']],
    items: [plan('it is Sunday', 'Open my weekly review and pick one thing to change this week.')],
    go: [{ t: 'Open this week’s review', a: 'week', ic: 'calendar' }],
    ok: 'You found a pattern.',
  },
  l20: {
    h: 'Remove one fight tonight.',
    p: 'Strong self-control looks like fewer fights. Pick one change that takes a fight away before it starts.',
    mins: 2,
    items: [
      plan('it is time for bed', 'Leave the phone outside the bedroom, so there is no fight to win.'),
      line('wind', 'Lights low, and the phone out of reach, an hour before sleep'),
    ],
    go: [help('Phone and night setup', 'phone', 'night', 'phone'), { t: 'Set my screens-off time', a: 'tab', v: 'settings', open: 's-sched', ic: 'moon' }],
    ok: 'One fight is gone.',
  },
  l41: {
    h: 'Catch the picture once.',
    p: 'When you notice yourself picturing it, call it the picture, and look at the real thing: how it feels ten minutes after.',
    mins: 1,
    items: [
      plan('I catch myself picturing tonight', 'Say “that is the picture,” and remember how I felt ten minutes after last time.'),
      line('words', 'That is the picture. The real thing leaves me flat and empty after.'),
    ],
    go: [{ t: 'Open Talk it through', a: 'talk', ic: 'chat' }],
    ok: 'You looked at the real thing.',
  },

  /* ---------- Becoming someone new ---------- */
  l37: {
    h: 'Write who you are becoming.',
    p: 'Pick a sentence, or change the words. Today shows it under the date, and SOS opens with it.',
    mins: 1,
    items: [
      line('be', 'I am someone who keeps my word to myself.'),
      line('be', 'I am someone who is free, and getting stronger every week.'),
      line('be', 'I am someone who shows up for the people I love.'),
    ],
    ok: 'You wrote who you are becoming.',
  },
  l38: {
    h: 'Keep your “I do not” close.',
    p: '“I do not” sounds like who you are. Add your sentence to your reasons, so it is there in a hard moment.',
    mins: 1,
    items: [
      line('reason', 'I do not watch porn. That is not who I am now.'),
      line('reason', 'I do not trade my mornings for one night.'),
      line('words', '“I do not,” not “I cannot.” This is who I am.'),
    ],
    ok: 'Your sentence is ready.',
  },
  l39: {
    h: 'Let future you speak.',
    p: 'Pick a note from you, a year from now, or change the words. It becomes your note for hard moments, and SOS shows it to you.',
    mins: 2,
    items: [
      line('note', 'It is me, a year from now. Tonight matters more than it feels. Every urge you ride out, I am grateful for. Keep going.'),
      line('note', 'A year from now I sleep well and I am proud of my nights. It started with nights like this one.'),
    ],
    ok: 'Future you has a say now.',
  },
  l40: {
    h: 'Count your votes.',
    p: 'Each urge you ride out is a vote for who you are becoming. Here is your evidence so far. Keep a sentence it backs up.',
    mins: 1,
    b: [['mylog']],
    items: [line('be', 'I am someone who rides out urges. My log shows it.'), line('words', 'Every urge I ride out is a vote for who I am becoming.')],
    ok: 'You read your evidence.',
  },

  /* ---------- A life that holds ---------- */
  l21: {
    h: 'Make coming back easy.',
    p: 'One missed day barely matters. Plan the smallest way back, so it is easy to take.',
    mins: 1,
    items: [plan('I miss a day of my routine', 'Come back the next day in the smallest way: one check-in, even a short one.')],
    go: [{ t: 'See the reminders', a: 'tab', v: 'settings', open: 's-remind', ic: 'calendar' }],
    ok: 'Your return is planned.',
  },
  l22: {
    h: 'Put it in words.',
    p: 'Name what bothers you most, in one sentence. Each answer points to different help. Tap an example to start from it.',
    mins: 2,
    write: ['Losing control bothers me most.', 'The clash with my values bothers me most.', 'Both bother me: losing control, and the clash with my values.'],
    go: [help('Therapy on a small budget', 'therapy', 'start', 'heart')],
    ok: 'You put it in words.',
  },
  l23: {
    h: 'Fill your hardest hour.',
    p: 'Do not wait to feel like it. Put one real, small activity in your hardest hour, and do it anyway.',
    mins: 2,
    b: [['mylog']],
    items: [
      line('menu', 'In my hardest hour: one planned thing (a walk, a call, or a project)'),
      plan('the hours feel empty', 'Do the thing I planned: a walk, a call, or my project, even if I do not feel like it.'),
    ],
    ok: 'Your hard hour has a plan.',
  },
  l24: {
    h: 'Take one step toward help.',
    p: 'Look at the page on a small budget, or copy the words for a first message.',
    mins: 2,
    items: [
      copy(
        'A first message to a therapist',
        'Hi, I would like to set up counseling for a habit I have not been able to stop on my own. Do you have openings, and do you offer a sliding scale?',
      ),
    ],
    go: [help('Therapy on a small budget', 'therapy', 'start', 'heart'), help('What to say', 'say', '', 'chat')],
    ok: 'You took a step toward help.',
  },

  /* ---------- Well-known programs ---------- */
  l25: {
    h: 'Borrow what fits.',
    p: 'Honesty, help from other people, and action. You can use them without joining anything.',
    mins: 1,
    items: [plan('I want to hide a slip', 'Tell one safe person the truth, in one sentence. Honesty comes first.')],
    go: [help('Look at free groups', 'groups', '', 'dots')],
    ok: 'You took what helps.',
  },
  l26: {
    h: 'Borrow one tool.',
    p: 'You do not need a meeting to use these. Add a DENTS move to your calm moves.',
    mins: 1,
    items: [
      line('menu', 'Escape: step outside for five minutes'),
      line('menu', 'Swap: do one small task I have been putting off'),
      plan('an urge starts and I want to act on it', 'Delay ten minutes, then escape the room or swap in one small task.'),
    ],
    go: [help('Look at free groups', 'groups', '', 'dots')],
    ok: 'You borrowed a tool.',
  },
  l27: {
    h: 'Run the pause once.',
    p: 'Stop. Observe. Breathe. Expand. Respond. Do it once now, then put it where it fits your day.',
    mins: 2,
    items: [
      plan('I notice I opened the browser without thinking', 'Run the one-minute pause: stop, notice, breathe, widen my view, then choose.'),
      line('menu', 'The one-minute pause: stop, notice, breathe, widen, choose'),
    ],
    go: [scene('Practice breathing', 'breathe', 'wind')],
    ok: 'You have run the pause once.',
  },
  l28: {
    h: 'One small step toward people.',
    p: 'Start small: listen at one meeting, or ask one person to check in with you.',
    mins: 2,
    items: [
      copy(
        'Ask someone to check in',
        'I respect how you have handled your own recovery. Would you check in with me once a week? I am not asking you to fix anything. I want someone who knows, so I stay honest.',
      ),
    ],
    go: [help('Look at free groups', 'groups', '', 'dots'), scene('Reach a person', 'message', 'chat')],
    ok: 'That is a real step toward people.',
  },
};

/** the practice step at the end of a lesson */
export const lessonPractice = (L: Lesson | null): PStep | null => (L && PRACTICE[L.id]) || null;
export const practiceOf = (id: string) => lessonPractice(lessonById(id));

/* ---------- one ready-made line ---------- */
/** where the line goes, in a few words */
export const ITEM_WHERE: Record<PKind, string> = {
  plan: 'urge plan',
  reason: 'reasons',
  menu: 'calm moves',
  wind: 'wind-down',
  words: 'words that steady me',
  slip: 'slip plan',
  be: 'who I am becoming',
  note: 'note for hard moments',
  copy: '',
};
/** the button: "Add to my urge plan", "Make it my sentence", "Copy" */
export const itemButton = (it: PItem) =>
  it.k === 'copy' ? 'Copy' : it.k === 'be' ? 'Make it my sentence' : it.k === 'note' ? 'Make it my note' : 'Add to my ' + ITEM_WHERE[it.k];
/** what it says once it is on the plan */
export const itemDone = (it: PItem) => (it.k === 'be' ? 'Your sentence' : it.k === 'note' ? 'Your note for hard moments' : 'On your ' + ITEM_WHERE[it.k]);
/** how long the words can be */
export const itemLen = (it: PItem): number =>
  it.k === 'plan'
    ? PLAN_THEN_LEN
    : it.k === 'reason'
      ? REASON_LEN
      : it.k === 'be'
        ? BE_LEN
        : it.k === 'menu' || it.k === 'wind' || it.k === 'words'
          ? LISTS[it.k].len
          : it.k === 'slip'
            ? SLIP_LEN
            : 600;
export const ITEM_WHEN_LEN = PLAN_WHEN_LEN;

const same = (a: string, b: string) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();
const listOf = (st: Settings, k: 'menu' | 'wind' | 'words') => ((st as unknown as Record<string, string[]>)[k] || []) as string[];

/** whether the line is already there, word for word */
export function itemHas(st: Settings, it: PItem): boolean {
  if (it.k === 'plan') return planFind(st, it.when || '', it.text) >= 0;
  if (it.k === 'reason') return st.reasons.some((x) => same(x, it.text));
  if (it.k === 'menu' || it.k === 'wind' || it.k === 'words') return listOf(st, it.k).some((x) => same(x, it.text));
  if (it.k === 'slip') return slipSteps(st).some((x) => same(x, it.text));
  if (it.k === 'be') return same(st.becoming || '', it.text);
  if (it.k === 'note') return same(st.note || '', it.text);
  return false;
}

export type ItemResult = { ok: true; st: Settings; toast: string; was?: string } | { ok: false; toast: string };
/** the line put where it goes. was: the sentence or note it replaced, for Undo. */
export function itemAdd(st: Settings, it: PItem): ItemResult {
  const text = String(it.text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return { ok: false, toast: 'Write a few words first.' };
  if (it.k === 'copy') return { ok: false, toast: '' };
  if (itemHas(st, { ...it, text }))
    return { ok: false, toast: it.k === 'be' || it.k === 'note' ? 'That is already yours.' : 'Already on your ' + ITEM_WHERE[it.k] + '.' };
  if (it.k === 'plan') {
    const r = planAdd(st, it.when || '', text);
    return r.ok ? { ok: true, st: r.st, toast: r.toast } : { ok: false, toast: r.toast };
  }
  if (it.k === 'reason') {
    if (st.reasons.length >= REASON_MAX) return { ok: false, toast: `Your reasons are full (${REASON_MAX}). Remove one in My reasons to make room.` };
    const r = saveReason(st, null, text, null, 'lesson');
    return r.ok ? { ok: true, st: r.st, toast: 'Added to your reasons.' } : { ok: false, toast: r.toast };
  }
  if (it.k === 'menu' || it.k === 'wind' || it.k === 'words') {
    const r = listAdd(st, it.k, text);
    return r.ok ? { ok: true, st: r.st, toast: r.toast } : { ok: false, toast: r.toast };
  }
  if (it.k === 'slip') {
    const rows = slipSteps(st);
    if (rows.length >= SLIP_MAX) return { ok: false, toast: `Your slip plan is full (${SLIP_MAX} steps). Remove one to make room.` };
    return { ok: true, st: saveSlip(st, rows.concat(text.slice(0, SLIP_LEN))), toast: 'Added to your slip plan.' };
  }
  const k = it.k === 'be' ? 'becoming' : 'note';
  const was = st[k] || '';
  return {
    ok: true,
    st: changeSettings(st, (s) => void (s[k] = text.slice(0, itemLen(it)))),
    toast: it.k === 'be' ? 'Saved. Today shows it under the date.' : 'Saved. SOS shows it to you first.',
    was,
  };
}
/** Undo: the line taken back off (a sentence or note goes back to what it was) */
export function itemUndo(st: Settings, it: PItem, was = ''): Settings {
  if (it.k === 'plan') {
    const i = planFind(st, it.when || '', it.text);
    const r = i >= 0 ? planRemove(st, i) : null;
    return r && r.ok ? r.st : st;
  }
  if (it.k === 'reason') {
    const i = st.reasons.findIndex((x) => same(x, it.text));
    const r = i >= 0 ? removeReason(st, i) : null;
    return r ? r.st : st;
  }
  if (it.k === 'menu' || it.k === 'wind' || it.k === 'words') {
    const i = listOf(st, it.k).findIndex((x) => same(x, it.text));
    const r = i >= 0 ? listRemove(st, it.k, i) : null;
    return r && r.ok ? r.st : st;
  }
  if (it.k === 'slip') {
    const rows = slipSteps(st);
    const i = rows.findIndex((x) => same(x, it.text));
    return i >= 0
      ? saveSlip(
          st,
          rows.filter((_, j) => j !== i),
        )
      : st;
  }
  if (it.k === 'be' || it.k === 'note') {
    const k = it.k === 'be' ? 'becoming' : 'note';
    return same(st[k] || '', it.text) ? changeSettings(st, (s) => void (s[k] = was)) : st;
  }
  return st;
}
