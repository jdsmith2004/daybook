/* Lessons 54 to 58, the lessons that meet the night (docs/review-plan.md C8, the review of November 12, 2026). They are for the
   person who slips most nights, late, in bed after scrolling: the morning self and the night self, where the phone sleeps, what a
   filter does and does not cover, telling one person, and the heavier thing a habit can carry (with the 988 line, care: true).

   Each is a turn (lesson-turns.ts), written that way from the start, and sits in TURNS so its short words and its habit words
   come from the same place as every other lesson. legacy/core.js adds them to LESSONS and LESSON_IDS after the lessons of one
   habit, so nothing already in the list moves. Where each sits on the path is lessons.ts and steps.ts.

   l56 (filters) and l58 (the heavier thing) are in PORN_ONLY so they can open to each habit their own way (lesson-habit.ts):
   the filter lesson has no meaning for alcohol, and the alcohol version of l58 names that medicines exist. The others hold for
   every habit as written.

   Nothing here imports a value, so lesson-turns.ts, lesson-habit.ts, lessons-more.ts and practice.ts can all read it. */
import type { Go, Lesson } from './lessons';
import type { Turn } from './lesson-turns';
import type { OtherHabit, Part } from './lesson-habit';
import type { PItem, PStep } from './practice';

type Src = [string, string];
/** the sources, added to SRC (lessons-more.ts SRC_MORE) */
export const SRC_NIGHT = {
  nordgren09: [
    'Nordgren, van Harreveld & van der Pligt (2009): the restraint bias, how the illusion of self-restraint promotes impulsive behavior, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2009.02468.x',
  ],
  pilcher15: [
    'Pilcher, Morris, Donnelly & Feigl (2015): interactions between sleep habits and self-control, Frontiers in Human Neuroscience',
    'https://doi.org/10.3389/fnhum.2015.00284',
  ],
  gollwitzer06: [
    'Gollwitzer & Sheeran (2006): implementation intentions and goal achievement, a meta-analysis of effects and processes, Advances in Experimental Social Psychology',
    'https://doi.org/10.1016/S0065-2601(06)38002-1',
  ],
  exelmans16: [
    'Exelmans & Van den Bulck (2016): bedtime mobile phone use and sleep in adults, Social Science & Medicine',
    'https://doi.org/10.1016/j.socscimed.2015.11.037',
  ],
  ward17: [
    'Ward, Duke, Gneezy & Bos (2017): brain drain, the mere presence of one’s own smartphone reduces available cognitive capacity, Journal of the Association for Consumer Research',
    'https://doi.org/10.1086/691462',
  ],
  hofmann12: [
    'Hofmann, Baumeister, Förster & Vohs (2012): everyday temptations, an experience sampling study of desire, conflict, and self-control, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/a0026545',
  ],
  duckworth16: [
    'Duckworth, Gendler & Gross (2016): situational strategies for self-control, Perspectives on Psychological Science',
    'https://doi.org/10.1177/1745691615623247',
  ],
  gainsbury14: [
    'Gainsbury (2014): review of self-exclusion from gambling venues as an intervention for problem gambling, Journal of Gambling Studies',
    'https://doi.org/10.1007/s10899-013-9362-0',
  ],
  screentime: ['Apple: use a Screen Time passcode on iPhone', 'https://support.apple.com/en-us/126533'],
  harkin16: [
    'Harkin et al. (2016): does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence, Psychological Bulletin',
    'https://doi.org/10.1037/bul0000025',
  ],
  litt09: [
    'Litt, Kadden, Kabela-Cormier & Petry (2009): changing network support for drinking, network support project 2-year follow-up, Journal of Consulting and Clinical Psychology',
    'https://doi.org/10.1037/a0015252',
  ],
  freeman17: [
    'Freeman et al. (2017): the effects of improving sleep on mental health (OASIS), a randomised controlled trial with mediation analysis, The Lancet Psychiatry',
    'https://doi.org/10.1016/S2215-0366(17)30328-0',
  ],
  nice22: ['NICE (2022): depression in adults, treatment and management (guideline NG222)', 'https://www.nice.org.uk/guidance/ng222'],
  niaaa: [
    'NIAAA: treatment for alcohol problems, finding and getting help (the medicines approved for alcohol use disorder)',
    'https://www.niaaa.nih.gov/publications/brochures-and-fact-sheets/treatment-alcohol-problems-finding-and-getting-help',
  ],
} satisfies Record<string, Src>;
const S = SRC_NIGHT;

