/* Turned lessons, batch C (the format and the pilot are in lesson-turns.ts). */
import type { Turn } from './lesson-turns';

type Src = [string, string];
const S = {
  shuv: ['Hebrew lexicon: shuv, to turn back or return (Strong’s H7725), the prophets’ word for repenting', 'https://biblehub.com/hebrew/7725.htm'],
  wohl: [
    'Wohl, Pychyl & Bennett (2010): I forgive myself, now I can study, Personality and Individual Differences (summary by the British Psychological Society)',
    'https://bps.org.uk/research-digest/cure-procrastination-forgive-yourself',
  ],
  lally: ['Lally, van Jaarsveld, Potts & Wardle (2010): how are habits formed, European Journal of Social Psychology', 'https://doi.org/10.1002/ejsp.674'],
  kahneman: [
    'Kahneman, Fredrickson, Schreiber & Redelmeier (1993): when more pain is preferred to less, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.1993.tb00589.x',
  ],
  harkin: [
    'Harkin and colleagues (2016): does monitoring goal progress promote goal attainment? A meta-analysis, Psychological Bulletin',
    'https://doi.org/10.1037/bul0000025',
  ],
  mclellan: ['McLellan, Lewis, O’Brien & Kleber (2000): drug dependence, a chronic medical illness, JAMA', 'https://pubmed.ncbi.nlm.nih.gov/11015800/'],
  kashdan: [
    'Kashdan, Ferssizidis, Collins & Muraven (2010): emotion differentiation as resilience against excessive alcohol use, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/20696854/',
  ],
  lieberman: [
    'Lieberman and colleagues (2007): putting feelings into words, affect labeling and the amygdala, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/17576282/',
  ],
  yasuma: ['Yasuma & Hayano (2004): respiratory sinus arrhythmia, why the heartbeat follows the breath, Chest', 'https://doi.org/10.1378/chest.125.2.683'],
  balban: [
    'Balban and colleagues (2023): brief structured respiration practices enhance mood and reduce physiological arousal, Cell Reports Medicine',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947',
  ],
  kelly: [
    'Kelly, Stout, Magill, Tonigan & Pagano (2011): spirituality in recovery, a lagged mediational analysis of Alcoholics Anonymous, Alcoholism: Clinical and Experimental Research',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3117904/',
  ],
  taylor: [
    'Taylor & Oliver (2009): acute effects of brisk walking on urges to eat chocolate, Appetite',
    'https://researchportal.plymouth.ac.uk/en/publications/acute-effects-of-brisk-walking-on-urges-to-eat-chocolate-affect-a/',
  ],
  haasova: [
    'Haasova and colleagues (2013): the acute effects of physical activity on cigarette cravings, a meta-analysis, Addiction',
    'https://doi.org/10.1111/j.1360-0443.2012.04034.x',
  ],
  radomsky: [
    'Radomsky and colleagues (2014): you can run but you cannot hide, intrusive thoughts on six continents, Journal of Obsessive-Compulsive and Related Disorders',
    'https://pure.unic.ac.cy/en/publications/part-1-you-can-run-but-you-cant-hide-intrusive-thoughts-on-six-co/',
  ],
  crosby: [
    'Crosby & Twohig (2016): acceptance and commitment therapy for problematic internet pornography use, Behavior Therapy',
    'https://pubmed.ncbi.nlm.nih.gov/27157029/',
  ],
  iyadurai: [
    'Iyadurai and colleagues (2018): preventing intrusive memories after trauma with a brief intervention involving Tetris, Molecular Psychiatry',
    'https://doi.org/10.1038/mp.2017.23',
  ],
  skorka: [
    'Skorka-Brown, Andrade, Whalley & May (2015): playing Tetris decreases drug and other cravings in real world settings, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2015.07.020',
  ],
  kemps12: ['Kemps, Tiggemann & Bettany (2012): non-food odorants reduce chocolate cravings, Appetite', 'https://pubmed.ncbi.nlm.nih.gov/22407134/'],
  kemps07: [
    'Kemps & Tiggemann (2007): modality-specific imagery reduces cravings for food, Journal of Experimental Psychology: Applied',
    'https://doi.org/10.1037/1076-898x.13.2.95',
  ],
} satisfies Record<string, Src>;

