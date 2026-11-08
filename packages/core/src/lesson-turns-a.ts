/* Turned lessons, batch A (the format and the pilot are in lesson-turns.ts). */
import type { Turn } from './lesson-turns';

type Src = [string, string];
const S = {
  grubbs: [
    'Grubbs, Perry, Wilt & Reid (2019): pornography problems due to moral incongruence, an integrative model with a systematic review and meta-analysis, Archives of Sexual Behavior',
    'https://pubmed.ncbi.nlm.nih.gov/30076491/',
  ],
  icd11: ['WHO ICD-11: 6C72 Compulsive sexual behaviour disorder', 'https://icd.who.int/browse/2024-01/mms/en#1630268048'],
  pecina: [
    'Peciña, Cagniard, Berridge, Aldridge & Zhuang (2003): hyperdopaminergic mutant mice have higher “wanting” but not “liking” for sweet rewards, Journal of Neuroscience',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6740586/',
  ],
  berridge: [
    'Berridge & Robinson (2016): liking, wanting, and the incentive-sensitization theory of addiction, American Psychologist',
    'https://doi.org/10.1037/amp0000059',
  ],
  gola: [
    'Gola, Wordecha, Sescousse and colleagues (2017): can pornography be addictive? An fMRI study of men seeking treatment for problematic pornography use, Neuropsychopharmacology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5561346',
  ],
  hofmann: [
    'Hofmann, Baumeister, Förster & Vohs (2012): everyday temptations, an experience sampling study of desire, conflict, and self-control, Journal of Personality and Social Psychology',
    'https://experts.umn.edu/en/publications/everyday-temptations-an-experience-sampling-study-of-desire-confl/',
  ],
  milyavskaya: [
    'Milyavskaya & Inzlicht (2017): what is so great about self-control? Social Psychological and Personality Science',
    'https://bps.org.uk/research-digest/goal-attainment-seems-be-about-avoiding-temptation-not-exercising-willpower',
  ],
  taylor: [
    'Taylor, McNeill, Girling, Farley, Lindson-Hawley & Aveyard (2014): change in mental health after smoking cessation, systematic review and meta-analysis, BMJ',
    'https://pubmed.ncbi.nlm.nih.gov/24524926/',
  ],
  fernandez: [
    'Fernandez and colleagues (2023): a week without pornography, a randomized trial with students, Archives of Sexual Behavior',
    'https://link.springer.com/article/10.1007/s10508-022-02519-w',
  ],
  lally: ['Lally, van Jaarsveld, Potts & Wardle (2010): how are habits formed, European Journal of Social Psychology', 'https://doi.org/10.1002/ejsp.674'],
  robins: ['Hall & Weier (2017): Lee Robins’ studies of heroin use among US Vietnam veterans, Addiction', 'https://pubmed.ncbi.nlm.nih.gov/27650054/'],
  wood: [
    'Wood, Tam & Guerrero Witt (2005): changing circumstances, disrupting habits, Journal of Personality and Social Psychology',
    'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Tam_.GuerreroWitt.2005_Changing_circumstances_disrupting_habits.pdf',
  ],
  gollwitzer: [
    'Gollwitzer & Sheeran (2006): implementation intentions and goal achievement, a meta-analysis of effects and processes, Advances in Experimental Social Psychology',
    'https://doi.org/10.1016/S0065-2601(06)38002-1',
  ],
  webb: [
    'Webb & Sheeran (2007): how do implementation intentions promote goal attainment? Journal of Experimental Social Psychology',
    'https://doi.org/10.1016/j.jesp.2006.02.001',
  ],
  nehemiah: ['Nehemiah 4:9, the wall rebuilt under threat', 'https://www.biblegateway.com/passage/?search=Nehemiah+4%3A9&version=ESV'],
  james: ['James 2:14 to 26, faith and works', 'https://www.biblegateway.com/passage/?search=James+2%3A14-26&version=ESV'],
  gujar: [
    'Gujar, Yoo, Hu & Walker (2011): sleep deprivation amplifies reactivity of brain reward networks, Journal of Neuroscience',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3086142',
  ],
  butler: [
    'Butler, Pereyra, Draper, Leonhardt & Skinner (2018): pornography use and loneliness, a bidirectional recursive model and pilot investigation, Journal of Sex & Marital Therapy',
    'https://doi.org/10.1080/0092623X.2017.1321601',
  ],
  dingle: [
    'Dingle, Stark, Cruwys & Best (2015): breaking good, breaking ties with social groups may be good for recovery from substance misuse, British Journal of Social Psychology',
    'https://shura.shu.ac.uk/9437/',
  ],
  patrick: [
    'Patrick & Hagtvedt (2012): when empowered refusal motivates goal-directed behavior, Journal of Consumer Research',
    'https://doi.org/10.1086/663212',
  ],
  pronin: [
    'Pronin, Olivola & Kennedy (2008): doing unto future selves as you would do unto others, Personality and Social Psychology Bulletin',
    'https://collaborate.princeton.edu/en/publications/doing-unto-future-selves-as-you-would-do-unto-others-psychologica/',
  ],
  hershfield: [
    'Hershfield and colleagues (2011): increasing saving behavior through age-progressed renderings of the future self, Journal of Marketing Research',
    'https://clear.dol.gov/study/increasing-saving-behavior-through-age-progressed-renderings-future-self-hershfield-et-al-2011',
  ],
} satisfies Record<string, Src>;