/** each lesson's section (lessons.ts LUNITS) and care: true for the one that shows the 988 line */
export const NIGHT_AT: Record<string, Pick<Lesson, 'u' | 'care'>> = {
  l54: { u: 2 },
  l55: { u: 2 },
  l56: { u: 2 },
  l57: { u: 1 },
  l58: { u: 5, care: true },
};

const L58_DEEP: Turn['deep'] = [
  {
    h: 'A habit often grows to carry a hard feeling.',
    p: 'Low mood, stress and loneliness often come before the pull, and the pull hands them back later.',
    art: ['loop', { n: ['A heavy feeling', 'The habit', 'Short relief', 'The feeling returns'], c: 'Relief that brings it back' }],
    more: 'Many people find the habit is busiest in their heaviest weeks. It gives a few minutes away from the feeling, and the feeling is waiting afterwards, often a little heavier. That is not weakness. It is a need using the only door it knows, and the need can get a better door.',
  },
  {
    h: 'Help for sleep lifted mood and worry too.',
    n: '3,755',
    p: 'In a trial with 3,755 students, an online sleep program eased low mood and worry as well.',
    fact: { s: 'Randomized trial · 3,755 students · Freeman and colleagues, 2017', i: [0] },
    more: 'In one of the largest trials of its kind, students with sleep problems were given an online program to sleep better. Their sleep improved, and so did their mood, their worry and their sense of wellbeing. Sleep is not a side issue. It holds up the rest.',
  },
  {
    h: 'Low mood and worry are some of the most treatable problems.',
    p: 'Talking therapy, exercise and, when needed, medicine help a great many people feel well again.',
    fact: { s: 'Guideline · NICE, 2022', i: [1] },
    more: 'Guidelines for doctors, like the one from NICE in the UK, set out talking therapies, group exercise and medicines that help depression. A doctor or counselor can help you work out which fits you. Asking is the hardest part, and it is a short conversation.',
  },
];

