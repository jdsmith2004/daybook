/* Lessons 33 to 45. Lessons 33 to 40 are the two newer units: "Why it is hard to stop" and "Becoming someone new".
   Lesson 41, "The picture and the real thing", is the science behind Talk it through and Rekindle, in "Seeing your
   pattern". Lessons 42 to 45 are the science behind the SOS moves that had no lesson of their own (Fit the shapes,
   5-4-3-2-1, The hour after, Your words), in "Skills for the moment"; each move's Why it works opens its lesson. They follow the same lesson standard as the first 32 (see the LESSONS note in legacy/core.js), and
   legacy/core.js adds them to LESSONS, LUNITS and SRC, so every rule that counts lessons sees all of them.

   Each unit is a family: one hard idea taught four ways (the science, a scene, a practice, your own log), read together as
   one section of the path (see lessonPath and LESSON_FAMILIES in lessons.ts). The practice step at the end of each lesson
   is in practice.ts.

   Each lesson rests on the research in SRC_MORE and speaks with confidence: it teaches something good and true, and leaves the
   reader with hope (see "Lessons" in CLAUDE.md).

   This file imports nothing from legacy/core.js, because legacy/core.js imports it. The sources lesson 41 shares with
   Talk it through come from talk.ts, so both always point at the same papers. */
import type { Lesson, Unit } from './lessons';
import { TALK_SRC } from './talk';

const bP = (s: string): ['p', string] => ['p', s];
const bL = (a: string[]): ['l', string[]] => ['l', a];

export const SRC_MORE: Record<string, [string, string]> = {
  berridge: [
    'Berridge & Robinson (2016): liking, wanting, and the incentive-sensitization theory of addiction, American Psychologist',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5171207/',
  ],
  ipace: [
    'Brand et al. (2019): the I-PACE model for addictive behaviors, an update, Neuroscience & Biobehavioral Reviews',
    'https://duepublico2.uni-due.de/servlets/MCRFileNodeServlet/duepublico_derivate_00070551/Brand_et_al_Interaction_I-PACE_model.pdf',
  ],
  gola: [
    'Gola et al. (2017): “Can pornography be addictive?” A brain-scan study of men seeking treatment for problematic pornography use, Neuropsychopharmacology (the preprint)',
    'https://www.biorxiv.org/content/10.1101/057083v2.full',
  ],
  quinn: [
    'Quinn, Pascoe, Wood & Neal (2010): “Can’t control yourself? Monitor those bad habits,” Personality and Social Psychology Bulletin',
    'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/quinn.pascoe.wood_.neal_.2010_Cant_control_yourself.pdf',
  ],
  woodrunger: [
    'Wood & Rünger (2016): psychology of habit, Annual Review of Psychology',
    'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/wood.runger.2016.pdf',
  ],
  dingle: [
    'Dingle, Stark, Cruwys & Best (2015): “Breaking good,” identity change in a drug and alcohol treatment community, British Journal of Social Psychology',
    'https://researchportalplus.anu.edu.au/en/publications/breaking-good-breaking-ties-with-social-groups-may-be-good-for-re/',
  ],
  best: [
    'Best et al. (2016): recovery as a change of social identity, the social identity model of recovery (SIMOR), Addiction Research & Theory',
    'https://shura.shu.ac.uk/10842/',
  ],
  patrick: [
    'Patrick & Hagtvedt (2012): “I don’t” versus “I can’t,” when empowered refusal motivates goal-directed behavior, Journal of Consumer Research',
    'https://www.bauer.uh.edu/vpatrick/docs/dontversuscant.pdf',
  ],
  hershfield: [
    'Hershfield et al. (2011): increasing saving behavior through age-progressed renderings of the future self, Journal of Marketing Research',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3949005/',
  ],
  /* lesson 41, shared with Talk it through */
  caselli: TALK_SRC.caselli,
  brewer11: TALK_SRC.brewer,
  taylor21: TALK_SRC.taylor,
  sayette: TALK_SRC.sayette,
  tracy13: TALK_SRC.tracy,
  allen17: [
    'Allen, Kannis-Dymand & Katsikitis (2017): problematic internet pornography use, the role of craving, desire thinking, and metacognition, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2017.02.001',
  ],
  kavanagh05: [
    'Kavanagh, Andrade & May (2005): imaginary relish and exquisite torture, the elaborated intrusion theory of desire, Psychological Review',
    'https://doi.org/10.1037/0033-295X.112.2.446',
  ],
  skorka15: [
    'Skorka-Brown, Andrade, Whalley & May (2015): playing Tetris decreases drug and other cravings in real world settings, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2015.07.020',
  ],
  skorka14: [
    'Skorka-Brown, Andrade & May (2014): playing Tetris reduces the strength, frequency and vividness of naturally occurring cravings, Appetite',
    'https://doi.org/10.1016/j.appet.2014.01.073',
  ],
  may10: [
    'May, Andrade, Panabokke & Kavanagh (2010): visuospatial tasks suppress craving for cigarettes, Behaviour Research and Therapy',
    'https://doi.org/10.1016/j.brat.2010.02.001',
  ],
  andrade12: [
    'Andrade, Pears, May & Kavanagh (2012): use of a clay modeling task to reduce chocolate craving, Appetite',
    'https://doi.org/10.1016/j.appet.2012.02.044',
  ],
  marino23: [
    'Marino et al. (2023): desire thinking and craving as predictors of problematic Internet pornography use in women and men, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2022.107469',
  ],
  kemps07: [
    'Kemps & Tiggemann (2007): modality-specific imagery reduces cravings for food, an application of the elaborated intrusion theory of desire, Journal of Experimental Psychology: Applied',
    'https://doi.org/10.1037/1076-898X.13.2.95',
  ],
  kemps12: ['Kemps, Tiggemann & Bettany (2012): non-food odorants reduce chocolate cravings, Appetite', 'https://doi.org/10.1016/j.appet.2012.03.002'],
  scott26: [
    'Scott, Duncan & McCoy (2026): “Ground yourself,” using the five senses technique to cope with test anxiety among nursing students, Teaching and Learning in Nursing',
    'https://www.sciencedirect.com/science/article/abs/pii/S1557308725002999',
  ],
  field09: [
    'Field, Munafò & Franken (2009): the relationship between attentional bias and subjective craving, a meta-analysis of 68 data sets, Psychological Bulletin',
    'https://doi.org/10.1037/a0015843',
  ],
  kemps15: [
    'Kemps & Tiggemann (2015): a role for mental imagery in the experience and reduction of food cravings, Frontiers in Psychiatry',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4284995/',
  ],
  kober10: [
    'Kober, Mende-Siedlecki, Kross, Weber, Mischel, Hart & Ochsner (2010): prefrontal-striatal pathway underlies cognitive regulation of craving, Proceedings of the National Academy of Sciences',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2930456/',
  ],
  lopez22: [
    'Lopez, Ochsner & Kober (2022): brief training in regulation of craving reduces cigarette smoking, Journal of Substance Abuse Treatment',
    'https://doi.org/10.1016/j.jsat.2022.108749',
  ],
  boswell18: [
    'Boswell, Sun, Suzuki & Kober (2018): training in cognitive strategies reduces eating and improves food choice, Proceedings of the National Academy of Sciences',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6275472/',
  ],
  stein16: [
    'Stein et al. (2016): “Unstuck in time,” episodic future thinking reduces delay discounting and cigarette smoking, Psychopharmacology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9812225/',
  ],
  loewenstein05: ['Loewenstein (2005): hot-cold empathy gaps and medical decision making, Health Psychology', 'https://doi.org/10.1037/0278-6133.24.4.S49'],
  loman18: [
    'Loman, Müller, Oude Groote Beverborg, van Baaren & Buijzen (2018): self-persuasion in media messages, reducing alcohol consumption among students with open-ended questions, Journal of Experimental Psychology: Applied',
    'https://doi.org/10.1037/xap0000162',
  ],
  magill18: [
    'Magill et al. (2018): a meta-analysis of motivational interviewing process, technical, relational, and conditional process models of change, Journal of Consulting and Clinical Psychology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5958907/',
  ],
  wood09: [
    'Wood, Perunovic & Lee (2009): positive self-statements, power for some, peril for others, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/19493324/',
  ],
  dijkstra15: [
    'Dijkstra & Menninga (2015): experimentally induced states of mind determine abstinent smokers’ level of craving in reaction to smoking cues, Addictive Behaviors Reports',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5845922/',
  ],
};
/* two sources the first 32 lessons already use */
type Src = [string, string];
const S = (k: string, shared?: Record<string, Src>): Src => SRC_MORE[k] || (shared && shared[k]) || ['', ''];

export const LUNITS_MORE: Unit[] = [
  {
    name: 'Why it is hard to stop',
    sub: 'Wanting and liking, the cue that comes first, autopilot, and what the habit does for you.',
    tone: 'violet',
    cls: 'lu8',
  },
  { name: 'Becoming someone new', sub: 'Who you are becoming, saying “I do not,” your future self, and the evidence in your log.', tone: 'mint', cls: 'lu9' },
];

