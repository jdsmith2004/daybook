/* Lessons told as a story, batch F (the shape is in lesson-stories.ts, the standard in docs/lessons.md, the remap brief in the
   side-session notes, lesson-remap-brief.md). Written November 14, 2026 by the lessons-45 session: l45 to l49 first (the Sirens, the
   desert after Egypt, the partner and the truth, the watcher in the room, the cigarette on the desk), then l54 to l58, then the
   lessons of one habit, l50 to l53. No lesson here asks a person to guess a fact they cannot know, and none puts a clock time on
   everyone. l47 and l48 are frank and kind, and never explicit. */
import type { Story, StoryPart } from './lesson-stories';

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
};
