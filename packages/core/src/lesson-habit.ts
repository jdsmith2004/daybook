/* The lessons for alcohol, gambling and another habit (the owner, November 8 and 11, 2026: people who chose another habit saw
   fewer lessons, so they got less of the change in thinking). Three ways a lesson reaches them:

   - Words only (HABIT_OPEN 'say'): a lesson written for porn whose idea holds for any habit. habit.ts habitSay puts the
     person's habit in its words.
   - Its own parts (HABIT_OPEN with parts): the turn holds for the habit, and the hook, the study or the check was about porn.
     Those parts are written again for that habit, the way a God lesson is written again for each faith (lesson-turns.ts vo).
   - A lesson of its own (HABIT_TURNS): what one habit needs that the others do not. Alcohol and its social pull, and the
     people at home. Gambling and chasing losses, and the money kept secret. Each is on its habit's path only (steps.ts habit).

   The "Behind this" words of a lesson written for porn stay as written: habitSay never touches scope or src.
   Nothing here imports lessons.ts at load, so lessons.ts and legacy/core.js can both read it. */
import type { Habit } from './habit';
import type { Turn, VoicePart } from './lesson-turns';
import { NIGHT_OPEN, NIGHT_PORN_ONLY } from './lessons-night';

export type OtherHabit = Exclude<Habit, 'porn'>;
/** 'say' when habitSay's words are enough, or the parts written again for that habit */
type Open = Partial<Record<OtherHabit, 'say' | Part>>;
/** the parts that change, and srcAt: a source put in one place of the lesson's own list, so its other facts still point right */
export type Part = VoicePart & { srcAt?: Record<number, [string, string]> };

/** a source: [name: topic, url] */
type Src = [string, string];
const S = {
  carter: ['Carter & Tiffany (1999): a meta-analysis of cue-reactivity in addiction research, Addiction', 'https://doi.org/10.1046/j.1360-0443.1999.9433273.x'],
  limbrick: [
    'Limbrick-Oldfield and colleagues (2017): neural substrates of cue reactivity and craving in gambling disorder, Translational Psychiatry',
    'https://doi.org/10.1038/tp.2016.256',
  ],
  cooper: ['Cooper (1994): motivations for alcohol use, a four-factor model, Psychological Assessment', 'https://doi.org/10.1037/1040-3590.6.2.117'],
  blaszczynski: [
    'Blaszczynski & Nower (2002): a pathways model of problem and pathological gambling, Addiction',
    'https://doi.org/10.1046/j.1360-0443.2002.00015.x',
  ],
  brown: [
    'Brown & Schuckit (1988): changes in depression among abstinent alcoholics, Journal of Studies on Alcohol',
    'https://doi.org/10.15288/jsa.1988.49.412',
  ],
  dsm: ['American Psychiatric Association: DSM-5, gambling disorder', 'https://www.psychiatry.org/psychiatrists/practice/dsm'],
  borsari: ['Borsari & Carey (2003): descriptive and injunctive norms in college drinking, a meta-analysis', 'https://doi.org/10.15288/jsa.2003.64.331'],
  devisser: [
    'de Visser, Robinson & Bond (2016): voluntary temporary abstinence from alcohol during “Dry January”, Health Psychology',
    'https://doi.org/10.1037/hea0000297',
  ],
  powers: [
    'Powers, Vedel & Emmelkamp (2008): behavioral couples therapy for alcohol and drug use disorders, a meta-analysis',
    'https://doi.org/10.1016/j.cpr.2008.02.002',
  ],
  fehr: ['Fehr, Gelfand & Nag (2010): the road to forgiveness, a meta-analysis, Psychological Bulletin', 'https://doi.org/10.1037/a0019993'],
  zhang: ['Zhang & Clark (2020): loss-chasing in gambling behaviour, Current Opinion in Behavioral Sciences', 'https://doi.org/10.1016/j.cobeha.2019.10.006'],
  gainsbury: [
    'Gainsbury (2014): self-exclusion from gambling venues as an intervention, Journal of Gambling Studies',
    'https://doi.org/10.1007/s10899-013-9362-0',
  ],
} satisfies Record<string, Src>;

/** the lessons written for porn only (the owner, November 8, 2026): their live words name porn or sex, or rest on a porn study.
    A lesson here reaches another habit only through HABIT_OPEN. */
export const PORN_ONLY = new Set([
  'l4',
  'l11',
  'l13',
  'l16',
  'l22',
  'l24',
  'l25',
  'l33',
  'l34',
  'l36',
  'l38',
  'l42',
  'l45',
  'l46',
  'l47',
  'l48',
  'g3',
  'g4',
  'g6',
  'g7',
  'g8',
  'g9',
  'g10',
  'g11',
  'g12',
  ...NIGHT_PORN_ONLY,
]);

const ALL: Open = { alcohol: 'say', gambling: 'say', other: 'say' };