export const NIGHT: Record<string, Turn> = {
  /* ---------- l54: the morning self and the night self ---------- */
  l54: {
    id: 'l54',
    title: 'The morning self and the night self',
    tag: 'The one who decides at 8 AM can set the room for 11:45 PM.',
    ic: 'sunrise',
    ask: 'Why do my plans in the morning fall apart at night?',
    key: 'The night self is tired and the pull is loud. Let the morning self decide, and set the room before dark.',
    np: 'One thing my morning self will set up for tonight',
    hook: {
      h: 'At 8 AM you are sure. Tonight will be different.',
      say: 'Then 11:45 PM comes. What changed?',
      more: 'In the morning it is easy to mean it. Late at night you are tired, alone, and the phone is in your hand, and the same promise feels far away. This lesson is about why, and how the morning can help the night.',
    },
    ask1: {
      h: 'Think of a night that went wrong. What was different from the morning?',
      o: [
        ['I was worn out', 'Tired is a big part of it. A tired brain holds on to a plan less well.'],
        ['I was alone with my phone', 'Then the room did more of the deciding than you did.'],
        ['I felt low or restless', 'Then the night was answering a feeling. That is worth knowing.'],
        ['I do not know yet', 'That is honest. Watch the next night, and notice what is around you.'],
      ],
    },
    flip: {
      think: 'I just need more willpower at night.',
      see: 'The night self is tired and has the least to give. The morning self has more, so let it do the work.',
      more: 'Willpower at 11:45 PM is the weakest it will be all day. You are tired, the room is dark, and the phone is right there. Asking more of that moment asks the tired one to carry everything. The person you are at 8 AM can decide for both of you, by setting the room so the night has less to fight.',
    },
    deep: [
      {
        h: 'People sure of their willpower took more risks, and lost more.',
        p: 'Smokers who felt strong chose more temptation in a test, and were more likely to light up.',
        fact: { s: 'Studies · Nordgren and colleagues, 2009', i: [0] },
        more: 'In a set of studies, people who believed their impulse control was strong put themselves nearer to temptation. Smokers who felt most sure of themselves chose the hardest test, and were the most likely to smoke. Feeling strong in the morning is not the same as being strong at night, and planning for the night is the stronger move.',
      },
      {
        h: 'A tired brain holds back less.',
        p: 'After short or poor sleep, people act more on impulse and think less about later.',
        art: ['chain', { n: ['8 AM: decide', '10 PM: the plan runs', '11:45 PM: less to fight'], i: ['sunrise', 'calendar', 'moon'] }],
        fact: { s: 'Review · Pilcher and colleagues, 2015', i: [1] },
        more: 'A review of research on sleep and self-control found the same pattern again and again. After short or poor sleep, people resist less, think less about later, and act more on impulse. Late at night, after a long day, the brake is at its weakest. That is not a flaw in you. It is a tired brain, and a tired brain can be planned for.',
      },
      {
        n: '94',
        h: 'studies: a plan made ahead helped people do what they meant to.',
        p: 'An if-then plan written in a calm hour runs on its own later, when there is little left to give.',
        fact: { s: 'Review · 94 studies · Gollwitzer & Sheeran, 2006', i: [2] },
        more: 'A review of 94 studies found that plans in the form “when this happens, I will do that” helped people reach their goals far more than good intentions alone. The plan does the deciding ahead of time, so the tired moment only has to follow it.',
      },
    ],
    mine: { h: 'Here is when your nights get hard.', k: 'hour' },
    move: {
      h: 'Let the morning set the room for the night.',
      l: ['Pick the hour your phone goes down', 'Pick where it will charge tonight', 'Write one if-then for in bed'],
      more: 'Do it while you are clear, in the morning or right after dinner. The night self only has to follow what is already there.',
    },
    check: {
      h: '9 AM. Last night went wrong again. What does the morning self do first?',
      o: [
        ['Promise to try harder tonight', 'That leaves it all to the tired one at 11:45 PM. Set something up instead.'],
        ['Set up the charger outside the bedroom now', 'Yes. The morning self did the work, so the night self has less to fight.'],
        ['Feel bad about it all day', 'Feeling bad drains the energy you need tonight. Use the morning to set the room.'],
        ['Wait and see how tonight goes', 'Then tonight is the same room as last night. One change now helps more.'],
      ],
      a: 1,
    },
    scope:
      'The self-control studies were about smoking and everyday temptation, and the plans review covers goals of every kind. They point one sure way: the clear hours of the day can make the hard hours easier, and that is something anyone can learn.',
    src: [S.nordgren09, S.pilcher15, S.gollwitzer06],
  },

  /* ---------- l55: where the phone sleeps ---------- */
  l55: {
    id: 'l55',
    title: 'Where the phone sleeps',
    tag: 'The night ends at the bedroom door.',
    ic: 'phone',
    ask: 'What changes if my phone sleeps somewhere else?',
    key: 'Most hard nights start with the phone in bed. Charge it outside the room, and the night ends at the door.',
    np: 'Where my phone will sleep tonight, and what I will use instead',
    hook: {
      h: 'It is 11:30 PM. You are in bed, and the phone is in your hand.',
      say: 'How did it get there?',
      more: 'For many people the hard part of the night does not start with a choice. It starts with a habit and a screen: in bed, scrolling, and then it is late. This lesson is about where the phone spends the night.',
    },
    ask1: {
      h: 'What keeps your phone in bed with you?',
      o: [
        ['It is my alarm', 'A cheap alarm clock does that job, and it cannot open anything.'],
        ['Music or something to fall asleep to', 'A small speaker or an old player can do that, with no feed in it.'],
        ['I want to be reachable', 'A phone in the kitchen still rings. You will hear the calls that matter.'],
        ['I just always have', 'Then it is habit, not need. Habits can move to a new room.'],
      ],
    },
    flip: {
      think: 'I need my phone in bed.',
      see: 'The phone needs a bed. It does not have to be yours.',
      more: 'The alarm, the music and the just checking are real needs, and each one has an answer that is not a screen with everything on it. A phone that charges in the kitchen still wakes you if it rings. What it cannot do is sit in your hand at midnight.',
    },
    deep: [
      {
        h: 'A phone in bed went with later, worse sleep.',
        p: 'Adults who used the phone after lights out slept worse and felt more tired.',
        fact: { s: 'Survey · 844 adults · Exelmans & Van den Bulck, 2016', i: [0] },
        more: 'A study of 844 adults found that using a phone in bed after the lights went out went with later sleep, worse sleep and more tiredness. Poor sleep then makes the next night harder too. The phone does not only bring the pull. It takes the rest that helps you say no.',
      },
      {
        h: 'Even a phone that is off pulls at the mind.',
        p: 'In tests, people did best with the phone in another room, not face down on the desk.',
        fact: { s: 'Experiments · Ward and colleagues, 2017', i: [1] },
        more: 'In a set of experiments, people did attention and memory tasks with their phone on the desk, in a pocket or bag, or in another room. The ones whose phone was in another room did best, even when the phone was off. A phone near you pulls at your mind without a single tap.',
      },
      {
        h: 'The easiest no is the one you never have to say.',
        p: 'People with the most self-control met fewer temptations. They set their days up that way.',
        art: ['rooms', {}],
        fact: { s: 'Study · Hofmann and colleagues, 2012', i: [2] },
        more: 'In a study that checked in on people through the day, those with the most self-control did not resist more often. They met fewer temptations to begin with, because of how they set up their days. Moving the phone is that kind of strength.',
      },
    ],
    mine: { h: 'Here is what your log says comes first.', k: 'trigger' },
    move: {
      h: 'Tonight, the phone sleeps outside your room.',
      l: ['Charge it in the kitchen, or by the door', 'Wake up to a cheap alarm clock', 'Keep a book by the bed instead'],
      more: 'If the first night feels strange, that is normal. It takes a few nights for the room to feel like a place to sleep again. If you share a home, tell someone why the charger moved. It helps it stay moved.',
    },
    check: {
      h: '11 PM. The phone is in the kitchen, and you want to check one thing. What gives you the best night?',
      o: [
        ['Get it, check one thing, and bring it back', 'One thing in bed is how most hard nights start. Let it wait for morning.'],
        ['Leave it, and let the one thing wait', 'Yes. The night ends at the door, and almost nothing needs you before morning.'],
        ['Bring it in, but keep it face down', 'Face down is still within reach. The door is what does the work.'],
        ['Feel bad that you want it', 'Wanting it is the old habit talking. You do not have to follow it.'],
      ],
      a: 1,
    },
    scope:
      'The sleep study followed adults in one country, and the focus tests were done with students. Together they show one clear thing: a phone close by takes sleep and attention, and a phone in another room gives both back.',
    src: [S.exelmans16, S.ward17, S.hofmann12],
  },

  /* ---------- l56: a wall with doors ---------- */
  l56: {
    id: 'l56',
    title: 'A wall with doors',
    tag: 'A filter will not close every way in. It buys the minute that matters.',
    ic: 'shield',
    ask: 'Is a filter worth it if I can always get around it?',
    key: 'No filter closes every door. It slows the reach, and a slow reach gives the urge time to pass.',
    np: 'The doors my filter does not cover yet, and who could hold the code',
    hook: {
      h: 'You set up a filter. A week later you found a way around it.',
      say: 'So is there any point?',
      more: 'Many people try a block once, find a gap at midnight, and decide filters do not work. This lesson is about what a filter can do, what it cannot, and how to make it count.',
    },
    ask1: {
      h: 'When you got around a block before, how did you do it?',
      o: [
        ['Another browser or app', 'Then the wall had a door in it. Most doors can be closed once you know them.'],
        ['Another device', 'A wall on one device sends the urge to the next. Each one needs its own.'],
        ['I turned it off myself', 'Then the code was in your hands. Someone else can hold it.'],
        ['I have never tried a block', 'Then you start with a clear map of where the doors are.'],
      ],
    },
    flip: {
      think: 'Filters do not work. I can always get around them.',
      see: 'You can get around one. It takes time, and that time is when the urge passes.',
      more: 'A filter is not a cage. It is a wall with doors, and a determined person can find one. What a wall does is make the reach slow. Urges rise and fall in minutes, so every minute between the thought and the screen is a minute for the wave to pass, and a minute for you to choose.',
    },
    deep: [
      {
        h: 'A filter covers what it knows. The doors are elsewhere.',
        p: 'A second browser, apps with their own search, feeds that show anything, and the other devices.',
        art: ['gate', {}],
        more: 'Most filters block sites in one place. The common doors are a second browser, a private window, an app with its own search or feed, a tablet or a laptop, and an old phone in a drawer. Name your doors once, in a calm hour, and close the ones you can.',
      },
      {
        h: 'Changing the setting works better than fighting the moment.',
        p: 'Steps taken early, before the pull, helped self-control more than resisting in the hot moment.',
        fact: { s: 'Review · Duckworth and colleagues, 2016', i: [0] },
        more: 'Researchers who study self-control looked at when people step in. Moves made early, like choosing where you will be or what is in reach, worked better than resisting once the pull was strong. A filter is one of those early moves. It makes the choice before the urge does.',
      },
      {
        h: 'A barrier that was easy to get past still helped.',
        p: 'People who asked to be barred from casinos gambled less, even though they could slip in.',
        fact: { s: 'Review · Gainsbury, 2014', i: [1] },
        more: 'A review of programs where people ask to be barred from gambling venues found that most who joined gambled less and felt more in control, even though the ban was easy to get around. The barrier did not have to be perfect to help. Letting someone else hold the code works the same way: turning it off stops being one tap.',
      },
    ],
    move: {
      h: 'Close the doors you know, and hand over the key.',
      l: ['Turn on a filter on every device', 'Close the side doors: apps and browsers', 'Let someone you trust set the code'],
      more: 'Most phones have built-in limits, like Screen Time on an iPhone, and a friend can set the passcode. You do not have to tell them everything. “Can you set a code I do not know?” is enough.',
    },
    check: {
      h: '12:10 AM. The filter blocks a site, and a thought says, “There is always the other browser.” What now?',
      o: [
        ['Try the other browser, just to see', 'That is the door the thought was pointing at. The wall gave you this minute.'],
        ['Put the phone down, and let the minute pass', 'Yes. The wall did its job. It bought the minute, and you used it.'],
        ['Decide filters are useless and turn it off', 'One door does not make the wall useless. Close that door tomorrow.'],
        ['Feel bad that the thought came', 'The thought is the old habit looking for a gap. It is not who you are.'],
      ],
      a: 1,
    },
    scope:
      'The self-control review covers habits of many kinds, and the barring review is about gambling. The idea carries over cleanly: a barrier does not have to be perfect to help. Every minute it adds is a minute for the urge to pass.',
    src: [S.duckworth16, S.gainsbury14, S.screentime],
  },

  /* ---------- l57: nobody gets free alone ---------- */
  l57: {
    id: 'l57',
    title: 'Nobody gets free alone',
    tag: 'One person who knows makes the road shorter.',
    ic: 'chat',
    ask: 'Should I not be able to do this on my own?',
    key: 'Strength is not doing it alone. One person who knows and checks in helps you stay honest and keep going.',
    np: 'The one person I could tell, and the first sentence I would say',
    hook: {
      h: 'Nobody knows. You plan to fix this quietly, by yourself.',
      say: 'How has doing it alone gone so far?',
      more: 'Many people keep the habit secret and try to beat it alone, because telling anyone feels worse than the habit. This lesson is about what changes when one person knows.',
    },
    ask1: {
      h: 'If you told one person, who would it be?',
      o: [
        ['A friend I trust', 'A friend who knows can check in, and you never have to explain twice.'],
        ['My partner, or someone at home', 'That can be a big step. It often goes better planned than blurted.'],
        ['A counselor, a group or a faith leader', 'They hear this often. They will not be shocked.'],
        ['Nobody yet', 'That is honest. This lesson is about making that first sentence smaller.'],
      ],
    },
    flip: {
      think: 'I should be able to do this on my own.',
      see: 'Nobody quits alone. The people who make it almost always have one person who knows.',
      more: 'Secrecy keeps a habit strong, because it keeps the shame alive and the slips unseen. Telling one person does not make you weaker. It makes the habit smaller, because it can no longer hide. Doing it alone is not the strong way. It is the hardest way.',
    },
    deep: [
      {
        n: '138',
        h: 'studies: keeping track helped most when someone else saw it.',
        p: 'Progress that was shared moved people further than progress kept in their own head.',
        fact: { s: 'Review · 138 studies · Harkin and colleagues, 2016', i: [0] },
        more: 'A review of 138 studies found that keeping track of progress helped people reach their goals, and it helped most when the progress was reported to someone else or made public. Being seen is a kind of help. It keeps you honest on the days you would rather not look.',
      },
      {
        h: 'One more person on their side made a measurable difference.',
        p: 'In a trial, each supportive person added raised the chance of staying free by about a quarter.',
        art: ['turns', {}],
        fact: { s: 'Randomized trial · Litt and colleagues, 2009', i: [1] },
        more: 'In a trial with people quitting drinking, counselors helped them add people to their lives who backed the change. Adding just one such person raised the chance of not drinking in the months after by about a quarter. One friend was enough to move the numbers.',
      },
    ],
    mine: { h: 'Here is what you have come back from already.', k: 'back' },
    move: {
      h: 'Tell one person, in one sentence.',
      l: ['Pick the one person who feels safe', 'Say one true sentence, not the whole story', 'Ask them to check in once a week'],
      more: 'You do not need a speech. “I am working on a habit I want to quit, and I would like someone to check in on me” is enough. If nobody feels safe yet, a group or a counselor is a good first person.',
    },
    check: {
      h: 'You told a friend last week. Tonight was hard, and you want to hide it from them. What helps most?',
      o: [
        ['Say nothing, and try harder alone', 'That puts you back where the habit is strongest: hidden.'],
        ['Send one honest line: “Hard night. Back on it.”', 'Yes. One honest line keeps the light on, and it keeps you moving.'],
        ['Tell them everything is fine', 'A small cover story grows. The truth in one line is lighter to carry.'],
        ['Decide telling them was a mistake', 'Telling them was a strong step. Hard nights are what they are there for.'],
      ],
      a: 1,
    },
    scope:
      'The tracking review covers goals of many kinds, and the support trial was about drinking. Both point one hopeful way: change goes further with even one person beside you, and that person can be found.',
    src: [S.harkin16, S.litt09],
  },

  /* ---------- l58: when the habit is carrying something heavier (care: the 988 line shows) ---------- */
  l58: {
    id: 'l58',
    title: 'When the habit is carrying something heavier',
    tag: 'Low mood, poor sleep, worry and loneliness deserve care of their own.',
    ic: 'life',
    ask: 'What if the habit is how I cope with something bigger?',
    key: 'When the habit carries low mood, worry or loneliness, give those care too. Asking for help is a strong move.',
    np: 'What the habit might be carrying for me, and one person I could ask about it',
    hook: {
      h: 'Some weeks the urge is not the whole problem.',
      say: 'Is something heavier under it?',
      more: 'For many people the habit is tied to something else: weeks of low mood, nights without sleep, worry that will not settle, or feeling alone. When that is true, working on the habit alone can feel like bailing a boat with a hole in it.',
    },
    ask1: {
      h: 'On your hardest weeks, what else is going on?',
      o: [
        ['Low mood that hangs on', 'That deserves care of its own. It often lifts with the right help.'],
        ['Bad sleep', 'Sleep can be treated, and better sleep makes every part of this easier.'],
        ['Worry, or feeling alone', 'Both are common, and both get better with help. You do not have to carry them alone.'],
        ['Nothing I can name yet', 'That is fair. Watch your next hard week, and notice what came before it.'],
      ],
    },
    flip: {
      think: 'If I were stronger, I would not need help.',
      see: 'Strength is seeing what you carry and getting the right help for it. Strong people ask.',
      more: 'Low mood, poor sleep, anxiety and loneliness are not flaws in your character. They are common, and they are some of the most treatable problems people have. A habit often grows to carry them. When the heavier thing gets care, the habit has less to do, and the pull loses some of its reason.',
    },
    deep: L58_DEEP,
    move: {
      h: 'If something heavier is there, give it care.',
      l: ['Tell a doctor how your sleep and mood are', 'Look for a counselor, even a low-cost one', 'Tell one person how you have been'],
      more: 'A good time to ask is when low mood or worry has hung on for two weeks or more, when sleep has been poor for weeks, or when you feel stuck in the same loop whatever you try. You do not need to wait for it to get worse. If you ever think about not being here, reach out today.',
    },
    check: {
      h: 'Three weeks of bad sleep and gray days. The urges are louder than ever. What is the strongest next step?',
      o: [
        ['Push harder on the habit, alone', 'The habit is only part of this. The sleep and the gray days need care too.'],
        ['Book a visit with a doctor or counselor', 'Yes. You saw what was under it, and you asked for help. That is strength.'],
        ['Wait until I have it under control first', 'Help is not a reward for getting better. It is how people get better.'],
        ['Decide I am just broken', 'You are not broken. Low mood and poor sleep are common and very treatable.'],
      ],
      a: 1,
    },
    scope:
      'The sleep trial was with students, and the guideline is written for doctors in the UK. Both say the same hopeful thing: low mood, worry and poor sleep respond well to care, and getting that care makes every other change easier.',
    src: [S.freeman17, S.nice22],
  },
};