export const TURNS_C: Record<string, Turn> = {
  l32: {
    id: 'l32',
    title: 'Forgiveness and a fresh start',
    ic: 'leaf',
    ask: 'After a slip, how do I forgive myself without excusing it?',
    key: 'To repent is to turn back, not to serve time. Turn today, and let forgiveness free you for the next step.',
    np: 'What I want to say to God, and to myself, as I turn back',
    hook: {
      h: 'The morning after a slip, it feels wrong to feel okay.',
      say: 'How long do you think you should carry it?',
      more: 'Many people of faith feel they owe a stretch of misery before they are allowed to start again. This lesson looks at what the old word for repenting asks of you, and what forgiving yourself does.',
    },
    ask1: {
      h: 'After a slip, how long do you usually stay down before you start again?',
      o: [
        ['A few hours', 'Then you already know how to come back. This lesson makes it sooner.'],
        ['A day or two', 'Those days often hold the next slip. Shorter is kinder, and safer.'],
        ['Until I feel I have paid for it', 'That bill never quite gets paid. The next card offers another way to see it.'],
        ['I do not know yet', 'Notice it next time. The length of the low tells you a lot.'],
      ],
    },
    flip: {
      think: 'To show I mean it, I should feel awful for a while.',
      see: 'The old word for repent means to turn back. What counts is the turn, and you can make it this morning.',
      more: 'Feeling awful can pass for being serious. But a week of misery does not move you an inch toward home. Turning does. Sorrow can come with you, and it does not have to be paid in full before you start walking.',
    },
    deep: [
      {
        h: 'The Hebrew prophets’ word for repent is shuv: turn back.',
        p: 'It names a direction, not a sentence to serve. Once you turn, you are already on the way.',
        fact: { s: 'Word · Hebrew shuv, to turn back', i: [0] },
        more: 'When the prophets call people to repent, they use shuv, the plain word for turning around and coming back. The Greek of the New Testament adds metanoia, a change of mind. Neither word is a measure of how bad you feel. Both point you toward home.',
      },
      {
        h: 'Feeling awful looks back. Turning looks ahead.',
        p: 'Remorse can last a week and change nothing. A turn takes a minute, and it changes the direction.',
        more: 'Sorrow for what happened is honest, and it has a place. The question is what it does. If it keeps you staring at last night, it is holding you in place. If it turns you around, it has done its work.',
      },
      {
        h: 'Students who forgave themselves put things off less next time.',
        p: 'Holding on to the guilt did not make them try harder. Letting it go did.',
        art: ['research', { k: 'kind' }],
        fact: { s: 'Study · first-year students · Wohl, Pychyl & Bennett, 2010', i: [1] },
        more: 'Researchers followed first-year university students from one exam period to the next. Those who had forgiven themselves for putting off studying the first time felt less bad, and put off studying less before the second exams. The guilt they kept had not pushed them forward. Forgiving it let them walk back to the work.',
      },
    ],
    mine: { h: 'This is your own record of turning back.', k: 'back' },
    move: {
      h: 'Turn back this morning, not next week.',
      l: ['Ask forgiveness in your own words', 'Log it honestly, in under a minute', 'Do one small next right thing'],
      more: 'If you need to make amends to someone, plan it with a counselor, sponsor or faith leader first. Turning back does not have to happen alone.',
    },
    check: {
      h: 'The morning after a slip, a voice says to carry it all week to show you mean it. What do you do?',
      o: [
        ['Carry it, so I take it seriously', 'A week of carrying looks serious, and spends the week you could use to turn.'],
        ['Pray, log it, take one small step', 'Yes. That is the turn. Taking it seriously looks like coming back.'],
        ['Act like nothing happened', 'Turning means looking at it first. Name it, then come home.'],
        ['Wait until I feel forgiven to start', 'Forgiveness meets you on the way back. You do not have to wait for it.'],
      ],
      a: 1,
    },
    scope:
      'The word notes come from the Hebrew and Greek of the Bible, read plainly, not from the teaching of any one church. The study followed university students putting off schoolwork, not porn. What carries over is clear: forgiving yourself went with trying again, not with caring less.',
    src: [S.shuv, S.wohl],
  },

  l21: {
    id: 'l21',
    title: 'Missing a day',
    ic: 'calendar',
    ask: 'If I skip a day of my routine, have I lost my progress?',
    key: 'A habit is a path you wear in, not a chain. One missed day barely fades it, so walk it again the day after.',
    np: 'What I will do the day after I miss one',
    hook: {
      h: 'You skipped yesterday’s check-in. Opening the app feels awkward.',
      say: 'Is the habit broken now?',
      more: 'New habits, like a daily check-in or a screens-off time, take a while to stick. This lesson is about what one missed day does to them, and what the day after is for.',
    },
    ask1: {
      h: 'When you miss a day of something you are building, what does it usually feel like?',
      o: [
        ['Like the whole thing is broken', 'That feeling is what turns one missed day into a missed week.'],
        ['Awkward, like I owe an explanation', 'Many people stay away to dodge that. Nobody here needs one.'],
        ['Not much. I just pick it up', 'That is a strength. Picking it up is most of the skill.'],
        ['I do not know yet', 'Notice it the next time you miss one. It tells you a lot.'],
      ],
    },
    flip: {
      think: 'I missed a day, so the habit is broken.',
      see: 'A habit is a path you wear in, not a chain. One day off barely fades it, and walking it again wears it deeper.',
      more: 'A chain breaks at one link. A path does not. It fades only when it goes unwalked for a long time, and every time you walk it, it gets clearer. Missing a day is a step off the path, not the end of it.',
    },
    deep: [
      {
        h: 'In one study, one missed day barely dented a new habit.',
        p: 'People built a daily habit for 12 weeks. A single miss made little difference. Many misses did.',
        art: ['path', {}],
        fact: { s: 'Study · 96 volunteers · Lally et al., 2010', i: [0] },
        more: 'Volunteers each picked one small daily habit, like a glass of water with lunch or a walk, and rated how automatic it felt for 84 days. Missing a single day made little difference to how automatic the habit became. Missing many days, even spread out, lowered how far it got.',
      },
      {
        n: '66',
        h: 'days was the middle for a habit to feel automatic, not 21.',
        p: 'Some took 18 days, others far longer. Slow is the normal speed, not a sign you are failing.',
        fact: { s: 'Study · 96 volunteers · Lally et al., 2010', i: [0] },
        more: 'The typical person in the study took about 66 days for the habit to settle in, and the range ran from 18 days to an estimated 254. If it still feels like work after three weeks, you are right on time.',
      },
      {
        h: 'It is the same trap as “I already blew it.”',
        p: 'The missed day does little. Skipping the next one because of it is what adds up.',
        back: 'l3',
      },
    ],
    mine: { h: 'Here, a missed check-in takes no day away.', k: 'clean30' },
    move: {
      h: 'Make the way back smaller than the gap.',
      l: ['Come back with one tap, no catching up', 'Decide your first step after a miss', 'Try not to let one miss become two'],
      more: 'In Daybook, a day without a check-in still counts as a day with no slip. Nothing is waiting to be made up.',
    },
    check: {
      h: 'It is 9 p.m. Tuesday. You skipped yesterday’s check-in, and opening it now feels like admitting something. What do you do?',
      o: [
        ['Leave it until Monday and start clean', 'Waiting for a clean start turns one missed day into a week of them.'],
        ['Make up for it with a long entry', 'No catching up is needed. The path only asks that you walk it again.'],
        ['Skip it tonight too, since it is late', 'That is the second miss, and misses that stack are what fade the path.'],
        ['Open it and do the short check-in', 'Yes. One step back on the path, and it starts wearing in again.'],
      ],
      a: 3,
    },
    scope:
      'The study followed 96 people building small daily habits like drinking water or walking, not quitting porn, and it was small. Researchers are still testing how much one miss matters. The broad picture is sure and hopeful: habits grow slowly, and coming back keeps them growing.',
    src: [S.lally],
  },

  l40: {
    id: 'l40',
    title: 'Your log is your evidence',
    ic: 'check',
    ask: 'How do I start to believe I am someone who is free of this?',
    key: 'Memory keeps the worst night and the last one. Your log keeps every day, so on a hard morning, trust the log.',
    np: 'What my log says about who I am becoming',
    hook: {
      h: 'You slipped last night, and it feels like the whole month.',
      say: 'Is that what the month was?',
      more: 'After a slip, it can feel like the last thing you did is the truest thing about you. This lesson is about why memory tells it that way, and what tells it fairly.',
    },
    ask1: {
      h: 'When you look back on a hard week, what do you remember first?',
      o: [
        ['The worst night', 'Most minds do this. One night ends up standing in for seven.'],
        ['How it ended', 'Endings shout. The next cards show why they count for too much.'],
        ['The urges I rode out', 'That is rare and worth keeping. Many people forget those first.'],
        ['I do not know yet', 'Try it with last week. Notice what comes up first.'],
      ],
    },
    flip: {
      think: 'The last thing I did shows who I really am.',
      see: 'Memory judges a stretch by its worst moment and its last. Your log counts every day, the quiet ones too.',
      more: 'Memory is not a fair judge of a month. It keeps the sharpest moment and the ending, and lets the plain days fall away. The evenings you got through without a fight leave almost no mark. A log keeps them.',
    },
    deep: [
      {
        h: 'People chose more cold-water pain, since it ended a bit milder.',
        p: 'Their memory kept the worst moment and the end, and dropped how long it lasted.',
        art: ['memory', {}],
        fact: { s: 'Study · Kahneman and colleagues, 1993', i: [0] },
        more: 'Volunteers held a hand in painfully cold water for 60 seconds. Another time they held it for 90 seconds, where the last 30 were a little less cold. Asked which one to repeat, most chose the longer one. Memory had kept the peak and the ending, and dropped the length. Doctors later found the same in patients after painful procedures.',
      },
      {
        n: '138',
        h: 'experiments found that tracking progress helps people reach a goal.',
        p: 'It helped more when the progress was written down. A record sees what memory skips.',
        fact: { s: 'Meta-analysis · 138 experiments · Harkin et al., 2016', i: [1] },
        more: 'A large review pooled 138 experiments, most of them on health goals. Prompting people to track their progress helped them reach their goals, and it helped more when the progress was written down or shared.',
      },
      {
        h: 'The person you are becoming already shows up in it.',
        p: 'You pictured who you are becoming. The log is where that person leaves footprints, one entry at a time.',
        back: 'l37',
      },
    ],
    mine: { h: 'Here is what your log keeps that memory drops.', k: 'rode' },
    move: {
      h: 'On a hard morning, read the log, not your memory.',
      l: ['Log the slip honestly, as one day', 'Read back over the last two weeks', 'Say it: “One night, not the month.”'],
    },
    check: {
      h: 'It is 6 a.m. after a slip. You open the log to write it down and want to delete it all. What do you do?',
      o: [
        ['Delete it all and start clean', 'That throws away every urge you rode out, to hide one night.'],
        ['Log the slip, then read back a week', 'Yes. One honest line, and the whole stretch back in view.'],
        ['Leave the slip out so it looks clean', 'A log with holes stops being evidence. Keep it whole and true.'],
        ['Close the app and stop logging', 'Then memory is the only witness left, and it keeps the worst.'],
      ],
      a: 1,
    },
    scope:
      'The cold-water and patient studies were about remembered pain, not habits, and they show how memory tends to work, not how it always works. The tracking review pooled 138 experiments, mostly on health goals. Together they show why an honest log is a fairer witness than a hard morning.',
    src: [S.kahneman, S.harkin],
  },

  l12: {
    id: 'l12',
    title: 'What getting better looks like',
    ic: 'sunrise',
    ask: 'What does getting better look like?',
    key: 'Getting better is a direction, not a line. Judge it as doctors judge a long-term condition: by the trend.',
    np: 'How this month compares with last month',
    hook: {
      h: 'Three good weeks, then a slip on Friday.',
      say: 'So were you never getting better?',
      more: 'Many people picture getting better as a line that only goes up. When a setback comes, the whole line feels false. This lesson is about a fairer way to judge it.',
    },
    ask1: {
      h: 'How do you decide whether you are getting better?',
      o: [
        ['By how long since the last slip', 'That makes every slip look like a fall to the bottom.'],
        ['By how I feel this week', 'Feelings swing day to day. A trend moves slower and tells more.'],
        ['By whether urges come less often', 'That reads the direction, which is what doctors watch too.'],
        ['I do not know yet', 'Hold that. The next cards offer a fair way to judge.'],
      ],
    },
    flip: {
      think: 'If I were getting better, I would not have setbacks.',
      see: 'No doctor judges asthma or blood pressure by one bad week. They judge the direction. Judge yours that way.',
      more: 'Long-term conditions have flares, and care for them is judged over months: fewer flares, milder ones, a quicker way back. A habit you are changing works the same. One setback is a point on the line, not the line.',
    },
    deep: [
      {
        h: 'Doctors compared drug habits with asthma and diabetes.',
        p: 'Slips back were about as common in each. In those illnesses a flare is expected, and the trend counts.',
        art: ['research', { k: 'cycle' }],
        fact: { s: 'Review · McLellan and colleagues, JAMA, 2000', i: [0] },
        more: 'A review in a major medical journal compared drug dependence with type 2 diabetes, high blood pressure and asthma. People slipped back, and kept to their care, at similar rates across all of them. The authors argued it should be treated the same way: no one calls asthma care a failure when a bad week comes. They look at whether life is better over time.',
      },
      {
        h: 'Ask the questions a good doctor would ask.',
        p: 'Fewer slips than last month? Back sooner after one? More urges ridden out? That is the direction.',
        more: 'A streak answers one question: how long since the last slip. The questions that show direction look at a whole month: how often, how fast you came back, how many urges you outlasted, and whether sleep, people and purpose are growing too.',
      },
      {
        h: 'A slip is the missed day, only bigger.',
        p: 'One dip in a climbing line does not erase the climb. What matters is how soon you are back on the path.',
        back: 'l21',
      },
    ],
    mine: { h: 'Here is one sign of your direction.', k: 'back' },
    move: {
      h: 'Judge this month against last month.',
      l: ['Count the days that held, not the streak', 'Notice how fast you came back', 'Add one sign of a fuller life'],
    },
    check: {
      h: 'You slipped Friday after three good weeks. It is Sunday. What tells you whether you are getting better?',
      o: [
        ['The count since the slip on Friday', 'One number misses the three weeks. Read the trend, not the last day.'],
        ['How bad I feel about it', 'Feeling bad is honest. It measures the sting, not the trend.'],
        ['This month against last month', 'Yes. Fewer slips, faster returns, more urges ridden out. That is direction.'],
        ['Whether I ever slip again', 'That bar would fail every long-term illness. Direction is the fair test.'],
      ],
      a: 2,
    },
    scope:
      'The review compared drug dependence with diabetes, high blood pressure and asthma, not porn, and it argues for a way of seeing care. It gives no number for you. The idea carries over plainly: a lasting change is judged by where it is heading, and setbacks belong in the picture.',
    src: [S.mclellan],
  },

  l13: {
    id: 'l13',
    title: 'Name the feeling',
    ic: 'pencil',
    ask: 'What is going on underneath an urge?',
    key: '“Bad” leaves you nothing to do but the habit. Name the exact feeling, and it points at what you need.',
    np: 'The feeling I most often call just “bad”',
    hook: {
      h: 'It is 11 p.m. You feel off, and you cannot say why.',
      say: 'What is the feeling under it?',
      more: 'Urges often ride in on a feeling, and most of the time the feeling has no name. It is just a fog called “bad.” This lesson is about what changes when you name it.',
    },
    ask1: {
      h: 'When an urge comes after a rough day, what word fits the feeling under it?',
      o: [
        ['Stressed or wound up', 'Stress asks for a release: a walk, a shower, a hard workout.'],
        ['Lonely or left out', 'Lonely asks for a person. One text can start to meet it.'],
        ['Tired or empty', 'Tired asks for sleep. That one is cheap to give tonight.'],
        ['Just bad. I cannot tell', 'That fog is common. This lesson is about clearing it.'],
      ],
    },
    flip: {
      think: 'I just feel bad, and then I want it.',
      see: '“Bad” gives you nothing to do. “Lonely” or “worn out” points at what you need, and it is not porn.',
      more: 'A blurry feeling can only be fixed by something blurry, and the habit is always there to do it. A sharp word changes the question from “how do I make this stop” to “what is this asking for.” Lonely wants a person. Worn out wants sleep.',
    },
    deep: [
      {
        h: 'Young drinkers with exact words for bad moods drank less.',
        p: 'On their hardest days, those who could tell anger from shame from sadness held back more.',
        art: ['research', { k: 'name' }],
        fact: { s: 'Study · 106 young drinkers · Kashdan et al., 2010', i: [0] },
        more: 'For three weeks, 106 social drinkers aged 18 to 20 logged their feelings and their drinking on handheld computers. On days with strong bad feelings, those who described their feelings in precise terms drank less than those who lumped them together. It is a link, and it points one way: a sharp word helps more than a blur.',
      },
      {
        h: 'Putting a feeling into a word turned the brain’s alarm down.',
        p: 'In a brain scan, naming the emotion quieted the alarm center. A word gives the thinking part a say.',
        fact: { s: 'Brain-scan study · 30 adults · Lieberman et al., 2007', i: [1] },
        more: 'Ordinary adults looked at faces showing strong emotions. When they put the emotion into a word, activity in the amygdala, the brain’s alarm center, was lower, and a part at the front of the brain was more active.',
      },
      {
        h: 'Late and low has more than one meaning.',
        p: 'Tired asks for sleep. Lonely asks for a person. Name which one, and you know what to do.',
        back: 'l4',
      },
    ],
    mine: { h: 'Here is the reason you name most.', k: 'trigger' },
    move: {
      h: 'Swap “bad” for a sharper word.',
      l: ['Say it: “I notice I feel ___.”', 'If the word is “bad,” find a second one', 'Meet that need: a call, sleep, a walk'],
    },
    check: {
      h: 'It is 11 p.m. on the couch. You want it and cannot say why. You only feel off. What do you do first?',
      o: [
        ['Find the exact word: lonely, tired, stung', 'Yes. A sharp word points at what you need, and it is not on the screen.'],
        ['Push through, since feelings do not matter', 'Unnamed, the feeling keeps running things. A word gives it an address.'],
        ['Scroll until the feeling fades', 'Scrolling keeps the blur, and the trigger, in your hand.'],
        ['Decide this is just how I am', 'That is a verdict, not a feeling. Feelings have names, and they pass.'],
      ],
      a: 0,
    },
    scope:
      'The drinking study followed 106 young social drinkers and found a link, not a cause. The brain-scan study looked at ordinary adults viewing faces. Neither studied porn. Both point the same hopeful way: an exact word for a feeling gives you more to work with than a blur.',
    src: [S.kashdan, S.lieberman],
  },

  l14: {
    id: 'l14',
    title: 'A longer breath out',
    ic: 'wind',
    ask: 'Is there a quick way to calm my body when an urge hits?',
    key: 'Your heart slows each time you breathe out. A long breath out is a brake you carry, so practice it when quiet.',
    np: 'When I will practice a long breath out',
    hook: {
      h: 'Your heart is up, your chest is tight, and the pull starts.',
      say: 'Can you slow your heart on purpose?',
      more: 'An urge is partly a body event, and most of the body runs on its own. Breathing is one of the few parts you can steer. This lesson is about why the breath out matters most.',
    },
    ask1: {
      h: 'When your body is wound up, what usually brings it back down?',
      o: [
        ['Time, and nothing else', 'Time works, slowly. The breath can bring it down sooner.'],
        ['Doing something with my hands', 'That helps. The breath is one tool you always carry.'],
        ['The habit, if I am honest', 'That is honest, and common. This is a quicker, cheaper way down.'],
        ['I do not know yet', 'Try the breath after this lesson, and notice.'],
      ],
    },
    flip: {
      think: 'I cannot calm my body on command.',
      see: 'Your heart slows a little every time you breathe out. Make the breath out long, and you hold the brake longer.',
      more: 'You cannot order your heart to slow down. You can reach it through the breath. Every breath out already eases the heart a little, so a breath out that is longer than the breath in gives the easing side more time.',
    },
    deep: [
      {
        h: 'Put two fingers on your pulse and breathe slowly.',
        p: 'It quickens as you breathe in and slows as you breathe out. Every healthy body does this.',
        fact: { s: 'Review · Yasuma & Hayano, 2004', i: [0] },
        more: 'Doctors call it respiratory sinus arrhythmia: the heartbeats come closer together on the breath in and spread apart on the breath out. You can feel it at your wrist right now. It is the reason a long breath out settles you.',
      },
      {
        n: '5',
        h: 'minutes a day of long breaths out lifted mood more than meditation did.',
        p: 'For a month, 108 adults tried breathing or meditation. The long breath out did best on mood.',
        fact: { s: 'Randomized study · 108 adults · Balban et al., 2023', i: [1] },
        more: 'Researchers asked 108 adults to practice one of three breathing patterns or mindfulness meditation, 5 minutes a day for a month. All of them helped. The biggest lift in good mood came from cyclic sighing: a breath in, a small sip more, then a long slow breath out.',
      },
      {
        h: 'Name the feeling, then slow the body that carries it.',
        p: 'The word tells you what is going on. The breath turns the volume down while you decide.',
        back: 'l13',
      },
    ],
    mine: { h: 'Here are the hours to practice for.', k: 'hour' },
    move: {
      h: 'Find the brake while it is quiet.',
      l: ['In through the nose, then sip a little more', 'Out slowly through the mouth, longer', 'A minute of it. If dizzy, stop'],
    },
    check: {
      h: 'It is 6 p.m. in a parked car after a bad day. Your heart is up and the pull starts. What do you do with the next minute?',
      o: [
        ['Tell myself firmly to calm down', 'Orders do not reach the heart. The breath out does.'],
        ['Check my phone to take my mind off it', 'The phone keeps the trigger in your hand. Breathe first.'],
        ['Long breaths out, then drive home', 'Yes. Each long breath out slows the heart a little, and the gap opens.'],
        ['Breathe fast to burn it off', 'Fast breathing winds the body up. The slow breath out is the brake.'],
      ],
      a: 2,
    },
    scope:
      'The heart slowing on the breath out is well-known body science. The breathing study was in mostly young adults and measured mood and calm, not urges. A long breath out does not make an urge vanish. It settles the body while the urge rises and falls, and that is a real help.',
    src: [S.yasuma, S.balban],
  },

  l30: {
    id: 'l30',
    title: 'A pause for prayer or quiet',
    ic: 'sunrise',
    ask: 'What can I do in the hard moment, using my faith?',
    key: 'A prayer in a hard moment is not a switch for the urge. It is a place to stand while the wave passes.',
    np: 'The words I will say in a hard moment',
    hook: {
      h: 'You prayed in bed. The pull is still there.',
      say: 'Did the prayer fail?',
      more: 'Many people of faith pray in a hard moment, and when the pull does not lift, they feel the prayer was not good enough, or not heard. This lesson is about what a short pause for prayer or quiet does.',
    },
    ask1: {
      h: 'When you pray in a hard moment and the pull stays, what do you think it means?',
      o: [
        ['That I did not pray hard enough', 'That turns prayer into a test you can fail. It is not one.'],
        ['That God is not listening', 'Many people feel that. The next card offers another way to see it.'],
        ['That tonight is just hard', 'That is closer. Hard is not the same as hopeless.'],
        ['I do not know yet', 'That is honest. Keep it open for the next card.'],
      ],
    },
    flip: {
      think: 'If I pray and the pull stays, the prayer did not work.',
      see: 'A short prayer is not a switch to make the urge vanish. It is a place to stand while it passes.',
      more: 'Asking for the pull to lift on the first word turns every hard night into a test of your faith. A pause does something else. It puts you somewhere steady, with words or with quiet, between the pull and the act, and it keeps you there long enough to choose.',
    },
    deep: [
      {
        h: 'The pause opens a gap between the pull and what you do.',
        p: 'The pull, then a pause, then your words. By the time you move, you are choosing, not reacting.',
        art: ['chain', { n: ['The pull', 'A pause', 'Your words', 'Your choice'] }],
        more: 'Without a pause, the pull and the act sit side by side, and the act can happen before you have decided anything. A prayer or a quiet minute pushes them apart. In that gap, you remember what you want, and the choice comes back to you.',
      },
      {
        h: 'In AA, growing spiritual practice carried part of the help.',
        p: 'Adults in AA were followed for over a year. Growth in spiritual practice explained part of why it helped.',
        fact: { s: 'Study · Kelly and colleagues, 2011', i: [0] },
        more: 'A large study followed adults in treatment for drinking problems who went to AA, and measured their spiritual practices and their drinking over 15 months. Going to AA went with more spiritual practice, and that growth explained part of why AA helped. Faith was not a side comfort. It was part of how the change happened.',
      },
      {
        h: 'The urge is still a wave. The prayer is where you stand.',
        p: 'It rises, peaks and falls whether or not it lifts at the first word. Your words keep you steady through it.',
        art: ['wave', {}],
        back: 'l2',
      },
    ],
    move: {
      h: 'Make the pause a place to stand.',
      l: ['Stop, and put the phone face down', 'Say your words, short and your own', 'Stay in them until you can choose'],
      more: 'Your words can be a line from your faith’s writings, the Serenity Prayer, a sentence of your own, or quiet. Have them ready before you need them.',
    },
    check: {
      h: 'It is 11 p.m. You prayed in bed, and the pull is still there. What now?',
      o: [
        ['Stay in my words, then choose', 'Yes. The prayer held you through the peak. Now the choice is yours.'],
        ['Decide the prayer did not work', 'The pull staying is not a verdict on your prayer. Waves take minutes.'],
        ['Pray harder until it vanishes', 'Words that demand a result become a test. Let them hold you instead.'],
        ['Give in, and ask forgiveness after', 'Forgiveness is always there. Right now, the gap is still open.'],
      ],
      a: 0,
    },
    scope:
      'The study followed adults with drinking problems who went to AA, over more than a year, and it is about faith growing over months, not one prayer. The wave comes from studies of urges in general. Together they give a hard moment a shape that faith and research both support.',
    src: [S.kelly],
  },

  l15: {
    id: 'l15',
    title: 'Move your body',
    ic: 'bolt',
    ask: 'Can moving my body really help with an urge?',
    key: 'A craving lives in the body as well as the head. Change what the body is doing, and the pull often drops.',
    np: 'The movement I could do in one minute',
    hook: {
      h: 'It is 10 p.m., you are on the couch, and the pull is building.',
      say: 'Where do you feel it?',
      more: 'Most people treat an urge as a fight in the head: thoughts against thoughts. This lesson is about the part of the urge that lives in the body, and the quick way to change it.',
    },
    ask1: {
      h: 'When an urge builds, where do you feel it first?',
      o: [
        ['In my head, as pictures', 'Pictures start there. The body joins fast, and the body is easier to move.'],
        ['Restless, in my legs or hands', 'That restlessness is energy looking for a job. Give it one.'],
        ['Tight, in my chest or stomach', 'That is a body state, and moving changes body states.'],
        ['I do not know yet', 'Check next time. Where it sits shows where to start.'],
      ],
    },
    flip: {
      think: 'An urge is in my head, so my head has to beat it.',
      see: 'A craving lives in the body too. Change what the body is doing, and the craving often drops in minutes.',
      more: 'Arguing with an urge keeps the whole fight in your head, where it is loudest. A craving is also a heart rate, a restlessness, a tightness. Those change when the body changes, and the pull changes with them.',
    },
    deep: [
      {
        h: 'Chocolate lovers walked for 15 minutes, and wanted it less.',
        p: 'Even unwrapping a bar afterward, their urge stayed lower than after sitting still.',
        art: ['wave', {}],
        fact: { s: 'Study · 25 regular chocolate eaters · Taylor & Oliver, 2009', i: [0] },
        more: 'Regular chocolate eaters went three days without it, then came in twice: once for a brisk 15-minute walk, once to sit quietly. After the walk, their urges were weaker. When they were handed a chocolate bar to unwrap and hold, the urge did not climb as high as it did after resting. Same minds, same bar. Their bodies had done something different.',
      },
      {
        h: 'Pooled trials found the same with cigarette cravings.',
        p: 'Short bouts of activity eased the pull in people going without. You do not need a workout.',
        fact: { s: 'Review · Haasova et al., 2013', i: [1] },
        more: 'A review pooled studies of people who had gone without cigarettes for a short time. Those who did a short bout of activity, like a brisk walk, reported weaker cravings afterward than those who did not.',
      },
      {
        h: 'The breath settles the body from inside. A walk, from outside.',
        p: 'Use either one. When the pull is strong, use both.',
        back: 'l14',
      },
    ],
    mine: { h: 'Here is when a move is worth having ready.', k: 'hour' },
    move: {
      h: 'When the pull builds, change what the body does.',
      l: ['Stand up, and walk out of the room', 'Ten squats, the stairs, or a lap outside', 'Then decide, with the pull lower'],
    },
    check: {
      h: 'It is 10 p.m. on the couch. The pull is building. What does your body do in the next minute?',
      o: [
        ['Stay still and argue it down in my head', 'That keeps the fight in your head, where the urge is loudest.'],
        ['Lie down and wait', 'Lying still keeps the body in the same state as the craving.'],
        ['Plan a workout for tomorrow', 'Tomorrow does not touch tonight. A minute of moving does.'],
        ['Walk a lap, or do ten squats', 'Yes. Change the body, and the craving has less to stand on.'],
      ],
      a: 3,
    },
    scope:
      'The walking study was about chocolate, and the review about cigarettes, not porn. Both found that short bouts of activity eased cravings for a while. The pattern carries over well: moving the body is one more way to let an urge pass.',
    src: [S.taylor, S.haasova],
  },

  l16: {
    id: 'l16',
    title: 'Thoughts are not orders',
    ic: 'sparkle',
    ask: 'What do I do with thoughts like “just once” or “I deserve it”?',
    key: 'Nearly everyone has thoughts they would not choose. A thought is not a vote or an order. Name it, then choose.',
    np: 'The thought that shows up first for me',
    hook: {
      h: 'It is midnight, and a thought says, “Just once will not matter.”',
      say: 'What does it say about you that you thought it?',
      more: 'A thought like that can feel like a confession: proof that part of you does not want to quit. This lesson is about what a thought that shows up says about you, and what it does not.',
    },
    ask1: {
      h: 'When an unwanted thought like that shows up, what do you tell yourself about it?',
      o: [
        ['That I must not want to quit', 'That makes the thought a verdict. It is only a thought passing through.'],
        ['That I am a bad person', 'That piles shame on a thought you did not choose.'],
        ['Nothing. I argue with it', 'Arguing treats it as a real opponent. It does not need one.'],
        ['I do not know yet', 'Watch for it this week, and for what you say back.'],
      ],
    },
    flip: {
      think: 'If “just once” shows up, part of me must want it.',
      see: 'Almost everyone has thoughts they would never choose. A thought that shows up is not a vote on what you want.',
      more: 'A mind makes offers all day, most of them unasked for. Some are useful, some are odd, some are the old habit talking. What you want shows in what you choose, not in what drifts through.',
    },
    deep: [
      {
        n: '94%',
        h: 'of students on six continents had unwanted thoughts pop up.',
        p: 'Doubts, worries, odd impulses. Having them was nearly universal. What differed was what people made of them.',
        fact: { s: 'Study · 777 students, 13 countries · Radomsky et al., 2014', i: [0] },
        more: 'Researchers asked 777 university students in 13 countries on six continents about unwanted thoughts, images and impulses that popped into their heads. Almost all of them, 94%, had had at least one in the past three months. The authors concluded that the trouble lies less in having the thought than in how people read it and try to control it.',
      },
      {
        h: 'Men taught to notice thoughts, not obey them, watched far less.',
        p: 'In a small trial of a therapy built on noticing, porn viewing fell by about 93%.',
        fact: { s: 'Randomized trial · 28 men · Crosby & Twohig, 2016', i: [1] },
        more: 'Men who felt their porn use was a problem got 12 sessions of acceptance and commitment therapy, or waited. The therapy taught them to say “I am having the thought that…” and choose anyway, without arguing. Viewing fell about 93% with the therapy, against 21% for those waiting.',
      },
      {
        h: 'You are not the act, and you are not the thought either.',
        p: 'You learned to name the act, not yourself. A thought that drifts through is even less of who you are.',
        back: 'l5',
      },
    ],
    mine: { h: 'Here is what happened with urges you did not obey.', k: 'rode' },
    move: {
      h: 'Hear it, name it, and choose anyway.',
      l: ['Say “I am having the thought that…”', 'You do not need to win the argument', 'Do the next small thing from your plan'],
    },
    check: {
      h: 'Midnight. “Just this once will not matter” sounds reasonable. What do you do in the next minute?',
      o: [
        ['Decide I must not want to quit', 'The thought is not a vote. Wanting to quit and hearing it can sit side by side.'],
        ['Argue until I prove it wrong', 'At midnight that argument runs long. You do not have to win it.'],
        ['Name it, then get up', 'Yes. You heard it, you named it, and the choice stayed yours.'],
        ['Go along, since it showed up', 'Showing up is all thoughts do. That does not make it an order.'],
      ],
      a: 2,
    },
    scope:
      'The thoughts study asked students about unwanted thoughts of many kinds, mostly doubts and worries, not urges. The trial was small, with 28 men. Together they show that unwanted thoughts are normal, and that noticing them without obeying them is a skill that cut viewing.',
    src: [S.radomsky, S.crosby],
  },

  l42: {
    id: 'l42',
    title: 'Crowd out the picture',
    ic: 'sparkle',
    ask: 'Why would a small puzzle help when an urge is strong?',
    key: 'An urge grows by painting a picture, and the mind has room for only so much. Give your eyes a puzzle instead.',
    np: 'What my eyes and hands can do when an urge starts',
    hook: {
      h: 'It is 11:30 p.m. A thought becomes a picture, and it sharpens.',
      say: 'Can you push a picture out of your head?',
      more: 'Most urges grow the same way: a small thought, then a picture, then the picture fills in. The brighter it gets, the stronger the pull. This lesson is about taking its room away.',
    },
    ask1: {
      h: 'When an urge turns into a picture, what usually happens next?',
      o: [
        ['It gets brighter the longer I wait', 'Waiting with nothing to do leaves it room. This lesson fills that room.'],
        ['I push it away, and it stays', 'Pushing keeps your eyes on it. A job for the eyes works better.'],
        ['Something grabs me, and it fades', 'You have seen it work by accident. This lesson does it on purpose.'],
        ['I do not know yet', 'Watch the next one. Notice the moment it turns into a picture.'],
      ],
    },
    flip: {
      think: 'To beat a strong urge, I have to push harder against it.',
      see: 'Your mind has one small screen for pictures. Give your eyes a job, and the picture has no room to grow.',
      more: 'Pushing against a picture keeps you looking at it. Filling the screen with something else does not. The mind can only hold so much picture at once, and a puzzle for the eyes and hands takes the space the urge needs.',
    },
    deep: [
      {
        h: 'After a car crash, a block game meant fewer flashbacks.',
        p: 'Patients who played for 20 minutes in the hospital had fewer intrusive memories that week.',
        art: ['screen', {}],
        fact: { s: 'Trial · 71 patients · Iyadurai et al., 2018', i: [0] },
        more: 'In an Oxford emergency room, 71 people who had just been in a road accident either played Tetris for 20 minutes or wrote down what they had done that day. Over the next week, the players had fewer intrusive memories. It was a small first trial, and it shows how much of the mind’s eye a simple puzzle takes up.',
      },
      {
        n: '3',
        h: 'minutes of a block game lowered cravings in daily life, all week.',
        p: 'Food, drink, cigarettes, and sexual urges among them. Every game was a small win.',
        fact: { s: 'Field study · 31 people · Skorka-Brown et al., 2015', i: [1] },
        more: 'For a week, 31 young adults got seven text messages a day asking about their cravings. Half of them played a block game for three minutes after each one. Their cravings dropped by about 14 points on a 100-point scale, across every kind they had, and the drop held all week.',
      },
      {
        h: 'An honest look loosens it. A puzzle leaves it no room.',
        p: 'When the picture will not settle, looking is not enough. Give the screen something else to show.',
        back: 'l41',
      },
    ],
    mine: { h: 'Here is when to have the puzzle ready.', k: 'hour' },
    move: {
      h: 'When the picture starts, give your eyes a job.',
      l: ['Open Fit the shapes in SOS', 'Play one minute, eyes on the board', 'Then stand up and do the next thing'],
      more: 'Anything for the eyes and hands helps, as long as it has nothing in it to start a new picture. A screen full of feeds does not count.',
    },
    check: {
      h: 'It is 11:30 p.m. The picture in your head is getting clearer. What do your eyes and hands do for the next minute?',
      o: [
        ['Close my eyes and push it away', 'Closed eyes leave the screen to the picture. Give them a job.'],
        ['Fit shapes, eyes on the board', 'Yes. The board takes the room the picture needs, so the pull drops.'],
        ['Count backward in my head', 'Numbers help a little, and leave the picture screen free.'],
        ['Scroll until it passes', 'Scrolling is full of cues that paint new pictures. Pick a puzzle.'],
      ],
      a: 1,
    },
    scope:
      'The block game studies were with crash patients and with young adults and their everyday cravings, not with porn, and one author calls it a tool, not a treatment. The pattern carries over well: the mind’s screen is small, and a puzzle for the eyes takes the space a picture needs.',
    src: [S.iyadurai, S.skorka],
  },

  l43: {
    id: 'l43',
    title: 'Come back to the room',
    ic: 'compass',
    ask: 'When an urge pulls me into my head, how do I get back out?',
    key: 'You do not need a better thought to leave your head. Come back through what you can see, feel and smell.',
    np: 'The things around me that bring me back',
    hook: {
      h: 'Your body is on the couch. Your mind is somewhere else.',
      say: 'Where are you, right now?',
      more: 'An urge can take you out of the room you are in and into a scene in your head. This lesson is about the quickest way back, and it is already all around you.',
    },
    ask1: {
      h: 'When an urge pulls you into your head, what do you usually try?',
      o: [
        ['Think about something else', 'Another thought still lives in your head. The room is outside it.'],
        ['Tell myself firmly to stop', 'A firm stop still keeps your attention on the urge.'],
        ['Reach for my phone', 'The phone pulls you into another screen, one tap from the habit.'],
        ['I do not know yet', 'Notice next time where your attention goes first.'],
      ],
    },
    flip: {
      think: 'To stop picturing it, I have to get my mind off it.',
      see: 'You do not need a better thought. You need the room: what your eyes, hands and nose can find right now.',
      more: 'Getting your mind off it is still a job for the mind, and the mind is where the urge lives. The room is not. The floor under your feet, the air on your skin, the lamp across from you are all real, and they are all here.',
    },
    deep: [
      {
        h: 'The smell of jasmine turned a chocolate craving down.',
        p: 'It had nothing to do with chocolate. Something real for the senses, here and now, was enough.',
        fact: { s: 'Study · 67 women · Kemps et al., 2012', i: [0, 1] },
        more: 'Researchers showed 67 young women photos of chocolate until they craved it, then had them smell jasmine, green apple, or plain water. Jasmine cut the craving more than the others. Nothing about the smell answered the craving. It gave the senses something real, and the craving lost ground. Earlier experiments found that tasks for the eyes and the nose turned cravings down more than a task for the ears.',
      },
      {
        h: 'Distraction looks away. Coming back arrives.',
        p: 'A new thought is still inside your head. The floor under your feet is not, and it is always there.',
        art: ['chain', { n: ['5 see', '4 feel', '3 hear', '2 smell', '1 taste'] }],
        more: 'Looking away from a picture leaves you hunting for the next thing to think about. Arriving in the room gives you something to stand on: five things you can see, four you can feel, three you can hear, two you can smell, one you can taste.',
      },
      {
        h: 'Last time your eyes got a puzzle. This time, the whole room.',
        p: 'The puzzle helps when it is at hand. The room is there even when the phone is somewhere else.',
        back: 'l42',
      },
    ],
    move: {
      h: 'Count your way back into the room.',
      l: ['5 things you can see, 4 you can feel', '3 you can hear, 2 smell, 1 taste', 'If the picture returns, come back again'],
      more: 'In SOS, 5-4-3-2-1 walks you through it, one tap for each thing you find. Coming back again and again is the skill, not a sign it failed.',
    },
    check: {
      h: 'It is 10 p.m. on the couch. The picture is running, and the phone is in reach. What do you look at first?',
      o: [
        ['The phone, to take my mind off it', 'That swaps one screen for another, one tap from the habit.'],
        ['Nothing. I close my eyes and wait', 'Closed eyes leave you alone with the picture.'],
        ['The lamp, the door, my own hand', 'Yes. Real things, named plainly, and you are back in the room.'],
        ['The picture, to see if it fades', 'Watching it feeds it. The room is where it loosens.'],
      ],
      a: 2,
    },
    scope:
      'The smell study and the senses experiments were about food cravings in young women, not porn. What carries over is the direction: something real for the senses turns a craving down, and the room around you is always there to use.',
    src: [S.kemps12, S.kemps07],
  },
};