/** the lessons written for porn (lessons.ts PORN_ONLY) that another habit reads too, and how */
export const HABIT_OPEN: Record<string, Open> = {
  l13: ALL,
  l33: ALL,
  l38: ALL,
  g3: ALL,
  g8: ALL,
  g9: ALL,
  g10: ALL,
  g11: ALL,
  g12: ALL,
  ...NIGHT_OPEN,

  l34: {
    alcohol: {
      hook: {
        h: '6 p.m. You pull into the driveway. The fridge is still shut.',
        say: 'So why is the pull already here?',
        more: 'Many people know this moment. Nothing has been poured, and the wanting is already building. This lesson is about where it comes from.',
      },
      ask1: {
        h: 'When does the pull usually start for you?',
        o: [
          ['When I see or smell a drink', 'That is what most people think. The next card says it often starts earlier.'],
          ['On the way home, or at a set hour', 'Then you already know one of your signals. That is worth a lot.'],
          ['At a mood, like stressed or low', 'A mood can be a signal too. Moods come before the glass.'],
          ['I do not know yet', 'That is fair. This lesson is about how to find out.'],
        ],
      },
      flip: {
        think: 'The urge hits when I see a drink.',
        see: 'The pull is not a reaction to the drink. It is a reaction to the signal that a drink is coming.',
        more: 'Your brain has learned what comes before a drink: an hour, a place, a mood, the sound of a cap coming off. When that signal shows up, the wanting starts, before anything is poured. So the moment to act is earlier than it feels, and it is easier there.',
      },
      deep: [
        {
          h: 'Across 41 studies, the cue alone set off the craving.',
          p: 'A bottle, a bar, a smell. People felt the pull, and their bodies answered, before a single sip.',
          art: ['chain', { n: ['Home from work', 'The pull starts', 'Nothing poured yet'] }],
          fact: { s: 'Review · 41 studies · Carter & Tiffany, 1999', i: [0] },
          more: 'A review pulled together 41 studies of people with alcohol, smoking, cocaine and heroin problems. Shown the cues of their habit, they reported strong craving and their bodies reacted, before any use at all. The signal was enough to start the wanting.',
        },
        {
          h: 'The signal is where the ad starts to play.',
          p: 'The wanting was trained to answer the bell. Move at the bell, and the ad has less time to run.',
          back: 'l33',
        },
      ],
      move: {
        h: 'Find your first signal, and move at it.',
        l: ['Name it: a time, a place, a mood, a person', 'Pick one move for when it shows up', 'Do it then, while the pull is small'],
      },
      check: {
        h: '5:45 p.m. You are driving home, and the turn for the store is coming up. Nothing is in the car. What now?',
        o: [
          ['Wait and see if an urge comes', 'By the time it comes, the pull has a head start. This is the bell.'],
          ['Take the other road home, now', 'Yes. You moved at the bell, when the pull is smallest and the move is easiest.'],
          ['Stop in, but only for snacks', 'The store is the signal. Walking in lets the pull build.'],
          ['Feel bad that I want to turn', 'Wanting to turn is a trained habit, not a verdict on you. Use it as a cue to move.'],
        ],
        a: 1,
      },
      scope:
        'The review pooled cue studies across several habits, alcohol among them. It shows a pattern that holds widely: a learned signal starts the wanting, and a signal you know is one you can move at.',
      src: [S.carter],
    },
    gambling: {
      hook: {
        h: 'The game starts in ten minutes. The betting app is still shut.',
        say: 'So why is the pull already here?',
        more: 'Many people know this moment. No bet is placed, and the wanting is already building. This lesson is about where it comes from.',
      },
      ask1: {
        h: 'When does the pull usually start for you?',
        o: [
          ['When I see the odds or an ad', 'That is what most people think. The next card says it often starts earlier.'],
          ['When a game is about to start', 'Then you already know one of your signals. That is worth a lot.'],
          ['At a mood, like bored or low', 'A mood can be a signal too. Moods come before the bet.'],
          ['I do not know yet', 'That is fair. This lesson is about how to find out.'],
        ],
      },
      flip: {
        think: 'The urge hits when I see a bet.',
        see: 'The pull is not a reaction to the bet. It is a reaction to the signal that a bet is coming.',
        more: 'Your brain has learned what comes before a bet: a game, payday, a mood, the sound of an app. When that signal shows up, the wanting starts, before any bet is placed. So the moment to act is earlier than it feels, and it is easier there.',
      },
      deep: [
        {
          h: 'Gamblers in a scanner lit up at gambling pictures alone.',
          p: 'People with a gambling problem felt more craving, and their reward areas answered the cue.',
          art: ['chain', { n: ['Game about to start', 'The pull starts', 'No bet placed yet'] }],
          fact: { s: 'Brain-scan study · Limbrick-Oldfield and colleagues, 2017', i: [0] },
          more: 'In a brain-scan study, people with gambling disorder and people without it looked at gambling pictures and neutral ones. The people with the problem felt more craving at the gambling pictures, and reward areas of their brains responded more. Nothing had been bet. The cue was enough.',
        },
        {
          h: 'The signal is where the ad starts to play.',
          p: 'The wanting was trained to answer the bell. Move at the bell, and the ad has less time to run.',
          back: 'l33',
        },
      ],
      move: {
        h: 'Find your first signal, and move at it.',
        l: ['Name it: a game, payday, a mood, an app', 'Pick one move for when it shows up', 'Do it then, while the pull is small'],
      },
      check: {
        h: 'Payday, 8 p.m. You are on the couch, thumb over the betting app. Nothing is open yet. What now?',
        o: [
          ['Wait and see if an urge comes', 'By the time it comes, the pull has a head start. This is the bell.'],
          ['Phone in another room, now', 'Yes. You moved at the bell, when the pull is smallest and the move is easiest.'],
          ['Open it, just to check the odds', 'The app is the signal. Looking lets the pull build.'],
          ['Feel bad that I reached for it', 'Reaching is a trained habit, not a verdict on you. Use it as a cue to move.'],
        ],
        a: 1,
      },
      scope:
        'The brain-scan study was small, and it shows a pattern, not every person’s story. It fits a long line of research on how learned signals start wanting. Signals are learned, and they can be moved.',
      src: [S.limbrick],
    },
  },

  l36: {
    alcohol: {
      ask1: {
        h: 'Just before the pull to drink, what are you usually feeling?',
        o: [
          ['Stressed or tense', 'Then the drink is offering relief. Relief is a need you can meet other ways.'],
          ['Bored or empty', 'Then it fills a gap, and a gap can be filled with other things.'],
          ['Lonely or low', 'Then it stands in for closeness. That is worth knowing, not hiding.'],
          ['I just like the taste', 'Sometimes it is. Watch the next few. A feeling often comes first.'],
        ],
      },
      flip: {
        think: 'I drink because I like it. That is all.',
        see: 'Often it is not about the taste. It is a way out of a feeling, and the feeling is still there in the morning.',
        more: 'If it were only taste, cutting back would settle it. When a drink is a way out of stress, loneliness or a low mood, the pull keeps coming back because the feeling does. That is not a flaw in you. It is a need looking for a door, and you can give it a better one.',
      },
      deep: [
        {
          h: 'Drinking to cope went with problems. Drinking for fun less so.',
          p: 'People who drank to push a bad feeling away had more problems than people who drank as much for fun.',
          art: ['loop', { n: ['A hard feeling', 'The drink', 'Short relief', 'Feeling still there'], c: 'A way out that leads back in' }],
          fact: { s: 'Surveys · Cooper, 1994', i: [0] },
          more: 'A psychologist asked young people why they drank: to have fun, to fit in, to be social, or to cope with bad feelings. Drinking to cope stood out. It went with drinking problems over and above how much people drank. The reason behind the drink mattered.',
        },
        {
          h: 'When liking fades, what is left to chase is relief.',
          p: 'You saw the wanting grow while the enjoying stayed flat. Often the wanting is after a way out.',
          back: 'l33',
        },
      ],
      check: {
        h: 'After a hard call, your chest is tight and the pull to pour a drink comes fast. What do you reach for first?',
        o: [
          ['A walk, or a call to someone', 'Yes. You met the feeling the drink was offering to fix.'],
          ['Willpower, to push the craving down', 'The craving is not the main thing here. The tight chest is.'],
          ['A drink, since it was a hard day', 'It would ease the tightness for an hour, and the hard call would still be there.'],
          ['Nothing. Wait for the tightness to go', 'Sitting with it is hard. One small thing for it helps more.'],
        ],
        a: 0,
      },
      scope:
        'The surveys asked young people why they drink, and they show what goes together, not what causes what. What they show is that the reason behind a drink matters, and a reason is something you can plan for.',
      src: [S.cooper],
    },
    gambling: {
      ask1: {
        h: 'Just before the pull to bet, what are you usually feeling?',
        o: [
          ['Stressed or tense', 'Then the bet is offering relief. Relief is a need you can meet other ways.'],
          ['Bored or empty', 'Then it fills a gap, and a gap can be filled with other things.'],
          ['Lonely or low', 'Then it stands in for something missing. That is worth knowing, not hiding.'],
          ['The money, plain and simple', 'Sometimes it is. Watch the next few. A feeling often comes first.'],
        ],
      },
      flip: {
        think: 'It is about the money. I just want the win.',
        see: 'Often it is not about the money. It is a way out of a feeling, and the feeling is still there when the bet ends.',
        more: 'If it were only money, a big win would end it. It never does, because a bet can also be a way out of stress, boredom or a low mood, and those keep coming back. That is not a flaw in you. It is a need looking for a door, and you can give it a better one.',
      },
      deep: [
        {
          h: 'Betting to escape a feeling was a path into the hardest problems.',
          p: 'People who gamble to get away from stress or low mood are more likely to lose control than people who bet for fun.',
          art: ['loop', { n: ['A hard feeling', 'The bet', 'Short relief', 'Feeling still there'], c: 'A way out that leads back in' }],
          fact: { s: 'Model · Blaszczynski & Nower, 2002', i: [0] },
          more: 'Two researchers drew together years of work on how gambling problems grow. One path stood out: people who gamble to escape stress, low mood or loneliness. For them the bet is relief, and relief keeps calling. The reason behind the bet matters more than the bet.',
        },
        {
          h: 'When liking fades, what is left to chase is relief.',
          p: 'You saw the wanting grow while the enjoying stayed flat. Often the wanting is after a way out.',
          back: 'l33',
        },
      ],
      check: {
        h: 'After a hard call, your chest is tight and the pull to place a bet comes fast. What do you reach for first?',
        o: [
          ['A walk, or a call to someone', 'Yes. You met the feeling the bet was offering to fix.'],
          ['Willpower, to push the wanting down', 'The wanting is not the main thing here. The tight chest is.'],
          ['A bet, since it was a hard day', 'It would ease the tightness for a few minutes, and the hard call would still be there.'],
          ['Nothing. Wait for the tightness to go', 'Sitting with it is hard. One small thing for it helps more.'],
        ],
        a: 0,
      },
      scope:
        'The pathways model draws together many studies of how gambling problems grow, and escape is one path among several. It points one hopeful way: the reason behind a bet can be named, and a reason is something you can plan for.',
      src: [S.blaszczynski],
    },
  },

  l46: {
    alcohol: {
      deep: [
        {
          n: '26',
          h: 'studies: people who quit smoking felt better than those who kept on.',
          p: 'Less anxiety, depression and stress, and more good mood. Even for people who had smoked to cope.',
          fact: { s: 'Review · 26 studies · Taylor and colleagues, 2014', i: [0] },
          more: 'A large review gathered 26 studies of adults who quit smoking and adults who kept smoking, measured at least six weeks after quitting. People who quit had less depression, anxiety and stress, and better mood, than people who kept going. It held for people who said they smoked to cope. The habit was not what held the mood up.',
        },
        {
          h: 'Low mood often lifts within weeks of the last drink.',
          p: 'In men treated for drinking, high depression scores fell from about 4 in 10 to under 1 in 10 in a month.',
          fact: { s: 'Study · 191 men · Brown & Schuckit, 1988', i: [1] },
          more: 'Researchers followed 191 men in treatment for drinking. In their first week without alcohol, about 4 in 10 scored high on a depression scale. Four weeks later, fewer than 1 in 10 did. Much of the low mood was the drinking, and it lifted as the weeks went on. The first days off heavy drinking can be dangerous, which is why a doctor helps with them.',
        },
        {
          h: 'Nobody can give you a date, and uneven is normal.',
          p: 'Building one daily habit took people from 18 to 254 days. One missed day barely changed it.',
          fact: { s: 'Study · 96 volunteers · Lally and colleagues, 2010', i: [2] },
          more: 'In a study of 96 people building one new daily habit, the time it took ranged from 18 to 254 days, and one missed day barely changed the result. That is why anyone who promises you a date is guessing. Most people notice the flat stretch easing over weeks: fewer pulls, weaker pulls, and more good days between them.',
        },
      ],
      move: {
        h: 'On a flat day, do the small things anyway.',
        l: ['Name it: “This is a flat day. It passes.”', 'Sleep, real food, a walk outside', 'Text one person, about anything'],
        more: 'You do not have to feel good to be getting better. If you drank every day, or a lot at a time, a doctor should help with the first days, since stopping all at once can be dangerous. If the low stays for weeks or turns dark, tell a doctor. Depression is common and very treatable.',
      },
      check: {
        h: 'Day 12, 9 p.m. Everything is gray. A thought says, “One drink would make me feel normal.” What fits?',
        o: [
          ['It might. One drink, to feel normal', 'The habit borrowed that normal. Going back takes out a new loan.'],
          ['This is a flat stretch, and it eases', 'Yes. You read it for what it is, and you keep going. That is getting free, from inside.'],
          ['Stopping must have damaged something', 'Much of the low mood came from the drinking, and it lifts over weeks.'],
          ['Push through and feel nothing about it', 'Feelings are fine to have. A walk, sleep and one person help a gray day.'],
        ],
        a: 1,
      },
      scope:
        'The mood review was about people who quit smoking, and the depression study followed men in treatment for drinking. Together they point one way: a flat stretch is common, much of it is the drink wearing off, and people tend to feel better on the far side of it.',
      srcAt: { 1: S.brown },
    },
    gambling: {
      deep: [
        {
          n: '26',
          h: 'studies: people who quit smoking felt better than those who kept on.',
          p: 'Less anxiety, depression and stress, and more good mood. Even for people who had smoked to cope.',
          fact: { s: 'Review · 26 studies · Taylor and colleagues, 2014', i: [0] },
          more: 'A large review gathered 26 studies of adults who quit smoking and adults who kept smoking, measured at least six weeks after quitting. People who quit had less depression, anxiety and stress, and better mood, than people who kept going. It held for people who said they smoked to cope. The habit was not what held the mood up.',
        },
        {
          h: 'Restless when you stop is so common it is in the definition.',
          p: 'Doctors list it as a sign of the habit, not of damage. It eases as the habit loosens.',
          fact: { s: 'Manual · DSM-5, gambling disorder', i: [1] },
          more: 'The main US manual for diagnosis lists being restless or irritable when trying to cut down on gambling as one of the signs of gambling disorder. It is part of the habit letting go, not harm done by stopping. Like the urges themselves, it fades with time.',
        },
        {
          h: 'Nobody can give you a date, and uneven is normal.',
          p: 'Building one daily habit took people from 18 to 254 days. One missed day barely changed it.',
          fact: { s: 'Study · 96 volunteers · Lally and colleagues, 2010', i: [2] },
          more: 'In a study of 96 people building one new daily habit, the time it took ranged from 18 to 254 days, and one missed day barely changed the result. That is why anyone who promises you a date is guessing. Most people notice the flat stretch easing over weeks: fewer pulls, weaker pulls, and more good days between them.',
        },
      ],
      check: {
        h: 'Day 12, 9 p.m. Everything is gray. A thought says, “One small bet would make me feel normal.” What fits?',
        o: [
          ['It might. One bet, to feel normal', 'The habit borrowed that normal. Going back takes out a new loan.'],
          ['This is a flat stretch, and it eases', 'Yes. You read it for what it is, and you keep going. That is getting free, from inside.'],
          ['Stopping must have damaged something', 'Restless days are a known part of stopping, not damage. They pass.'],
          ['Push through and feel nothing about it', 'Feelings are fine to have. A walk, sleep and one person help a gray day.'],
        ],
        a: 1,
      },
      scope:
        'The mood review was about people who quit smoking, and the manual describes what doctors look for in gambling disorder. Together they point one way: a restless, flat stretch is common, it is not damage, and people tend to feel better on the far side of it.',
      srcAt: { 1: S.dsm },
    },
  },

  l25: {
    alcohol: {
      move: {
        h: 'Borrow one step, and help in a small way.',
        l: ['Tell one safe person the truth', 'Answer a friend who is struggling', 'Share what helped, not your whole story'],
        more: 'You do not have to join anything or guide anyone. Alcoholics Anonymous meets in most towns and online, and at a first meeting you can just listen.',
      },
    },
    gambling: {
      move: {
        h: 'Borrow one step, and help in a small way.',
        l: ['Tell one safe person the truth', 'Answer a friend who is struggling', 'Share what helped, not your whole story'],
        more: 'You do not have to join anything or guide anyone. Gamblers Anonymous adapts the steps, and at a first meeting you can just listen.',
      },
    },
    other: {
      move: {
        h: 'Borrow one step, and help in a small way.',
        l: ['Tell one safe person the truth', 'Answer a friend who is struggling', 'Share what helped, not your whole story'],
        more: 'You do not have to join anything or guide anyone. Groups for many habits adapt the steps, and at a first meeting you can just listen.',
      },
    },
  },
};