/** the two night lessons kept from some habits (lesson-habit.ts PORN_ONLY): see the note at the top */
export const NIGHT_PORN_ONLY = ['l56', 'l58'];

/** how l56 and l58 open to each other habit (lesson-habit.ts HABIT_OPEN). The filter lesson does not fit alcohol. For alcohol,
    l58 says that medicines exist, and that a doctor helps with the first days. */
export const NIGHT_OPEN: Record<string, Partial<Record<OtherHabit, 'say' | Part>>> = {
  l56: { gambling: 'say', other: 'say' },
  l58: {
    gambling: 'say',
    other: 'say',
    alcohol: {
      deep: [
        L58_DEEP[0],
        L58_DEEP[1],
        {
          h: 'For drinking, there are medicines that help.',
          p: 'Naltrexone and acamprosate can make cravings weaker and heavy drinking less likely.',
          fact: { s: 'Health body · NIAAA', i: [1] },
          more: 'The US National Institute on Alcohol Abuse and Alcoholism lists medicines approved for alcohol problems, such as naltrexone and acamprosate. They are not habit-forming, and they can make cravings weaker and heavy drinking less likely. Few people who could use one are ever offered it, so it is worth asking a doctor.',
        },
      ],
      move: {
        h: 'If something heavier is there, give it care.',
        l: ['Tell a doctor how your sleep and mood are', 'Ask a doctor about medicines for drinking', 'Look for a counselor, even a low-cost one'],
        more: 'If you drink every day, or a lot at a time, a doctor should help with the first days, since stopping all at once can be dangerous. A good time to ask about mood is when it has hung on for two weeks or more. If you ever think about not being here, reach out today.',
      },
      scope:
        'The sleep trial was with students, and the medicines are those NIAAA lists for alcohol use disorder. Both say the same hopeful thing: the heavier things under a habit respond well to care, and for drinking, medicine is one more tool a doctor can offer.',
      srcAt: { 1: S.niaaa },
    },
  },
};

