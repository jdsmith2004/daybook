/* Lessons told as a story, batch C (the shape is in lesson-stories.ts, the standard in docs/lessons.md, the remap brief in the
   side-session notes, lesson-remap-brief.md): lessons 12 to 21. Written November 14, 2026. No lesson here asks a person to guess a
   fact they cannot know, and none puts a clock time on everyone. Every story card has its Deep telling (dx). */
import type { Story } from './lesson-stories';

type Src = [string, string];
const S = {
  matthew: ['The parable of the workers in the vineyard, Matthew 20:1 to 16 (King James text, public domain)', 'https://www.gutenberg.org/ebooks/10'],
  holland: [
    'Holland (2012): “The Laborers in the Vineyard,” a talk retelling the parable',
    'https://www.churchofjesuschrist.org/study/general-conference/2012/04/the-laborers-in-the-vineyard',
  ],
  mclellan: ['McLellan, Lewis, O’Brien & Kleber (2000): drug dependence, a chronic medical illness, JAMA', 'https://pubmed.ncbi.nlm.nih.gov/11015800/'],
  lieberman: [
    'Lieberman and colleagues (2007): putting feelings into words, affect labeling disrupts amygdala activity, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/17576282/',
  ],
  lieberman11: [
    'Lieberman, Inagaki, Tabibnia & Crockett (2011): subjective responses to emotional stimuli during labeling, reappraisal, and distraction, Emotion',
    'https://doi.org/10.1037/a0023503',
  ],
  kircanski: [
    'Kircanski, Lieberman & Craske (2012): feelings into words, contributions of language to exposure therapy, Psychological Science',
    'https://doi.org/10.1177/0956797612443830',
  ],
  kashdan: [
    'Kashdan, Ferssizidis, Collins & Muraven (2010): emotion differentiation as resilience against excessive alcohol use, Psychological Science',
    'https://pubmed.ncbi.nlm.nih.gov/20696854/',
  ],
  yasuma: ['Yasuma & Hayano (2004): respiratory sinus arrhythmia, why the heartbeat follows the breath, Chest', 'https://doi.org/10.1378/chest.125.2.683'],
  balban: [
    'Balban and colleagues (2023): brief structured respiration practices enhance mood and reduce physiological arousal, Cell Reports Medicine',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947',
  ],
  taylor: [
    'Taylor & Oliver (2009): acute effects of brisk walking on urges to eat chocolate, Appetite',
    'https://researchportal.plymouth.ac.uk/en/publications/acute-effects-of-brisk-walking-on-urges-to-eat-chocolate-affect-a/',
  ],
  haasova: [
    'Haasova and colleagues (2013): the acute effects of physical activity on cigarette cravings, a meta-analysis, Addiction',
    'https://doi.org/10.1111/j.1360-0443.2012.04034.x',
  ],
} satisfies Record<string, Src>;

