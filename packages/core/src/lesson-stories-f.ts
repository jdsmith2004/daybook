/* Lessons told as a story, batch F (the shape is in lesson-stories.ts, the standard in docs/lessons.md, the remap brief in the
   side-session notes, lesson-remap-brief.md). Written November 14, 2026 by the lessons-45 session: l45 to l49 first (the Sirens, the
   desert after Egypt, the partner and the truth, the watcher in the room, the cigarette on the desk), then l54 to l58, then the
   lessons of one habit, l50 to l53. No lesson here asks a person to guess a fact they cannot know, and none puts a clock time on
   everyone. l47 and l48 are frank and kind, and never explicit. */
import type { Story, StoryPart } from './lesson-stories';
import { SRC_NIGHT as N } from './lessons-night';

type Src = [string, string];
const S = {
  homer: ['Homer: The Odyssey, book 12, Odysseus and the Sirens (public domain translation)', 'https://www.gutenberg.org/ebooks/1727'],
  apollonius: ['Apollonius of Rhodes: the Argonautica, book 4, Orpheus and the Sirens (public domain translation)', 'https://www.gutenberg.org/ebooks/830'],
  sayette: [
    'Sayette, Loewenstein, Griffin & Black (2008): exploring the cold-to-hot empathy gap in smokers, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2008.02178.x',
  ],
  ariely06: [
    'Ariely & Loewenstein (2006): the heat of the moment, the effect of sexual arousal on sexual decision making, Journal of Behavioral Decision Making',
    'https://doi.org/10.1002/bdm.501',
  ],
  exodus: ['The book of Exodus, chapters 12 and 16, and Numbers 11 (King James Version, public domain)', 'https://www.gutenberg.org/ebooks/10'],
  taylor: [
    'Taylor, McNeill, Girling, Farley, Lindson-Hawley & Aveyard (2014): change in mental health after smoking cessation, systematic review and meta-analysis, BMJ',
    'https://pubmed.ncbi.nlm.nih.gov/24524926/',
  ],
  fernandez: [
    'Fernandez and colleagues (2023): a week without pornography, a randomized trial with students, Archives of Sexual Behavior',
    'https://link.springer.com/article/10.1007/s10508-022-02519-w',
  ],
  brown: [
    'Brown & Schuckit (1988): changes in depression among abstinent alcoholics, Journal of Studies on Alcohol',
    'https://doi.org/10.15288/jsa.1988.49.412',
  ],
  dsm: ['American Psychiatric Association: DSM-5, gambling disorder', 'https://www.psychiatry.org/psychiatrists/practice/dsm'],
  lally: ['Lally, van Jaarsveld, Potts & Wardle (2010): how are habits formed, European Journal of Social Psychology', 'https://doi.org/10.1002/ejsp.674'],
  resch14: [
    'Resch & Alderson (2014): female partners of men who use pornography, are honesty and mutual use associated with relationship satisfaction? Journal of Sex & Marital Therapy',
    'https://pubmed.ncbi.nlm.nih.gov/23898992/',
  ],
  zitzman09: [
    'Zitzman & Butler (2009): wives’ experience of husbands’ pornography use and concomitant deception as an attachment threat, Sexual Addiction & Compulsivity',
    'https://doi.org/10.1080/10720160903202679',
  ],
  schneider98: [
    'Schneider, Corley & Irons (1998): surviving disclosure of infidelity, results of an international survey of 164 recovering sex addicts and partners, Sexual Addiction & Compulsivity',
    'https://jenniferschneider.com/articles/Surviving_Disclosure_of_Infidelity.html',
  ],
  masters70: ['Masters & Johnson (1970): Human Sexual Inadequacy, spectatoring and sensate focus (overview)', 'https://en.wikipedia.org/wiki/Sensate_focus'],
  barlow86: [
    'Barlow (1986): causes of sexual dysfunction, the role of anxiety and cognitive interference, Journal of Consulting and Clinical Psychology',
    'https://pubmed.ncbi.nlm.nih.gov/3700800/',
  ],
  nelson11: [
    'Nelson & Purdon (2011): non-erotic thoughts, attentional focus, and sexual problems in a community sample, Archives of Sexual Behavior',
    'https://doi.org/10.1007/s10508-010-9693-1',
  ],
  nordgren09: [
    'Nordgren, van Harreveld & van der Pligt (2009): the restraint bias, how the illusion of self-restraint promotes impulsive behavior, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2009.02468.x',
  ],
} satisfies Record<string, Src>;

/* l46 is read by people quitting drinking or gambling too (lesson-habit.ts HABIT_OPEN): the week off porn is swapped for what fits
   their habit. For drinking, the swapped card says first that a doctor should help with the first days, since stopping heavy drinking
   all at once can be dangerous. */
const L46_TELL: StoryPart[] = [
  {
    h: 'An old story tells of a people who walked out of slavery in a single night.',
    p: 'In the book of Exodus, they had made bricks in Egypt for generations. They left in such a hurry that **their bread had no time to rise**.',
    dx: 'The story is in the book of Exodus. A whole people had been slaves in Egypt for generations, making bricks for someone else’s cities, with taskmasters over them. When the night came to leave, they left all at once. They carried their dough on their shoulders, wrapped in cloth, before it had time to rise, and baked it flat on the way. Whatever they felt that night, it was not ready. **Their bread had no time to rise.**',
    art: ['scene', { k: 'l46-leaving' }],
  },
  {
    h: 'A month later, in the desert, they began to miss Egypt.',
    p: 'There was little to eat and nothing to do but walk. They said: in Egypt we sat by pots of meat and **ate bread until we were full**.',
    dx: 'About a month after they left, they were deep in the desert. The excitement of the night they walked out was gone. There was sand, heat, little food and a long way to go, and nothing yet looked like the freedom they had been promised. So they gathered and complained. In Egypt, they said, we sat by the pots of meat and **ate bread until we were full**. They said they would rather have stayed.',
    art: ['scene', { k: 'l46-missing' }],
  },
  {
    h: 'Later, they listed what they missed.',
    p: '**We remember the fish we ate in Egypt for free**, they said, and the cucumbers, the melons, the leeks, the onions and the garlic. Now we have nothing but this.',
    dx: 'Later, in another hard stretch, they listed it all out, and the list is very specific. **We remember the fish we ate in Egypt for free**, they said. The cucumbers. The melons. The leeks, the onions and the garlic. They could taste each one. And now, they said, our strength is dried up, and there is nothing in front of us but this same food, day after day.',
    art: ['scene', { k: 'l46-fish' }],
    fact: { s: 'Story · Exodus 16 and Numbers 11', i: [0] },
  },
  {
    h: 'For free. They had been slaves.',
    p: 'Memory kept the fish and dropped the bricks, the whips and the long days. That is what missing a habit does. It remembers the relief, and **leaves out what it cost**.',
    dx: 'Read that word again. For free. They had been slaves. Nothing in Egypt had been free. The fish came with the bricks, the taskmasters, the whips and the days that were never their own. But memory had kept the fish and quietly dropped the rest. That is what missing a habit does too. It replays the relief, the ease and the minutes away from everything, and it **leaves out what it cost**: the time, how you felt after, the hiding.',
    art: ['scene', { k: 'l46-bricks' }],
  },
  {
    k: 'ask',
    h: 'When you miss the habit, what does your memory show you?',
    o: [
      ['The relief, and not much else', 'That is the fish. The bricks are still there, just out of the picture.'],
      ['How easy it was', 'It was easy, the way Egypt was easy. Look at what came with it.'],
      ['All of it, the cost too', 'Then your memory is more honest than most. Keep it that way.'],
      ['I do not miss it much', 'Then the desert may be gentler for you. Keep this for a harder week.'],
    ],
  },
  {
    h: 'The desert was not a wrong turn. It was the land in between.',
    p: 'Egypt was behind them and the new land was not yet in sight. Nothing felt like freedom yet. **A flat stretch feels like the wrong way, and it is the way through.**',
    dx: 'Look at where they were standing when they wanted to go back. Not in Egypt, and not in the new land either. In between. Egypt was behind them, the new land was not yet in sight, and nothing around them felt like freedom. That stretch is not a sign that leaving was a mistake. It is the only road there is. **A flat stretch feels like the wrong way, and it is the way through.** People getting free of a habit stand there too, in the first weeks, when the old relief is gone and the new life has not filled in.',
    art: ['scene', { k: 'l46-between' }],
  },
  {
    h: 'In the desert, food came every morning, enough for one day.',
    p: 'The story calls it manna. Anyone who tried to keep extra for tomorrow found it spoiled by morning. They could not store up strength for later. They got **enough for today**.',
    dx: 'In the story, food came every morning in the desert, small and white on the ground, and they called it manna. Each person gathered what they needed for that day. Some tried to keep extra, to be safe, and by the next morning it had spoiled. They could not store up strength for the week. Every day, they got **enough for today**, and every morning there was more. On a flat day, that is all you need too: not the strength for a month, only for this one.',
    art: ['scene', { k: 'l46-manna' }],
  },
  {
    n: '26',
    h: 'studies followed people who quit smoking, and people who kept on.',
    p: 'Weeks and months later, the ones who quit had less worry, less low mood and less stress than the ones who kept on. It held even for people who had smoked to cope. **The habit had not been holding the mood up.**',
    dx: 'Researchers at Oxford and Birmingham gathered 26 studies that followed adults who quit smoking and adults who kept on, and measured their mood at least six weeks after quitting. The ones who quit had less anxiety, less depression and less stress, and better mood, than the ones who kept smoking. It held for people who said they smoked to cope with stress, and for people with mental health conditions. Many smokers believe the cigarette is what keeps them steady. **The habit had not been holding the mood up.** It had been borrowing from it.',
    fact: { s: 'Review · 26 studies · Taylor and colleagues, 2014', i: [1] },
  },
  {
    long: 1,
    h: 'A week off porn showed no harm done by stopping.',
    p: 'In a trial, 176 students were asked to stop for seven days, or to carry on. Their mood and cravings came out about the same. **A low day is a low day, not damage.**',
    dx: 'In 2023, a team ran a trial with 176 students who watched porn at least three times a week. Half were asked to stop for seven days, and half to carry on as usual. At the end, craving, mood and withdrawal symptoms came out about the same in both groups. Stopping had not hurt anyone. And 45 in every 100 of those asked to stop slipped at least once that week, which is ordinary for a first week. **A low day is a low day, not damage**, and an early slip is very common.',
    fact: { s: 'Randomized trial · 176 students · Fernandez and colleagues, 2023', i: [2] },
  },
  {
    long: 1,
    h: 'An old saying puts it this way: one night got the people out of Egypt. It took years to get Egypt out of the people.',
    p: 'Your stretch is weeks, not years, and nobody can give you a date. But the shape is the same. **Leaving is one night. Becoming free is the walk after.**',
    dx: 'Readers of the story have long put it in one line. It took one night to get the people out of Egypt, and it took years to get Egypt out of the people. Your stretch is weeks, not years. But the shape is the same. **Leaving is one night. Becoming free is the walk after**, as the old wanting fades and a new person grows into the space. Nobody can give you a date. In a study of people building one new daily habit, it took anywhere from 18 to 254 days, and one missed day barely changed it.',
    art: ['scene', { k: 'l46-road' }],
    fact: { s: 'Study · 96 volunteers · Lally and colleagues, 2010', i: [3] },
  },
  {
    h: 'Getting free often feels like the desert before it feels like home.',
    p: 'Gray days in the first weeks are common, and they ease: fewer pulls, weaker pulls, more good days between them. **Every urge you ride out is one more day of the walk.** If the low lasts for weeks or turns dark, tell a doctor.',
    dx: 'So if the first weeks feel gray, that is not proof that something is wrong with you, or that this is how it will always feel. It is the desert, and it is common. It eases the way weather eases: fewer pulls, weaker pulls, and more good days between them. **Every urge you ride out is one more day of the walk.** You do not have to feel good to be getting better. And if the low lasts for weeks or turns dark, tell a doctor. Low mood is common and very treatable, and asking is a strong move.',
    art: ['scene', { k: 'l46-home' }],
  },
];
const L46_AT = 8;
const L46_AS = (c: StoryPart): StoryPart[] => [...L46_TELL.slice(0, L46_AT), c, ...L46_TELL.slice(L46_AT + 1)];

/* the sources lessons 54 to 58 add (the night lessons' own are in lessons-night.ts SRC_NIGHT) */
const S2 = {
  read98: [
    'Read & van Leeuwen (1998): predicting hunger, the effects of appetite and delay on choice, Organizational Behavior and Human Decision Processes',
    'https://doi.org/10.1006/obhd.1998.2803',
  ],
  read99: [
    'Read, Loewenstein & Kalyanaraman (1999): mixing virtue and vice, combining the immediacy effect and the diversification heuristic, Journal of Behavioral Decision Making',
    'https://www.andrew.cmu.edu/user/gl20/GeorgeLoewenstein/Papers_files/pdf/mixingvirtue.pdf',
  ],
  achor: [
    'Achor (2010): The Happiness Advantage, the 20-second rule (Crown)',
    'https://www.penguinrandomhouse.com/books/204726/the-happiness-advantage-by-shawn-achor/',
  ],
  rozin11: [
    'Rozin, Scott, Dingley, Urbanek, Jiang & Kaltenbach (2011): nudge to nobesity I, minor changes in accessibility decrease food intake, Judgment and Decision Making',
    'http://journal.sjdm.org/11/11213/jdm11213.html',
  ],
  ul687: ['UL 687: burglary-resistant safes, the TL-15 and TL-30 ratings (overview)', 'https://en.wikipedia.org/wiki/Safe#Burglary_resistance'],
  drbob: [
    'Alcoholics Anonymous: Dr. Bob’s last major talk, 1948 (pamphlet P-53), on meeting Bill W. in Akron in May 1935',
    'https://aa.org/sites/default/files/literature/P-53_1124.pdf',
  ],
} satisfies Record<string, Src>;

/* l58 is read by every habit (lessons-night.ts NIGHT_OPEN). For drinking, the card on care names the medicines that help and says a
   doctor should help with the first days, since stopping heavy drinking all at once can be dangerous. */
