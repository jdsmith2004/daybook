/* Lessons told as a story, batch E (the shape is in lesson-stories.ts, the standard in docs/lessons.md, the remap brief in the
   side-session notes, lesson-remap-brief.md). Written November 14, 2026: lessons 33 to 40 and 42 to 44. Lesson 36 follows the
   dragon's gold sample the owner called "excellent" that day. */
import type { Story, StoryPart } from './lesson-stories';

type Src = [string, string];
const S = {
  berridge89: [
    'Berridge, Venier & Robinson (1989): taste reactivity analysis of 6-hydroxydopamine-induced aphagia, Behavioral Neuroscience',
    'https://doi.org/10.1037/0735-7044.103.1.36',
  ],
  pecina: [
    'Peciña, Cagniard, Berridge, Aldridge & Zhuang (2003): hyperdopaminergic mutant mice have higher “wanting” but not “liking” for sweet rewards, Journal of Neuroscience',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6740586/',
  ],
  berridge: [
    'Berridge & Robinson (2016): liking, wanting, and the incentive-sensitization theory of addiction, American Psychologist',
    'https://doi.org/10.1037/amp0000059',
  ],
  schultz: ['Schultz, Dayan & Montague (1997): a neural substrate of prediction and reward, Science', 'https://doi.org/10.1126/science.275.5306.1593'],
  gola: [
    'Gola, Wordecha, Sescousse and colleagues (2017): can pornography be addictive? An fMRI study of men seeking treatment for problematic pornography use, Neuropsychopharmacology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5561346',
  ],
  neal: [
    'Neal, Wood, Wu & Kurlander (2011): the pull of the past, when do habits persist despite conflict with motives? Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167211419863',
  ],
  wood02: [
    'Wood, Quinn & Kashy (2002): habits in everyday life, thought, emotion, and action, Journal of Personality and Social Psychology',
    'https://pubmed.ncbi.nlm.nih.gov/12500811/',
  ],
  quinn10: [
    'Quinn, Pascoe, Wood & Neal (2010): watching for unwanted habits and telling yourself not to, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167209360665',
  ],
  hobbit: ['Tolkien (1937): The Hobbit, chapters 1 and 12', 'https://en.wikipedia.org/wiki/The_Hobbit'],
  bothe21m: [
    'Bőthe et al. (2021): why do people watch pornography? The motivational basis of pornography use, Psychology of Addictive Behaviors',
    'https://pubmed.ncbi.nlm.nih.gov/32730047/',
  ],
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
} satisfies Record<string, Src>;

