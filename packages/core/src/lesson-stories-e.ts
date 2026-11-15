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
  character: ['Etymology: character, from Greek kharaktēr, an engraving tool and the mark it stamps', 'https://www.etymonline.com/word/character'],
  aristotle: ['Aristotle: Nicomachean Ethics, book 2, chapter 1 (public domain)', 'https://www.gutenberg.org/ebooks/8438'],
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
  kahneman: [
    'Kahneman, Fredrickson, Schreiber & Redelmeier (1993): when more pain is preferred to less, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.1993.tb00589.x',
  ],
  redelmeier: ['Redelmeier, Katz & Kahneman (2003): memories of colonoscopy, a randomized trial, Pain', 'https://doi.org/10.1016/S0304-3959(03)00179-1'],
  harkin: [
    'Harkin and colleagues (2016): does monitoring goal progress promote goal attainment? A meta-analysis, Psychological Bulletin',
    'https://doi.org/10.1037/bul0000025',
  ],
  kavanagh: [
    'Kavanagh, Andrade & May (2005): imaginary relish and exquisite torture, the elaborated intrusion theory of desire, Psychological Review',
    'https://doi.org/10.1037/0033-295X.112.2.446',
  ],
  skorka: [
    'Skorka-Brown, Andrade, Whalley & May (2015): playing Tetris decreases drug and other cravings in real world settings, Addictive Behaviors',
    'https://doi.org/10.1016/j.addbeh.2015.07.020',
  ],
  iyadurai: [
    'Iyadurai and colleagues (2018): preventing intrusive memories after trauma with a brief intervention involving Tetris, Molecular Psychiatry',
    'https://doi.org/10.1038/mp.2017.23',
  ],
  kemps12: ['Kemps, Tiggemann & Bettany (2012): non-food odorants reduce chocolate cravings, Appetite', 'https://pubmed.ncbi.nlm.nih.gov/22407134/'],
  kemps07: [
    'Kemps & Tiggemann (2007): modality-specific imagery reduces cravings for food, Journal of Experimental Psychology: Applied',
    'https://doi.org/10.1037/1076-898x.13.2.95',
  ],
  collodi: ['Collodi (1883): The Adventures of Pinocchio, chapters 30 to 36 (public domain)', 'https://www.gutenberg.org/ebooks/500'],
  kober10: [
    'Kober, Mende-Siedlecki, Kross, Weber, Mischel, Hart & Ochsner (2010): prefrontal-striatal pathway underlies cognitive regulation of craving, Proceedings of the National Academy of Sciences',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2930456/',
  ],
  lopez22: [
    'Lopez, Ochsner & Kober (2022): brief training in regulation of craving reduces cigarette smoking, Journal of Substance Abuse Treatment',
    'https://doi.org/10.1016/j.jsat.2022.108749',
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

  l37: {
    id: 'l37',
    form: 'word',
    title: 'Who you are becoming',
    ic: 'star',
    ask: 'Can I really stop seeing myself as someone with this problem?',
    key: 'Character is a mark cut by many small strokes. Each choice today is one of them.',
    np: 'Who I am becoming, in one sentence',
    tell: [
      {
        h: 'The word character comes from an old Greek tool.',
        p: 'A kharaktēr was the sharp tool an engraver used to cut a design into metal, and then the mark it left behind. **A character was a mark cut in**, not something a person was born with.',
        dx: 'The word character comes from Greek. A kharaktēr was the sharp tool an engraver used to cut a design into metal, the way a face was cut into the die that made a coin. Then the word came to mean the mark itself, the design the tool left behind. So when the Greeks spoke of a person’s character, the picture under the word was a carving. **A character was a mark cut in**, by work, not something a person was handed at birth.',
        art: ['scene', { k: 'l37-engraver' }],
        fact: { s: 'Word · character, from Greek kharaktēr', i: [0] },
      },
      {
        h: 'And that mark was cut one small stroke at a time.',
        p: 'An engraver cut a coin’s face with hundreds of tiny strokes. No single stroke made the face. **Every stroke added to it**, and none of them could be skipped.',
        dx: 'Look at how the mark was made. An engraver did not cut a coin’s face in one blow. He bent over the metal with his tool and cut it with hundreds of tiny strokes: a line for the brow, a curve for the cheek, a fleck for the eye. No single stroke made the face. A stroke on its own looked like nothing much. But **every stroke added to it**, and none of them could be skipped. The face came out of the plain, patient work.',
        art: ['scene', { k: 'l37-strokes' }],
      },
      {
        h: 'Then the finished die stamped coin after coin.',
        p: 'Once the mark was cut, it showed up on everything it touched. That is what character came to mean: **the mark that shows in everything you do**.',
        dx: 'Then the finished die went to work. It stamped coin after coin, thousands of them, and every one carried the same face. Once the mark was cut, it showed up on everything it touched. That is how the word grew into what it means today: **the mark that shows in everything you do**. How you talk to people, what you do alone, what you reach for on a hard day. All of it is stamped with the same face, and the face was cut by strokes.',
        art: ['scene', { k: 'l37-coins' }],
      },
      {
        k: 'ask',
        h: 'What would it take for you to believe you are someone who is free of this?',
        o: [
          ['A long run with no slips', 'That makes one slip feel like losing who you are. The next cards offer another way.'],
          ['Someone else seeing it in me', 'Being seen helps a lot. You can start the cutting yourself.'],
          ['Feeling it inside, one day', 'That feeling tends to follow the strokes, not come before them.'],
          ['I do not know yet', 'That is honest. Hold it for the next card.'],
        ],
      },
      {
        long: 1,
        h: 'More than two thousand years ago, Aristotle said it the same way.',
        p: 'People become builders by building, he wrote, and harp players by playing the harp. In the same way, **we become brave by doing brave things**. The acts come first.',
        dx: 'More than two thousand years ago, the Greek thinker Aristotle wrote about how a person gets their character. Nobody is born a builder, he said. People become builders by building, and harp players by playing the harp. In the same way, **we become brave by doing brave things**, fair by doing fair things, and steady by doing steady things. The acts come first. Who we are is what they leave behind, the way strokes leave a face.',
        art: ['scene', { k: 'l37-builder' }],
        fact: { s: 'Book · Aristotle, Nicomachean Ethics, book 2', i: [1] },
      },
      {
        h: 'So who you are becoming is not a prize at the end.',
        p: 'It is being cut right now, in the small things you do today. **Each choice is a stroke.** A message sent, a phone put down, an urge ridden out.',
        dx: 'This turns the usual picture around. Most people treat a new way of seeing themselves like a trophy, handed out after a long run with no slips. But a character is not handed out. It is cut. It is being cut right now, in the small things you do today. **Each choice is a stroke.** A message sent to a friend, a phone put down in another room, an urge ridden out to the end. None of them looks like much alone. Together, they are the face.',
        art: ['scene', { k: 'l37-stroke' }],
      },
      {
        n: '132',
        h: 'adults in treatment were followed through their first month.',
        p: 'Most began to see themselves less as users and more as people in recovery. The bigger that shift, **the less often they drank later**, and the more satisfied with life they were.',
        dx: 'In 2015, researchers in Australia followed 132 adults through a treatment community for alcohol and drugs. They asked how each person saw themselves, and kept asking. Over the first month, most came to see themselves less as users and more as people in recovery. The bigger that shift, **the less often they drank later**, and the more satisfied with life they were. The new picture of themselves did not wait for the results. It came early, in the first weeks, and the better results came with it.',
        fact: { s: 'Study · 132 adults · Dingle, Stark, Cruwys & Best, 2015', i: [2] },
      },
      {
        h: 'And one bad stroke does not undo the hundred before it.',
        p: 'An engraver who slips does not throw the die away. **He cuts the next stroke**, the same way as before. A slip is one stroke. The face is still there.',
        dx: 'Every engraver slipped sometimes. The tool jumped, a line went wrong. He did not throw the die away and start over. **He cut the next stroke**, the same way as before, and the next, until the slip was one small line among hundreds. A slip in the habit is the same. It is one stroke. The face you have been cutting is still there, and the next stroke goes on it.',
        art: ['scene', { k: 'l37-slip' }],
        back: 'l3',
      },
      {
        long: 1,
        h: 'The old name will still talk for a while.',
        p: '“You are still the same person who cannot stop.” That is an old mark speaking. **You answer to the one you are cutting now.**',
        dx: 'For a while, the old name will still talk. On a hard day it says, “You are still the same person who cannot stop.” It sounds like the truth because it is old. But it is an old mark speaking, cut by old strokes. You do not have to win an argument with it. **You answer to the one you are cutting now**, and you give it one more stroke.',
        art: ['scene', { k: 'l37-names' }],
      },
    ],
    mine: { h: 'These are strokes you have already cut.', k: 'acted' },
    today: {
      h: 'Cut one stroke today, on purpose.',
      l: ['Write who you are becoming, in one line', 'Do one small thing that person would do', 'After a slip, cut the same stroke again'],
    },
    you: {
      h: 'Who are you becoming, in a few words?',
      o: [
        ['Someone who is free of this', 'Then every choice today is a stroke in that face.'],
        ['Someone the people I love can count on', 'That is a mark worth cutting. It shows in everything.'],
        ['Someone who is honest with themselves', 'Honesty is a stroke you can cut many times a day.'],
        ['I do not know yet', 'Fair. Watch the next good thing you do, and ask what it says about you.'],
      ],
    },
    scope:
      'Where a word comes from does not decide what it means today, and the treatment study was about alcohol and drugs, not porn, and shows what went together. They point one hopeful way: a new way of seeing yourself is built by small acts, it can start early, and a slip does not undo it.',
    src: [S.character, S.aristotle, S.dingle],
  },

  l38: {
    id: 'l38',
    form: 'study',
    title: 'Say “I do not”',
    ic: 'flag',
    ask: 'What do I say to myself when the urge asks for “just once”?',
    key: '“I cannot” is a rule, and rules get argued with. “I do not” is who you are.',
    np: 'My “I do not” sentence',
    tell: [
      {
        h: 'In 2012, two researchers wondered whether two small words could change what people do.',
        p: 'Vanessa Patrick and Henrik Hagtvedt studied how people say no to themselves. Most of us use one of two sentences: **“I cannot” or “I do not.”**',
        dx: 'Vanessa Patrick and Henrik Hagtvedt study why people keep some goals and drop others. In 2012 they looked at something so small that most people never notice it: the words we use to say no to ourselves. Faced with a temptation, most people reach for one of two sentences. **“I cannot” or “I do not.”** I cannot have that. I do not have that. They sound almost the same. The researchers wanted to know whether they work the same.',
        art: ['scene', { k: 'l38-words' }],
      },
      {
        h: 'They gave students a temptation, and a sentence to say back.',
        p: 'Half practiced “I cannot,” as in “I cannot eat that.” Half practiced “I do not.” Then, on the way out, each was **offered a thank-you snack**: a chocolate bar or a granola bar.',
        dx: 'They brought 120 students into a study that looked like it was about something else. Each student pictured a temptation and practiced saying no to it. Half used “I cannot,” as in “I cannot eat that.” Half used “I do not,” as in “I do not eat that.” Then the study seemed to end. On the way out, each student was **offered a thank-you snack**, and had to pick: a chocolate bar or a granola bar. Nobody was watching which one they took, or so they thought.',
        art: ['scene', { k: 'l38-snacks' }],
      },
      {
        k: 'ask',
        h: 'When an urge argues with you, what words do you use to say no?',
        o: [
          ['“I cannot.”', 'That one leans on a rule. Notice whose rule it feels like.'],
          ['“I should not.”', 'That one has a judge in it, and judges get argued with.'],
          ['“Not right now.”', 'That leaves later open, and the urge will ask again.'],
          ['I do not say anything', 'Silence beats bargaining. A short sentence can do more.'],
        ],
      },
      {
        h: 'The “I do not” group picked the granola bar far more often.',
        p: 'About 64 in 100 of them, against 39 in 100 for “I cannot.” **Two small words changed what they did**, after the study was over.',
        dx: 'The difference was large. About 64 in 100 of the students who had practiced “I do not” picked the granola bar. Of the ones who had practiced “I cannot,” about 39 in 100 did. **Two small words changed what they did**, after the study seemed to be over, with nobody asking them to be good. The sentence they had practiced went out the door with them.',
        art: ['people', { n: 64, was: 39, s: 'picked the granola bar' }],
        fact: { s: 'Study · Patrick & Hagtvedt, 2012', i: [0] },
      },
      {
        h: 'Then they tried it for ten days, with people working on a real goal.',
        p: 'Thirty women each got one way to say no. Of those told “I do not,” 8 in 10 kept at their goal all ten days. Of those told “I cannot,” **only 1 in 10 did**.',
        dx: 'A lab is one thing. So the researchers tried it in real life. Thirty women who had signed up for a health and wellness program each got one way to handle temptation for ten days: “I do not,” “I cannot,” or a plain no. At the end, 8 in 10 of the “I do not” group were still keeping at their goal. Of the plain no group, 3 in 10. Of the “I cannot” group, **only 1 in 10 did**. It was a small study, and it pointed the same way as the lab.',
        art: ['scene', { k: 'l38-ten-days' }],
        fact: { s: 'Field study · 30 women · Patrick & Hagtvedt, 2012', i: [0] },
      },
      {
        h: 'Why would two words matter that much?',
        p: '“I cannot” names a rule someone put on you, and a rule feels like being kept from something. **Rules get argued with.** “I do not” names who you are.',
        dx: 'The researchers asked people how each sentence felt. “I cannot” names a rule, and a rule has someone behind it who put it on you. It feels like being kept from something you want. And **rules get argued with**: you can plead with a rule, resent it, look for the gap in it, or slip past it when nobody is looking. “I do not” has no one behind it. It names who you are. The people who said it described feeling in charge, and determined, not deprived.',
        art: ['scene', { k: 'l38-rule' }],
      },
      {
        k: 'flip',
        think: 'To say no, I need a firm rule I am not allowed to break.',
        see: 'A rule leaves a judge in the room for the urge to bargain with. A fact about you gives it nobody to talk to.',
      },
      {
        h: '“I do not” is a sentence about the person you are becoming.',
        p: 'It does not need a judge in the room. **It is a fact you are making true**, one urge at a time, and every urge you outlast makes it more true.',
        dx: '“I do not” is a sentence about the person you are becoming. It does not need anyone to enforce it, and it does not need a judge in the room. **It is a fact you are making true**, one urge at a time. The first few times you say it, it may feel a little ahead of you. That is fine. Every urge you outlast catches the fact up to the sentence, until it is plainly true.',
        art: ['scene', { k: 'l38-door' }],
        back: 'l37',
      },
      {
        long: 1,
        h: 'A slip does not make the sentence a lie.',
        p: '“I do not” names the way you are facing, not a record you keep clean. After a hard day, **you say it again**, and it is just as true of who you are choosing to be.',
        dx: 'A slip can make the sentence feel like a lie. It is not. “I do not” names the way you are facing, not a record you have to keep clean. People who are honest still sometimes say something false, and they are still honest people, because that is the way they face. After a hard day, **you say it again**, and it is just as true of who you are choosing to be.',
        art: ['scene', { k: 'l38-again' }],
      },
    ],
    mine: { h: 'Each urge you outlast makes the fact more true.', k: 'rode' },
    today: {
      h: 'Write your “I do not,” and use it at the first signal.',
      l: ['Keep it short: “I do not watch porn.”', 'Add who you are: “I keep my word to myself.”', 'Say it out loud at the first signal'],
    },
    you: {
      h: 'What is your “I do not” sentence?',
      o: [
        ['“I do not watch porn.”', 'Plain and short. That is the best kind.'],
        ['“I do not do that anymore.”', '“Anymore” says who you were and who you are now. Both are true.'],
        ['“I do not trade my days for that.”', 'That one names what you protect. It is hard to argue with.'],
        ['I do not know yet', 'Fair. Try “I do not” out loud once today, and hear how it sounds.'],
      ],
    },
    scope:
      'The studies were about snacks and health goals, with small groups, and the field study had 30 women. They show a pattern in how people keep their goals, not a cure. The words cost nothing to try, and they put the choice in your own voice.',
    src: [S.patrick],
  },

  l39: {
    id: 'l39',
    form: 'meaning',
    title: 'A year from now',
    ic: 'sunrise',
    ask: 'Why give up something that feels good now?',
    key: 'The easy thing now, or the good thing later. A year from now, someone lives with which one you chose.',
    np: 'One seed I will plant today for a year from now',
    tell: [
      {
        h: 'Under every farm there is a hard, old choice.',
        p: 'It is late winter, and the family is hungry. In the corner sits a sack of seed grain. They could eat it now. The families who **planted it in spring** are the ones who ate the next winter.',
        dx: 'Under every farm in history there is a hard, old choice. Picture it. It is late winter, the stores are low, and the family is hungry. In the corner sits a sack of seed grain, saved from last harvest. It is food. They could eat it now, and the hunger would stop for a week. The families who could not wait are the ones whose fields stayed empty. The families who **planted it in spring**, hungry, are the ones who ate the next winter, and the one after that.',
        art: ['scene', { k: 'l39-seed' }],
      },
      {
        h: 'Giving up something now for something better later may be the oldest wisdom people have.',
        p: 'Every coin saved, every field planted, every year of study is the same trade. **The easy thing now, or the good thing later.** The habit is that same choice, made small.',
        dx: 'Giving up something now for something better later may be the oldest wisdom people have. It is in every coin saved, every field planted, every year of study, every promise kept when breaking it would be easier. It is the same trade each time. **The easy thing now, or the good thing later.** People did not get from caves to cities by taking the easy thing. And the habit is that same choice, made small enough to fit in a few minutes.',
        art: ['scene', { k: 'l39-trade' }],
      },
      {
        h: 'The hard part: the easy thing and the good thing are rarely the same thing.',
        p: 'What feels good now and what you will be glad of later **almost never line up**. A life gets its shape from which one a person picks, again and again.',
        dx: 'This is the hard part, and it is worth saying plainly. The easy thing and the good thing are rarely the same thing. What feels good now and what you will be glad of later **almost never line up**. If they did, nobody would need courage. A life gets its shape from which one a person picks, not once, but again and again, on ordinary days when nobody is watching.',
        art: ['scene', { k: 'l39-paths' }],
      },
      {
        k: 'ask',
        h: 'Think of something you are glad you did, years later. Was it easy at the time?',
        o: [
          ['No, it was hard', 'Most of the things people are glad of were. That is not an accident.'],
          ['It was easy, and worth it', 'Those exist, and they are rare. Keep them too.'],
          ['I cannot think of one yet', 'Then this year can make one. That is what this lesson is about.'],
        ],
      },
      {
        h: 'Every time you take the easy thing, you eat a little of the seed.',
        p: 'It feels like nothing in the moment. One handful. But **the field you could have had is made of those handfuls**, and so is the one you will have.',
        dx: 'Every time you take the easy thing, you eat a little of the seed. It never feels like much. One handful, on one hard evening. Nobody starves from one handful. But the field is made of handfuls. **The field you could have had is made of those handfuls**, and so is the one you will have. That is what the habit costs. Not one evening, but what that evening could have grown into.',
        art: ['scene', { k: 'l39-handful' }],
      },
      {
        long: 1,
        h: 'Part of the trouble is that your mind files future you with strangers.',
        p: 'Students asked to drink a foul mix of ketchup and soy sauce agreed to a little for themselves today, and **signed their future selves up for much more**, about as much as for a stranger.',
        dx: 'Part of the trouble is in how the mind sees time. In 2008, researchers asked students how much of a disgusting drink, ketchup mixed with soy sauce, they would drink for science. For themselves, that day, they agreed to a little. For themselves later in the term, they **signed their future selves up for much more**, about as much as they would sign up a stranger. The mind treats future you a lot like someone else, someone whose problems are not quite yours.',
        art: ['scene', { k: 'l39-cup' }],
        fact: { s: 'Experiments · Pronin, Olivola & Kennedy, 2008', i: [0] },
      },
      {
        long: 1,
        h: 'When people met their own older face, they chose differently.',
        p: 'Shown a picture of themselves made to look decades older, people **set more money aside for later**. Once future them had a face, they got a say.',
        dx: 'Other researchers tried to fix that. They showed people pictures of their own faces, made by computer to look decades older, some of them in virtual reality, so they could look their older self in the eye. Afterward, those people **set more money aside for later** in a savings task than people who saw their face as it was. Once future them had a face, they got a say.',
        art: ['scene', { k: 'l39-face' }],
        fact: { s: 'Experiments · Hershfield and colleagues, 2011', i: [1] },
      },
      {
        h: 'A year from now, someone wakes up with today.',
        p: 'They are not a stranger. **They are someone you are responsible for**, the way you would be for a friend you care about. What you choose today is the house they live in.',
        dx: 'A year from now, someone will wake up with today. They will have your name, your face and your memory of this week. They are not a stranger, and they are not a problem for later. **They are someone you are responsible for**, the way you would be for a friend you care about, or a child in your care. You would not hand that person something that harms them. What you choose today is the house they live in.',
        art: ['scene', { k: 'l39-year' }],
      },
      {
        long: 1,
        h: 'And something worth carrying holds you up.',
        p: 'People with nothing to carry often feel lost. A real thing to carry, a person, a craft, a promise to yourself, **gives the days a shape** the habit never could.',
        dx: 'There is one more side to this. The good thing later is often heavier than the easy thing now. It asks more of you. But people with nothing to carry often feel lost and restless, and that restlessness is fuel for the habit. A real thing to carry, a person who counts on you, a craft you are getting better at, a promise you keep to yourself, **gives the days a shape** the habit never could. The weight is part of what holds you up.',
        art: ['scene', { k: 'l39-carry' }],
      },
    ],
    mine: { h: 'Every day that holds is one you hand to the person you will be.', k: 'clean30' },
    today: {
      h: 'Plant one seed today.',
      l: ['Pick one thing you will be glad of later', 'Do the first ten minutes of it today', 'Write what it is for, in a few words'],
    },
    you: {
      h: 'A year from now, what do you want to be glad you started today?',
      o: [
        ['Being free of this', 'Then today is one of the days that builds it.'],
        ['Something I keep putting off', 'Then ten minutes of it today is a seed in the ground.'],
        ['Being someone people can count on', 'That is planted in small kept promises, starting now.'],
        ['I do not know yet', 'Fair. Picture yourself a year from now, and ask what they wish you had started.'],
      ],
    },
    scope:
      'The seed grain is a picture of an old human trade, not a study. The future-self experiments were with students and savers, not with people quitting porn, and they show how people tend to treat the person they will be. The trade is the same in every habit: the easy thing now, or the good thing later.',
    src: [S.pronin, S.hershfield],
  },

  l40: {
    id: 'l40',
    form: 'study',
    title: 'Your log is your evidence',
    ic: 'check',
    ask: 'How do I start to believe I am someone who is free of this?',
    key: 'Memory keeps the worst moment and the last. Your log keeps every day. On a hard morning, trust the log.',
    np: 'What my log says about who I am becoming',
    tell: [
      {
        h: 'In 1993, volunteers came to a lab to put one hand in cold water.',
        p: 'Painfully cold: 14 degrees Celsius, about as cold as a mountain stream, cold enough to ache within seconds. They held it there for **a full minute**.',
        dx: 'In 1993, a team led by Daniel Kahneman, a psychologist who later won a Nobel Prize, brought volunteers into a lab. Each one put a hand into a tub of water at 14 degrees Celsius, about as cold as a mountain stream. That is cold enough to ache within seconds, and to hurt more the longer it lasts. They held it there for **a full minute**, while the other hand moved a dial to show how much it hurt, moment by moment.',
        art: ['scene', { k: 'l40-cold' }],
      },
      {
        h: 'Another time, they did it for a minute and a half.',
        p: 'The first minute was exactly the same. Then, for 30 more seconds, the water was warmed by about one degree. Still cold, still painful, **only a little less**.',
        dx: 'Another time, the same volunteers did it again, with one change. The first minute was exactly the same, the same cold, the same ache. Then, without a word, the water was warmed by about one degree for 30 more seconds. Still cold, still painful, **only a little less**. By any count, this trial had more pain in it than the first one: the same minute, plus half a minute more.',
        art: ['scene', { k: 'l40-longer' }],
      },
      {
        k: 'ask',
        h: 'Then they were asked: which one would you rather do again? Which would you pick?',
        o: [
          ['The short one, it hurt for less time', 'That is the sensible answer. Look at what most people chose.'],
          ['The long one, it ended easier', 'Then your memory works like most people’s. Look at the number.'],
          ['Neither one', 'Fair. They had to pick one. Look at what they chose.'],
        ],
      },
      {
        h: 'Most of them chose the longer one.',
        p: 'More pain, by any measure. But **memory kept the worst moment and the ending**, and dropped how long it lasted. The gentler ending made the whole thing feel smaller.',
        dx: 'About 69 in 100 of them chose the longer one, the one with more pain in it. Their dials had shown, moment by moment, how much each one hurt. But that is not what they remembered. **Memory kept the worst moment and the ending**, and dropped how long it lasted. The slightly gentler ending made the whole thing feel smaller in memory, even though it was bigger in life.',
        art: ['people', { n: 69, s: 'chose the longer one' }],
        fact: { s: 'Study · Kahneman and colleagues, 1993', i: [0] },
      },
      {
        long: 1,
        h: 'Doctors later found the same thing in patients.',
        p: 'People after a painful medical test judged it by its worst moment and its last few minutes. When the end was made a little gentler, they **remembered the whole test as easier**.',
        dx: 'Doctors later tested the same idea with patients having a painful medical exam. Half had the exam as usual. For the other half, the end was made a little gentler, with a few extra minutes that hurt less. Those patients **remembered the whole test as easier**, and more of them came back for the next one, even though their exam had lasted longer. Memory had judged it by its worst moment and its last few minutes.',
        art: ['scene', { k: 'l40-doctor' }],
        fact: { s: 'Trial · Redelmeier, Katz & Kahneman, 2003', i: [1] },
      },
      {
        h: 'Your memory scores your weeks the same way.',
        p: 'After a slip, memory keeps the worst moment and the last one. **The quiet days fall away**: the evenings you got through, the urges you rode out, the mornings you woke up clear.',
        dx: 'Your memory scores your weeks the same way it scored the cold water. After a slip, it keeps the worst moment, and it keeps the last one, which is often the same moment. **The quiet days fall away**: the evenings you got through without a fight, the urges you rode out, the mornings you woke up clear. They were real, and they were most of the week. They left almost no mark, because nothing in them was sharp.',
        art: ['scene', { k: 'l40-week' }],
      },
      {
        k: 'flip',
        think: 'The last thing I did shows who I really am.',
        see: 'Memory keeps the sharpest moment and the ending. It is a poor judge of a month.',
      },
      {
        h: 'A log does not forget the quiet days.',
        p: 'It counts every one, the same size as the hard one. It is a fairer witness than a hard morning. **Trust the log, not your memory.**',
        dx: 'A log does not work like memory. It does not keep the sharp moments and drop the plain ones. It counts every day, and each one takes the same space as the hard one. The evening you got through is a line, just like the slip is a line. That makes it a fairer witness than a hard morning will ever be. **Trust the log, not your memory**, especially on the mornings when memory is loudest.',
        art: ['scene', { k: 'l40-log' }],
      },
      {
        long: 1,
        n: '138',
        h: 'experiments found that tracking progress helps people reach a goal.',
        p: 'It helped more when **the progress was written down** or shared. A record sees what memory skips.',
        dx: 'A large review in 2016 pooled 138 experiments, most of them on health goals. In each, some people were asked to track their progress and some were not. Tracking helped people reach their goals, and it helped more when **the progress was written down** or shared with someone. A record sees what memory skips, and seeing it changes what people do next.',
        fact: { s: 'Meta-analysis · 138 experiments · Harkin and colleagues, 2016', i: [2] },
      },
      {
        long: 1,
        h: 'The person you are becoming leaves footprints there.',
        p: 'Each honest entry is evidence. Read a few weeks of it back, and **you meet someone you might not recognize** from memory alone.',
        dx: 'Over time, the log becomes something more than a count. The person you are becoming leaves footprints there. Each honest entry is evidence, the urge you rode out, the comeback after a hard day. Read a few weeks of it back, and **you meet someone you might not recognize** from memory alone. That person is real. The log is how you get to know them.',
        art: ['scene', { k: 'l40-steps' }],
        back: 'l37',
      },
    ],
    mine: { h: 'Here is what your log keeps that memory drops.', k: 'rode' },
    today: {
      h: 'On a hard morning, read the log, not your memory.',
      l: ['Log the hard day honestly, as one day', 'Read back over the last two weeks', 'Say it: “One day, not the month.”'],
    },
    you: {
      h: 'When you look back on a hard week, what do you remember first?',
      o: [
        ['The worst moment', 'Most minds do. One moment ends up standing in for seven days.'],
        ['How it ended', 'Endings shout. Now you know why they count for too much.'],
        ['The urges I rode out', 'That is rare and worth keeping. Many people forget those first.'],
        ['I do not know yet', 'Try it with last week. Notice what comes up first.'],
      ],
    },
    scope:
      'The cold-water and patient studies were about remembered pain, not habits, and they show how memory tends to work, not how it always works. The tracking review pooled 138 experiments, mostly on health goals. Together they show why an honest log is a fairer witness than a hard morning.',
    src: [S.kahneman, S.redelmeier, S.harkin],
  },

  l42: {
    id: 'l42',
    form: 'study',
    title: 'Crowd out the picture',
    ic: 'sparkle',
    ask: 'Why would a small puzzle help when an urge is strong?',
    key: 'An urge grows by painting a picture. The mind has one small screen, so give it a puzzle.',
    np: 'What my eyes and hands can do when an urge starts',
    tell: [
      {
        h: 'Craving researchers asked people what a craving is like from the inside.',
        p: 'The answers were close to the same. It starts as a passing thought. Then it **turns into a picture**: the taste, the smell, the feel of it, filling in. The sharper the picture gets, the stronger the pull.',
        dx: 'Psychologists in England and Australia pulled together years of studies in which people described their cravings, for food, for cigarettes, for drink. The same pattern kept coming up. A craving starts as a passing thought, almost nothing. Then it **turns into a picture**: the taste, the smell, the feel of it, filling in detail by detail. People were not only wanting. They were watching something in their heads. And the sharper the picture got, the stronger the pull.',
        art: ['scene', { k: 'l42-picture' }],
        fact: { s: 'Theory · Kavanagh, Andrade & May, 2005', i: [0] },
      },
      {
        h: 'And the mind has only one small screen for pictures.',
        p: 'Try to picture a red apple and, **at the same time**, the face of a friend, both sharp. One always slips. The screen holds one picture well, and not two.',
        dx: 'That gave them an idea, because the mind has only one small screen for pictures. You can test it now. Picture a red apple, shiny, with a leaf on the stem. Now, **at the same time**, picture the face of a good friend, just as sharp. One of them always slips, or both go blurry. The screen holds one picture well, and not two. Whatever fills it leaves less room for anything else.',
        art: ['scene', { k: 'l42-screen' }],
      },
      {
        h: 'So they wondered what would happen if the screen had something else to show.',
        p: 'Not a thought in words, which leaves the screen free. A job for the eyes: **a puzzle of falling blocks** that has to be watched, turned and fitted, the game called Tetris.',
        dx: 'So the researchers wondered what would happen if they gave the screen something else to show. Not a thought in words, like counting or reciting, because words use a different part of the mind and leave the picture screen free. They wanted a job for the eyes: **a puzzle of falling blocks** that has to be watched, turned and fitted before it lands. The game called Tetris was perfect. It is plain, it has nothing in it to start a new craving, and it fills the screen.',
        art: ['scene', { k: 'l42-blocks' }],
      },
      {
        h: 'In 2015, they texted 31 young adults seven times a day, for a week.',
        p: 'Each time, people rated any craving they had: food, coffee, cigarettes, drink, and sexual urges among them. Then half of them **played the block game for three minutes**.',
        dx: 'In 2015, they took the idea out of the lab and into ordinary days. For a week, 31 young adults got a text message seven times a day. Each time, they rated any craving they had right then: for food, coffee, cigarettes, drink, and sexual urges among them. Then half of them **played the block game for three minutes** on their phones, and rated the craving again. The other half rated it again without playing.',
        art: ['scene', { k: 'l42-texts' }],
      },
      {
        k: 'ask',
        h: 'When an urge turns into a picture, what usually happens next?',
        o: [
          ['It gets sharper the longer I wait', 'Waiting with nothing to do leaves it the whole screen.'],
          ['I push it away, and it stays', 'Pushing tends to keep it close. Hold on to that.'],
          ['Something grabs me, and it fades', 'Then you have seen something the study looked at. Hold on to that.'],
          ['I have never noticed', 'Watch the next one. Notice the moment it turns into a picture.'],
        ],
      },
      {
        h: 'On average, a game cut the craving by about 14 points out of 100.',
        p: 'It worked **for every kind of craving** they had, not only one. And it did not wear off as the week went on. Each game was a small win.',
        dx: 'On average, each three-minute game cut the craving by about 14 points on a scale of 100. It worked **for every kind of craving** they had, food, drink, cigarettes and the rest, not only one. And it did not wear off as the week went on, the way a trick might. The last day worked as well as the first. Each game was a small win, three minutes long, and it was there every time they reached for it.',
        art: ['scene', { k: 'l42-drop' }],
        fact: { s: 'Field study · 31 people · Skorka-Brown and colleagues, 2015', i: [1] },
      },
      {
        long: 1,
        h: 'In an emergency room in Oxford, the same game did something else.',
        p: 'People who had just been in a road accident played it for 20 minutes. Over the next week, they had **fewer flashbacks** of the crash than people who did not.',
        dx: 'Another team tried the same game in an emergency room in Oxford. People who had just been in a road accident, still waiting in the hospital, either played it for 20 minutes or wrote down what they had done that day. Over the next week, the players had **fewer flashbacks** of the crash, the pictures that push in uninvited. It was a small first trial. The puzzle used the same small screen the crash pictures needed.',
        art: ['scene', { k: 'l42-er' }],
        fact: { s: 'Trial · 71 patients · Iyadurai and colleagues, 2018', i: [2] },
      },
      {
        h: 'Pushing a picture away keeps you looking at it. Filling the screen does not.',
        p: 'A puzzle is not a fight with the picture. **It takes the room the picture needs**, and the pull loses its color.',
        dx: 'This is why the puzzle works when pushing does not. Pushing a picture away keeps your eyes on it, the way the white bear came back to everyone told not to think of it. Filling the screen is different. A puzzle is not a fight with the picture at all. **It takes the room the picture needs**, and a picture with no room cannot stay sharp. The pull loses its color, and an urge without its picture is much easier to ride out.',
        art: ['scene', { k: 'l42-full' }],
        back: 'l2',
      },
      {
        long: 1,
        h: 'It has to be a puzzle with nothing in it to start a new picture.',
        p: 'A feed of videos fills the screen too, and it is full of **cues for new pictures**. Shapes, numbers, a word game: plain things for the eyes and hands.',
        dx: 'One warning. Not everything that fills the screen helps. A feed of videos fills it too, and it is full of **cues for new pictures**, one swipe from the habit. The puzzle works because it is plain: shapes, numbers, a word game, something to draw. It gives the eyes and hands a job and nothing to dream about. That is why Daybook keeps one in SOS, Fit the shapes, one tap away.',
        art: ['scene', { k: 'l42-plain' }],
      },
    ],
    mine: { h: 'Here is when to have the puzzle ready.', k: 'hour' },
    today: {
      h: 'When the picture starts, give your eyes a job.',
      l: ['Open Fit the shapes in SOS', 'Play a few minutes, eyes on the board', 'Then stand up and do the next thing'],
    },
    you: {
      h: 'What could your eyes and hands do the next time a picture starts?',
      o: [
        ['Fit the shapes in SOS', 'That is the closest thing to the study. Keep it one tap away.'],
        ['A word or number puzzle', 'Plain, with nothing in it to start a new picture. That works.'],
        ['Something with my hands, like drawing', 'Hands and eyes together take up a lot of the screen.'],
        ['I do not know yet', 'Fair. Try Fit the shapes once, at the next urge, and see.'],
      ],
    },
    scope:
      'The block game studies were with young adults and their everyday cravings, and with crash patients, not with the habit you are quitting, and one author calls it a tool, not a treatment. The pattern carries over well: the mind’s screen is small, and a puzzle for the eyes takes the space a picture needs.',
    src: [S.kavanagh, S.skorka, S.iyadurai],
  },

  l43: {
    id: 'l43',
    form: 'works',
    title: 'Come back to the room',
    ic: 'compass',
    ask: 'When an urge pulls me into my head, how do I get back out?',
    key: 'You do not need a better thought. Come back through what you can see, feel and smell.',
    np: 'The things around me that bring me back',
    tell: [
      {
        h: 'In SOS, one tool asks you to name five things you can see.',
        p: 'Then four you can feel, three you can hear, two you can smell, one you can taste. It looks **too plain to stand up to a strong urge**. The next cards show why it is not.',
        dx: 'In SOS, there is a tool called 5-4-3-2-1. It asks you to name five things you can see. Then four you can feel, three you can hear, two you can smell, and one you can taste. It looks almost **too plain to stand up to a strong urge**, like a trick for children, and it is easy to skip for that reason. The research behind it says otherwise. Try a small piece of it now: look up, and find one thing in the room you had not noticed today. That small jump is the whole tool.',
        art: ['scene', { k: 'l43-count' }],
      },
      {
        h: 'An urge pulls you out of the room and into a scene in your head.',
        p: 'Your body is in a chair, or on a couch. Your mind is somewhere else, in a picture it is painting. **The urge lives in that picture**, not in the room around you.',
        dx: 'Think of where you are during a strong urge. Your body is on the couch, or at a desk, or in a car. Your mind is somewhere else, in a scene it is painting, filling in what it wants. You can be sitting in a room and hardly see it. **The urge lives in that picture**, not in the room around you. The lamp, the floor and the window are still there. You have stopped noticing them.',
        art: ['scene', { k: 'l43-away' }],
      },
      {
        h: 'And the picture borrows your senses.',
        p: 'A pictured taste uses the mind’s sense of taste. A pictured scene uses the mind’s eyes. In experiments, **keeping the eyes or the nose busy** turned cravings down.',
        dx: 'This is the key. The picture is built out of your senses. A pictured taste uses the mind’s sense of taste. A pictured scene uses the mind’s eyes. In a set of experiments in Australia, people craving a food were given small tasks for different senses. **Keeping the eyes or the nose busy**, picturing a rainbow or imagining a smell, turned cravings down more than a task for the ears. The senses the craving was using were busy.',
        art: ['scene', { k: 'l43-senses' }],
        fact: { s: 'Experiments · Kemps & Tiggemann, 2007', i: [1] },
      },
      {
        h: 'In 2012, the same researchers made young women crave chocolate.',
        p: 'They showed them photos of it until they wanted some. Then each one smelled jasmine, green apple, or plain water. **Jasmine cut the craving the most.**',
        dx: 'In 2012, the same researchers went further. They showed 67 young women photos of chocolate, one after another, until they wanted some. Then each one smelled a small bottle: jasmine, green apple, or plain water. **Jasmine cut the craving the most.** The smell had nothing to do with chocolate. It did not answer the craving at all. It gave the senses something real, here and now, and the craving lost ground.',
        art: ['scene', { k: 'l43-jasmine' }],
        fact: { s: 'Study · 67 women · Kemps, Tiggemann & Bettany, 2012', i: [0] },
      },
      {
        k: 'ask',
        h: 'When an urge pulls you into your head, what do you usually try?',
        o: [
          ['Think about something else', 'Notice how long that holds next time. The next cards are about a faster way.'],
          ['Tell myself firmly to stop', 'Many people start there. Notice where your attention goes after.'],
          ['Reach for my phone', 'Notice where that leads. The room is the other choice.'],
          ['I do not know yet', 'Notice next time where your attention goes first.'],
        ],
      },
      {
        h: 'A better thought is hard to find under pressure. The room is already here.',
        p: 'Hunting for something to think about takes effort, right when effort is low. The room takes none: **the floor under your feet**, the air on your skin, the lamp across from you.',
        dx: 'Under pressure, a better thought is hard to find. You hunt for something to think about, and the hunt takes effort right when effort is lowest, while the urge sits next to whatever you find. The room takes no hunting. **The floor under your feet** is already there. So is the air on your skin, the hum of the fridge, the lamp across from you. Each one uses a sense the picture was borrowing, and each one is real and here.',
        art: ['scene', { k: 'l43-floor' }],
      },
      {
        h: 'So each thing you name takes a little of the screen back.',
        p: 'Five things to see is five jobs for the eyes. Four to feel is four for the skin. **Each one is a piece of the room** the picture cannot have.',
        dx: 'Now the tool makes sense. Five things to see is five jobs for the eyes, the same eyes the picture was borrowing. Four to feel is four for the skin. Three to hear, two to smell, one to taste. **Each one is a piece of the room** the picture cannot have. By the end, your senses are full of where you are, and there is far less of them left for where the urge wanted you to be.',
        art: ['scene', { k: 'l43-five' }],
      },
      {
        long: 1,
        h: 'If the picture comes back, come back again.',
        p: 'Minds wander back. That is not the tool failing. **Coming back again is the skill**, and it gets quicker every time you do it.',
        dx: 'The picture will often come back, especially the first few times. Minds wander back to what pulls them. That is not the tool failing, and it is not you failing. **Coming back again is the skill**: notice you have drifted, and name one more thing you can see. It gets quicker every time. The room is always there, so you can always come back to it.',
        art: ['scene', { k: 'l43-again' }],
        back: 'l42',
      },
    ],
    today: {
      h: 'Count your way back into the room.',
      l: ['5 things you can see, 4 you can feel', '3 you can hear, 2 smell, 1 taste', 'If the picture returns, come back again'],
    },
    you: {
      h: 'What in your own room could bring you back fastest?',
      o: [
        ['Something to touch, like cold water', 'Cold water on the hands is hard to ignore. That is what makes it work.'],
        ['A smell I like', 'Keep it near. The jasmine worked because it was real and here.'],
        ['Looking out a window', 'Far-off things give the eyes real work, and that brings you back.'],
        ['I do not know yet', 'Fair. Try the five things once, and notice which sense brings you back first.'],
      ],
    },
    scope:
      'The smell study and the senses experiments were about food cravings in young women, not the habit you are quitting. What carries over is the direction: something real for the senses turns a craving down, and the room around you is always there to use.',
    src: [S.kemps12, S.kemps07],
  },

  l44: {
    id: 'l44',
    form: 'meaning',
    title: 'Play it forward',
    ic: 'compass',
    ask: 'What can I think about during an urge that makes it weaker?',
    key: '“It does not matter” only sounds true while the hour after is out of sight. Play it forward, both ways.',
    np: 'How I feel an hour after, both ways',
    tell: [
      {
        h: 'In the old book of Pinocchio, the boy who talks him onto the coach is called Lampwick.',
        p: 'He is long and thin, the laziest boy in the school, and Pinocchio’s favorite. In his way, **he has one answer for every worry**: none of it matters.',
        dx: 'In Collodi’s old book of Pinocchio, the boy who talks him onto the coach to the Land of Toys is called Lampwick, because he is long and thin like the wick of a lamp. He is the laziest boy in the class, and the most fun, and Pinocchio loves him more than anyone at school. Lampwick is never worried about anything. **He has one answer for every worry**: none of it matters. School does not matter. Home does not matter. Tomorrow does not matter.',
        art: ['scene', { k: 'l44-wick' }],
        fact: { s: 'Story · Collodi, The Adventures of Pinocchio, 1883', i: [0] },
      },
      {
        h: 'At the coach, Pinocchio stops.',
        p: 'He thinks of the fairy waiting for him at home, and of his promise. He almost turns back. Lampwick shrugs. **One day of fun**, he says, will not change anything.',
        dx: 'The night the coach comes, Pinocchio stops at the side of the road. He had promised the fairy he would come home and become a real boy the next day. He thinks of her waiting. He almost turns back. Lampwick only shrugs. Go home if you like, he says. Nobody is making you come. It is **one day of fun**, and one day will not change anything. Pinocchio climbs on.',
        art: ['scene', { k: 'l44-coach' }],
      },
      {
        h: 'That sentence is the urge’s favorite.',
        p: '“Just once.” “It does not matter.” “Nobody will know.” Each one shrinks the world down to **the next few minutes**, where nothing seems to cost anything. The cost lives outside the frame.',
        dx: 'Lampwick’s sentence is the urge’s favorite, in all its forms. “Just once.” “It does not matter.” “Nobody will know.” “You can start again tomorrow.” Listen to what each one does. It shrinks the world down to **the next few minutes**, where nothing seems to cost anything. In that small world, it is even true. Nothing in the next few minutes costs much. The cost lives outside the frame.',
        art: ['scene', { k: 'l44-small' }],
      },
      {
        k: 'ask',
        h: 'When the urge is loud, what does it tell you?',
        o: [
          ['“Just once.”', 'That is Lampwick at the coach. Look at where the coach went.'],
          ['“It does not matter.”', 'That is his favorite. The next cards are about whether it is true.'],
          ['“You deserve this.”', 'That one sounds kind. Look at what it leaves out.'],
          ['Nothing. I am on autopilot', 'Then the sentence is under the surface. It is often there all the same.'],
        ],
      },
      {
        h: 'Months later, Pinocchio is sent to turn a farmer’s wheel, because the donkey that turned it is dying.',
        p: 'He goes into the stable to see the donkey, and knows him. It is Lampwick. The boy who said nothing mattered **had worked that wheel until he fell**.',
        dx: 'The story does not leave Lampwick in the Land of Toys. Both boys turn into donkeys there, and are sold. Many months later, Pinocchio, a puppet again, needs milk for his sick father. A farmer offers him a glass a day if he will turn the wheel that draws water from the well, because the donkey that turned it is too ill to work. Pinocchio goes into the stable to see it, lying on the straw, and knows him. It is Lampwick. The boy who said nothing mattered **had worked that wheel until he fell**, and he dies there, in Pinocchio’s arms.',
        art: ['scene', { k: 'l44-stable' }],
      },
      {
        h: 'It always mattered. The urge only keeps the hour after in the dark.',
        p: 'In the moment, the next ten minutes fill the whole screen. The hour after, and tomorrow, **are kept out of view**. That is how “it does not matter” sounds true.',
        dx: 'It always mattered. Lampwick was not wrong because he was bad. He was wrong because he only ever looked at the next few minutes. The urge does the same thing to you. In the moment, the next ten minutes fill the whole screen, bright and close. The hour after, and tomorrow, **are kept out of view**. You know they are coming. You just cannot see them. That is how “it does not matter” sounds true.',
        art: ['scene', { k: 'l44-dark' }],
      },
      {
        h: 'Smokers who thought about later wanted the cigarette less.',
        p: 'In a brain scanner, they saw pictures of cigarettes. When they thought about **what would come later**, their craving fell, with the same pictures in front of them.',
        dx: 'In 2010, researchers in New York put 21 smokers in a brain scanner and showed them pictures of cigarettes and rich food. Sometimes they were asked to think about how it would feel right now. Sometimes they were asked to think about **what would come later**, the long run, the cost. Thinking of later turned their craving down, with the same pictures in front of them. The planning parts at the front of the brain grew busier, and the reward center grew quieter.',
        art: ['scene', { k: 'l44-later' }],
        fact: { s: 'Study · 21 smokers · Kober and colleagues, 2010', i: [1] },
      },
      {
        long: 1,
        n: '93',
        h: 'smokers practiced looking past the moment, in one short session.',
        p: 'In the weeks after, they **smoked about a quarter to a half fewer cigarettes** a day. Smokers who did not practice stayed about the same. The view past the moment can be trained.',
        dx: 'Later, the same group ran two trials with 93 smokers. In one short session, they practiced thinking of what comes later while looking at pictures of cigarettes. That was all. In the weeks after, they **smoked about a quarter to a half fewer cigarettes** a day. The smokers who did not practice stayed about the same. Looking past the moment is not a gift some people have. It is a skill, and it grows with practice.',
        fact: { s: 'Trials · 93 smokers · Lopez, Ochsner & Kober, 2022', i: [2] },
      },
      {
        h: 'So when the urge says it does not matter, play it forward.',
        p: 'Both ways. The hour after giving in, in your own words. The hour after riding it out. **Look at both, and pick one.** That is the look Lampwick never took.',
        dx: 'So when the urge says it does not matter, do what Lampwick never did. Play it forward, both ways. First, the hour after giving in, in your own words: maybe tired, flat, hiding something. Then the hour after riding it out: maybe calm, clear, glad. Do not argue with the urge. Only turn the lights on in the hour after. **Look at both, and pick one.** That is the look Lampwick never took, and it is yours to take every time.',
        art: ['scene', { k: 'l44-both' }],
      },
      {
        long: 1,
        h: 'Pinocchio took up the same wheel.',
        p: 'He turned it every day for months, for a glass of milk for his father. **His days at it added up**, and he became real.',
        dx: 'Pinocchio took up the same wheel. Where Lampwick had worked it until he fell, Pinocchio turned it every day for months, for a glass of milk for his sick father, and studied at night. None of those days felt like much on its own. But **his days at it added up**, and one morning he woke up a real boy. Same wheel, two endings. Lampwick said his days did not matter. Pinocchio’s did.',
        art: ['scene', { k: 'wheel' }],
        back: 'l41',
      },
    ],
    mine: { h: 'Every urge you ride out gives you an hour after to see.', k: 'rode' },
    today: {
      h: 'At the next urge, play the hour forward, both ways.',
      l: ['The hour after giving in: name it', 'The hour after riding it out: name it', 'Look at both, and pick one'],
    },
    you: {
      h: 'When you play forward the hour after riding it out, what is in it?',
      o: [
        ['A clear head', 'Name it in those words at the next urge. It is easier to pick what you can see.'],
        ['Time for something I care about', 'That is what the hour after holds. Keep it in view.'],
        ['Feeling steady with the people around me', 'That is worth looking at when the urge says it does not matter.'],
        ['I cannot see it yet', 'That is common at first. Play it forward once, and look again.'],
      ],
    },
    scope:
      'Pinocchio is a story, not a study, and the brain-scan study and the practice trials were with smokers, not people quitting your habit. What carries over is the skill: looking past the moment turned craving down, and it grew stronger with practice.',
    src: [S.collodi, S.kober10, S.lopez22],
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