/* ---------- the practice step at the end of each (practice.ts PRACTICE) ---------- */
const plan = (when: string, text: string): PItem => ({ k: 'plan', when, text });
const line = (k: Exclude<PItem['k'], 'plan' | 'copy'>, text: string): PItem => ({ k, text });
const copy = (label: string, text: string): PItem => ({ k: 'copy', label, text });
const scene = (t: string, v: string, ic: string): Go => ({ t, a: 'scene', v, ic });
const help = (t: string, v: string, sub = '', ic = 'life'): Go => ({ t, a: 'help', v, sub, ic });

export const NIGHT_PRACTICE: Record<string, PStep> = {
  l54: {
    h: 'Let the morning decide for tonight.',
    p: 'Add the line that fits your nights while your head is clear. Tonight only has to follow it.',
    mins: 1,
    items: [
      plan('it is 10 PM', 'Put the phone on its charger outside my room, and get ready for bed.'),
      plan('I am in bed and want my phone', 'Leave it where it is. Read, or lie still until sleep comes.'),
    ],
    go: [{ t: 'Set my screens-off time', a: 'tab', v: 'settings', open: 's-sched', ic: 'moon' }],
    ok: 'Tonight is set up already.',
  },
  l55: {
    h: 'Give your phone its own bed.',
    p: 'Pick where it charges tonight, and add the line, so the plan is there when the night comes.',
    mins: 1,
    items: [
      plan('it is time for bed', 'Plug the phone in outside my room, and use my alarm clock to wake up.'),
      line('wind', 'Phone on its charger in the kitchen'),
    ],
    go: [help('Phone and night setup', 'phone', 'night', 'phone')],
    ok: 'Your phone has somewhere to sleep.',
  },
  l56: {
    h: 'Map the doors, and hand over the key.',
    p: 'Name the ways around your filter while you are calm, and ask someone to hold the code.',
    mins: 2,
    items: [
      copy('To someone I trust', 'Could you set a passcode on my phone limits for me, and keep it to yourself? It helps me stay on track.'),
      plan('I find a way around my block', 'Put the phone down for ten minutes, and close that door in the morning.'),
    ],
    go: [help('Block it on my phone', 'phone', '', 'shield')],
    ok: 'You know your doors now.',
  },
  l57: {
    h: 'Write the first sentence.',
    p: 'One person and one sentence. Here is a way to say it. Copy it, or change the words first.',
    mins: 1,
    items: [
      copy(
        'To one person I trust',
        'I am working on quitting a habit, and I do not want to do it alone. Would you check in with me once a week? You do not have to fix anything.',
      ),
    ],
    go: [scene('Reach a person', 'message', 'chat'), help('Look at free groups', 'groups', '', 'dots')],
    ok: 'Your first sentence is ready.',
  },
  l58: {
    h: 'Name what the habit carries.',
    p: 'Write it down, then take one step toward care for it this week.',
    mins: 1,
    write: ['Low mood most evenings, and bad sleep', 'Feeling alone since I moved'],
    items: [line('reason', 'I want to feel well, not only stop.')],
    go: [help('Therapy on a small budget', 'therapy', 'start', 'heart')],
    ok: 'You took a step toward care.',
  },
};