export const STORIES_E: Record<string, Story> = {
  l33: {
    id: 'l33',
    form: 'study',
    title: 'Wanting is not liking',
    ic: 'bolt',
    ask: 'Why is the pull so strong when porn does not even feel that good anymore?',
    key: 'A strong pull is an ad, not a review. For the review, recall how it felt ten minutes after.',
    np: 'How it felt ten minutes after, compared with how much I wanted it before',
    tell: [
      {
        h: 'In the 1980s, a young scientist named Kent Berridge set out to prove what everyone already believed.',
        p: 'Dopamine, a chemical the brain releases around rewards, was called the pleasure chemical. He meant to show **how it made things feel good**.',
        dx: 'Kent Berridge was working in a lab at the University of Michigan. Dopamine was already famous. Rats would press a lever again and again for it, and drugs that people chase all raise it. So the textbooks called it the pleasure chemical, and almost nobody doubted that. Berridge did not set out to doubt it either. He meant to show **how it made things feel good**, step by step, and to measure the pleasure itself.',
        art: ['scene', { k: 'l33-lab' }],
      },
      {
        h: 'He had a way to read pleasure on a face.',
        p: 'Put something sweet on the tongue of a rat, or of a newborn baby, and it licks its lips. Something bitter, and it gapes. The faces are **the same across species**, and they are hard to fake.',
        dx: 'Measuring pleasure sounds impossible, since you cannot ask a rat how it feels. But Berridge had a tool. Put a drop of sugar water on the tongue of a rat, a monkey or a newborn baby, and the face does the same thing: the tongue pushes out, the lips get licked. Put something bitter there, and the mouth gapes and the head shakes. The faces are **the same across species**, they come before any learning, and they are very hard to fake. He filmed them, frame by frame, and counted.',
        art: ['scene', { k: 'l33-faces' }],
      },
      {
        h: 'Then he took the dopamine away.',
        p: 'In some rats, almost all of it was gone. The plan was clear: no dopamine, no pleasure, and **sugar would taste like nothing**.',
        dx: 'Then came the test that was meant to prove the point. In some rats, a chemical destroyed almost all of the cells that make dopamine. If dopamine was pleasure, those rats should lose it. The plan was clear: no dopamine, no pleasure, and **sugar would taste like nothing**. Their faces should go flat when the sweet drop landed.',
        art: ['scene', { k: 'l33-gone' }],
      },
      {
        h: 'The rats stopped eating.',
        p: 'They would not walk to food or water, even when hungry. Left alone, **they would have starved**, so the scientists fed them by hand.',
        dx: 'At first, it looked like the theory was right. The rats stopped eating. They would not walk across the cage to food or water, even when they were hungry. Left alone, **they would have starved**, so the scientists fed them by hand. Everything about them said they had lost interest in rewards.',
        art: ['scene', { k: 'l33-bowl' }],
      },
      {
        h: 'But when sugar touched their tongues, they licked their lips just as before.',
        p: 'Their faces showed **the same pleasure** as healthy rats. They still liked it. What was gone was the wanting: the push to go and get it.',
        dx: 'Then the scientists put the sugar water in their mouths. The rats licked their lips, the same way healthy rats did, as often and as plainly. Their faces showed **the same pleasure**. The liking was all still there. What was gone was the wanting: the push to cross the cage, to go and get it. Dopamine had never been the pleasure. It was the pull toward the pleasure.',
        art: ['scene', { k: 'l33-lick' }],
        fact: { s: 'Study · Berridge, Venier & Robinson, 1989', i: [0] },
      },
      {
        long: 1,
        h: 'At first, Berridge thought the test had gone wrong.',
        p: 'It went against everything known about dopamine. He and his colleague Terry Robinson ran test after test for years before they were sure: **dopamine is the wanting**, not the liking.',
        dx: 'At first, Berridge thought the test had gone wrong. The result went against everything known about dopamine, and other scientists were not quick to believe it either. So he and his colleague Terry Robinson ran test after test, for years, with different methods. The answer kept coming back the same: **dopamine is the wanting**, not the liking. Two things everyone had thought were one turned out to run on different systems in the brain.',
        art: ['scene', { k: 'l33-years' }],
      },
      {
        long: 1,
        h: 'Years later, mice bred with extra dopamine showed the other side.',
        p: 'They worked harder to get sugar, and ran to it faster. But when it landed on their tongues, **their faces liked it no more** than ordinary mice.',
        dx: 'Years later, the lab tested the other side. Mice bred to have more dopamine than usual learned faster to work for sweet things, and pushed harder to get them. They ran to the sugar. But when it landed on their tongues, their small faces showed the same pleasure as ordinary mice, **no more**. More dopamine meant more wanting. It did not mean more liking.',
        art: ['scene', { k: 'l33-mice' }],
        fact: { s: 'Study in mice · Peciña and colleagues, 2003', i: [1] },
      },
      {
        h: 'Wanting and liking are two different things in the brain.',
        p: 'Liking is small and quiet. Wanting is big, and practice makes it grow. Repeat a habit enough and the wanting can **get louder while the liking stays the same**, or fades.',
        dx: 'In the brain, liking runs on a few small spots, and it is easy to disturb. Wanting runs on large systems, and it grows with practice. Berridge and Robinson found that repeating a habit, with its cues around it, can make the wanting stronger and stronger. The liking does not grow along with it. So the wanting can **get louder while the liking stays the same**, or fades. That is how a pull can feel huge while the pleasure it brings stays small.',
        art: ['want', {}],
        fact: { s: 'Review · Berridge & Robinson, 2016', i: [2] },
      },
      {
        k: 'ask',
        h: 'Think of the last time the pull was strong. Ten minutes after, how did it feel?',
        o: [
          ['About as good as it promised', 'Then you have a fair reading. Watch whether it holds next time.'],
          ['Smaller than it promised', 'Many people notice that gap. Now you know where it comes from.'],
          ['Flat, or worse than before', 'Keep that. It is the review the pull never shows you.'],
          ['I have never noticed', 'Few people do. Next time, notice the ten minutes after.'],
        ],
      },
      {
        h: 'So how hard it pulls is not how good it will be.',
        p: 'A strong pull tells you how well the wanting was trained. It is **an ad, not a review**. For the review, look at how you felt ten minutes after.',
        dx: 'So how hard it pulls is not a measure of how good it will be. A strong pull tells you how well the wanting was trained: how many times, with which cues, in which places. It is **an ad, not a review**. Ads are loud and bright and always promise more than they give. The review comes later, in the ten minutes after, and it is quieter. If you want to know what the habit is worth to you, that is where to look.',
        art: ['scene', { k: 'l33-ad' }],
      },
      {
        long: 1,
        h: 'And a pull that was trained can lose its training.',
        p: 'Wanting grows with practice. Each urge you let pass without obeying it is **one less practice**, and the brain learns from that too.',
        dx: 'This is the hopeful part. The wanting was learned, and what is learned can change. It grows with practice, every time the cue comes and the habit follows. Each urge you let pass without obeying it is **one less practice**, and the brain learns from that too. Like a wave, the pull rises and falls. Each time it falls with nothing given to it, it has a little less to promise the next time.',
        art: ['wave', {}],
        back: 'l2',
      },
    ],
    mine: { h: 'Each pull you outlast gets less practice.', k: 'rode' },
    today: {
      h: 'When the pull is loud, ask for the review.',
      l: ['Name it: “This is wanting, not liking.”', 'Recall how it felt ten minutes after', 'Give the pull ten minutes to fall'],
    },
    you: {
      h: 'When the pull is strongest, what does it promise you?',
      o: [
        ['That this time will feel amazing', 'It promised that last time too. Check the review before you believe the ad.'],
        ['Relief from how I feel', 'Then it is selling relief. Look at how long the relief lasted.'],
        ['Nothing. It just pulls', 'That is the wanting on its own, with little liking behind it. Name it as that.'],
        ['I do not know yet', 'Fair. Listen to what it says next time, and then check the ten minutes after.'],
      ],
    },
    scope:
      'The dopamine studies were in rats and mice, and the split between wanting and liking comes from decades of research in animals and people, not from studies of porn. It does not say porn never feels good. It says a strong pull is not a measure of how good something is, and a pull that was learned can change.',
    src: [S.berridge89, S.pecina, S.berridge],
  },

  l34: {
    id: 'l34',
    form: 'study',
    title: 'The cue comes first',
    ic: 'phone',
    ask: 'Why does the urge start before I have even seen anything?',
    key: 'The pull starts at the signal, before anything is on the screen. Learn your first signal, and move at it.',
    np: 'The first signal I notice, before the urge',
    tell: [
      {
        h: 'In the 1980s and 1990s, a scientist in Switzerland listened to single brain cells.',
        p: 'Wolfram Schultz placed fine wires beside the cells that release dopamine in monkeys. When a drop of sweet juice landed on a monkey’s tongue, the cells **fired in a burst**.',
        dx: 'Wolfram Schultz worked at a university in Switzerland. He wanted to know what dopamine cells do from moment to moment. So he placed very fine wires beside single cells deep in the brains of monkeys, close enough to hear each one fire, a click at a time. Most of the time they clicked along slowly. When a drop of sweet juice landed on a monkey’s tongue, the cells **fired in a burst**, a quick rush of clicks. Reward in, burst out.',
        art: ['scene', { k: 'l34-juice' }],
      },
      {
        h: 'Then he added a light.',
        p: 'A small light came on, and a moment later, the juice came. He did it again and again, **always in the same order**: light, then juice.',
        dx: 'Then he changed one thing. Before each drop of juice, a small light came on. A moment later, the juice came. He did it again and again, **always in the same order**: light, then juice. The monkeys did not need to do anything. They only had to watch, and their brains did the rest.',
        art: ['scene', { k: 'l34-light' }],
      },
      {
        h: 'After a while, the burst moved.',
        p: 'The cells stopped bursting at the juice. They burst **at the light**, the moment it promised juice was coming. When the juice landed, they barely stirred.',
        dx: 'After a while, something surprising happened in the clicks. The cells stopped bursting when the juice landed. They burst **at the light**, the moment it promised juice was coming. When the juice itself arrived, the thing the monkey wanted, the cells barely stirred. The brain had learned the order, and its rush had moved forward in time, to the signal.',
        art: ['scene', { k: 'l34-moved' }],
        fact: { s: 'Study · Schultz, Dayan & Montague, 1997', i: [0] },
      },
      {
        long: 1,
        h: 'And when the light came on and no juice followed, the cells went quiet.',
        p: 'Right at the moment the juice should have landed, they **dropped below their usual pace**. The brain had been keeping time, and it noticed what was missing.',
        dx: 'Schultz tried one more thing. Sometimes the light came on, and no juice followed. The cells burst at the light as usual. Then, right at the moment the juice should have landed, they **dropped below their usual pace**, almost silent. The brain had been keeping time to the moment, and it noticed what was missing. The cells were not counting rewards. They were tracking promises.',
        art: ['scene', { k: 'l34-missing' }],
      },
      {
        h: 'Your brain has learned what comes before the habit.',
        p: 'A room, a mood, an app, being alone. When that signal shows up, the wanting starts, **before anything is on the screen**. The pull is a reaction to the light.',
        dx: 'You have your own lights. Your brain has learned what comes before the habit: a certain room, a mood like bored or low, an app you open, being alone with nothing planned. It learned them the way the monkeys learned the light, through the same order again and again. So when that signal shows up, the wanting starts, **before anything is on the screen**. The pull you feel is not a reaction to a picture. It is a reaction to the light.',
        art: ['scene', { k: 'l34-signals' }],
      },
      {
        long: 1,
        h: 'Men seeking help for porn showed the same thing in a brain scanner.',
        p: 'A sign that an erotic picture was coming lit up their reward area **more than in other men**. The pictures themselves, about the same.',
        dx: 'In 2017, researchers in Poland scanned the brains of men who were seeking help for their porn use, and men who were not. Each man saw a sign, then a picture. A sign that an erotic picture was coming lit up a reward area of the brain **more than in other men**. When the pictures came, the response was about the same in both groups. And the stronger a man’s response to the sign, the more porn he said he used. The light, again, mattered more than the juice.',
        art: ['scene', { k: 'l34-scan' }],
        fact: { s: 'Brain-scan study · Gola and colleagues, 2017', i: [1] },
      },
      {
        k: 'ask',
        h: 'Think of the moment it usually starts for you. What comes first?',
        o: [
          ['A place, like a room or the couch', 'Then the place is one of your lights. That is worth knowing.'],
          ['A mood, like bored, low or stressed', 'A mood can be a light too. Moods come before screens.'],
          ['Being alone with my phone', 'That is a common one. The phone in hand is often the light.'],
          ['I do not know yet', 'Fair. Watch the next one, and look for what came just before.'],
        ],
      },
      {
        h: 'So the best moment to move is earlier than it feels.',
        p: 'At the light, the pull is small and the move is easy. **Move at the light**, not at the juice, and the wanting has far less time to run.',
        dx: 'This changes where the fight is. Most people wait until the pull is big and then try to hold on. But at the light, the pull is still small, and the move is easy: stand up, put the phone in another room, leave the couch. **Move at the light**, not at the juice, and the wanting has far less time to run. You are not winning a hard fight. You are stepping out before it starts.',
        art: ['scene', { k: 'l34-early' }],
      },
      {
        long: 1,
        h: 'A light that stops bringing juice slowly loses its pull.',
        p: 'When the light came again and again with no juice, the burst at the light faded. Each signal you answer with something else **teaches your brain a new order**.',
        dx: 'One more thing from the monkeys gives hope. When the light kept coming with no juice after it, the burst at the light slowly faded. The brain learned the new order. The same is true of your lights. Each time a signal comes and you answer it with something else, a walk, a message, a different room, it **teaches your brain a new order**. The signal will still come for a while. It will promise less each time.',
        art: ['scene', { k: 'l34-fade' }],
        back: 'l33',
      },
    ],
    mine: { h: 'The reason you pick most can be one of your signals.', k: 'trigger' },
    today: {
      h: 'Find your first signal, and move at it.',
      l: ['Name it: a place, a mood, an app', 'Pick one move for when it shows up', 'Do it then, while the pull is small'],
    },
    you: {
      h: 'When your first signal shows up, what is one move you could make right then?',
      o: [
        ['Put the phone in another room', 'That takes the light out of reach. It is one of the strongest moves there is.'],
        ['Get up and leave the room', 'A new room is a new order. The old light stays behind.'],
        ['Message someone', 'Then the signal leads to a person, and that is a better order to teach.'],
        ['I do not know yet', 'Fair. Find the signal first. The move gets easier to pick once you know it.'],
      ],
    },
    scope:
      'The monkey studies were about juice, and the brain-scan study was small, with men seeking help and men without problems. Together they show a pattern, not every person’s story: learned signals start the wanting before the reward arrives. Signals are learned, and they can be moved.',
    src: [S.schultz, S.gola],
  },

  l35: {
    id: 'l35',
    form: 'study',
    title: 'Catch the autopilot',
    ic: 'shield',
    ask: 'How do I stop something that starts before I decide?',
    key: 'Habits start on their own, and waking up halfway is normal. The moment you notice, your choice comes back.',
    np: 'The moment my autopilot usually starts, and what I will say when I catch it',
    tell: [
      {
        h: 'In 2011, researchers handed out free popcorn at a cinema in California.',
        p: 'People got a bucket and sat down to watch trailers. What they did not know: some buckets were fresh, and some had been **made a week before**.',
        dx: 'In 2011, a team led by David Neal and Wendy Wood set up a study in a cinema at a university in California. People came in, got a free bucket of popcorn and a drink, and sat down to watch trailers. They were told it was a study about movies. What they did not know: some buckets were fresh, popped that day, and some had been **made a week before** and left to sit. The researchers weighed every bucket before and after.',
        art: ['scene', { k: 'l35-cinema' }],
      },
      {
        h: 'The old popcorn was bad, and people knew it.',
        p: 'It was soft and chewy and tasted stale. Asked afterward, the people who got it said **they did not like it**.',
        dx: 'A week makes popcorn bad. It goes soft and chewy, and it tastes like cardboard. There was nothing hidden about it. Asked afterward, the people who got the stale buckets said so plainly: **they did not like it**. If people eat what they like, the stale buckets should have come back nearly full.',
        art: ['scene', { k: 'l35-stale' }],
      },
      {
        k: 'ask',
        h: 'Say you got the stale bucket. What would you do?',
        o: [
          ['Put it down after a few bites', 'That is what most people would say. Look at what happened.'],
          ['Keep eating without thinking', 'Then you know your own autopilot well. Look at who else did.'],
          ['Ask for a fresh one', 'A good move, if you noticed. Look at who did not notice.'],
        ],
      },
      {
        h: 'People who always eat popcorn at the movies ate the stale buckets just as fast.',
        p: 'Their taste said no. **Their hands kept going.** The dark room, the screen and the seat started the habit, and the habit did not stop to check the taste.',
        dx: 'The people who rarely ate popcorn at the movies did what you would expect: they ate less of the stale popcorn. But the people who always eat popcorn at the movies ate the stale buckets about as fast as the fresh ones. Their taste said no. **Their hands kept going.** The dark room, the big screen and the seat started the habit, and once it was running, it did not stop to check how the popcorn tasted.',
        art: ['scene', { k: 'l35-hands' }],
        fact: { s: 'Study · Neal, Wood, Wu & Kurlander, 2011', i: [0] },
      },
      {
        long: 1,
        h: 'The same people, in a plain meeting room, ate less of the stale popcorn.',
        p: 'Watching music videos at a table, away from the cinema, their taste was back in charge. The habit **lived in the setting**, not in their liking.',
        dx: 'The researchers ran it again in a different place: a plain meeting room, with music videos on a screen. There, the same kind of habitual popcorn eaters ate less of the stale popcorn, the way anyone would. Away from the cinema, their taste was back in charge. The habit **lived in the setting**, not in their liking. It was the dark room and the big screen that switched it on.',
        art: ['scene', { k: 'l35-room' }],
        back: 'l10',
      },
      {
        h: 'Then the researchers asked some people to eat with their other hand.',
        p: 'Left instead of right, or right instead of left. In the cinema, with the stale bucket, those people **ate less**. An awkward hand woke them up, and their taste came back.',
        dx: 'Then came the best part. In the cinema, some people were asked to eat with their other hand: the left hand if they were right-handed, the right hand if they were left-handed. It felt clumsy. And those people, with the stale bucket, in the same dark room, **ate less**. The awkward hand broke the autopilot. Each handful needed a little attention, and the moment attention came back, so did their taste, and their choice.',
        art: ['scene', { k: 'l35-other-hand' }],
      },
      {
        h: 'Much of every day runs on autopilot, in everyone.',
        p: 'In hourly diaries, people did about four in ten of their daily actions **without their mind on them**. Finding yourself halfway into a habit is how habits work, not a flaw in you.',
        dx: 'Researchers once asked students to write down, every hour, what they were doing and what they were thinking. During new things, their thoughts matched what their hands were doing. During habits, their minds were usually somewhere else. About four in ten of their daily actions were habits, done **without their mind on them**. So finding yourself halfway into a habit with no memory of choosing it is not proof that something is wrong with you. It is how habits work, in everyone.',
        art: ['scene', { k: 'l35-diary' }],
        fact: { s: 'Diary studies · Wood, Quinn & Kashy, 2002', i: [1] },
      },
      {
        h: 'So the moment you notice is the moment your choice comes back.',
        p: 'You do not have to stop the habit from starting. You have to **catch it running**, the way the awkward hand did, and then you are deciding again.',
        dx: 'This turns the problem around. You do not have to stop the habit from ever starting. Habits start on their own, and that will happen for a while. What you can do is **catch it running**, the way the awkward hand did for the popcorn eaters. The moment you notice your thumb on the app, or your feet heading to the old room, autopilot is over. You are deciding again, and that moment counts as much as any other.',
        art: ['scene', { k: 'l35-wake' }],
      },
      {
        long: 1,
        h: 'For strong habits, watching for the start worked best.',
        p: 'In diaries of people fighting unwanted habits, those who **watched for the start and told themselves “do not”** did better than those who hid the temptation or tried to distract themselves.',
        dx: 'Another set of diary studies followed people trying to break habits they did not want. They tried different ways: keeping the temptation out of sight, distracting themselves, or watching for the habit and telling themselves not to do it. For weak habits, many ways helped. For strong habits, one stood out. The people who **watched for the start and told themselves “do not”** did better than the rest. Watching did not erase the habit. It gave them the moment to choose.',
        art: ['scene', { k: 'l35-watch' }],
        fact: { s: 'Diary studies · Quinn, Pascoe, Wood & Neal, 2010', i: [2] },
      },
    ],
    mine: { h: 'Your autopilot keeps hours. Here is where to watch.', k: 'hour' },
    today: {
      h: 'Give your autopilot an awkward hand.',
      l: ['Pick where it usually starts', 'Change one thing there: hand, room or app', 'When you notice, say “not this time”'],
    },
    you: {
      h: 'When you catch yourself already halfway there, what do you tell yourself?',
      o: [
        ['“Too late now, it already started.”', 'That hands the rest to autopilot. Started is not finished.'],
        ['“Something is wrong with me.”', 'It feels like proof of something. It is how habits work in everyone.'],
        ['“Wait, I can stop here.”', 'That is the moment your choice comes back. Hold on to that sentence.'],
        ['I do not know yet', 'Fair. Notice what you say the next time you catch it.'],
      ],
    },
    scope:
      'The popcorn study was about eating in a cinema, and the diary studies followed students and adults through ordinary habits, not porn. Both point the same hopeful way: starting on autopilot is how habits work in everyone, and noticing the start, or making it awkward, brings the choice back.',
    src: [S.neal, S.wood02, S.quinn10],
  },

  l36: {
    id: 'l36',
    form: 'tale',
    title: 'What the habit does for you',
    ic: 'compass',
    ask: 'What is porn doing for me in a hard moment?',
    key: 'The thing you avoid is guarding the thing you want.',
    np: 'The feeling I run from most, and what it might be guarding',
    tell: [
      {
        h: 'In the old stories, the dragon always sleeps on gold.',
        p: 'It cannot spend it. It has no use for it. It lies on it for hundreds of years, and **nobody else can reach it either**.',
        dx: 'In the old stories, from the oldest poems of the north to the tales told to children, the dragon always sleeps on gold. Piles of it, cups and crowns and coins. It cannot spend it. It has no use for it. It only lies on it, for hundreds of years, and knows every piece by heart. And **nobody else can reach it either**. The gold is not doing anyone any good. It is only guarded.',
        art: ['scene', { k: 'l36-hoard' }],
      },
      {
        h: 'And the gold is always in the one place the hero least wants to go.',
        p: 'The dark cave, down where the danger is. Never in the town square, where it would be easy. **The treasure and the danger are in the same place.**',
        dx: 'Notice where the gold always is. It is never in the town square, where anyone could pick it up. It is always in the one place the hero least wants to go: the dark cave, deep under the mountain, down where the danger is. That is no accident in the stories. **The treasure and the danger are in the same place**, every time, because the stories are saying something about life.',
        art: ['scene', { k: 'l36-cave' }],
      },
      {
        long: 1,
        h: 'In The Hobbit, Bilbo is a small, comfortable person who loves his armchair and his kettle.',
        p: 'He is asked to leave it all and walk to a mountain where a dragon named Smaug sleeps on a hoard. He says no. Then he **runs out the door anyway**, without even a handkerchief.',
        dx: 'In The Hobbit, Bilbo Baggins is a small, comfortable person. He loves his armchair, his kettle, his full pantry and his quiet days. Then a band of travelers asks him to leave all of it and walk to a far mountain, where a dragon named Smaug sleeps on a hoard that was taken from them. Everything in him says no, and he says it. Then, the next morning, he **runs out the door anyway**, so late and in such a hurry that he forgets even his handkerchief.',
        art: ['scene', { k: 'l36-door' }],
        fact: { s: 'Story · Tolkien, The Hobbit, 1937', i: [0] },
      },
      {
        long: 1,
        h: 'Inside the mountain, he walks down the dark tunnel alone.',
        p: 'He hears the dragon breathing, and stops. The story says the bravest thing he ever did was there, **before he ever saw the dragon**: he was afraid, and he kept walking.',
        dx: 'Months later, Bilbo stands inside the mountain. The others wait at the top of the tunnel, and he walks down alone, into the dark. Far below, he hears a sound like a huge cat purring, and feels the heat. It is the dragon, asleep. He stops. The story says the bravest thing he ever did happened right there, **before he ever saw the dragon**. Nothing had attacked him yet. He was only afraid, and he kept walking. The fight was with the fear, not the dragon.',
        art: ['scene', { k: 'l36-tunnel' }],
      },
      {
        h: 'The old stories all say the same thing.',
        p: '**What you most need is usually guarded by what you most fear.** The place you least want to look is where the gold is.',
        dx: 'Put all those stories side by side, and they say the same thing in different words. **What you most need is usually guarded by what you most fear.** The place you least want to look is where the gold is. Comfort is safe, and it is small. The cave is frightening, and it is where the life you want is kept. The hero is not the one with no fear. The hero is the one who goes down anyway.',
        art: ['scene', { k: 'l36-guarded' }],
      },
      {
        h: 'For a habit, the dragon is often a feeling.',
        p: 'Loneliness. Boredom. The ache of a hard day. The tight chest after an argument. The habit is **a way around the cave**: you get to skip the feeling for a while.',
        dx: 'For a habit, the dragon is not out in the world. It is often a feeling. Loneliness. Boredom. The ache of a hard day. The tight chest after an argument. The fear of a task you do not know how to start. The habit is **a way around the cave**. For a while, you do not have to feel any of it. That is what it does for you, and it is why it keeps coming back: the feeling is still there when it ends.',
        art: ['scene', { k: 'l36-around' }],
      },
      {
        k: 'ask',
        h: 'Just before an urge, what are you usually feeling?',
        o: [
          ['Stressed or tense', 'Then the urge is offering relief. That is a dragon with a name.'],
          ['Bored or empty', 'Then it fills a gap. Gaps have gold in them too.'],
          ['Lonely or low', 'Then it stands in for closeness. That is worth knowing, not hiding.'],
          ['Desire, plain and simple', 'Sometimes it is. Watch the next few. A feeling often comes first.'],
        ],
      },
      {
        long: 1,
        h: 'Researchers asked more than 2,600 adults why they watch porn.',
        p: 'Pleasure was one reason, and so were stress, boredom and curiosity. **Using it to escape a bad feeling** was the reason that went with use that felt out of control, more than how often people watched.',
        dx: 'In 2021, researchers asked more than 2,600 adults, in three separate groups, women and men, why they watch porn. People gave many reasons: pleasure, curiosity, boredom, stress, being alone. One reason stood apart. **Using it to escape a bad feeling** was the one that went with use that felt out of control. It mattered more than how often people watched. The trouble was less in the amount and more in what it was being used to avoid.',
        art: ['scene', { k: 'l36-reasons' }],
        fact: { s: 'Surveys · 2,646 adults · Bőthe and colleagues, 2021', i: [1] },
      },
      {
        h: 'But the gold is in the cave too.',
        p: 'The friend you have not called. The work you keep putting off. The talk you are afraid to have. The rest you keep skipping. Go around the cave, and **you go around those too**.',
        dx: 'The habit leaves one thing out. The gold is in the cave too. Under the loneliness is the friend you have not called. Under the boredom is the work you keep putting off, the thing you could build. Under the tight chest is the talk you are afraid to have. Under the tiredness is the rest you keep skipping. Go around the cave, and **you go around those too**. The habit does not only skip the feeling. It skips what the feeling was guarding.',
        art: ['scene', { k: 'l36-gold' }],
      },
      {
        h: 'Every time you go around, the dragon keeps the gold.',
        p: 'And you keep the life you have now. Not a worse one. The same one, **with the gold still under the dragon**.',
        dx: 'Every time you go around the cave, the dragon keeps the gold. And you keep the life you have now. Not a worse one, and not a ruined one. The same one, **with the gold still under the dragon**, another day. That is the cost of the habit that is easy to miss. It does not only take an hour. It keeps the door to the cave shut.',
        art: ['scene', { k: 'l36-keeps' }],
      },
      {
        long: 1,
        h: 'Going in does not mean fighting the dragon on the first day.',
        p: 'The first time, Bilbo went down, looked, took one cup and came back. **A few steps into the cave** is still going in. Five minutes with the feeling, and no phone, is a few steps.',
        dx: 'Going in does not mean fighting the dragon on the first day. The first time Bilbo went down the tunnel, he did not fight anything. He looked, took one golden cup, and climbed back up. That was enough to change everything that came after. **A few steps into the cave** is still going in. Five minutes with the feeling, sitting with it and no phone, is a few steps. Naming what it is guarding is a few more.',
        art: ['scene', { k: 'l36-steps' }],
      },
    ],
    mine: { h: 'Your log can show which feeling comes first.', k: 'trigger' },
    today: {
      h: 'Name the feeling you run from most, and spend five minutes facing it without the phone.',
      l: ['Name the feeling you run from most', 'Sit with it for five minutes, no phone', 'Ask what it guards: a person, a task, rest'],
    },
    you: {
      h: 'If you went into that cave, what do you think is lying under the dragon?',
      o: [
        ['A person I have not called', 'Then the gold has a name. One message is a step into the cave.'],
        ['Rest I keep skipping', 'Then going in might look like going to sleep. That counts.'],
        ['Something I keep putting off', 'Then the first five minutes of it is the first step down the tunnel.'],
        ['I do not know yet', 'Fair. A few steps in will show you. They usually do.'],
      ],
    },
    scope:
      'The dragon and its gold are old stories, not studies, read here for what they say about a habit. The survey asked adults why they watch and shows what goes together, not what causes what. Together they point one hopeful way: the feeling a habit helps you skip is often guarding something you want.',
    src: [S.hobbit, S.bothe21m],
  },
};