/** the lessons; shared holds the sources from the first 32 that these lessons also cite */
export function lessonsMore(shared: Record<string, Src>): Lesson[] {
  const src = (...k: string[]) => k.map((x) => S(x, shared));
  return [
    /* ---------- unit 8: why it is hard to stop ---------- */
    {
      id: 'l33',
      u: 8,
      v: 2,
      chk: 'October 16, 2026',
      title: 'Wanting is not liking',
      tag: 'Why the pull can grow even when the pleasure does not.',
      ic: 'bolt',
      mins: 3,
      ask: 'Why is the pull so strong when porn does not even feel that good anymore?',
      key: 'The brain wants and likes through different systems. Repeating a habit can make the wanting louder without making it more enjoyable. A strong pull is a learned signal, not a measure of need.',
      np: 'How it actually feels ten minutes after, compared with how much I wanted it before',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['icon', { ic: 'bolt' }],
          h: 'Have you ever wanted it badly, and then felt flat or empty right after?',
          b: [bP('Many people notice this. The pull before is huge. The reward after is small. This lesson is about why those two do not match.')],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'Why can the pull be strong when the pleasure is small?',
          ask: 'Make your best guess.',
          a: 1,
          c: [
            [
              'Deep down, I must enjoy it more than I admit',
              'A common fear. But wanting and enjoying are two different things in the brain. One can grow while the other stays the same.',
            ],
            [
              'Wanting and liking run on different systems',
              'Good guess. The brain wants and likes through different systems, and repetition can turn up the wanting on its own.',
            ],
            ['My willpower is weak', 'Willpower is not the missing piece. The pull comes from a learned wanting signal, and you can learn to outlast it.'],
            ['It is just how I am made', 'The pull was learned through repetition. It is a signal, not who you are.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['chain', { n: ['A cue', 'Wanting fires', 'The pleasure stays small'], i: ['phone', 'bolt', 'leaf'] }],
          h: 'Wanting and liking are two different systems.',
          b: [
            bP(
              'Wanting is the pull toward something. Liking is the pleasure when you get it. Repeat a habit enough and the wanting can get louder while the liking does not. That is why the pull can feel huge and the reward can feel small.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '2', s: 'separate systems in the brain: wanting and liking' }],
          h: 'Scientists found that the brain wants and likes in different ways.',
          b: [
            bP(
              'Kent Berridge and Terry Robinson have studied this for decades. Wanting runs on large brain systems that include dopamine. Liking runs on smaller systems that do not depend on it. In addiction, they argue, wanting grows much stronger, most of all when a cue sets it off, without liking growing with it.',
            ),
          ],
          so: 'A strong pull does not mean porn is good for you, or that you love it. It means the wanting signal was trained.',
          fact: { s: 'Review · Berridge & Robinson, 2016', i: [0] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['chain', { n: ['Early: mostly pleasure', 'Later: mostly relief', 'More and more by habit'], i: ['sparkle', 'leaf', 'dots'] }],
          h: 'Over time, the reason for a habit can change.',
          b: [
            bP(
              'A model of addictive habits called I-PACE describes a shift over time. Early on, the habit is mostly about pleasure. Later, it is more about getting away from bad feelings, and it runs more by habit, while cues get a stronger pull.',
            ),
          ],
          so: 'If porn feels less fun but harder to stop, that fits this pattern. It is not a sign that something is wrong with you.',
          fact: { s: 'Model · Brand et al., 2019', i: [1] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'pencil' }],
          h: 'When the pull is strong, call it wanting.',
          b: [
            bL([
              '**Say it:** “This is wanting, not liking.”',
              '**Remember honestly:** how did it feel ten minutes after, last time?',
              '**Wait:** wanting rises and falls. Give it ten minutes.',
            ]),
            bP('You are not arguing with the urge. You are naming what it is.'),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'An urge hits, and a thought says, “You really need this.” What is the most accurate reply?',
          ask: 'Pick the best move.',
          a: 2,
          c: [
            [
              'Agree. If I want it this much, I must need it',
              'How strong a pull feels is not a measure of need. Wanting can grow far louder than the pleasure ever was.',
            ],
            ['Argue with the thought until it stops', 'Arguing keeps your attention on it. A name is quicker: this is wanting.'],
            ['Name it: this is wanting, and wanting passes', 'Yes. You see the signal for what it is, and you outlast it.'],
            ['Give in once, to prove I am in control', 'Each time the pull is followed, the wanting signal gets more practice. Outlasting it gives it less.'],
          ],
        },
      ],
      rc: {
        q: 'Late at night the pull feels stronger than ever, even though last time felt empty after. What explains it best?',
        c: ['I must enjoy it more than I think', 'The wanting is louder than the pleasure', 'Something is wrong with me', 'I am just more tired of quitting'],
        a: 1,
        r: 'Wanting and liking are different. A loud pull can come with a small reward.',
        cr: [
          'Not quite. Wanting and enjoying are different. The pull can grow while the pleasure stays small.',
          'Right. The wanting signal can be much louder than the pleasure. Name it, and outlast it.',
          'Not quite. A loud pull is a learned signal, not a flaw in you.',
          'Not quite. Being tired can turn the pull up, but the bigger point is that wanting is not liking.',
        ],
      },
      scope:
        'Berridge and Robinson built this idea over decades of research, and it now helps explain many habits, porn among them. I-PACE brings together research on habits like gaming, gambling and porn. What it means for you: a strong pull is a learned signal, and you can outlast it.',
      src: src('berridge', 'ipace'),
    },
    {
      id: 'l34',
      u: 8,
      v: 2,
      chk: 'October 16, 2026',
      title: 'The cue comes first',
      tag: 'The pull often starts at a signal, before anything is on the screen.',
      ic: 'phone',
      mins: 3,
      ask: 'Why does the urge start before I have even seen anything?',
      key: 'Your brain has learned which signals come before porn: a time, a place, a mood, an app. The pull starts at the signal. Learn your signals, and act at the first one.',
      np: 'The first signal I notice, before the urge',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['chain', { n: ['Sunday, 11 PM', 'In bed, phone in hand', 'The pull starts'], i: ['moon', 'phone', 'bolt'] }],
          h: 'Sunday, 11 PM. You are in bed with your phone. Nothing is on the screen yet. Why is the pull already there?',
          b: [bP('Many people know this scene. Nothing has happened, and the urge is already building. This lesson is about where it comes from.')],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In a brain-scan study, when did men with problem porn use react more than other men?',
          ask: 'Make your best guess.',
          a: 1,
          c: [
            [
              'When the explicit picture came on the screen',
              'That is the common guess. But the difference came earlier, at the signal that a picture was coming.',
            ],
            [
              'At the signal that porn was about to come',
              'Good guess. Their reward areas reacted more to the signal. The pictures themselves got about the same response as in other men.',
            ],
            ['Only after a long time looking', 'The difference came before anything was shown, at the signal.'],
            ['There was no difference at all', 'There was a difference, and it came at the signal, before any picture.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'bolt' }],
          h: 'The pull starts at the signal.',
          b: [
            bP(
              'Your brain has learned what comes before porn: being alone in bed, an app, a mood, an hour. When the signal shows up, the wanting starts, before you have seen anything. Nothing is wrong with you. Your brain learned the pattern it was taught.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '52', s: 'men in a brain-scan study' }],
          h: 'Men with problem porn use reacted most to the signal, not the picture.',
          b: [
            bP(
              'In a brain-scan study, men seeking treatment for problem porn use and men without it saw a signal, then a picture. The men with problem use had a stronger response in a reward area of the brain to signals that an erotic picture was coming. Their response to the pictures themselves was about the same. The stronger the response to the signal, the more porn they said they used.',
            ),
          ],
          so: 'The hard moment usually starts at the signal. That is the best place to step in.',
          fact: { s: 'Brain-scan study · 52 men · Gola et al., 2017', i: [0] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'compass' }],
          h: 'Find your signals, and act at the first one.',
          b: [
            bL([
              '**Name your signals:** a time, a place, a mood, an app.',
              '**Pick a move for the first one:** phone on the charger outside the room, or stand up and leave.',
              '**Do it at the signal,** while the pull is still small.',
            ]),
            bP('Here is what your log shows so far:'),
            ['mylog'],
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'You notice you just opened the app you usually scroll before a slip. No urge yet. What is the best move?',
          ask: 'Pick the best move.',
          a: 3,
          c: [
            ['Wait and see if an urge actually comes', 'By the time the urge is big, it is harder. The signal is your early warning.'],
            ['Keep scrolling, but stop if it gets bad', 'The app is the signal. Staying in it lets the pull build.'],
            ['Feel bad that you opened it again', 'Opening it is a habit, not a verdict on you. Use it as information.'],
            ['Close the app and do your plan now, while it is easy', 'Yes. You acted at the signal, when the pull is smallest.'],
          ],
        },
      ],
      rc: {
        q: 'Every night your phone charges next to your bed, and most slips start there. What is the move that starts at the signal?',
        c: ['Try harder to resist once in bed', 'Charge the phone outside the bedroom', 'Use only safe apps in bed', 'Wait for an urge, then act'],
        a: 1,
        r: 'Act at the signal. Here, the signal is the phone in bed.',
        cr: [
          'Not quite. By then the signal has already started the pull. Change the signal instead.',
          'Right. The phone in bed is the signal. Moving it means the pull never gets started.',
          'Not quite. The phone in bed is still the signal, whatever app is open.',
          'Not quite. Waiting means acting when the pull is already big. Act at the signal.',
        ],
      },
      scope:
        'This study looked at men seeking help for their porn use. It shows the pull starting at the signal, before any picture, which is why acting at the first signal works so well.',
      src: src('gola'),
    },
    {
      id: 'l35',
      u: 8,
      v: 2,
      chk: 'October 16, 2026',
      title: 'Catch the autopilot',
      tag: 'Habits start without a decision. Watching for them helps.',
      ic: 'shield',
      mins: 3,
      ask: 'How do I stop something that starts before I even decide?',
      key: 'Habits run on autopilot, started by familiar places and times. Watch for the moment it starts, and tell yourself “not this time.” For strong habits, watching worked better than the other ways people tried.',
      np: 'The moment my autopilot usually starts, and what I will tell myself',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['icon', { ic: 'phone' }],
          h: 'Have you ever found yourself halfway there, without remembering a decision to start?',
          b: [bP('That is autopilot. A habit can start before you choose anything. This lesson is about catching it.')],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In diary studies, what worked best against strong bad habits?',
          ask: 'Make your best guess.',
          a: 2,
          c: [
            [
              'Keeping the temptation out of sight',
              'In these studies, that helped with passing temptations, but did little for strong habits. Something else worked better for those.',
            ],
            ['Distracting myself with something else', 'Distraction did little for strong habits in these studies.'],
            [
              'Watching for the habit and telling myself “do not”',
              'Good guess. Watching for slips and telling themselves not to do it worked best for strong habits.',
            ],
            ['Nothing works on a strong habit', 'Something did work: watching for it, and telling yourself not to.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'shield' }],
          h: 'Watch for the start, and tell yourself “not this time.”',
          b: [
            bP(
              'A habit is a shortcut the brain takes in a familiar setting. You cannot always stop the shortcut from starting. You can learn to catch it early. Watching for it brings your own choice back into a moment that was running on its own.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '2', s: 'diary studies of everyday habits' }],
          h: 'For strong habits, watching for slips worked best.',
          b: [
            bP(
              'Researchers had people keep diaries of trying to control their bad habits and temptations. For strong habits, one way stood out: watching for slips and telling themselves not to do it. Other ways, like keeping the temptation out of sight, did little for strong habits. An experiment suggested that watching works by boosting control in the moment, not by erasing the habit.',
            ),
          ],
          so: 'You do not need the habit to disappear first. You need to notice it starting.',
          fact: { s: 'Diary studies · Quinn, Pascoe, Wood & Neal, 2010', i: [0] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['loop', { n: ['Same place', 'Same time', 'Same action', 'Starts by itself'], c: 'A HABIT' }],
          h: 'Habits are started by the places and times where they repeat.',
          b: [
            bP(
              'A large review of habit research describes habits as actions repeated in the same settings, until the setting itself starts them. That is why an hour of the night or a spot on the couch can start a routine before you think about it.',
            ),
          ],
          so: 'Your autopilot has a starting place. Learn it, and you know where to watch.',
          fact: { s: 'Review · Wood & Rünger, 2016', i: [1] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'timer' }],
          h: 'Set a watch for your autopilot moment.',
          b: [
            bL([
              '**Pick the moment:** the time or place it usually starts.',
              '**Watch for it:** when you get there, notice what your hands are doing.',
              '**Say it:** “Not this time.” Then do your plan.',
            ]),
            bP('Catching it late still counts. Every catch is practice.'),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'You notice your thumb already opening the browser at 11 PM. What gives you the best chance?',
          ask: 'Pick the best move.',
          a: 1,
          c: [
            ['Let it go this time, since it already started', 'Started is not finished. Catching it now is exactly the skill.'],
            ['Stop, say “not this time,” and put the phone down', 'Yes. You caught the autopilot and took back the next step.'],
            ['Think about how weak you are', 'Blame pulls your attention onto yourself. Watching and stopping is enough.'],
            ['Keep going, but quickly, to get it over with', 'That gives the habit more practice. Catching it, even late, gives it less.'],
          ],
        },
      ],
      rc: {
        q: 'You find yourself on the same spot on the couch, phone in hand, the way it usually starts. What is the move?',
        c: [
          'Hope no urge comes tonight',
          'Notice it, and tell yourself “not this time”',
          'Throw the phone across the room',
          'Feel ashamed it is happening again',
        ],
        a: 1,
        r: 'Watch for the autopilot, and tell yourself “not this time.”',
        cr: [
          'Not quite. Hoping leaves the autopilot in charge. Watching puts you back in it.',
          'Right. You caught the start, which is where watching works best.',
          'Not quite. A big reaction is hard to repeat. A calm “not this time” is something you can do every night.',
          'Not quite. Shame pulls attention onto you. Notice the habit, and take the next step yourself.',
        ],
      },
      scope:
        'These studies looked at everyday habits people wanted to break. Watching for the habit gave them control in the moment. Pair it with changing your setting, and the habit has less and less to work with.',
      src: src('quinn', 'woodrunger'),
    },
    {
      id: 'l36',
      u: 8,
      v: 2,
      chk: 'October 16, 2026',
      title: 'What the habit does for you',
      tag: 'Often it is less about pleasure, and more about relief.',
      ic: 'compass',
      mins: 3,
      ask: 'What is porn actually doing for me in a hard moment?',
      key: 'Over time, many habits shift from pleasure toward relief: a way out of stress, boredom, or a low mood. Your log can show which feeling you are getting away from. Plan for that feeling, not only for the urge.',
      np: 'The feeling I most often reach for porn to get away from',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['icon', { ic: 'ext' }],
          h: 'Is it really about pleasure, or about getting away from something?',
          b: [
            bP(
              'After a long day, an argument, or a quiet, empty evening, the urge can show up like an exit sign. This lesson uses your own log to see what you are reaching for.',
            ),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In a well-known model of addictive habits, what tends to drive the habit later on?',
          ask: 'Make your best guess.',
          a: 0,
          c: [
            [
              'Getting away from bad feelings, like stress or a low mood',
              'Good guess. The model describes a shift: early on it is about pleasure, later more about relief.',
            ],
            ['Wanting more and more pleasure', 'Early on, pleasure plays a big part. The model says that later, relief from bad feelings matters more.'],
            ['Boredom, and nothing else', 'Boredom can be part of it. The wider pattern is getting away from any bad feeling: stress, a low mood, loneliness.'],
            ['It stays the same from start to finish', 'The model describes a change over time: from pleasure toward relief.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['chain', { n: ['Stress or a low mood', 'The habit', 'Short relief'], i: ['bolt', 'phone', 'leaf'] }],
          h: 'Often the habit is an exit from a feeling.',
          b: [
            bP(
              'When something feels bad, porn offers quick relief. The relief is real, and it is short. The feeling is usually still there after. Seeing which feeling you are leaving gives you something better to do with it.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['chain', { n: ['Early: mostly pleasure', 'Later: mostly relief'], i: ['sparkle', 'leaf'] }],
          h: 'Over time, habits tend to shift from pleasure to relief.',
          b: [
            bP(
              'The I-PACE model pulls together research on addictive habits, including problem porn use. It describes how, over time, a habit tends to be driven less by pleasure and more by getting away from bad feelings, while cues pull harder and holding back in the moment gets harder.',
            ),
          ],
          so: 'Your hard moments may be pointing at what you need: rest, calm, company, or a way to handle stress.',
          fact: { s: 'Model · Brand et al., 2019', i: [0] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'calendar' }],
          h: 'Use your log to find the feeling under the urge.',
          b: [
            bP('Here is what your log shows:'),
            ['mylog'],
            bL([
              '**Look at what sets it off most.** What feeling is usually there?',
              '**Pick one thing for that feeling:** a walk for stress, a person for loneliness, sleep for tired.',
              '**Do it early,** when the feeling starts.',
            ]),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'Your log shows most urges come after hard workdays. What is the best plan?',
          ask: 'Pick the best move.',
          a: 2,
          c: [
            ['Be stricter with myself on workdays', 'Being strict does not touch the stress, and the stress is what needs a plan.'],
            ['Stop logging workdays, so the pattern goes away', 'Hiding the pattern hides the answer. The log is what found it.'],
            ['Plan a way to unwind right after work', 'Yes. You are meeting the stress itself, before it turns into an urge.'],
            ['Accept that workdays will always end this way', 'The pattern is real, but it is not fixed. A plan for the stress can change it.'],
          ],
        },
      ],
      rc: {
        q: 'Right after an argument, an urge shows up fast. What does this lesson suggest?',
        c: [
          'Ignore the argument and fight the urge',
          'Notice the upset, and do something for that feeling',
          'Decide arguments are not a real trigger',
          'Give in, since it was a hard day',
        ],
        a: 1,
        r: 'The habit is often an exit from a feeling. Meet the feeling.',
        cr: [
          'Not quite. The upset is the reason the urge showed up. Meeting it makes the urge smaller.',
          'Right. The urge is offering relief from the upset. Give yourself a better kind of relief.',
          'Not quite. If urges follow arguments, that is a pattern worth a plan.',
          'Not quite. A hard day is a reason to take care of yourself, and porn only gives short relief.',
        ],
      },
      scope:
        'I-PACE brings together many studies of habits like this one. Your log shows what goes along with your urges, and that is exactly what to plan for.',
      src: src('ipace'),
    },

    /* ---------- unit 9: becoming someone new ---------- */
    {
      id: 'l37',
      u: 9,
      v: 2,
      chk: 'October 16, 2026',
      title: 'Who you are becoming',
      tag: 'People who recover often come to see themselves differently.',
      ic: 'star',
      mins: 3,
      ask: 'Can I really stop seeing myself as someone with this problem?',
      key: 'Recovery is often a change in who you are, not only in what you do. In a treatment study, the more people came to see themselves as being in recovery rather than as users, the better they did later. You can start that change now.',
      np: 'Who I am becoming, in one sentence',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['icon', { ic: 'star' }],
          h: 'Do you think of yourself as “someone with a porn problem”?',
          b: [
            bP('Many people do. That label can stick long after things start to change. This lesson is about how people come to see themselves differently.'),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In a study of people in addiction treatment, what went along with doing better later?',
          ask: 'Make your best guess.',
          a: 3,
          c: [
            [
              'Remembering every mistake so as not to repeat it',
              'Learning from mistakes helps. But what went with doing better was a change in how people saw themselves.',
            ],
            ['Keeping their old identity, with fewer slips', 'The people who did better tended to let the old identity fade.'],
            ['Not thinking about who they are at all', 'How people saw themselves turned out to matter.'],
            ['Seeing themselves less as users, and more as people in recovery', 'Good guess. The bigger that shift, the better people did later.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'sunrise' }],
          h: 'Recovery is often a change in who you are.',
          b: [
            bP(
              'You are not only stopping something. You are becoming someone. People who recover often describe a new or a restored sense of self: a parent again, a friend again, a person they respect. That identity is built in small steps, and often with other people.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '132', s: 'adults in a treatment community' }],
          h: 'As people saw themselves less as users, they did better later.',
          b: [
            bP(
              'Researchers followed 132 adults through a residential treatment community for alcohol and drugs. Over the first month, most came to see themselves less as users and more as people in recovery. The bigger that shift, the less often they drank and the more satisfied with life they were later on.',
            ),
          ],
          so: 'How you see yourself is not a side issue. It is part of the change.',
          fact: { s: 'Study · 132 adults · Dingle, Stark, Cruwys & Best, 2015', i: [0] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['chain', { n: ['New people', 'New things to do', 'A new sense of self'], i: ['chat', 'sunrise', 'star'] }],
          h: 'A new identity often grows through the people around you.',
          b: [
            bP(
              'A model of recovery built from this kind of research says that identity changes through people and activities: groups who share the change, and things to do that mean something to you.',
            ),
          ],
          so: 'Someone who knows who you are becoming makes the new you easier to keep.',
          fact: { s: 'Model · Best et al., 2016', i: [1] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'pencil' }],
          h: 'Start using the new sentence now.',
          b: [
            bL([
              '**Write who you are becoming,** in one sentence.',
              '**Act like that person once today:** one small thing they would do.',
              '**Tell one person,** or find a group, when you are ready.',
            ]),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'You have gone two weeks without a slip, but still think, “I am an addict.” What fits this lesson best?',
          ask: 'Pick the best move.',
          a: 1,
          c: [
            ['Keep that label, so you stay careful', 'Being careful is good. But holding on to the old identity did not go with doing better.'],
            ['Start saying who you are becoming, and act like it', 'Yes. The new identity is built by saying it and living it, a little at a time.'],
            ['Wait a year before seeing yourself differently', 'You do not have to wait. In the study, the shift started in the first month.'],
            ['Forget about identity and only count days', 'Days help. But how people saw themselves mattered for how they did later.'],
          ],
        },
      ],
      rc: {
        q: 'After a hard week, a thought says, “People like me never change.” What does this lesson say?',
        c: [
          'That thought is probably right',
          'People change who they are, a little at a time',
          'Only people with perfect records change',
          'Identity does not matter, only behavior',
        ],
        a: 1,
        r: 'Recovery is often a change in who you are, built a little at a time.',
        cr: [
          'Not quite. In the study, most people shifted how they saw themselves within a month.',
          'Right. The new identity is built in small steps, and it is already starting.',
          'Not quite. Nobody in recovery has a perfect record. The shift is in who you see yourself as.',
          'Not quite. How people saw themselves went along with how they did later.',
        ],
      },
      scope:
        'This study followed adults recovering from alcohol and drugs. The same change is open to you: as you come to see yourself differently, the habit loses its grip.',
      src: src('dingle', 'best'),
    },
    {
      id: 'l38',
      u: 9,
      v: 2,
      chk: 'October 16, 2026',
      title: 'Say “I do not”',
      tag: 'A no that sounds like a choice works better than one that sounds like a rule.',
      ic: 'flag',
      mins: 2,
      ask: 'What do I say to myself when the urge asks for “just once”?',
      key: '“I cannot” sounds like a rule someone put on you. “I do not” sounds like who you are. In studies, people who said no in the “I do not” way stuck with their goals more.',
      np: 'My “I do not” sentence',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['icon', { ic: 'chat' }],
          h: 'When the urge argues with you, what do you say back?',
          b: [bP('Many people say “I cannot,” or “I am not allowed.” This lesson is about two small words that change how a no feels.')],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'Which way of saying no helped people stick with a goal in studies?',
          ask: 'Make your best guess.',
          a: 1,
          c: [
            ['“I cannot do that”', '“I cannot” sounds like a rule from outside. In the studies, it helped less.'],
            ['“I do not do that”', 'Good guess. “I do not” sounds like a choice about who you are, and it helped people stick with their goals.'],
            ['A plain “no,” with no reason', 'A plain no helped less than “I do not” did.'],
            ['It makes no difference how you say it', 'It did make a difference. The words shape how the no feels.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'flag' }],
          h: 'Say “I do not,” as part of who you are.',
          b: [
            bP(
              '“I cannot” turns the urge into something you are being denied. “I do not” makes it a choice that fits who you are. A no that feels like your own is easier to keep.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '10', s: 'days of practice in one study' }],
          h: 'People who said “I do not” stuck with their goals more.',
          b: [
            bP(
              'In one study, people who told themselves they do not eat unhealthy food were more likely to pick a healthy snack afterward than people who told themselves they cannot. In another, women working on a health goal practiced one way of saying no for ten days, and the “I do not” group kept going more often. Saying “I do not” made people feel more in charge.',
            ),
          ],
          so: 'Your no works better when it sounds like a choice about who you are.',
          fact: { s: 'Experiments · Patrick & Hagtvedt, 2012', i: [0] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'pencil' }],
          h: 'Write your own “I do not” sentence.',
          b: [
            bL([
              '**Keep it short:** “I do not watch porn.”',
              '**Make it yours:** add who you are. “I do not watch porn. I keep my word to myself.”',
              '**Use it at the signal,** out loud if you can.',
            ]),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'An urge says, “Come on, just once.” Which reply fits this lesson best?',
          ask: 'Pick the best move.',
          a: 3,
          c: [
            ['“I cannot, I promised I would stop”', 'It can work, but “cannot” sounds like a rule from outside, and that can feel like losing something.'],
            ['“Maybe later”', 'That leaves the door open, and the urge will ask again.'],
            ['“I am too weak to stop anyway”', 'That is not true, and it gives the urge the last word. Say what you choose.'],
            ['“I do not do that anymore”', 'Yes. It is a choice about who you are, not a rule someone set.'],
          ],
        },
      ],
      rc: {
        q: 'A friend offers to send you a link you know would be a slip for you. What is the strongest thing to tell yourself?',
        c: ['“I cannot, I am not allowed”', '“I do not do that”', '“Not right now”', '“I will just look once”'],
        a: 1,
        r: 'Say no as a choice about who you are: “I do not.”',
        cr: [
          'Not quite. “Not allowed” is a rule from outside. “I do not” is your own choice.',
          'Right. “I do not” says who you are, and that kind of no is easier to keep.',
          'Not quite. “Not right now” invites the question again later.',
          'Not quite. “Just once” is the urge talking. “I do not” answers it.',
        ],
      },
      scope:
        'These studies were about food and health goals, and the idea carries straight over: a no that sounds like your own choice is easier to keep. Use it along with your plan.',
      src: src('patrick'),
    },
    {
      id: 'l39',
      u: 9,
      v: 2,
      chk: 'October 16, 2026',
      title: 'A year from now',
      tag: 'Picture the person you are becoming, and give them a say.',
      ic: 'sunrise',
      mins: 3,
      ask: 'How can thinking about my future self help tonight?',
      key: 'Future you can feel like a stranger, so their needs lose to tonight’s urge. Make them real: picture them, and write in their words. In studies, people who saw their future selves chose the later reward more often.',
      np: 'A few words from me, a year from now',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Picture this',
          art: ['chain', { n: ['Tonight', 'The urge', 'You, a year from now'], i: ['moon', 'bolt', 'sunrise'] }],
          h: 'It is late, and the urge says tonight is all that matters. Who is missing from the room?',
          b: [bP('Future you. The person who will live with what you do tonight. This lesson brings them in.')],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In studies, what helped people choose a later reward over a quick one?',
          ask: 'Make your best guess.',
          a: 2,
          c: [
            ['Thinking harder about the rules', 'Rules can help, but here something more personal worked: seeing their future selves.'],
            ['Feeling guilty about the past', 'Guilt looks back. What helped here looked forward, at a future self.'],
            ['Seeing an older picture of their own face', 'Good guess. People who saw an older version of themselves chose the later reward more often.'],
            ['Nothing. People always choose now', 'People do lean toward now, but seeing their future selves shifted that.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'sunrise' }],
          h: 'Make future you real, and give them a say.',
          b: [
            bP(
              'When future you feels like a stranger, tonight wins. When you can picture them, their needs count. You are not giving something up. You are looking after someone you are becoming.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'sunrise' }],
          h: 'People who met their future selves chose more for later.',
          b: [
            bP(
              'In a set of studies, people saw computer images of their own faces made to look older, some of them in virtual reality. Afterward, they were more willing to take money later over money now, and they put more toward retirement in a savings task. Seeing the future self made it feel closer.',
            ),
          ],
          so: 'The person you are becoming is real. Picturing them makes tonight’s choice easier.',
          fact: { s: 'Experiments · Hershfield et al., 2011', i: [0] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'pencil' }],
          h: 'Write three lines from you, a year from now.',
          b: [
            bL([
              '**Where you are:** what is different about your mornings, your mind, your people?',
              '**What you are glad about:** what did you do on the hard nights?',
              '**A word for tonight:** what would they tell you right now?',
            ]),
            bP('Keep it short. Read it when an urge comes.'),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'An urge hits, and a thought says, “Nothing changes if I give in once.” What would future you say?',
          ask: 'Pick the best answer.',
          a: 0,
          c: [
            ['“Tonight counts. I am the one who lives with it.”', 'Yes. Future you is real, and tonight is part of who they become.'],
            ['“Do whatever you want, it does not matter”', 'Future you would not say that. Tonight is part of how they get there.'],
            ['“You will never change”', 'That is the urge talking, not future you. People change one night at a time.'],
            ['“Wait until you feel stronger”', 'Waiting to feel ready keeps tonight in charge. Future you is asking for this night.'],
          ],
        },
      ],
      rc: {
        q: 'You are tired, and an urge says, “Tonight does not matter.” What helps most?',
        c: [
          'Picture yourself a year from now, and ask what they need',
          'Go over every past slip',
          'Promise to start fresh next month',
          'Tell yourself the future is too far away to matter',
        ],
        a: 0,
        r: 'Give future you a say. They are the one who lives with tonight.',
        cr: [
          'Right. When future you feels real, their needs count tonight.',
          'Not quite. Going over the past brings guilt, not help. Look forward instead.',
          'Not quite. Next month puts the change off. Future you is asking for tonight.',
          'Not quite. That is exactly the gap this lesson closes: make the future feel near.',
        ],
      },
      scope:
        'These studies were about saving money for later, and the idea carries straight over: when future you feels close, they get a say in what you do tonight.',
      src: src('hershfield'),
    },
    {
      id: 'l40',
      u: 9,
      v: 2,
      chk: 'October 16, 2026',
      title: 'Your log is your evidence',
      tag: 'Each urge you ride out is proof of who you are becoming.',
      ic: 'check',
      mins: 2,
      ask: 'How do I start to believe I am someone who is free of this?',
      key: 'You do not have to believe it first. Each urge you ride out is a vote for who you are becoming, and your log keeps the count. On a hard day, look at the evidence.',
      np: 'What my log says about who I am becoming',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['icon', { ic: 'check' }],
          h: 'Does “I am someone who is free of this” feel true yet?',
          b: [
            bP(
              'For many people, it does not feel true at first. This lesson is about where that belief comes from: not from forcing the feeling, but from evidence.',
            ),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'What helps a new way of seeing yourself feel true?',
          ask: 'Make your best guess.',
          a: 1,
          c: [
            ['Repeating it until you believe it', 'Words help most when something stands behind them. Belief grows from what you do.'],
            ['Small actions that add up, written down', 'Good guess. Each action is evidence, and a record lets you see it add up.'],
            ['One big change of heart', 'Big moments happen, but most change is built from many small ones.'],
            ['A long time with no slips at all', 'You do not need a perfect record. Every urge you ride out counts, even after a slip.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'check' }],
          h: 'Each urge you ride out is a vote for who you are becoming.',
          b: [
            bP(
              'Writer James Clear puts it this way: every action is a vote for the type of person you wish to become. One vote does not decide it. Many votes do. A slip is one vote, not the whole count.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '138', s: 'experiments on tracking progress' }],
          h: 'Writing progress down helps people reach their goals.',
          b: [
            bP(
              'A large review of 138 experiments found that prompting people to track their progress toward a goal helped them reach it, and more so when the progress was written down or shared.',
            ),
          ],
          so: 'Your log is not a scoreboard. It is the record of the votes you have cast.',
          fact: { s: 'Meta-analysis · 138 experiments · Harkin et al., 2016', i: [1] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'calendar' }],
          h: 'Count your votes.',
          b: [
            bP('Here is what your log shows:'),
            ['mylog'],
            bL([
              '**Look at the urges you rode out.** Each one is a vote.',
              '**Say it plainly:** “I am someone who rides out urges.”',
              '**Add one more vote today,** however small.',
            ]),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'After a slip, a thought says, “See? This is who you really are.” What does your log say?',
          ask: 'Pick the best answer.',
          a: 2,
          c: [
            ['It agrees. One slip shows the truth', 'One slip is one vote. Your log holds many more.'],
            ['Nothing. A log does not mean anything', 'Your log is the evidence. It shows what you have actually done.'],
            ['It shows every urge I rode out, and one hard night', 'Yes. The whole count is the truth, not the last entry.'],
            ['Better to delete the slip so the log looks clean', 'An honest log is what makes the evidence believable. Keep the slip. It is one vote.'],
          ],
        },
      ],
      rc: {
        q: 'This month you rode out ten urges and slipped once. How do you see yourself?',
        c: [
          'As someone who failed this month',
          'As someone who rides out urges, with one hard night',
          'As someone who has to start over',
          'As someone who got lucky ten times',
        ],
        a: 1,
        r: 'Count every vote. The whole record says who you are becoming.',
        cr: [
          'Not quite. Ten urges ridden out are ten votes. One slip does not erase them.',
          'Right. That is the honest count, and it is the evidence of who you are becoming.',
          'Not quite. Nothing resets. Your votes are still there.',
          'Not quite. Ten times is not luck. It is practice, and it is yours.',
        ],
      },
      scope:
        'The “vote” idea comes from James Clear’s book Atomic Habits. The review of 138 experiments shows why it works: a record you look back at helps you reach your goal.',
      src: src('clearvote', 'harkin'),
    },
    /* ---------- unit 5, seeing your pattern: the science behind Talk it through and Rekindle ---------- */
    {
      id: 'l41',
      u: 4,
      v: 2,
      chk: 'October 18, 2026',
      title: 'The picture and the real thing',
      tag: 'Replaying it turns the pull up. Noticing what it really gives turns it down.',
      ic: 'sun',
      mins: 3,
      ask: 'When I keep thinking about a slip, before it or after it, am I making it worse?',
      key: 'It depends on how you look. Replaying the picture (the time, the place, the details) turns the pull up. Noticing the real thing (what it does in your body, and what it gives you after) turns it down. Look at the real thing, with curiosity, not shame.',
      np: 'What I picture before, and what it really gives me after',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['chain', { n: ['Picturing it all day', 'The real thing', 'Flat, ten minutes after'], i: ['dots', 'bolt', 'leaf'] }],
          h: 'Have you ever pictured it all afternoon, and then felt flat ten minutes after it happened?',
          b: [
            bP(
              'Many people know this. The picture before is bright and loud. The real thing is smaller than it promised. This lesson is about that gap, and how to use it.',
            ),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'Which kind of thinking makes the pull weaker over time?',
          ask: 'Make your best guess.',
          a: 2,
          c: [
            [
              'Not thinking about it at all',
              'A common hope. But looking away leaves the picture in charge, and you never see what the habit really gives. A short, honest look does more.',
            ],
            [
              'Going over the plan in detail, to feel in control',
              'That is replaying, and replaying turns the pull up. Each run through the details makes it louder.',
            ],
            [
              'Noticing what it really does, in my body and after',
              'Good guess. Honest noticing shows the habit gives less than it promised, and that wears the pull down.',
            ],
            [
              'Thinking hard about how bad I am',
              'Shame is not the same as seeing clearly. In a study of people in recovery, those who showed more shame were more likely to relapse.',
            ],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['chain', { n: ['The picture: louder', 'The real thing: smaller', 'Seen clearly: weaker'], i: ['dots', 'leaf', 'sun'] }],
          h: 'Picturing it feeds the pull. Noticing the real thing wears it down.',
          b: [
            bP(
              'Going over the plan (the time, the place, what you would watch) is like a highlight reel. It turns the wanting up, and the reel always looks better than the real thing. When you notice what really happens, in your body and in the hour after, your brain gets honest information. Over time, the habit loses its shine.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['research', { k: 'loop' }],
          h: 'Replaying the details turns the pull up.',
          b: [
            bP(
              'Researchers call it desire thinking: picturing the thing you want, and going over it again and again in words. In studies of drinking, smoking, gambling and time online, more of it went with stronger craving. Studies of porn use find the same: in one with 191 adults, desire thinking turned up the craving for porn.',
            ),
          ],
          so: 'When you catch yourself planning the details, that is the replay. Naming it, “that is the picture,” is the first step out of it.',
          fact: { s: 'Study · Caselli & Spada, 2015 · Study · 191 adults · Allen et al., 2017', i: [0, 5] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['research', { k: 'lens' }],
          h: 'Noticing with curiosity wears a habit down.',
          b: [
            bP(
              'In a trial with 88 adult smokers, people trained to notice and explore their cravings with curiosity, instead of acting on them, did far better than people in a standard quit program: four months later, 31% were not smoking, against 6%. In a study of people who overeat, paying close attention to how eating on a craving really felt made it feel less rewarding, and that drop predicted eating less.',
            ),
          ],
          so: 'Each honest look, before a slip or after one, teaches your brain what the habit really gives. That is how the pull shrinks.',
          fact: { s: 'Trial · 88 smokers · Brewer et al., 2011 · Study · Taylor et al., 2021', i: [1, 2] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'compass' }],
          h: 'Look at the real thing, before and after.',
          b: [
            bL([
              '**When you catch the picture:** name it, “that is the replay.” Then decide while you are calm, before the night comes.',
              '**If a slip happens anyway:** do not rush through it in a blur. Notice your body, and how you feel ten minutes after.',
              '**After:** look back honestly. What did you expect it to give, and what did it really give?',
            ]),
            bP('Talk it through and Rekindle walk you through each step, and keep your own numbers, so you can see the gap for yourself.'),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'It is 4 PM. You keep picturing tonight: the time, the room, what you would watch. What is the best move?',
          ask: 'Pick the best move.',
          a: 1,
          c: [
            ['Keep going over the plan, so it feels under control', 'That is the replay. Each run through the details makes tonight’s pull louder.'],
            [
              'Name it as the picture, and talk it through now, while calm',
              'Yes. You caught the replay, and you are deciding while calm, when you can see most clearly.',
            ],
            ['Call yourself hopeless for planning it', 'Shame does not loosen the plan. An honest, curious look does.'],
            [
              'Wait until tonight, and decide then',
              'Tonight is the hardest time to decide. When you are not craving, you guess the pull will be weaker than it turns out to be, so decide now.',
            ],
          ],
        },
      ],
      rc: {
        q: 'You slipped last night. This morning the memory keeps playing, and you feel low. What does this lesson suggest?',
        c: [
          'Replay it until I understand every detail',
          'Push it away and never think about it',
          'Take one honest look: what it gave, and how I felt after',
          'Decide I will never change',
        ],
        a: 2,
        r: 'Look at the real thing, briefly and honestly. That is what wears a habit down.',
        cr: [
          'Not quite. Replaying the details keeps the picture loud. One honest look at what it gave helps more.',
          'Not quite. Looking away leaves the picture in charge. A short, honest look is what teaches your brain.',
          'Right. What it gave, and how you felt after, is the real information. That is what wears the habit down.',
          'Not quite. A slip is information, not a verdict. Seeing it clearly is how change happens.',
        ],
      },
      scope:
        'Desire thinking has been studied across many habits, porn among them. The curiosity trial was with adults quitting smoking, and the noticing study with people who overeat: the same learning runs through every habit like this one. What it means for you: the picture pulls harder than the real thing, and every honest look narrows that gap.',
      src: src('caselli', 'brewer11', 'taylor21', 'sayette', 'tracy13', 'allen17'),
    },
    /* ---------- skills for the moment: the science behind the SOS moves that had no lesson of their own ---------- */
    {
      id: 'l42',
      u: 3,
      v: 2,
      chk: 'October 25, 2026',
      title: 'Crowd out the picture',
      tag: 'An urge runs on pictures. Give your eyes and hands something else.',
      ic: 'sparkle',
      mins: 3,
      ask: 'Why would a small puzzle help when an urge is strong?',
      key: 'An urge grows by painting pictures in your head, and those pictures need room. A puzzle for the eyes and hands takes that room, so the picture fades and the pull drops. In a week-long study, three minutes of a block game lowered cravings by about 14 points out of 100, and it kept working all week.',
      np: 'What my eyes and hands can do when an urge starts',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['chain', { n: ['One small thought', 'A whole picture', 'A strong pull'], i: ['bolt', 'dots', 'wave'] }],
          h: 'Has an urge ever started as one small thought, and then grown into a picture you could not stop seeing?',
          b: [
            bP(
              'That is how most urges grow. A thought pops up, and the mind starts painting it in. The brighter the picture, the stronger the pull. This lesson is about taking the paint away.',
            ),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In studies, which of these lowered cravings most?',
          ask: 'Make your best guess.',
          a: 2,
          c: [
            [
              'Counting backward in your head',
              'A good try, and it keeps the mind busy. But in the studies, number and word tasks did less. The pull runs on pictures, so a task for the eyes did more.',
            ],
            ['Telling yourself not to think about it', 'Fighting a picture keeps your eyes on it. Giving the mind something else to see works better.'],
            [
              'A few minutes of a block puzzle',
              'Good guess. Fitting shapes takes the same space in the mind that the urge uses for its pictures, so the pictures fade and the pull drops with them.',
            ],
            [
              'Sitting still and waiting it out',
              'Urges do pass. But in one study, people who waited in front of a loading screen felt more pull afterward than people who spent those minutes on a block game.',
            ],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['chain', { n: ['A picture grows', 'Shapes take the room', 'The pull fades'], i: ['dots', 'sparkle', 'leaf'] }],
          h: 'Give your eyes and hands a job, and the picture has no room.',
          b: [
            bP(
              'Your mind has a small screen for pictures, and it can only show so much at once. An urge needs that screen to paint what it wants. When you are busy fitting shapes onto a board, the screen is taken. The picture fades, and the pull fades with it. You are not fighting the urge. You are filling the space it needs.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'timer' }],
          h: 'Three minutes of a block game lowered cravings in daily life.',
          b: [
            bP(
              'For a week, 31 young adults got seven text messages a day asking about their cravings. Half of them played a block game for three minutes after each one. Their cravings dropped by about 14 points on a 100-point scale, for every kind they had: food, drinks, coffee, cigarettes, and activities, sexual urges among them. The drop held all week. An earlier lab study found the same: after a few minutes of the game, cravings were weaker and the pictures behind them were less vivid.',
            ),
          ],
          so: 'It works in real life, on real urges, and it keeps working. Every game you play is a small, true win.',
          fact: { s: 'Field study · 31 people · Skorka-Brown et al., 2015 · Lab study · Skorka-Brown et al., 2014', i: [1, 2] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'dots' }],
          h: 'It works because an urge runs on pictures.',
          b: [
            bP(
              'Researchers found that a craving draws its power from what the mind pictures: the taste, the feel, the moment. In smokers trying to quit, tasks for the eyes lowered craving, and tasks for the ears and for words did not do as much. Ten minutes of shaping clay with the hands lowered chocolate cravings, made the pictures fainter, and made the thoughts come less often. A study of 414 adults found the same start for this habit: picturing the scenes ahead of time went with a stronger craving.',
            ),
          ],
          so: 'Painting pictures is how an urge grows. Anything that keeps your eyes and hands busy takes its brush away.',
          fact: {
            s: 'Theory · Kavanagh et al., 2005 · Experiments · May et al., 2010 · Experiments · Andrade et al., 2012 · Study · 414 adults · Marino et al., 2023',
            i: [0, 3, 4, 5],
          },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'sparkle' }],
          h: 'When the picture starts, give your eyes and hands a puzzle.',
          b: [
            bL([
              '**Catch it early:** the moment the mind starts painting, that is your cue.',
              '**Play for about a minute:** drag shapes onto the board, and fill a row or a column to clear it. Plan where each one fits.',
              '**Keep your eyes on the board:** if the picture comes back, look at the next shape.',
              '**Then take the next step:** the pull is lower now. Use that space to stand up, move, or go to bed.',
            ]),
            bP('In SOS, Fit the shapes does this for you. Anything for the eyes and hands helps: in the studies, shaping clay worked too.'),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'It is late. An urge starts, and the picture keeps getting clearer. What is the best first move?',
          ask: 'Pick the best move.',
          a: 1,
          c: [
            ['Go over the picture in detail, to understand it', 'That paints it in further, and every detail makes the pull stronger.'],
            ['Spend a minute fitting shapes, eyes on the board', 'Yes. The board takes the room the picture needs, so the pull fades.'],
            ['Count backward from 100 in my head', 'It helps a little, but numbers and words leave the picture screen free. A task for the eyes does more.'],
            [
              'Scroll on my phone until it passes',
              'Scrolling keeps the eyes busy, but it is full of cues that start new pictures. A puzzle with nothing in it is the safer job.',
            ],
          ],
        },
      ],
      rc: {
        q: 'An urge starts as a picture, and the picture keeps getting brighter. What does this lesson suggest?',
        c: [
          'Push the picture away with all my strength',
          'Replay it, to see what I really want',
          'Wait in the dark until it is gone',
          'Give my eyes and hands a puzzle for a minute',
        ],
        a: 3,
        r: 'Give the picture something to compete with. A puzzle for the eyes and hands crowds it out.',
        cr: [
          'Not quite. Fighting a picture keeps your eyes on it. Giving your eyes something else to see works better.',
          'Not quite. Replaying paints the picture in further, and the pull grows with it.',
          'Not quite. Urges do pass, but waiting with nothing to do leaves the picture room to grow.',
          'Right. The puzzle takes the space the picture needs, and the pull fades with it.',
        ],
      },
      scope:
        'These studies measured cravings for food, drinks, cigarettes and everyday activities, sexual urges among them, in students and in adults quitting smoking, and the study of 414 adults tied picturing to craving for this habit itself. The finding is the same each time: when the eyes and hands are busy, the picture fades and the pull drops. In a week of daily life, a few minutes of a block game kept working every day. A minute of shapes is a real tool, and it is always in your pocket.',
      src: src('kavanagh05', 'skorka15', 'skorka14', 'may10', 'andrade12', 'marino23'),
    },
    {
      id: 'l43',
      u: 3,
      v: 2,
      chk: 'October 25, 2026',
      title: 'Come back to the room',
      tag: 'An urge pulls you into a picture. Your senses bring you back.',
      ic: 'compass',
      mins: 3,
      ask: 'When an urge pulls me into my head, how do I get back out?',
      key: 'An urge runs on a picture in your head, and that picture uses the same space as real seeing, feeling and smelling. Fill that space with the room around you, and the picture has less to run on. In studies, tasks for the eyes and the nose turned cravings down by about a fifth to a quarter, every time people used them.',
      np: 'The things around me that bring me back',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['chain', { n: ['An urge starts', 'A picture fills your head', 'The room comes back'], i: ['bolt', 'dots', 'leaf'] }],
          h: 'When an urge hits, where are you, really?',
          b: [
            bP(
              'Your body is in a room. Your mind is somewhere else, in a picture of what could happen next. This lesson is about the quickest way back, and it is already all around you.',
            ),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In studies, what turned a craving down the most?',
          ask: 'Make your best guess.',
          a: 1,
          c: [
            [
              'Counting backward, or thinking in words',
              'Word tasks helped a little. Tasks for the eyes and the nose helped more, because that is what a craving is made of.',
            ],
            [
              'Giving my eyes and nose something real to do',
              'Good guess. Tasks for the eyes and the nose turned cravings down most, because a craving is built from pictures and senses.',
            ],
            ['Telling myself firmly to stop', 'A firm “stop” still keeps your attention on the urge. Something real for your senses draws it away.'],
            ['Nothing. You can only wait it out', 'Urges do pass. And in studies, a short task for the senses turned the craving down while it did.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'compass' }],
          h: 'Give your senses something real, and the picture fades.',
          b: [
            bP(
              'When an urge is strong, your attention narrows onto it, and the picture in your head gets louder. That picture uses the same space in your mind as real seeing, feeling and smelling. Fill that space with what is actually around you, and there is less room for the picture. You are not fighting the urge. You are coming back to where you are.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'sun' }],
          h: 'Tasks for the eyes and the nose turned cravings down.',
          b: [
            bP(
              'Researchers who study cravings find they are built mostly from pictures and senses in the mind. In two experiments with 90 people each, picturing an ordinary scene or smell turned a craving down more than imagining sounds. In smokers going without, tasks for the eyes and hands beat counting backward. In another study, just smelling jasmine cut a craving more than smelling water. Across these studies, cravings dropped by about a fifth to a quarter, and the tasks kept working each time people used them.',
            ),
          ],
          so: 'In 5-4-3-2-1, seeing and feeling come first. Real things around you take up the space the picture was using.',
          fact: {
            s: 'Experiments · 90 people each · Kemps & Tiggemann, 2007 · Experiments · May et al., 2010 · Study · 67 people · Kemps et al., 2012 · Review · Kemps & Tiggemann, 2015',
            i: [0, 1, 2, 6],
          },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'leaf' }],
          h: 'Noticing what is here changes what you do next.',
          b: [
            bP(
              'In a trial with 123 smokers, people taught to notice an urge as feelings in the body, without acting on it, smoked fewer cigarettes over the next week. Their urges were just as strong. What changed was what they did. And 5-4-3-2-1 itself has been tested: after 48 nursing students learned it before an exam, the share with high test anxiety fell from 23% to 4%.',
            ),
          ],
          so: 'You do not have to make the urge disappear. Come back to the room, and let it pass by while you are somewhere real.',
          fact: { s: 'Trial · 123 smokers · Bowen & Marlatt, 2009 · Study · 48 students · Scott et al., 2026', i: [3, 4] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'dots' }],
          h: 'Count your way back: 5, 4, 3, 2, 1.',
          b: [
            bL([
              '**5 things you can see.** Name them plainly: a lamp, a door, your own hand.',
              '**4 things you can feel:** the chair, your clothes, the floor under your feet.',
              '**3 you can hear, 2 you can smell, 1 you can taste.** A sip of water counts.',
              '**If the picture comes back,** notice it, and return to the room. Coming back is the skill.',
            ]),
            bP('In SOS, 5-4-3-2-1 walks you through it, one tap for each thing you find.'),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'An urge hits while you are on the couch, and your mind is already running the picture. What is the best first move?',
          ask: 'Pick the best move.',
          a: 2,
          c: [
            [
              'Close my eyes and try hard not to picture it',
              'Closed eyes leave the picture with nothing to compete with. Open them, and give your eyes something real.',
            ],
            ['Keep watching the picture, to see if it fades', 'Watching the picture feeds it. Coming back to the room lets the urge pass you by.'],
            ['Look around and name 5 things I can see', 'Yes. Real things for your eyes take up the space the picture was using.'],
            ['Scroll on my phone until it passes', 'Scrolling keeps you in a screen, one tap from the habit. The room around you is the better place to look.'],
          ],
        },
      ],
      rc: {
        q: 'You start 5-4-3-2-1 during an urge, and by the sounds the picture is back. What now?',
        c: [
          'Stop, since it did not work',
          'Notice the picture, and go back to the room: 3 things I can hear',
          'Look at the picture again, to see what it wants',
          'Decide I am bad at this',
        ],
        a: 1,
        r: 'Coming back is the skill. Notice the picture, and return to the room, as many times as it takes.',
        cr: [
          'Not quite. A picture coming back is normal. Returning to the room again is the practice.',
          'Right. Noticing the picture and coming back is the move itself, and it works each time you use it.',
          'Not quite. Going back to the picture turns the pull up. The room is where it loosens.',
          'Not quite. Every mind drifts. Each return is a small win, not a test you failed.',
        ],
      },
      scope:
        '5-4-3-2-1 itself was tested in one small study, with nursing students before an exam and no comparison group, and they came out calmer. The strongest evidence sits right beside it: experiments where tasks for the eyes and the nose turned food and smoking cravings down, a trial where noticing urges helped smokers act on them less, and a review of 68 data sets where attention pulled toward a cue went with stronger craving. They all point the same way: an urge runs on attention and pictures, and the room around you is real, near, and always there to come back to.',
      src: src('kemps07', 'may10', 'kemps12', 'bowen', 'scott26', 'field09', 'kemps15'),
    },
    {
      id: 'l44',
      u: 3,
      v: 2,
      chk: 'October 25, 2026',
      title: 'Play it forward',
      tag: 'The urge only shows you the next ten minutes. Look at the hour after.',
      ic: 'compass',
      mins: 3,
      ask: 'What can I think about during an urge that makes it weaker?',
      key: 'The urge talks only about right now. Play it forward: picture the hour after giving in, then the hour after riding it out, and pick the hour you want. In studies, thinking of what comes later cut craving by about a third, and practicing it cut real use for weeks.',
      np: 'How I feel an hour after, both ways',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['chain', { n: ['The urge', 'Ten minutes', 'The hour after'], i: ['bolt', 'timer', 'compass'] }],
          h: 'The urge tells you how the next ten minutes will feel. What does it never tell you?',
          b: [bP('How you will feel an hour after. That hour is coming either way, and it is close enough to picture. This lesson is about looking at it.')],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'Smokers looked at pictures of cigarettes in a brain scanner. What lowered their craving by about a third?',
          ask: 'Make your best guess.',
          a: 1,
          c: [
            [
              'Trying hard not to want it',
              'A common first try. But fighting the want head on is tiring. What worked here was simpler: a change in what they thought about.',
            ],
            [
              'Thinking about what comes later',
              'Good guess. When they thought past the moment, to what smoking does over time, the craving dropped by about a third.',
            ],
            [
              'Telling themselves to be strong',
              'Pep talks can feel good, but this study tested something more specific: looking past the moment, to what comes later.',
            ],
            [
              'Nothing. A craving cannot be changed',
              'It can. The pictures stayed on the screen, and still the craving dropped when they thought about what comes later.',
            ],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['chain', { n: ['Now: the pull', 'The hour after', 'The hour I want'], i: ['bolt', 'compass', 'sun'] }],
          h: 'Look past the next ten minutes, to the hour after.',
          b: [
            bP(
              'The urge shows only the first few minutes. When you play it forward, the whole picture comes back: how you feel an hour after giving in, and how you feel an hour after riding it out. Seen side by side, the pull loses its grip. You do not have to fight it. You just see more.',
            ),
            bP('And it is a skill. Each time you play it forward, it comes a little quicker and works a little better.'),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'chart' }],
          h: 'Thinking of what comes later turns craving down.',
          b: [
            bP(
              'In a brain-scan study, 21 smokers looked at pictures of cigarettes and rich foods. When they thought about what comes later, instead of how it would feel right now, craving dropped by about a third: 34% for cigarettes and 30% for food. The planning parts at the front of the brain grew more active, and the brain’s reward center grew quieter.',
            ),
            bP(
              'The good side helps too. In another study, smokers who pictured good moments ahead of them, from tomorrow to a year away, took fewer puffs in an hour in the lab than smokers who recalled good moments from the day before.',
            ),
          ],
          so: 'Your brain already has the brakes. Thinking of the hour after is how you press them.',
          fact: { s: 'Brain-scan study · 21 smokers · Kober et al., 2010 · Trial · 42 smokers · Stein et al., 2016', i: [0, 3] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'star' }],
          h: 'Practice turns it into a skill that lasts.',
          b: [
            bP(
              'In two trials with 93 smokers, some practiced thinking of what comes later, 25 times in one short session, while looking at pictures of cigarettes. In the weeks after, they smoked 22% to 49% fewer cigarettes a day, and it held for up to a month. Smokers who did not practice stayed about the same.',
            ),
            bP(
              'The same practice works on food. In a set of studies with 1,528 people, about 15 minutes of practice changed what people chose to eat, and in one study the people who practiced ate 93 to 121 fewer calories than people who did not.',
            ),
          ],
          so: 'Every urge is a chance to practice. The more you play it forward, the stronger the skill gets.',
          fact: { s: 'Trials · 93 smokers · Lopez et al., 2022 · Studies · 1,528 people · Boswell et al., 2018', i: [1, 2] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'compass' }],
          h: 'When an urge comes, play the hour forward, both ways.',
          b: [
            bL([
              '**The hour after giving in:** how do you really feel? Ashamed, tired, empty? Name it in your own words.',
              '**The hour after riding it out:** proud, calm, clear-headed? Name that too.',
              '**Side by side:** look at the two hours, and pick the one you want.',
            ]),
            bP(
              'Do it the same way every time, so it becomes a habit of its own. In SOS, The hour after does this for you, and keeps your words for next time.',
            ),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'It is 11 PM, and the urge says, “Just this once. It will feel great.” Which thought plays it forward?',
          ask: 'Pick the best answer.',
          a: 2,
          c: [
            ['“It will feel great for ten minutes”', 'That is the urge talking about right now. Play it past the ten minutes, to the hour after.'],
            ['“I am weak for even wanting it”', 'Shame does not loosen the pull. Seeing the whole picture does.'],
            [
              '“An hour from now I would feel empty. If I ride it out, I feel proud.”',
              'Yes. You looked at both hours, side by side. Now pick the one you want.',
            ],
            ['“I will think about it tomorrow”', 'The hour after is closer than tomorrow, and close enough to picture now. Bring it into this moment.'],
          ],
        },
      ],
      rc: {
        q: 'An urge says only the next few minutes matter. What does this lesson suggest?',
        c: [
          'Fight the want with all my strength',
          'Picture the hour after, both ways, and pick the hour I want',
          'Wait for the urge to leave, and think about it then',
          'Tell myself I have no willpower',
        ],
        a: 1,
        r: 'Play it forward. The hour after, seen clearly, turns the pull down, and the skill grows each time.',
        cr: [
          'Not quite. Fighting head on is tiring. Looking past the moment, to the hour after, works better.',
          'Right. Thinking of what comes later turns craving down, and practice makes the skill stronger.',
          'Not quite. The moment of the urge is exactly when playing it forward helps most.',
          'Not quite. This is a skill, not a trait. Everyone can practice it, and it grows with practice.',
        ],
      },
      scope:
        'These studies were with smokers and with people craving rich food, and the skill carries straight over to urges like this one: when you think of what comes later, the craving loses its grip, and each time you practice, the skill grows stronger.',
      src: src('kober10', 'lopez22', 'boswell18', 'stein16'),
    },
    {
      id: 'l45',
      u: 3,
      v: 2,
      chk: 'October 25, 2026',
      title: 'Words from a calm day',
      tag: 'On a calm day you can see what matters. Write it down, so the hard moment can hear it.',
      ic: 'pencil',
      mins: 3,
      ask: 'Why read my own reasons in the middle of an urge?',
      key: 'In an urge, the calm view goes quiet, and the next ten minutes feel like everything. A line you wrote on a calm day carries that view across. Your own words move you more than anyone else’s. Keep it to one true line, and read it slowly, out loud if you can.',
      np: 'One line from me, on a calm day',
      cards: [
        {
          k: 'text',
          q: 1,
          e: 'hook',
          el: 'Sound familiar?',
          art: ['chain', { n: ['A calm morning', 'The urge at night', 'Your words'], i: ['sun', 'bolt', 'pencil'] }],
          h: 'In the morning it is clear why you want this. At night, in an urge, where did that clear view go?',
          b: [
            bP(
              'Many people know this. On a calm day your reasons feel obvious. In the hot moment they feel far away, as if someone else wrote them. This lesson is about carrying them across.',
            ),
          ],
        },
        {
          k: 'choose',
          e: 'predict',
          el: 'Make a guess',
          h: 'In the middle of an urge, which words are most likely to help?',
          ask: 'Make your best guess.',
          a: 2,
          c: [
            [
              'A strong speech from someone else',
              'Good words from outside can help, but people tend to push back when they are told what to do. Reasons you came up with yourself land harder.',
            ],
            [
              'A long list of great things about me, said again and again',
              'A common idea, but a big pep talk can backfire. In studies, repeating large positive lines made some people feel worse, and heavy self-affirmation raised craving in some smokers.',
            ],
            [
              'One line I wrote myself, on a calm day',
              'Good guess. Reasons you chose while you could see clearly are the ones you find most convincing, and they reach you best when it is hard.',
            ],
            ['Nothing. Words cannot touch an urge', 'An urge is loud, but it still listens. A few true words, in your own voice, can tip the choice.'],
          ],
        },
        {
          k: 'text',
          q: 1,
          e: 'answer',
          el: 'The answer',
          art: ['icon', { ic: 'pencil' }],
          h: 'Let calm you speak to the hard moment, in your own words.',
          b: [
            bP(
              'On a calm day, you can see what you want from your life. In an urge, that view shrinks, and the next ten minutes feel like all there is. A line you wrote while calm is a message across that gap. Because the words are yours, the urge has less to argue with.',
            ),
          ],
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['icon', { ic: 'sun' }],
          h: 'When calm, people guess the pull will be weaker than it is.',
          b: [
            bP(
              'Researchers call it the hot-cold empathy gap. In one study, 98 smokers said how much money it would take for them to wait five minutes for a cigarette. Those who answered while calm named a lower price than they asked for later, once the craving came. Those who answered while already craving did not guess low. The calm self underrated the hot moment.',
            ),
          ],
          so: 'Calm you sees clearly but cannot feel the urge. In the urge, you feel it but cannot see clearly. Words written while calm let the clear view reach the hard moment.',
          fact: { s: 'Experiment · 98 smokers · Sayette et al., 2008 · Review · Loewenstein, 2005', i: [0, 1] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['big', { n: '3,025', s: 'people in 36 studies of counseling' }],
          h: 'Reasons you give yourself move you more.',
          b: [
            bP(
              'People are moved more by reasons they come up with than by reasons they are handed. In two experiments with 253 students, an alcohol poster that asked a question, so people found their own reasons, led those who drank to drink less than a poster that simply told them. Counseling shows the same: across 36 studies with 3,025 people, the more of what a person said was in favor of change, the more they cut back later.',
            ),
          ],
          so: 'That is why Daybook asks for your words, not ours. Your own reason is the one the urge has the hardest time arguing with.',
          fact: { s: 'Experiments · 253 students · Loman et al., 2018 · Meta-analysis · 3,025 people · Magill et al., 2018', i: [2, 3] },
        },
        {
          k: 'text',
          q: 1,
          e: 'move',
          el: 'What to do',
          art: ['icon', { ic: 'heart' }],
          h: 'Write one true line on a calm day. Read it in the hard moment.',
          b: [
            bL([
              '**Write it now, while calm:** one line about what you want, or who you want to be there for. Your words, not a slogan.',
              '**Keep it small and true:** one sentence you believe beats a pep talk. If it sounds too big to believe, make it smaller.',
              '**Read it slowly when the urge comes,** out loud if you can. Hearing it in your own voice brings calm you into the room.',
            ]),
            bP(
              'Acceptance and commitment therapy, tested on this same habit, works the same way: name what matters to you, in your own words. In SOS, Your words does this for you: it shows your note or one of your reasons, with your voice note if you recorded one.',
            ),
          ],
        },
        {
          k: 'choose',
          q: 1,
          e: 'check',
          el: 'Check it',
          h: 'An urge hits late at night. You open SOS, and your own line comes up. What is the best way to use it?',
          ask: 'Pick the best answer.',
          a: 1,
          c: [
            ['Skim it fast and move on', 'A quick glance does not give calm you time to speak. Read it slowly, out loud if you can.'],
            ['Read it slowly, out loud if I can, and let it remind me what I want', 'Yes. Slow and out loud gives your calm self a voice in the hard moment.'],
            [
              'Argue with it: is it even true right now?',
              'In an urge, almost nothing good feels true. That is the gap. You wrote it when you could see clearly. Trust that view.',
            ],
            ['Swap it for ten big promises', 'A pile of big promises is hard to believe in a hard moment, and can backfire. One true line is enough.'],
          ],
        },
      ],
      rc: {
        q: 'You are writing the line SOS will show you in an urge. Which is best?',
        c: [
          '“I am perfect, and nothing can ever stop me.”',
          '“I want to wake up clear, and be fully there for the people I love.”',
          '“Never again, or I am a failure.”',
          '“Quitting is good for people.”',
        ],
        a: 1,
        r: 'One true line, in your own words, about what you want.',
        cr: [
          'Not quite. A line too big to believe can backfire in a hard moment. Make it smaller and truer.',
          'Right. It is yours, it is true, and it names what you want. That is what reaches you in an urge.',
          'Not quite. A threat brings shame, not help. Write what you want, not what you fear.',
          'Not quite. It is true, but it is not yours. A reason about your own life moves you more.',
        ],
      },
      scope:
        'The empathy gap was measured in smokers, and the self-persuasion and counseling studies were mostly about drinking. The same gap, and the same pull of your own reasons, run through every habit like this one. What it means for you: on a calm day you know what matters, and one line in your own words carries that into the hard moment.',
      src: src('sayette', 'loewenstein05', 'loman18', 'magill18', 'crosby', 'wood09', 'dijkstra15'),
    },
  ];
}