const L58_TELL: StoryPart[] = [
  {
    h: 'People ask a hard question, usually quietly: is it weak to need help?',
    p: 'It comes up most in the heaviest weeks, when low mood, poor sleep, worry or loneliness sit under the urge. It deserves **a straight answer**.',
    dx: 'There is a question many people carry and rarely say out loud: is it weak to need help? It tends to show up in the heaviest weeks, the ones where the urge is not the whole problem. Low mood that hangs on. Nights without real sleep. Worry that will not settle. Feeling alone in a full room. On those weeks, working on the habit alone can feel like bailing out a boat with a hole in it. The question deserves **a straight answer**, so this lesson takes it apart.',
    art: ['scene', { k: 'l58-heavy' }],
  },
  {
    h: 'Start with what the habit has been doing on those weeks.',
    p: 'It gives a few minutes away from the heavy feeling. Then the feeling is waiting afterward, often a little heavier. **The habit has been carrying something.**',
    dx: 'Look first at what the habit does on a heavy week. It gives a few minutes away from the feeling: the low, the worry, the empty evening. For those minutes it works. Then the feeling is waiting afterward, often a little heavier, with shame added on top. So the next heavy moment reaches for the same door. That is not weakness. **The habit has been carrying something**, a need using the only door it knows.',
    art: ['loop', { n: ['A heavy feeling', 'The habit', 'Short relief', 'The feeling returns'], c: 'Relief that brings it back' }],
  },
  {
    h: 'So you are already getting help with that feeling.',
    p: 'Every time the habit runs, it is helping you with it, badly. **The question was never whether to get help. It is whether the help is any good.**',
    dx: 'Here is the turn. If the habit carries a heavy feeling, then you have been getting help with that feeling for a long time. Every time the habit runs, it is helping, in its way: a few minutes off, at a high price, with the feeling handed back later. So the question was never whether a strong person needs help. Everyone who carries something heavy is already leaning on something. **The question is whether the help is any good**, and whether it leaves you better or worse than before.',
    art: ['scene', { k: 'l58-two-doors' }],
  },
  {
    k: 'ask',
    h: 'On your hardest weeks, what else is going on?',
    o: [
      ['Low mood that hangs on', 'That deserves care of its own. It often lifts with the right help.'],
      ['Bad sleep', 'Sleep can be treated, and better sleep makes every part of this easier.'],
      ['Worry, or feeling alone', 'Both are common, and both get better with help. You do not have to carry them alone.'],
      ['Nothing I can name yet', 'That is fair. Watch your next hard week, and notice what came before it.'],
    ],
  },
  {
    n: '3,755',
    h: 'students who slept badly were given an online program to sleep better.',
    p: 'Their sleep got much better, and their low mood and worry eased too, and stayed lower months later. **Helping one heavy thing helped the others.**',
    dx: 'In one of the largest trials of its kind, 3,755 students with insomnia at 26 universities in the United Kingdom were split into two groups. Half got an online program that teaches the skills of sleeping well, and half went on as usual. The program group slept much better. And something else moved with the sleep: their low mood and their worry eased too, and were still lower months later. **Helping one heavy thing helped the others.** Sleep is not a side issue. It holds up much of the rest.',
    fact: { s: 'Randomized trial · 3,755 students · Freeman and colleagues, 2017', i: [0] },
  },
  {
    h: 'Low mood and worry are some of the most treatable problems people have.',
    p: 'Talking therapy, exercise and, when needed, medicine help a great many people feel well again. **Asking is the hardest part**, and it is a short conversation.',
    dx: 'Guidelines written for doctors, like the one from NICE in the United Kingdom, set out what helps depression: talking therapies, exercise in a group, and medicines when they are needed. Worry and poor sleep have their own well-tested help. A doctor or a counselor can help you work out which fits you, and many people feel well again. Most of the work is theirs to know. **Asking is the hardest part**, and it is a short conversation: this is how I have been sleeping, and this is how I have been feeling.',
    art: ['scene', { k: 'l58-ask' }],
    fact: { s: 'Guideline · NICE, 2022', i: [1] },
  },
  {
    long: 1,
    h: 'Strength has an odd shape here.',
    p: 'Carrying something heavy alone for years can look strong. Often the habit is doing the carrying. **Seeing what is under it, and asking, takes more nerve.**',
    dx: 'From the outside, carrying something heavy alone for years can look like strength. Nobody knows, nothing changes, and you keep going. But look at who is doing the carrying. Often it is the habit, every hard week. **Seeing what is under it, and asking for help with it, takes more nerve** than keeping quiet. It means saying out loud the thing you have been managing in private, to someone who might help.',
  },
  {
    h: 'When the heavy thing gets care, the habit has less to do.',
    p: 'The pull loses some of its reason. It does not vanish overnight. It gives the same need **a better door**. If you ever think about not being here, reach out today.',
    dx: 'When low mood, sleep, worry or loneliness get real care, something shifts in the habit too. It has less to carry, so the pull loses some of its reason. That does not make the habit vanish overnight, and you still do the work. But the same need now has **a better door**, one that leaves you lighter afterward instead of heavier. And if you ever think about not being here, do not wait for the right week. Reach out today, to a crisis line or to someone near you.',
    art: ['scene', { k: 'l58-better-door' }],
  },
  {
    long: 1,
    h: 'When is it time to ask?',
    p: 'When low mood or worry has hung on for two weeks or more, when sleep has been poor for weeks, or when you feel stuck in the same loop whatever you try. **You do not need to wait for it to get worse.**',
    dx: 'A good time to ask is when low mood or worry has hung on for two weeks or more. Or when sleep has been poor for weeks, not just a bad night now and then. Or when you feel stuck in the same loop, whatever you try. You do not have to be sure what it is, or have the right words. **You do not need to wait for it to get worse**: help works better early, and a doctor would much rather see you now than later.',
  },
];
const L58_AT = 5;

/* the sources lessons 50 to 53 add (the lessons of one habit, lesson-habit.ts HABIT_TURNS, told as stories) */
const S3 = {
  gilovich: [
    'Gilovich, Medvec & Savitsky (2000): the spotlight effect in social judgment, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/0022-3514.78.2.211',
  ],
  prentice: [
    'Prentice & Miller (1993): pluralistic ignorance and alcohol use on campus, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/0022-3514.64.2.243',
  ],
  devisser: [
    'de Visser, Robinson & Bond (2016): voluntary temporary abstinence from alcohol during “Dry January” and subsequent alcohol use, Health Psychology',
    'https://doi.org/10.1037/hea0000297',
  ],
  gottman: [
    'Smith (2014): Masters of love, on John Gottman’s research with newlywed couples, The Atlantic',
    'https://www.theatlantic.com/health/archive/2014/06/happily-ever-after/372573/',
  ],
  fehr: ['Fehr, Gelfand & Nag (2010): the road to forgiveness, a meta-analysis, Psychological Bulletin', 'https://doi.org/10.1037/a0019993'],
  powers: [
    'Powers, Vedel & Emmelkamp (2008): behavioral couples therapy for alcohol and drug use disorders, a meta-analysis, Clinical Psychology Review',
    'https://doi.org/10.1016/j.cpr.2008.02.002',
  ],
  fallacy: ['The gambler’s fallacy, and the Monte Carlo story of 1913 (overview)', 'https://en.wikipedia.org/wiki/Gambler%27s_fallacy'],
  clark09: [
    'Clark, Lawrence, Astley-Jones & Gray (2009): gambling near-misses enhance motivation to gamble and recruit win-related brain circuitry, Neuron',
    'https://doi.org/10.1016/j.neuron.2008.12.031',
  ],
  kassinove: [
    'Kassinove & Schare (2001): effects of the near miss and the big win at persistence at slot machine gambling, Psychology of Addictive Behaviors',
    'https://doi.org/10.1037/0893-164X.15.2.155',
  ],
  zhang: ['Zhang & Clark (2020): loss-chasing in gambling behaviour, Current Opinion in Behavioral Sciences', 'https://doi.org/10.1016/j.cobeha.2019.10.006'],
  dsm: ['American Psychiatric Association: DSM-5, gambling disorder', 'https://www.psychiatry.org/psychiatrists/practice/dsm'],
  words: [
    'Etymology: secret, from Latin secernere, to set apart; debt, from debitum, a thing owed; confess, from confiteri, to acknowledge',
    'https://www.etymonline.com/word/secret',
  ],
} satisfies Record<string, Src>;