export const TURNS_A: Record<string, Turn> = {
  l22: {
    id: 'l22',
    title: 'When values and habits clash',
    ic: 'flag',
    ask: 'If it hurts this much, does that mean I am out of control?',
    key: 'Not by itself. The hurt can measure how much you care about what you hold. Name which ache is loudest.',
    np: 'What bothers me most, in one sentence',
    hook: {
      h: 'Say you slipped once this month, and the guilt will not let up.',
      say: 'Does a hurt this big mean you are out of control?',
      more: 'Many people read their guilt like a gauge: the worse it feels, the worse the habit must be. This lesson is about what the gauge is measuring.',
    },
    ask1: {
      h: 'When you feel worst about it, what is the hurt mostly about?',
      o: [
        ['I cannot stop when I want to', 'That is the control part. A plan and skills work on it.'],
        ['It goes against what I believe', 'That is the values part. It hurts because you hold something dear.'],
        ['Both, and I cannot tell them apart', 'Most people feel both. Pulling them apart is what this lesson does.'],
        ['I do not know yet', 'That is honest. The next card may help you tell.'],
      ],
    },
    flip: {
      think: 'The worse I feel about it, the more out of control I must be.',
      see: 'The hurt can measure how much you care about what you hold, not how little control you have.',
      more: 'Two people can use the same amount and hurt very differently. Often the one who hurts more is the one whose use clashes with what they believe. That pain is not a verdict on your control. It points at something you care about, and it deserves its own kind of care.',
    },
    deep: [
      {
        h: 'Researchers pooled the studies of people who felt hooked.',
        p: 'How much they used mattered. So did a second thing, again and again: how far it went against what they held.',
        fact: { s: 'Review · Grubbs, Perry, Wilt & Reid, 2019', i: [0] },
        more: 'A research team gathered the studies on why people come to feel their porn use is a problem. How much people used was part of it. Another part showed up study after study: the gap between what people believed and what they did. The researchers call it moral incongruence. It means the hurt often carries a message about your values, and that message is worth hearing.',
      },
      {
        h: 'Two aches, and each has its own kind of help.',
        p: 'Losing control needs skills and a plan. A clash with what you hold needs a calm, honest look.',
        fact: { s: 'Guidance · WHO ICD-11', i: [1] },
        more: 'The World Health Organization draws the same line: distress that comes only from moral disapproval is not enough, by itself, for its diagnosis of compulsive sexual behavior. That does not make the pain small. It means it is a different pain, and it needs a different kind of help. Many people have some of each, and both are real.',
      },
      {
        h: 'The part of you that hurts is the part that wants out.',
        p: 'Mixed feelings are normal. The ache is the half that wants to change, and it is on your side.',
        back: 'l1',
      },
    ],
    move: {
      h: 'Name the ache that is loudest tonight.',
      l: ['Cannot stop: lean on your plan and skills', 'Against what I hold: talk it through calmly', 'Both: work on each, one at a time'],
      more: 'For the values side, pick someone who will listen without pushing you toward an answer: a faith leader, a counselor, or a friend who holds what you hold. If both are loud, that is common, and each gets its own help.',
    },
    check: {
      h: 'Two days after a rare slip, the guilt is crushing. A voice says, “Pain this big means I am out of control.” What fits?',
      o: [
        ['Agree, and clamp down harder on myself', 'That treats a values ache as a control problem. It adds pain and fixes neither.'],
        ['Ask what the hurt is about', 'Yes. A rare slip and a big hurt point at what you hold. That deserves a calm look.'],
        ['Push the guilt down so I can move on', 'The guilt is pointing at something you care about. Burying it keeps it loud.'],
        ['Decide I am hooked worse than I thought', 'One slip in weeks is not lost control. The size of the hurt is about caring.'],
      ],
      a: 1,
    },
    scope:
      'The review pooled studies of adults who use porn, and it shows a pattern across many people, not the reason for any one person’s pain. Losing control is real too, and many people feel both. Each one has help that works.',
    src: [S.grubbs, S.icd11],
  },

  l33: {
    id: 'l33',
    title: 'Wanting is not liking',
    ic: 'bolt',
    ask: 'Why is the pull so strong when porn does not even feel that good anymore?',
    key: 'A strong pull is an ad your brain trained, not a review. For the review, recall how it felt ten minutes after.',
    np: 'How it felt ten minutes after, compared with how much I wanted it before',
    hook: {
      h: 'You wanted it badly. Ten minutes after, you felt flat.',
      say: 'If it was not that good, why did it pull so hard?',
      more: 'Many people notice this. The pull before is huge, and what comes after is small. This lesson is about why those two do not match.',
    },
    ask1: {
      h: 'Think of the last time the pull was strong. How did it feel ten minutes after?',
      o: [
        ['About as good as it promised', 'Then you have a fair reading. Watch whether it holds next time.'],
        ['Smaller than it promised', 'Many people notice that gap. The next card is about where it comes from.'],
        ['Flat, or worse than before', 'Keep that. It is the review the pull never shows you.'],
        ['I do not know yet', 'That is fair. Next time, notice the ten minutes after.'],
      ],
    },
    flip: {
      think: 'If I want it this badly, it must be worth it.',
      see: 'How hard it pulls is not how good it is. The pull is an ad your brain trained, not a review.',
      more: 'The brain runs wanting and liking on different systems. Repeat a habit enough and the wanting can grow louder while the liking stays the same, or fades. So the pull tells you how well it was trained, not how good it will be.',
    },
    deep: [
      {
        h: 'Mice with more dopamine wanted sugar more, and liked it no more.',
        p: 'They worked harder to get it. Their faces showed the same pleasure at the taste as other mice.',
        art: ['want', {}],
        fact: { s: 'Study in mice · Peciña and colleagues, 2003', i: [0] },
        more: 'Researchers worked with mice that had more dopamine in the brain than usual. The mice learned faster to work for sweet rewards and pushed harder to get them. When the researchers watched the small face reactions that show pleasure at a sweet taste, they were the same as in ordinary mice. The wanting went up. The liking did not move. That was in mice, and the same split shows up across research in people.',
      },
      {
        h: 'In people too, repetition and cues grow the wanting.',
        p: 'The liking does not grow with it. The pull was learned, and each urge you outlast gives it less practice.',
        fact: { s: 'Review · Berridge & Robinson, 2016', i: [1] },
        more: 'Kent Berridge and Terry Robinson have studied this for decades. Wanting runs on large brain systems that include dopamine, and repetition and cues can make it much stronger. Liking runs on smaller systems and does not grow along with it. That is how a pull can feel huge while the pleasure stays small.',
      },
      {
        h: 'A tall wave says nothing about what is on the shore.',
        p: 'An urge rises, peaks and passes. Its height is the wanting, not a promise of how good it will feel.',
        back: 'l2',
      },
    ],
    mine: { h: 'Each pull you outlast gets less practice.', k: 'rode' },
    move: {
      h: 'When the pull is loud, ask for the review.',
      l: ['Name it: “This is wanting, not liking.”', 'Recall how it felt ten minutes after', 'Give the pull ten minutes to fall'],
    },
    check: {
      h: '11 p.m. The pull is huge. A thought says, “You want it this much, so it must be amazing.” Last time felt flat. What now?',
      o: [
        ['Believe it. This time will be different', 'The pull promised that last time too. The review was flat.'],
        ['Call it an ad, and wait it out', 'Yes. You read the pull for what it is, and it gets nothing to practice on.'],
        ['Argue with the thought until it stops', 'Arguing keeps your eyes on it. A name is quicker: this is wanting.'],
        ['Give in once, to see if it is still good', 'A test feeds the wanting, and you already have the answer.'],
      ],
      a: 1,
    },
    scope:
      'The sugar study was in mice, and the split between wanting and liking comes from decades of research in animals and people, not studies of porn. It does not say porn never feels good. It says a strong pull is not a measure of how good something is, and a learned pull can be retrained.',
    src: [S.pecina, S.berridge],
  },

  l34: {
    id: 'l34',
    title: 'The cue comes first',
    ic: 'phone',
    ask: 'Why does the urge start before I have even seen anything?',
    key: 'The pull starts at the signal, before anything is on the screen. Learn your first signal, and move at it.',
    np: 'The first signal I notice, before the urge',
    hook: {
      h: 'It is 11 p.m. You are in bed, phone in hand, screen still blank.',
      say: 'So why is the pull already here?',
      more: 'Many people know this scene. Nothing has happened, and the urge is already building. This lesson is about where it comes from.',
    },
    ask1: {
      h: 'When does the pull usually start for you?',
      o: [
        ['When I see something on the screen', 'That is what most people think. The next card says it often starts earlier.'],
        ['When I get into bed with my phone', 'Then you already know one of your signals. That is worth a lot.'],
        ['At a mood, like bored or low', 'A mood can be a signal too. Moods come before screens.'],
        ['I do not know yet', 'That is fair. This lesson is about how to find out.'],
      ],
    },
    flip: {
      think: 'The urge hits when I see something.',
      see: 'The pull is not a reaction to the picture. It is a reaction to the signal that a picture is coming.',
      more: 'Your brain has learned what comes before porn: an hour, a room, a mood, an app. When that signal shows up, the wanting starts, before anything is on the screen. So the moment to act is earlier than it feels, and it is easier there.',
    },
    deep: [
      {
        h: 'Men with problem use stood out at the signal, not the picture.',
        p: 'A sign that a picture was coming lit up their reward area. The picture itself, about the same as other men.',
        art: ['chain', { n: ['Phone in bed', 'The pull starts', 'Nothing on screen yet'] }],
        fact: { s: 'Brain-scan study · 52 men · Gola and colleagues, 2017', i: [0] },
        more: 'In a brain-scan study, men seeking help for problem porn use and men without it watched for signals, then saw pictures. The men with problem use had a stronger response in a reward area of the brain to the signal that an erotic picture was coming. To the pictures themselves, the response was about the same. The stronger the response to the signal, the more porn they said they used.',
      },
      {
        h: 'The signal is where the ad starts to play.',
        p: 'The wanting was trained to answer the bell. Move at the bell, and the ad has less time to run.',
        back: 'l33',
      },
    ],
    mine: { h: 'The reason you pick most can be one of your signals.', k: 'trigger' },
    move: {
      h: 'Find your first signal, and move at it.',
      l: ['Name it: a time, a room, a mood, an app', 'Pick one move for when it shows up', 'Do it then, while the pull is small'],
    },
    check: {
      h: '10:50 p.m. You are in bed, thumb on the app you scroll before a slip. Nothing is on the screen. What now?',
      o: [
        ['Wait and see if an urge comes', 'By the time it comes, the pull has a head start. This is the bell.'],
        ['Phone across the room, now', 'Yes. You moved at the bell, when the pull is smallest and the move is easiest.'],
        ['Scroll, but stop if it gets bad', 'The app is the signal. Staying in it lets the pull build.'],
        ['Feel bad that I opened it again', 'Opening it is a trained habit, not a verdict on you. Use it as a cue to move.'],
      ],
      a: 1,
    },
    scope:
      'The brain-scan study was small, with men seeking help and men without problems, and it shows a pattern, not every person’s story. It fits a long line of research on how learned signals start wanting. Signals are learned, and they can be moved.',
    src: [S.gola],
  },

  l20: {
    id: 'l20',
    title: 'Fewer fights, not more willpower',
    ic: 'shield',
    ask: 'Do I just need more willpower to quit?',
    key: 'Not mostly. People with strong self-control have fewer fights. Count a night with nothing to fight as a win.',
    np: 'One fight I could stop having',
    hook: {
      h: 'You won four nights against the urge, and lost the fifth.',
      say: 'So you need more willpower?',
      more: 'Many people say “I just need more willpower,” then measure themselves by how often they lose. This lesson is about what strong self-control looks like from the inside.',
    },
    ask1: {
      h: 'When you picture someone with strong self-control, what are they doing?',
      o: [
        ['Saying no to a lot of urges', 'That is the usual picture. The next card is about how rarely it fits.'],
        ['Never feeling tempted at all', 'They still want things. Something else sets them apart.'],
        ['Staying away from the hard places', 'That picture puts the work before the fight, where it costs least.'],
        ['I do not know yet', 'That is fair. Hold the question for the next card.'],
      ],
    },
    flip: {
      think: 'Strong self-control means winning more fights.',
      see: 'People with strong self-control mostly fight less. Their wins are quiet: nights with nothing to fight.',
      more: 'We admire the person who wins the hard fight, and we judge ourselves by the fights we lose. The people we call disciplined mostly set up their days so the fight comes less often. From outside, their best nights look like nothing happened. That is what a win looks like.',
    },
    deep: [
      {
        h: 'People with strong self-control did less resisting, not more.',
        p: 'Beeped all week to report temptations, they had fewer clashes with their goals to resist.',
        art: ['shield', {}],
        fact: { s: 'Study · 205 adults · Hofmann and colleagues, 2012', i: [0] },
        more: '205 adults carried a device that beeped at random times for a week. At each beep they said what they wanted and whether it clashed with their goals. People high in self-control reported fewer clashes and less resisting, not more. They seemed to steer around their temptations.',
      },
      {
        n: '159',
        h: 'students tracked their temptations, then their goals. Fewer won.',
        p: 'How hard they resisted did not predict their progress. How often they were tempted did.',
        fact: { s: 'Study · 159 students · Milyavskaya & Inzlicht, 2017', i: [1] },
        more: 'University students reported their temptations for a week, then reported at the end of the term how far they had got on their goals. Students who met fewer temptations made more progress. How hard they resisted did not predict progress at all.',
      },
      {
        h: 'The easiest fight is the one where the bell never rings.',
        p: 'A signal starts the pull. Take the signal out of the evening, and there is no fight to win.',
        back: 'l34',
      },
    ],
    move: {
      h: 'Take one fight out of tomorrow.',
      l: ['Phone charges outside the bedroom', 'Plan the first hour after dinner', 'Log out of the app you scroll first'],
      more: 'Pick the fight that comes back most. Remove it once, and count tomorrow evening as a win even if nothing happens. Nothing happening is the win.',
    },
    check: {
      h: '12:15 a.m. You lost the late-night phone fight three times this week. What do you do about tomorrow night?',
      o: [
        ['Promise to resist harder tomorrow', 'That books the same fight again. The people who did best had fewer of them.'],
        ['Decide I am weak-willed', 'Losing the same fight says the setup needs changing, not you.'],
        ['Phone in the kitchen by ten', 'Yes. Tomorrow night has one less fight in it, and that is a win you can count.'],
        ['Allow it every other night', 'That keeps the fight in every night. Remove it instead.'],
      ],
      a: 2,
    },
    scope:
      'Both studies used people’s own reports of everyday temptations, not porn, and they show patterns across many people. They point one way: people who reach their goals tend to meet fewer temptations, and setting up your days that way is a skill anyone can learn.',
    src: [S.hofmann, S.milyavskaya],
  },

  l46: {
    id: 'l46',
    title: 'What getting free feels like',
    ic: 'sunrise',
    ask: 'Why do I feel so flat since I stopped, and when does it get easier?',
    key: 'A flat stretch is common, and it is not who you are. It eases over weeks, and every urge ridden out helps.',
    np: 'What a flat day feels like for me, and what I will do on one',
    hook: {
      h: 'Day 12. Everything feels gray, and you are short with people.',
      say: 'Is this how it will feel from now on?',
      more: 'Many people hit a flat stretch in the first weeks and take it as proof that something is wrong with them. This lesson is about what it is, and what comes after it.',
    },
    ask1: {
      h: 'When a flat day comes, what do you tell yourself it means?',
      o: [
        ['Quitting broke something in me', 'That fear makes a low day feel permanent. The next cards look at it.'],
        ['This is who I am without it', 'That thought turns a stretch into a life. The next card turns it over.'],
        ['It is hard, and it will pass', 'That reading keeps you going on a gray day.'],
        ['I do not know yet', 'That is honest. Hold it for the next card.'],
      ],
    },
    flip: {
      think: 'This flat feeling is who I am without it.',
      see: 'A habit can borrow your mood. The flat weeks are paying it back, and after them people tend to feel better.',
      more: 'For a long time one habit eased stress, filled the empty hour and ended the day. When it goes, what it covered comes back up before your new ways to meet it are built. That feels flat. It is a stretch, not a verdict, and people who quit another habit ended up feeling better than those who kept going.',
    },
    deep: [
      {
        n: '26',
        h: 'studies: people who quit smoking felt better than those who kept on.',
        p: 'Less anxiety, depression and stress, and more good mood. Even for people who had smoked to cope.',
        fact: { s: 'Review · 26 studies · Taylor and colleagues, 2014', i: [0] },
        more: 'A large review gathered 26 studies of adults who quit smoking and adults who kept smoking, measured at least six weeks after quitting. People who quit had less depression, anxiety and stress, and better mood, than people who kept going. It held for people who said they smoked to cope, and for people with mental health conditions. This was smoking, not porn, and the studies followed people rather than assigning them. The habit was not what held the mood up.',
      },
      {
        h: 'A week off porn showed no withdrawal effects.',
        p: 'In a trial of 176 students, those who stopped felt about the same as the rest. A low day is not damage.',
        fact: { s: 'Randomized trial · 176 students · Fernandez and colleagues, 2023', i: [1] },
        more: '176 students who watched porn at least three times a week were split into two groups, and one group was asked to stop for seven days. Craving, mood and withdrawal symptoms came out about the same in both groups. And 45 in 100 of those asked to stop slipped at least once that week. A low week is a low week, and an early slip is very common.',
      },
      {
        h: 'Nobody can give you a date, and uneven is normal.',
        p: 'Building one daily habit took people from 18 to 254 days. One missed day barely changed it.',
        fact: { s: 'Study · 96 volunteers · Lally and colleagues, 2010', i: [2] },
        more: 'In a study of 96 people building one new daily habit, the time it took ranged from 18 to 254 days, and one missed day barely changed the result. That is why anyone who promises you a date is guessing. Most people notice the flat stretch easing over weeks: fewer pulls, weaker pulls, and more good days between them.',
      },
    ],
    mine: { h: 'Every urge you ride out is helping it ease.', k: 'rode' },
    move: {
      h: 'On a flat day, do the small things anyway.',
      l: ['Name it: “This is a flat day. It passes.”', 'Sleep, real food, a walk outside', 'Text one person, about anything'],
      more: 'You do not have to feel good to be getting better. If the low stays for weeks or turns dark, tell a doctor. Depression is common and very treatable, and getting help is a strong move.',
    },
    check: {
      h: 'Day 12, 9 p.m. Everything is gray. A thought says, “Going back once would make me feel normal.” What fits?',
      o: [
        ['It might. One time, to feel normal', 'The habit borrowed that normal. Going back takes out a new loan.'],
        ['This is a flat stretch, and it eases', 'Yes. You read it for what it is, and you keep going. That is getting free, from inside.'],
        ['Stopping must have damaged something', 'A week off porn showed no damage. Low days are common, and they pass.'],
        ['Push through and feel nothing about it', 'Feelings are fine to have. A walk, sleep and one person help a gray day.'],
      ],
      a: 1,
    },
    scope:
      'The mood review was about people who quit smoking, and those studies followed people rather than assigning them. The week off porn was one short trial with students. Together they point one way: a flat stretch is common, it is not damage, and people tend to feel better on the far side of it.',
    src: [S.taylor, S.fernandez, S.lally],
  },

  l10: {
    id: 'l10',
    title: 'Change the setting',
    ic: 'phone',
    ask: 'Why does the urge keep showing up in the same places and times?',
    key: 'A habit lives in the room as much as in you. Change one thing about the room, and the habit loosens.',
    np: 'The first setting I will change',
    hook: {
      h: 'Same bed, same hour, same phone. The same urge shows up.',
      say: 'Is the problem you, or the room?',
      more: 'For many people it is the bed, late, phone in hand. Same scene, same urge. This lesson is about why the setting matters so much, and how to use that.',
    },
    ask1: {
      h: 'Where and when do most of your hard moments happen?',
      o: [
        ['In bed, late, with my phone', 'That is the most common setting of all, and one of the easiest to change.'],
        ['At my desk or computer', 'A desk is a setting you can rearrange, or leave at a set hour.'],
        ['Anywhere I am alone', 'Alone is a setting too. Who is around can change as much as where.'],
        ['I do not know yet', 'That is fair. Your log will show it within a week or two.'],
      ],
    },
    flip: {
      think: 'My urges come from me, so I have to change me.',
      see: 'A habit lives in the room as much as in you. Change the room, and much of the habit stays behind.',
      more: 'We picture a habit as something inside us that comes along wherever we go. Much of it is stored in the setting: the bed, the hour, the device, being alone. Change that, and the cues that start the habit go quiet, and your own choices get more say.',
    },
    deep: [
      {
        h: 'Hooked in Vietnam, most soldiers did not go back to it at home.',
        p: 'Most people treated for heroin in the US at the time went back within a year. The soldiers had left the room.',
        art: ['rooms', {}],
        fact: { s: 'Study · US Vietnam veterans · Robins, reviewed by Hall & Weier, 2017', i: [0] },
        more: 'During the Vietnam War, many US soldiers used heroin, and many showed signs of being hooked. Lee Robins and her team followed them after they came home. Most did not go back to it, while most people treated for heroin in the US at the time did. Many things changed at once for the soldiers: the war, the price, the people around them. A big part of it was that the whole setting the habit lived in was gone.',
      },
      {
        h: 'Students who moved campus lost habits tied to the old one.',
        p: 'Where the new place was alike, habits carried on. Where it differed, people did more of what they meant to.',
        fact: { s: 'Study · students who transferred · Wood, Tam & Guerrero Witt, 2005', i: [1] },
        more: 'Students who transferred to a new university were tracked on everyday habits. When the new setting was similar, their habits carried on. When it changed a lot, old habits were disrupted, and what students did followed their intentions more.',
      },
      {
        h: 'A setting is a pile of signals.',
        p: 'Each one is a bell. You do not need a new city. Moving one bell out of the room is enough to start.',
        back: 'l34',
      },
    ],
    move: {
      h: 'Change one thing about your hardest setting tonight.',
      l: ['Charge the phone outside the bedroom', 'A cheap alarm clock does the phone’s job', 'At your hard hour, change rooms or go out'],
    },
    check: {
      h: 'Most of your slips happen in bed, after midnight, on your phone. It is 10 p.m. What do you do with the phone?',
      o: [
        ['Keep it close, and be stronger tonight', 'That leaves the room the same, and the room is holding the habit.'],
        ['Delete one app, keep the phone by the bed', 'Some friction helps. The phone in bed is still the room the habit lives in.'],
        ['Put it on the charger in the kitchen', 'Yes. You changed the room the habit lives in. Tonight it has less to stand on.'],
        ['Stay up until I am too tired to bother', 'Tired makes the pull look bigger, not smaller. Change where the phone sleeps.'],
      ],
      a: 2,
    },
    scope:
      'The Vietnam studies were about heroin, not porn, and much changed for the soldiers at once: the war, the price, the people around them. The campus study was about everyday habits. Both point the same way: a habit leans on its setting, and changing the setting gives your own choices more room.',
    src: [S.robins, S.wood],
  },

  l9: {
    id: 'l9',
    title: 'If this, then that',
    ic: 'plug',
    ask: 'How do I make a good choice when the urge hits late at night?',
    key: 'Decide ahead with an if-then plan. When the moment comes, it sets the plan off, and you only follow.',
    np: 'My strongest if-then',
    hook: {
      h: 'At 8 p.m. you know what you want. At 1 a.m. it feels brand new.',
      say: 'Who do you trust to decide at 1 a.m.?',
      more: 'At 8 p.m. the goal is clear. At 1 a.m. you are tired, the urge is loud, and the choice feels like it has never been made. This lesson is about not having to make it then.',
    },
    ask1: {
      h: 'When the hard moment comes, how do you usually decide what to do?',
      o: [
        ['In the moment, by how I feel', 'Then 1 a.m. decides, and that is the most tired version of you.'],
        ['I remind myself why I am quitting', 'Reasons help. At 1 a.m. they have to win an argument first.'],
        ['I already have a plan for it', 'Then you are ahead. This lesson sharpens it.'],
        ['I do not know yet', 'That is honest. Notice it the next time.'],
      ],
    },
    flip: {
      think: 'If I mean it enough, I will make the right call in the moment.',
      see: 'A good plan does not need you to decide at 1 a.m. The moment itself sets it off, and you follow.',
      more: 'People treat a plan as a weaker kind of willpower. It works the other way. Once you tie a “then” to an “if,” the moment becomes easy to notice and starts the action almost by itself. Being tired is what the plan was built for.',
    },
    deep: [
      {
        h: 'Across many studies, if-then plans had a medium to large effect.',
        p: 'People who planned the moment reached their goals more often than people who only held the goal.',
        art: ['chain', { n: ['Phone in bed', 'Stand up', 'Glass of water'] }],
        fact: { s: 'Meta-analysis · 94 tests · Gollwitzer & Sheeran, 2006', i: [0] },
        more: 'Peter Gollwitzer and Paschal Sheeran pulled together 94 tests of if-then plans, on goals from exercise to study to eating. Planning the moment, “if this happens, then I do that,” helped people reach their goals by a medium to large amount compared with holding the goal alone. In psychology, that is a big effect for something that takes a minute to write.',
      },
      {
        h: 'The plan works by making the “if” easy to spot.',
        p: 'Tied to a “then,” the moment stands out when it comes, and the action starts with little thought.',
        fact: { s: 'Study · Webb & Sheeran, 2007', i: [1] },
        more: 'Researchers checked why if-then plans work. Two things did it: the moment named in the “if” became easier to notice, and it became tied to the action, so the action started with less effort. The deciding moves to a calm hour, and the hard hour only has to follow.',
      },
      {
        h: 'A changed room covers most nights. A plan covers the rest.',
        p: 'When a signal still shows up, the “if” is waiting for it.',
        back: 'l10',
      },
    ],
    move: {
      h: 'Write one if-then for your hardest moment.',
      l: ['If: the exact moment, “in bed, phone in hand”', 'Then: one small move, “I stand up”', 'Small enough to do half asleep'],
    },
    check: {
      h: '12:40 a.m. You are in bed with the phone, too tired to think. What gives you the best chance?',
      o: [
        ['Weigh it up and make a good choice', 'That asks your most tired self to win an argument. The plan already decided.'],
        ['Follow the plan: stand up', 'Yes. You do not have to decide. The moment set the plan off, and you follow it.'],
        ['Tell myself to be strong', 'Strong is a wish, not a move. A “then” is something you can do half asleep.'],
        ['Plan to quit for good next month', 'That aims past tonight. The plan that helps is for this exact moment.'],
      ],
      a: 1,
    },
    scope:
      'The review covered many kinds of goals, not porn, and if-then plans are one of the best tested tools in the study of goals. They help most when the “if” is a clear moment and the “then” is small. Yours can be both.',
    src: [S.gollwitzer, S.webb],
  },

  l29: {
    id: 'l29',
    title: 'God and a plan',
    ic: 'star',
    ask: 'If I pray about this, why does the pull keep coming back?',
    key: 'A returning urge is not failed faith. Pray, then set your guard: do the next small thing.',
    np: 'How I want God to be part of my plan',
    hook: {
      h: 'You prayed and meant it. An hour later, the pull is back.',
      say: 'Did your faith fail?',
      more: 'Many people of faith know this moment. This lesson is about how prayer and action fit together, so a prayer leads somewhere.',
    },
    ask1: {
      h: 'When you pray about this, what are you hoping will happen?',
      o: [
        ['That the urge is taken away', 'Many people pray for that. Watch for help that comes another way.'],
        ['Strength to get through tonight', 'Strength often comes as the will to do the next small thing.'],
        ['To feel close to God when I fail', 'That prayer holds you up after a slip as much as before one.'],
        ['I do not know yet', 'That is honest. Hold it as you read on.'],
      ],
    },
    flip: {
      think: 'If I prayed and the urge came back, my faith failed.',
      see: 'Prayer was never meant to replace the next step. Nehemiah prayed and set a guard, both, day and night.',
      more: 'When Nehemiah was rebuilding the walls of Jerusalem under threat, Scripture says the people prayed to God and set a guard day and night. He did not choose between trusting God and posting a watch. A returning urge does not mean the prayer failed. It is the hour to post the guard.',
    },
    deep: [
      {
        h: 'Nehemiah prayed, and then he posted a guard.',
        p: 'He did not treat the guard as doubt. The prayer and the watch went together, day and night.',
        art: ['chain', { n: ['Pray', 'Stand up', 'Phone in the kitchen'] }],
        fact: { s: 'Scripture · Nehemiah 4:9', i: [0] },
        more: 'The people rebuilding the wall were under threat. Nehemiah tells how they prayed to God, and in the same breath set a guard to watch day and night. Trusting God and keeping watch were one act of faith, not two rival ones.',
      },
      {
        h: 'James wrote that faith with no works is dead.',
        p: 'Faith shows itself in what it does. A small move after a prayer is faith at work.',
        fact: { s: 'Scripture · James 2', i: [1] },
        more: 'In his letter, James asks what good it is to wish someone warm and fed without giving them what they need. Faith, he says, is shown by what it does. A prayer followed by a move is not less faith. It is faith with its hands busy.',
      },
      {
        h: 'Put the prayer inside your if-then.',
        p: 'If I am in bed with the phone, then I pray one line, and I stand up.',
        back: 'l9',
      },
    ],
    move: {
      h: 'Pray, then post your guard.',
      l: ['Pray one honest line, in your own words', 'Then do one move: stand, leave the room', 'Tell one person you trust, when you can'],
      more: 'The prayer is yours. The move changes the next ten minutes. And faith has always been lived with other people, so one trusted person makes the guard stronger.',
    },
    check: {
      h: '12:30 a.m. You prayed an honest prayer in bed. The phone is still in your hand. What is your next move?',
      o: [
        ['Keep praying until the urge is gone', 'Prayer matters. Nehemiah prayed, then posted a guard. Say your words, then move.'],
        ['Decide prayer does not work for me', 'The pull coming back is not failed faith. It is the hour for the guard.'],
        ['Put the phone in the kitchen', 'Yes. You prayed, and you posted the guard. Both are faith.'],
        ['Keep it between me and God alone', 'Faith has always come with people. One trusted person helps carry it.'],
      ],
      a: 2,
    },
    scope:
      'Nehemiah and James are read by Christians of every tradition, and Nehemiah by Jews as well. The picture they share is clear: prayer and action belong together, and an urge that returns is a call to act, not a sign that faith failed.',
    src: [S.nehemiah, S.james],
  },

  l4: {
    id: 'l4',
    title: 'Late and low',
    ic: 'moon',
    ask: 'Why do urges hit harder when you are tired or lonely?',
    key: 'Late and low, the pull reads louder than it is. Plan that hour ahead, and meet the need: sleep or a person.',
    np: 'Am I more tired or more lonely at night, and what will I do about it?',
    hook: {
      h: 'It is 1 a.m. A voice says, “Be honest. This is what you want.”',
      say: 'Is 1 a.m. the time to find out what you want?',
      more: 'Same person, same goal, same phone as at 3 p.m. What changed is your state: more tired, and often more alone. This lesson is about what that does to an urge, and how to plan for it.',
    },
    ask1: {
      h: 'When an urge comes late at night, what are you usually feeling underneath?',
      o: [
        ['Tired, past the point of thinking', 'Tired turns the pull up. Sleep turns it back down.'],
        ['Lonely, or cut off', 'Lonely is a need. A person meets it better than a screen.'],
        ['Bored, with nothing left to do', 'An empty hour is easy to plan for. It is the same hour most nights.'],
        ['I do not know yet', 'That is fair. Ask yourself the next time it comes.'],
      ],
    },
    flip: {
      think: 'At 1 a.m. I find out what I really want.',
      see: 'At 1 a.m. you are asking your most tired self. Lost sleep turns the reward up, so the answer is too loud.',
      more: 'A late urge feels like an honest confession. It is a reading taken with a tired instrument. Losing sleep makes the brain’s reward areas react more to anything that feels good, so the pull reads louder than it is. Ask the same question in the morning, and the answer is different. That is not weakness. It is an hour you can plan for.',
    },
    deep: [
      {
        h: 'After a night without sleep, the same pictures felt better.',
        p: 'Reward areas of the brain reacted more, and people rated more of the pictures as pleasant.',
        fact: { s: 'Lab study · 27 adults · Gujar and colleagues, 2011', i: [0] },
        more: 'Researchers kept some volunteers up all night and let others sleep, then showed everyone pleasant pictures in a brain scanner. After the sleepless night, reward areas reacted more strongly, and people rated more of the pictures as pleasant. Nothing about the pictures changed. The tired brain read them louder.',
      },
      {
        h: 'Lonely and low feed each other in a loop.',
        p: 'Among 1,247 adults, loneliness and porn use rose together. A person works on the need underneath.',
        art: ['loop', { n: ['Lonely', 'Reach for porn', 'More cut off', 'Lonelier'], c: 'A person breaks it' }],
        fact: { s: 'Survey · 1,247 adults · Butler and colleagues, 2018', i: [1] },
        more: 'In a survey of 1,247 adults, loneliness and porn use rose together. The researchers think it may run both ways: feel lonely, reach for porn, feel more cut off, feel lonelier. Porn cannot meet that need. A person, even by text, can.',
      },
      {
        h: 'Tired is one of the things that turns up the ad.',
        p: 'A loud pull was never a review. At 1 a.m. the volume is higher still.',
        back: 'l33',
      },
    ],
    mine: { h: 'Your hardest hours are the ones to plan for.', k: 'hour' },
    move: {
      h: 'Plan the late hour while it is still light.',
      l: ['Pick a phone-down time, and keep it', 'Tired: phone out of the room, then sleep', 'Lonely: text one person, about anything'],
    },
    check: {
      h: '12:40 a.m. You have been up since 6. A thought says, “Be honest, this is what you want.” What do you do?',
      o: [
        ['Believe it. Tonight I see the truth', 'That is the most tired reading of the day. Ask again in the morning.'],
        ['Grit my teeth and hold out until dawn', 'You are fighting with your most tired brain. Ending the night ends the fight.'],
        ['Phone out of the room, then sleep', 'Yes. You read the hour for what it is, and sleep turns the pull back down.'],
        ['Scroll something safe until it passes', 'That keeps you up with the phone in hand. The need under it is sleep.'],
      ],
      a: 2,
    },
    scope:
      'The sleep study kept healthy adults awake for one night and showed them pictures, not porn. The loneliness survey found that the two go together, not which one causes the other. Both point to the same move: a late, low hour is a time to plan for, and sleep and people meet the need under it.',
    src: [S.gujar, S.butler],
  },

  l37: {
    id: 'l37',
    title: 'Who you are becoming',
    ic: 'star',
    ask: 'Can I really stop seeing myself as someone with this problem?',
    key: 'Seeing yourself in a new way is part of the change, not its prize. Start now. A slip does not take it away.',
    np: 'Who I am becoming, in one sentence',
    hook: {
      h: 'Two clean weeks, and a voice still calls you the same old you.',
      say: 'When do you get to see yourself differently?',
      more: 'Many people carry an old label long after things start to change. This lesson is about when the new one can start.',
    },
    ask1: {
      h: 'What would it take for you to believe you are someone who is free of this?',
      o: [
        ['A long run with no slips', 'That makes a slip feel like losing who you are. The next card offers another way.'],
        ['Someone else seeing it in me', 'Being seen helps a lot. You can also start the seeing yourself.'],
        ['Feeling it inside, one day', 'That feeling tends to follow the steps you take, not come before them.'],
        ['I do not know yet', 'That is honest. Hold it for the next card.'],
      ],
    },
    flip: {
      think: 'I can see myself differently once I have earned it.',
      see: 'Seeing yourself as someone getting free is not the prize at the end. It is a tool that gets you there.',
      more: 'We treat a new identity like a trophy, handed out after a long run. In recovery research it works more like an ingredient. People who began to see themselves as someone in recovery early on did better later. And a sentence about who you are becoming is a direction, not a record. A slip does not take it away.',
    },
    deep: [
      {
        n: '132',
        h: 'adults in treatment began to see themselves anew within a month.',
        p: 'The bigger that shift, the less often they drank later, and the more satisfied with life they were.',
        fact: { s: 'Study · 132 adults · Dingle, Stark, Cruwys & Best, 2015', i: [0] },
        more: 'Researchers followed 132 adults through a residential treatment community for alcohol and drugs. Over the first month, most came to see themselves less as users and more as people in recovery. The bigger that shift, the less often they drank and the more satisfied with life they were later on. The new view did not wait for the results. It came early, and it went with better ones.',
      },
      {
        h: 'Who you are becoming survives a slip.',
        p: 'It is a direction you face, not a record you keep clean. After a slip, you turn back the same way.',
      },
      {
        h: '“I already blew it” is the old name talking.',
        p: 'A slip scored as one leaves the new name standing. You answer to the one you chose.',
        back: 'l3',
      },
    ],
    mine: { h: 'This is what the person you are becoming has done.', k: 'acted' },
    move: {
      h: 'Start using the new sentence now.',
      l: ['Write who you are becoming, in one line', 'Do one thing today that person would do', 'After a slip, say the same sentence again'],
    },
    check: {
      h: 'Day 14, 10 p.m. A thought says, “You are still the same person who cannot stop.” What do you do?',
      o: [
        ['Agree, and wait until I have proof', 'Waiting for proof keeps the old name in charge. The shift starts early.'],
        ['Say my sentence, and act like it', 'Yes. You answer to the name you chose, and give it one more piece of evidence.'],
        ['Count my days to prove it wrong', 'Days help, but they are not who you are. A slip would leave you with no answer.'],
        ['Argue with it until it goes quiet', 'You do not have to win the argument. Live the sentence instead.'],
      ],
      a: 1,
    },
    scope:
      'The study followed adults in treatment for alcohol and drugs, not porn, and it shows what went together, not proof of cause. It fits a wider body of research on recovery as a change in who people are. That change can start now, and a slip does not undo it.',
    src: [S.dingle],
  },

  l38: {
    id: 'l38',
    title: 'Say “I do not”',
    ic: 'flag',
    ask: 'What do I say to myself when the urge asks for “just once”?',
    key: '“I cannot” is a rule on you, and rules get argued with. “I do not” is a fact about you, with nothing to argue.',
    np: 'My “I do not” sentence',
    hook: {
      h: 'The urge says, “Just once. No one will know.”',
      say: 'What do you say back?',
      more: 'Many people answer with “I cannot,” or “I am not allowed.” This lesson is about two small words that change who is speaking.',
    },
    ask1: {
      h: 'When an urge argues with you, what words do you use to say no?',
      o: [
        ['“I cannot”', 'That one leans on a rule. Notice whose rule it feels like.'],
        ['“I should not”', 'That one has a judge in it, and judges get argued with.'],
        ['“Not tonight”', 'That leaves tomorrow open, and the urge will ask again.'],
        ['I do not say anything', 'Silence beats bargaining. A short sentence can do more.'],
      ],
    },
    flip: {
      think: 'To say no, I need a firm rule: “I cannot.”',
      see: '“I cannot” names a rule on you, and rules get argued with. “I do not” names who you are.',
      more: '“I cannot” leaves a rule-giver in the room, someone to resent, plead with, or slip past when no one is looking. “I do not” is a plain fact about you. The urge can argue with a rule. It has nothing to say to a fact.',
    },
    deep: [
      {
        h: 'People who said “I do not” picked the healthy snack more often.',
        p: 'Those told to say “I cannot” gave in more. Two small words changed what they did.',
        art: ['rule', {}],
        fact: { s: 'Experiments · Patrick & Hagtvedt, 2012', i: [0] },
        more: 'In one experiment, people practised saying no to a temptation in one of two ways, “I do not” or “I cannot.” On the way out they chose a snack, and the “I do not” group chose the healthy one more often. The researchers found that “I do not” felt like determination, and “I cannot” felt like being deprived.',
      },
      {
        h: 'Over ten days, women who said “I do not” kept going more.',
        p: 'They felt more in charge of their health goal, and more of them stayed with it than with “I cannot.”',
        fact: { s: 'Field study · 30 women · Patrick & Hagtvedt, 2012', i: [0] },
        more: 'In another study, women working on a health goal used one way of saying no for ten days. Those who said “I do not” felt more in control and stuck with the goal more than those who said “I cannot” or who had no set words. The group was small, and it matched what the lab studies found.',
      },
      {
        h: '“I do not” is your new sentence, said at the door.',
        p: 'The person you are becoming does not need a rule. They have a fact.',
        back: 'l37',
      },
    ],
    mine: { h: 'Each urge you outlast makes the fact more true.', k: 'rode' },
    move: {
      h: 'Write your “I do not,” and use it at the door.',
      l: ['Keep it short: “I do not watch porn.”', 'Add who you are: “I keep my word to myself.”', 'Say it out loud at the first signal'],
      more: 'If a slip comes, your sentence still stands. It names the way you are facing, not a record you have to keep clean.',
    },
    check: {
      h: '11 p.m. The urge says, “Just once, no one will know.” What do you say back?',
      o: [
        ['“I cannot. I promised.”', 'That makes it a rule, and the urge will look for the gap in it.'],
        ['“I do not do that.”', 'Yes. A fact about you, with nothing to bargain over.'],
        ['“Maybe later.”', 'That leaves the door open, and the urge will knock again.'],
        ['A long list of reasons why not', 'Reasons invite a debate, and 11 p.m. is a bad time to hold one.'],
      ],
      a: 1,
    },
    scope:
      'The studies were about food and health goals, with small groups, and the field study had 30 women. They show a pattern in how people keep their goals, not a cure. The words cost nothing to try, and they put your choice in your own voice.',
    src: [S.patrick],
  },

  l39: {
    id: 'l39',
    title: 'A year from now',
    ic: 'sunrise',
    ask: 'How can thinking about my future self help tonight?',
    key: 'Future you is a person, not a stranger. They live with tonight, so give them a face and a say.',
    np: 'A few words from me, a year from now',
    hook: {
      h: '1 a.m. A thought says, “Once. Future me can deal with it.”',
      say: 'Who is future you, to you?',
      more: 'The person who lives with tonight is not in the room. This lesson brings them in.',
    },
    ask1: {
      h: 'When you picture yourself a year from now, what do you see?',
      o: [
        ['Someone clear, with a face', 'Then they can have a say tonight. Keep that picture close.'],
        ['A blur, or nothing much', 'Most people see a blur. The next card is about what that does.'],
        ['Someone still stuck in this', 'That is the urge drawing the picture. A year is long enough to change a lot.'],
        ['I do not know yet', 'That is fair. Try to give them a face as you read on.'],
      ],
    },
    flip: {
      think: 'Tonight is mine. Future me can deal with it.',
      see: 'Your mind files future you with strangers. But future you is the one who wakes up with tonight.',
      more: 'People make choices for their future selves the way they make choices for other people: they sign them up for things they would refuse to do themselves. But future you is not someone else. They wake up in your bed, with your memory of tonight. Treat them as someone you look after.',
    },
    deep: [
      {
        h: 'Students handed future selves what they refused for themselves.',
        p: 'Asked to drink a foul mix, they took a little now, and gave their later selves as much as a stranger.',
        fact: { s: 'Experiments · Pronin, Olivola & Kennedy, 2008', i: [0] },
        more: 'In a set of studies, students were asked how much of a disgusting drink of ketchup and soy sauce they would drink for science. For themselves that day, they agreed to a little. For themselves later in the term, they agreed to much more, about as much as they signed another student up for. The mind treats future you a lot like someone else.',
      },
      {
        h: 'Seeing their own older face changed what people chose.',
        p: 'After meeting an older version of themselves, people set more aside for later.',
        fact: { s: 'Experiments · Hershfield and colleagues, 2011', i: [1] },
        more: 'In a set of studies, people saw computer images of their own faces made to look older, some of them in virtual reality. Afterward, they were more willing to take money later over money now, and they put more toward retirement in a savings task. Once future you had a face, they got a say.',
      },
      {
        h: 'Future you is the person you are becoming.',
        p: 'The sentence you wrote is about them. Tonight is one of the days that builds them.',
        back: 'l37',
      },
    ],
    mine: { h: 'Every day that holds is one you hand to future you.', k: 'clean30' },
    move: {
      h: 'Give future you a face and a say.',
      l: ['Picture them a year from now, in detail', 'Ask what they need from you tonight', 'Write their words down, and keep them'],
    },
    check: {
      h: '1 a.m. A thought says, “One time. Future me will deal with it.” What do you do?',
      o: [
        ['Go ahead. Tonight is mine', 'Tonight is theirs too. They are the one who wakes up with it.'],
        ['Picture them, and do what they need', 'Yes. You gave future you a face, and a say in tonight.'],
        ['Promise future me I will be strict later', 'That hands them the bill and the work. Give them tonight instead.'],
        ['Feel guilty about letting them down', 'Guilt looks back. Future you needs a move now, not a scolding.'],
      ],
      a: 1,
    },
    scope:
      'The drink study was with college students, and the face study used a savings task, not porn. Together they show that people tend to treat their future selves like other people, and that making future you feel near shifts choices. Future you is someone to look after, never someone you have failed.',
    src: [S.pronin, S.hershfield],
  },
};