/* Another habit (lesson-habit.ts HABIT_OPEN): the cards that rest on a porn study are told again with that habit's own study, and the
   rest is said in the habit's words. l33 and l38 hold for every habit as written. */
const swap = (S: Story, parts: Record<number, StoryPart>): StoryPart[] => S.tell.map((t, i) => parts[i] || t);
const l34 = STORIES_E.l34;
l34.hab = {
  alcohol: {
    tell: swap(l34, {
      5: {
        long: 1,
        h: 'Across 41 studies, the sight of a drink alone set off the craving.',
        p: 'A bottle, a bar, a smell. People felt the pull, and their bodies answered, **before a single sip**. The light, again, mattered more than the juice.',
        dx: 'In 1999, two researchers pulled together 41 studies of people with drinking, smoking and drug problems. In each, people were shown the cues of their habit: a bottle, a glass, a bar, the smell of a drink. They reported strong craving, and their bodies reacted, heart and skin and all, **before a single sip**. Nothing had been poured. The cue was enough to start the wanting. The light, again, mattered more than the juice.',
        art: ['chain', { n: ['Home from work', 'The pull starts', 'Nothing poured yet'] }],
        fact: { s: 'Review · 41 studies · Carter & Tiffany, 1999', i: [1] },
      },
    }),
    scope:
      'The monkey studies were about juice, and the review pooled cue studies across several habits, alcohol among them. Together they show a pattern that holds widely: a learned signal starts the wanting before the reward arrives, and a signal you know is one you can move at.',
    src: [S.schultz, S.carter],
  },
  gambling: {
    tell: swap(l34, {
      5: {
        long: 1,
        h: 'People with a gambling problem lit up at gambling pictures alone.',
        p: 'In a brain scanner, they felt more craving than other people, and their reward areas answered the cue, **with no bet placed**. The light, again, mattered more than the juice.',
        dx: 'In 2017, researchers in London scanned the brains of people with a gambling problem and people without one, while they looked at gambling pictures and plain ones. The people with the problem felt more craving at the gambling pictures, and reward areas of their brains responded more. All of it happened **with no bet placed** and no money moving. The cue was enough to start the wanting. The light, again, mattered more than the juice.',
        art: ['chain', { n: ['Game about to start', 'The pull starts', 'No bet placed yet'] }],
        fact: { s: 'Brain-scan study · Limbrick-Oldfield and colleagues, 2017', i: [1] },
      },
    }),
    scope:
      'The monkey studies were about juice, and the brain-scan study was small, with people with and without a gambling problem. Together they show a pattern, not every person’s story: learned signals start the wanting before the reward arrives. Signals are learned, and they can be moved.',
    src: [S.schultz, S.limbrick],
  },
};