export const STORIES_F: Record<string, Story> = {
  l45: {
    id: 'l45',
    form: 'tale',
    title: 'Words from a calm day',
    ic: 'pencil',
    ask: 'Why read my own reasons in the middle of an urge?',
    key: 'Write your orders on a calm day, for the hour you will beg to be untied.',
    np: 'One line from me, on a calm day, and the order that goes with it',
    tell: [
      {
        h: 'Nearly three thousand years ago, a poem told of a ship that had to sail past the Sirens.',
        p: 'Their song pulled every sailor who heard it toward their island. The meadow where they sat was **covered in the bones** of men who had stopped to listen.',
        dx: 'The poem is the Odyssey. Odysseus is trying to get home after a long war, and a woman who knows the sea warns him about what lies ahead. The Sirens sit in a green meadow by the water and sing. No sailor who hears them ever reaches home again, because he steers for the shore and stays. The meadow around them is **covered in the bones** of men who stopped to listen. She does not tell him to be brave. She tells him how to get past.',
        art: ['scene', { k: 'l45-sirens-isle' }],
      },
      {
        h: 'Odysseus wanted to hear the song, and live.',
        p: 'So while the sea was still calm, he made a plan. His crew would fill their ears with wax. He would be **tied to the mast**, hand and foot, with his ears open.',
        dx: 'He could have plugged his own ears like everyone else. He wanted to hear it. So while the sea was still flat and calm, he made a plan out loud, in front of his crew. He softened a round of wax in the sun and pressed it into every sailor’s ears, one by one. Then he had them stand him upright against the mast and **tie him to it**, hand and foot, the rope wound tight. He would hear everything, and he would not be able to move.',
        art: ['scene', { k: 'l45-wax-rope' }],
      },
      {
        h: 'Then he gave one more order.',
        p: 'If I beg you to untie me, **tie me tighter**. He did not trust the man he would be once the song began, so he left his orders for that man.',
        dx: 'Then, before the island came into view, he gave the order that makes the story. If I beg you to untie me, or order you to, **tie me tighter** with more rope. He knew that in an hour he would want something different, and want it with his whole heart. He did not argue with that future man or hope to talk him out of it. He made the decision now, while he could see clearly, and handed it to people who would carry it out when he could not.',
        art: ['scene', { k: 'l45-tighter' }],
      },
      {
        k: 'ask',
        h: 'Think of your last strong urge. How did your reasons for quitting feel in it?',
        o: [
          ['Far away, like someone else wrote them', 'Many people say that. The reasons were still true. Look at why they felt flat.'],
          ['True, and the urge felt truer', 'That is the song. Look at what it sounded like to Odysseus.'],
          ['I forgot them until afterward', 'That is common, and it is not a lack of caring. The next cards say why.'],
          ['They held, and I did not give in', 'Then you have heard the song and kept going. This lesson is about making that easier.'],
        ],
      },
      {
        h: 'The song came, and he begged.',
        p: 'The Sirens did not sing about pleasure. They sang his own name, praised him, and promised to make him wiser. **It sounded like a good reason.** He signaled to be untied, and two men stood and tied him tighter.',
        dx: 'Here is the part people forget. The Sirens did not sing about pleasure at all. They called him by name. They praised him as the glory of his people. They promised that whoever listened would sail on knowing more, because they knew everything that had happened at the war and everything that happens on the earth. **It sounded like a good reason**, like wisdom. And he wanted it so badly that he frowned and signaled to his crew to cut him loose. Two of them, Perimedes and Eurylochus, got up and tied him tighter. The ship rowed on until the song faded.',
        art: ['scene', { k: 'l45-song' }],
        fact: { s: 'Story · Homer, the Odyssey, book 12', i: [0] },
      },
      {
        h: 'In 2008, researchers asked smokers to put a price on their own future.',
        p: 'At a later session, they would be craving. How much money would it take then to put off a cigarette? Some smokers answered while calm, and some while **already craving**.',
        dx: 'Michael Sayette and his colleagues in Pittsburgh brought 98 smokers into a lab. Each was told that at a later session they would be craving, and asked how much money it would take, at that later session, to put off smoking for a while. Some answered while they were calm. Others answered while they were **already craving**, after hours without a cigarette. Then everyone came back, craving, and the researchers saw how close each guess had been.',
        art: ['scene', { k: 'l45-price' }],
      },
      {
        k: 'guess',
        h: 'Who guessed their own craving better: the calm smokers, or the ones already craving?',
        o: [
          ['The calm ones, with clear heads', 'That is what most people expect, and it is not what happened.'],
          ['The ones already craving', 'They were inside the feeling, so they knew what it would want.'],
        ],
        a: 1,
      },
      {
        h: 'The calm smokers guessed low.',
        p: 'When the craving came, many of them wanted more money than they had said. The ones already craving had guessed right. **A calm mind cannot feel what a craving will want.**',
        dx: 'When the craving came, many in the calm group asked for more money to wait than they had said they would. They had not been lying. From a calm chair, the craving looked smaller than it turned out to be. The group that answered while craving had guessed about right, because they were inside the feeling they were describing. Researchers call this the empathy gap. **A calm mind cannot feel what a craving will want**, the way a full stomach cannot feel hunger.',
        art: ['scene', { k: 'l45-gap' }],
        fact: { s: 'Study · 98 smokers · Sayette and colleagues, 2008', i: [1] },
      },
      {
        long: 1,
        h: 'The gap runs the other way too.',
        p: 'In another study, young men answered the same questions about their choices while calm and while aroused. Their answers moved far more than they had predicted. **Each state could not see across to the other.**',
        dx: 'In another study, Dan Ariely and George Loewenstein asked young men the same set of questions about choices they might make, once while calm and once while aroused. Aroused, their answers moved much further than they themselves had predicted. Calm, they had no idea how differently they would answer. **Each state could not see across to the other.** So it is not that urge you forgets your reasons. Urge you can still say them. They just stop weighing anything.',
        fact: { s: 'Study · Ariely & Loewenstein, 2006', i: [2] },
      },
      {
        h: 'So Odysseus did not plan to be strong. He planned for being weak.',
        p: 'A line written on a calm day is that rope: your own words, tied now, for the hour the song starts. **Leave the order with it**: if I argue with this, read it again.',
        dx: 'Odysseus is remembered as clever, and this is why. He did not plan to be strong when the song came. He planned for being weak, and he made the plan while he still could. A line written on a calm day is the same rope: your own words, in your own voice, tied now, for the hour the song starts. And like Odysseus, **leave the order with it**: if I argue with this, read it again. In the urge, you will argue. That is not failure. It is the song, and the order was written for it.',
        art: ['scene', { k: 'l45-note' }],
      },
      {
        long: 1,
        h: 'An older story has another ship pass the same island another way.',
        p: 'On Jason’s ship, the singer Orpheus played his lyre louder and quicker, so the crew heard his song instead. Even so, one sailor leapt into the sea. **A better song helps. The rope held every man.**',
        dx: 'In the story of Jason and the Argonauts, their ship passes the same island. They have no wax and no ropes. Instead the singer Orpheus picks up his lyre and plays a fast, loud tune of his own, so the crew hears his music over theirs. It mostly works. But one sailor, Butes, still hears the Sirens through it, jumps overboard and swims for the shore. **A better song helps**, and giving your mind something else to do in an urge is a real tool. **The rope held every man.** The two together are stronger than either one.',
        art: ['scene', { k: 'l45-lyre' }],
        fact: { s: 'Story · Apollonius of Rhodes, the Argonautica, book 4', i: [3] },
        back: 'l42',
      },
    ],
    mine: { h: 'Write your line for the hour it will be read.', k: 'hour' },
    today: {
      h: 'Tie your rope today, while it is calm.',
      l: ['Write one true line, in your own words', 'Add the order: if I argue, read it again', 'Keep it where SOS can show it to you'],
    },
    you: {
      h: 'In the hour the song starts, what would your line need to say to you?',
      o: [
        ['Why I started', 'Then write it the way you would say it to a friend, so it sounds like you.'],
        ['Who I am doing this for', 'A name is a strong rope. Put it in the line.'],
        ['How I feel afterward, not during', 'That is the part the song leaves out. Your line can put it back.'],
        ['I do not know yet', 'Fair. Write the first true sentence that comes, and change it later.'],
      ],
    },
    scope:
      'The Sirens are a story, and the empathy gap studies were with smokers and with young men in a lab, not people quitting porn. What they show is a gap between two states of mind, calm and craving, that neither side sees across well. A line written while calm is a plain, hopeful way to cross it.',
    src: [S.homer, S.sayette, S.ariely06, S.apollonius],
  },

  l46: {
    id: 'l46',
    form: 'tale',
    title: 'What getting free feels like',
    ic: 'sunrise',
    ask: 'Why do I feel so flat since I stopped, and when does it get easier?',
    key: 'Memory keeps the fish and drops the bricks. The desert is the way through, not a wrong turn.',
    np: 'What memory leaves out when I miss the habit',
    tell: L46_TELL,
    mine: { h: 'Every urge you ride out is one more day of the walk.', k: 'rode' },
    today: {
      h: 'On a flat day, gather only today’s strength.',
      l: ['Name it: “This is the desert. It passes.”', 'Sleep, real food, a walk outside', 'Text one person, about anything'],
    },
    you: {
      h: 'When you miss the habit, what are the bricks your memory leaves out?',
      o: [
        ['How I felt afterward', 'That is the heaviest brick for many people. Keep it in the picture.'],
        ['The time it took from me', 'Hours that never come back. Every flat day you walk is a day you keep.'],
        ['The hiding', 'Hiding is a brick people carry every day without noticing. Freedom puts it down.'],
        ['I do not know yet', 'Fair. The next time you miss it, ask what the picture is leaving out.'],
      ],
    },
    scope:
      'The Exodus is an old story, told here for what it shows about missing a habit, not as a lesson about faith. The mood review was about people who quit smoking, and those studies followed people rather than assigning them. The week off porn was one short trial with students. Nobody can give you a date for the flat stretch to lift. Together they point one hopeful way: it is common, it is not damage, and people tend to feel better on the far side of it.',
    src: [S.exodus, S.taylor, S.fernandez, S.lally],
    hab: {
      alcohol: {
        tell: L46_AS({
          h: 'If you drank every day, or a lot at a time, a doctor should help with the first days.',
          p: 'Stopping heavy drinking all at once can be dangerous. After that, the low often lifts within weeks: in men treated for drinking, high depression scores fell from about 4 in 10 to under 1 in 10 in a month. **Much of the low was the drink wearing off.**',
          dx: 'If you drank every day, or a lot at a time, stopping all at once can be dangerous, and **a doctor should help with the first days**. That is not a sign of weakness. It is how heavy drinking changes the body, and doctors see it every week. After those first days, the low mood often lifts faster than people expect. Researchers followed 191 men in treatment for drinking. In their first week without alcohol, about 4 in 10 scored high on a depression scale. Four weeks later, fewer than 1 in 10 did. Much of the low was the drink wearing off.',
          fact: { s: 'Study · 191 men · Brown & Schuckit, 1988', i: [2] },
        }),
        scope:
          'The Exodus is an old story, told here for what it shows about missing a habit, not as a lesson about faith. The mood review was about people who quit smoking, and the depression study followed men in treatment for drinking. Together they point one hopeful way: a flat stretch is common, much of it is the drink wearing off, and people tend to feel better on the far side of it.',
        src: [S.exodus, S.taylor, S.brown, S.lally],
      },
      gambling: {
        tell: L46_AS({
          long: 1,
          h: 'Restless when you stop is so common it is in the definition.',
          p: 'Doctors list feeling restless or short-tempered when cutting down as a sign of the habit itself, not of harm done by stopping. **It eases as the habit loosens.**',
          dx: 'The main manual doctors use to name gambling problems lists being restless or short-tempered when trying to cut down as one of the signs of the habit itself. So if you feel on edge in the first weeks, snapping at people, unable to settle, that is not harm done by stopping. It is the habit letting go, and **it eases as the habit loosens**, the way the urges themselves fade with time and with every one you ride out.',
          fact: { s: 'Manual · DSM-5, gambling disorder', i: [2] },
        }),
        scope:
          'The Exodus is an old story, told here for what it shows about missing a habit, not as a lesson about faith. The mood review was about people who quit smoking, and the manual describes what doctors look for in gambling disorder. Together they point one hopeful way: a restless, flat stretch is common, it is not damage, and people tend to feel better on the far side of it.',
        src: [S.exodus, S.taylor, S.dsm, S.lally],
      },
    },
  },

  l47: {
    id: 'l47',
    form: 'breakdown',
    title: 'Your partner and the truth',
    ic: 'heart',
    ask: 'Should I tell my partner? And if they found out, can trust come back?',
    key: 'Hiding does not shield your partner. Honesty lets them meet the truth with you, whatever they decide.',
    np: 'What I want my partner to be able to count on from me',
    tell: [
      {
        h: 'People quitting often ask one question, quietly: would telling my partner only hurt them?',
        p: 'It sounds like kindness. You carry the weight so they do not have to. The question deserves **an honest answer**, not a quick one.',
        dx: 'Of all the questions people ask while quitting, this one is often the heaviest. Would telling my partner only hurt them? It does not sound like an excuse. It sounds like love. You would carry the weight yourself so the person you care about does not have to. Maybe they do not know at all. Maybe they found out, and things have not felt the same since. Either way, the question deserves **an honest answer**, not a quick one, so this lesson takes it apart.',
        art: ['scene', { k: 'l47-weight' }],
      },
      {
        h: 'First, the hard part, said plainly: telling will hurt.',
        p: 'There is no way to say it that makes it painless, and nobody can promise how they will take it. **Anyone who promises you an easy talk is guessing.**',
        dx: 'Start with the part nobody likes to say. Telling will hurt. There is no wording that makes it painless, no perfect night for it, and no promise about how they will take it. They may cry, go quiet, get angry or need time away. **Anyone who promises you an easy talk is guessing.** If you are waiting for a way to tell it that costs nothing, it does not exist. That is not a reason to stay quiet. It is just the price, said out loud.',
        art: ['scene', { k: 'l47-table' }],
      },
      {
        h: 'Then the question under it: what does the hiding do?',
        p: 'Partners who found out on their own often say the habit hurt, and the hiding hurt in a different way. It made them wonder **what else they did not know**.',
        dx: 'Then look at what the question leaves out. Not telling is not the same as nothing happening. In interviews with wives in couple therapy, the women described the porn as painful, and the lying around it as something else: it shook their sense that home was safe. Partners who find out on their own often say the same. The habit hurt. The hiding made them wonder **what else they did not know**, and whether they could believe the next thing they were told.',
        art: ['scene', { k: 'l47-doors' }],
        fact: { s: 'Interviews · Zitzman & Butler, 2009', i: [0] },
      },
      {
        k: 'ask',
        h: 'When you think about telling your partner, what stops you most?',
        o: [
          ['I do not want to hurt them', 'That care is real. The next cards ask whether hiding spares them.'],
          ['I am afraid they will leave', 'That fear is common. Look at what people said years later.'],
          ['I am ashamed of it', 'Shame wants it hidden. It often gets lighter once it is said.'],
          ['They already know, and it is still hard', 'Then this lesson is about what rebuilds trust from here.'],
        ],
      },
      {
        n: '340',
        h: 'women whose partners used porn were asked how they felt about it, and about each other.',
        p: 'The ones who saw their partner as honest about it were happier together, and less upset about the porn itself. **Honesty did not erase the hurt. It gave it solid ground.**',
        dx: 'In a survey, 340 women whose partners used porn answered questions about their relationship and about how the porn made them feel. The ones who saw their partner as honest about it were more satisfied together, and less distressed about the porn itself, than the ones who felt it was hidden from them. **Honesty did not erase the hurt. It gave it solid ground**: something true to stand on while they worked out what they felt.',
        fact: { s: 'Survey · 340 women · Resch & Alderson, 2014', i: [1] },
      },
      {
        h: 'Another survey asked people, years later, about the day it came out.',
        p: 'On the day, 81 in 100 partners felt telling was right. Looking back, 93 did, and 96 in 100 of those who told. **Almost everyone said telling was right.**',
        dx: 'Another survey asked 164 people, about half who had told a hidden sexual secret and half who had been told, to look back on the day it came out. At the time, 81 in 100 of the partners felt telling was the right thing, and only 58 in 100 of the people telling felt sure. Later, those numbers rose to 93 and 96. **Almost everyone said telling was right**, including many who had dreaded it most.',
        art: ['people', { n: 93, was: 81, s: 'partners said telling was right' }],
        fact: { s: 'Survey · 164 people · Schneider, Corley & Irons, 1998', i: [2] },
      },
      {
        long: 1,
        h: 'Telling did not stop every slip.',
        p: 'About half had a hard slip later. What telling did was end the hiding. **A slip told soon was a different thing from a slip found.**',
        dx: 'Telling was not a cure, and the same survey says so plainly. About half of the people who told had a hard slip at some point afterward. What changed was not that the habit disappeared overnight. It was that the hiding ended. Trust had somewhere to grow from, and **a slip told soon was a different thing from a slip found**: one says I am still being straight with you, the other says there may be more.',
      },
      {
        h: 'So the question is not whether to spare them.',
        p: 'A secret between two people is a wall, and they live beside it whether they see it or not. **The question is whether they meet the truth with you, or find it alone.**',
        dx: 'Put the pieces together and the question changes shape. A secret between two people is a wall in the middle of the house, and both of them live beside it whether one of them can see it or not. Keeping quiet does not take the wall away. It only decides who knows it is there. **The question is whether they meet the truth with you, or find it alone**, one day, on a screen or in a bill, with nobody beside them.',
        art: ['scene', { k: 'l47-wall' }],
        back: 'l7',
      },
      {
        h: 'Telling is a beginning, not a payment.',
        p: 'Their hurt and their timeline are theirs. They are not your police, and keeping you free is not their job. **If telling might not be safe, talk to a counselor first.**',
        dx: 'Telling is not a debt you pay once and are done with. It is the start of being someone they can believe. Their hurt and their timeline belong to them. They may want to ask a hundred questions, or none for a while. They are not your police, and keeping you free is not their job, so do not hand them your phone to watch. **If telling might not be safe**, because of anger or harm at home, **talk to a counselor first**, and let them help you plan it.',
        art: ['scene', { k: 'l47-start' }],
      },
      {
        long: 1,
        h: 'What rebuilds trust is small and repeated.',
        p: 'Not one big speech, but plain things done again and again: answering questions honestly, telling a slip soon, doing what you said. **Trust comes back the way it left**, a little at a time.',
        dx: 'Big promises are easy to make and easy to break, and a partner who has been hurt has heard them. What rebuilds trust is smaller and slower. Answering a hard question honestly, even when it costs you. Telling a slip soon, and saying what you will do next. Doing the small thing you said you would do. None of it is dramatic, and nobody can promise how it ends. But **trust comes back the way it left**, a little at a time, and being honest is yours to keep whatever they decide.',
      },
    ],
    mine: { h: 'Honesty starts small, and you have started.', k: 'acted' },
    today: {
      h: 'Write the first sentence, even if you do not say it yet.',
      l: ['Say it plainly, with no excuses', 'Let them ask, and answer honestly', 'If it might not be safe, see a counselor first'],
    },
    you: {
      h: 'What do you want your partner to be able to count on from you?',
      o: [
        ['That I tell them the truth', 'Then every honest answer from here is a brick in that.'],
        ['That I tell them about a slip soon', 'That is one of the strongest things you can offer. It says there is no more wall.'],
        ['That they never have to check on me', 'Then honesty is how they stop needing to. It is built, not promised.'],
        ['I am not with anyone right now', 'Then this is for later. Telling the truth can start today, with someone you trust.'],
      ],
    },
    scope:
      'These studies asked partners, mostly women with male partners, and people in recovery who chose to answer, so they show what goes together and how people felt looking back. Telling did not keep anyone from slipping, and nobody can promise how a partner will take it. It ended the hiding, and most on both sides said it was right.',
    src: [S.zitzman09, S.resch14, S.schneider98],
  },

  l48: {
    id: 'l48',
    form: 'works',
    title: 'Sex after porn',
    ic: 'leaf',
    ask: 'What do I do when desire goes quiet after quitting?',
    key: 'Desire is shy of being watched. Skip the test, and put your attention on the person.',
    np: 'What I want my sex life to be, by my own values',
    tell: [
      {
        h: 'In the 1960s, two researchers in St. Louis began seeing couples for whom sex had become hard.',
        p: 'William Masters and Virginia Johnson found that many of them were not short of love, or even of desire. **Something else was getting in the way**, and they gave it a name.',
        dx: 'William Masters, a doctor, and Virginia Johnson, his research partner, opened a clinic in St. Louis and spent years seeing couples for whom sex had become hard or stopped altogether. What struck them was how often the cause was not a lack of love, attraction or even desire. The bodies were mostly fine. **Something else was getting in the way**, the same thing in couple after couple, and in 1970 they gave it a name.',
        art: ['scene', { k: 'l48-clinic' }],
      },
      {
        h: 'They called it spectatoring.',
        p: 'In the moment, part of the person stepped out and watched from the side, like a judge holding a scorecard. **Is it working? Am I doing well?**',
        dx: 'They called it spectatoring. In the closest moment two people can share, part of the person would step out of it and watch from the side of the room, like a judge holding a scorecard. **Is it working? Am I doing well? What do they think?** The person was there, and not there. Half of their attention was with their partner, and the other half was up in the seats, grading.',
        art: ['scene', { k: 'l48-judge' }],
      },
      {
        h: 'And the watching was what spooked it.',
        p: 'Desire lives in attention on the person and the moment. Watching yourself pulls that attention onto a gauge. **The more someone checked, the less there was to find.**',
        dx: 'This is the turn in their work. The watching was not a side effect of the problem. It was much of the problem. Desire lives in attention on the other person and on the moment itself. Watching yourself pulls that attention off them and onto a gauge, and the gauge dims what it measures. **The more someone checked, the less there was to find**, and the less there was, the harder they checked.',
        art: ['scene', { k: 'l48-gauge' }],
      },
      {
        k: 'ask',
        h: 'Have you ever tried hard to feel something on purpose, and felt it slip away?',
        o: [
          ['Yes, trying to fall asleep', 'Same thing. Sleep comes when you stop checking whether it has.'],
          ['Yes, trying to relax or feel happy on cue', 'Then you know the pattern. Feelings come when you stop grading them.'],
          ['Not that I have noticed', 'Watch for it. Most people find it once they look.'],
          ['I am not sure', 'Fair. The next card shows what Masters and Johnson did about it.'],
        ],
      },
      {
        h: 'So they did something nobody expected. They took the test away.',
        p: 'Couples were asked to spend time touching slowly, with sex itself off the table for now. **With nothing to pass, there was nothing to watch.** For many, desire came back on its own.',
        dx: 'Their answer surprised people. Couples who came to fix their sex life were told, at first, not to have sex at all. Instead they were asked to spend time touching each other slowly, with no goal and nothing to achieve, and with sex itself off the table for now. They called it sensate focus. **With nothing to pass, there was nothing to watch.** The judge had no game to score. And for many couples, desire came back on its own, because their attention had finally come back to each other.',
        art: ['scene', { k: 'l48-hands' }],
        fact: { s: 'Book · Masters & Johnson, Human Sexual Inadequacy, 1970', i: [0] },
      },
      {
        long: 1,
        h: 'Later research found the same pattern.',
        p: 'The psychologist David Barlow found that worry about how you are doing turns attention inward, away from the person, and that this is what dims arousal. **The worry does more than the body.**',
        dx: 'Years later, the psychologist David Barlow studied people with sexual problems of many kinds and found the same thread. Worry about how you are doing turns attention inward, to yourself and your performance, and away from your partner and the moment. That shift, more than any problem in the body, was what weakened arousal. **The worry does more than the body.** It is the scorecard again, with a new name.',
        fact: { s: 'Model · Barlow, 1986', i: [1] },
      },
      {
        long: 1,
        h: 'Stray thoughts were normal. Coming back mattered more.',
        p: 'In 153 adults in long relationships, having stray thoughts during sex was ordinary. What went with more problems was finding it hard to bring attention back. **The skill is coming back, not never drifting.**',
        dx: 'Researchers asked 72 men and 81 women in long relationships about the thoughts that drift in during sex. For the men, the most common were about how they were doing. Having stray thoughts at all was ordinary, for almost everyone. What went with more problems was having a hard time bringing attention back to the moment. **The skill is coming back, not never drifting**, and it is the same skill you practice in an urge: notice where your mind went, and bring it back to what is in front of you.',
        fact: { s: 'Study · 153 adults · Nelson & Purdon, 2011', i: [2] },
        back: 'l43',
      },
      {
        h: 'After quitting porn, many people find desire goes quiet for a while.',
        p: 'It is common, and nobody can say how long it lasts. The pull is to check, to test whether everything still works. **A test is the scorecard, alone**, and it is a common way back in.',
        dx: 'Many people find that after they quit porn, desire goes quiet for a while. Some feel relief. Many feel fear, that something is broken. It is common, it says nothing final about you, and nobody can honestly tell you how long it lasts. What comes next is the pull to check: to test, alone, whether everything still works. **A test is the scorecard, alone.** It turns your attention onto the gauge, which is the very thing that dims it, and a test with porn is one of the most common ways back into the habit.',
        art: ['scene', { k: 'l48-quiet' }],
      },
      {
        h: 'So skip the test, and give your body time.',
        p: 'A quiet stretch needs no checking. With a partner, **put your attention on them**, say what you are going through, and go slowly. A doctor has heard every question before.',
        dx: 'So do what Masters and Johnson did, and take the test away. A quiet stretch needs no checking and no proof. With a partner, **put your attention on them**, not on yourself: tell them what you are going through, take the pressure off, and go slowly. On being alone with it, science has no rule for you, so your own values decide. And if something worries you, a doctor has heard every question before, and asking is a normal thing to do.',
        art: ['scene', { k: 'l48-together' }],
      },
    ],
    today: {
      h: 'Skip the test, and give your body time.',
      l: ['A quiet stretch needs no checking', 'With a partner, put attention on them', 'Ask a doctor if it worries you'],
    },
    you: {
      h: 'What do you want your sex life to be, by your own values?',
      o: [
        ['Close, with one person', 'Then attention on that person is the whole path. It starts with less checking.'],
        ['Free of comparing', 'Porn taught comparing. Each week away from it, there is less to compare to.'],
        ['Something I never have to hide', 'That is a strong thing to want. It is built one honest week at a time.'],
        ['I do not know yet', 'That is fine. You have time to work it out, by your own values.'],
      ],
    },
    scope:
      'Masters and Johnson worked with couples in a clinic, and the later research comes from people with sexual problems in general and from couples in the community, not from people quitting porn. Nobody can say how long a quiet stretch lasts. What the work shows, hopefully, is that checking pulls attention the wrong way, and attention can move.',
    src: [S.masters70, S.barlow86, S.nelson11],
  },

  l49: {
    id: 'l49',
    form: 'study',
    title: 'Day 30, 60, 90, and after',
    ic: 'flag',
    ask: 'It is going well. What do I watch for now, and what does keeping it look like?',
    key: 'Feeling strong makes the danger look small. People who keep it stay clear on purpose.',
    np: 'The small closeness I am most likely to allow, and what I will do when I notice it',
    tell: [
      {
        h: 'In 2009, researchers in Amsterdam offered smokers an odd challenge.',
        p: 'Watch a film full of people smoking, called Coffee and Cigarettes, without smoking yourself. **The harder you make it for yourself, the more money you earn.**',
        dx: 'Loran Nordgren and his colleagues at the University of Amsterdam invited student smokers into the lab for a challenge. Each would watch a film called Coffee and Cigarettes, made of scene after scene of people sitting at tables, talking and smoking. The rule was simple: do not smoke while you watch. And there was a twist. **The harder you made the challenge for yourself, the more money you could earn.**',
        art: ['scene', { k: 'l49-film' }],
      },
      {
        h: 'They could choose how close to keep a cigarette.',
        p: 'On the desk in front of them paid some. **Held in their hand the whole time** paid more. Before they chose, some had been told by a test that their self-control was strong.',
        dx: 'The money depended on how close they kept a cigarette while the film played. The closer it was, the more they could earn. Kept on the desk in front of them paid some. **Held in their hand the whole time** paid more. And before they chose, every smoker took a short test that claimed to measure self-control. It was fake. Some of them were told, at random, that their self-control was strong.',
        art: ['scene', { k: 'l49-distance' }],
      },
      {
        k: 'ask',
        h: 'Say you were in that room, feeling sure of yourself. Where would you keep the cigarette?',
        o: [
          ['On the desk, where I can leave it', 'Then you would earn less, and be safer. Look at what happened.'],
          ['In my hand, I could handle it', 'That is what the ones who felt strongest tended to pick. Look at how it went.'],
          ['I would want to see how strong I am', 'That wish is the whole study. Look at what it did.'],
          ['I would not take the challenge', 'Then you already know the move this lesson is about.'],
        ],
      },
      {
        h: 'The ones told they were strong kept it closer.',
        p: 'They chose more temptation than the others, and more of them gave in and smoked. **Feeling strong made the danger look small.**',
        dx: 'The smokers who had been told their self-control was strong chose more temptation than the ones told it was weak. More of them kept the cigarette in their hand rather than on the desk. And more of them gave in and smoked before the film was over. Nothing about their actual willpower had changed. Only how strong they believed it was. **Feeling strong made the danger look small**, so they walked right up to it.',
        art: ['scene', { k: 'l49-gave-in' }],
        fact: { s: 'Study · Nordgren, van Harreveld & van der Pligt, 2009', i: [0] },
      },
      {
        long: 1,
        n: '55',
        h: 'people who had really quit smoking were followed next.',
        p: 'Each had been smoke-free for at least three weeks. The ones surest of their self-control planned to try least to avoid temptation. **Four months later, more of them were smoking again.**',
        dx: 'A lab challenge is one thing, so they also followed 55 people in a program to quit smoking, each smoke-free for at least three weeks. They asked how strong their self-control was, and how hard they planned to try to stay away from temptation, like the company of other smokers. The ones surest of their self-control planned to try least. **Four months later, more of them were smoking again.** Confidence had not kept them safe. It had walked them closer.',
      },
      {
        long: 1,
        h: 'They found the same with hunger and tiredness.',
        p: 'Students leaving the cafeteria, just fed, were surer they could resist a snack than students walking in hungry. They chose tempting snacks, and more of them ate them. **A full stomach misjudges an empty one.**',
        dx: 'The same pattern showed up in everyday things. Students leaving the cafeteria, just fed, were surer of their self-control than students walking in hungry. Offered a snack bar to take home and bring back a week later for a small reward, the fed students picked their favorites more often, and more of them ate the bar. Students who had done an easy task felt surer they could handle tiredness, and planned to leave more work for the last week. **A full stomach misjudges an empty one**, the same gap as a calm mind and a craving.',
        back: 'l45',
      },
      {
        h: 'Day 60 can bring a thought that does not feel like an urge.',
        p: '“I could look once, just to see that I am past it.” It feels like confidence, like proof of how far you have come. **It is the cigarette in the hand.**',
        dx: 'After a good stretch, a thought can show up that does not feel like an urge at all. It feels like confidence. “I could look once, just to see that I am past it.” Or a site that is almost it, or keeping the phone close in the hard hours, because you are strong now. It feels like proof of how far you have come. **It is the cigarette in the hand**: the closeness that pays out a good feeling, chosen by the part of you that feels the strongest.',
        art: ['scene', { k: 'l49-test' }],
        back: 'l17',
      },
      {
        h: 'Strong does not look like standing close to it.',
        p: 'The people who keep it do not prove they can sit beside the fire. They do not need to. **They stay clear on purpose**, and keep the plain things that got them here.',
        dx: 'So look again at what strong means. The people who keep their freedom for years do not prove, now and then, that they can sit beside the fire without getting burned. They do not need the proof. **They stay clear on purpose**, without drama and without a speech, and they keep the plain things that got them there: the phone out of the room, the plan for the hard hours, the person they tell. That is not fear. It is what strength looks like from the outside.',
        art: ['scene', { k: 'l49-clear' }],
      },
      {
        long: 1,
        h: 'A good stretch has its own work: fill the life you are keeping.',
        p: 'One thing you enjoy, and one person, every week. **A life with joy in it is easier to keep** than a life made only of rules.',
        dx: 'A good stretch has its own work, and it is not only guarding. It is filling. Make room each week for one thing you enjoy, something with your hands or your body or other people in it, and for one person you see or talk to. **A life with joy in it is easier to keep** than a life made only of rules, because there is more in it to lose and less empty time for the old thought to fill.',
      },
    ],
    mine: { h: 'Look at the days that held.', k: 'clean30' },
    today: {
      h: 'Name the test, and stay clear on purpose.',
      l: ['Name it: “That is the cigarette in my hand.”', 'Tell your safe person you noticed it', 'Keep the plain things that got you here'],
    },
    you: {
      h: 'What is your cigarette in the hand, the small closeness you are most likely to allow?',
      o: [
        ['Looking once, to check I am past it', 'That is the test. Naming it is most of beating it.'],
        ['Sites or feeds that are almost it', 'Almost is the desk. It is closer than it looks from a good day.'],
        ['Keeping the phone close in hard hours', 'A small closeness, and a common one. Put it back across the room.'],
        ['I do not know yet', 'Fair. Watch for the thought that feels like confidence.'],
      ],
    },
    scope:
      'The confidence studies were with smokers, students and people who had quit smoking, not porn, and they were not large. What carries over is a quirk of human judgment: feeling sure of your control makes temptation look safer than it is. Staying clear is a choice you can make every time, and it is what keeps a good stretch going.',
    src: [S.nordgren09],
  },

  l54: {
    id: 'l54',
    form: 'works',
    title: 'The rested self and the worn-out self',
    ic: 'sunrise',
    ask: 'Why do my plans fall apart when I am worn out?',
    key: 'Let the rested you choose, and leave the worn-out you a setup to follow.',
    np: 'One thing my rested self will set up for my worn-out hours',
    tell: [
      {
        h: 'In 1998, two researchers went from office to office in Amsterdam with a basket of snacks.',
        p: 'Apples and bananas on one side, chocolate bars and crisps on the other. Two hundred workers each picked one, to be **delivered a week later**.',
        dx: 'Daniel Read and Barbara van Leeuwen visited banks, insurance offices, a hospital and shops around Amsterdam, two hundred workers in all. They carried two kinds of snack: apples and bananas, and chocolate bars, crisps and salted nuts. Each worker picked one, and the catch was the timing. The snack would not be handed over now. It would be **delivered a week later**, at the same hour. Some chose right after lunch, full. Some chose late in the afternoon, hungry.',
        art: ['scene', { k: 'l54-basket' }],
      },
      {
        h: 'A week later, they came back with the basket.',
        p: 'They held out the snack each person had picked, and said: you can change your mind now, and **take any one you like** to eat right away.',
        dx: 'A week later, at the agreed hour, the researchers came back with the basket. They held out the snack each worker had chosen the week before. Then they made an offer: you are free to change your mind. **Take any one you like**, and eat it now. Nobody was graded or watched. The question was only whether the person choosing for later and the person choosing for now would pick the same thing.',
        art: ['scene', { k: 'l54-back' }],
      },
      {
        k: 'ask',
        h: 'Say you picked fruit last week, and the chocolate is right there now. What do you take?',
        o: [
          ['The fruit, I picked it', 'Then you would be one of the few. Look at what most people did.'],
          ['The chocolate, honestly', 'Honest, and very common. Look at the numbers.'],
          ['Depends how my day went', 'That is the heart of this lesson. The state you are in does the choosing.'],
          ['I would not have picked fruit', 'Fair. Look at what the people who did pick it did next.'],
        ],
      },
      {
        h: 'For next week, most chose fruit. For right now, most chose chocolate.',
        p: 'Among workers who chose just after lunch both times, 74 in 100 picked fruit for the week ahead. On the day, 70 in 100 took the chocolate or crisps. **Most who had picked fruit switched.** Almost nobody switched the other way.',
        dx: 'Look at the workers who chose both times just after lunch, full and comfortable. For next week, 74 in every 100 picked fruit. On the day itself, offered the basket again, 70 in every 100 took the chocolate, the crisps or the nuts. **Most who had picked fruit switched.** Almost nobody went the other way, from chocolate to an apple. The same people, a week apart, wanted different things, and each choice felt right at the time it was made.',
        art: ['people', { n: 70, was: 26, s: 'took the treat, on the day' }],
        fact: { s: 'Study · 200 office workers · Read & van Leeuwen, 1998', i: [0] },
      },
      {
        long: 1,
        h: 'How hungry they were while choosing mattered too.',
        p: 'Workers who chose ahead while hungry picked less fruit for next week, though next week was nowhere near. **The state you choose in leaks into the choice.**',
        dx: 'There was a second finding, quieter and just as useful. Workers who made their choice for next week late in the afternoon, already hungry, picked less fruit than workers who chose just after lunch. Next week was a week away. Their hunger had nothing to do with it. It leaked in anyway. **The state you choose in leaks into the choice**, even a choice about another day. So it is not only choosing ahead that helps. It is choosing ahead while rested.',
      },
      {
        long: 1,
        h: 'A year later, other researchers saw the same thing with films.',
        p: 'People picking films for evenings days ahead chose serious ones about two times in three. For the night they were in, well under half. **Schindler’s List was picked 13 times for a later night, and once for the same night.**',
        dx: 'In another study, people picked three films to watch on three evenings, from a list of light comedies and serious, demanding ones. When they picked films for evenings days ahead, about two in three were the serious kind. When they picked for the evening they were in, it was well under half. One film tells the whole story. **Schindler’s List was picked 13 times for a later night, and once for the same night.** Everyone wants to have watched it. Almost nobody wants to watch it tonight.',
        art: ['scene', { k: 'l54-films' }],
        fact: { s: 'Study · Read, Loewenstein & Kalyanaraman, 1999', i: [1] },
      },
      {
        h: 'You are two people, and both of them are you.',
        p: 'One chooses with a full tank and the long view. The other lives in the moment, drained and looking for relief. **Neither one is fake.** The worn-out one is not bad. It is tired.',
        dx: 'So in a sense you are two people. One chooses with a full tank: rested, fed, with the long view of what you want your life to be. The other lives in the moment when the tank is low: drained, short of patience, looking for the quickest relief. **Neither one is fake**, and neither is the one true you hiding behind the other. The worn-out one is not bad or weak. It is tired. And a tired person, offered a basket, takes the chocolate.',
        art: ['scene', { k: 'l54-two-selves' }],
      },
      {
        h: 'Worn out does not keep a clock.',
        p: 'A long shift, a hard talk, a short night, an empty stomach, a slump in the middle of the day. After poor sleep, people act more on impulse. **Your worn-out hours are your own**, and you know them.',
        dx: 'Worn out is not one time of day. It is a long shift, a hard conversation, a short night, an empty stomach, a slump in the middle of the afternoon, the hour after the children are finally asleep. A review of research on sleep and self-control found the same thing again and again: after short or poor sleep, people act more on impulse and think less about later. **Your worn-out hours are your own**, and your log can show you when they come.',
        art: ['scene', { k: 'l54-tank' }],
        fact: { s: 'Review · Pilcher and colleagues, 2015', i: [2] },
      },
      {
        h: 'So let the rested you do the choosing.',
        p: 'Not with a promise, which the worn-out you has to keep. With a setup: where the phone charges, what is in the room, what the next hour holds. **The worn-out you only has to follow.**',
        dx: 'Here is how the two can work together. The rested you should not make a promise, because a promise has to be kept by the worn-out you, at the worst moment, against the basket. Instead the rested you makes a setup. Where the phone charges. What is in the house and what is not. What the next hard hour already holds: a walk, a call, a shower, sleep. **The worn-out you only has to follow** what is already there.',
        art: ['scene', { k: 'l54-setup' }],
      },
      {
        long: 1,
        h: 'The workers who switched were not weak.',
        p: 'They were the same people a week apart, in a different state. A setup is how one of them looks after the other, **like packing tomorrow’s lunch**.',
        dx: 'Nobody would call those office workers weak for taking the chocolate. They were the same people a week apart, in a different state, and the state chose. That is what a setup respects. It is how the rested one looks after the tired one, **like packing tomorrow’s lunch** while you have the energy, for someone you care about. It is not distrust of yourself. It is kindness, passed forward to the hour that will need it.',
      },
    ],
    mine: { h: 'Here is when your hours get hard.', k: 'hour' },
    today: {
      h: 'Set up one worn-out hour while you are rested.',
      l: ['Pick the hour that wears you down most', 'Choose one thing to move before it comes', 'Do it now, while you are rested'],
    },
    you: {
      h: 'What could your rested self set up for your worn-out self?',
      o: [
        ['Where the phone charges', 'Often the biggest one. A phone across the room is a different hour.'],
        ['What is in the house', 'What is not there cannot be reached for. That is a strong setup.'],
        ['Who I message when it starts', 'Then pick the person now, and keep their name at the top.'],
        ['I do not know yet', 'Fair. Watch your next worn-out hour, and see what it reached for.'],
      ],
    },
    scope:
      'The snack and film studies were about everyday choices, not a habit like this one, and the sleep review covers self-control in general. Together they point one hopeful way: the rested hours of the day can set up the worn-out ones, and that is a skill anyone can learn.',
    src: [S2.read98, S2.read99, N.pilcher15],
  },

  l55: {
    id: 'l55',
    form: 'works',
    title: 'Where the phone sleeps',
    ic: 'phone',
    ask: 'What changes if my phone sleeps somewhere else?',
    key: 'Twenty seconds of trouble changes what hands do. Give the phone a place that is not beside you.',
    np: 'Where my phone will sleep, and what I will use instead',
    tell: [
      {
        h: 'A writer who studies happiness wanted to practice the guitar every day.',
        p: 'Shawn Achor drew a chart with 21 boxes, one for each day. He kept the guitar in a closet, about twenty seconds away. **He played for four days, and stopped.**',
        dx: 'Shawn Achor taught and studied happiness, and he wanted to practice the guitar every day, the way he told his students to build good habits. He drew a chart with 21 boxes, one for each day of three weeks, and planned to check one off every evening. He kept the guitar where guitars usually live, in a closet, out of sight. Getting it out took about twenty seconds. **He played for four days, and stopped.** He wanted to play. He just did not, once the twenty seconds stood in the way.',
        art: ['scene', { k: 'l55-closet' }],
      },
      {
        h: 'The second time, he changed one thing.',
        p: 'He bought a two-dollar stand and set the guitar in the middle of the living room. **Three weeks later, all 21 boxes were checked.**',
        dx: 'He tried again, and this time he did not try to want it more. He changed where the guitar lived. He bought a stand for two dollars and set the guitar in the middle of the living room, where he walked past it all day. Picking it up now took no effort at all. **Three weeks later, all 21 boxes were checked.** Nothing about his willpower had changed. Twenty seconds had.',
        art: ['scene', { k: 'l55-stand' }],
        fact: { s: 'Book · Achor, The Happiness Advantage, 2010', i: [0] },
      },
      {
        long: 1,
        h: 'Then he turned the trick around.',
        p: 'To watch less television, he took the batteries out of the remote and put them in another room. **A small delay worked against a habit as well as for one.**',
        dx: 'Then he turned the trick around, on a habit he wanted less of. He took the batteries out of the television remote and put them in another room. Now, to switch on the television, he had to get up and fetch them, and often he found something better to do before he did. He called it the twenty-second rule: make what you want to do twenty seconds easier, and what you do not want twenty seconds harder. **A small delay worked against a habit as well as for one.**',
        art: ['scene', { k: 'l55-remote' }],
      },
      {
        k: 'ask',
        h: 'In your hardest hours, where is your phone?',
        o: [
          ['In my hand, or my pocket', 'Then the reach is zero. Look at what a small reach does.'],
          ['Next to me, face down', 'Face down is still within reach. Look at the next card.'],
          ['In the room, charging', 'Closer than it feels. A few steps can be a lot, as you will see.'],
          ['In another room already', 'Then you have already done this lesson. Look at why it works.'],
        ],
      },
      {
        h: 'A hospital salad bar tested the same idea with food.',
        p: 'Researchers in Philadelphia moved one dish about ten inches farther back, a slightly longer reach. **People took about a tenth less of it.** Serving it with tongs instead of a spoon cut it by a sixth.',
        dx: 'At a salad bar in a hospital cafeteria in Philadelphia, where staff paid by weight, Paul Rozin and his colleagues made changes too small for anyone to notice. They moved one dish from the edge of the bar to the middle row, about ten inches farther back. **People took about a tenth less of it.** On other days they swapped the serving spoon for tongs, which are a little more awkward, and people took about a sixth less. Nobody had been told anything. The reach did it.',
        art: ['scene', { k: 'l55-salad' }],
        fact: { s: 'Study · Rozin and colleagues, 2011', i: [1] },
      },
      {
        h: 'Nobody decided anything.',
        p: 'The food was the same, the people were the same, and nobody chose to eat less. **A small reach changed what hands did**, without a single fight.',
        dx: 'Look at what did not happen at that salad bar. Nobody resolved to eat better. Nobody fought an urge or felt proud of resisting. The food was the same, the people were the same, and each one would have said they took what they wanted. And still, **a small reach changed what hands did**, without a single fight. That is the part of a habit that willpower never sees: much of it is decided by what is easy to reach.',
      },
      {
        h: 'A phone in your hand asks for zero seconds.',
        p: 'Everything on it is a thumb away, at the moment you are least able to choose. A phone charging in another room asks for twenty. **Twenty seconds is often enough for the urge to pass.**',
        dx: 'Now think of the phone in your hardest hours. In your hand or beside you, it asks for zero seconds. Everything on it is a thumb away, at the very moment you are least able to choose well. Charging in another room, it asks for twenty: get up, walk, pick it up. That is not a wall, and it is not meant to be. But an urge rises and falls in minutes, and **twenty seconds is often enough for the urge to pass**, or for you to notice what you are doing and choose.',
        art: ['scene', { k: 'l55-hall' }],
        back: 'l2',
      },
      {
        long: 1,
        h: 'A phone close by takes rest as well.',
        p: 'In a survey of 844 adults, using the phone after the lights went out went with later, worse sleep and more tiredness. **A tired day makes every pull louder.**',
        dx: 'There is a second cost to a phone that sleeps beside you. In a survey of 844 adults in Belgium, people who used their phone after the lights went out fell asleep later, slept worse and felt more tired. Poor sleep then makes the next day harder in its own way, because **a tired day makes every pull louder**. Moving the phone does two jobs at once: it adds the twenty seconds, and it gives back some of the rest that helps you say no.',
        fact: { s: 'Survey · 844 adults · Exelmans & Van den Bulck, 2016', i: [2] },
        back: 'l54',
      },
      {
        h: 'So give the phone a place to sleep that is not beside you.',
        p: 'A charger in the kitchen or by the door, and a cheap alarm clock for waking. It still rings if someone needs you. **It just cannot sit in your hand.**',
        dx: 'So give the phone its own place to sleep, somewhere that is not beside you: a charger in the kitchen, or by the front door. Use a cheap alarm clock for waking, which can wake you and cannot open anything else. The phone still rings if someone needs you, and you will hear it. **It just cannot sit in your hand.** Do the same in your hard hours during the day: a shelf, a drawer, a bag across the room. Twenty seconds, wherever you need them.',
        art: ['scene', { k: 'l55-charger' }],
      },
    ],
    mine: { h: 'Here is what your log says comes first.', k: 'trigger' },
    today: {
      h: 'Give the phone its own place to charge today.',
      l: ['Pick a spot outside the room you rest in', 'Use a cheap alarm clock for waking', 'In your hard hours, leave it there'],
    },
    you: {
      h: 'What keeps your phone close in your hard hours?',
      o: [
        ['It is my alarm', 'A cheap alarm clock does that job, and it cannot open anything.'],
        ['Music or something to wind down', 'A small speaker or an old player can do that, with no feed in it.'],
        ['I want to be reachable', 'A phone in the next room still rings. You will hear the calls that matter.'],
        ['I just always have', 'Then it is habit, not need. Twenty seconds can move a habit.'],
      ],
    },
    scope:
      'The guitar is one person’s story, the salad bar study was about food, and the sleep survey followed adults in one country. They point one hopeful way: a small change in how easy something is to reach changes what people do, with no fight at all, and a phone is one of the easiest things to move.',
    src: [S2.achor, S2.rozin11, N.exelmans16],
  },

  l56: {
    id: 'l56',
    form: 'works',
    title: 'A wall with doors',
    ic: 'shield',
    ask: 'Is a filter worth it if I can always get around it?',
    key: 'A safe is rated in minutes. A filter does not have to hold forever, only long enough.',
    np: 'The doors my filter does not cover yet, and who could hold the code',
    tell: [
      {
        h: 'Bank safes are never sold as unbreakable.',
        p: 'They are rated in minutes. A safe marked TL-15 held off two trained testers with drills and grinders for fifteen minutes. **The rating is not whether it can be opened. It is how long it takes.**',
        dx: 'In the United States, safes are tested by Underwriters Laboratories, and the ratings surprise people. No safe is ever rated unbreakable. Instead, two trained technicians attack it with hand tools, drills, grinders and saws, with the clock running only while a tool is touching the safe. A safe marked TL-15 held them off for fifteen minutes. TL-30, for thirty. **The rating is not whether it can be opened. It is how long it takes.** Everyone in the business knows that a determined person with time will get in.',
        art: ['scene', { k: 'l56-safe' }],
        fact: { s: 'Standard · UL 687, burglary-resistant safes', i: [0] },
      },
      {
        h: 'The minutes are the whole point.',
        p: 'A safe does not have to stop a thief forever. It has to hold until the alarm brings someone. **The delay is the protection.**',
        dx: 'So why would anyone pay for a safe that can be opened? Because the safe is never working alone. It is part of a plan: an alarm, a camera, a guard, a police car on the way. The safe only has to hold until help arrives. Fifteen minutes is enough when help comes in ten. **The delay is the protection.** A safe that bought no time would be worthless, and a safe that bought enough time is as good as a wall.',
        art: ['scene', { k: 'l56-alarm' }],
      },
      {
        k: 'ask',
        h: 'When you got around a block before, how did you do it?',
        o: [
          ['Another browser or app', 'Then the wall had a door in it. Most doors can be closed once you know them.'],
          ['Another device', 'A wall on one device sends the urge to the next. Each one needs its own.'],
          ['I turned it off myself', 'Then the code was in your hands. Someone else can hold it.'],
          ['I have never tried a block', 'Then you start with a clear map of where the doors are.'],
        ],
      },
      {
        h: 'A filter is a safe, not a cage.',
        p: 'Someone determined can get past it, and so can you, in a hard hour. But it is not built to hold forever. **It is built to hold long enough.**',
        dx: 'Many people set up a filter, find a way around it a week later, and decide filters do not work. That is judging a safe by asking whether it can be opened. A filter is not a cage. Someone determined can get past it, and so can you, in a hard hour, with enough time. But it was never built to hold forever. **It is built to hold long enough**, the way a safe holds until the alarm brings someone.',
        art: ['scene', { k: 'l56-not-cage' }],
      },
      {
        h: 'Long enough for what? An urge rises, peaks and falls, often within minutes.',
        p: 'Every minute between the thought and the screen is a minute for the wave to come down, and for **the alarm in you to ring**: the part that remembers why you started.',
        dx: 'So what is the filter holding out for? Not a guard. The help that arrives is inside you. An urge rises, peaks and falls, often within minutes, if it is not fed. Every minute between the first thought and the screen is a minute for the wave to come down. It is also a minute for **the alarm in you to ring**: the part of you that remembers why you started, who you are doing this for, and what the hour after will feel like.',
        art: ['wave', {}],
        back: 'l2',
      },
      {
        h: 'A barrier that was easy to get past still helped.',
        p: 'People who asked to be barred from casinos gambled less and felt more in control, even though slipping in was often easy. **The bar did not have to be perfect to work.**',
        dx: 'Some casinos let people ask to be barred from entering, and a review gathered the studies of what happened next. Most people who barred themselves gambled less and felt more in control of their lives, even though slipping past the door was often easy, and some did. **The bar did not have to be perfect to work.** What it did was add a step, a moment, a door to push past, and for many people that was the moment they turned around.',
        art: ['scene', { k: 'l56-door' }],
        fact: { s: 'Review · Gainsbury, 2014', i: [1] },
      },
      {
        long: 1,
        h: 'Changing the setting works better than fighting the moment.',
        p: 'Researchers who study self-control found that steps taken early, before the pull, help more than resisting once the pull is strong. **A filter makes the choice before the urge does.**',
        dx: 'Angela Duckworth and her colleagues looked at the many ways people try to control themselves, sorted by when they step in. The moves made early, like choosing where you will be and what is in reach, worked better than the moves made late, gritting your teeth once the pull is already strong. **A filter makes the choice before the urge does.** It is the rested you, setting up the hour for the worn-out you.',
        fact: { s: 'Review · Duckworth, Gendler & Gross, 2016', i: [2] },
        back: 'l54',
      },
      {
        h: 'A wall has doors. Name yours on a calm day.',
        p: 'A second browser, a private window, an app with its own search, a tablet in a drawer. **Close the doors you know, and hand the key to someone else.** Turning it off should never be one tap.',
        dx: 'Every filter covers what it knows, and the doors are elsewhere. A second browser. A private window. An app with its own search or a feed that shows anything. A tablet, a laptop, an old phone in a drawer. Name your doors once, on a calm day, and close the ones you can. Then **close the doors you know, and hand the key to someone else**, so turning it off is never one tap in a hard hour.',
        art: ['scene', { k: 'l56-doors' }],
      },
      {
        long: 1,
        h: 'Let someone else hold the code.',
        p: 'Most phones have built-in limits, like Screen Time on an iPhone, and a friend can set the passcode. You do not have to tell them everything. **“Can you set a code I do not know?” is enough.**',
        dx: 'Most phones have limits built in, like Screen Time on an iPhone, and a passcode can lock them. Ask a friend, a partner or a family member to set that code, and not to tell you. You do not have to explain everything. **“Can you set a code I do not know?” is enough.** It turns the off switch from one tap into a conversation, and few people want to have that conversation in the worst minute of their day.',
        fact: { s: 'Apple · Screen Time passcode', i: [3] },
      },
    ],
    today: {
      h: 'Close the doors you know, and hand over the key.',
      l: ['Turn on a block on every device', 'Close the side doors: apps and browsers', 'Let someone you trust set the code'],
    },
    you: {
      h: 'Which door does your filter not cover yet?',
      o: [
        ['Another browser or app', 'Close it today, while you are calm. One door at a time is enough.'],
        ['Another device', 'Then the block needs a second home. It takes ten minutes.'],
        ['I can turn it off myself', 'Then the key is the door. Ask someone to hold the code.'],
        ['I do not have a filter yet', 'Then start with one device, the one in your hand most.'],
      ],
    },
    scope:
      'Safe ratings are about burglary, the barring review is about gambling, and the self-control review covers habits of many kinds. The idea carries over cleanly and hopefully: a barrier does not have to be perfect to help. Every minute it adds is a minute for the urge to pass.',
    src: [S2.ul687, N.gainsbury14, N.duckworth16, N.screentime],
  },

  l57: {
    id: 'l57',
    form: 'life',
    title: 'Nobody gets free alone',
    ic: 'chat',
    ask: 'Should I not be able to do this on my own?',
    key: 'You do not need a crowd. You need one person at the other end of the line.',
    np: 'The one person I could call, and the first sentence I would say',
    tell: [
      {
        h: 'In May 1935, a man named Bill Wilson stood alone in a hotel lobby in Akron, Ohio.',
        p: 'He had come to win a business deal, and it had failed. It was a Saturday in a strange city. **He had been sober for five months**, and he felt it slipping.',
        dx: 'Bill Wilson was a stockbroker from New York who had nearly drunk himself to death. Five months earlier he had stopped, with the help of a small group that met to talk honestly about their lives. Now he was in Akron, Ohio, on a business trip that had just fallen apart. It was a Saturday. He knew nobody in town. He had a little money in his pocket and a long weekend in front of him. **He had been sober for five months**, and alone in the Mayflower Hotel, he could feel it slipping.',
        art: ['scene', { k: 'l57-lobby' }],
      },
      {
        h: 'At one end of the lobby was the bar. At the other, a board listing the town’s churches, and a telephone.',
        p: 'He could hear the bar. He paced between the two ends. And a thought came to him: **he did not need a drink. He needed to talk to someone who drank the way he had.**',
        dx: 'The lobby had a bar at one end. He could hear the voices and the glasses. At the other end hung a board listing the churches in town, and near it, a telephone. He paced from one end to the other. Then a thought came that would change his life and, later, millions of others: **he did not need a drink. He needed to talk to someone who drank the way he had.** Not for that person’s sake. For his own, to stay sober through the weekend.',
        art: ['scene', { k: 'l57-two-ends' }],
      },
      {
        k: 'ask',
        h: 'Say you were in that lobby. What would you do?',
        o: [
          ['Go to the bar, just for one', 'That is what the lobby was pulling for. Look at what he did.'],
          ['Go up to my room and wait it out', 'Alone with it is how many hard nights go. Look at what he did instead.'],
          ['Call someone I know', 'That is close to what he did, with one twist.'],
          ['I do not know', 'Fair. Neither did he, for a while.'],
        ],
      },
      {
        h: 'He went to the phone.',
        p: 'He called a minister from the board, who gave him a list of names. Call after call came to nothing, until **one person said yes**: Henrietta Seiberling, who knew a doctor in town who could not stop drinking.',
        dx: 'He went to the telephone. He called a minister named Walter Tunks, picked from the board, and asked if he knew anyone in town who drank too much. The minister gave him a list of about ten names. Bill went down it, call after call, and got nowhere. Then **one person said yes**: Henrietta Seiberling, who knew a surgeon in town named Bob Smith, a good man who could not stop drinking and was hiding it badly.',
        art: ['scene', { k: 'l57-phone' }],
      },
      {
        h: 'The next day, Bill sat down with Dr. Bob Smith.',
        p: 'Dr. Bob had promised his wife he would stay fifteen minutes, no more. **They talked for about six hours.** Bill did not lecture him. He told him his own story, and what it had cost.',
        dx: 'The next day, a Sunday, they met at the gatehouse on the Seiberling estate, with Dr. Bob’s wife Anne there too. Dr. Bob was hung over and did not want to come. He told Anne fifteen minutes would be the most he could stand. **They talked for about six hours.** Bill did not preach or tell Dr. Bob what to do. He told his own story: how the drinking went, what it had taken from him, how he had stopped. Dr. Bob said later it was the first time he had talked with someone who knew, from the inside, what he was talking about.',
        art: ['scene', { k: 'l57-talk' }],
        fact: { s: 'Talk · Dr. Bob, 1948 (AA pamphlet)', i: [0] },
      },
      {
        h: 'Here is the turn nobody expected.',
        p: 'Bill had not called to rescue Dr. Bob. **He called to save himself.** Talking honestly with someone who had the same trouble was what kept him away from the bar.',
        dx: 'Look at who was helped in that room. It is easy to read it as Bill rescuing Dr. Bob. But Bill had picked up that phone for himself. **He called to save himself.** Telling the truth to someone who had the same trouble did something nothing else had done that weekend: it pulled him out of his own head, out of the lobby, and away from the bar. Both men walked out of that gatehouse sober. Each had been the help the other needed.',
      },
      {
        long: 1,
        h: 'A few weeks later, Dr. Bob had his last drink.',
        p: 'The date was June 10, 1935. The two men began what became Alcoholics Anonymous, built on what Bill found in that lobby: **people stay free by helping each other stay free.**',
        dx: 'It was not instant. A few weeks later Dr. Bob went on one more binge, at a medical conference, and Bill went to get him and brought him home. His last drink was on June 10, 1935, and that day is still counted as the start of Alcoholics Anonymous. Everything that grew from it, the meetings in nearly every town in the world, rests on what Bill found pacing that lobby: **people stay free by helping each other stay free.**',
        art: ['scene', { k: 'l57-meeting' }],
      },
      {
        h: 'Years later, a study of 210 people quitting drinking looked at who was around them.',
        p: 'Each friend who did not drink went with about a quarter better chance of a year without drinking. **One person was enough to move the numbers.**',
        dx: 'Researchers in Connecticut followed 210 people quitting drinking and helped some of them change who they spent time with. They found that what mattered most was not cutting people off, but adding someone. Each friend in a person’s circle who did not drink went with about a quarter better chance of a whole year without drinking. **One person was enough to move the numbers.** Not a crowd, not a program on its own. One person.',
        art: ['scene', { k: 'l57-circle' }],
        fact: { s: 'Study · 210 adults · Litt and colleagues, 2009', i: [1] },
      },
      {
        long: 1,
        h: 'Being seen is a kind of help, too.',
        p: 'A review of 138 studies found that keeping track of progress helped people reach their goals, and helped most when **someone else could see it**.',
        dx: 'A review of 138 studies looked at whether keeping track of progress helps people reach their goals. It does. And it helped most when the progress was reported to someone else, or made public, rather than kept in a private notebook. **Someone else could see it**, and that changed how people kept going on the days they would rather not look. A person who knows is not a judge. They are a light left on.',
        fact: { s: 'Review · 138 studies · Harkin and colleagues, 2016', i: [2] },
      },
      {
        h: 'Nobody gets free alone, and it is not because you are weak.',
        p: 'It is because a person who knows your trouble does something no plan can. **They are the phone at the other end of the lobby.**',
        dx: 'So needing someone is not a sign you are weaker than the people who make it. It is how the people who make it did it, starting with the two men who began the best-known group of all. A person who knows your trouble does something no plan, app or promise can: they pull you out of your own head at the worst moment. **They are the phone at the other end of the lobby.** You need one. Not a crowd, and not your whole story. One person, and one true sentence.',
        art: ['scene', { k: 'l57-line' }],
      },
    ],
    mine: { h: 'Here is what you have come back from already.', k: 'back' },
    today: {
      h: 'Tell one person, in one sentence.',
      l: ['Pick the one person who feels safe', 'Say one true sentence, not the whole story', 'Ask them to check in once a week'],
    },
    you: {
      h: 'If you picked up the phone in that lobby, who would you call?',
      o: [
        ['A friend I trust', 'A friend who knows can check in, and you never have to explain twice.'],
        ['My partner, or someone at home', 'That can be a big step. It often goes better planned than blurted.'],
        ['A counselor, a group or a faith leader', 'They hear this often. They will not be shocked.'],
        ['Nobody yet', 'That is honest. Bill started with a list of strangers. A group can be yours.'],
      ],
    },
    scope:
      'Bill W. and Dr. Bob are a real moment in history, told from Dr. Bob’s own account. The network study was with people quitting drinking, and the tracking review covers goals of many kinds. They point one hopeful way: change goes further with even one person beside you, and that person can be found.',
    src: [S2.drbob, N.litt09, N.harkin16],
  },

  l58: {
    id: 'l58',
    form: 'breakdown',
    title: 'When the habit is carrying something heavier',
    ic: 'life',
    ask: 'What if the habit is how I cope with something bigger?',
    key: 'The habit was already your help with a heavy feeling. Give that feeling better help.',
    np: 'What the habit might be carrying for me, and one person I could ask about it',
    tell: L58_TELL,
    today: {
      h: 'Give the heavy thing one step of care this week.',
      l: ['Tell a doctor how your sleep and mood are', 'Look for a counselor, even a low-cost one', 'Tell one person how you have been'],
    },
    you: {
      h: 'What might the habit be carrying for you?',
      o: [
        ['Low mood', 'That is common, and very treatable. It deserves its own care.'],
        ['Worry, or stress', 'Worry has help of its own. You do not have to carry it this way.'],
        ['Feeling alone', 'Then a person, a group or a counselor meets it better than the habit can.'],
        ['I am not sure yet', 'Fair. The next heavy week, ask what the habit is helping with.'],
      ],
    },
    scope:
      'The sleep trial was with students, and the guideline is written for doctors in the United Kingdom. Both say the same hopeful thing: low mood, worry and poor sleep respond well to care, and getting that care makes every other change easier.',
    src: [N.freeman17, N.nice22],
    hab: {
      alcohol: {
        tell: [
          ...L58_TELL.slice(0, L58_AT),
          {
            h: 'For drinking, there are medicines that help, and a doctor should help with the first days.',
            p: 'Naltrexone and acamprosate can make cravings weaker and heavy drinking less likely. If you drink every day or a lot at a time, **stopping all at once can be dangerous**, so ask a doctor first.',
            dx: 'For drinking, there is help many people never hear about. Medicines such as naltrexone and acamprosate are approved for alcohol problems. They are not habit-forming, and they can make cravings weaker and heavy drinking less likely. Few people who could use one are ever offered it, so it is worth asking. And if you drink every day, or a lot at a time, **stopping all at once can be dangerous**: a doctor should help with the first days. Low mood and worry under the drinking have their own good help too.',
            art: ['scene', { k: 'l58-ask' }],
            fact: { s: 'Health body · NIAAA', i: [1] },
          },
          ...L58_TELL.slice(L58_AT + 1),
        ],
        scope:
          'The sleep trial was with students, and the medicines are those NIAAA lists for alcohol use disorder. Both say the same hopeful thing: the heavier things under a habit respond well to care, and for drinking, medicine is one more tool a doctor can offer.',
        src: [N.freeman17, N.niaaa],
      },
    },
  },

  l50: {
    id: 'l50',
    form: 'study',
    title: 'The drink in every hand',
    ic: 'glass',
    ask: 'How do I stay free when everyone around me is drinking?',
    key: 'People notice your glass far less than you fear. Pick your drink and your words before you go.',
    np: 'What I will order, and the words I will say when someone asks',
    tell: [
      {
        h: 'Around the year 2000, psychologists at Cornell asked students to put on an embarrassing T-shirt.',
        p: 'It had a big picture of Barry Manilow, a singer their classmates found very uncool. Each student then walked into a room where others were already sitting, **and walked out again.**',
        dx: 'Thomas Gilovich and his colleagues at Cornell wanted to know how much other people really notice us. They chose a shirt their students had rated as one of the most embarrassing they could think of: a big, smiling picture of Barry Manilow. One student at a time put it on and was sent into a room where other students were already seated, filling in forms. The wearer was a little late, so everyone looked up. A moment later, the wearer was asked to step out again, **and walked out again** into the hall, shirt and all.',
        art: ['scene', { k: 'l50-shirt' }],
      },
      {
        k: 'ask',
        h: 'Say that was you, in that shirt. How much of the room would you guess noticed it?',
        o: [
          ['Almost everyone', 'That is how it feels from inside the shirt. Look at what the room said.'],
          ['About half', 'That is close to what the wearers guessed. Look at what the room said.'],
          ['Only a few', 'Then you guessed closer than the wearers did.'],
          ['I would not care', 'Then you are ahead of most of the students. Look at why it matters.'],
        ],
      },
      {
        h: 'The wearers guessed about half the room had noticed.',
        p: 'When the researchers asked the room, about a quarter could say what was on the shirt. **People noticed half as much as the wearers feared.** The researchers called it the spotlight effect.',
        dx: 'Out in the hall, each wearer was asked how many of the people in the room could name the face on the shirt. They guessed about half. Then the researchers asked the people in the room. About a quarter could. **People noticed half as much as the wearers feared.** The researchers called it the spotlight effect: we feel lit up, as if everyone is watching us, because we are watching ourselves so closely. Everyone else is busy feeling lit up too.',
        art: ['people', { n: 25, was: 50, s: 'noticed the shirt' }],
        fact: { s: 'Study · Gilovich, Medvec & Savitsky, 2000', i: [0] },
      },
      {
        h: 'A glass in your hand is a far smaller thing than that shirt.',
        p: 'At a table, most people are watching their own drink, their own words, their own shirt. **Your glass is far less interesting to them than it is to you.**',
        dx: 'Now think of the table, the toast, the round being ordered. If a giant face of Barry Manilow drew only a quarter of a room, a soda water in your hand draws far less. Most people at the table are watching their own drink, their own words, how they come across. **Your glass is far less interesting to them than it is to you.** The spotlight you feel when you order something else is mostly your own.',
        art: ['scene', { k: 'l50-table' }],
      },
      {
        h: 'At Princeton, students were asked how comfortable they were with how much people drank on campus.',
        p: 'Then they were asked how comfortable they thought the average student was. **Most said the average student was more at ease with it than they were.**',
        dx: 'In the early 1990s, Deborah Prentice and Dale Miller asked Princeton students a pair of questions. First: how comfortable are you with the amount of drinking that goes on here? Then: how comfortable do you think the average student is? The answers did not match. **Most said the average student was more at ease with it than they were.** Asked about their own friends, they said the same. Almost everyone placed themselves a little outside the crowd.',
        art: ['scene', { k: 'l50-survey' }],
        fact: { s: 'Study · Prentice & Miller, 1993', i: [1] },
      },
      {
        h: 'Almost everyone thought they were the odd one out.',
        p: 'Each person felt less at ease than they thought everyone else was, so each acted the way they thought the room wanted. **The room was full of people going along, for each other.**',
        dx: 'Put those answers together and something strange appears. If most students were less comfortable than the average student, then the average student they pictured did not exist. Each person felt privately uneasy, believed everyone else was fine, and so acted the way they thought the room wanted: raised the glass, laughed it off, ordered the next one. **The room was full of people going along, for each other.** Researchers call it pluralistic ignorance: everyone wrong about everyone, in the same direction.',
        art: ['scene', { k: 'l50-odd-one' }],
      },
      {
        long: 1,
        h: 'Over a term, the young men moved toward the norm they had imagined.',
        p: 'They began to feel the way they thought everyone felt, though nobody had felt that way to begin with. **A guess about others became their own habit.**',
        dx: 'The researchers followed students through a term. The young men, over the months, shifted their own feelings toward the comfort with drinking they believed everyone else had, though it had never been there to begin with. The young women did not shift. **A guess about others became their own habit.** That is how a table can push without anyone pushing: each person bends a little toward a crowd that is only in their heads.',
      },
      {
        h: 'So at the table, you may not be the only one who would rather not.',
        p: 'When you say a plain no, you show the room what one person really thinks. **Someone at that table may be glad you said it first.**',
        dx: 'So the next time you sit down at a table where a round is being ordered, remember what the Princeton students did not know about each other. You may not be the only one there who would rather not, or who would rather have one and stop. When you say a plain no, warmly and without a speech, you show the room what one person really thinks, which is rarer than it should be. **Someone at that table may be glad you said it first.**',
        art: ['scene', { k: 'l50-no-thanks' }],
      },
      {
        h: 'And saying no gets easier every time you do it.',
        p: 'Among 857 adults who took a month off drinking, six months later many felt surer turning down a drink and drank less, even some who did not finish. **Saying no is a skill, and it grows with use.**',
        dx: 'Researchers in England followed 857 adults who signed up to take January off drinking. Six months later, many of them felt surer they could turn down a drink in company, and were drinking less than before. It held even for some who had not made the whole month, though it was stronger for those who had. **Saying no is a skill, and it grows with use.** The first no at a table is the hardest one you will ever say.',
        fact: { s: 'Study · 857 adults · de Visser, Robinson & Bond, 2016', i: [2] },
      },
      {
        long: 1,
        h: 'Plan the push before it comes.',
        p: 'Pick your drink before you go: soda, tea, an alcohol-free beer. Pick your words too. **“I am not drinking tonight” is a full answer.** You do not owe anyone a reason.',
        dx: 'The hardest moment is the one where someone holds out a glass and you have to decide on the spot. So decide at home. Pick your drink before you go: soda, tea, an alcohol-free beer, whatever you will enjoy holding. Pick your words too, and say them once out loud so they come easily. **“I am not drinking tonight” is a full answer.** You do not owe anyone a reason, and if someone keeps pushing, that says something about their glass, not yours.',
        back: 'l9',
      },
    ],
    mine: { h: 'Look at what has set your urges off.', k: 'trigger' },
    today: {
      h: 'Pick your drink and your words before you go.',
      l: ['Choose your drink now: soda, tea, alcohol-free', 'Say it plainly: “I am not drinking.”', 'Hold a glass, and leave early if you need'],
    },
    you: {
      h: 'When you picture saying no at a table, what do you fear most?',
      o: [
        ['That they will think I am boring', 'Most of them will hardly notice. The ones who do may be glad.'],
        ['That they will ask why', 'Then have your words ready. One plain sentence ends the question.'],
        ['That I will not have fun', 'Watch what the evening is made of besides the glass.'],
        ['That I will give in when they push', 'Then plan the push at home. A plan made ahead holds better.'],
      ],
    },
    scope:
      'The shirt study was about being noticed, not about drinking, and the Princeton and month-off studies asked students and volunteers who chose to take part. They point one hopeful way: the pressure at a table is often smaller than it feels, and saying no gets easier every time you do it.',
    src: [S3.gilovich, S3.prentice, S3.devisser],
  },

  l51: {
    id: 'l51',
    form: 'study',
    title: 'The people around the glass',
    ic: 'heart',
    ask: 'My drinking hurt people. How do I make it right?',
    key: 'Trust comes back the way it left, in small moments. Turn toward them, sober, again and again.',
    np: 'One person I want to show up for, and how',
    tell: [
      {
        h: 'In 1990, a psychologist named John Gottman invited newlywed couples to spend a day in his lab in Seattle.',
        p: 'It was set up like a bed and breakfast, with a kitchen, a sofa and quiet cameras. **The couples did nothing special.** They cooked, read and talked, the way couples do.',
        dx: 'John Gottman had spent years studying couples in arguments. This time he wanted to see them on an ordinary day. He fitted out a room at the University of Washington like a little bed and breakfast, with a kitchen, a sofa, books and a view, and invited 130 newlywed couples to spend a day there, one couple at a time, with cameras quietly running. **The couples did nothing special.** They made lunch, read the paper, talked about nothing much. That was the point.',
        art: ['scene', { k: 'l51-lab' }],
      },
      {
        h: 'He was watching for something small.',
        p: 'One would say, “Look at that bird outside.” A small reach for attention, which he called a bid. The other could turn toward it, or carry on reading. **Most bids were about almost nothing.**',
        dx: 'What Gottman watched for was tiny. One partner would look up and say, “Look at that bird outside,” or “Listen to this,” or just sigh. He called these bids: small reaches for the other person’s attention. The other partner could turn toward the bid, look up, ask about the bird, laugh. Or they could turn away, keep reading, say nothing. **Most bids were about almost nothing**, and that is what made them easy to miss.',
        art: ['scene', { k: 'l51-bird' }],
      },
      {
        k: 'ask',
        h: 'Think of the person your drinking touched most. What were your ordinary moments with them like?',
        o: [
          ['I was often not really there', 'That is honest, and it is the place this lesson starts.'],
          ['There in body, not in attention', 'Many people say that. Look at what those moments turned out to hold.'],
          ['We still had good moments', 'Then there is something to build on. Look at how it grows.'],
          ['I am not sure', 'Fair. Ask them sometime. Their answer will tell you a lot.'],
        ],
      },
      {
        h: 'Six years later, he checked which couples were still together.',
        p: 'By his count, the couples still married had turned toward each other’s bids about 86 times in 100. The couples who had split, about 33. **Trust was built in the small moments, not the big ones.**',
        dx: 'Gottman and his team kept in touch with the couples, and six years later they checked who was still together. Then they went back to the tapes from that ordinary day. By their count, the couples still married had turned toward each other’s small bids about 86 times in every 100. The couples who had divorced had done it about 33 times. Not the big fights, not the anniversaries. **Trust was built in the small moments, not the big ones**, the bird, the joke, the look up from the page.',
        art: ['people', { n: 86, was: 33, s: 'bids turned toward, couples still together' }],
        fact: { s: 'Research · Gottman, newlywed couples', i: [0] },
      },
      {
        h: 'Drinking takes the small moments first.',
        p: 'The missed call, the half-heard story, the evening you were there and not there. **Most of what it cost the people at home was made of moments like these.**',
        dx: 'Now look at what drinking does to a home. It rarely takes everything at once. It takes the small moments first: the call you did not pick up, the story you half heard, the game you said you would come to, the evening you were in the room and not really there. Each one alone seems like nothing. **Most of what it cost the people at home was made of moments like these**, thousands of small bids that met no one.',
        art: ['scene', { k: 'l51-missed' }],
      },
      {
        h: 'So a sincere apology opens the door, and small moments walk through it.',
        p: 'Across 175 studies, a sincere apology was one of the strongest roads to being forgiven. **But trust comes back the way it left: one small moment at a time.**',
        dx: 'An apology matters. A review that pooled 175 studies of forgiveness found that a sincere apology, one that names what happened without excuses, was among the things that went most with being forgiven. Say it, once, plainly. But an apology is a door, not the room. **Trust comes back the way it left: one small moment at a time.** The call answered. The phone put down when they talk. The ordinary evening, there and sober, again and again.',
        fact: { s: 'Review · 175 studies · Fehr, Gelfand & Nag, 2010', i: [1] },
      },
      {
        long: 1,
        h: 'Bringing them in helps the drinking too.',
        p: 'In 12 trials where a partner joined the treatment, couples did better than with treatment for the drinker alone, especially in the months after. **The people around the glass are part of how it heals.**',
        dx: 'Researchers gathered 12 trials of a kind of treatment where the partner takes part, learning together how to support the change and how to talk again. Compared with treatment for the drinker alone, couples who did it together ended up with less drinking, fewer problems from it and happier relationships, and the gains showed most in the months after treatment ended. **The people around the glass are part of how it heals**, not only the ones it hurt.',
        fact: { s: 'Review · 12 trials · Powers, Vedel & Emmelkamp, 2008', i: [2] },
      },
      {
        h: 'Each bid you turn toward is a small repair.',
        p: 'Look up when they talk. Answer the call. Be there, sober, for the ordinary evening. **Nobody sees it as a speech. Everyone sees it over a month.**',
        dx: 'So the repair is not a performance. It is a habit, built the same way the drinking was: by repetition. Look up when they talk to you. Answer the call. Ask about the bird. Be there, sober, for the evening when nothing happens. **Nobody sees it as a speech. Everyone sees it over a month.** And it works on you too: every bid you turn toward is one more piece of evidence that you are someone who shows up.',
        art: ['scene', { k: 'l51-turn' }],
      },
      {
        long: 1,
        h: 'Leave out any repair that would hurt someone.',
        p: 'Or one that is only for your own relief. If drinking led to danger at home, a counselor can help you do this safely. **Their hurt and their timeline are theirs.**',
        dx: 'Some repairs do more harm than good: a confession that wounds someone who did not need to know, or an apology that is really a request to feel better. Leave those out. If drinking led to anger or danger at home, do not do this alone: a counselor can help you make things right safely. And let the people you hurt set the pace. **Their hurt and their timeline are theirs**, and your part is to keep showing up while they decide.',
      },
    ],
    mine: { h: 'Look at what you have already done.', k: 'acted' },
    today: {
      h: 'Turn toward one small bid today.',
      l: ['Notice when someone reaches for you', 'Put everything down, and turn toward them', 'Say sorry once, plainly, if it is owed'],
    },
    you: {
      h: 'Who has paid the most for your drinking, besides you?',
      o: [
        ['My partner', 'Then the ordinary evenings with them are where the repair lives.'],
        ['My kids', 'Children notice what you do far more than what you promise.'],
        ['A friend or family member', 'Then one answered call could start something.'],
        ['No one, really', 'Maybe. Ask one person close to you, and listen to the answer.'],
      ],
    },
    scope:
      'The bids research comes from couples followed in one lab, as Gottman reports it, and the couples and forgiveness reviews pooled many kinds of studies. Together they point one sure way: repair is real, it takes time, and it is made of small moments of showing up.',
    src: [S3.gottman, S3.fehr, S3.powers],
  },

  l52: {
    id: 'l52',
    form: 'life',
    title: 'Chasing it back',
    ic: 'dice',
    ask: 'Why do I keep betting to win back what I lost?',
    key: 'The wheel keeps no account of what you lost. Every chase is a new bet, at the same odds.',
    np: 'What I will do the next time I feel I have to win it back',
    tell: [
      {
        h: 'The story goes that one evening in August 1913, at the casino in Monte Carlo, the roulette ball kept landing on black.',
        p: 'Ten times in a row. Fifteen. People left the other tables and crowded round. **Surely red was due.**',
        dx: 'The story has been told for over a century. One evening in August 1913, at the grand casino in Monte Carlo, the little ball at one roulette table landed on black. Then black again. Then again. Ten times in a row. Fifteen. Word went round the room, and players left the other tables and crowded in. Everyone could feel it. A run that long could not go on. **Surely red was due.**',
        art: ['scene', { k: 'l52-wheel' }],
      },
      {
        h: 'They bet on red, and lost, and bet more to win it back.',
        p: 'Black came up 26 times in a row, the story says, and fortunes went with it. **The wheel had no idea what it had just done.** Each spin was a fresh one, with the same odds as the first.',
        dx: 'So they bet on red, and lost. Then they bet more on red, to win back what they had lost, because now red was even more due. Black came up 26 times in a row, the story says, and large sums of money went across the table. But one thing every one of them felt, none of them saw. **The wheel had no idea what it had just done.** It is a wooden wheel and a small ball. Each spin was a fresh one, with exactly the same odds as the first.',
        art: ['scene', { k: 'l52-red' }],
        fact: { s: 'Story · Monte Carlo, 1913, the gambler’s fallacy', i: [0] },
      },
      {
        k: 'ask',
        h: 'When you were down, what did you tell yourself you would do with a win?',
        o: [
          ['Stop, once I was even', 'Most people say that. Watch how often even was where they stopped.'],
          ['Pay off what I owed', 'The wish is real. A bet is the most expensive way to try.'],
          ['Win big enough to make it worth it', 'Then the goal kept moving. That is how chasing works.'],
          ['I did not think, I just bet', 'That is honest. The next cards are about that moment.'],
        ],
      },
      {
        h: 'Researchers call it the gambler’s fallacy.',
        p: 'It feels like a loss earns you a win, the way a long wait earns a bus. **The game keeps no account of what you lost.** Every bet starts from zero, with the house edge built in.',
        dx: 'The feeling those players had now has a name: the gambler’s fallacy. A loss feels like it earns you a win, the way a long wait earns you a bus, or a run of rain earns a sunny day. Your mind keeps a ledger: I am owed. But the game keeps no ledger. **The game keeps no account of what you lost.** The cards, the reels and the odds on the screen start from zero every time, with the house edge built in, and they will start from zero on the next bet too.',
      },
      {
        h: 'In 2009, a team in Cambridge watched what a near miss does in the brain.',
        p: 'Volunteers played a simple slot game. A near miss felt worse than a plain loss. **And yet it made them want to keep playing**, and lit up the same parts of the brain as a win.',
        dx: 'Luke Clark and his colleagues at the University of Cambridge built a simple slot game and had volunteers play it, some of them inside a brain scanner. Sometimes the reels lined up for a win. Sometimes they missed by miles. And sometimes they stopped just one place off: a near miss. The volunteers said the near misses felt worse than plain losses. **And yet it made them want to keep playing**, and in the scanner, a near miss lit up the same reward areas of the brain that a win does. A miss, dressed as almost.',
        art: ['scene', { k: 'l52-near-miss' }],
        fact: { s: 'Study · Clark and colleagues, 2009', i: [1] },
      },
      {
        long: 1,
        h: 'One classic study found how often an almost keeps people playing.',
        p: 'Players kept going longest when about 3 in 10 spins were near misses, more than after a big win. **A near miss is built to feel like nearly there.**',
        dx: 'In one classic study, researchers let people play a slot machine where they could stop whenever they liked, and changed how often the reels came up as near misses. When about 3 in every 10 spins were near misses, people kept playing longest, longer than with fewer, longer than with more, and longer than after a big win. **A near miss is built to feel like nearly there.** The game is telling you that you were close. You were exactly as far away as every other loss.',
        fact: { s: 'Study · Kassinove & Schare, 2001', i: [2] },
      },
      {
        h: 'After a loss, people bet more, and faster.',
        p: 'A review of research on chasing found losses push stakes up and speed betting up, more so in people with gambling problems. **The pull to get even is a known pattern of the brain, not a sign a win is coming.**',
        dx: 'Researchers who gathered the studies on loss chasing found the same pattern in the lab and in real betting records. After a loss, people tend to bet more, bet faster and take bigger risks, and this is stronger in people who struggle with gambling. It feels like a hunch, or like being on the edge of a turn. **The pull to get even is a known pattern of the brain, not a sign a win is coming.** It is the gambler’s fallacy with your money on it.',
        fact: { s: 'Review · Zhang & Clark, 2020', i: [3] },
      },
      {
        h: 'So call the money what it is: gone.',
        p: 'Not owed to you. Not waiting at the next spin. **Every chase is a new bet, at the same odds.** Stopping is the one move that keeps the rest.',
        dx: 'So say the hardest sentence plainly: that money is gone. It is not owed to you. It is not waiting for you at the next spin or the next match. **Every chase is a new bet, at the same odds**, and chasing is how one bad evening becomes many. Stopping does not get the money back. Nothing does. What stopping does is keep everything you still have, and that is the only win on the table.',
        art: ['scene', { k: 'l52-walk-away' }],
      },
      {
        long: 1,
        h: '“I will win it back” is a permission thought.',
        p: 'It sounds like a plan. It is the habit handing you a reason. **Catch it by name, and it loses much of its pull.**',
        dx: '“I will win it back” sounds like a plan. It even sounds responsible: you are trying to fix the hole. But look at what it asks you to do, which is bet again, right now, at the same odds that made the hole. It is the habit handing you a reason. **Catch it by name, and it loses much of its pull**: there it is, the chase. Then close the app, leave the room, and tell someone the true number.',
        back: 'l18',
      },
    ],
    mine: { h: 'Your busiest hours show when the chase is likely.', k: 'hour' },
    today: {
      h: 'Call the loss what it is, and stop the chase.',
      l: ['Say it: “That money is gone.”', 'Close the app, and leave the place', 'Tell one person the true number today'],
    },
    you: {
      h: 'What will you do the next time you feel you have to win it back?',
      o: [
        ['Say out loud: that money is gone', 'Out loud is stronger than in your head. The ledger closes.'],
        ['Close the app and walk away', 'Distance does what willpower cannot. Twenty steps is a lot.'],
        ['Call someone before I bet again', 'A voice on the line breaks the spell faster than anything.'],
        ['I do not know yet', 'Fair. Pick one now, while you are not in it.'],
      ],
    },
    scope:
      'The Monte Carlo story is told and retold more than it is recorded, and the near-miss studies were with volunteers, not people with gambling problems. The chasing review gathered lab and real-world studies. They point one sure way: the pull to win it back is a known pattern, and it can be caught and stopped.',
    src: [S3.fallacy, S3.clark09, S3.kassinove, S3.zhang],
  },

  l53: {
    id: 'l53',
    form: 'word',
    title: 'The money and the truth',
    ic: 'shield',
    ask: 'Do I have to tell anyone about the money?',
    key: 'A secret sets you apart. Tell one person the true number, and face it together.',
    np: 'The one person I will tell the true number to, and when',
    tell: [
      {
        h: 'The word secret comes from a Latin word that means to set apart.',
        p: 'A secret is not only something hidden. It is something that **sets you apart** from the people closest to you, behind a wall only you can see.',
        dx: 'Secret comes from the Latin secretus, set apart, from a verb that meant to separate or divide. So a secret is not only something hidden in a drawer. It is something that **sets you apart**. Every day you keep it, you live a little to one side of the people closest to you: at the same table, behind a wall only you can see, doing sums in your head they do not know about.',
        art: ['scene', { k: 'l53-apart' }],
      },
      {
        h: 'A gambling debt kept secret sets you apart twice.',
        p: 'From the people you hide it from, and from any help they could give. **It needs more secrets to stay hidden**, and more bets to cover them.',
        dx: 'A debt from gambling, kept secret, sets you apart twice over. From the people you hide it from, who cannot understand why you are tense or short with them. And from the help they could give, because nobody can help with a number they have never heard. Worse, the secret needs feeding. **It needs more secrets to stay hidden**: a story about the bills, a moved payment, a second account. And it needs more bets, to cover the gap before anyone sees it.',
        art: ['scene', { k: 'l53-twice' }],
      },
      {
        k: 'ask',
        h: 'If the people closest to you knew the whole number, what do you think would happen?',
        o: [
          ['They would leave', 'That fear is heavy. Many families stay, and telling is where help starts.'],
          ['They would be angry, then help', 'Anger and help often come together. Both can be lived through.'],
          ['They already suspect something', 'Then the secret may be costing more than the truth would.'],
          ['I do not know', 'That is honest. Hold it for the next cards.'],
        ],
      },
      {
        h: 'Doctors list hiding the gambling as one of the signs of the problem.',
        p: 'Lying about how much you gamble, and leaning on others to cover the losses. **The secret is not a side effect. It is one of the ways the habit keeps itself safe.**',
        dx: 'The main manual doctors use to name gambling problems lists lying to hide how much a person gambles as one of its signs, along with relying on others for money to cover the losses. That is worth sitting with. **The secret is not a side effect. It is one of the ways the habit keeps itself safe.** As long as nobody knows the number, nobody can stand between you and the next bet.',
        fact: { s: 'Manual · DSM-5, gambling disorder', i: [0] },
      },
      {
        h: 'Now a second word. Debt comes from the Latin for a thing owed.',
        p: 'A debt is a number, and a number has an end. It can be paid down, with a plan and with help. **A secret has no end, because it only grows.**',
        dx: 'Now look at a second word. Debt comes from the Latin debitum, a thing owed. That is all a debt is: a number, owed to someone. It can be large and frightening, but a number has an end. It can be written down, looked at, planned for and paid down over time, with help, and free debt advisers do exactly this every day. **A secret has no end, because it only grows.** Telling turns the secret back into a debt, and a debt is something people get out of.',
        art: ['scene', { k: 'l53-ledger' }],
      },
      {
        h: 'And confess comes from a word that means to acknowledge, fully.',
        p: 'Not to grovel, or to punish yourself. **To say plainly what is true**, to someone who can stand beside you while you face it.',
        dx: 'And a third word. Confess comes from the Latin confiteri, to acknowledge, to admit fully. It does not mean to grovel, or to punish yourself, or to hand yourself over for a sentence. It means **to say plainly what is true**: here is the whole number, here is how it happened. Said to the right person, it is the moment you stop standing apart and someone can stand beside you while you face it.',
        art: ['scene', { k: 'l53-tell' }],
        fact: { s: 'Etymology · secret, debt, confess', i: [1] },
      },
      {
        h: 'People who put a wall around the money gambled less.',
        p: 'In studies of self-exclusion, where people ask to be barred from betting, many gambled less and felt more in control. **A wall around the money works better than willpower at the edge of it.**',
        dx: 'Telling one person also makes something else possible: a wall around the money. A review of self-exclusion, where people ask casinos or betting sites to bar them, found that many who signed up gambled less, felt more in control and had fewer problems afterward. Shared control of a card or an account works the same way. **A wall around the money works better than willpower at the edge of it**, and you cannot build that wall alone in secret.',
        fact: { s: 'Review · Gainsbury, 2014', i: [2] },
      },
      {
        h: 'So tell one person the true number, and share the keys.',
        p: 'The whole total, not the easy half. Let them hold a card or see the account, and call a free debt adviser. **The day you tell is the day the number stops growing in the dark.**',
        dx: 'So pick one person and tell them the true number. The whole total, not the easy half, because half the truth keeps half the secret. Let them hold a card, or see the account, or be the second name on it. Call a free debt adviser this week: the gambling helpline in Get help can point you to one, and they hear this every day. **The day you tell is the day the number stops growing in the dark.** It may still be big. It is no longer yours alone.',
        art: ['scene', { k: 'l53-keys' }],
      },
      {
        long: 1,
        h: 'Leave out anyone who would use it to hurt you.',
        p: 'If telling might not be safe, start with a counselor or the gambling helpline in Get help. **They hear this every day, and they will help you plan.**',
        dx: 'Not everyone is safe to tell. If someone would use the number to hurt you, or if telling could bring danger at home, start somewhere else: a counselor, a doctor, or the gambling helpline in Get help. **They hear this every day, and they will help you plan** who to tell, how, and what to do about the money first. You still get to stop standing apart. You just start with someone whose job is to stand beside you.',
      },
    ],
    mine: { h: 'Look at what you have already done.', k: 'acted' },
    today: {
      h: 'Tell one person the true number, and share the keys.',
      l: ['Tell one person the full total', 'Let them hold a card or see the account', 'Call a free debt adviser this week'],
    },
    you: {
      h: 'Who is the one person you could tell the true number to?',
      o: [
        ['My partner', 'Then plan the words, and pick a calm moment. The whole number, once.'],
        ['A family member', 'Family often carries more than we expect. Let them carry some of this.'],
        ['A friend I trust', 'One friend who knows can check in, and help you hold the keys.'],
        ['A counselor or helpline first', 'A strong first step. They will help you plan the rest.'],
      ],
    },
    scope:
      'Where a word comes from does not decide what it means today. Here secret, debt and confess are a way to see the money more clearly. The manual describes what doctors look for, and the self-exclusion review gathered studies of people who chose to bar themselves. Together they point one hopeful way: the truth and a wall around the money help people get free.',
    src: [S3.dsm, S3.words, N.gainsbury14],
  },
};