export const STORIES_C: Record<string, Story> = {
  l12: {
    id: 'l12',
    form: 'tale',
    title: 'What getting better looks like',
    ic: 'sunrise',
    ask: 'What does getting better look like?',
    key: 'A hard hour is not the whole day. What counts is still being in the field at evening.',
    np: 'The hard hour I will not let take the evening',
    tell: [
      {
        h: 'There is an old story about a man who owned a vineyard.',
        p: 'At first light he went to the market square and hired workers for the harvest. They agreed on the pay: **one silver coin** for the whole day.',
        dx: 'The story is nearly two thousand years old, and it is one of the strangest anyone tells. At first light, a man who owned a vineyard went down to the market square, where people stood waiting to be hired. He found workers for the harvest and agreed with them on the pay: **one silver coin** for the whole day, the usual wage for a day in the fields. They went out to his vines while the air was still cool.',
        art: ['scene', { k: 'l12-dawn-hire' }],
      },
      {
        h: 'Through the day, he kept going back.',
        p: 'Mid-morning, at noon and in the afternoon, he hired more. Then, with **one hour of light left**, he found people still standing in the square.',
        dx: 'Mid-morning he went back to the square, found more people standing there with nothing to do, and sent them out too, promising to pay what was right. He went back at noon, and again in the afternoon, and each time he hired more. Then, with **one hour of light left**, he found people still standing there. “Why have you stood here all day?” he asked. “Because nobody hired us,” they said. So he sent them into the vineyard as well, for the last hour.',
        art: ['scene', { k: 'l12-sun-hours' }],
      },
      {
        h: 'At evening, the pay began with the last ones hired.',
        p: 'They had worked one hour, in the cool of the day. Each of them was handed **a full day’s coin**.',
        dx: 'When evening came, the owner told his steward to call the workers in and pay them, starting with the last ones hired and ending with the first. The ones who had come at the last hour stepped up first. They had worked one hour, in the cool of the evening, and each of them was handed **a full day’s coin**, the same wage the first workers had agreed to for the whole day. Picture their faces on the walk home.',
        art: ['scene', { k: 'l12-coin-last' }],
        fact: { s: 'Story · the workers in the vineyard, Matthew 20', i: [0] },
      },
      {
        k: 'ask',
        h: 'Say you had worked since first light. What would you feel, watching that?',
        o: [
          ['That it is not fair', 'That is what the first workers felt. Look at what they said.'],
          ['Glad for them', 'That is rare. The story is about why it is worth learning.'],
          ['That I should get more', 'So did they. Look at what they got.'],
          ['I am not sure', 'Fair. Watch what the first workers did with it.'],
        ],
      },
      {
        h: 'The ones who came at first light grumbled.',
        p: 'They had carried the heat of the whole day, and they got one coin, what they agreed. **Nobody had cheated them.** What stung was looking over at someone else’s pay.',
        dx: 'Then the ones who had come at first light stepped up, sure they would get more. They got one coin, the wage they had agreed to. They grumbled: these last ones worked one hour, and you made them equal to us, who carried the weight of the day and the heat. The owner answered one of them kindly. **Nobody had cheated them.** “Did you not agree to one coin? Take what is yours and go. Are you bitter because I am generous?” What stung was never their own pay. It was looking over at someone else’s.',
        art: ['scene', { k: 'l12-grumble' }],
      },
      {
        long: 1,
        h: 'A teacher who retold this story pictured one more worker.',
        p: 'All afternoon he stews over something that went wrong early. At evening, he throws the coin down and **walks off with nothing**.',
        dx: 'A teacher who retold this story many years later pictured one more worker. Something went wrong for him early in the day: a sharp word, a mistake, a bad start. He spends the whole afternoon going over it. When evening comes and the coin is put in his hand, he is so full of the morning that he throws it down and **walks off with nothing**. The teacher’s point was plain: do not lose the evening over what went wrong in the morning.',
        art: ['scene', { k: 'l12-walk-off' }],
      },
      {
        h: 'Read it for a habit, and look at what counted.',
        p: 'Not the hour each one started, and not how the morning went. The pay went to whoever was **still in the field at evening**.',
        dx: 'This story is usually read as one about fairness, or about generosity. Read it for a habit, and look at what counted in the end. It was not the hour each worker started. It was not how the morning went, or how much each one had carried. The pay went to whoever was **still in the field at evening**. The only worker who lost the day was the one who walked off.',
        art: ['scene', { k: 'l12-evening-field' }],
      },
      {
        h: 'Getting better looks like that.',
        p: 'Not a line that only climbs, but staying in the field. A slip, a bad week or a hard morning is **an hour, not the day**.',
        dx: 'Most people picture getting better as a line that only climbs, so the first setback makes the whole line feel false. Getting better looks more like that vineyard. There are hot hours and hard ones. There are mornings that go wrong. A slip, a bad week or a hard morning is **an hour, not the day**, and the day is not over while you are still in the field.',
        art: ['path', {}],
      },
      {
        long: 1,
        h: 'Doctors judge long illnesses the same way.',
        p: 'A review in a medical journal set drug habits beside asthma, diabetes and high blood pressure. People slipped back about as often in each. **Nobody calls asthma care a failure** after one bad week.',
        dx: 'In 2000, a review in a major medical journal set drug dependence beside three long-lasting illnesses: asthma, type 2 diabetes and high blood pressure. People slipped back, and stopped following their care, about as often in each of them. **Nobody calls asthma care a failure** after one bad week. Doctors judge the direction over months: fewer flares, milder ones, a quicker way back. The authors argued that a habit deserves the same fair test.',
        art: ['scene', { k: 'l12-trend' }],
        fact: { s: 'Review · McLellan and colleagues, JAMA, 2000', i: [2] },
      },
      {
        long: 1,
        h: 'And the ones who came at the last hour?',
        p: 'However late you came to this, and however many times you walked off before, the evening is still ahead. **It is not too late to walk in.**',
        dx: 'The ones hired at the last hour are in the story for a reason. They had stood in the square all day, and nobody had picked them. They could have decided it was too late to bother. They went anyway, for one hour, and were paid for the whole day. However late you came to this, and however many times you walked off before, the evening is still ahead. **It is not too late to walk in.**',
        art: ['scene', { k: 'l12-last-hour' }],
      },
    ],
    mine: { h: 'Every time you came back, you were back in the field.', k: 'back' },
    today: {
      h: 'Stay in the field today.',
      l: ['Think of one hard hour from this week', 'Call it what it was: an hour, not the day', 'Do one thing from your plan anyway'],
    },
    you: {
      h: 'What makes you most want to walk off the field?',
      o: [
        ['A slip after a good stretch', 'That is the hour that feels like the day. It is still an hour.'],
        ['Seeing others further along', 'Their pay does not come out of yours. Look at your own field.'],
        ['Feeling I started too late', 'The last ones hired got the whole day. Late is not out.'],
        ['A bad morning that colors the rest', 'Then the evening is the part to protect. It is still ahead.'],
      ],
    },
    scope:
      'The vineyard is a parable, not a study, and the review set drug dependence beside long-lasting illnesses, not porn. Together they point one hopeful way: getting better is judged by where you are heading and whether you stay, and a hard hour belongs in the picture.',
    src: [S.matthew, S.holland, S.mclellan],
  },

  l13: {
    id: 'l13',
    form: 'study',
    title: 'Name the feeling',
    ic: 'pencil',
    ask: 'What is going on underneath an urge?',
    key: '“Bad” gives you nothing to do but the habit. The exact word points at what you need.',
    np: 'The feeling I most often call just “bad”',
    tell: [
      {
        h: 'In 2007, a brain lab in Los Angeles showed people photographs of faces.',
        p: 'Angry faces and frightened faces, one after another, while each person lay in a scanner. Under every face were **two words to choose from**.',
        dx: 'In 2007, a team at a university in Los Angeles, led by a psychologist named Matthew Lieberman, wanted to know what a word does to a feeling. Thirty people lay in a brain scanner, one at a time, and looked at photographs of faces: angry ones and frightened ones, one after another. Faces like that set off a small alarm in anyone who sees them. Under every face were **two words to choose from**, and the person pressed a button for one.',
        art: ['scene', { k: 'l12-face-words' }],
      },
      {
        h: 'Sometimes the two words were names. Sometimes they were feelings.',
        p: 'Under an angry face might be Harry and Sally, or angry and scared. Same faces, same people. **The only change was the kind of word.**',
        dx: 'On some turns the two words were names, like Harry and Sally, and the person picked the name that fit the face. On other turns the two words were feelings, like angry and scared, and the person picked the feeling the face was showing. The faces were the same. The people were the same. **The only change was the kind of word.** The scanner watched what happened in the brain each time.',
        art: ['scene', { k: 'l12-names-feelings' }],
      },
      {
        k: 'ask',
        h: 'Think of the last time you felt off before an urge. Did you have a word for it?',
        o: [
          ['Yes, I knew what it was', 'Then you already have the skill. Look at what it does in the brain.'],
          ['Just bad, or off', 'That is the most common answer. Look at what a word changed.'],
          ['I did not stop to ask', 'Few people do. That is the moment this lesson is about.'],
          ['I am not sure', 'Fair. Next time, look for one.'],
        ],
      },
      {
        h: 'When they named the feeling, the brain’s alarm quieted.',
        p: 'The amygdala, the part that sounds the alarm, **calmed down** when the word was a feeling. A part at the front of the brain, the part that thinks things over, grew busier.',
        dx: 'When the word was a name, the alarm in the brain fired much as it did when people only looked. When the word was a feeling, the amygdala, the small part deep in the brain that sounds the alarm, **calmed down**. At the same moment, a part at the front of the brain, the part that thinks things over, grew busier. The more that front part worked, the quieter the alarm. Picking one plain word had handed the moment to the part of the brain that decides.',
        art: ['scene', { k: 'l12-alarm-quiet' }],
        fact: { s: 'Study · Lieberman and colleagues, 2007', i: [0] },
      },
      {
        long: 1,
        h: 'The strange part: people did not expect it to help.',
        p: 'In a later study, people were asked what naming a feeling would do. Most thought it would do little, or make it worse. It **helped anyway**.',
        dx: 'The same lab found something stranger a few years later. People were asked ahead of time what would calm them most while they looked at upsetting pictures: seeing the picture a new way, thinking of something else, or putting the feeling into words. Most expected naming the feeling to do little, and many thought it would make them feel worse. Then they tried it. Naming the feeling **helped anyway**. A word works whether you believe in it or not.',
        art: ['scene', { k: 'l12-surprise' }],
        fact: { s: 'Study · Lieberman and colleagues, 2011', i: [1] },
      },
      {
        long: 1,
        h: 'Then a team tried it with people afraid of spiders.',
        p: 'A tarantula sat in an open box. Some people put their fear in plain words: I am scared of this hairy spider. A week later, near the same spider, **their bodies stayed calmer**.',
        dx: 'In 2012, the same group, working with researchers who treat fear, tried it with 88 people who were afraid of spiders. A live tarantula sat in an open box, and each person was asked to come as close as they could. Some put what they felt in plain words: “I am scared of this ugly, hairy spider.” Some tried to talk themselves into a calmer view of it, and some tried to think of something else. A week later, near the same spider, the ones who had named their fear sweated less and **their bodies stayed calmer**.',
        art: ['scene', { k: 'l12-spider-box' }],
        fact: { s: 'Study · Kircanski, Lieberman & Craske, 2012', i: [2] },
      },
      {
        h: 'Most urges ride in on a feeling with no name.',
        p: 'It is a fog called bad, or off. A fog gives you nothing to do, and **the habit is always there** to clear it for a while.',
        dx: 'Most urges ride in on a feeling, and most of the time that feeling has no name. It is a fog called bad, or off, or I do not know. A fog cannot be fixed, because nothing in it says what is wrong. So you reach for whatever clears any fog for a while, and **the habit is always there** to do it. Then the fog comes back, because nothing under it was met.',
        art: ['scene', { k: 'l12-fog' }],
      },
      {
        h: 'A name turns the fog into a need.',
        p: 'Lonely asks for a person. Worn out asks for rest. Stressed asks for a way to let it out. **None of them is asking for the habit.**',
        dx: 'Put a sharp word on the fog, and the question changes from “how do I make this stop” to “what is this asking for.” Lonely asks for a person, even one message. Worn out asks for rest. Stressed asks for a way to let it out: a walk, a shower, a hard run. Stung asks to be said out loud to someone. **None of them is asking for the habit.** The habit was only ever the nearest thing in reach.',
        art: ['scene', { k: 'l12-signposts' }],
      },
      {
        long: 1,
        h: 'Young drinkers with sharp words for bad moods drank less.',
        p: 'For three weeks, 106 of them logged their feelings and their drinking. On their worst days, the ones who could tell anger from sadness from shame **held back more**.',
        dx: 'In 2010, researchers gave 106 young social drinkers handheld computers for three weeks. Several times a day the drinkers logged how they felt and how much they drank. Some described their bad moods in sharp, separate words: angry, ashamed, sad, nervous. Others lumped everything together as bad. On their hardest days, the ones with sharp words **held back more**. They drank less than the others did on days just as bad.',
        art: ['scene', { k: 'l12-mood-log' }],
        fact: { s: 'Study · 106 young drinkers · Kashdan and colleagues, 2010', i: [3] },
      },
    ],
    mine: { h: 'Here are the reasons you have named so far.', k: 'trigger' },
    today: {
      h: 'Name the feeling under the next urge.',
      l: ['Say it: “I notice I feel ___.”', 'If the word is bad, find a sharper one', 'Ask what that feeling is asking for'],
    },
    you: {
      h: 'Which feeling do you most often call just “bad”?',
      o: [
        ['Lonely', 'Then a person is the need. One message starts to meet it.'],
        ['Tired or empty', 'Then rest is the need, and it costs nothing.'],
        ['Stressed or wound up', 'Then let it out another way: a walk, a shower, a run.'],
        ['Ashamed or stung', 'Then say it to someone you trust. Said out loud, it weighs less.'],
      ],
    },
    scope:
      'The scanner studies used faces and pictures, the spider study used fear, and the drinking study found a link, not a cause. Together they point one hopeful way: an exact word for a feeling calms the body and shows you what you need.',
    src: [S.lieberman, S.lieberman11, S.kircanski, S.kashdan],
    hab: { alcohol: 'say', gambling: 'say' },
  },

  l14: {
    id: 'l14',
    form: 'works',
    title: 'A longer breath out',
    ic: 'wind',
    ask: 'Is there a quick way to calm my body when an urge hits?',
    key: 'Your heart slows every time you breathe out. A long breath out is a brake you always carry.',
    np: 'When I will practice a long breath out',
    tell: [
      {
        h: 'Put two fingers on your wrist, or the side of your neck.',
        p: 'Find your pulse. Breathe in slowly, then out slowly, a few times, and **feel the beats** before you go on.',
        dx: 'Before anything else, try this. Put two fingers on the inside of your wrist, below the thumb, or on the side of your neck under the jaw, and find your pulse. Sit still. Breathe in slowly through your nose, then out slowly, three or four times, and **feel the beats** as you go. Take your time. The rest of this lesson is about what you just felt.',
        art: ['scene', { k: 'l12-pulse' }],
      },
      {
        k: 'ask',
        h: 'What did you notice about the beats?',
        o: [
          ['They sped up as I breathed in', 'That is it. Look at the other half.'],
          ['They slowed as I breathed out', 'That is the half this lesson is about.'],
          ['I could not tell', 'It is small and easy to miss. The next card shows it.'],
          ['I did not try it', 'Fair. Try it once now, then go on.'],
        ],
      },
      {
        h: 'Your heart speeds up a little on every breath in, and slows on every breath out.',
        p: 'Every healthy body does it, all day. Doctors call it respiratory sinus arrhythmia, a long name for **a rhythm you have had all your life**.',
        dx: 'Your heart does not beat like a clock. On every breath in, the beats come a little closer together. On every breath out, they spread apart again. Every healthy body does it, from babies to old age, all day and all night, and it is usually strongest in people who are rested and well. Doctors call it respiratory sinus arrhythmia, a long name for **a rhythm you have had all your life** without knowing.',
        art: ['scene', { k: 'l12-beats' }],
        fact: { s: 'Review · Yasuma & Hayano, 2004', i: [0] },
      },
      {
        h: 'The breath out is when the brake goes on.',
        p: 'A long nerve called the vagus runs from the brain to the heart. On the breath out, it **presses the brake** on the heart. On the breath in, it lets go a little.',
        dx: 'A long nerve runs from the base of the brain down to the heart and the gut, called the vagus nerve. One of its jobs is to slow the heart. On the breath in, it lets go a little, and the heart speeds up. On the breath out, it **presses the brake**, and the heart slows. It happens on its own, breath after breath. Most people go their whole lives without knowing they touch a brake every time they breathe out.',
        art: ['scene', { k: 'l12-vagus' }],
      },
      {
        h: 'Most of your body runs on its own. The breath is the part with a handle.',
        p: 'You cannot tell your heart to slow down. You can make the breath out longer than the breath in, and **the brake stays on longer**.',
        dx: 'Your heart, your gut and the sweat on your hands all run on their own. You cannot order any of them to calm down, and trying often makes it worse. The breath is different. It runs on its own too, but you can take hold of it whenever you choose. So you cannot tell your heart to slow down, but you can make the breath out longer than the breath in, and **the brake stays on longer**.',
        art: ['scene', { k: 'l12-handle' }],
      },
      {
        long: 1,
        n: '5',
        h: 'minutes a day of long breaths out lifted mood more than quiet meditation did.',
        p: 'For a month, 108 adults practiced one of three ways of breathing, or sat in mindful quiet. All of it helped. **The long sigh did best.**',
        dx: 'In 2023, researchers at Stanford asked 108 adults to spend 5 minutes a day, for a month, on one of four practices. Some practiced one of three kinds of controlled breathing, and some sat in mindful quiet, noticing the breath without changing it. All four helped. The biggest lift in mood, day after day, came from what the researchers called cyclic sighing: a breath in through the nose, a small second sip of air on top, then a long, slow breath out through the mouth. **The long sigh did best.**',
        fact: { s: 'Study · 108 adults · Balban and colleagues, 2023', i: [1] },
      },
      {
        long: 1,
        h: 'You already sigh like this, many times a day.',
        p: 'The body sighs on its own every few minutes: a deeper breath in and a long breath out. **The long sigh is a sigh on purpose.**',
        dx: 'If the long sigh sounds strange, listen to yourself for a day. The body sighs on its own every few minutes, without asking you: a deeper breath in, often with a little second sip on top, and a long breath out. People sigh more when they are tired, stressed or relieved. **The long sigh is a sigh on purpose**, taken when you need it, instead of waiting for the body to get round to it.',
        art: ['scene', { k: 'l12-sigh' }],
      },
      {
        h: 'An urge is partly a body event.',
        p: 'A fast heart, a tight chest, a restless feeling. A long breath out does not argue with the urge. It **turns the body’s volume down** while you decide.',
        dx: 'An urge is not only a thought. It comes with a body: a heart that speeds up, a chest that tightens, a restless, buzzing feeling that wants something done now. That body is what makes the urge feel urgent. A long breath out does not argue with the urge, and it does not make it vanish. It **turns the body’s volume down**, so the urge is quieter while it rises and falls and you decide what to do.',
        art: ['scene', { k: 'l12-volume' }],
        back: 'l2',
      },
      {
        h: 'So practice it while it is quiet.',
        p: 'A brake you have never touched is hard to find in a skid. A minute on a calm day **puts it under your foot** for the hard one.',
        dx: 'A driver learning to stop in a skid practices in an empty parking lot first, not on an icy road at speed. A brake you have never touched is hard to find in a skid. The same is true here. A minute of long breaths out on a calm day, while nothing is pulling at you, **puts it under your foot** for the hard one. Then, when the pull comes, your body already knows where the brake is.',
        art: ['scene', { k: 'l12-practice' }],
      },
    ],
    mine: { h: 'Here are the hours to practice for.', k: 'hour' },
    today: {
      h: 'Find the brake once today, while it is quiet.',
      l: ['In through the nose, then sip a little more', 'Out slowly through the mouth, longer', 'A minute of it. If you feel dizzy, stop'],
    },
    you: {
      h: 'Where does your body wind up first when the pull starts?',
      o: [
        ['My heart speeds up', 'Then the long breath out is aimed right at it.'],
        ['My chest gets tight', 'A long, slow breath out loosens it from the inside.'],
        ['My legs or hands get restless', 'Breathe first, then give the restlessness a walk.'],
        ['I have not noticed yet', 'Next time, check before anything else. Your body will tell you.'],
      ],
    },
    scope:
      'The heart slowing on the breath out is well-known body science. The breathing study was with healthy adults and measured mood, not urges. A long breath out does not make an urge vanish. It settles the body while the urge rises and falls, and that is a real help you always carry.',
    src: [S.yasuma, S.balban],
  },

  l15: {
    id: 'l15',
    form: 'works',
    title: 'Move your body',
    ic: 'bolt',
    ask: 'Can moving my body really help with an urge?',
    key: 'A craving lives in the body too. Change what the body is doing, and the pull drops.',
    np: 'The movement I could do in one minute',
    tell: [
      {
        h: 'In 2009, researchers in England asked chocolate lovers to give up chocolate for three days.',
        p: 'Then each one came to the lab twice. Once they sat quietly for fifteen minutes. Once they took **a brisk fifteen-minute walk**.',
        dx: 'In 2009, two researchers in the south of England, Adrian Taylor and Katharine Oliver, found 25 people who ate chocolate nearly every day and asked them to go without it for three days. By the end, they wanted it badly. Then each one came into the lab twice, on different days. On one visit, they sat quietly for fifteen minutes. On the other, they took **a brisk fifteen-minute walk** on a treadmill.',
        art: ['scene', { k: 'l12-choc-walk' }],
      },
      {
        h: 'Afterward, each of them was handed a chocolate bar to unwrap.',
        p: 'They had to open it and hold it, with the smell in the room. **The test was the urge**, with the thing it wanted right in their hands.',
        dx: 'After each visit, the researchers handed them a chocolate bar and asked them to unwrap it and hold it. They did not eat it. They sat with it open in their hands, the smell in the room, and said how badly they wanted it. **The test was the urge**, at its strongest, with the thing it wanted right there. It is about as close to a hard moment as a lab can get.',
        art: ['scene', { k: 'l12-unwrap' }],
      },
      {
        k: 'ask',
        h: 'When an urge builds, where do you feel it first?',
        o: [
          ['In my head, as pictures', 'Pictures start there. The body joins fast, and the body is easier to move.'],
          ['Restless, in my legs or hands', 'That restlessness is energy looking for a job. Look at what the walk did.'],
          ['Tight, in my chest or stomach', 'That is a body state. Look at what changes a body state.'],
          ['I do not know yet', 'Check next time. Where it sits shows where to start.'],
        ],
      },
      {
        h: 'After the walk, the urge was lower.',
        p: 'Even with the bar open in their hands, **it did not climb as high** as after sitting still. Same people, same chocolate. Their bodies had done something different.',
        dx: 'After the walk, the people wanted chocolate less than after sitting. The bigger surprise came with the bar. After sitting, unwrapping it sent the urge up. After the walk, even with the bar open in their hands, **it did not climb as high**. They were the same people, after the same three days without, holding the same chocolate. The only difference was what their bodies had been doing for fifteen minutes.',
        art: ['scene', { k: 'l12-two-gauges' }],
        fact: { s: 'Study · 25 chocolate eaters · Taylor & Oliver, 2009', i: [0] },
      },
      {
        long: 1,
        h: 'Trials with smokers going without found the same.',
        p: 'Researchers pooled studies of people who had gone a while without a cigarette. A short bout of activity, like a walk, **eased their cravings**. Nobody needed a hard workout.',
        dx: 'In 2013, a team pooled the studies they could find on smokers who had gone a while without a cigarette and were then asked to move: a walk, a few minutes on an exercise bike, sometimes only tensing their muscles in a chair. Again and again, a short bout of activity **eased their cravings**, compared with sitting still, and the easing lasted a while after. Nobody needed a hard workout. Moderate movement, the kind you can do in ordinary clothes, was enough.',
        art: ['scene', { k: 'l12-smoker-walk' }],
        fact: { s: 'Review · Haasova and colleagues, 2013', i: [1] },
      },
      {
        h: 'An urge is not only in your head.',
        p: 'It is a heart rate, a restlessness in the legs, a tightness in the chest. Those are **body states**, and moving is the quickest way to change one.',
        dx: 'We talk about urges as if they were only thoughts, a fight between what you want and what you know. But an urge is also a heart rate, a restlessness in the legs, a tightness in the chest or the stomach, a buzzing that wants something done. Those are **body states**. A body that stays still and slumped keeps them the way they are. A body that stands up and moves changes them, and the urge loses part of what it stands on.',
        art: ['scene', { k: 'l12-body-spots' }],
      },
      {
        h: 'Your legs do not have to agree with the urge to walk out of the room.',
        p: 'Arguing keeps the whole fight in your head, where the urge is loudest. Standing up **moves the fight** somewhere you can win it.',
        dx: 'When the pull builds, most people stay where they are and argue with it: thoughts against thoughts, in the same chair, in front of the same screen. That keeps the whole fight in your head, where the urge is loudest and you are most tired. Your legs do not need to win that argument. They do not even need to agree. Standing up and walking out of the room **moves the fight** somewhere you can win it, one step at a time.',
        art: ['scene', { k: 'l12-stand-up' }],
      },
      {
        long: 1,
        h: 'A walk also changes the setting.',
        p: 'It takes you out of the room where the habit lives. For ten minutes you leave the chair, the screen and the hour behind, **the way the soldiers left a country behind**.',
        dx: 'A walk does a second thing. It takes you out of the room where the habit lives. The chair, the screen, the corner and the hour are all part of the pull, as the lesson on changing the setting showed. For ten minutes, a walk leaves every one of them behind, **the way the soldiers left a country behind**. When you come back, the room is the same, but the moment usually is not.',
        art: ['scene', { k: 'l12-door-out' }],
        back: 'l10',
      },
      {
        h: 'So give the restlessness a job.',
        p: 'Stand up and walk out. Ten squats, the stairs, a lap outside. Then decide, with **the pull lower**.',
        dx: 'So when the pull starts, give the restlessness a job before you argue with anything. Stand up and walk out of the room. Do ten squats, take the stairs, walk once round the block, or splash cold water on your face. None of it has to be hard. Then decide what to do, with **the pull lower** and your body on your side.',
        art: ['scene', { k: 'l12-squats' }],
      },
    ],
    mine: { h: 'Here is when a move is worth having ready.', k: 'hour' },
    today: {
      h: 'Pick your one-minute move today.',
      l: ['Choose one: a walk, squats or the stairs', 'Try it once today, while it is quiet', 'Use it the next time the pull builds'],
    },
    you: {
      h: 'Wherever the pull usually finds you, what could your body do in one minute?',
      o: [
        ['Walk out of the room', 'The plainest one, and it changes the setting too.'],
        ['Ten squats or push-ups', 'Hard enough to change a heart rate, short enough to do worn down.'],
        ['The stairs, or a lap outside', 'Fresh air changes the body and the room at once.'],
        ['Cold water on my face', 'A quick jolt that resets the body. Then walk.'],
      ],
    },
    scope:
      'The walking study was about chocolate, and the review about cigarettes, not porn. Both found that short bouts of activity eased cravings for a while. The pattern carries over well: moving the body is one more sure way to let an urge pass.',
    src: [S.taylor, S.haasova],
  },
};