const l36 = STORIES_E.l36;
const l36Ask = (last: [string, string]): StoryPart => ({
  k: 'ask',
  h: 'Just before the pull, what are you usually feeling?',
  o: [
    ['Stressed or tense', 'Then the habit is offering relief. That is a dragon with a name.'],
    ['Bored or empty', 'Then it fills a gap. Gaps have gold in them too.'],
    ['Lonely or low', 'Then it stands in for closeness. That is worth knowing, not hiding.'],
    last,
  ],
});
l36.hab = {
  alcohol: {
    tell: swap(l36, {
      6: l36Ask(['I just like the taste', 'Sometimes it is. Watch the next few. A feeling often comes first.']),
      7: {
        long: 1,
        h: 'A psychologist asked young people why they drink.',
        p: 'For fun, to fit in, to be social, or to cope with a bad feeling. **Drinking to cope** went with drinking problems, more than how much people drank.',
        dx: 'In 1994, a psychologist named Lynne Cooper asked young people why they drink. The answers fell into four kinds: for fun, to fit in, to be social, or to cope with bad feelings. One kind stood apart. **Drinking to cope** went with drinking problems, over and above how much people drank. The trouble was less in the amount and more in what the drink was being used to avoid.',
        art: ['scene', { k: 'l36-reasons' }],
        fact: { s: 'Surveys · Cooper, 1994', i: [1] },
      },
    }),
    scope:
      'The dragon and its gold are old stories, not studies. The surveys asked young people why they drink, and show what goes together, not what causes what. Together they point one hopeful way: the feeling a drink helps you skip is often guarding something you want.',
    src: [S.hobbit, S.cooper],
  },
  gambling: {
    tell: swap(l36, {
      6: l36Ask(['The money, plain and simple', 'Sometimes it is. Watch the next few. A feeling often comes first.']),
      7: {
        long: 1,
        h: 'Two researchers drew together years of work on how gambling problems grow.',
        p: 'They found several paths in. One stood out: people who bet **to escape stress, low mood or loneliness**. For them the bet is relief, and relief keeps calling.',
        dx: 'In 2002, two researchers, Alex Blaszczynski and Lia Nower, drew together years of studies on how gambling problems grow. They found several paths in, not one. One path stood out: people who bet **to escape stress, low mood or loneliness**. For them the bet is not mainly about money. It is relief, and relief keeps calling, because the feeling it skips comes back. The reason behind the bet mattered more than the bet.',
        art: ['scene', { k: 'l36-reasons' }],
        fact: { s: 'Model · Blaszczynski & Nower, 2002', i: [1] },
      },
    }),
    scope:
      'The dragon and its gold are old stories, not studies, and the pathways model draws together many studies of how gambling problems grow, with escape as one path among several. Together they point one hopeful way: the feeling a bet helps you skip is often guarding something you want.',
    src: [S.hobbit, S.blaszczynski],
  },
};
