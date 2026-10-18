/* Lessons 33 to 41. Lessons 33 to 40 are the two newer units: "Why it is hard to stop" and "Becoming someone new".
   Lesson 41, "The picture and the real thing", is the science behind Talk it through and Rekindle, in "Seeing your
   pattern". They follow the same lesson standard as the first 32 (see the LESSONS note in legacy/core.js), and
   legacy/core.js adds them to LESSONS, LUNITS and SRC, so every rule that counts lessons sees all of them.

   Each unit is a family: one hard idea taught four ways (the science, a scene, a practice, your own log), spread along the path
   with growing gaps (see lessonPath and LESSON_FAMILIES in lessons.ts).

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
};
/* two sources the first 32 lessons already use */
type Src = [string, string];
const S = (k: string, shared?: Record<string, Src>): Src => SRC_MORE[k] || (shared && shared[k]) || ['', ''];

export const LUNITS_MORE: Unit[] = [
  {
    name: 'Why it is hard to stop',
    sub: 'Wanting and liking, the cue that comes first, autopilot, and what the habit does for you.',
    tone: 'coral',
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
      act: {
        h: 'Notice wanting and liking.',
        p: 'Next time an urge comes, ask: is this wanting, or liking? If you slip, notice honestly how it felt ten minutes after, and log it. Both answers are useful.',
        mins: 2,
        go: [
          { t: 'Practice breathing', a: 'scene', v: 'breathe', ic: 'wind' },
          { t: 'See my days', a: 'tab', v: 'days', ic: 'calendar' },
        ],
        ok: 'You named the signal.',
      },
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
      act: {
        h: 'Write down one signal.',
        p: 'Think of your last hard moment. What came first: a time, a place, a mood, or an app? Add it to your urge plan with one move.',
        mins: 2,
        go: [{ t: 'Open my urge plan', a: 'sheet', v: 'urge', ic: 'plug' }],
        ok: 'You know one of your signals.',
      },
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
      act: {
        h: 'Set one watch.',
        p: 'Pick the time your autopilot usually starts. Add it to your urge plan: if it is that time, then I will watch, say “not this time,” and do one thing.',
        mins: 2,
        go: [{ t: 'Open my urge plan', a: 'sheet', v: 'urge', ic: 'plug' }],
        ok: 'You set a watch.',
      },
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
      act: {
        h: 'Plan for the feeling.',
        p: 'Pick your most common hard feeling, and add an if-then plan for it: if I feel this, then I will do that.',
        mins: 2,
        go: [
          { t: 'Open my urge plan', a: 'sheet', v: 'urge', ic: 'plug' },
          { t: 'See my days', a: 'tab', v: 'days', ic: 'calendar' },
        ],
        ok: 'You planned for the feeling.',
      },
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
      act: {
        h: 'Write who you are becoming.',
        p: 'Write one sentence about the person you are becoming. Daybook shows it under the date on Today, and when SOS opens.',
        mins: 2,
        go: [{ t: 'Write my sentence', a: 'tab', v: 'plan', ic: 'pencil' }],
        ok: 'You wrote who you are becoming.',
      },
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
      act: {
        h: 'Keep your sentence close.',
        p: 'Add your “I do not” sentence to your reasons, so it is there in a hard moment.',
        mins: 1,
        go: [{ t: 'Add it to my reasons', a: 'sheet', v: 'reasons', ic: 'star' }],
        ok: 'Your sentence is ready.',
      },
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
      act: {
        h: 'Write your note from the future.',
        p: 'Write a few lines from you, a year from now. Save them as your note for hard moments in My plan, and SOS will show them to you.',
        mins: 3,
        go: [{ t: 'Write my note', a: 'tab', v: 'plan', ic: 'pencil' }],
        ok: 'Future you has a say now.',
      },
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
      act: {
        h: 'Read your evidence.',
        p: 'Open your days and count the urges you rode out. Then write one sentence that starts “I am someone who…”',
        mins: 2,
        go: [
          { t: 'See my days', a: 'tab', v: 'days', ic: 'calendar' },
          { t: 'Write who I am becoming', a: 'tab', v: 'plan', ic: 'pencil' },
        ],
        ok: 'You read your evidence.',
      },
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
              'Researchers call it desire thinking: picturing the thing you want, and going over it again and again in words. Across drinking, smoking, gambling, eating and more, it goes with stronger craving, and it keeps craving going.',
            ),
          ],
          so: 'When you catch yourself planning the details, that is the replay. Naming it, “that is the picture,” is the first step out of it.',
          fact: { s: 'Review · Caselli & Spada, 2015', i: [0] },
        },
        {
          k: 'text',
          e: 'proof',
          el: 'The science',
          art: ['research', { k: 'lens' }],
          h: 'Noticing with curiosity wears a habit down.',
          b: [
            bP(
              'In a trial with adult smokers, people trained to notice their cravings with curiosity, instead of acting on them, did far better than people in a standard quit program: four months later, 31% had quit, against 6%. In a later study of overeating, as people paid close attention while they ate, the reward they felt from overeating went down, and that drop predicted their eating changing.',
            ),
          ],
          so: 'Each honest look, before a slip or after one, teaches your brain what the habit really gives. That is how the pull shrinks.',
          fact: { s: 'Trial · Brewer et al., 2011 · Study · Taylor et al., 2021', i: [1, 2] },
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
              'Tonight is the hardest time to decide. Calm you guesses the pull will be weaker than it turns out to be, so decide now.',
            ],
          ],
        },
      ],
      act: {
        h: 'Catch the picture once.',
        p: 'Next time you notice yourself picturing a slip, say “that is the picture,” and open Talk it through while you are calm. If a slip happens, look back afterward: what did you expect, and what did it give?',
        mins: 2,
        go: [{ t: 'Open Talk it through', a: 'talk', ic: 'chat' }],
        ok: 'You looked at the real thing.',
      },
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
        'Desire thinking has been studied across many habits. The curiosity trial was with adults quitting smoking, and the noticing study with people who overeat: the same learning runs through every habit like this one, porn included. What it means for you: the picture pulls harder than the real thing, and every honest look narrows that gap.',
      src: src('caselli', 'brewer11', 'taylor21', 'sayette', 'tracy13'),
    },
  ];
}