/** the lessons of one habit only, with the unit each belongs to (lessons.ts LUNITS) */
export const HABIT_ONLY: Record<string, { h: OtherHabit; u: number }> = {
  l50: { h: 'alcohol', u: 2 },
  l51: { h: 'alcohol', u: 1 },
  l52: { h: 'gambling', u: 4 },
  l53: { h: 'gambling', u: 1 },
};

export const HABIT_TURNS: Record<string, Turn> = {
  /* alcohol, Close the door: the table, the round and the question */
  l50: {
    id: 'l50',
    title: 'The drink in every hand',
    tag: 'Most people care far less about your glass than you fear.',
    ic: 'glass',
    ask: 'How do I stay free when everyone around me is drinking?',
    key: 'People care far less about your glass than you fear. Pick your drink before you go, and say it plainly.',
    np: 'What I will order, and the words I will say when someone asks',
    hook: {
      h: 'Friday, after work. Everyone is ordering a round.',
      say: 'Will you be the odd one out?',
      more: 'For many people the hardest part of not drinking is not the craving. It is the table, the toast, the question. This lesson is about what is going on at that table.',
    },
    ask1: {
      h: 'When you picture saying no to a drink with friends, what do you fear most?',
      o: [
        ['That they will think I am boring', 'That fear is common. The next card looks at how often it comes true.'],
        ['That they will ask why', 'A question is easy to answer once your words are ready.'],
        ['That I will not have fun', 'Many people expect that. Watch what the evening is made of besides the glass.'],
        ['That I will give in when they push', 'Then plan the push before you go. This lesson ends with how.'],
      ],
    },
    flip: {
      think: 'Everyone will notice, and think less of me.',
      see: 'Most people are watching their own glass, not yours. A plain no gets respect far more often than questions.',
      more: 'The spotlight feels bright from the inside. People overestimate how much others drink and how much they care, and the pressure lives mostly in that guess. You are not asking anyone to stop. You are holding something else.',
    },
    deep: [
      {
        h: 'Students guessed their friends drank more than they did.',
        p: 'Across many studies, people expected others to drink more than they did.',
        art: ['dots', {}],
        fact: { s: 'Review · Borsari & Carey, 2003', i: [0] },
        more: 'A review of studies with college students found that people often believe others drink more, and approve of heavy drinking more, than they do. Those wrong guesses pushed people to drink more to fit in. When people learned the true numbers, many drank less.',
      },
      {
        h: 'After a month off, people got better at saying no.',
        p: 'They felt surer turning down a drink, and six months on, many were drinking less.',
        fact: { s: 'Study · 857 adults · de Visser and colleagues, 2016', i: [1] },
        more: 'Researchers followed people who took a month off alcohol. Afterward they felt more able to turn down a drink in social settings, and six months later many were drinking less than before, even some who had not made the whole month. Saying no is a skill, and it grows with use.',
      },
      {
        h: 'Plan the push before it comes.',
        p: 'An if-then plan made at home answers the question the table will ask.',
        back: 'l9',
      },
    ],
    mine: { h: 'Look at what has set your urges off.', k: 'trigger' },
    move: {
      h: 'Pick your drink and your words before you go.',
      l: ['Choose your drink now: soda, tea, alcohol-free', 'Say it plainly: “I am not drinking.”', 'Hold a glass. Leave early if you need to'],
      more: 'You do not owe anyone a reason. “I am not drinking tonight” is a full answer. If someone keeps pushing, that says something about their glass, not yours.',
    },
    check: {
      h: 'A friend hands you a beer and says, “Come on, one will not hurt.” What do you say?',
      o: [
        ['Take it, so the night is not awkward', 'The awkward moment lasts a second. The beer starts a chain you know.'],
        ['“No thanks, I am set with this one.”', 'Yes. Plain, warm and done. Most people move on right away.'],
        ['A long story about why I stopped', 'You do not owe a story. A short no ends the question faster.'],
        ['Leave without a word', 'Leaving is fine when you need it. A short no often lets you stay.'],
      ],
      a: 1,
    },
    scope:
      'The college review measured what students guessed about their friends, and the month-off study followed people who chose to take part. They point one hopeful way: the pressure is often smaller than it feels, and saying no gets easier every time you do it.',
    src: [S.borsari, S.devisser],
  },

  /* alcohol, Make it right: the people at home */
  l51: {
    id: 'l51',
    title: 'The people around the glass',
    tag: 'Repair comes from showing up, week after week.',
    ic: 'heart',
    ask: 'My drinking hurt people. How do I make it right?',
    key: 'Drinking touched more than you. The repair is showing up sober, again and again, more than one big speech.',
    np: 'One person I want to show up for, and how',
    hook: {
      h: 'You missed the game, or the dinner, or the call. Again.',
      say: 'Does it only cost you?',
      more: 'Many people tell themselves drinking only hurts the one who drinks. The people at home usually know otherwise. This lesson is about what makes things right with them.',
    },
    ask1: {
      h: 'Who has paid the most for your drinking, besides you?',
      o: [
        ['My partner', 'Then that is where steady small things will count most.'],
        ['My kids', 'Children notice what you do far more than what you promise.'],
        ['A friend or family member', 'Then one honest word to them could start something.'],
        ['No one, really', 'Maybe. Ask one person close to you, and listen to the answer.'],
      ],
    },
    flip: {
      think: 'I will make it right with one big apology.',
      see: 'An apology opens the door. What walks through it is showing up sober, week after week, where they can see it.',
      more: 'A big speech is about how sorry you feel. Trust comes back through what people watch you do: the call you answer, the night you are home, the promise you keep. The apology matters. The weeks after it matter more.',
    },
    deep: [
      {
        h: 'Working on it as a couple helped the drinking and the home.',
        p: 'In a review of 12 trials, couples therapy beat therapy alone, for less drinking and happier homes.',
        fact: { s: 'Review · 12 trials · Powers, Vedel & Emmelkamp, 2008', i: [0] },
        more: 'A review gathered 12 trials of behavioral couples therapy for alcohol and drug problems, where the partner takes part. Compared with treatment for the drinker alone, it led to less drinking and happier relationships. The people around the habit are part of how it heals.',
      },
      {
        h: 'A sincere apology was one of the strongest roads to forgiveness.',
        p: 'Pooled across 175 studies, saying sorry and meaning it went with being forgiven.',
        fact: { s: 'Review · 175 studies · Fehr, Gelfand & Nag, 2010', i: [1] },
        more: 'A review pooled 175 studies of forgiveness between people. Among the things that went most with being forgiven was a sincere apology. Sorry is not the whole repair, and it is a strong start.',
      },
      {
        h: 'A secret is heavy. So is the damage nobody names.',
        p: 'Saying it plainly to the person it touched takes some of the weight off you both.',
        back: 'l7',
      },
    ],
    mine: { h: 'Look at what you have already done.', k: 'acted' },
    move: {
      h: 'Make one repair you can keep.',
      l: ['Say sorry once, plainly, with no excuse', 'Pick one thing to show up for this week', 'Keep it, and let them see it'],
      more: 'Leave out any repair that would hurt someone, or that is only for your own relief. If drinking led to danger at home, a counselor can help you do this safely.',
    },
    check: {
      h: 'You apologized last week. Your partner still seems guarded. What fits?',
      o: [
        ['Apologize again, bigger this time', 'Another speech asks them to do the work. Steady days answer it better.'],
        ['Keep showing up, and give it time', 'Yes. Trust follows what they see, week after week.'],
        ['Feel hurt that it did not work', 'The apology worked. It opened the door. Time is the rest.'],
        ['Tell them they should be over it', 'Healing runs on their clock, not yours.'],
      ],
      a: 1,
    },
    scope:
      'The couples review pooled trials of a therapy that brings the partner in, and the forgiveness review covered many kinds of hurt between people. Together they point one sure way: repair is real, it takes time, and showing up is how it grows.',
    src: [S.powers, S.fehr],
  },

  /* gambling, Know your pattern: chasing losses */
  l52: {
    id: 'l52',
    title: 'Chasing it back',
    tag: 'The money you lost is gone. The next bet is a new bet.',
    ic: 'dice',
    ask: 'Why do I keep betting to win back what I lost?',
    key: 'The money you lost is gone, and no bet brings it back. Every chase is a new bet, at the same odds.',
    np: 'What I will do the next time I feel I have to win it back',
    hook: {
      h: 'You are down $200. One more bet would make it right.',
      say: 'Is that a plan, or the habit talking?',
      more: 'Almost everyone who struggles with gambling knows this moment. The loss feels like a hole, and the next bet feels like the way out of it. This lesson is about why that feeling is so convincing.',
    },
    ask1: {
      h: 'When you were down, what did you tell yourself you would do with a win?',
      o: [
        ['Stop, once I was even', 'Most people say that. Watch how often even was where they stopped.'],
        ['Pay off what I owed', 'The wish is real. A bet is the most expensive way to try.'],
        ['Win big enough to make it worth it', 'Then the goal kept moving. That is how chasing works.'],
        ['I did not think, I just bet', 'That is honest. The next cards are about that moment.'],
      ],
    },
    flip: {
      think: 'If I keep going, I can win it back.',
      see: 'The money is already gone. Each bet to chase it is a new bet, at the same odds, and the hole grows.',
      more: 'A loss feels like a debt the next bet can pay off. The game does not know you are down. Every bet starts fresh, with the house edge built in. Chasing turns one lost evening into many, and stopping is the move that keeps the rest.',
    },
    deep: [
      {
        h: 'Chasing is so tied to the problem that it is in the definition.',
        p: 'Doctors list going back to get even as one of the signs of gambling disorder.',
        fact: { s: 'Manual · DSM-5, gambling disorder', i: [0] },
        more: 'The main US manual for diagnosis lists chasing as a sign of gambling disorder: after losing money, often coming back another day to get even. It is one of the most common signs, and naming it is the first step to catching it.',
      },
      {
        h: 'After a loss, people bet more, and faster.',
        p: 'In the lab and in real betting, losses pushed stakes up, and that rush is where control slipped.',
        art: ['wave', {}],
        fact: { s: 'Review · Zhang & Clark, 2020', i: [1] },
        more: 'A review of research on loss chasing found that after losses, people tend to bet more, bet faster and take bigger risks, and that this is stronger in people with gambling problems. The pull to get even is a known pattern of the brain, not a sign that a win is coming.',
      },
      {
        h: '“I will win it back” is a permission thought.',
        p: 'It sounds like a plan. It is the habit handing you a reason.',
        back: 'l18',
      },
    ],
    mine: { h: 'Your busiest hours show when the chase is likely.', k: 'hour' },
    move: {
      h: 'Call the loss what it is, and stop the chase.',
      l: ['Say it: “That money is gone.”', 'Close the app, and leave the place', 'Tell one person the true number tonight'],
      more: 'A limit on deposits, a block on your phone and someone else holding the cards all make the next chase take longer than the pull lasts. If debt is weighing on you, the gambling helpline in Get help can point you to free debt advice.',
    },
    check: {
      h: 'You lost $150 tonight. A thought says, “One more and you are even.” What gives you the best chance?',
      o: [
        ['One more, then stop for good', 'That is the chase. Even is a line that keeps moving.'],
        ['Close it, and call the $150 gone', 'Yes. You kept tonight a $150 night, not a $500 one.'],
        ['Switch to a smaller bet', 'A smaller chase is still a chase. The odds did not change.'],
        ['Bet bigger, to get it back faster', 'Bigger bets are how a hole gets deeper fastest.'],
      ],
      a: 1,
    },
    scope:
      'The manual describes what doctors look for, and the review gathered lab and real-world studies of how people bet after losing. They point one sure way: the pull to win it back is a known pattern, and it can be caught and stopped.',
    src: [S.dsm, S.zhang],
  },

  /* gambling, Make it right: the money kept secret */
  l53: {
    id: 'l53',
    title: 'The money and the truth',
    tag: 'Hidden debt grows in the dark.',
    ic: 'shield',
    ask: 'Do I have to tell anyone about the money?',
    key: 'Hidden debt grows in the dark. Telling one person and sharing control of the money is how it stops growing.',
    np: 'The one person I will tell the true number to, and when',
    hook: {
      h: 'There is a number only you know. It keeps getting bigger.',
      say: 'Can you fix it before anyone finds out?',
      more: 'Many people with gambling debts plan to win it back or pay it down quietly, and tell no one. This lesson is about why the secret is part of what keeps the debt growing.',
    },
    ask1: {
      h: 'If the people closest to you knew the whole number, what do you think would happen?',
      o: [
        ['They would leave', 'That fear is heavy. Many families stay, and telling them is where help starts.'],
        ['They would be angry, then help', 'Anger and help often come together. Both can be lived through.'],
        ['They already suspect something', 'Then the secret may be costing more than the truth would.'],
        ['I do not know', 'That is honest. Hold it for the next cards.'],
      ],
    },
    flip: {
      think: 'I have to fix the money myself, before anyone knows.',
      see: 'Fixing it alone is how it grew. The truth, told to one person, is what lets the hole stop getting deeper.',
      more: 'A secret debt needs more secrets, and more bets to cover it. Lying to hide gambling is one of the signs doctors look for, because hiding is how the habit protects itself. Telling one person takes the hiding away, and with it much of the pull.',
    },
    deep: [
      {
        h: 'Doctors list hiding the gambling as a sign of the problem.',
        p: 'And leaning on others to cover the money. Both are the habit keeping itself safe.',
        fact: { s: 'Manual · DSM-5, gambling disorder', i: [0] },
        more: 'The main US manual for diagnosis lists lying to hide how much a person gambles, and relying on others for money to cover gambling losses, among the signs of gambling disorder. The secret is not a side effect. It is one of the ways the habit keeps going.',
      },
      {
        h: 'People who barred themselves from betting gambled less.',
        p: 'In studies of self-exclusion, many who signed up bet less and felt more in control.',
        art: ['shield', {}],
        fact: { s: 'Review · Gainsbury, 2014', i: [1] },
        more: 'A review of studies on self-exclusion, where people ask casinos or betting sites to bar them, found that many who took part gambled less, felt more in control and had fewer problems afterward. A wall around the money works better than willpower at the edge of it.',
      },
      {
        h: 'A secret is heavy, and money makes it heavier.',
        p: 'Telling one person is the same step you already know, with a number in it.',
        back: 'l7',
      },
    ],
    mine: { h: 'Look at what you have already done.', k: 'acted' },
    move: {
      h: 'Tell one person the true number, and share the keys.',
      l: ['Tell one person the full total', 'Let them hold a card or see the account', 'Call a free debt adviser this week'],
      more: 'Leave out anyone who would use it to hurt you. The gambling helpline in Get help can point you to free debt advice, and they hear this every day.',
    },
    check: {
      h: 'Your partner asks why money is tight this month. What gives you the best chance?',
      o: [
        ['Blame bills, and fix it next month', 'That buys a month, and the debt keeps the dark it grows in.'],
        ['Tell the true number, and ask for help', 'Yes. It is the hardest sentence, and it starts the way out.'],
        ['Tell half, the part that is easy', 'Half the truth keeps half the secret, and the pull stays.'],
        ['Win it back first, then tell them', 'That plan is how most of the debt was built.'],
      ],
      a: 1,
    },
    scope:
      'The manual describes what doctors look for, and the self-exclusion review gathered studies of people who chose to bar themselves, so they may have been ready to change. Together they point one hopeful way: the truth and a wall around the money help people get free.',
    src: [S.dsm, S.gainsbury],
  },
};

/** a lesson written for porn is open to this habit (porn reads every lesson written for it) */
export const habitOpen = (id: string, h: Habit): boolean => h === 'porn' || !!(HABIT_OPEN[id] && HABIT_OPEN[id][h]);
/** the parts written again for this habit, when there are any */
export const habitPart = (id: string, h: Habit): Part | null => {
  if (h === 'porn') return null;
  const o = HABIT_OPEN[id] && HABIT_OPEN[id][h];
  return o && o !== 'say' ? o : null;
};
/** a lesson of one habit only is for this person */
export const habitOwn = (id: string, h: Habit): boolean => !HABIT_ONLY[id] || HABIT_ONLY[id].h === h;
